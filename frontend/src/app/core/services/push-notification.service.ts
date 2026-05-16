import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken, onMessage, Messaging, MessagePayload } from 'firebase/messaging';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly swPath = '/sw.js';
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;

  /** Emits whenever a foreground FCM message arrives (app is open). */
  readonly foregroundMessage$ = new Subject<MessagePayload>();

  constructor(private http: HttpClient) {}

  /**
   * Call this from a user gesture (button click) for iOS Safari support.
   * On other platforms, init() handles it automatically.
   */
  async requestFromUserGesture(): Promise<void> {
    if (!this.isSupported()) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') await this.init();
  }

  /**
   * Register the service worker, initialize Firebase Messaging,
   * get an FCM token and save it to the server.
   * Call this after login for adviser users and on app startup.
   */
  async init(): Promise<void> {
    if (!this.isSupported()) {
      console.info('PushNotifications: not supported in this browser.');
      return;
    }

    try {
      // Register service worker
      const reg = await this.getOrRegisterSW();
      if (!reg) return;

      // Ask for permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.info('PushNotifications: permission not granted.');
        return;
      }

      // Initialize Firebase
      this.initFirebase();
      if (!this.messaging) return;

      const vapidKey = environment.firebase?.vapidKey;
      if (!vapidKey) {
        console.warn('PushNotifications: Firebase VAPID key not configured.');
        return;
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration: reg,
      });

      if (!token) {
        console.warn('PushNotifications: No FCM token received.');
        return;
      }

      await this.saveTokenToServer(token);
      console.info('PushNotifications: FCM token saved successfully.');

      // Listen for foreground messages (app is open/focused).
      // The SW onBackgroundMessage only fires when the app is in the background.
      // Without this handler, Android Chrome silently drops foreground FCM messages.
      this.listenForeground();
    } catch (err) {
      console.warn('PushNotifications: init failed.', err);
    }
  }

  /**
   * Delete the FCM token and remove it from the server on logout.
   */
  async unsubscribeAll(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      this.initFirebase();
      if (!this.messaging) return;

      const vapidKey = environment.firebase?.vapidKey;
      const reg = await navigator.serviceWorker.getRegistration(this.swPath);
      if (!reg) return;

      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration: reg,
      }).catch(() => null);

      if (token) {
        await this.removeTokenFromServer(token);
        await deleteToken(this.messaging);
      }

      console.info('PushNotifications: unsubscribed.');
    } catch (err) {
      console.warn('PushNotifications: unsubscribe failed.', err);
    }
  }

  //  Private helpers 

  /**
   * Register a foreground message listener.
   * When the app is open, FCM bypasses the service worker and delivers here.
   * We manually show a Notification so the user still sees it on Android/iOS.
   */
  private listenForeground(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.info('PushNotifications: foreground message received.', payload);

      // Emit for any component that wants to react (e.g. refresh notification list)
      this.foregroundMessage$.next(payload);

      // Show a native notification so Android/iOS users see it even when app is open
      if (Notification.permission === 'granted') {
        const data   = (payload.data   || {}) as Record<string, string>;
        const notif  = payload.notification || {};
        const title  = notif.title || data['title'] || 'Studentcare';
        const body   = notif.body  || data['body']  || '';
        const icon   = data['icon']  || notif.icon  || '/assets/icons/school-clinic.png';
        const badge  = data['badge'] || '/assets/icons/notification.png';
        const image  = data['image'] || (notif as any).image || undefined;
        const tag    = data['tag']   || 'studentcare-notification';
        const url    = data['url']   || '/adviser/alerts';
        const isEmergency = data['requireInteraction'] === 'true';
        const timestamp = data['timestamp'] ? parseInt(data['timestamp'], 10) : Date.now();

        navigator.serviceWorker.ready.then((reg) => {
          const options: NotificationOptions = {
            body,
            icon,
            badge,
            tag,
            data:               { url },
            requireInteraction: isEmergency,
            vibrate:            isEmergency ? [300, 100, 300, 100, 300] : [200, 50, 200],
            timestamp,
            silent:             false,
            actions: [
              { action: 'view',    title: '👁 View Details' },
              { action: 'dismiss', title: '✕ Dismiss' },
            ],
          } as any;

          if (image) {
            (options as any).image = image;
          }

          reg.showNotification(title, options);
        }).catch(() => {
          // Fallback: basic Notification API (no actions, no badge)
          new Notification(title, { body, icon, tag });
        });
      }
    });
  }

  private initFirebase(): void {
    if (this.messaging) return;
    try {
      if (!getApps().length) {
        this.app = initializeApp(environment.firebase);
      } else {
        this.app = getApps()[0];
      }
      this.messaging = getMessaging(this.app);
    } catch (err) {
      console.warn('PushNotifications: Firebase init failed.', err);
    }
  }

  private async getOrRegisterSW(): Promise<ServiceWorkerRegistration | null> {
    try {
      const existing = await navigator.serviceWorker.getRegistration(this.swPath);
      if (existing) {
        await navigator.serviceWorker.ready;
        return existing;
      }
      const reg = await navigator.serviceWorker.register(this.swPath, { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.warn('PushNotifications: SW registration failed.', err);
      return null;
    }
  }

  private async saveTokenToServer(token: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/push/subscribe`, {
        endpoint:   token,
        p256dh_key: null,
        auth_key:   null,
        user_agent: navigator.userAgent,
        token_type: 'fcm',
      })
    );
  }

  private async removeTokenFromServer(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/push/unsubscribe`, {
          body: { endpoint: token },
        })
      );
    } catch {
      // Best-effort
    }
  }

  private async requestPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
  }

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window &&
      'PushManager' in window
    );
  }
}

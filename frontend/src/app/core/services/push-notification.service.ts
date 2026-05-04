import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly swPath = '/sw.js';
  private registration: ServiceWorkerRegistration | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Register the service worker and subscribe to push notifications.
   * Call this after a successful login for adviser users.
   */
  async init(): Promise<void> {
    if (!this.isSupported()) {
      console.info('PushNotifications: not supported in this browser.');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.swPath, { scope: '/' });
      console.info('PushNotifications: service worker registered.');
    } catch (err) {
      console.warn('PushNotifications: service worker registration failed.', err);
      return;
    }

    // Ask for permission if not already granted
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      console.info('PushNotifications: permission not granted.');
      return;
    }

    await this.subscribe();
  }

  /**
   * Unsubscribe and remove the push subscription from the server.
   * Call this on logout.
   */
  async unsubscribeAll(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const reg = this.registration ?? (await navigator.serviceWorker.getRegistration(this.swPath));
      if (!reg) return;

      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      await this.removeSubscriptionFromServer(sub.endpoint);
      await sub.unsubscribe();
      console.info('PushNotifications: unsubscribed.');
    } catch (err) {
      console.warn('PushNotifications: unsubscribe failed.', err);
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async subscribe(): Promise<void> {
    if (!this.registration) return;

    try {
      // Check if already subscribed
      let sub = await this.registration.pushManager.getSubscription();

      if (!sub) {
        const vapidKey = await this.fetchVapidPublicKey();
        if (!vapidKey) {
          console.warn('PushNotifications: VAPID public key not available.');
          return;
        }

        sub = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidKey),
        });
      }

      await this.saveSubscriptionToServer(sub);
      console.info('PushNotifications: subscribed successfully.');
    } catch (err) {
      console.warn('PushNotifications: subscribe failed.', err);
    }
  }

  private async fetchVapidPublicKey(): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: { public_key: string } }>(
          `${environment.apiUrl}/push/vapid-public-key`
        )
      );
      return res?.data?.public_key ?? null;
    } catch {
      return null;
    }
  }

  private async saveSubscriptionToServer(sub: PushSubscription): Promise<void> {
    const json = sub.toJSON();
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/push/subscribe`, {
        endpoint:    sub.endpoint,
        p256dh_key:  json.keys?.['p256dh'] ?? null,
        auth_key:    json.keys?.['auth']   ?? null,
        user_agent:  navigator.userAgent,
      })
    );
  }

  private async removeSubscriptionFromServer(endpoint: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/push/unsubscribe`, {
          body: { endpoint },
        })
      );
    } catch {
      // Best-effort — don't throw
    }
  }

  private async requestPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
  }

  private isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Convert a base64url VAPID public key to a Uint8Array for the browser API.
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }
}

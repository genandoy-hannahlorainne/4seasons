/**
 * Studentcare Service Worker
 * Handles Web Push notifications via Firebase Cloud Messaging.
 */

try {
  importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');
} catch (e) {
  console.warn('[SW] Firebase importScripts failed:', e);
}

// ─── Firebase init ────────────────────────────────────────────────────────────
if (typeof firebase !== 'undefined') {
  firebase.initializeApp({
    apiKey: 'AIzaSyCZmYxycwEFMg0U_FS4SSewMX8F8sMc6dA',
    authDomain: 'studentcare-pdmhs.firebaseapp.com',
    projectId: 'studentcare-pdmhs',
    storageBucket: 'studentcare-pdmhs.firebasestorage.app',
    messagingSenderId: '480384576233',
    appId: '1:480384576233:web:c39e628175d40117b81e78',
  });

  const messaging = firebase.messaging();

  // ─── Background push handler (app is closed / in background) ─────────────────
  messaging.onBackgroundMessage((payload) => {
    const data        = payload.data        || {};
    const notif       = payload.notification || {};
    const title       = notif.title  || data.title  || 'Studentcare Clinic';
    const body        = notif.body   || data.body   || 'You have a new notification.';
    const icon        = data.icon    || notif.icon  || '/assets/icons/school-clinic.png';
    const badge       = data.badge   || '/assets/icons/notification.png';
    const tag         = data.tag     || 'studentcare-notification';
    const clickUrl    = data.url     || '/adviser/alerts';
    const isEmergency = data.requireInteraction === 'true' || data.requireInteraction === true;

    return self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data:               { url: clickUrl },
      requireInteraction: isEmergency,
      vibrate:            isEmergency ? [200, 100, 200, 100, 200] : [200],
      actions: [
        { action: 'view',    title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  });
}

// ─── Install / Activate ───────────────────────────────────────────────────────
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/adviser/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

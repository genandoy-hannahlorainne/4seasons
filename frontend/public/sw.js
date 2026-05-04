/**
 * Studentcare Service Worker
 * Handles Web Push notifications for adviser clinic visit alerts.
 */

const CACHE_NAME = 'studentcare-v1';

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ─── Push ─────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Studentcare', body: event.data ? event.data.text() : 'New notification' };
  }

  const title   = data.title   || 'Studentcare Clinic';
  const options = {
    body:               data.body    || 'You have a new notification.',
    icon:               data.icon    || '/assets/icons/school-clinic.png',
    badge:              data.badge   || '/assets/icons/notification.png',
    tag:                data.tag     || 'studentcare-notification',
    data:               data.data    || {},
    actions:            data.actions || [],
    requireInteraction: data.requireInteraction || false,
    vibrate:            data.requireInteraction ? [200, 100, 200, 100, 200] : [200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/adviser/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if one is open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

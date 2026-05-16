/**
 * Studentcare Service Worker
 * Handles Web Push notifications via Firebase Cloud Messaging.
 * Also provides offline support and app caching.
 */

// Cache version - update this when you want to invalidate all caches
const CACHE_VERSION = 'v1';
const CACHE_NAME = `studentcare-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.webmanifest'
];

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
self.addEventListener('install', (event) => {
  console.info('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.info('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.info('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.info('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch - serve from cache, fallback to network ───────────────────────────
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and POST requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }

  // Skip API calls - always fetch from network
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.warn('[SW] API request failed:', event.request.url);
        // Return offline response or cached fallback if available
        return caches.match(event.request);
      })
    );
    return;
  }

  // For static assets: try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ─── Handle messages from clients ──────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.info('[SW] Skipping waiting and claiming clients');
    self.skipWaiting();
  }
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/adviser/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus existing window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});


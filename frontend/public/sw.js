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
  // Styled like social media notifications: app icon, bold title, preview body,
  // action buttons, badge on status bar, vibration, and direct deep-link on click.
  messaging.onBackgroundMessage((payload) => {
    const data        = payload.data        || {};
    const notif       = payload.notification || {};

    const title       = notif.title  || data.title  || 'Studentcare';
    const body        = notif.body   || data.body   || 'You have a new notification.';
    const icon        = data.icon    || notif.icon  || '/assets/icons/school-clinic.png';
    const badge       = data.badge   || '/assets/icons/notification.png';
    const image       = data.image   || notif.image || null;   // optional big thumbnail
    const tag         = data.tag     || 'studentcare-notification';
    const clickUrl    = data.url     || '/adviser/alerts';
    const isEmergency = data.requireInteraction === 'true' || data.requireInteraction === true;
    const timestamp   = data.timestamp ? parseInt(data.timestamp, 10) : Date.now();

    const options = {
      body,
      icon,           // app icon shown next to the title (like FB/Messenger avatar)
      badge,          // small monochrome icon shown in Android status bar
      tag,            // collapses duplicate notifications for the same visit
      data:               { url: clickUrl },
      requireInteraction: isEmergency,   // keeps urgent alerts on screen until dismissed
      vibrate:            isEmergency ? [300, 100, 300, 100, 300] : [200, 50, 200],
      timestamp,          // shows correct time like social media (e.g. "2 min ago")
      silent:             false,         // always play sound
      actions: [
        { action: 'view',    title: '👁 View Details' },
        { action: 'dismiss', title: '✕ Dismiss' },
      ],
    };

    // Add big image thumbnail if provided (like Facebook post preview)
    if (image) {
      options.image = image;
    }

    return self.registration.showNotification(title, options);
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

  // Dismiss action — just close, do nothing else
  if (event.action === 'dismiss') return;

  // 'view' action or clicking the notification body both open the app
  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/adviser/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open, focus it and navigate — like tapping a FB notification
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // App is closed — open a new window directly to the notification target
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});


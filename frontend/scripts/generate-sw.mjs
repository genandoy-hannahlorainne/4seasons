/**
 * Generates public/sw.js from environment.ts Firebase config.
 * Run before build: npm run generate:sw
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const envCandidates = [
  join(root, 'src/environments/environment.ts'),
  join(root, 'src/environments/environment.development.ts'),
];

const envPath = envCandidates.find((p) => existsSync(p));
if (!envPath) {
  console.error('generate-sw: No environment.ts found. Copy environment.example.ts first.');
  process.exit(1);
}

const envSource = readFileSync(envPath, 'utf8');
const firebaseBlock = envSource.match(/firebase:\s*\{([\s\S]*?)\n\s*\}/);
if (!firebaseBlock) {
  console.error('generate-sw: firebase block not found in', envPath);
  process.exit(1);
}

const pick = (key) => {
  const m = firebaseBlock[1].match(new RegExp(`${key}:\\s*['"]([^'"]*)['"]`));
  return m ? m[1] : '';
};

const config = {
  apiKey: pick('apiKey'),
  authDomain: pick('authDomain'),
  projectId: pick('projectId'),
  storageBucket: pick('storageBucket'),
  messagingSenderId: pick('messagingSenderId'),
  appId: pick('appId'),
};

if (!config.apiKey || !config.projectId) {
  console.error('generate-sw: Firebase config incomplete in', envPath);
  process.exit(1);
}

const sw = `/**
 * Studentcare Service Worker (auto-generated — do not edit by hand)
 * Regenerate: npm run generate:sw
 */
const CACHE_VERSION = 'v2';
const CACHE_NAME = \`studentcare-\${CACHE_VERSION}\`;
const STATIC_ASSETS = ['/', '/index.html', '/favicon.ico', '/manifest.webmanifest'];

try {
  importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');
} catch (e) {
  console.warn('[SW] Firebase importScripts failed:', e);
}

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(${JSON.stringify(config, null, 2)});

  firebase.messaging().onBackgroundMessage((payload) => {
    const data = payload.data || {};
    const notif = payload.notification || {};

    const title = notif.title || data.title || 'Studentcare';
    const body = notif.body || data.body || 'You have a new notification.';
    const icon = data.icon || notif.icon || '/assets/icons/school-clinic.png';
    const badge = data.badge || '/assets/icons/notification.png';
    const tag = data.tag || 'studentcare-notification';
    const clickUrl = data.url || '/dashboard/adviser/alerts';
    const isEmergency = data.requireInteraction === 'true';
    const timestamp = data.timestamp ? parseInt(data.timestamp, 10) : Date.now();

    return self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data: { url: clickUrl },
      requireInteraction: isEmergency,
      vibrate: isEmergency ? [300, 100, 300, 100, 300] : [200, 50, 200],
      timestamp,
      silent: false,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => console.warn('[SW] cache addAll:', err))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    '/dashboard/adviser/alerts';

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
`;

const outPath = join(root, 'public', 'sw.js');
writeFileSync(outPath, sw, 'utf8');
console.log('generate-sw: wrote', outPath);

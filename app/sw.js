// sw.js — ScrollBreak Service Worker
// Handles: offline caching, push notifications, background sync

const CACHE_NAME = 'scrollbreak-v1';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/storage.js',
  './js/groq.js',
  './js/app.js',
  './js/dashboard.js',
  './js/analytics.js',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Syne+Mono&display=swap'
];

// ─── INSTALL: cache all assets ───────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ─── ACTIVATE: clean old caches ──────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── FETCH: serve from cache, fallback to network ────────
self.addEventListener('fetch', (event) => {
  // Always go network-first for Groq API calls
  if (event.request.url.includes('groq.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Time to set your scrolling intention.',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './' },
    actions: [
      { action: 'set-intention', title: 'Set Intention' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'ScrollBreak', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('scrollbreak') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data?.url || './');
    })
  );
});

// ─── BACKGROUND SYNC ─────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sessions') {
    event.waitUntil(syncSessions());
  }
});

async function syncSessions() {
  // Reads from IndexedDB and pushes to backend if available
  // Sessions are stored in localStorage by app.js
  // This is a no-op if no backend is configured
  console.log('[SW] Background sync triggered');
}

// ─── PERIODIC REMINDERS (if granted) ─────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(
      self.registration.showNotification('ScrollBreak Check-in', {
        body: 'Have you set your scrolling intention today?',
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        actions: [
          { action: 'open', title: 'Set Intention' }
        ]
      })
    );
  }
});

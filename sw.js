/**
 * SOMNIA 2026 - SERVICE WORKER (NETWORK-FIRST WITH AUTO-PURGE)
 * Ensures user ALWAYS sees latest live updates immediately, with offline cache fallback.
 */

const CACHE_NAME = 'somnia-pwa-v19-live-2026';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './audio-engine.js',
  './sleep-engine.js',
  './argon-modules.js',
  './breathwork.js',
  './tracker.js',
  './sleepy-course.js',
  './mifit-sync.js',
  './sleepy-ai.js',
  './app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Somnia SW v10] Precaching shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Somnia SW v10] Purging legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// NETWORK-FIRST STRATEGY: Always fetch latest code from GitHub Pages, fallback to cache if offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, respClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

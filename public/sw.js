/* Minimal service worker for PWA installability (beforeinstallprompt). */
const CACHE_NAME = 'ledgerhive-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  /* Network-first: no caching required for install prompt criteria. */
});

/* EyeFit Service Worker — caching for offline use (v2.1: network-first para rutina.xlsx) */
const CACHE = 'eyefit-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './xlsx.full.min.js',
  './supabase.js',
  './rutina.xlsx',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar Supabase (auth + datos) — siempre en red
  if (url.origin.includes('supabase.co')) return;

  // rutina.xlsx: network-first con fallback a caché.
  // La app la pide con cache:"no-store" — sin esto el SW serviría
  // la versión cacheada para siempre y los cambios del archivo
  // nunca se verían (bug B1).
  if (url.pathname.endsWith('/rutina.xlsx')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return response;
        }
        return caches.match(request);
      }).catch(() => caches.match(request))
    );
    return;
  }

  // No interceptar peticiones a la API del dataset (datos) cuando haya red
  if (url.hostname === 'raw.githubusercontent.com') {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetched = fetch(request).then(response => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Estrategia: cache-first con actualización en red para todo lo demás
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
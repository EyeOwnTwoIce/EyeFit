/* EyeFit Service Worker — v7 (network-first)
   - cache versionada (bump manual por release)
   - network-first: SIEMPRE intenta la red antes que la caché,
     garantizando que cada carga/recarga obtenga la última versión.
   - offline fallback shell en vez de respuesta vacía
   - Background Sync: navigator.sync → notifica a la app para scheduleSync */
const CACHE = 'eyefit-v7';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './utils.js',
  './supabase.js',
  './rutina.xlsx',
  './src/app.js',
  './src/styles.css',
  './src/db.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

/* Shell offline: página mínima para un cold-load sin red */
const OFFLINE_SHELL = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EyeFit — Sin conexión</title>
<style>
  body{ background:#0A0A0A; color:#F0F0F0; font-family:-apple-system,BlinkMacSystemFont,sans-serif;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        min-height:100dvh; text-align:center; padding:24px; margin:0; }
  .logo{ font-size:48px; margin-bottom:8px; }
  h1{ font-size:20px; margin:0 0 8px; color:#C8FF00; }
  p{ color:#A8A8A8; font-size:14px; line-height:1.5; }
</style></head>
<body><div class="logo">👁️</div><h1>EyeFit — Sin conexión</h1>
<p>La app no está cachead&aacute; en este dispositivo.<br>Con&eacute;ctate a internet y recarga.</p></body></html>`;

/* Respuesta 504 genérica para rutas no cacheables sin red */
const OFFLINE_RESPONSE = new Response('', { status: 504, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } });

function isSupabaseUrl(url) {
  return url.hostname === 'supabase.co' ||
         url.hostname.endsWith('.supabase.co') ||
         url.hostname === 'supabase.in' ||
         url.hostname.endsWith('.supabase.in');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      // Ya no nos saltamos la espera: esperamos a que el cliente recargue
      // así el nuevo SW toma control después de la primera recarga.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Background Sync: cuando el navegador registra el sync, despierta la app
   para que llame a scheduleSync() y suba lo pendiente. */
self.addEventListener('sync', event => {
  if (event.tag === 'eyefit-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          for (const client of clients) {
            client.postMessage({ type: 'EYEFIT_SYNC' });
          }
        })
    );
  }
});

/* Actualización disponible → notificar al cliente para el prompt "recargar" */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* Estrategia de red: network-first. Cada petición intenta primero la red,
   y solo si falla recurre a la caché (o al shell offline para navegaciones).
   Esto garantiza que SIEMPRE se sirva la última versión desplegada. */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase: siempre en red (auth + datos)
  if (isSupabaseUrl(url)) return;

  // rutina.xlsx: network-first con fallback a caché
  if (url.pathname.endsWith('/rutina.xlsx')) {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return response;
        }
        return caches.match(request);
      }).catch(() => caches.match(request).then(res => res || OFFLINE_RESPONSE))
    );
    return;
  }

  // GIFs del dataset externo: network-first con fallback a caché
  if (url.hostname === 'raw.githubusercontent.com') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
          return response;
        }
        return caches.match(request);
      }).catch(() => caches.match(request).then(res => res || OFFLINE_RESPONSE))
    );
    return;
  }

  // Navegaciones: network-first; si la red falla, caché; si no hay caché, shell.
  // Nunca encadenar .catch sobre un valor no-thenable (bug Safari/WebKit).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          return new Response(OFFLINE_SHELL, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        })
      )
    );
    return;
  }

  // Resto (JS, CSS, iconos): network-first con fallback a caché
  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() => caches.match(request).then(res => res || OFFLINE_RESPONSE))
  );
});
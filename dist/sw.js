/* EyeFit Service Worker — template (build injecta CACHE + CORE_ASSETS)
   - cache versionada (bump automático por hash de build)
   - offline fallback shell en vez de respuesta vacía
   - Background Sync: navigator.sync → notifica a la app para scheduleSync
   - SheetJS NO está en CORE_ASSETS (carga dinámica solo al importar/exportar) */
const CACHE = "eyefit-vmsglj1a0";
const CORE_ASSETS = ["./","./index.html","./styles.9da14b7d.css","./app.e88c502b.js","./manifest.json","./utils.js","./db.js","./supabase.js","./rutina.xlsx","./slim-dataset.json","./exercise-meta.json","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-180.png"];

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

/* ============ Web Push (iOS/iPadOS 16.4+ PWA) ============ */
/* Muestra una notificación cuando llega un payload push (RFC 8030).
   El payload puede ser JSON (title/body/icon/badge/data) o texto plano. */
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let title = 'EyeFit';
    let body = 'Hay novedades en tu app.';
    let icon = './icons/icon-192.png';
    let badge = './icons/icon-192.png';
    let data = { url: './' };

    try {
      if (event.data) {
        const text = event.data.text();
        if (text) {
          try {
            const payload = JSON.parse(text);
            if (payload.title) title = payload.title;
            if (payload.body) body = payload.body;
            if (payload.icon) icon = payload.icon;
            if (payload.badge) badge = payload.badge;
            if (payload.data) data = { ...data, ...payload.data };
          } catch (_) {
            body = text;
          }
        }
      }
    } catch (_) {}

    try {
      await self.registration.showNotification(title, {
        body,
        icon,
        badge,
        data,
        tag: data.tag || 'eyefit-update',
        renotify: false,
        silent: false
      });
    } catch (_) {
      /* Fallback sin icon/badge si algo no se soporta */
      await self.registration.showNotification(title, { body, data });
    }
  })());
});

/* Al hacer click en la notificación: enfocar (o abrir) la PWA en la ruta indicada */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      if ('focus' in client) { try { await client.focus(); } catch(_){} }
    }
    if (!allClients.length) {
      try { await self.clients.openWindow(targetUrl); } catch(_) {}
    }
  })());
});

/* Gestiona clics en actions (p.ej. "Abrir rutina", "Recargar") */
self.addEventListener('notificationclose', event => {
  /* opcional: limpiar badge cuando se cierra la notificación */
  try { self.registration.setAppBadge && self.registration.setAppBadge(0); } catch(_) {}
});

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
      }).catch(() => caches.match(request)).then(res => res || OFFLINE_RESPONSE)
    );
    return;
  }

  // slim-dataset.json + exercise-meta.json: stale-while-revalidate (cache + red en paralelo)
  const isMetaOrDataset = url.pathname.endsWith('/slim-dataset.json') ||
    url.pathname.endsWith('/exercise-meta.json');
  if (isMetaOrDataset) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetched = fetch(request).then(response => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return (cached || fetched) || OFFLINE_RESPONSE;
        })
      )
    );
    return;
  }

  // Navegaciones: cache-first; si no hay caché, red y si falla → shell offline.
  // (No devolver `undefined`: cause ERR_FAILED en recargas offline.)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() =>
          new Response(OFFLINE_SHELL, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
        );
      })
    );
    return;
  }

  // Resto: cache-first con actualización en red
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);
      return (cached || networkFetch) || OFFLINE_RESPONSE;
    })
  );
});
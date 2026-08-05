// Edge Function de EyeFit — Dispatch de notificaciones Web Push (RFC 8030)
// Uso: recibe una lista de suscripciones + payload y envía pushes con VAPID.
// Requiere el paquete `web-push`. Instala con: `npm i web-push @supabase/supabase-js`
//
// Despliega con:
//   supabase functions deploy eyefit-push --no-verify-jwt
// Y configura los secretos:
//   supabase secrets set VAPID_SUBJECT=mailto:admin@eyefit.app VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
//
// Ejemplo de llamada (REST / POST):
//   {
//     "subscriptions": [ { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } } ],
//     "title": "🔄 EyeFit actualizado",
//     "body": "Nueva versión disponible. Toca para recargar.",
//     "url": "./"
//   }
import { serve } from 'https://deno.land/std@0.216.0/http/server.ts'
import * as webpush from 'npm:web-push@3.6.7'

// Lee los secretos de VAPID desde environment
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@eyefit.app'
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || ''

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  try {
    const body = await req.json()
    const subscriptions = Array.isArray(body.subscriptions) ? body.subscriptions : []
    const title = body.title || 'EyeFit'
    const message = body.body || 'Nueva versión disponible'
    const url = body.url || './'

    if (!subscriptions.length) {
      return new Response(JSON.stringify({ ok: false, error: 'No subscriptions' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const payload = JSON.stringify({ title, body: message, url, tag: 'eyefit-update' })
    const results = []

    for (const sub of subscriptions) {
      if (!sub || !sub.endpoint) { results.push({ ok: false, error: 'invalid_sub' }); continue }
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys?.p256dh || '', auth: sub.keys?.auth || '' }
      }
      try {
        await webpush.sendNotification(pushSub, payload, { TTL: 86400 })
        results.push({ ok: true, endpoint: sub.endpoint })
      } catch (err) {
        const status = err && err.statusCode
        // 404/410 = suscripción expirada
        if (status === 404 || status === 410) {
          results.push({ ok: false, expired: true, endpoint: sub.endpoint })
        } else {
          results.push({ ok: false, error: String(err && err.message || err), endpoint: sub.endpoint })
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: results.length, results }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e.message || e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})

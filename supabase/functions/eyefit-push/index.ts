// Edge Function de EyeFit — Dispatch de notificaciones Web Push (RFC 8030)
// Envía notificaciones a las suscripciones guardadas en la tabla push_subscriptions.
//
// Llamada (REST / POST), el CI la invoca tras cada deploy con solo el payload:
//   {
//     "title": "🔄 EyeFit actualizado",
//     "body": "Nueva versión disponible. Toca para recargar.",
//     "url": "./",
//     "subscriptions": [ ... ]   // opcional: si se pasa, se usan estas; si no,
//                                // se leen de la tabla push_subscriptions
//   }
//
// Despliega:
//   supabase functions deploy eyefit-push --no-verify-jwt
//
// Secretos:
//   supabase secrets set VAPID_SUBJECT=mailto:admin@eyefit.app VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
//   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los inyecta Supabase en runtime)
import { serve } from 'https://deno.land/std@0.216.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'npm:web-push@3.6.7'

const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@eyefit.app'
const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Lee todas las suscripciones guardadas en la tabla (service_role bypassa RLS)
async function loadSubscriptionsFromDB() {
  if (!SUPABASE_URL || !SERVICE_ROLE) return []
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)
  const { data, error } = await supabase.from('push_subscriptions').select('endpoint, keys')
  if (error) {
    console.warn('[eyefit-push] DB read error:', error.message)
    return []
  }
  return Array.isArray(data) ? data : []
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  try {
    const body = await req.json()
    const title = body.title || 'EyeFit'
    const message = body.body || 'Nueva versión disponible'
    const url = body.url || './'

    // 1. Suscripciones: del body o de la base de datos
    let subscriptions = Array.isArray(body.subscriptions) ? body.subscriptions : null
    if (!subscriptions || !subscriptions.length) {
      subscriptions = await loadSubscriptionsFromDB()
    }
    if (!subscriptions.length) {
      return new Response(JSON.stringify({ ok: false, error: 'No subscriptions' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const payload = JSON.stringify({ title, body: message, url, tag: 'eyefit-update' })
    const results = []

    for (const sub of subscriptions) {
      const endpoint = sub.endpoint
      const keys = sub.keys || sub.keys_obj || {}
      if (!endpoint) { results.push({ ok: false, error: 'invalid_sub' }); continue }
      const pushSub = { endpoint, keys: { p256dh: keys.p256dh || '', auth: keys.auth || '' } }
      try {
        await webpush.sendNotification(pushSub, payload, { TTL: 86400 })
        results.push({ ok: true, endpoint })
      } catch (err) {
        const status = err && err.statusCode
        if (status === 404 || status === 410) {
          results.push({ ok: false, expired: true, endpoint })
        } else {
          results.push({ ok: false, error: String(err && err.message || err), endpoint })
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

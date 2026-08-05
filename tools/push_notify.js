#!/usr/bin/env node
/* EyeFit — Enviar notificación push de actualización a todas las suscripciones
   Uso: node tools/push_notify.js [--sub-json path.json] [--title "..."] [--body "..."] [--url "./"]
   Requiere web-push: npm i web-push
   Las claves VAPID se leen de variables de entorno:
     VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
   Si no pasas --sub-json, busca en ./eyefit_subs.json
   Las suscripciones se guardan en localStorage del cliente (K_NEWS_KEYS.pushSubJson);
   este script sirve para CI o pruebas manuales. */
'use strict';
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@eyefit.app';
const PUBLIC  = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

if (!PUBLIC || !PRIVATE) {
  console.error('⚠️  Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en environment.');
  console.error('   Genera claves con: node tools/generate_vapid.js');
  process.exit(1);
}

const args = process.argv.slice(2);
function argVal(flag){
  const i = args.indexOf(flag);
  return i >= 0 ? args[i+1] : null;
}

const subFile = argVal('--sub-json') || './eyefit_subs.json';
const title = argVal('--title') || '🔄 EyeFit actualizado';
const body = argVal('--body') || 'Nueva versión disponible. Toca para recargar.';
const url = argVal('--url') || './';

if (!fs.existsSync(subFile)) {
  console.error(`⚠️  No se encontró ${subFile}.`);
  console.error('   Pasa --sub-json con la ruta a un JSON de suscripciones.');
  process.exit(1);
}

const subs = JSON.parse(fs.readFileSync(subFile, 'utf8'));
if (!Array.isArray(subs)) { console.error('El archivo debe ser un array de suscripciones.'); process.exit(1); }

webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
const payload = JSON.stringify({ title, body, url, tag: 'eyefit-update' });

(async () => {
  console.log(`Enviando "${title}" a ${subs.length} suscripciones...`);
  let sent = 0, expired = 0, errors = 0;
  for (const sub of subs) {
    if (!sub || !sub.endpoint) { continue; }
    const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.keys?.p256dh || '', auth: sub.keys?.auth || '' } };
    try {
      await webpush.sendNotification(pushSub, payload, { TTL: 86400 });
      sent++;
      console.log(`  ✓ ${sub.endpoint.slice(0,40)}...`);
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { expired++; }
      else { errors++; console.error(`  ✗ ${sub.endpoint.slice(0,40)}... ${e.message}`); }
    }
  }
  console.log(`Listo. Enviadas: ${sent}, expiradas: ${expired}, errores: ${errors}.`);
  if (expired) console.log('Elimina las suscripciones expiradas del almacén para no reenviar.');
})();

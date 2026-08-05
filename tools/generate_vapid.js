#!/usr/bin/env node
/* EyeFit — Generar par de claves VAPID para Web Push (RFC 8292)
   Uso: node tools/generate_vapid.js
   Añade la PUBLIC key al app.js (constants VAPID_PUBLIC_KEY)
   y usa la PRIVATE key en supabase/functions/eyefit-push/index.ts */
'use strict';
const { webcrypto } = require('crypto');

function b64u(buf){
  return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

(async () => {
  const kp = await webcrypto.subtle.generateKey(
    { name:'ECDSA', namedCurve:'P-256' },
    true,
    ['sign']
  );
  const pubRaw = await webcrypto.subtle.exportKey('raw', kp.publicKey);
  const privJwk = await webcrypto.subtle.exportKey('jwk', kp.privateKey);
  const publicKey = b64u(pubRaw);
  const privateKey = b64u(Buffer.from(privJwk.d,'base64'));

  console.log('=== VAPID keys (guárdalas en secretos de tu CI / Edge Function) ===');
  console.log('PUBLIC_KEY=' + publicKey);
  console.log('PRIVATE_KEY=' + privateKey);
  console.log('\nAñade la PUBLIC key a src/app.js const VAPID_PUBLIC_KEY');
  console.log('Y configura el endpoint /eyefit-push con la PRIVATE key.');
})();

/* EyeFit — Módulo notificaciones push (refactor #10 → issue #14)
   - Suscripción del SW (ensurePushSubscription) + persistencia local/Supabase
   - Activar/desactivar notificaciones (enable/disable)
   - isPushEnabled, isIOS, isStandalonePWA
   Exposición global: window.EyeFit.Push */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const P = () => EyeFit.Persistence || {};
  const S = () => EyeFit.Supabase || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};

  /* Claves para Web Push / notificaciones */
  const K_NEWS_KEYS = {
    pushSubscribed: "eyefit_push_subscribed_v1",
    pushSubJson: "eyefit_push_sub_v1"
  };
  const vapidKey = (P().VAPID_PUBLIC_KEY) || "";

  function urlBase64ToUint8Array(base64String){
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for(let i=0; i<raw.length; ++i) output[i] = raw.charCodeAt(i);
    return output;
  }

  /* Comprueba si la PWA se ejecuta en modo standalone (requisito iOS) */
  function isStandalonePWA(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true
      || window.navigator.standalone === 1;
  }

  /* Normaliza/crea la suscripción push del SW registrado */
  async function ensurePushSubscription(reg){
    try{
      if(!reg || !reg.pushManager) return null;
      let sub = await reg.pushManager.getSubscription();
      if(sub) return sub;
      if(Notification && Notification.permission !== 'granted') return null;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      return sub;
    }catch(e){
      console.warn("[EyeFit] push subscribe error:", e);
      return null;
    }
  }

  /* Guarda la suscripción en localStorage + Supabase (para el dispatch del backend) */
  async function persistPushSubscription(sub){
    try{
      if(sub){
        localStorage.setItem(K_NEWS_KEYS.pushSubscribed, "1");
        const json = sub.toJSON ? sub.toJSON() : sub;
        localStorage.setItem(K_NEWS_KEYS.pushSubJson, JSON.stringify(json));
        /* Subir el endpoint a Supabase para que la Edge Function eyefit-push
           lo use al acabar cada deploy (flush separado, no bloquea al caller). */
        if(S().sbClient && json && json.endpoint){
          S().sbClient.from("push_subscriptions").upsert({
            endpoint: json.endpoint,
            keys: json.keys || {}
          }, { onConflict: "endpoint" }).then(({error})=>{
            if(error) console.warn("[EyeFit] push sub upsert error:", error.message);
          });
        }
      } else {
        localStorage.setItem(K_NEWS_KEYS.pushSubscribed, "");
        /* Recuperar y eliminar el endpoint de Supabase */
        const jsonStr = localStorage.getItem(K_NEWS_KEYS.pushSubJson);
        let endpoint = null;
        try{ if(jsonStr) endpoint = (JSON.parse(jsonStr)||{}).endpoint; }catch(e){}
        localStorage.removeItem(K_NEWS_KEYS.pushSubJson);
        if(S().sbClient && endpoint){
          S().sbClient.from("push_subscriptions").delete().eq("endpoint", endpoint)
            .then(({error})=>{ if(error) console.warn("[EyeFit] push sub delete error:", error.message); });
        }
      }
    }catch(e){}
  }

  /* iOS PWA (16.4+) exige estar instalada (standalone) para recibir push.
     En Android/desktop Chrome el push funciona sin instalar. */
  function isIOS(){
    return /iP(hone|ad|od)/.test(navigator.userAgent);
  }

  /* Acción del botón "Activar notificaciones" (debe llamarse desde un gesture) */
  async function enablePushNotifications(){
    if(!('serviceWorker' in navigator)){ Ui().showToast("⚠️ Service Worker no soportado"); return; }
    if(!('PushManager' in window)){ Ui().showToast("⚠️ Este navegador no soporta Push"); return; }
    /* Solo en iOS es obligatorio estar en modo standalone (PWA instalada) para
       que el Push Service entregue notificaciones con la app cerrada. */
    if(isIOS() && !isStandalonePWA()){
      Ui().showToast("📲 Instala EyeFit en tu pantalla de inicio para activar notificaciones");
      return;
    }
    try{
      const permission = await Notification.requestPermission();
      if(permission !== 'granted'){
        Ui().showToast("🔕 Permiso de notificaciones denegado");
        return;
      }
      const reg = window.__swReg || await navigator.serviceWorker.ready;
      const sub = await ensurePushSubscription(reg);
      if(sub && sub.endpoint){
        await persistPushSubscription(sub);
        Ui().showToast("🔔 Notificaciones activadas");
        Router().renderMain();
      } else {
        Ui().showToast("⚠️ No se pudo suscribir a notificaciones");
      }
    }catch(e){
      console.warn(e);
      Ui().showToast("⚠️ Error al activar notificaciones");
    }
  }

  /* Desactivar notificaciones (elimina suscripción local + Supabase) */
  async function disablePushNotifications(){
    let endpoint = null;
    try{
      const reg = window.__swReg || (navigator.serviceWorker ? await navigator.serviceWorker.ready : null);
      if(reg && reg.pushManager){
        const sub = await reg.pushManager.getSubscription();
        if(sub){
          endpoint = sub.endpoint;
          await sub.unsubscribe();
        }
      }
    }catch(e){}
    await persistPushSubscription(null);
    Ui().showToast("🔕 Notificaciones desactivadas");
    Router().renderMain();
  }

  function isPushEnabled(){
    try{ return !!localStorage.getItem(K_NEWS_KEYS.pushSubscribed); }catch(e){ return false; }
  }

  EyeFit.Push = {
    K_NEWS_KEYS, vapidKey,
    urlBase64ToUint8Array, isStandalonePWA, ensurePushSubscription,
    persistPushSubscription, isIOS, enablePushNotifications,
    disablePushNotifications, isPushEnabled
  };
})(typeof window !== "undefined" ? window : globalThis);

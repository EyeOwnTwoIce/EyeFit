/* EyeFit — Módulo bootstrap / ciclo de vida de la app (issue #25)
   - init(): arranque (config, migraciones, auth lazy, dataset, sesión)
   - Sync automático (reintento 30s + Background Sync + online/pageshow)
   - Service Worker: registro, push, install prompt, recarga automática
   - Onboarding multi-paso
   Exposición global: window.EyeFit.Bootstrap */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const S = () => EyeFit.Supabase || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const RT = () => EyeFit.RestTimer || {};
  const Router = () => EyeFit.Router || {};
  const Session = () => EyeFit.Session || {};
  const Auth = () => EyeFit.Auth || {};
  const Push = () => EyeFit.Push || {};
  const DB = global.EyeFitDB || null;

  async function init(){
  /* CSS completo: pasa de media="print" (no bloquea render) a media="all" */
  const fullCssLink = document.getElementById("fullCssLink");
  if(fullCssLink && fullCssLink.media === "print"){ fullCssLink.media = "all"; }

  C().loadTrainingConfig();
  C().loadTrainingDays();
  /* Registrar UNA sola vez los handlers del overlay de edición de historial.
     (No puede estar en attachEvents(): ese se llama en cada renderMain y
     duplicaría el listener, provocando que "Añadir serie" añadiera muchas.) */
  window.EyeFit.Events.attachEditHistOverlayEvents();
  await P().runMigrations();
  if(DB && !P().historyLoaded) await P().loadHistoryFromDB();
  let authenticated = false;
  /* Lazy Supabase: solo cargar el SDK (~180KB) si hay sesión previa guardada.
     Sin sesión guardada, se salta el SDK y se muestra el overlay con "Continuar
     sin conexión" disponible. El SDK se carga bajo demanda al hacer login. */
  const supabaseRef = (()=>{ try{ return new URL(S().SUPABASE_URL).hostname.split(".")[0]; }catch(e){ return "vkaxxphminfinufitcyp"; } })();
  const supabaseStorageKey = `sb-${supabaseRef}-auth-token`;
  const hasStoredSession = (()=>{ try{ return !!localStorage.getItem(supabaseStorageKey); }catch(e){ return false; } })();
  if(hasStoredSession){
    try{
      await S().ensureSupabaseClient();
      const { data: authData } = await S().sbClient.auth.getSession();
      S().authUser = authData.session ? authData.session.user : null;
      /* Solo permitir acceso si el email está verificado */
      if(S().authUser && Auth().isEmailVerified(S().authUser)) authenticated = true;
      else{
        if(S().authUser) await S().sbClient.auth.signOut().catch(()=>{});
        S().authUser = null;
        Auth().showAuthOverlay(true);
      }
    }catch(e){ Auth().authBlocked = true; Auth().showAuthOverlay(true); }
  } else {
    Auth().showAuthOverlay(true);
  }

  const datasetPromise = D().loadExerciseDataset();
  const metaPromise = D().loadExerciseMeta(); /* M5: metadatos músculo/equipamiento */
  P().getHistory(); /* F2-A2: saneamiento del historial al arrancar */
  Session().restoreSession();
  Router().renderMain();
  D().datasetCache = await datasetPromise;
  D().exerciseMetaCache = await metaPromise.catch(()=>null);
  Router().renderMain();
  Router().updateStopBtn();
  showOnboarding();

  if(authenticated){
    await S().scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes de
       descargar y fusionar (evita ver sesiones locales no reflejadas). */
    await new Promise(r => setTimeout(r, 800));
    await S().pullServerData();
    Router().renderMain();
  }
}
/* Fix subida automática: reintento cada 30s si hay pendientes */
setInterval(()=>{
  if(S().authUser && S().sbClient){
    const pending = P().getPending();
    if(pending.sessions.length > 0 || pending.routine){
      S().scheduleSync().then(()=>{
        if(Router().currentTab === "ajustes" || Router().currentTab === "historial") Router().renderMain();
      });
    }
  }
}, 30000);
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      /* Web Push: si ya suscrito y hay permiso, mantener/normalizar y PERSISTIR
         la suscripción (localStorage + Supabase). Sin persistir, el CI no tiene
         el endpoint y la notificación push nunca llega con la app cerrada. */
      window.__swReg = reg;
      if(Notification && Notification.permission === 'granted'){
        Push().ensurePushSubscription(reg).then(sub => {
          if(sub && sub.endpoint) Push().persistPushSubscription(sub);
        });
      }
      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing;
        if(!sw) return;
        sw.addEventListener('statechange', ()=>{
          if(sw.state === 'installed' && navigator.serviceWorker.controller){
            /* Nueva versión desplegada en GitHub. Si la app está abierta (o se
               acaba de abrir al tocar la notificación push), avisamos con un
               toast y recargamos automáticamente SIN bloquear con confirm().
               No se muestra otra notificación de sistema: el Web Push real ya
               notificó al usuario (evita la duplicada al reabrir la app). */
            Ui().showToast("🔄 Nueva versión disponible");
            /* Activar la nueva versión: recarga automática no intrusiva.
               Si hay una sesión de entrenamiento en curso, esperamos a que el
               usuario termine (persistActiveSession guarda el estado en pagehide). */
            if(!Session().session){
              setTimeout(()=>{ reg.waiting && reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }, 500);
              /* controllerchange dispara window.location.reload() */
            }
          }
        });
      });
    }).catch(()=>{});
  });
  navigator.serviceWorker.addEventListener('controllerchange', ()=>{
    window.location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (event)=>{
    if(event.data && event.data.type === 'EYEFIT_SYNC'){
      if(S().authUser) S().scheduleSync();
    } else if(event.data && event.data.type === 'EYEFIT_RELOAD'){
      /* El usuario tocó la notificación push → recargar a la nueva versión */
      window.location.reload();
    }
  });
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    Ui().showToast("📲 Puedes instalar EyeFit en tu pantalla de inicio");
  });
  if(!window.showInstallBanner){
    window.showInstallBanner = ()=> { return deferredPrompt; };
  }
  function registerBgSync(){
    if(!('sync' in navigator)) return;
    const pending = P().getPending();
    if((pending.sessions.length > 0 || pending.routine) && S().authUser){
      navigator.sync.register('eyefit-sync').catch(()=>{});
    }
  }
  setInterval(registerBgSync, 60000);
}
window.addEventListener("online", async ()=>{
  Ui().showToast("🌐 Conexión restablecida");
  if(S().authUser){
    await S().scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes del pull */
    await new Promise(r => setTimeout(r, 800));
    await S().pullServerData();
    Router().renderMain();
  }
});
function persistActiveSession(){
  if(Session().session && Session().session.exercises && !Session().session.saved){
    Session().session.elapsed = Math.floor((Date.now()-Session().session.startTime)/1000)+Session().session.baseElapsed;
    Session().saveSessionState();
  }
}
window.addEventListener("pagehide", persistActiveSession);
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    for(const id of ["numOverlay","varOverlay","authOverlay","summaryOverlay","imgZoomOverlay","swipeConfirmOverlay"]){
      const el = document.getElementById(id);
      if(el && el.classList.contains("show")){
        Ui().setFocusTrap(id, null);
        el.classList.remove("show");
        if(id === "authOverlay") S().authUser = null;
        break;
      }
    }
  }
});
document.addEventListener("pageshow", async ()=>{
  if(S().authUser && S().sbClient && navigator.onLine){
    await S().scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes del pull */
    await new Promise(r => setTimeout(r, 800));
    await S().pullServerData();
    if(Router().currentTab === "historial") Router().renderMain();
  }
});
/* ================================================================
   ONBOARDING / AYUDA EN-APP (Fase E)
   ================================================================ */
const ONBOARD_STEPS = [
  { title:"👋 ¡Bienvenido a EyeFit!", body:"Tu gimnasio de bolsillo. Gestiona tu rutina, controla tus series y sigue tu progreso sin conexión." },
  { title:"📅 Rutina semanal", body:"Toca un día de la semana para ver los ejercicios. Pulsa «Entrenar» para empezar la sesión de ese día." },
  { title:"🏋️ Durante la sesión", body:"Marca cada serie completada con ✓. Ajusta peso y repeticiones con los botones +/− o tocando el valor. El descanso se controla solo." },
  { title:"☁️ Guardado y nube", body:"Todo se guarda en tu dispositivo automáticamente. Con cuenta podrás sincronizar tu historial entre dispositivos." }
];
let onboardStep = 0;
function renderOnboarding(){
  const s = ONBOARD_STEPS[onboardStep] || ONBOARD_STEPS[0];
  document.getElementById("onbTitle").textContent = s.title;
  document.getElementById("onbBody").textContent = s.body;
  document.getElementById("onbDots").innerHTML = ONBOARD_STEPS.map((_,i)=>`<span class="onb-dot${i===onboardStep?" active":""}"></span>`).join("");
  document.getElementById("onbNext").textContent = onboardStep === ONBOARD_STEPS.length-1 ? "¡Empezar!" : "Siguiente";
}
const ONBOARD_KEY = "eyefit_onboarding_seen_v2";
function deviceFingerprint(){
  try{
    const nav = navigator.userAgent + "|" + (screen.width||"") + "x" + (screen.height||"") + "|" + (navigator.language||"");
    let h = 0;
    for(let i=0; i<nav.length; i++){ h = ((h<<5)-h)+nav.charCodeAt(i); h|=0; }
    return String(Math.abs(h));
  }catch(e){ return "unknown"; }
}
function showOnboarding(force){
  const fp = deviceFingerprint();
  if(!force){
    try{
      const seen = JSON.parse(localStorage.getItem(ONBOARD_KEY) || "[]");
      if(Array.isArray(seen) && seen.includes(fp)) return;
    }catch(e){}
  }
  const ov = document.getElementById("onboardOverlay");
  if(!ov) return;
  onboardStep = 0;
  renderOnboarding();
  ov.classList.add("show");
  Ui().setFocusTrap("onboardOverlay", ov);
}
function closeOnboarding(){
  const ov = document.getElementById("onboardOverlay");
  if(ov) ov.classList.remove("show");
  Ui().setFocusTrap("onboardOverlay", null);
  const fp = deviceFingerprint();
  try{
    const seen = JSON.parse(localStorage.getItem(ONBOARD_KEY) || "[]");
    if(!Array.isArray(seen)) seen = [];
    if(!seen.includes(fp)) seen.push(fp);
    localStorage.setItem(ONBOARD_KEY, JSON.stringify(seen));
  }catch(e){}
}
document.getElementById("onbNext").addEventListener("click", ()=>{
  if(onboardStep < ONBOARD_STEPS.length-1){
    onboardStep++;
    renderOnboarding();
  } else {
    closeOnboarding();
  }
});
document.getElementById("onbSkip").addEventListener("click", closeOnboarding);
window.EyeFitShowOnboarding = ()=>showOnboarding(true);

/* Router -> src/modules/router.js (issue #17) */



  EyeFit.Bootstrap = { init, showOnboarding };
  global.EyeFitShowOnboarding = ()=>showOnboarding(true);
})(typeof window !== "undefined" ? window : globalThis);

"use strict";
/* ════════════════════════════════════════════════════════════════
   EyeFit v2.1.0 — botonera al ras, GIFs invertidos, formato español,
   fórmula 1RM completa, historial con eliminación y día actual por defecto
   ════════════════════════════════════════════════════════════════ */

/* ---------- Utilidades compartidas (utils.js, sin duplicar) ----------
   F1-C1: las funciones puras viven en utils.js y se exponen en
   window.EyeFitUtils. Si el archivo no cargó, abortamos con un
   mensaje claro en lugar de fallar en silencio. */
const U = window.EyeFitUtils || null;
if(!U){
  document.getElementById("main").innerHTML =
    '<div class="section active"><div class="empty-state">⚠️ Error crítico: utils.js no cargó.<br>Recarga la página o borra la caché.</div></div>';
  throw new Error("EyeFitUtils missing");
}

/* ---------- Manejo global de errores (F2-A1) ----------
   Evita pantallas en blanco silenciosas: cualquier error no capturado
   se registra y se muestra como toast informativo. */
window.addEventListener("error", (e)=>{
  console.error("[EyeFit]", e.message || e.error);
  showToast("⚠️ Error inesperado: " + (e.message || "desconocido"));
});
window.addEventListener("unhandledrejection", (e)=>{
  const err = e && e.reason ? (e.reason.message || e.reason) : "desconocido";
  console.error("[EyeFit] unhandledrejection", err);
  showToast("⚠️ Error inesperado: " + err);
});
const APODOS = U.APODOS;
const DAY_ORDER = U.DAY_ORDER;
const DAY_COLORS = U.DAY_COLORS;
const DAY_SHORT = U.DAY_SHORT;
const WEEKDAY_NAMES = U.WEEKDAY_NAMES;
const DEFAULT_ROUTINE = U.DEFAULT_ROUTINE;
const INSTRUCCIONES = U.INSTRUCCIONES;
const ALTERNATIVAS = U.ALTERNATIVAS;
const EMBEDDED_IMAGES = U.EMBEDDED_IMAGES;
const getApodo = U.getApodo;
const epley1RM = U.epley1RM;

/* Configuración de entrenamiento → src/modules/config.js (issue #8) */
const formatRest = U.formatRest;
const normalizeName = U.normalizeName;
const buildExerciseSets = U.buildExerciseSets;
const isValidSessionRecord = U.isValidSessionRecord;
const sortRoutine = U.sortRoutine;
const escapeHtmlAttr = U.escapeHtmlAttr;
const genUUID = U.genUUID;
const localDateKey = U.localDateKey;
const clampNum = U.clampNum;
const isValidDay = U.isValidDay;
const sanitizeRoutineRow = U.sanitizeRoutineRow;
const rebaseElapsed = U.rebaseElapsed;
const mergeHistoryBySessionId = U.mergeHistoryBySessionId;

/* Utilidades de UI/DOM → src/modules/ui.js (issue #8) */
const EF = window.EyeFit;
const showToast = EF.Ui.showToast;
const vibrate = EF.Ui.vibrate;
const setFocusTrap = EF.Ui.setFocusTrap;
const escapeHtml = EF.Ui.escapeHtml;
const setHtml = EF.Ui.setHtml;
const formatKg = EF.Ui.formatKg;
const formatInstructions = EF.Ui.formatInstructions;
const getInstrucciones = EF.Ui.getInstrucciones;
const getTodayName = EF.Ui.getTodayName;
const getExerciseBodyPart = EF.Ui.getExerciseBodyPart;

/* Configuración de entrenamiento → src/modules/config.js (issue #8) */
const Config = window.EyeFit.Config;
const loadTrainingDays = Config.loadTrainingDays;
const saveTrainingDays = Config.saveTrainingDays;
const loadTrainingConfig = Config.loadTrainingConfig;
const saveTrainingConfig = Config.saveTrainingConfig;
const scheduleRoutineSync = Config.scheduleRoutineSync;
const isCompoundExercise = Config.isCompoundExercise;
const getRepRange = Config.getRepRange;
const getIncrementFor = Config.getIncrementFor;
const computeProgressionDecision = Config.computeProgressionDecision;
const progressionBadgeHtml = Config.progressionBadgeHtml;
const pendingDoneKg = Config.pendingDoneKg;
const round1 = Config.round1;
const getHistoricalBest = Config.getHistoricalBest;
const getExerciseProgression = Config.getExerciseProgression;
const svgSparkline = Config.svgSparkline;
const getStreak = Config.getStreak;

/* Persistencia → src/modules/persistence.js (issue #9) */
const P = window.EyeFit.Persistence;
const K = P.K;
const VAPID_PUBLIC_KEY = P.VAPID_PUBLIC_KEY;
const DATA_VERSION = P.DATA_VERSION;
const lsGet = P.lsGet;
const lsSet = P.lsSet;
const getRoutine = P.getRoutine;
const setRoutine = P.setRoutine;
const loadHistoryFromDB = P.loadHistoryFromDB;
const persistHistory = P.persistHistory;
const getHistory = P.getHistory;
const saveHistory = P.saveHistory;
const runMigrations = P.runMigrations;
const getPending = P.getPending;
const setPending = P.setPending;
const DB = window.EyeFitDB || null;

/* Dataset de ejercicios → src/modules/dataset.js (issue #12) */
const Dataset = window.EyeFit.Dataset;
const IMG_BASE = Dataset.IMG_BASE;
const loadExerciseDataset = Dataset.loadExerciseDataset;
const loadExerciseMeta = Dataset.loadExerciseMeta;
const getExerciseMeta = Dataset.getExerciseMeta;
const findExerciseInDataset = Dataset.findExerciseInDataset;
const getExerciseImage = Dataset.getExerciseImage;
const getExerciseImageForName = Dataset.getExerciseImageForName;

/* Supabase Auth + Sync → src/modules/supabase.js (issue #10) */
const SB = window.EyeFit.Supabase;
const SUPABASE_URL = SB.SUPABASE_URL;
const SUPABASE_ANON_KEY = SB.SUPABASE_ANON_KEY;
const loadSupabaseSDK = SB.loadSupabaseSDK;
const ensureSupabaseClient = SB.ensureSupabaseClient;
const pullServerData = SB.pullServerData;
const pushRoutineToServer = SB.pushRoutineToServer;
const pushSessionToServer = SB.pushSessionToServer;
const scheduleSync = SB.scheduleSync;
const syncPending = SB.syncPending;

/* Autenticación → src/modules/auth.js (issue #11) */
const Auth = window.EyeFit.Auth;
const showAuthOverlay = Auth.showAuthOverlay;
const updateAuthTabs = Auth.updateAuthTabs;
const isEmailVerified = Auth.isEmailVerified;
const handleAuthSubmit = Auth.handleAuthSubmit;

/* Notificaciones push → src/modules/push.js (issue #14) */
const K_NEWS_KEYS = window.EyeFit.Push.K_NEWS_KEYS;
const vapidKey = window.EyeFit.Push.vapidKey;
const ensurePushSubscription = window.EyeFit.Push.ensurePushSubscription;
const persistPushSubscription = window.EyeFit.Push.persistPushSubscription;
const enablePushNotifications = window.EyeFit.Push.enablePushNotifications;
const disablePushNotifications = window.EyeFit.Push.disablePushNotifications;
const isPushEnabled = window.EyeFit.Push.isPushEnabled;
const isIOS = window.EyeFit.Push.isIOS;
const isStandalonePWA = window.EyeFit.Push.isStandalonePWA;

/* Sesión de entrenamiento → src/modules/session.js (issue #16) */
const Session = window.EyeFit.Session;
const sessionProgress = Session.sessionProgress;
const autoSaveSession = Session.autoSaveSession;
const saveSessionState = Session.saveSessionState;
const clearSessionState = Session.clearSessionState;
const restoreSession = Session.restoreSession;
const getLastExercisePerformance = Session.getLastExercisePerformance;
const startSession = Session.startSession;
const getSessionElapsed = Session.getSessionElapsed;
const fmtDuration = Session.fmtDuration;
const updateSessionHeader = Session.updateSessionHeader;
const renderSessionProgressBar = Session.renderSessionProgressBar;
const checkPR = Session.checkPR;

/* Vista rutina → src/modules/views-rutina.js (issue #18) */
const VR = window.EyeFit.ViewsRutina;
const renderRutina = VR.renderRutina;
const openRoutineNumPad = VR.openRoutineNumPad;
const confirmRoutineNumPad = VR.confirmRoutineNumPad;

/* Editar rutina → src/modules/views-edit-rutina.js (issue #20) */
const EditR = window.EyeFit.ViewsEditRutina;
const renderEditRoutine = EditR.renderEditRoutine;
const applyRoutineChange = EditR.applyRoutineChange;
const openExercisePicker = EditR.openExercisePicker;
const renderPickerList = EditR.renderPickerList;
const closeExercisePicker = EditR.closeExercisePicker;
const selectExerciseFromPicker = EditR.selectExerciseFromPicker;
const handleEditRoutineEvent = EditR.handleEditRoutineEvent;

/* Vista sesión → src/modules/views-sesion.js (issue #19) */
const VS = window.EyeFit.ViewsSesion;
const renderSesion = VS.renderSesion;
const updateSessionSetValues = VS.updateSessionSetValues;
const computeSummary = VS.computeSummary;
const showSummary = VS.showSummary;
const getVariants = VS.getVariants;
const openVariants = VS.openVariants;
const selectVariant = VS.selectVariant;
const openNumPad = VS.openNumPad;
const closeNumPad = VS.closeNumPad;
const confirmNumPad = VS.confirmNumPad;

/* Vista historial → src/modules/views-historial.js (issue #21) */
const EditH = window.EyeFit.ViewsHistorial;
const renderHistorial = EditH.renderHistorial;
const openEditHistSession = EditH.openEditHistSession;
const dismissEditHist = EditH.dismissEditHist;
const saveEditHist = EditH.saveEditHist;
const deleteHistorySession = EditH.deleteHistorySession;
const attachHistCalendarEvents = EditH.attachHistCalendarEvents;
const openHistExercisePicker = EditH.openHistExercisePicker;

/* Vista ajustes → src/modules/views-ajustes.js (issue #22) */
const renderAjustes = window.EyeFit.ViewsAjustes.renderAjustes;

/* Router y Events (módulos) */
const Router = window.EyeFit.Router;
const Events = window.EyeFit.Events;

/* Import/export XLSX → src/modules/xlsx-io.js (issue #13) */
const loadXLSX = window.EyeFit.XlsxIO.loadXLSX;
const parseRoutineSheet = window.EyeFit.XlsxIO.parseRoutineSheet;
const exportRoutineXlsx = window.EyeFit.XlsxIO.exportRoutineXlsx;

/* SDK Supabase lazy + ensureSupabaseClient → src/modules/supabase.js (issue #10) */

/* Datos estáticos (rutina/instrucciones/alternativas/imágenes) → src/constants.js (issue #1) */
/* Imágenes de ejercicios (IMG_BASE/imgNorm/findEmbeddedImage/getExerciseImage*) → src/modules/dataset.js (issue #12) */

/* ================================================================
   PERSISTENCIA
   ================================================================ */
/* K → src/modules/persistence.js (issue #9) */
/* Notificaciones push (K_NEWS_KEYS, ensurePushSubscription, enable/disable...) → src/modules/push.js (issue #14) */
/* lsGet/lsSet/getRoutine/setRoutine → src/modules/persistence.js (issue #9) */
/* Historial (caché+mutex+migraciones) y pending → src/modules/persistence.js (issue #9) */

/* Import/export XLSX → src/modules/xlsx-io.js (issue #13) */

/* ================================================================
   DATASET
   ================================================================ */
/* Carga/búsqueda de dataset y metadatos → src/modules/dataset.js (issue #12) */

/* escapeHtml → src/modules/ui.js (issue #8) */
/* setHtml → src/modules/ui.js (issue #8) */
/* formatInstructions → src/modules/ui.js (issue #8) */

/* ================================================================
/* Auth (overlay/submit/afterLogin/autofill) → src/modules/auth.js (issue #11) */
/* pullServerData, push*, scheduleSync, syncPending → src/modules/supabase.js (issue #10) */

/* Router (Router.currentTab/selectedDay/setTab/updateStopBtn/renderMain) -> src/modules/router.js (issue #17) */

/* renderRutina → src/modules/views-rutina.js (issue #18) */

function exerciseCard(ex, i, day){
  const color = DAY_COLORS[day] || "#888";
  const imgUrl = getExerciseImage(ex, Dataset.datasetCache);
  const apodo = getApodo(ex);
  const instr = formatInstructions(getInstrucciones(ex));
  const variantes = (ALTERNATIVAS[ex.dataset] || []).length;
  const instrRaw = getInstrucciones(ex);
  /* Primer ejercicio del día: imagen above-the-fold — sin lazy, alta prioridad
     (LCP image). El resto mantiene loading="lazy" para no competir. */
  const imgAttrs = i === 0
    ? `fetchpriority="high" decoding="async"`
    : `loading="lazy" decoding="async"`;

  return `<div class="ex-row">
    <div class="ex-top">
      <div class="ex-img" ${imgUrl?`data-img-zoom data-ex-name="${escapeHtmlAttr(ex.nombre_es)}" data-ex-dataset="${escapeHtmlAttr(ex.dataset||"")}" data-ex-dataset-original="${escapeHtmlAttr(ex.datasetOriginal||"")}" data-img-instr="${escapeHtmlAttr(instrRaw)}" role="button" tabindex="0" aria-label="Ampliar GIF de ${escapeHtmlAttr(apodo)}"`:""}>
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${escapeHtml(ex.nombre_es)}" ${imgAttrs} data-img-fallback="emoji">`
          : "🏋️"}
      </div>
      <div class="ex-info">
        <div style="display:flex;gap:6px;">
          <span class="ex-num" style="color:${escapeHtml(color)}">${escapeHtml(ex.orden)}</span>
          <span class="ex-name">${escapeHtml(apodo)}</span>
        </div>
        <div class="ex-stats">
          <span class="stat-chip"><b>${escapeHtml(ex.series)}</b> series</span>
          <span class="stat-chip"><b>${escapeHtml(ex.reps)}</b> reps</span>
          <span class="stat-chip">⚖️ <b>${escapeHtml(formatKg(ex.peso_kg))}</b> kg</span>
          <span class="stat-chip">⏱ <b>${escapeHtml(formatRest(ex.descanso_s))}</b></span>
          <span class="stat-chip">↔️ <b>${escapeHtml(variantes)}</b> alt.</span>
        </div>
        ${ex.notas ? `<div class="ex-notes">${escapeHtml(ex.notas)}</div>` : ""}
        ${instr ? `<button class="ex-instr-btn" data-instr-toggle="${i}">📖 Instrucciones</button>
        <div class="ex-instr" data-instr-body="${i}">${instr}</div>` : ""}
      </div>
    </div>
  </div>`;
}


/* Editar rutina (renderEditRoutine/handleEditRoutineEvent/picker) → src/modules/views-edit-rutina.js (issue #20) */
/* ================================================================
   VISTA SESIÓN sin scroll
   ================================================================ */
/* sessionProgress → src/modules/session.js (issue #16) */

/* renderSesion → src/modules/views-sesion.js (issue #19) */

/* ================================================================
   ACTUALIZACIÓN IN-PLACE (evita parpadeos al tocar kg/reps)
   ================================================================ */
/* updateSessionSetValues → src/modules/views-sesion.js (issue #19) */

/* STOP + pantalla resumen (guardado automático) */

/* computeSummary/showSummary → src/modules/views-sesion.js (issue #19) */

/* Guarda la sesión automáticamente (sin botones Guardar/Descartar) */
/* autoSaveSession → src/modules/session.js (issue #16) */



document.getElementById("stopSessionBtn").addEventListener("click", ()=>{
  if(Session.session) showSummary();
});

/* "Vale por hoy": cerrar resumen y volver a la Rutina */
document.getElementById("sumDoneToday").addEventListener("click", ()=>{
  setFocusTrap("summaryOverlay", null);
  document.getElementById("summaryOverlay").classList.remove("show");
  Session.session = null;
  clearSessionState();
  setTab("rutina");
  showToast("👍 ¡Buen entrenamiento!");
});
/* Temporizador de descanso + motivación → src/modules/rest-timer.js (issue #15) */
/* ================================================================
   VARIANTES (grid con GIFs, rellenan la pantalla)
   ================================================================ */
/* Variantes (getVariants/openVariants/selectVariant) → src/modules/views-sesion.js (issue #19) */





/* ================================================================
   HISTORIAL colapsable con apodos
   ================================================================ */
/* Estado historial (EditH.histMonthCursor/EditH.histActiveDate/EditH.editingHistRecord) → src/modules/views-historial.js (issue #21) */

/* getHistMonthSessions → src/modules/views-historial.js (issue #21) */

/* renderHistMonthNav → src/modules/views-historial.js (issue #21) */

/* renderHistCalendar → src/modules/views-historial.js (issue #21) */

/* renderHistDayDetail → src/modules/views-historial.js (issue #21) */


/* renderHistorial → src/modules/views-historial.js (issue #21) */

/* openEditHistSession → src/modules/views-historial.js (issue #21) */

/* dismissEditHist → src/modules/views-historial.js (issue #21) */

/* saveEditHist → src/modules/views-historial.js (issue #21) */

/* Handler de calendario de historial */
/* attachHistCalendarEvents → src/modules/views-historial.js (issue #21) */

/* Handlers de guardado/cancelado del overlay de edición historial */
/* attachEditHistOverlayEvents -> events.js (#23) */

/* Abre el picker de ejercicio para SUSTITUIR dentro del historial (F5) */
/* openHistExercisePicker → src/modules/views-historial.js (issue #21) */


/* ================================================================
/* renderAjustes → src/modules/views-ajustes.js (issue #22) */

/* ================================================================
   EVENTOS
   ================================================================ */
/* getExerciseBodyPart → src/modules/ui.js (issue #8) */

/* attachEvents (incl. swipe/drag) -> events.js (#23) */

/* ================================================================
   NUM PAD + SLIDER
   ================================================================ */

/* ================================================================
   NUM PAD + SLIDER
   ================================================================ */
/* numpad de sesión (openNumPad/closeNumPad/confirmNumPad) → src/modules/views-sesion.js (issue #19) */


/* F2: numpad para editar series/reps/kg de la rutina (sin sesión activa) */
/* numpad de rutina (VR.numPadRoutineCtx/openRoutineNumPad/confirmRoutineNumPad) → src/modules/views-rutina.js (issue #18) */
/* Listeners estaticos numpad/variantes/zoom -> events.js (#23) */
/* Listeners estaticos auth -> events.js (#23) */
document.getElementById("authSkip").addEventListener("click", ()=>{
  SB.authUser = null;
  Auth.showAuthOverlay(false);
  Router.renderMain();
});


/* ================================================================
   UTILIDADES
   ================================================================ */
/* showToast / vibrate / setFocusTrap → src/modules/ui.js (issue #8) */

/* Persistencia de sesión activa */
/* save/clearSessionState → src/modules/session.js (issue #16) */
/* clearSessionState → src/modules/session.js (issue #16) */
/* restoreRestState → src/modules/rest-timer.js (issue #15) */
/* restoreSession → src/modules/session.js (issue #16) */

/* Busca en el historial la última vez que se hizo este ejercicio y devuelve
   los sets reales ({kg,reps}) de esa sesión — respeta las diferencias de
   peso/reps entre series. Si no hay historial, devuelve null. */
/* getLastExercisePerformance → src/modules/session.js (issue #16) */

/* startSession → src/modules/session.js (issue #16) */

/* ================================================================
/* Header de sesión (fmtDuration/getSessionElapsed/updateSessionHeader/renderSessionProgressBar) → src/modules/session.js (issue #16) */

/* Listeners estaticos picker -> events.js (#23) */

/* ================================================================
   INIT
   ================================================================ */
/* attachStaticHandlers (tabs/rest/import-export) -> events.js (#23) */

(async function init(){
  /* CSS completo: pasa de media="print" (no bloquea render) a media="all" */
  const fullCssLink = document.getElementById("fullCssLink");
  if(fullCssLink && fullCssLink.media === "print"){ fullCssLink.media = "all"; }

  loadTrainingConfig();
  loadTrainingDays();
  /* Registrar UNA sola vez los handlers del overlay de edición de historial.
     (No puede estar en attachEvents(): ese se llama en cada renderMain y
     duplicaría el listener, provocando que "Añadir serie" añadiera muchas.) */
  window.EyeFit.Events.attachEditHistOverlayEvents();
  await runMigrations();
  if(DB && !P.historyLoaded) await loadHistoryFromDB();
  let authenticated = false;
  /* Lazy Supabase: solo cargar el SDK (~180KB) si hay sesión previa guardada.
     Sin sesión guardada, se salta el SDK y se muestra el overlay con "Continuar
     sin conexión" disponible. El SDK se carga bajo demanda al hacer login. */
  const supabaseRef = (()=>{ try{ return new URL(SUPABASE_URL).hostname.split(".")[0]; }catch(e){ return "vkaxxphminfinufitcyp"; } })();
  const supabaseStorageKey = `sb-${supabaseRef}-auth-token`;
  const hasStoredSession = (()=>{ try{ return !!localStorage.getItem(supabaseStorageKey); }catch(e){ return false; } })();
  if(hasStoredSession){
    try{
      await ensureSupabaseClient();
      const { data: authData } = await SB.sbClient.auth.getSession();
      SB.authUser = authData.session ? authData.session.user : null;
      /* Solo permitir acceso si el email está verificado */
      if(SB.authUser && Auth.isEmailVerified(SB.authUser)) authenticated = true;
      else{
        if(SB.authUser) await SB.sbClient.auth.signOut().catch(()=>{});
        SB.authUser = null;
        Auth.showAuthOverlay(true);
      }
    }catch(e){ Auth.authBlocked = true; Auth.showAuthOverlay(true); }
  } else {
    Auth.showAuthOverlay(true);
  }

  const datasetPromise = loadExerciseDataset();
  const metaPromise = loadExerciseMeta(); /* M5: metadatos músculo/equipamiento */
  getHistory(); /* F2-A2: saneamiento del historial al arrancar */
  restoreSession();
  Router.renderMain();
  Dataset.datasetCache = await datasetPromise;
  Dataset.exerciseMetaCache = await metaPromise.catch(()=>null);
  Router.renderMain();
  Router.updateStopBtn();
  showOnboarding();

  if(authenticated){
    await scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes de
       descargar y fusionar (evita ver sesiones locales no reflejadas). */
    await new Promise(r => setTimeout(r, 800));
    await pullServerData();
    Router.renderMain();
  }
})();

/* Fix subida automática: reintento cada 30s si hay pendientes */
setInterval(()=>{
  if(SB.authUser && SB.sbClient){
    const pending = getPending();
    if(pending.sessions.length > 0 || pending.routine){
      scheduleSync().then(()=>{
        if(Router.currentTab === "ajustes" || Router.currentTab === "historial") Router.renderMain();
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
        ensurePushSubscription(reg).then(sub => {
          if(sub && sub.endpoint) persistPushSubscription(sub);
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
            showToast("🔄 Nueva versión disponible");
            /* Activar la nueva versión: recarga automática no intrusiva.
               Si hay una sesión de entrenamiento en curso, esperamos a que el
               usuario termine (persistActiveSession guarda el estado en pagehide). */
            if(!Session.session){
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
      if(SB.authUser) scheduleSync();
    } else if(event.data && event.data.type === 'EYEFIT_RELOAD'){
      /* El usuario tocó la notificación push → recargar a la nueva versión */
      window.location.reload();
    }
  });
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    showToast("📲 Puedes instalar EyeFit en tu pantalla de inicio");
  });
  if(!window.showInstallBanner){
    window.showInstallBanner = ()=> { return deferredPrompt; };
  }
  function registerBgSync(){
    if(!('sync' in navigator)) return;
    const pending = getPending();
    if((pending.sessions.length > 0 || pending.routine) && SB.authUser){
      navigator.sync.register('eyefit-sync').catch(()=>{});
    }
  }
  setInterval(registerBgSync, 60000);
}

window.addEventListener("online", async ()=>{
  showToast("🌐 Conexión restablecida");
  if(SB.authUser){
    await scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes del pull */
    await new Promise(r => setTimeout(r, 800));
    await pullServerData();
    Router.renderMain();
  }
});
function persistActiveSession(){
  if(Session.session && Session.session.exercises && !Session.session.saved){
    Session.session.elapsed = Math.floor((Date.now()-session.startTime)/1000)+Session.session.baseElapsed;
    saveSessionState();
  }
}
window.addEventListener("pagehide", persistActiveSession);
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState === "hidden"){
    persistActiveSession();
  } else if(document.visibilityState === "visible"){
    /* Al volver a la app: recalcular el descanso con el tiempo real */
    if(EyeFit.RestTimer.restActive && !EyeFit.RestTimer.restPaused){
      EyeFit.RestTimer.recomputeRestRemaining();
      if(EyeFit.RestTimer.restRemaining <= 0){
        EyeFit.RestTimer.restFinished();
      } else {
        EyeFit.RestTimer.renderRestTime();
      }
    }
    /* Sincronizar pendientes al volver */
    if(SB.authUser && SB.sbClient && navigator.onLine){
      scheduleSync().then(()=>{
        if(Router.currentTab === "ajustes" || Router.currentTab === "historial") Router.renderMain();
      });
      if(Router.currentTab === "historial"){
        pullServerData().then(()=>{
          if(Router.currentTab === "historial") Router.renderMain();
        });
      }
    }
  }
});

document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    for(const id of ["numOverlay","varOverlay","authOverlay","summaryOverlay","imgZoomOverlay","swipeConfirmOverlay"]){
      const el = document.getElementById(id);
      if(el && el.classList.contains("show")){
        setFocusTrap(id, null);
        el.classList.remove("show");
        if(id === "authOverlay") SB.authUser = null;
        break;
      }
    }
  }
});
document.addEventListener("pageshow", async ()=>{
  if(SB.authUser && SB.sbClient && navigator.onLine){
    await scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes del pull */
    await new Promise(r => setTimeout(r, 800));
    await pullServerData();
    if(Router.currentTab === "historial") Router.renderMain();
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
  setFocusTrap("onboardOverlay", ov);
}
function closeOnboarding(){
  const ov = document.getElementById("onboardOverlay");
  if(ov) ov.classList.remove("show");
  setFocusTrap("onboardOverlay", null);
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


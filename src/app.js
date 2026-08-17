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

/* ================================================================
   ROUTER
   ================================================================ */
let currentTab = "rutina";
let selectedDay = null;
/* Dataset.datasetCache/Dataset.exerciseMetaCache → src/modules/dataset.js (issue #12) */
/* Session.session → src/modules/session.js (issue #16) */

function setTab(tab){
  currentTab = tab;
  document.querySelectorAll(".tabbtn").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  updateStopBtn();
  /* Al entrar en el tab "historial" con cuenta + online, refrescar desde
     el servidor para asegurar que se muestran TODAS las sesiones guardadas
     (no solo las locales). El refresh es async: renderMain() muestra lo
     que hay ahora y se re-renderiza cuando lleguen los datos. */
  if(tab === "historial" && SB.authUser && SB.sbClient && navigator.onLine){
    pullServerData().then(()=>{
      if(currentTab === "historial") renderMain();
    });
  }
  renderMain();
}
function updateStopBtn(){
  const btn = document.getElementById("stopSessionBtn");
  if(btn) btn.style.display = (currentTab==="sesion" && Session.session) ? "block" : "none";
}
let routineEditMode = false;

let lastRenderedHtml = "";
function renderMain(){
  const main = document.getElementById("main");
  updateSessionHeader();
  if(routineEditMode && currentTab === "rutina"){
    const html = renderEditRoutine();
    if(lastRenderedHtml !== html){
      setHtml(main, html);
      lastRenderedHtml = html;
      attachEvents();
    }
    return;
  }
  const views = { rutina:renderRutina, sesion:renderSesion, historial:renderHistorial, ajustes:renderAjustes };
  const html = views[currentTab] ? views[currentTab]() : renderRutina();
  if(lastRenderedHtml !== html){
    setHtml(main, html);
    lastRenderedHtml = html;
    attachEvents();
  }
}

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
function attachEditHistOverlayEvents(){
  const ov = document.getElementById("editHistOverlay");
  if(!ov) return;
  const closeBtn = document.getElementById("editHistClose");
  if(closeBtn) closeBtn.addEventListener("click", dismissEditHist);
  const cancelBtn = document.getElementById("editHistCancel");
  if(cancelBtn) cancelBtn.addEventListener("click", dismissEditHist);
  const saveBtn = document.getElementById("editHistSave");
  if(saveBtn) saveBtn.addEventListener("click", saveEditHist);

  /* Preseleccionar al enfocar */
  ov.querySelectorAll(".ehs-input").forEach(inp=>{
    inp.addEventListener("focus", ()=>{ setTimeout(()=>{ inp.select(); },0); });
  });

  /* Añadir serie a un ejercicio (delegación porque se recrean dinámicamente) */
  ov.addEventListener("click", (e)=>{
    const addBtn = e.target.closest("[data-eh-add-set]");
    const delBtn = e.target.closest("[data-eh-del]");
    const delExBtn = e.target.closest("[data-eh-del-ex]");
    const swapBtn = e.target.closest("[data-eh-swap]");
    if(addBtn){
      const ei = parseInt(addBtn.dataset.ehAddSet);
      const ex = EditH.editingHistRecord && EditH.editingHistRecord.exercises && EditH.editingHistRecord.exercises[ei];
      if(!ex) return;
      const last = ex.sets && ex.sets[ex.sets.length-1];
      if(!ex.sets) ex.sets = [];
      ex.sets.push({
        kg: last && last.kg != null ? last.kg : (parseFloat(ex.peso_kg)||0),
        reps: last && last.reps != null ? last.reps : (parseInt(ex.reps)||8),
        done: true
      });
      /* Re-renderizar el overlay para mostrar la nueva fila */
      openEditHistSession(EditH.editingHistRecord);
    }
    if(delBtn){
      const [ei, si] = delBtn.dataset.ehDel.split("|").map(Number);
      const ex = EditH.editingHistRecord && EditH.editingHistRecord.exercises && EditH.editingHistRecord.exercises[ei];
      if(!ex || !ex.sets) return;
      ex.sets.splice(si, 1);
      openEditHistSession(EditH.editingHistRecord);
    }
    if(delExBtn){
      const ei = parseInt(delExBtn.dataset.ehDelEx);
      if(!EditH.editingHistRecord || !Array.isArray(EditH.editingHistRecord.exercises)) return;
      EditH.editingHistRecord.exercises.splice(ei, 1);
      openEditHistSession(EditH.editingHistRecord);
    }
    if(swapBtn){
      const ei = parseInt(swapBtn.dataset.ehSwap);
      if(!EditH.editingHistRecord || !Array.isArray(EditH.editingHistRecord.exercises)) return;
      EditR.editHistSubIdx = ei;
      /* Abrir el picker de ejercicios en modo sustitución */
      openHistExercisePicker();
    }
  });
}

/* Abre el picker de ejercicio para SUSTITUIR dentro del historial (F5) */
/* openHistExercisePicker → src/modules/views-historial.js (issue #21) */


/* ================================================================
   AJUSTES
   ================================================================ */
function renderAjustes(){
  const routineSrc = lsGet(K.routine, null) ? "Archivo importado" : "Rutina integrada";
  const routine = getRoutine();
  const pending = getPending();
  const pendingCount = pending.sessions.length;
  const syncMsg = Number(pendingCount)>0
    ? `${escapeHtml(pendingCount)} sesión${Number(pendingCount)>1?"es":""} pendiente${Number(pendingCount)>1?"s":""} de subir`
    : SB.authUser ? "Todo sincronizado" : "Sin conexión a la nube";
  const syncClass = pendingCount>0 ? "pending" : (SB.authUser ? "" : "off");
  const tc = Config.trainingConfig;

  return `<div class="section active">
    <h2 class="title">Ajustes</h2>
    <div class="set-group">
      <div class="set-group-title">Cuenta</div>
      <div class="set-row-item">
        <div>
          <div class="label">${SB.authUser ? escapeHtml(SB.authUser.email) : "Sin sesión"}</div>
          <div class="desc"><span class="sync-status ${syncClass}"><span class="dot"></span> ${syncMsg}</span></div>
        </div>
        ${SB.authUser
          ? `<button class="btn btn-outline" data-logout>🚪 Salir</button>${pendingCount>0?`<button class="btn" data-sync-now>🔄 Subir</button>`:""}`
          : `<button class="btn" data-open-auth>🔑 Acceder</button>`}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">🏋️ Entrenamiento</div>
      <div class="set-row-item">
        <div><div class="label">Peso corporal</div><div class="desc">Para métricas relativas a tu masa</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.peso_corporal)}" data-train-input="peso_corporal" data-float="1" step="0.5" min="30">
      </div>
      <div class="set-row-item">
        <div><div class="label">Tipo de progresión</div><div class="desc">Doble progresión (recomendada) o lineal</div></div>
        <select class="set-select" data-train-select="tipo_progresion">
          <option value="doble" ${tc.tipo_progresion==="doble"?"selected":""}>Doble progresión</option>
          <option value="lineal" ${tc.tipo_progresion==="lineal"?"selected":""}>Lineal</option>
        </select>
      </div>
      <div class="prog-info">
        <details>
          <summary>ℹ️ ¿Qué tipo de progresión elegir?</summary>
          <div class="prog-body">
            <b style="color:var(--accent)">Doble progresión</b>: dentro de un rango de reps (p. ej. 6-10), primero subes repeticiones. Cuando llegas al tope del rango, subes el peso y vuelves a empezar desde el mínimo. Es el estándar de hipertrofia.
            <br><br>
            <b style="color:var(--accent)">Lineal</b>: subes peso cada sesión en cuanto alcanzas el tope del rango, sin variar reps. Más simple, pero el progreso se estanca antes.
          </div>
        </details>
      </div>
      <div class="set-row-item" style="flex-wrap:wrap;">
        <div style="width:100%;"><div class="label">Días de entrenamiento</div><div class="desc">L M X J V S D</div></div>
        <div class="train-days" style="width:100%;">
          ${[["L","Lunes"],["M","Martes"],["X","Miércoles"],["J","Jueves"],["V","Viernes"],["S","Sábado"],["D","Domingo"]].map(([lbl,full])=>`
            <button class="train-day-chip ${Config.trainingDays.includes(full)?"on":""}" data-train-day="${full}" aria-label="${full}">${lbl}</button>
          `).join("")}
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rango reps compuestos</div><div class="desc">Sentadilla, press banca, remo…</div></div>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_compuesto_min)}" data-train-input="rango_compuesto_min" min="1" max="20">
          <span style="color:var(--muted);font-size:10px;">–</span>
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_compuesto_max)}" data-train-input="rango_compuesto_max" min="1" max="30">
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rango reps aislamiento</div><div class="desc">Curls, elevaciones, extensiones…</div></div>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_aislamiento_min)}" data-train-input="rango_aislamiento_min" min="1" max="20">
          <span style="color:var(--muted);font-size:10px;">–</span>
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_aislamiento_max)}" data-train-input="rango_aislamiento_max" min="1" max="30">
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">RIR objetivo</div><div class="desc">Reps en reserva al terminar cada serie (2 = casi al fallo)</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.rir_objetivo)}" data-train-input="rir_objetivo" min="0" max="5">
      </div>
      <div class="set-row-item">
        <div><div class="label">Incremento barra</div><div class="desc">Kilos a subir en ejercicios con barra</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.incremento_barra)}" data-train-input="incremento_barra" data-float="1" step="0.5" min="0.5">
      </div>
      <div class="set-row-item">
        <div><div class="label">Incremento mancuerna</div><div class="desc">Kilos a subir en ejercicios con mancuernas</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.incremento_mancuerna)}" data-train-input="incremento_mancuerna" data-float="1" step="0.5" min="0.5">
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Rutina</div>
      <div class="set-row-item">
        <div>
          <div class="label">Rutina actual: <b class="accent">${escapeHtml(routineSrc)}</b></div>
          <div class="desc">${escapeHtml(routine.length)} ejercicios · Lunes-Viernes</div>
        </div>
      </div>
      <div class="prog-info">
        <details>
          <summary>💪 Músculo y equipamiento de los ejercicios</summary>
          <div class="prog-body">
            ${routine.length ? routine
              .slice(0, 40)
              .map(e=>{
                const meta = getExerciseMeta(e.dataset || e.nombre_es);
                if(!meta) return "";
                const muscle = meta.muscle || e.nombre_es;
                const equip = meta.equip || "";
                const secondary = (Array.isArray(meta.secondary) && meta.secondary.length)
                  ? " · Sec.: " + meta.secondary.join(", ")
                  : "";
                return `<div class="meta-ex-row">
                  <b>${escapeHtml(getApodo(e))}</b>
                  <span class="meta-ex-tags">${escapeHtml(muscle)}${equip ? " · " + escapeHtml(equip) : ""}${escapeHtml(secondary)}</span>
                </div>`;
              }).join("")
              : "<div class=\"empty-state\">Sin ejercicios</div>"}
          </div>
        </details>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rutina (.xlsx)</div><div class="desc">Importa o descarga tu hoja de cálculo</div></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn" data-import-xlsx>📥 Importar</button>
          <button class="btn btn-outline" data-export-xlsx>📤 Exportar</button>
        </div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Ayuda</div>
      <div class="set-row-item">
        <div><div class="label">Ver guía de inicio</div><div class="desc">Repasa cómo usar EyeFit</div></div>
        <button class="btn btn-outline" data-open-help>❓</button>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">🔔 Notificaciones</div>
      <div class="set-row-item">
        <div>
          <div class="label">Actualizaciones de la app</div>
          <div class="desc">${isPushEnabled() ? "Activas: te avisamos cuando hay una versión nueva" : "No activas. Recibirás avisos de nuevas versiones."}</div>
        </div>
        ${isPushEnabled()
          ? `<button class="btn btn-outline" data-disable-push>🔕 Desactivar</button>`
          : `<button class="btn" data-enable-push>🔔 Activar</button>`}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Datos</div>
      <div class="set-row-item">
        <div><div class="label">Exportar backup (.json)</div><div class="desc">Rutina + historial</div></div>
        <button class="btn btn-outline" data-export-backup>📤 Exportar</button>
        &nbsp;
        <button class="btn" data-import-backup>📥 Importar</button>
      </div>
    </div>
    <div class="set-group danger-zone">
      <div class="set-group-title danger-zone-title">⚠️ Danger Zone</div>
      <div class="set-row-item">
        <div><div class="label">Datos</div><div class="desc">Borrar historial o restablecer la rutina</div></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-danger" data-clear-history>🗑️ Borrar historial</button>
          <button class="btn btn-outline" data-reset-routine>↺ Restablecer</button>
        </div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Acerca de</div>
      <div class="about-block">
        <details class="about-details">
          <summary>📘 Sobre EyeFit</summary>
          <div class="about-sub">
            <details>
              <summary>Descripción</summary>
              <div class="about-body">
                Web app de entrenamiento privada (PWA) con progresión automática basada en doble progresión + RIR (Reps In Reserve), el estándar avalado por la literatura científica de hipertrofia.
              </div>
            </details>
            <details>
              <summary>Versión</summary>
              <div class="about-body">v2.1.0 · PWA sincronizada en la nube</div>
            </details>
            <details>
              <summary>Referencias</summary>
              <div class="about-body">
                • Dataset de ejercicios: <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">hasaneyldrm/exercises-dataset</a><br>
                • Fórmula 1RM de Epley<br>
                • Criterios de doble progresión para hipertrofia
              </div>
            </details>
          </div>
        </details>
      </div>
    </div>
  </div>`;
}

/* ================================================================
   EVENTOS
   ================================================================ */
/* getExerciseBodyPart → src/modules/ui.js (issue #8) */

function attachEvents(){
  /* --- Modo edición rutina --- */
  document.querySelectorAll("[data-edit-routine]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      routineEditMode = true;
      EditR.routineEditDay = btn.dataset.editRoutineDay || selectedDay || null;
      renderMain();
    });
  });
  document.querySelectorAll("[data-edit-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ EditR.routineEditDay = el.dataset.editDay; renderMain(); });
  });
  /* Cancelar edición sin guardar */
  document.querySelectorAll("[data-edit-cancel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      /* Limpiar cambios temporales (_edit_*) sin guardar */
      const routine = getRoutine();
      for(const ex of routine){
        for(const k of Object.keys(ex)){
          if(k.startsWith("_edit_")) delete ex[k];
        }
      }
      setRoutine(routine);
      routineEditMode = false;
      EditR.routineEditDay = null;
      renderMain();
      showToast("✕ Edición cancelada");
    });
  });
  document.querySelectorAll("[data-edit-done]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      /* Aplicar cambios temporales (_edit_*) a los valores reales */
      const routine = getRoutine();
      for(const ex of routine){
        for(let k=1; k<=20; k++){
          if(ex[`_edit_kg${k}`] !== undefined){
            ex["kg"+k] = ex[`_edit_kg${k}`];
            delete ex[`_edit_kg${k}`];
          }
          if(ex[`_edit_reps${k}`] !== undefined){
            ex["reps"+k] = ex[`_edit_reps${k}`];
            delete ex[`_edit_reps${k}`];
          }
          delete ex[`_edit_kg${k}`];
          delete ex[`_edit_reps${k}`];
        }
        if(ex["_edit_dirty_set"]) delete ex._edit_dirty_set;
        /* Recalcular peso_kg y reps a partir del primer set */
        if(ex["kg1"] !== undefined) ex.peso_kg = ex["kg1"];
        if(ex["reps1"] !== undefined) ex.reps = ex["reps1"];
      }
      setRoutine(routine);
      if(SB.sbClient && SB.authUser) pushRoutineToServer();
      routineEditMode = false;
      EditR.routineEditDay = null;
      renderMain();
      showToast("💾 Rutina guardada");
    });
  });
  document.querySelectorAll("[data-edit-ex-add],[data-edit-add-ex]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const day = EditR.routineEditDay || selectedDay;
      if(day) openExercisePicker(day);
    });
  });
  /* Todos los botones del editor usando un único selector */
  document.querySelectorAll("[data-edit-ex-toggle],[data-edit-ex-up],[data-edit-ex-down],[data-edit-ex-del],[data-edit-set-kg],[data-edit-set-reps],[data-edit-set-del],[data-edit-add-set]").forEach(btn=>{
    if(btn.dataset.editSetKg !== undefined || btn.dataset.editSetReps !== undefined){
      btn.addEventListener("change", ()=>{ handleEditRoutineEvent(btn); });
      /* Preseleccionar el número original al enfocar */
      btn.addEventListener("focus", ()=>{
        setTimeout(()=>{ btn.select(); }, 0);
      });
    } else {
      btn.addEventListener("click", ()=>{ handleEditRoutineEvent(btn); });
    }
  });
  document.querySelectorAll("[data-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ selectedDay = el.dataset.day; renderMain(); });
    el.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        selectedDay = el.dataset.day;
        renderMain();
      }
    });
  });
  /* Carrusel rutina: detectar día central al deslizar horizontalmente (F3/F4) */
  const carousel = document.getElementById("routineCarousel");
  if(carousel){
    /* Inicialmente centrar en el día seleccionado */
    const activeCell = carousel.querySelector(".rc-active");
    if(activeCell){
      const wrapper = activeCell.parentElement;
      const left = activeCell.offsetLeft - (wrapper.clientWidth - activeCell.offsetWidth) / 2;
      requestAnimationFrame(()=>{ wrapper.scrollLeft = Math.max(0, left); });
    }
    let _scrollLock = false;
    carousel.addEventListener("scroll", ()=>{
      if(_scrollLock) return;
      _scrollLock = true;
      clearTimeout(carousel._scrollTimer);
      carousel._scrollTimer = setTimeout(()=>{
        const cells = carousel.querySelectorAll(".rc-cell");
        const centerX = carousel.scrollLeft + carousel.clientWidth / 2;
        let best = null, bestDist = Infinity;
        cells.forEach(c=>{
          const cLeft = c.offsetLeft;
          const cMid = cLeft + c.offsetWidth / 2;
          const dist = Math.abs(cMid - centerX);
          if(dist < bestDist){ bestDist = dist; best = c; }
        });
        _scrollLock = false;
        if(best && best.dataset.day && best.dataset.day !== selectedDay){
          selectedDay = best.dataset.day;
          renderMain();
        }
      }, 90);
      _scrollLock = false;
    }, { passive:true });
  }
  /* F2: editar series/reps/kg de la rutina tocando directamente en las cards */
  document.querySelectorAll("[data-rt-edit]").forEach(el=>{
    el.addEventListener("click", ()=>{
      openRoutineNumPad(el);
    });
    el.addEventListener("keydown", (e)=>{
      if(e.key==="Enter" || e.key===" "){ e.preventDefault(); openRoutineNumPad(el); }
    });
  });

  /* UX7: al tocar el valor 1RM, mostrar la explicación de Epley (para touch) */
  document.querySelectorAll("[data-has-rm='1']").forEach(el=>{
    el.addEventListener("click", (e)=>{
      e.stopPropagation();
      const tip = el.getAttribute("title") || "1RM estimado";
      showToast("💡 " + tip);
    });
  });
  /* Fallback de imágenes delegado: cualquier <img data-img-fallback> que
     falle se oculta o se sustituye por un emoji sin inline onerror. */
  document.querySelectorAll("img[data-img-fallback]").forEach(img=>{
    img.addEventListener("error", ()=>{
      const fb = img.dataset.imgFallback;
      if(fb === "emoji"){
        const parent = img.parentElement;
        if(parent) parent.innerHTML = "🏋️";
      } else {
        img.remove();
      }
    }, { once:true });
  });
  document.querySelectorAll("[data-instr-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const body = document.querySelector(`[data-instr-body="${btn.dataset.instrToggle}"]`);
      if(body){ body.classList.toggle("show"); btn.textContent = body.classList.contains("show")?"📖 Ocultar":"📖 Instrucciones"; }
    });
  });
  document.querySelectorAll("[data-start-session]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ startSession(btn.dataset.startSession); });
  });
  /* Confirmación de inicio de sesión para el día actual */
  document.querySelectorAll("[data-start-session-confirm]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const day = btn.dataset.startSessionConfirm;
      const routine = getRoutine();
      const dayEx = routine.filter(e=>e.dia===day).sort((a,b)=>(a.orden||0)-(b.orden||0));
      if(!dayEx.length) return;
      /* Construir modal de confirmación dentro de la vista actual */
      const exList = dayEx.map((e,i)=>{
        const img = getExerciseImage(e, Dataset.datasetCache);
        return `<div class="confirm-ex-row">
          ${img?`<img src="${escapeHtmlAttr(img)}" alt="" class="confirm-ex-img" data-img-fallback="hide">`:""}
          <span class="confirm-ex-name">${escapeHtml(getApodo(e))}</span>
          <span class="confirm-ex-meta">${escapeHtml(e.series)}×${escapeHtml(e.reps)} <b>${escapeHtml(formatKg(e.peso_kg))}</b>kg</span>
        </div>`;
      }).join("");
      const totalSets = dayEx.reduce((a,e)=>a+Number(e.series||3),0);
      const modal = document.createElement("div");
      modal.className = "Session.session-confirm-overlay";
      modal.innerHTML = `
        <div class="Session.session-confirm-card">
          <div class="sc-title">Entrenamiento del ${escapeHtml(day)}</div>
          <div class="sc-sub">${escapeHtml(dayEx.length)} ejercicios · ${escapeHtml(totalSets)} series</div>
          <div class="sc-list">${exList}</div>
          <button class="btn sc-start" data-sc-start>▶️ Entrenar</button>
          <button class="btn btn-outline sc-cancel" data-sc-cancel>Cancelar</button>
        </div>`;
      const mainEl = document.getElementById("main");
      mainEl.appendChild(modal);
      modal.querySelector("[data-sc-start]").addEventListener("click", ()=>{
        modal.remove();
        startSession(day);
      });
      modal.querySelector("[data-sc-cancel]").addEventListener("click", ()=>{
        modal.remove();
      });
    });
  });

  /* Steppers: actualización in-place (sin parpadeo) + propagación de kg y reps a las siguientes */
  document.querySelectorAll("[data-kg-plus],[data-kg-minus],[data-reps-plus],[data-reps-minus]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session.session) return;
      const ex = Session.session.exercises[Session.session.currentIdx];
      const si = parseInt(btn.dataset.kgPlus ?? btn.dataset.kgMinus ?? btn.dataset.repsPlus ?? btn.dataset.repsMinus);
      const set = ex.sets[si];
      if(btn.dataset.kgPlus) set.kg = +(set.kg+0.5).toFixed(1);
      if(btn.dataset.kgMinus) set.kg = Math.max(0, +(set.kg-0.5).toFixed(1));
      if(btn.dataset.repsPlus) set.reps = set.reps+1;
      if(btn.dataset.repsMinus) set.reps = Math.max(1, set.reps-1);
      for(let j=si+1; j<ex.sets.length; j++){
        if(btn.dataset.kgPlus || btn.dataset.kgMinus) ex.sets[j].kg = set.kg;
        if(btn.dataset.repsPlus || btn.dataset.repsMinus) ex.sets[j].reps = set.reps;
      }
      saveSessionState();
      updateSessionSetValues();
    });
  });
  document.querySelectorAll("[data-edit]").forEach(el=>{
    el.addEventListener("click", ()=> openNumPad(parseInt(el.dataset.edit), el.dataset.field));
    el.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openNumPad(parseInt(el.dataset.edit), el.dataset.field);
      }
    });
  });
  document.querySelectorAll("[data-set-done]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session.session) return;
      const ex = Session.session.exercises[Session.session.currentIdx];
      const si = parseInt(btn.dataset.setDone);
      const set = ex.sets[si];
      if(set.done) return;
      set.done = true;
      checkPR(ex, set);
      vibrate(30);
      saveSessionState();
      if(ex.currentSet < ex.sets.length){
        ex.currentSet++;
        EyeFit.RestTimer.startRest(ex.descanso_s);
        renderMain();
      } else {
        /* Última serie del ejercicio: descanso antes de pasar al siguiente */
        ex.completed = true;
        if(Session.session.currentIdx+1 < Session.session.exercises.length){
          Session.session.currentIdx++;
          EyeFit.RestTimer.startRest(ex.descanso_s); /* Descanso inter-ejercicio */
          renderMain();
        } else {
          /* Fin de la sesión */
          EyeFit.RestTimer.stopRest();
          showSummary();
        }
      }
    });
  });
  /* Eliminar una serie completada mediante swipe (confirmación visual) */
  let swipeDeleteSet = null;
  function askDeleteSet(si, rowEl){
    if(!Session.session) return;
    swipeDeleteSet = si;
    const ov = document.getElementById("swipeConfirmOverlay");
    if(ov){
      const ex = Session.session.exercises[Session.session.currentIdx];
      const set = ex.sets[si];
      document.getElementById("swipeConfirmText").textContent =
        `¿Eliminar la serie ${si+1} (${set.kg}kg × ${set.reps})?`;
      ov.classList.add("show");
      setFocusTrap("swipeConfirmOverlay", ov);
    }
  }
  /* Swipe a la izquierda en la fila de la serie */
  function attachSwipeRow(row){
    if(!row || row._swipeAttached) return;
    row._swipeAttached = true;
    let startX = 0, startY = 0, currentX = 0, dragging = false, locked = false;
    const content = row.querySelector(".set-row-content");
    const SWIPE_LIMIT = 90;
    function setOffset(off){
      currentX = Math.max(-SWIPE_LIMIT, Math.min(0, off));
      if(content) content.style.transform = `translateX(${currentX}px)`;
    }
    row.addEventListener("touchstart", (e)=>{
      if(row.classList.contains("swiped")) return;
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; dragging = true;
      locked = false;
    }, { passive:true });
    row.addEventListener("touchmove", (e)=>{
      if(!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      /* Evitar conflicto con scroll vertical */
      if(!locked){
        if(Math.abs(dy) > Math.abs(dx)){ dragging = false; return; }
        locked = true;
      }
      if(locked) setOffset(dx);
    }, { passive:true });
    row.addEventListener("touchend", ()=>{
      if(!dragging) return;
      dragging = false;
      if(currentX <= -SWIPE_LIMIT/2){
        row.classList.add("swiped");
        setOffset(-SWIPE_LIMIT);
        /* Mostrar confirmación visual */
        const si = parseInt(row.dataset.swipeSet);
        askDeleteSet(si, row);
      } else {
        setOffset(0);
      }
    }, { passive:true });
    /* Fallback ratón para escritorio */
    row.addEventListener("mousedown", (e)=>{
      if(row.classList.contains("swiped")) return;
      startX = e.clientX; startY = e.clientY; dragging = true; locked = false;
    });
    window.addEventListener("mousemove", (e)=>{
      if(!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if(!locked){
        if(Math.abs(dy) > Math.abs(dx)){ dragging = false; return; }
        locked = true;
      }
      if(locked) setOffset(dx);
    });
    window.addEventListener("mouseup", ()=>{
      if(!dragging) return;
      dragging = false;
      if(currentX <= -SWIPE_LIMIT/2){
        row.classList.add("swiped");
        setOffset(-SWIPE_LIMIT);
        const si = parseInt(row.dataset.swipeSet);
        askDeleteSet(si, row);
      } else {
        setOffset(0);
      }
    });
    /* Tocar otra serie cierra las abiertas */
    row.addEventListener("click", ()=>{
      if(row.classList.contains("swiped")) return;
      document.querySelectorAll(".set-row.swiped").forEach(r=>{
        if(r !== row){
          r.classList.remove("swiped");
          const c = r.querySelector(".set-row-content");
          if(c) c.style.transform = "translateX(0)";
        }
      });
    });
  }
  document.querySelectorAll(".set-row[data-swipe-set]").forEach(attachSwipeRow);
  /* Botón confirmar eliminación por swipe */
  document.getElementById("swipeConfirmOk").addEventListener("click", ()=>{
    const ov = document.getElementById("swipeConfirmOverlay");
    ov.classList.remove("show");
    setFocusTrap("swipeConfirmOverlay", null);
    if(!Session.session || swipeDeleteSet === null) return;
    const ex = Session.session.exercises[Session.session.currentIdx];
    if(ex.sets.length <= 1){
      showToast("⚠️ No puedes eliminar la única serie");
      document.querySelectorAll(".set-row.swiped").forEach(r=>{
        r.classList.remove("swiped");
        const c = r.querySelector(".set-row-content");
        if(c) c.style.transform = "translateX(0)";
      });
      swipeDeleteSet = null;
      return;
    }
    ex.sets.splice(swipeDeleteSet,1);
    if(ex.currentSet > swipeDeleteSet+1) ex.currentSet--;
    if(ex.currentSet > ex.sets.length) ex.currentSet = ex.sets.length;
    if(ex.currentSet < 1) ex.currentSet = 1;
    if(ex.sets.every(s=>s.done)) ex.completed = true; else ex.completed = false;
    saveSessionState();
    renderMain();
    showToast("🗑️ Serie eliminada");
    swipeDeleteSet = null;
  });
  document.getElementById("swipeConfirmCancel").addEventListener("click", ()=>{
    document.getElementById("swipeConfirmOverlay").classList.remove("show");
    setFocusTrap("swipeConfirmOverlay", null);
    /* Cerrar el swipe abierto */
    document.querySelectorAll(".set-row.swiped").forEach(r=>{
      r.classList.remove("swiped");
      const c = r.querySelector(".set-row-content");
      if(c) c.style.transform = "translateX(0)";
    });
    swipeDeleteSet = null;
  });
  /* Ampliar GIF (overlay) — todas las miniaturas ampliables */
  document.querySelectorAll("[data-img-zoom]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const img = el.querySelector("img");
      if(!img || !img.src) return;
      const zoomImg = document.getElementById("zoomImg");
      zoomImg.src = img.src;
      zoomImg.alt = img.alt || "";
      /* Mostrar instrucciones del ejercicio debajo del GIF */
      const instrEl = document.getElementById("zoomInstr");
      if(instrEl){
        let instrText = el.getAttribute("data-img-instr") || "";
        if(!instrText){
          const ds = el.getAttribute("data-ex-dataset-original") || el.getAttribute("data-ex-dataset") || "";
          const nm = el.getAttribute("data-ex-name") || "";
          if(ds && INSTRUCCIONES[ds]) instrText = INSTRUCCIONES[ds];
          else if(nm){
            /* Buscar en dataset actual */
            const found = Dataset.datasetCache ? (findExerciseInDataset(Dataset.datasetCache, ds||nm)) : null;
            instrText = (found && found.instructions) ? found.instructions : "";
          }
        }
        if(instrText){
          instrEl.innerHTML = `<div class="zi-title">📖 Instrucciones</div>` + formatInstructions(instrText);
        } else {
          instrEl.innerHTML = "";
        }
      }
      document.getElementById("imgZoomOverlay").classList.add("show");
      setFocusTrap("imgZoomOverlay", document.getElementById("imgZoomOverlay"));
    });
    el.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        el.click();
      }
    });
  });
  /* Instrucciones en sesión (colapsable) */
  document.querySelectorAll("[data-instr-session-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const body = document.querySelector(`[data-instr-session-body]`);
      if(body){
        body.classList.toggle("show");
        btn.textContent = body.classList.contains("show") ? "📖 Ocultar" : "📖 Instrucciones";
      }
    });
  });
  /* Reordenar ejercicios pendientes */
  document.querySelectorAll("[data-move-up],[data-move-down]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session.session) return;
      const idx = parseInt(btn.dataset.moveUp ?? btn.dataset.moveDown);
      const dir = btn.dataset.moveUp ? -1 : 1;
      const j = idx + dir;
      if(j < 0 || j >= Session.session.exercises.length) return;
      const arr = Session.session.exercises;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      /* Reasignar orden visual (1..n) */
      arr.forEach((e,i)=>{ e.orden = i+1; });
      saveSessionState();
      renderMain();
    });
  });
  /* Añadir una serie extra */
  document.querySelectorAll("[data-add-set]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session.session) return;
      const ex = Session.session.exercises[Session.session.currentIdx];
      const last = ex.sets[ex.sets.length-1] || { kg:parseFloat(ex.peso_kg)||0, reps:parseInt(ex.reps)||8 };
      ex.sets.push({ kg:last.kg, reps:last.reps, done:false });
      ex.completed = false;
      saveSessionState();
      renderMain();
    });
  });
  document.querySelectorAll("[data-open-variants]").forEach(btn=>{
    btn.addEventListener("click", openVariants);
  });
  document.querySelectorAll("[data-import-xlsx]").forEach(btn=>{
    btn.addEventListener("click", ()=>document.getElementById("fileInput").click());
  });
  document.querySelectorAll("[data-export-xlsx]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await exportRoutineXlsx(); showToast("📤 rutina.xlsx descargado"); });
  });
  /* Fase C: backup JSON (rutina + historial) */
  document.querySelectorAll("[data-export-backup]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const payload = {
        app: "eyefit",
        version: 2,
        exportedAt: new Date().toISOString(),
        routine: getRoutine(),
        history: getHistory()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "eyefit-backup.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
      showToast("📦 Backup exportado");
    });
  });
  document.querySelectorAll("[data-import-backup]").forEach(btn=>{
    btn.addEventListener("click", ()=>document.getElementById("jsonFileInput").click());
  });
  document.querySelectorAll("[data-clear-history]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Borrar todo el historial?")){
        await saveHistory([]);
        /* Nota: saveHistory([]) con el mutex ya persiste [] a IndexedDB o localStorage.
           Eliminar DB.clearHistoryDB() redundante que podría interrumpir el mutex. */
        const p = getPending(); p.sessions = []; setPending(p);
        if(SB.sbClient && SB.authUser){ try{ await SB.sbClient.from("sesiones").delete().eq("user_id", SB.authUser.id); }catch(e){} }
        renderMain(); showToast("🗑️ Historial borrado");
      }
    });
  });
  document.querySelectorAll("[data-reset-routine]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      localStorage.removeItem(K.routine);
      selectedDay = null;
      if(SB.sbClient && SB.authUser){ try{ await SB.sbClient.from("rutinas").delete().eq("user_id", SB.authUser.id); }catch(e){} }
      showToast("↺ Rutina restaurada");
      setTab("rutina");
    });
  });
  document.querySelectorAll("[data-logout]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Cerrar sesión?")){
        if(SB.sbClient) await SB.sbClient.auth.signOut().catch(()=>{});
        SB.authUser = null;
        showToast("🚪 Sesión cerrada");
        Auth.showAuthOverlay(true);
        if(currentTab==="ajustes") renderMain();
      }
    });
  });
  document.querySelectorAll("[data-open-auth]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      Auth.authMode = "login"; Auth.updateAuthTabs();
      document.getElementById("authPass").value = "";
      document.getElementById("authError").textContent = "";
      Auth.showAuthOverlay(true);
    });
  });
  document.querySelectorAll("[data-sync-now]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await scheduleSync(); renderMain(); });
  });
  document.querySelectorAll("[data-open-help]").forEach(btn=>{
    btn.addEventListener("click", ()=>showOnboarding(true));
  });
  /* Notificaciones push: activar/desactivar (requiere gesture explícito) */
  document.querySelectorAll("[data-enable-push]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ enablePushNotifications(); });
  });
  document.querySelectorAll("[data-disable-push]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ disablePushNotifications(); });
  });
  /* Historial colapsable */
  document.querySelectorAll("[data-hist]").forEach(el=>{
    el.addEventListener("click", (e)=>{
      if(e.target.closest("[data-swipable-hist]") && e.target.closest(".hist-swipe-bg")) return;
      el.classList.toggle("open");
    });
  });
  /* Borrar sesión por swipe a la izquierda en el historial */
  /* deleteHistorySession → src/modules/views-historial.js (issue #21) */
  document.querySelectorAll("[data-swipable-hist]").forEach(row=>{
    if(row._histSwipeAttached) return;
    row._histSwipeAttached = true;
    const content = row.querySelector(".hist-content");
    const SWIPE_LIMIT = 100;
    let startX = 0, startY = 0, dragging = false, locked = false;
    row.addEventListener("touchstart", (e)=>{
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; dragging = true; locked = false;
    }, { passive:true });
    row.addEventListener("touchmove", (e)=>{
      if(!dragging) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if(!locked){
        if(Math.abs(dy) > Math.abs(dx)){ dragging = false; return; }
        locked = true;
      }
      if(locked && content){
        const off = Math.max(-SWIPE_LIMIT, Math.min(0, dx));
        content.style.transform = `translateX(${off}px)`;
      }
    }, { passive:true });
    row.addEventListener("touchend", ()=>{
      if(!dragging) return;
      dragging = false;
      if(content){
        const tx = parseFloat(content.style.transform.replace(/[^0-9\-.]/g,"")) || 0;
        if(tx <= -SWIPE_LIMIT/2){
          content.style.transform = `translateX(-${SWIPE_LIMIT}px)`;
          row.classList.add("swiped");
          deleteHistorySession(row.dataset.delDate, row.dataset.delDay).then(()=>{
            if(!document.body.contains(row)) return;
            row.classList.remove("swiped");
            content.style.transform = "translateX(0)";
          });
        } else {
          content.style.transform = "translateX(0)";
        }
      }
    }, { passive:true });
    row.addEventListener("mousedown", (e)=>{
      startX = e.clientX; startY = e.clientY; dragging = true; locked = false;
    });
    window.addEventListener("mousemove", (e)=>{
      if(!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if(!locked){
        if(Math.abs(dy) > Math.abs(dx)){ dragging = false; return; }
        locked = true;
      }
      if(locked && content){
        const off = Math.max(-SWIPE_LIMIT, Math.min(0, dx));
        content.style.transform = `translateX(${off}px)`;
      }
    });
    window.addEventListener("mouseup", ()=>{
      if(!dragging) return;
      dragging = false;
      if(content){
        const tx = parseFloat(content.style.transform.replace(/[^0-9\-.]/g,"")) || 0;
        if(tx <= -SWIPE_LIMIT/2){
          content.style.transform = `translateX(-${SWIPE_LIMIT}px)`;
          row.classList.add("swiped");
          deleteHistorySession(row.dataset.delDate, row.dataset.delDay).then(()=>{
            if(!document.body.contains(row)) return;
            row.classList.remove("swiped");
            content.style.transform = "translateX(0)";
          });
        } else {
          content.style.transform = "translateX(0)";
        }
      }
    });
  });
  /* Autoseleccionar el número original al enfocar cualquier input numérico (UX3) */
  document.querySelectorAll("input[type='number'],input[type='time'],input[inputmode]").forEach(input=>{
    input.addEventListener("focus", ()=>{
      setTimeout(()=>{ input.select(); }, 0);
    });
  });
  /* Días de entrenamiento (chips) */
  document.querySelectorAll("[data-train-day]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const d = btn.dataset.trainDay;
      if(Config.trainingDays.includes(d)){
        Config.trainingDays = Config.trainingDays.filter(x=>x!==d);
      } else {
        Config.trainingDays.push(d);
      }
      saveTrainingDays();
      renderMain();
      showToast("📅 Días de entrenamiento actualizados");
    });
  });
  /* Editar sesión del historial */
  document.querySelectorAll("[data-edit-hist]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const hi = parseInt(btn.dataset.editHist);
      const history = getHistory();
      const sorted = [...history].sort((a,b)=>new Date(b.date)-new Date(a.date));
      const h = sorted[hi];
      if(!h) return;
      openEditHistSession(h);
    });
  });
  /* Calendario historial: navegación de mes y selección de día */
  attachHistCalendarEvents();
  /* NOTA: attachEditHistOverlayEvents() se registra UNA sola vez en init().
     Debe quedarse fuera de attachEvents() (que se ejecuta en cada renderMain)
     para no duplicar el listener de click del overlay de edición de historial
     — antes, cada render añadía otro listener y "Añadir serie" sumaba tantas
     series como listeners acumulados. */
  /* Guardar configuración de entrenamiento desde ajustes */
  document.querySelectorAll("[data-train-input]").forEach(input=>{
    input.addEventListener("change", ()=>{
      const k = input.dataset.trainInput;
      let v;
      if(input.type === "checkbox") v = input.checked;
      else if(input.dataset.float === "1") v = parseFloat(input.value);
      else v = parseFloat(input.value);
      if(Number.isFinite(v)) Config.trainingConfig[k] = v;
      else if(input.type === "checkbox") Config.trainingConfig[k] = v;
      saveTrainingConfig();
      showToast("⚙️ Ajuste de entrenamiento guardado");
    });
  });
  document.querySelectorAll("[data-train-select]").forEach(sel=>{
    sel.addEventListener("change", ()=>{
      Config.trainingConfig[sel.dataset.trainSelect] = sel.value;
      saveTrainingConfig();
      showToast("⚙️ Progresión actualizada");
    });
  });

  /* ── Drag & drop táctil para reordenar ejercicios (F1) ── */
  const dragMain = document.getElementById("main");
  if(dragMain){
    let _dragFrom = null, _dragOver = null, _dragStartT = null, _mouseX = 0, _mouseY = 0;

    /* Determina el contexto (editar rutina vs sesión) y las filas hermanas */
    function dragCells(fromEl){
      const scope = fromEl.parentElement;
      if(fromEl.classList.contains("edit-ex-row"))
        return [scope.querySelectorAll(".edit-ex-row"), "edit-routine"];
      if(fromEl.classList.contains("up-row"))
        return [scope.querySelectorAll(".up-row"), "Session.session-up"];
      return [ [], null ];
    }

    function startDrag(row, e){
      if(!(row.classList.contains("edit-ex-row") || row.classList.contains("up-row"))) return false;
      if(e && e.target.closest("button,input,select,textarea,.edit-mini,.up-arrow,.ehs-input,.es-input,.edit-ex-body,.edit-ex-actions,.edit-set-row")) return false;
      _dragFrom = row;
      row.classList.add("dragging");
      document.body.classList.add("dragging-active");
      if(e && e.cancelable) e.preventDefault();
      return true;
    }


    function endDragFn(){
      if(!_dragFrom) return;
      if(_dragOver && _dragOver !== _dragFrom){
        const [cells, ctx] = dragCells(_dragFrom);
        const fromIdx = Array.prototype.indexOf.call(cells, _dragFrom);
        const toIdx = Array.prototype.indexOf.call(cells, _dragOver);
        if(fromIdx>=0 && toIdx>=0 && fromIdx !== toIdx){
          applyDragReorder(ctx, fromIdx, toIdx);
        }
      }
      _dragFrom.classList.remove("dragging");
      if(_dragOver){ _dragOver.classList.remove("drag-over"); _dragOver = null; }
      document.body.classList.remove("dragging-active");
      _dragFrom = null;
    }

    function applyDragReorder(ctx, fromIdx, toIdx){
      if(ctx === "edit-routine"){
        const routine = getRoutine();
        const dayEx = routine.filter(e=>e.dia===EditR.routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
        const moved = dayEx[fromIdx], target = dayEx[toIdx];
        if(!moved || !target) return;
        const keyMoved = moved.dia+"|"+moved.nombre_es;
        const keyTarget = target.dia+"|"+target.nombre_es;
        const ia = routine.findIndex(e=>e.dia+"|"+e.nombre_es===keyMoved);
        const ib = routine.findIndex(e=>e.dia+"|"+e.nombre_es===keyTarget);
        if(ia<0 || ib<0) return;
        applyRoutineChange(r=>{
          const arr = r.slice();
          const [hit] = arr.splice(ia,1);
          const ib2 = arr.findIndex(e=>e.dia+"|"+e.nombre_es===keyTarget);
          const insertAt = fromIdx < toIdx ? ib2+1 : ib2;
          arr.splice(insertAt,0,hit);
          return arr;
        });
        renderMain();
      } else if(ctx === "Session.session-up" && Session.session){
        const arr = Session.session.exercises.slice();
        const absFrom = Session.session.currentIdx+1+fromIdx;
        const absTo = Session.session.currentIdx+1+toIdx;
        const [hit] = arr.splice(absFrom,1);
        arr.splice(absTo,0,hit);
        Session.session.exercises = arr;
        Session.session.exercises.forEach((ex,i)=>{ ex.orden = i+1; });
        saveSessionState();
        renderMain();
      }
    }

    /* Touch events */
    dragMain.addEventListener("touchstart", (e)=>{
      const row = e.target.closest(".edit-ex-row, .up-row");
      if(!row) return;
      if(startDrag(row, e)){
        const t = e.touches[0];
        _dragStartT = { x:t.clientX, y:t.clientY };
      }
    }, { passive:true });
    dragMain.addEventListener("touchmove", (e)=>{
      if(!_dragFrom) return;
      const t = e.touches[0];
      if(_dragStartT){
        const dy = t.clientY - _dragStartT.y;
        if(Math.abs(dy) < 3) return;
      }
      const targetEl = document.elementFromPoint(t.clientX, t.clientY);
      const overRow = targetEl ? targetEl.closest(".edit-ex-row, .up-row") : null;
      if(overRow && overRow !== _dragOver){
        if(_dragOver) _dragOver.classList.remove("drag-over");
        _dragOver = overRow;
        overRow.classList.add("drag-over");
      }
    }, { passive:true });
    dragMain.addEventListener("touchend", ()=>{
      if(_dragFrom) endDragFn();
      _dragStartT = null;
    }, { passive:true });

    /* Mouse fallback escritorio */
    dragMain.addEventListener("mousedown", (e)=>{
      const row = e.target.closest(".edit-ex-row, .up-row");
      if(!row) return;
      if(startDrag(row, e)){ _mouseX = e.clientX; _mouseY = e.clientY; }
    });
    window.addEventListener("mousemove", (e)=>{
      if(!_dragFrom) return;
      const targetEl = document.elementFromPoint(e.clientX, e.clientY);
      const overRow = targetEl ? targetEl.closest(".edit-ex-row, .up-row") : null;
      if(overRow && overRow !== _dragOver){
        if(_dragOver) _dragOver.classList.remove("drag-over");
        _dragOver = overRow;
        overRow.classList.add("drag-over");
      }
    });
    window.addEventListener("mouseup", ()=>{ if(_dragFrom) endDragFn(); });
  }
}

/* ================================================================
   NUM PAD + SLIDER
   ================================================================ */

/* ================================================================
   NUM PAD + SLIDER
   ================================================================ */
/* numpad de sesión (openNumPad/closeNumPad/confirmNumPad) → src/modules/views-sesion.js (issue #19) */


/* F2: numpad para editar series/reps/kg de la rutina (sin sesión activa) */
/* numpad de rutina (VR.numPadRoutineCtx/openRoutineNumPad/confirmRoutineNumPad) → src/modules/views-rutina.js (issue #18) */
/* Interceptar el OK del numpad según contexto (sesión vs rutina) */
document.getElementById("numOk").addEventListener("click", ()=>{
  if(VR.numPadRoutineCtx){ confirmRoutineNumPad(); }
  else confirmNumPad();
});
document.getElementById("numCancel").addEventListener("click", closeNumPad);
document.getElementById("numInput").addEventListener("keydown", e=>{
  if(e.key==="Enter") confirmNumPad();
  if(e.key==="Escape") closeNumPad();
});
document.getElementById("numSlider").addEventListener("input", e=>{
  document.getElementById("numInput").value = e.target.value;
});
document.getElementById("numSlider").addEventListener("change", e=>{
  document.getElementById("numInput").value = e.target.value;
  if(VR.numPadRoutineCtx){ confirmRoutineNumPad(); }
  else confirmNumPad();
});

/* Variantes overlay */
document.getElementById("varList").addEventListener("click", e=>{
  const item = e.target.closest("[data-variant-idx]");
  if(item) selectVariant(parseInt(item.dataset.variantIdx));
});
document.getElementById("varClose").addEventListener("click", ()=>{
  setFocusTrap("varOverlay", null);
  document.getElementById("varOverlay").classList.remove("show");
});

/* Zoom de imagen: cerrar al tocar fuera o con el botón */
document.getElementById("zoomClose").addEventListener("click", (e)=>{
  e.stopPropagation();
  setFocusTrap("imgZoomOverlay", null);
  document.getElementById("imgZoomOverlay").classList.remove("show");
});
document.getElementById("imgZoomOverlay").addEventListener("click", (e)=>{
  if(e.target === document.getElementById("imgZoomOverlay")){
    setFocusTrap("imgZoomOverlay", null);
    document.getElementById("imgZoomOverlay").classList.remove("show");
  }
});

/* Auth overlay — listeners estáticos (funciones → src/modules/auth.js, issue #11) */
document.querySelectorAll("[data-auth-tab]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    Auth.authMode = btn.dataset.authTab;
    document.getElementById("authError").textContent = "";
    Auth.updateAuthTabs();
    /* Lazy Supabase: precargar el SDK al entrar en la pestaña de auth */
    if(!SB.sbClient && !Auth.authBlocked){
      ensureSupabaseClient().then(()=>{
        const skipBtn = document.getElementById("authSkip");
        if(skipBtn) skipBtn.style.display = "none";
      }).catch(()=>{});
    }
  });
});
const authForm = document.getElementById("authForm");
if(authForm){
  /* El botón Acceder ya no recarga la página: prevenir submit nativo */
  authForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    Auth.handleAuthSubmit();
  });
}
/* B3: continuar sin conexión esconde el overlay y deja usar la app en local */
document.getElementById("authSkip").addEventListener("click", ()=>{
  SB.authUser = null;
  Auth.showAuthOverlay(false);
  renderMain();
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

/* ================================================================
   SELECTOR DE EJERCICIO (static handlers)
   ================================================================ */
const pickerSearchEl = document.getElementById("pickerSearch");
if(pickerSearchEl){
  pickerSearchEl.addEventListener("input", (e)=>{ renderPickerList(e.target.value); });
}
document.getElementById("pickerList").addEventListener("click", (e)=>{
  const item = e.target.closest("[data-pick-name]");
  if(item) selectExerciseFromPicker(item);
});
document.getElementById("pickerClose").addEventListener("click", closeExercisePicker);

/* ================================================================
   INIT
   ================================================================ */
(function attachStaticHandlers(){
  document.querySelectorAll(".tabbtn").forEach(btn=>{
    btn.addEventListener("click", ()=>setTab(btn.dataset.tab));
  });
  /* Botones de descanso: se enlazan UNA sola vez (evita listeners duplicados del bug ±15s).
     Con el timer por timestamps: al reanudar tras pausa se recalcula endTime; al sumar/restar
     15s se desplaza endTime para mantener sincronía con el reloj real. */
  document.querySelectorAll("[data-rest]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(btn.dataset.rest==="skip"){ EyeFit.RestTimer.stopRest(); }
      else if(btn.dataset.rest==="toggle"){ EyeFit.RestTimer.toggleRestPause(); }
      else if(btn.dataset.rest==="minus15"){ EyeFit.RestTimer.adjustRest(-15); }
      else if(btn.dataset.rest==="plus15"){ EyeFit.RestTimer.adjustRest(15); }
      saveSessionState();
    });
  });
  const fileInput = document.getElementById("fileInput");
  if(fileInput){
    fileInput.onchange = (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = async (ev)=>{
        try{
          const routine = await parseRoutineSheet(new Uint8Array(ev.target.result));
          if(routine.length===0){ showToast("⚠️ Archivo sin ejercicios válidos"); return; }
          setRoutine(routine);
          selectedDay = null;
          if(SB.sbClient && SB.authUser){
            const ok = await pushRoutineToServer();
            if(!ok){ const p=getPending(); p.routine=routine; setPending(p); }
          }
          showToast("✅ Rutina importada: " + routine.length + " ejercicios");
          setTab("rutina");
        }catch(err){ showToast("❌ No se pudo leer el archivo"); }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
    };
  }
  /* Fase C: importar backup JSON */
  const jsonFileInput = document.getElementById("jsonFileInput");
  if(jsonFileInput){
    jsonFileInput.onchange = async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      try{
        const data = JSON.parse(await file.text());
        if(!data || data.app !== "eyefit"){
          showToast("❌ Archivo de backup no válido");
          return;
        }
        if(!confirm("¿Sustituir la rutina y el historial actuales por los del backup?")) return;
        if(Array.isArray(data.routine)){ setRoutine(data.routine); selectedDay = null; }
        if(Array.isArray(data.history)){
          await saveHistory(data.history);
          /* Poner el historial importado en cola de sincronización si hay sesión */
          const p = getPending();
          if(data.history.length) p.sessions = [...data.history];
          setPending(p);
        }
        showToast("✅ Backup restaurado");
        setTab("rutina");
      }catch(err){ showToast("❌ No se pudo leer el backup"); }
      e.target.value = "";
    };
  }
})();

(async function init(){
  /* CSS completo: pasa de media="print" (no bloquea render) a media="all" */
  const fullCssLink = document.getElementById("fullCssLink");
  if(fullCssLink && fullCssLink.media === "print"){ fullCssLink.media = "all"; }

  loadTrainingConfig();
  loadTrainingDays();
  /* Registrar UNA sola vez los handlers del overlay de edición de historial.
     (No puede estar en attachEvents(): ese se llama en cada renderMain y
     duplicaría el listener, provocando que "Añadir serie" añadiera muchas.) */
  attachEditHistOverlayEvents();
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
  renderMain();
  Dataset.datasetCache = await datasetPromise;
  Dataset.exerciseMetaCache = await metaPromise.catch(()=>null);
  renderMain();
  updateStopBtn();
  showOnboarding();

  if(authenticated){
    await scheduleSync();
    /* Pequeño delay para que el servidor procese los upserts antes de
       descargar y fusionar (evita ver sesiones locales no reflejadas). */
    await new Promise(r => setTimeout(r, 800));
    await pullServerData();
    renderMain();
  }
})();

/* Fix subida automática: reintento cada 30s si hay pendientes */
setInterval(()=>{
  if(SB.authUser && SB.sbClient){
    const pending = getPending();
    if(pending.sessions.length > 0 || pending.routine){
      scheduleSync().then(()=>{
        if(currentTab === "ajustes" || currentTab === "historial") renderMain();
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
    renderMain();
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
        if(currentTab === "ajustes" || currentTab === "historial") renderMain();
      });
      if(currentTab === "historial"){
        pullServerData().then(()=>{
          if(currentTab === "historial") renderMain();
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
    if(currentTab === "historial") renderMain();
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

/* Bridge temporal del router (sustituido por src/modules/router.js en la issue #17):
   expone estado y navegación para que los módulos puedan acceder a ellos. */
window.EyeFit.Router = {
  get currentTab(){ return currentTab; },
  set currentTab(v){ currentTab = v; },
  get selectedDay(){ return selectedDay; },
  set selectedDay(v){ selectedDay = v; },
  setTab, updateStopBtn, renderMain
};


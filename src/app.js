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

/* ================================================================
   VISTA RUTINA — carga directa del día actual
   ================================================================ */
function renderRutina(){
  const routine = getRoutine();
  const ALL_DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const todayName = getTodayName();
  const defaultDay = selectedDay || (ALL_DAYS.includes(todayName) ? todayName : "Lunes");
  const sel = ALL_DAYS.includes(defaultDay) ? defaultDay : "Lunes";
  selectedDay = sel;

  const noData = routine.length===0;
  if(noData) return `<div class="section active">
    <h2 class="title">📅 Rutina Semanal</h2>
    <div class="empty-state">No hay rutina cargada.<br>Importa un .xlsx en Ajustes.</div>
  </div>`;

  /* Carrusel de los 7 días de la semana (F3/F4): cards deslizables horizontalmente.
     Al hacer swipe, el día del centro se actualiza y el detalle inferior responde. */
  const now = new Date();
  const DAY_NUM = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  function dayNameOffset(offset){
    const d = new Date(now);
    d.setDate(d.getDate()+offset);
    return { name: DAY_NUM[d.getDay()], date: d };
  }
  /* Mostrar los 7 días de la semana actual (Lunes a Domingo de la semana actual) */
  const todayIdx = DAY_NUM.indexOf(todayName);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((todayIdx + 6) % 7)); /* Lunes de esta semana */
  const weekDays = [0,1,2,3,4,5,6].map(offset=>{
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    return { name: DAY_ORDER[offset] || DAY_NUM[d.getDay()], date: d };
  });

  const dayEx = routine.filter(e=>e.dia===sel).sort((a,b)=>(a.orden||0)-(b.orden||0));
  const dayCards = dayEx.length===0
    ? `<div class="empty-state">${escapeHtml(sel)} es día de descanso.<br>Pulsa «Editar» para añadir ejercicios si lo deseas.</div>`
    : dayEx.map((e,ei)=>{
        const img = getExerciseImage(e, Dataset.datasetCache);
        const instrRaw = getInstrucciones(e);
        const key = String(e.datasetOriginal||e.dataset||e.nombre_es||"").trim().toLowerCase();
        const best = getHistoricalBest(key);
        const rmLabel = best && best.rm ? `${escapeHtml(formatKg(Math.round(best.rm)))}kg` : "";
        const rmHint = best && best.rm
          ? ` title="1RM = ${escapeHtml(formatKg(best.kg))} × (1 + ${escapeHtml(best.reps)}/30) = ${escapeHtml(formatKg(Math.round(best.rm)))} kg (Epley)" data-has-rm="1"`
          : ` data-has-rm="0"`;
        /* Primer ejercicio: above-the-fold — sin lazy y alta prioridad (LCP) */
        const imgAttrs = ei === 0
          ? `fetchpriority="high" decoding="async"`
          : `loading="lazy" decoding="async"`;
        return `<div class="rt-ex-card">
          ${img ? `<div class="rtc-img-wrap" data-img-zoom data-ex-name="${escapeHtmlAttr(e.nombre_es)}" data-ex-dataset="${escapeHtmlAttr(e.dataset||"")}" data-ex-dataset-original="${escapeHtmlAttr(e.datasetOriginal||"")}" data-img-instr="${escapeHtmlAttr(instrRaw)}" role="button" tabindex="0" aria-label="Ampliar GIF de ${escapeHtmlAttr(getApodo(e))}">
            <img class="rtc-img" src="${escapeHtmlAttr(img)}" alt="${escapeHtml(getApodo(e))}" ${imgAttrs} data-img-fallback="hide">
            <div class="rtc-zoom-hint">⛶</div>
          </div>` : ""}
          <div class="rtc-info">
            <div class="rtc-name">${escapeHtml(getApodo(e))}</div>
            <div class="rtc-stats">
              <div class="rtc-stat" data-rt-edit="series" data-rt-name="${escapeHtmlAttr(e.nombre_es)}" data-rt-day="${escapeHtmlAttr(sel)}" role="button" tabindex="0"><span class="rtc-stat-val">${escapeHtml(e.series)}</span><span class="rtc-stat-lbl">series</span></div>
              <div class="rtc-stat" data-rt-edit="reps" data-rt-name="${escapeHtmlAttr(e.nombre_es)}" data-rt-day="${escapeHtmlAttr(sel)}" role="button" tabindex="0"><span class="rtc-stat-val">${escapeHtml(e.reps)}</span><span class="rtc-stat-lbl">reps</span></div>
              <div class="rtc-stat" data-rt-edit="kg" data-rt-name="${escapeHtmlAttr(e.nombre_es)}" data-rt-day="${escapeHtmlAttr(sel)}" role="button" tabindex="0"><span class="rtc-stat-val">${escapeHtml(formatKg(e.peso_kg))}</span><span class="rtc-stat-lbl">kg</span></div>
              ${rmLabel ? `<div class="rtc-stat rm-tappable" ${rmHint}><span class="rtc-stat-val">${rmLabel}</span><span class="rtc-stat-lbl">1RM</span></div>` : ""}
            </div>
          </div>
        </div>`;
      }).join("");

  return `<div class="section active">
    <h2 class="title">📅 Rutina Semanal</h2>
    <div class="routine-carousel" id="routineCarousel" data-routine-carousel>
      ${weekDays.map(({name,date},wi)=>{
        const dayEx = routine.filter(e=>e.dia===name).sort((a,b)=>(a.orden||0)-(b.orden||0));
        const isToday = name === todayName;
        const isSel = name === sel;
        const color = DAY_COLORS[name] || "#888";
        const dateLabel = date.toLocaleDateString("es-ES",{day:"numeric",month:"short"});
        const body = dayEx.length===0
          ? `<div class="rc-rest">😴</div>`
          : `<div class="rc-list">${dayEx.map(e=>`<div class="rc-item">${escapeHtml(getApodo(e))}</div>`).join("")}</div>`;
        return `<div class="rc-cell ${isToday?"rc-today":""} ${isSel?"rc-active":""}" data-day="${escapeHtmlAttr(name)}" role="button" tabindex="0" aria-pressed="${isSel}">
          <div class="rc-top">
            <span class="rc-day" style="color:${escapeHtml(color)}">${escapeHtml(DAY_SHORT[name]||name.slice(0,3))}</span>
            <span class="rc-date">${dateLabel}</span>
          </div>
          ${body}
        </div>`;
      }).join("")}
    </div>
    <div class="rt-day-nav">
      <span style="font-weight:800;font-size:13px;color:${escapeHtml(DAY_COLORS[sel]||"#fff")};">${escapeHtml(sel)}</span>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-outline" data-edit-routine data-edit-routine-day="${escapeHtmlAttr(sel)}" style="min-height:36px;">✏️ Editar</button>
        ${dayEx.length>0?`<button class="btn" style="min-height:36px;" data-start-session="${escapeHtmlAttr(sel)}">🏋️ Entrenar</button>`:""}
      </div>
    </div>
    <div class="rt-day-view">${dayCards}</div>
  </div>`;
}

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


/* ================================================================
   EDITAR RUTINA — CRUD de ejercicios y series
   ================================================================ */
let routineEditDay = null;

function applyRoutineChange(updater){
  const routine = getRoutine();
  const next = updater(routine);
  /* Reasignar orden por día */
  const od = {};
  for(const ex of next){ od[ex.dia]=(od[ex.dia]||0)+1; ex.orden=od[ex.dia]; }
  setRoutine(next);
  scheduleRoutineSync();
}

function renderEditRoutine(){
  const routine = getRoutine();
  const days = DAY_ORDER.filter(d=>routine.some(e=>e.dia===d));
  const todayName = getTodayName();
  const sel = routineEditDay || (days.includes(todayName) ? todayName : days[0]) || "Lunes";
  const dayEx = routine.filter(e=>e.dia===sel).sort((a,b)=>(a.orden||0)-(b.orden||0));

  /* Semana */
  const weekHtml = days.map(d=>{
    const isSel = d===sel;
    const color = DAY_COLORS[d] || "#888";
    return `<div class="week-cell ${isSel?"active":""}" data-edit-day="${escapeHtmlAttr(d)}" role="button" tabindex="0" aria-pressed="${isSel}" aria-label="Editar día ${escapeHtmlAttr(d)}" style="${isSel?"":`border-color:${color}44;`}">
      <div class="d">${DAY_SHORT[d]||d.slice(0,3)}</div>
      <div class="l" style="${isSel?"":`color:${escapeHtml(color)}`}">${escapeHtml(d)}</div>
    </div>`;
  }).join("");

  /* Ejercicios del día */
  const exHtml = dayEx.map((ex,ei)=>{
    const sets = buildExerciseSets(ex, null);
    /* Usar valores editados si existen (_edit_kgN / _edit_repsN) */
    const setsWithEdits = sets.map((s,si)=>{
      const kg = ex[`_edit_kg${si+1}`] !== undefined ? ex[`_edit_kg${si+1}`] : s.kg;
      const reps = ex[`_edit_reps${si+1}`] !== undefined ? ex[`_edit_reps${si+1}`] : s.reps;
      return { kg, reps };
    });
    return `<div class="edit-ex-row">
      <div class="edit-ex-top">
        <span class="edit-ex-idx">${escapeHtml(ex.orden)}</span>
        <span class="edit-ex-name">${escapeHtml(getApodo(ex))}</span>
        <div class="edit-ex-actions">
          <button class="edit-mini" data-edit-ex-toggle="${ei}" aria-label="Editar series de ${escapeHtmlAttr(getApodo(ex))}">✏️</button>
          <button class="edit-mini" data-edit-ex-up="${ei}" ${ei===0?"disabled":""} aria-label="Subir ${escapeHtmlAttr(getApodo(ex))}">↑</button>
          <button class="edit-mini" data-edit-ex-down="${ei}" ${ei===dayEx.length-1?"disabled":""} aria-label="Bajar ${escapeHtmlAttr(getApodo(ex))}">↓</button>
          <button class="edit-mini danger" data-edit-ex-del="${ei}" aria-label="Eliminar ${escapeHtmlAttr(getApodo(ex))}">✕</button>
        </div>
      </div>
      <div class="edit-ex-summary">${escapeHtml(setsWithEdits.length)} series · ${escapeHtml(ex.reps)} reps · ${escapeHtml(ex.peso_kg)} kg · ⏱ ${escapeHtml(formatRest(ex.descanso_s))}</div>
      <div class="edit-ex-body" data-edit-ex-body="${ei}">
        ${setsWithEdits.map((s,si)=>`
          <div class="edit-set-row">
            <span class="es-num">${si+1}</span>
            <input type="number" class="es-input" data-edit-set-kg="${ei}|${si}" value="${escapeHtml(s.kg)}" step="0.5" min="0" inputmode="decimal" aria-label="Peso serie ${si+1}">
            <span class="es-label">kg</span>
            <input type="number" class="es-input" data-edit-set-reps="${ei}|${si}" value="${escapeHtml(s.reps)}" step="1" min="1" inputmode="numeric" aria-label="Reps serie ${si+1}">
            <span class="es-label">reps</span>
            <button class="edit-set-del" data-edit-set-del="${ei}|${si}" aria-label="Eliminar serie ${si+1}">🗑</button>
          </div>`).join("")}
        <button class="edit-add-set" data-edit-add-set="${ei}">＋ Añadir serie</button>
      </div>
    </div>`;
  }).join("");

  return `<div class="section active">
    <div class="routine-edit-top">
      <h2 class="title" style="flex:1;">✏️ Editar Rutina</h2>
      <button class="btn btn-outline" data-edit-cancel>✕ Cancelar</button>
      <button class="btn" data-edit-done>✓ Guardar</button>
    </div>
    ${days.length ? `<div class="week-grid">${weekHtml}</div>` : ""}
    ${dayEx.length===0
      ? `<div class="empty-state">Este día no tiene ejercicios.</div>`
      : exHtml}
    <button class="edit-add-ex" data-edit-add-ex>➕ Añadir ejercicio</button>
  </div>`;
}

let pickerDay = null;
function openExercisePicker(day){
  pickerDay = day;
  document.getElementById("pickerDayLabel").textContent = "Añadir a: " + (day || "");
  renderPickerList("");
  document.getElementById("exPickerOverlay").classList.add("show");
  setFocusTrap("exPickerOverlay", document.getElementById("exPickerOverlay"));
  setTimeout(()=>document.getElementById("pickerSearch").focus(), 100);
}
function renderPickerList(query){
  const list = document.getElementById("pickerList");
  const q = normalizeName(query);
  let items = Dataset.datasetCache || [];
  if(q){
    const words = q.split(" ").filter(w=>w.length>=2);
    items = items.filter(d=>{
      const n = normalizeName(d.name);
      if(n.includes(q)) return true;
      return words.some(w=>n.includes(w));
    });
  }
  const shown = items.slice(0, 60);
  list.innerHTML = shown.length
    ? shown.map((d,i)=>{
        let imgBase = findEmbeddedImage(d.name);
        if(!imgBase && d.image) imgBase = String(d.image).replace("images/","").replace(".jpg","").replace(".png","");
        const imgUrl = imgBase ? IMG_BASE + "videos/" + imgBase + ".gif" : null;
        /* M5: metadatos de músculo/equipamiento desde exercise-meta.json */
        const meta = getExerciseMeta(d.name);
        const partLabel = escapeHtml(meta && meta.muscle ? meta.muscle : (d.part||""));
        const equipLabel = meta && meta.equip ? escapeHtml(meta.equip) : "";
        return `<div class="picker-item" data-pick-ex="${escapeHtmlAttr(i)}" data-pick-name="${escapeHtmlAttr(d.name)}" data-pick-image="${escapeHtmlAttr(d.image||"")}" data-pick-part="${escapeHtmlAttr(d.part||"")}">
          ${imgUrl ? `<img class="rt-ex-img" style="width:34px;height:34px;border-radius:6px;" src="${escapeHtmlAttr(imgUrl)}" alt="" loading="lazy" decoding="async" data-img-fallback="hide">` : ""}
          <div style="flex:1;min-width:0;">
            <div class="pi-name">${escapeHtml(d.name)}</div>
            <div class="pi-sub">${partLabel}${equipLabel ? ` · ${equipLabel}` : ""}</div>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty-state" style="padding:20px;">Sin resultados</div>`;
}
function closeExercisePicker(){
  setFocusTrap("exPickerOverlay", null);
  document.getElementById("exPickerOverlay").classList.remove("show");
  /* Resetear la sustitución pendiente del historial */
  editHistSubIdx = -1;
  pickerDay = null;
}
/* Contexto para la sustitución de ejercicio: si editHistSubIdx ≥ 0, el picker
   sustituye el ejercicio con ese índice en editingHistRecord (historial). */
let editHistSubIdx = -1;
function selectExerciseFromPicker(el){
  const name = el.getAttribute("data-pick-name") || "";
  const image = el.getAttribute("data-pick-image") || "";
  if(!name) return;
  /* ---- Sustituir ejercicio dentro del historial (F5) ---- */
  if(editHistSubIdx >= 0 && editingHistRecord){
    const ex = editingHistRecord.exercises[editHistSubIdx];
    if(ex){
      const oldSets = ex.sets || [];
      const oldSeries = ex.series || oldSets.length || 3;
      const oldReps = ex.reps || (oldSets[0] && oldSets[0].reps) || 10;
      const oldWeight = ex.peso_kg != null ? ex.peso_kg : (oldSets[0] && oldSets[0].kg) || 0;
      const found = Dataset.datasetCache ? findExerciseInDataset(Dataset.datasetCache, name) : null;
      /* Conservar el nombre/datos del ejercicio y actualizar dataset */
      ex.nombre_es = name;
      if(found){
        ex.dataset = found.name;
        ex.datasetOriginal = found.name;
        if(found.instructions) ex.notas = found.instructions;
      } else {
        ex.dataset = name; ex.datasetOriginal = name;
      }
      /* Mantener series, reps, kg actuales si ya tenían data */
      if(!oldSets.length){
        ex.series = oldSeries; ex.reps = oldReps; ex.peso_kg = oldWeight;
      }
    }
    /* Redibujar el overlay con el ejercicio sustituido */
    openEditHistSession(editingHistRecord);
    closeExercisePicker();
    editHistSubIdx = -1;
    showToast("↔️ Ejercicio sustituido");
    return;
  }
  if(!pickerDay){ closeExercisePicker(); return; }
  applyRoutineChange(routine=>{
    const ex = { dia:pickerDay, orden:99, nombre_es:name, dataset:name, series:3, reps:10, peso_kg:0, descanso_s:90, notas:"" };
    /* Si el dataset tiene instrucciones, usarlas como notas */
    const found = Dataset.datasetCache ? findExerciseInDataset(Dataset.datasetCache, name) : null;
    if(found){
      if(found.instructions) ex.notas = found.instructions;
      ex.dataset = found.name;
    }
    routine.push(ex);
    return routine;
  });
  closeExercisePicker();
  renderMain();
  showToast("➕ Ejercicio añadido: " + name);
}

function handleEditRoutineEvent(btn){
  const d = btn.dataset;
  if(d.editExToggle !== undefined){
    const body = document.querySelector(`[data-edit-ex-body="${d.editExToggle}"]`);
    if(body) body.classList.toggle("open");
    return;
  }
  if(d.editExUp !== undefined){
    const routine = getRoutine();
    const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const ei = parseInt(d.editExUp);
    if(ei<=0) return;
    const cur = dayEx[ei];
    const prev = dayEx[ei-1];
    applyRoutineChange(r=>{
      const a = cur.dia+"|"+cur.nombre_es;
      const b = prev.dia+"|"+prev.nombre_es;
      const ia = r.findIndex(e=>e.dia+"|"+e.nombre_es===a);
      const ib = r.findIndex(e=>e.dia+"|"+e.nombre_es===b);
      if(ia>=0 && ib>=0){ const t=r[ia]; r[ia]=r[ib]; r[ib]=t; }
      return r;
    });
    renderMain();
    return;
  }
  if(d.editExDown !== undefined){
    const routine = getRoutine();
    const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const ei = parseInt(d.editExDown);
    if(ei>=dayEx.length-1) return;
    const cur = dayEx[ei];
    const next = dayEx[ei+1];
    applyRoutineChange(r=>{
      const a = cur.dia+"|"+cur.nombre_es;
      const b = next.dia+"|"+next.nombre_es;
      const ia = r.findIndex(e=>e.dia+"|"+e.nombre_es===a);
      const ib = r.findIndex(e=>e.dia+"|"+e.nombre_es===b);
      if(ia>=0 && ib>=0){ const t=r[ia]; r[ia]=r[ib]; r[ib]=t; }
      return r;
    });
    renderMain();
    return;
  }
  if(d.editExDel !== undefined){
    const routine = getRoutine();
    const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const ei = parseInt(d.editExDel);
    const ex = dayEx[ei];
    if(!ex) return;
    if(confirm(`¿Eliminar "${getApodo(ex)}" de ${routineEditDay}?`)){
      applyRoutineChange(r=>r.filter(e=>!(e.dia===ex.dia && e.nombre_es===ex.nombre_es)));
      renderMain();
      showToast("🗑️ Ejercicio eliminado");
    }
    return;
  }
  if(d.editSetKg !== undefined || d.editSetReps !== undefined){
    const [ei, si] = (d.editSetKg ?? d.editSetReps).split("|").map(Number);
    const routine = getRoutine();
    const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const ex = dayEx[ei];
    if(!ex) return;
    const key = d.editSetKg ? "kg" : "reps";
    const val = parseFloat(btn.value);
    if(isNaN(val)) return;
    /* Guardar en el borrador, no persistir aún */
    ex[`_edit_${key}${si+1}`] = val;
    ex[`_edit_dirty_set`] = true;
    return;
  }
  if(d.editSetDel !== undefined){
    const [ei, si] = d.editSetDel.split("|").map(Number);
    const routine = getRoutine();
    const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const ex = dayEx[ei];
    if(!ex) return;
    /* Recoger todas las series existentes y recompactar tras borrar la indicada */
    const setArr = [];
    for(let k=1; k<=20; k++){
      if(ex["kg"+k] !== undefined || ex["reps"+k] !== undefined ||
         ex[`_edit_kg${k}`] !== undefined || ex[`_edit_reps${k}`] !== undefined){
        setArr.push({
          kg: ex[`_edit_kg${k}`] !== undefined ? ex[`_edit_kg${k}`] : (ex["kg"+k] !== undefined ? ex["kg"+k] : (parseFloat(ex.peso_kg)||0)),
          reps: ex[`_edit_reps${k}`] !== undefined ? ex[`_edit_reps${k}`] : (ex["reps"+k] !== undefined ? ex["reps"+k] : (parseInt(ex.reps)||8))
        });
      }
    }
    if(setArr.length <= 0){
      /* Fallback: usar ex.series */
      for(let k=1; k<=ex.series; k++){
        setArr.push({
          kg: ex[`_edit_kg${k}`] ?? (ex["kg"+k] ?? (parseFloat(ex.peso_kg)||0)),
          reps: ex[`_edit_reps${k}`] ?? (ex["reps"+k] ?? (parseInt(ex.reps)||8))
        });
      }
    }
    if(setArr.length <= 1){
      showToast("⚠️ No puedes eliminar la única serie");
      return;
    }
    setArr.splice(si, 1);
    /* Recompactar: guardar todos como kg1..kgN y reps1..repsN */
    for(let k=1; k<=20; k++){
      delete ex["kg"+k]; delete ex["reps"+k];
      delete ex[`_edit_kg${k}`]; delete ex[`_edit_reps${k}`];
    }
    for(let k=0; k<setArr.length; k++){
      ex["kg"+(k+1)] = setArr[k].kg;
      ex["reps"+(k+1)] = setArr[k].reps;
    }
    ex.series = setArr.length;
    ex.peso_kg = setArr[0] ? setArr[0].kg : (parseFloat(ex.peso_kg)||0);
    ex.reps = setArr[0] ? setArr[0].reps : (parseInt(ex.reps)||8);
    delete ex._edit_dirty_set;
    setRoutine(routine);
    if(SB.sbClient && SB.authUser) pushRoutineToServer();
    renderMain();
    showToast("🗑️ Serie eliminada");
    return;
  }
  if(d.editAddSet !== undefined){
    const ei = parseInt(d.editAddSet);
    const routine = getRoutine();
    const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
    const ex = dayEx[ei];
    if(!ex) return;
    /* Añadir una nueva serie al final */
    let next = 1;
    for(let k=1; k<=20; k++){
      if(ex["kg"+k] !== undefined || ex["reps"+k] !== undefined ||
         ex[`_edit_kg${k}`] !== undefined || ex[`_edit_reps${k}`] !== undefined) next = k+1;
    }
    ex.series = Math.max((ex.series||3)+1, next);
    const nb = parseFloat(ex.peso_kg)||0;
    const nr = parseInt(ex.reps)||10;
    ex["kg"+next] = nb;
    ex["reps"+next] = nr;
    setRoutine(routine);
    if(SB.sbClient && SB.authUser) pushRoutineToServer();
    renderMain();
    return;
  }
}

/* Métricas de progresión (getHistoricalBest, svgSparkline, getStreak...) → src/modules/config.js (issue #16) */
/* ================================================================
   VISTA SESIÓN sin scroll
   ================================================================ */
/* sessionProgress → src/modules/session.js (issue #16) */

function renderSesion(){
  if(!Session.session){
    const routine = getRoutine();
    const todayName = getTodayName();
    /* Solo permitir entrenar el día de hoy */
    const todayEx = routine.filter(e=>e.dia===todayName).sort((a,b)=>(a.orden||0)-(b.orden||0));
    if(todayEx.length===0){
      return `<div class="section active">
        <h2 class="title">🏋️ Entrenar</h2>
        <div class="empty-state">Hoy no hay rutina asignada (${todayName}).<br>Ve a <b>Ajustes</b> para configurar tus días.</div>
      </div>`;
    }
    const dayColor = DAY_COLORS[todayName] || "#fff";
    const totalSets = todayEx.reduce((a,e)=>a+parseInt(e.series||3,10),0);
    /* Vista previa directa del entrenamiento de hoy (UX1) */
    const exPreview = todayEx.map((e,i)=>{
      const img = getExerciseImage(e, Dataset.datasetCache);
      return `<div class="sess-preview-ex">
        ${img?`<div class="spe-img"><img src="${escapeHtmlAttr(img)}" alt="" loading="lazy" decoding="async" data-img-fallback="hide"></div>`:`<div class="spe-img spe-emoji">🏋️</div>`}
        <div class="spe-info">
          <div class="spe-name">${escapeHtml(getApodo(e))}</div>
          <div class="spe-meta">${escapeHtml(e.series)}×${escapeHtml(e.reps)} · ${escapeHtml(formatKg(e.peso_kg))}kg</div>
        </div>
      </div>`;
    }).join("");
    return `<div class="section active">
      <h2 class="title">🏋️ Entrenar</h2>
      <div class="sess-preview-card">
        <div class="spc-head">
          <span class="spc-day" style="color:${escapeHtml(dayColor)}">Entrenamiento del ${escapeHtml(todayName)}</span>
          <span class="spc-sub">${escapeHtml(todayEx.length)} ejercicios · ${escapeHtml(totalSets)} series</span>
        </div>
        <div class="spc-list">${exPreview}</div>
        <button class="btn spc-start" data-start-session="${escapeHtmlAttr(todayName)}">▶️ Entrenar</button>
      </div>
    </div>`;
  }

  const day = Session.session.day;
  const ex = Session.session.exercises[Session.session.currentIdx];
  const totalEx = Session.session.exercises.length;
  const imgUrl = getExerciseImage(ex, Dataset.datasetCache);
  const apodo = getApodo(ex);
  const hasVariants = getVariants(ex).length > 0;

  const setRows = ex.sets.map((set,si)=>{
    const currentSet = ex.currentSet === si+1;
    const done = set.done;
    return `<div class="set-row ${done?"done-row":""}" data-swipe-set="${si}" style="${currentSet?"border:1px solid var(--accent);":""}">
      <div class="set-swipe-bg"><span>🗑 Eliminar</span></div>
      <div class="set-row-content">
        <span class="set-num">${si+1}</span>
        <div class="set-control">
          <button class="stepper" data-kg-minus="${si}" aria-label="Reducir peso de la serie ${si+1}">−</button>
          <div style="text-align:center;min-width:36px;">
            <div class="set-value" data-edit="${si}" data-field="kg" role="button" tabindex="0" aria-label="Editar peso de la serie ${si+1} (${escapeHtml(set.kg)} kg)">${escapeHtml(set.kg)}</div>
            <div class="set-label">kg</div>
          </div>
          <button class="stepper" data-kg-plus="${si}" aria-label="Aumentar peso de la serie ${si+1}">+</button>
          <div style="width:6px;"></div>
          <button class="stepper" data-reps-minus="${si}" aria-label="Reducir repeticiones de la serie ${si+1}">−</button>
          <div style="text-align:center;min-width:30px;">
            <div class="set-value" data-edit="${si}" data-field="reps" role="button" tabindex="0" aria-label="Editar repeticiones de la serie ${si+1} (${escapeHtml(set.reps)} reps)">${escapeHtml(set.reps)}</div>
            <div class="set-label">reps</div>
          </div>
          <button class="stepper" data-reps-plus="${si}" aria-label="Aumentar repeticiones de la serie ${si+1}">+</button>
        </div>
        <button class="set-done ${done?"done":""}" data-set-done="${si}" ${currentSet&&!done?"":done?"":"disabled"} aria-label="${done?`Serie ${si+1} completada`:`Marcar serie ${si+1} como completada`}" aria-pressed="${done}">✓</button>
      </div>
    </div>`;
  }).join("");

  const completedEx = Session.session.exercises.filter(e=>e.completed).length;
  const nextEx = Session.session.currentIdx+1 < Session.session.exercises.length ? Session.session.exercises[Session.session.currentIdx+1] : null;
  const instr = formatInstructions(getInstrucciones(ex));

  /* Lista de ejercicios pendientes (reordenable con flechas) */
  const upcoming = Session.session.exercises.slice(Session.session.currentIdx+1).map((u,i)=>{
    const absIdx = Session.session.currentIdx+1+i;
    const col = DAY_COLORS[day]||"#fff";
    return `<div class="up-row">
      <div class="up-arrows">
        <button class="up-arrow" data-move-up="${absIdx}" ${i===0?"disabled":""} aria-label="Mover ${escapeHtmlAttr(getApodo(u))} hacia arriba">↑</button>
        <button class="up-arrow" data-move-down="${absIdx}" ${absIdx===Session.session.exercises.length-1?"disabled":""} aria-label="Mover ${escapeHtmlAttr(getApodo(u))} hacia abajo">↓</button>
      </div>
      <span class="up-num" style="color:${escapeHtml(col)}">${escapeHtml(u.orden)}</span>
      <span class="up-name">${escapeHtml(getApodo(u))}</span>
      <span class="up-sets">${escapeHtml(u.sets.filter(s=>s.done).length)}/${escapeHtml(u.sets.length)}</span>
    </div>`;
  }).join("");

  return `<div class="section active Session.session-view">
    <div class="ex-active-card">
      <div class="ex-active-header">
        <span class="ex-active-count">${escapeHtml(Session.session.currentIdx+1)} / ${escapeHtml(totalEx)}</span>
      </div>
      <div class="ex-active-body">
        ${imgUrl ? `<div class="ex-img-wrap" data-img-zoom aria-label="Ampliar GIF de ${escapeHtmlAttr(apodo)}" role="button" tabindex="0">
          <img class="ex-active-img" src="${escapeHtmlAttr(imgUrl)}" alt="${escapeHtml(apodo)}" loading="lazy" decoding="async" data-img-fallback="hide">
          <div class="ex-img-zoom-hint">⛶</div>
        </div>` : ""}
        ${progressionBadgeHtml(ex, getHistory())}
        ${hasVariants ? `<button class="variant-btn" data-open-variants>↔️ Sustituir</button>` : ""}
      </div>
      ${instr ? `<button class="ex-instr-btn" data-instr-session-toggle>📖 Instrucciones</button>
      <div class="ex-instr-session" data-instr-session-body>${instr}</div>` : ""}
    </div>

    <div class="sets-grid">
      ${setRows}
      <button class="add-set-btn" data-add-set aria-label="Añadir una serie extra">＋ Añadir serie</button>
      ${nextEx ? `<div class="sess-next-hint">Siguiente: <b style="color:${escapeHtml(DAY_COLORS[day]||"#fff")}">${escapeHtml(getApodo(nextEx))}</b></div>` : ""}
    </div>

    ${upcoming ? `<div class="up-list">
      <div class="up-title">⏭ Pendientes (toca flechas para reordenar)</div>
      ${upcoming}
    </div>` : ""}
  </div>`;
}

/* ================================================================
   ACTUALIZACIÓN IN-PLACE (evita parpadeos al tocar kg/reps)
   ================================================================ */
function updateSessionSetValues(){
  if(!Session.session) return;
  const ex = Session.session.exercises[Session.session.currentIdx];
  ex.sets.forEach((set,si)=>{
    const kgEl = document.querySelector(`.set-value[data-edit="${si}"][data-field="kg"]`);
    const repsEl = document.querySelector(`.set-value[data-edit="${si}"][data-field="reps"]`);
    if(kgEl) kgEl.textContent = set.kg;
    if(repsEl) repsEl.textContent = set.reps;
  });
  /* Actualizar el header de sesión (nombre + % + barra de progreso) */
  updateSessionHeader();
}

/* STOP + pantalla resumen (guardado automático) */
let pendingSummary = null;

function computeSummary(){
  const completedSets = Session.session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  const totalReps = Session.session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+s.reps,0),0);
  const totalWeight = Session.session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(s.kg*s.reps),0),0);
  const elapsed = Math.floor((Date.now()-session.startTime)/1000)+Session.session.baseElapsed;
  const completedEx = Session.session.exercises.filter(e=>e.completed).length;
  return { completedSets, totalReps, totalWeight, elapsed, completedEx, totalEx: Session.session.exercises.length, exList: Session.session.exercises };
}

/* Guarda la sesión automáticamente (sin botones Guardar/Descartar) */
/* autoSaveSession → src/modules/session.js (issue #16) */

function showSummary(){
  if(!Session.session) return;
  EyeFit.RestTimer.stopRest();
  pendingSummary = computeSummary();
  autoSaveSession();
  const s = pendingSummary;
  if(s.completedSets === 0){
    const m = document.getElementById("sumSavedMsg");
    if(m) m.textContent = "⚠️ No se completó ninguna serie — no se guardó nada";
  }
  const mins = Math.floor(s.elapsed/60), secs = s.elapsed%60;
  document.getElementById("sumSub").textContent = `${Session.session.day} · ${mins}m ${String(secs).padStart(2,"0")}s`;
  document.getElementById("sumGrid").innerHTML = `
    <div class="sum-stat"><div class="sv">${escapeHtml(s.completedSets)}</div><div class="sl">Series</div></div>
    <div class="sum-stat"><div class="sv">${escapeHtml(s.totalReps)}</div><div class="sl">Reps</div></div>
    <div class="sum-stat"><div class="sv">${escapeHtml(s.completedEx)}/${escapeHtml(s.totalEx)}</div><div class="sl">Ejercicios</div></div>
    <div class="sum-stat"><div class="sv">${escapeHtml(Math.round(s.totalWeight))}<span style="font-size:12px;"> kg</span></div><div class="sl">Peso total</div></div>`;
  document.getElementById("sumExList").innerHTML = s.exList.filter(e=>e.sets.some(x=>x.done)).slice(0,10).map(e=>{
    const done = e.sets.filter(x=>x.done);
    return `<div class="sum-ex">
      <div class="sum-ex-top"><span style="color:${escapeHtml(DAY_COLORS[Session.session.day]||"#fff")}">${escapeHtml(getApodo(e))}</span><span>${escapeHtml(done.length)}×${escapeHtml(done[0]?.reps||0)} reps</span></div>
      <div class="sum-ex-sub">${done.map(x=>`${escapeHtml(x.kg)}kg`).join(" · ")}</div>
    </div>`;
  }).join("");
  document.getElementById("summaryOverlay").classList.add("show");
  setFocusTrap("summaryOverlay", document.getElementById("summaryOverlay"));
  document.getElementById("stopSessionBtn").style.display = "none";
}

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
function getVariants(ex){
  const res = [];
  const manuales = ALTERNATIVAS[ex.varianteBase || ex.dataset] || [];
  for(const nombre of manuales) res.push({ nombre, part: getExerciseBodyPart(ex, Dataset.datasetCache) || "musculatura similar" });
  if(res.length < 3 && Dataset.datasetCache){
    const found = findExerciseInDataset(Dataset.datasetCache, ex.dataset) || findExerciseInDataset(Dataset.datasetCache, ex.nombre_es);
    if(found && found.part){
      const auto = Dataset.datasetCache.filter(d=>d.part===found.part && normalizeName(d.name)!==normalizeName(found.name)).slice(0,3-res.length);
      for(const a of auto) res.push({ nombre:a.name, part:a.part });
    }
  }
  return res.slice(0, 4);
}

function openVariants(){
  const ex = Session.session.exercises[Session.session.currentIdx];
  const variants = getVariants(ex);
  document.getElementById("varCurrentEx").textContent = "Ejercicio actual: " + getApodo(ex);
  /* 4 tarjetas en grid 2x2: mantener actual + 3 alternativas (con GIF) */
  const items = [
    { nombre: "Mantener: " + getApodo(ex), img: getExerciseImage(ex, Dataset.datasetCache) },
    ...variants.map(v=>({ nombre: v.nombre, img: getExerciseImageForName(v.nombre, Dataset.datasetCache) }))
  ];
  const list = document.getElementById("varList");
  list.innerHTML = `<div class="var-grid">${items.map((it,i)=>`
    <div class="var-item" data-variant-idx="${escapeHtmlAttr(i)}">
      ${it.img ? `<img src="${escapeHtmlAttr(it.img)}" alt="${escapeHtml(it.nombre)}" loading="lazy" decoding="async" data-img-fallback="hide">` : `<div class="var-noimg">🏋️</div>`}
      <div class="vi-name">${escapeHtml(it.nombre)}</div>
    </div>`).join("")}</div>`;
  document.getElementById("varOverlay").classList.add("show");
  setFocusTrap("varOverlay", document.getElementById("varOverlay"));
}

function selectVariant(i){
  const ex = Session.session.exercises[Session.session.currentIdx];
  if(i === 0){ setFocusTrap("varOverlay", null); document.getElementById("varOverlay").classList.remove("show"); return; } // mantener actual
  const v = getVariants(ex)[i-1];
  if(!v) return;
  /* F1-C2: preservar el dataset original para no romper PR/progresión/
     precarga de pesos en sesiones futuras. El dataset original se usa
     como clave de continuidad; el nombre de la variante solo para mostrar. */
  if(!ex.varianteBase) ex.varianteBase = ex.datasetOriginal || ex.dataset;
  if(!ex.datasetOriginal) ex.datasetOriginal = ex.dataset;
  ex.dataset = v.nombre;
  ex.nombre_es = v.nombre;
  setFocusTrap("varOverlay", null);
  document.getElementById("varOverlay").classList.remove("show");
  saveSessionState();
  renderMain();
  showToast("↔️ Variante: " + v.nombre);
}

/* ================================================================
   HISTORIAL colapsable con apodos
   ================================================================ */
let histMonthCursor = null;
let histActiveDate = localDateKey(new Date());
let editingHistRecord = null;

function getHistMonthSessions(history, year, month){
  const map = {};
  for(const h of history){
    try{
      const d = new Date(h.date);
      if(d.getFullYear() === year && d.getMonth() === month){
        const key = localDateKey(d);
        if(!map[key]) map[key] = [];
        map[key].push(h);
      }
    }catch(e){}
  }
  return map;
}

function renderHistMonthNav(year, month){
  const prev = new Date(year, month-1, 1);
  const next = new Date(year, month+1, 1);
  const label = new Date(year, month, 1).toLocaleDateString("es-ES", {month:"long", year:"numeric"});
  return `<div class="hist-cal-nav">
    <button class="hist-cal-prev" data-hist-month-change="${prev.getFullYear()},${prev.getMonth()}" aria-label="Mes anterior">‹</button>
    <span class="hist-cal-label">${label.charAt(0).toUpperCase()+label.slice(1)}</span>
    <button class="hist-cal-next" data-hist-month-change="${next.getFullYear()},${next.getMonth()}" aria-label="Mes siguiente">›</button>
  </div>`;
}

function renderHistCalendar(history){
  const nc = histMonthCursor ? { y:histMonthCursor[0], m:histMonthCursor[1] }
    : (()=>{ const t=new Date(); return { y:t.getFullYear(), m:t.getMonth() }; })();
  const { y, m } = nc;
  const byDay = getHistMonthSessions(history, y, m);
  const firstDay = new Date(y, m, 1);
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; /* Lunes como primer día (convención ES) */
  const todayStr = localDateKey(new Date());
  const cells = [];
  const dayNames = ["L","M","X","J","V","S","D"];
  for(const dn of dayNames) cells.push(`<div class="hist-cal-dow">${dn}</div>`);
  for(let i=0; i<startOffset; i++) cells.push(`<div class="hist-cal-cell empty"></div>`);
  for(let d=1; d<=daysInMonth; d++){
    const ds = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const hasSess = byDay[ds] && byDay[ds].length > 0;
    const isToday = ds === todayStr;
    const isActive = histActiveDate === ds;
    cells.push(`<div class="hist-cal-cell ${hasSess?"has-sess":""} ${isToday?"today":""} ${isActive?"active":""}" data-hist-day="${ds}" role="button" tabindex="0" aria-label="${ds}${hasSess?` · ${byDay[ds].length} sesión${byDay[ds].length>1?"es":""}`:""}">
      <span class="hist-cal-num">${d}</span>
      ${hasSess?`<span class="hist-cal-dot"></span>`:""}
    </div>`);
  }
  return `<div class="hist-cal-wrap">
    ${renderHistMonthNav(y, m)}
    <div class="hist-cal-grid">${cells.join("")}</div>
  </div>`;
}

function renderHistDayDetail(history, dateStr){
  const sessions = history.filter(h=>{ try{ return localDateKey(new Date(h.date)) === dateStr; }catch(e){ return false; } });
  if(!sessions.length) return `<div class="empty-state">No hay sesión registrada en ${dateStr}.</div>`;

  /* Ordenar sesiones por hora de inicio (de más antiguas a más recientes) */
  const sorted = [...sessions].sort((a,b)=> new Date(a.date) - new Date(b.date));

  /* Renderizar UNA card por sesión del día (BUG FIX: antes solo mostraba sessions[0]) */
  const cards = sorted.map(h=>{
    const color = DAY_COLORS[h.day] || "#fff";
    const exDone = h.exercises.filter(e=>e.sets.some(s=>s.done)==true);
    const exHtml = exDone.slice(0,10).map(e=>{
      const key = String(e.datasetOriginal||e.dataset||e.nombre_es||"").trim().toLowerCase();
      const prog = getExerciseProgression(key);
      const bestNow = getHistoricalBest(key);
      const spark = svgSparkline(prog);
      const rmLabel = bestNow && bestNow.rm ? `${escapeHtml(formatKg(Math.round(bestNow.rm)))}` : "";
      const rmHint = bestNow && bestNow.rm ? ` title="1RM = ${escapeHtml(formatKg(bestNow.kg))} × (1 + ${escapeHtml(bestNow.reps)}/30) = ${escapeHtml(formatKg(Math.round(bestNow.rm)))} kg (Epley)" data-has-rm="1"` : "";
      return `<div class="hist-ex-line">
        <div class="hist-ex">
          <span class="hist-ex-name">${escapeHtml(getApodo(e))}</span>
          <span class="hist-ex-set">${e.sets.filter(s=>s.done).map(s=>`${escapeHtml(s.reps)}×${escapeHtml(formatKg(s.kg))}`).join(" · ")}</span>
        </div>
        ${spark ? `<div class="hist-ex-prog"><span class="lbl rm-tappable" ${rmHint}>1RM ${rmLabel}</span>${spark}</div>` : ""}
      </div>`;
    }).join("");
    const mins = Math.floor((h.duration||0)/60), secs=(h.duration||0)%60;
    const timeLabel = new Date(h.date).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
    return `<div class="hist-day open" data-hist-date="${escapeHtmlAttr(dateStr)}">
      <div class="hist-content">
        <div class="hist-day-top">
          <div class="hist-tri open"></div>
          <span class="hist-day-name" style="color:${escapeHtml(color)}">${escapeHtml(h.day)}</span>
          <span class="hist-day-date">${escapeHtml(timeLabel)} · ${escapeHtml(mins)}m ${escapeHtml(secs)}s</span>
          <button class="hist-edit-btn" data-edit-hist-date="${escapeHtmlAttr(dateStr)}" data-edit-hist-sessid="${escapeHtmlAttr(h.session_id||"")}" aria-label="Editar sesión">✏️</button>
          <button class="hist-del-btn" data-del-session="${escapeHtmlAttr(dateStr)}" data-del-sessid="${escapeHtmlAttr(h.session_id||"")}" aria-label="Eliminar sesión">🗑️</button>
        </div>
        <div class="hist-day-body open">
          <div class="hist-day-stats">${escapeHtml(exDone.length)} ejercicios · ${escapeHtml(h.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0))} series</div>
          ${exHtml}
        </div>
      </div>
    </div>`;
  }).join("");

  return `<div class="hist-days-mult">
    ${cards}
  </div>`;
}


function renderHistorial(){
  const history = getHistory();
  if(!history || history.length===0){
    return `<div class="section active">
      <h2 class="title">📈 Historial</h2>
      <div class="empty-state">Aún no hay sesiones.<br>Termina tu primer entrenamiento.</div>
    </div>`;
  }
  const totalSessions = history.length;
  const totalTime = history.reduce((a,h)=>a+(h.duration||0),0);
  const totalSets = history.reduce((a,h)=>a+h.exercises.reduce((b,e)=>b+e.sets.filter(s=>s.done).length,0),0);
  const streak = getStreak();
  const streakHtml = streak > 0 ? `<div class="streak-banner">🔥 Racha: ${escapeHtml(streak)} día${Number(streak)>1?"s":""}</div>` : "";
  const cal = renderHistCalendar(history);
  const detail = histActiveDate ? renderHistDayDetail(history, histActiveDate) : "";
  return `<div class="section active">
    <h2 class="title">📈 Historial</h2>
    ${streakHtml}
    <div class="hist-summary">
      <div class="hist-stat"><div class="v">${escapeHtml(totalSessions)}</div><div class="l">Sesiones</div></div>
      <div class="hist-stat"><div class="v">${escapeHtml(Math.floor(totalTime/60))}m</div><div class="l">Tiempo total</div></div>
      <div class="hist-stat"><div class="v">${escapeHtml(totalSets)}</div><div class="l">Series</div></div>
    </div>
    ${cal}
    ${detail}
  </div>`;
}

function openEditHistSession(h){
  if(!h) return;
  const dateEl = document.getElementById("editHistDate");
  if(dateEl) dateEl.textContent = `${h.day} · ${new Date(h.date).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}`;
  /* Hora de inicio y duración */
  const startEl = document.getElementById("editHistStart");
  if(startEl){
    const d = new Date(h.date);
    if(!isNaN(d.getTime())){
      startEl.value = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    }
  }
  const durEl = document.getElementById("editHistDur");
  if(durEl){
    durEl.value = Math.round((h.duration||0)/60) || "";
  }
  const listEl = document.getElementById("editHistList");
  if(listEl){
    listEl.innerHTML = (h.exercises||[]).map((ex,ei)=>{
      const sets = (ex.sets||[]);
      const rows = sets.length ? sets.map((s,si)=>`
        <div class="edit-hist-set">
          <span class="ehs-num">${si+1}</span>
          <input type="number" class="ehs-input" data-eh-kg="${ei}|${si}" value="${escapeHtml(s.kg)}" step="0.5" min="0" inputmode="decimal" aria-label="Peso">
          <span class="ehs-label">kg</span>
          <input type="number" class="ehs-input" data-eh-reps="${ei}|${si}" value="${escapeHtml(s.reps)}" step="1" min="1" inputmode="numeric" aria-label="Reps">
          <span class="ehs-label">reps</span>
          <button class="ehs-del-set" data-eh-del="${ei}|${si}" aria-label="Eliminar serie ${si+1}">🗑</button>
        </div>`).join("")
        : `<div style="color:var(--muted);font-size:11px;">Sin series</div>`;
      return `<div class="edit-hist-ex">
        <div class="eh-name-row">
          <span class="eh-name">${escapeHtml(getApodo(ex))}</span>
          <span style="display:flex;gap:4px;">
            <button class="ehs-swap-ex" data-eh-swap="${ei}" aria-label="Sustituir ejercicio ${escapeHtmlAttr(getApodo(ex))}">↔️</button>
            <button class="ehs-del-ex" data-eh-del-ex="${ei}" aria-label="Eliminar ejercicio">✕</button>
          </span>
        </div>
        ${rows}
        <button class="ehs-add-set" data-eh-add-set="${ei}">＋ Añadir serie</button>
      </div>`;
    }).join("");
  }
  const ov = document.getElementById("editHistOverlay");
  if(ov) ov.classList.add("show");
  setFocusTrap("editHistOverlay", ov);
  editingHistRecord = h;
}

function dismissEditHist(){
  const ov = document.getElementById("editHistOverlay");
  if(ov) ov.classList.remove("show");
  setFocusTrap("editHistOverlay", null);
  editingHistRecord = null;
}

async function saveEditHist(){
  if(!editingHistRecord) return;

  /* Hora de inicio */
  const startEl = document.getElementById("editHistStart");
  if(startEl && startEl.value){
    const [hh, mm] = startEl.value.split(":").map(Number);
    if(!isNaN(hh) && !isNaN(mm)){
      const d = new Date(editingHistRecord.date);
      if(!isNaN(d.getTime())){
        d.setHours(hh, mm);
        editingHistRecord.date = d.toISOString();
      }
    }
  }
  /* Duración (minutos → segundos) */
  const durEl = document.getElementById("editHistDur");
  if(durEl){
    const mins = parseFloat(durEl.value);
    if(!isNaN(mins) && mins >= 0) editingHistRecord.duration = Math.round(mins * 60);
  }

  const listEl = document.getElementById("editHistList");
  if(listEl){
    /* Añadir/restaurar series y ejercicios desde el DOM */
    /* 1. Operaciones de añadir serie: ya se aplicaron en vivo via añadir-set/del handlers */
    /* 2. Leer todos los inputs kg/reps y aplicarlos al working copy */
    listEl.querySelectorAll("[data-eh-kg],[data-eh-reps]").forEach(inp=>{
      const [ei, si] = inp.getAttribute(inp.hasAttribute("data-eh-kg")?"data-eh-kg":"data-eh-reps").split("|").map(Number);
      const ex = editingHistRecord.exercises[ei];
      if(!ex || !ex.sets) return;
      const set = ex.sets[si];
      if(!set) return;
      const val = parseFloat(inp.value);
      if(inp.hasAttribute("data-eh-kg")){ if(!isNaN(val)) set.kg = val; }
      else { if(!isNaN(val)) set.reps = Math.max(1, Math.round(val)); }
    });
    /* Nota: los ejercicios ya se eliminan directamente en editingHistRecord.exercises
       via el handler [data-eh-del-ex]. No hace falta reconciliación adicional. */
  }
  const history = getHistory();
  const idx = history.findIndex(x=>x.session_id === editingHistRecord.session_id);
  if(idx === -1){
    /* Legacy: buscar por date+day */
    const legacyIdx = history.findIndex(x=>x.date === editingHistRecord.date && x.day === editingHistRecord.day);
    if(legacyIdx !== -1){ history[legacyIdx] = editingHistRecord; }
    else { history.push(editingHistRecord); }
  } else {
    history[idx] = editingHistRecord;
  }
  /* Sincronización correcta: la edición local debe "ganarle" al servidor en el
     Last-Write-Wins (mergeHistoryBySessionId compara updated_at). Si no se
     actualiza, un pullServerData posterior (al entrar en Historial, en pageshow
     o en el reintento de 30s) bajaría la versión vieja del servidor y REVERTIRÍA
     la edición local. Actualizamos updated_at antes de persistir/subir. */
  const editedNowIso = new Date().toISOString();
  editingHistRecord.updated_at = editedNowIso;
  const updated = history.map(r =>
    r === editingHistRecord ? { ...r, updated_at: editedNowIso } : r
  );
  saveHistory(updated);
  if(SB.sbClient && SB.authUser){
    /* Subir SOLO la sesión editada al servidor, esperando el resultado. Si el
       envío falla, dejarla en pending para que el sync de 30s la reintente. */
    const ok = await pushSessionToServer(editingHistRecord);
    if(!ok){
      const p = getPending(); p.sessions.push(editingHistRecord); setPending(p);
    }
    await scheduleSync();
    /* Refrescar desde el servidor ya con la sesión editada subida, para que un
       render posterior (p.ej. al volver a Historial) no muestre una versión
       obsoleta del servidor que revierta la edición. */
    await pullServerData();
  }
  dismissEditHist();
  renderMain();
  showToast("💾 Sesión editada y guardada");
}

/* Handler de calendario de historial */
function attachHistCalendarEvents(){
  document.querySelectorAll("[data-hist-month-change]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [y,m] = btn.dataset.histMonthChange.split(",").map(Number);
      histMonthCursor = [y,m];
      renderMain();
    });
  });
  document.querySelectorAll("[data-hist-day]").forEach(cell=>{
    cell.addEventListener("click", ()=>{
      const ds = cell.dataset.histDay;
      histActiveDate = (histActiveDate === ds) ? null : ds;
      renderMain();
    });
    cell.addEventListener("keydown", (e)=>{
      if(e.key==="Enter"||e.key===" "){
        e.preventDefault();
        const ds = cell.dataset.histDay;
        histActiveDate = (histActiveDate === ds) ? null : ds;
        renderMain();
      }
    });
  });
  document.querySelectorAll("[data-edit-hist-date]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const ds = btn.dataset.editHistDate;
      const sessId = btn.dataset.editHistSessid;
      const history = getHistory();
      /* Buscar por session_id si existe (varias sesiones por día), fallback a date+day */
      let h;
      if(sessId){
        h = history.find(x=>x.session_id === sessId);
      }
      if(!h){
        h = history.find(x=>{ try{ return localDateKey(new Date(x.date)) === ds; }catch(err){ return false; } });
      }
      if(h) openEditHistSession(h);
    });
  });
  /* Eliminar sesión del historial (botón explícito) */
  document.querySelectorAll("[data-del-session]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const ds = btn.dataset.delSession;
      const sessId = btn.dataset.delSessid;
      const history = getHistory();
      let h;
      if(sessId){
        h = history.find(x=>x.session_id === sessId);
      }
      if(!h){
        h = history.find(x=>{ try{ return localDateKey(new Date(x.date)) === ds; }catch(err){ return false; } });
      }
      if(h) deleteHistorySession(h.date, h.day);
    });
  });
}

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
      const ex = editingHistRecord && editingHistRecord.exercises && editingHistRecord.exercises[ei];
      if(!ex) return;
      const last = ex.sets && ex.sets[ex.sets.length-1];
      if(!ex.sets) ex.sets = [];
      ex.sets.push({
        kg: last && last.kg != null ? last.kg : (parseFloat(ex.peso_kg)||0),
        reps: last && last.reps != null ? last.reps : (parseInt(ex.reps)||8),
        done: true
      });
      /* Re-renderizar el overlay para mostrar la nueva fila */
      openEditHistSession(editingHistRecord);
    }
    if(delBtn){
      const [ei, si] = delBtn.dataset.ehDel.split("|").map(Number);
      const ex = editingHistRecord && editingHistRecord.exercises && editingHistRecord.exercises[ei];
      if(!ex || !ex.sets) return;
      ex.sets.splice(si, 1);
      openEditHistSession(editingHistRecord);
    }
    if(delExBtn){
      const ei = parseInt(delExBtn.dataset.ehDelEx);
      if(!editingHistRecord || !Array.isArray(editingHistRecord.exercises)) return;
      editingHistRecord.exercises.splice(ei, 1);
      openEditHistSession(editingHistRecord);
    }
    if(swapBtn){
      const ei = parseInt(swapBtn.dataset.ehSwap);
      if(!editingHistRecord || !Array.isArray(editingHistRecord.exercises)) return;
      editHistSubIdx = ei;
      /* Abrir el picker de ejercicios en modo sustitución */
      openHistExercisePicker();
    }
  });
}

/* Abre el picker de ejercicio para SUSTITUIR dentro del historial (F5) */
function openHistExercisePicker(){
  document.getElementById("pickerDayLabel").textContent = "Sustituir ejercicio del historial";
  renderPickerList("");
  document.getElementById("exPickerOverlay").classList.add("show");
  setFocusTrap("exPickerOverlay", document.getElementById("exPickerOverlay"));
  setTimeout(()=>document.getElementById("pickerSearch").focus(), 100);
}


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
      routineEditDay = btn.dataset.editRoutineDay || selectedDay || null;
      renderMain();
    });
  });
  document.querySelectorAll("[data-edit-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ routineEditDay = el.dataset.editDay; renderMain(); });
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
      routineEditDay = null;
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
      routineEditDay = null;
      renderMain();
      showToast("💾 Rutina guardada");
    });
  });
  document.querySelectorAll("[data-edit-ex-add],[data-edit-add-ex]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const day = routineEditDay || selectedDay;
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
  async function deleteHistorySession(date, day){
    if(confirm("¿Borrar esta sesión?")){
      /* Capturar el session_id ANTES de eliminar (se necesita para el servidor) */
      const history = getHistory();
      const idx = history.findIndex(h=>h.date===date && h.day===day);
      const targetSid = (idx !== -1 && history[idx].session_id) ? history[idx].session_id : null;
      if(idx !== -1) history.splice(idx, 1);
      saveHistory(history);
      /* Eliminar también de la cola de pendientes si aún no se había subido */
      const p = getPending();
      p.sessions = p.sessions.filter(s=>!(s.date===date && s.day===day));
      setPending(p);
      /* Eliminar de la nube si hay sesión (mismo date + day) */
      if(SB.sbClient && SB.authUser){
        try{
          const { data: rows } = await SB.sbClient.from("sesiones").select("id, data").eq("user_id", SB.authUser.id);
          if(Array.isArray(rows)){
            /* Buscar por session_id (preciso) o fallback por date+day (legacy) */
            const matches = rows.filter(r=>r.data && (
              (r.data.session_id && targetSid && r.data.session_id === targetSid) ||
              (r.data.date===date && r.data.day===day)
            ));
            for(const m of matches){
              if(m.data.session_id){
                await SB.sbClient.from("sesiones").delete().eq("session_id", m.data.session_id).eq("user_id", SB.authUser.id).catch(()=>{});
              } else {
                await SB.sbClient.from("sesiones").delete().eq("id", m.id).catch(()=>{});
              }
            }
          }
        }catch(e){}
      }
      /* Forzar sincronización para confirmar el borrado en la nube */
      if(SB.sbClient && SB.authUser) scheduleSync();
      renderMain();
      showToast("🗑️ Sesión eliminada" + (SB.sbClient && SB.authUser ? " · sincronizada" : ""));
    }
  }
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
        const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
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
let numPadCtx = { idx:0, field:"kg" };
function openNumPad(idx, field){
  numPadCtx = { idx, field };
  const ex = Session.session.exercises[Session.session.currentIdx];
  const set = ex.sets[idx];
  document.getElementById("numLabel").textContent = field==="kg" ? "Peso (kg)" : "Repeticiones";
  const input = document.getElementById("numInput");
  input.value = field==="kg" ? set.kg : set.reps;
  input.step = field==="kg" ? "0.5" : "1";
  input.min = field==="kg" ? "0" : "1";
  input.max = field==="kg" ? "200" : "30";
  const slider = document.getElementById("numSlider");
  slider.min = field==="kg" ? "0" : "1";
  slider.max = field==="kg" ? "200" : "30";
  slider.step = field==="kg" ? "0.5" : "1";
  slider.value = input.value;
  document.getElementById("numOverlay").classList.add("show");
  setFocusTrap("numOverlay", document.getElementById("numOverlay"));
  setTimeout(()=>{ input.focus(); input.select(); }, 100);
}
function closeNumPad(){ document.getElementById("numOverlay").classList.remove("show"); setFocusTrap("numOverlay", null); }
function confirmNumPad(){
  if(!Session.session){ closeNumPad(); return; }
  const val = parseFloat(document.getElementById("numInput").value);
  if(isNaN(val)){ closeNumPad(); return; }
  const ex = Session.session.exercises[Session.session.currentIdx];
  const set = ex.sets[numPadCtx.idx];
  if(numPadCtx.field==="kg"){
    set.kg = clampNum(val, 0, 500, 0);
    for(let j=numPadCtx.idx+1; j<ex.sets.length; j++) ex.sets[j].kg = set.kg;
  } else {
    set.reps = clampNum(Math.round(val), 1, 100, 1);
    for(let j=numPadCtx.idx+1; j<ex.sets.length; j++) ex.sets[j].reps = set.reps;
  }
  saveSessionState();
  closeNumPad();
  updateSessionSetValues();
}
/* F2: numpad para editar series/reps/kg de la rutina (sin sesión activa) */
let numPadRoutineCtx = null; /* { name, day, field } */
function openRoutineNumPad(el){
  const field = el.dataset.rtEdit;
  const name = el.dataset.rtName;
  const day = el.dataset.rtDay;
  if(!name) return;
  const routine = getRoutine();
  const ex = routine.find(e=>e.dia===day && e.nombre_es===name);
  if(!ex) return;
  const cur = field==="series" ? parseFloat(ex.series||0)
             : field==="reps"  ? parseFloat(ex.reps||0)
             : parseFloat(ex.peso_kg||0);
  numPadRoutineCtx = { name, day, field };
  const labelMap = { series:"Series", reps:"Reps por serie", kg:"Peso inicial (kg)" };
  document.getElementById("numLabel").textContent = labelMap[field] || field;
  const input = document.getElementById("numInput");
  input.value = isNaN(cur) ? 0 : cur;
  input.step = (field==="series"||field==="reps") ? "1" : "0.5";
  input.min = (field==="kg") ? "0" : "1";
  input.max = (field==="series") ? "20" : (field==="reps" ? "100" : "500");
  const slider = document.getElementById("numSlider");
  slider.min = input.min; slider.max = input.max; slider.step = input.step;
  slider.value = input.value;
  document.getElementById("numOverlay").classList.add("show");
  setFocusTrap("numOverlay", document.getElementById("numOverlay"));
  setTimeout(()=>{ input.focus(); input.select(); }, 100);
}
function confirmRoutineNumPad(){
  if(!numPadRoutineCtx){ closeNumPad(); return; }
  const val = parseFloat(document.getElementById("numInput").value);
  if(isNaN(val)){ closeNumPad(); return; }
  const { name, day, field } = numPadRoutineCtx;
  applyRoutineChange(r=>{
    const ex = r.find(e=>e.dia===day && e.nombre_es===name);
    if(!ex) return r;
    if(field==="series") ex.series = clampNum(Math.round(val), 1, 20, 3);
    else if(field==="reps") ex.reps = clampNum(Math.round(val), 1, 100, 8);
    else if(field==="kg") ex.peso_kg = clampNum(val, 0, 500, 0);
    return r;
  });
  closeNumPad();
  numPadRoutineCtx = null;
  renderMain();
  showToast("💾 Rutina actualizada");
}
/* Interceptar el OK del numpad según contexto (sesión vs rutina) */
document.getElementById("numOk").addEventListener("click", ()=>{
  if(numPadRoutineCtx){ confirmRoutineNumPad(); }
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
  if(numPadRoutineCtx){ confirmRoutineNumPad(); }
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


"use strict";
/* ════════════════════════════════════════════════════════════════
   EyeFit v1.3 — descanso en barra superior, alternativas con GIF,
   guardado automático, control de series, sin parpadeos
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
const getApodo = U.getApodo;
const epley1RM = U.epley1RM;
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

/* ---------- Supabase ---------- */
const SUPABASE_URL = "https://vkaxxphminfinufitcyp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9mIRx8rfkAtHv9w57cbCKw_P_btyOou";
let sbClient = null;
let authUser = null;
try{ if(window.supabase) sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }catch(e){}

/* ================================================================
   DATOS
   ================================================================ */

const DAY_SHORT = { Lunes:"LUN", Martes:"MAR", Miércoles:"MIÉ", Jueves:"JUE", Viernes:"VIE" };
const WEEKDAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function getTodayName(){ return WEEKDAY_NAMES[new Date().getDay()]; }

/* Rutina por defecto */
const DEFAULT_ROUTINE = [
  { dia:"Lunes",     orden:1, nombre_es:"Press banca plano con barra",         dataset:"barbell bench press",                      series:3, reps:8,  peso_kg:40, descanso_s:180, notas:"Codos a 45°, retracción escapular." },
  { dia:"Lunes",     orden:2, nombre_es:"Press inclinado con mancuernas",       dataset:"dumbbell incline bench press",             series:3, reps:10, peso_kg:18, descanso_s:120, notas:"Porción clavicular del pectoral." },
  { dia:"Lunes",     orden:3, nombre_es:"Press militar sentado con mancuernas", dataset:"dumbbell seated shoulder press",           series:3, reps:10, peso_kg:14, descanso_s:120, notas:"No arquear la espalda." },
  { dia:"Lunes",     orden:4, nombre_es:"Aperturas en polea alta (pecho)",      dataset:"cable standing fly",                      series:3, reps:15, peso_kg:8,  descanso_s:90,  notas:"Tensión continua." },
  { dia:"Lunes",     orden:5, nombre_es:"Elevaciones laterales con mancuernas", dataset:"dumbbell lateral raise",                  series:4, reps:15, peso_kg:6,  descanso_s:60,  notas:"Sin balanceo." },
  { dia:"Lunes",     orden:6, nombre_es:"Ext. tríceps en polea (cuerda)",       dataset:"cable pushdown (with rope attachment)",    series:3, reps:15, peso_kg:12, descanso_s:75,  notas:"Codos fijos." },
  { dia:"Martes",    orden:1, nombre_es:"Sentadilla con barra (barra alta)",    dataset:"barbell full squat",                      series:4, reps:6,  peso_kg:40, descanso_s:180, notas:"Bajar hasta paralelo." },
  { dia:"Martes",    orden:2, nombre_es:"Prensa de piernas 45°",                dataset:"sled 45° leg press",                      series:3, reps:12, peso_kg:60, descanso_s:120, notas:"Sin bloquear rodillas." },
  { dia:"Martes",    orden:3, nombre_es:"Extensión de cuádriceps en máquina",   dataset:"lever leg extension",                     series:3, reps:15, peso_kg:20, descanso_s:90,  notas:"Pausa 1s arriba." },
  { dia:"Martes",    orden:4, nombre_es:"Curl femoral tumbado en máquina",      dataset:"lever lying leg curl",                    series:3, reps:12, peso_kg:20, descanso_s:90,  notas:"Control en negativa." },
  { dia:"Martes",    orden:5, nombre_es:"Elevación de talones de pie",          dataset:"barbell standing calf raise",             series:4, reps:15, peso_kg:30, descanso_s:75,  notas:"Rango completo." },
  { dia:"Miércoles", orden:1, nombre_es:"Remo con barra (agarre prono, 45°)",   dataset:"barbell bent over row",                   series:4, reps:8,  peso_kg:35, descanso_s:180, notas:"Tirar con codos." },
  { dia:"Miércoles", orden:2, nombre_es:"Jalón al pecho en polea",              dataset:"cable pulldown (pro lat bar)",             series:3, reps:12, peso_kg:35, descanso_s:120, notas:"Barra al pecho superior." },
  { dia:"Miércoles", orden:3, nombre_es:"Remo en polea baja (agarre neutro)",   dataset:"cable seated row",                        series:3, reps:12, peso_kg:30, descanso_s:120, notas:"Contraer escápulas." },
  { dia:"Miércoles", orden:4, nombre_es:"Face pull en polea alta (cuerda)",     dataset:"cable standing rear delt row (with rope)", series:3, reps:20, peso_kg:10, descanso_s:75,  notas:"Tirar hacia la cara." },
  { dia:"Miércoles", orden:5, nombre_es:"Curl con barra EZ (sentado)",          dataset:"ez barbell curl",                         series:3, reps:12, peso_kg:15, descanso_s:90,  notas:"Codos fijos." },
  { dia:"Miércoles", orden:6, nombre_es:"Curl martillo con mancuernas",         dataset:"dumbbell hammer curl",                    series:2, reps:15, peso_kg:8,  descanso_s:75,  notas:"Agarre neutro." },
  { dia:"Jueves",    orden:1, nombre_es:"Peso muerto convencional",             dataset:"barbell deadlift",                        series:3, reps:5,  peso_kg:50, descanso_s:210, notas:"Espalda neutra." },
  { dia:"Jueves",    orden:2, nombre_es:"Hip thrust con barra",                 dataset:"barbell glute bridge two legs on bench (male)", series:4, reps:12, peso_kg:50, descanso_s:120, notas:"Extensión completa arriba." },
  { dia:"Jueves",    orden:3, nombre_es:"Buenos días con barra (peso ligero)",  dataset:"barbell good morning",                    series:3, reps:12, peso_kg:20, descanso_s:120, notas:"Cadera atrás. Espalda neutra." },
  { dia:"Jueves",    orden:4, nombre_es:"Patada de glúteo en polea",            dataset:"cable kickback",                          series:3, reps:15, peso_kg:10, descanso_s:75,  notas:"Extensión de cadera." },
  { dia:"Jueves",    orden:5, nombre_es:"Elevación de talones sentado (sóleo)", dataset:"lever seated calf raise",                series:4, reps:15, peso_kg:25, descanso_s:75,  notas:"Pausa arriba." },
  { dia:"Viernes",   orden:1, nombre_es:"Press banca inclinado con barra (30°)",dataset:"barbell incline bench press",             series:3, reps:8,  peso_kg:30, descanso_s:180, notas:"Refuerza pectoral superior." },
  { dia:"Viernes",   orden:2, nombre_es:"Dominadas (agarre neutro)",            dataset:"pull up (neutral grip)",                  series:3, reps:8,  peso_kg:0,  descanso_s:180, notas:"Extensión total abajo." },
  { dia:"Viernes",   orden:3, nombre_es:"Press Arnold con mancuernas",          dataset:"dumbbell arnold press",                   series:3, reps:12, peso_kg:10, descanso_s:120, notas:"Rotación natural." },
  { dia:"Viernes",   orden:4, nombre_es:"Elevaciones laterales en polea baja",  dataset:"cable lateral raise",                     series:4, reps:20, peso_kg:5,  descanso_s:60,  notas:"Tensión constante." },
  { dia:"Viernes",   orden:5, nombre_es:"Curl en polea baja (barra recta)",     dataset:"cable curl",                              series:3, reps:15, peso_kg:10, descanso_s:75,  notas:"No mover codos." },
  { dia:"Viernes",   orden:6, nombre_es:"Ext. overhead tríceps (cuerda)",       dataset:"cable overhead triceps extension (rope attachment)", series:3, reps:15, peso_kg:10, descanso_s:75, notas:"Cabeza larga estirada." },
];

/* Instrucciones curadas en español (3-4 pasos clave) */
const INSTRUCCIONES = {
  "barbell bench press":"Acuéstate en el banco, pies en el suelo\nAgarra la barra algo más ancha que hombros\nBaja al pecho controlado y sube",
  "dumbbell incline bench press":"Banco a 45°, mancuernas a la altura del pecho\nSube extendiendo brazos\nBaja controlado hasta el pecho",
  "dumbbell seated shoulder press":"Sentado, espalda apoyada, mancuernas a los hombros\nPresiona hacia arriba hasta extender\nBaja controlado",
  "cable standing fly":"De pie, poleas a la altura del pecho\nJunta las manos frente al pecho\nVuelve con control",
  "dumbbell lateral raise":"De pie, mancuernas a los lados\nSube los brazos hasta la horizontal\nBaja lento",
  "cable pushdown (with rope attachment)":"De pie, codos pegados al torso\nEmpuja la cuerda hacia abajo\nAbre al final y vuelve",
  "barbell full squat":"Barra sobre la espalda, pies ancho hombros\nBaja hasta que el muslo quede paralelo\nSube empujando con fuerza",
  "sled 45° leg press":"Sentado en la prensa, pies en la plataforma\nBaja sin bloquear rodillas\nEmpuja de vuelta",
  "lever leg extension":"Sentado, tobillos bajo el rodillo\nExtiende las piernas pausa arriba\nBaja controlado",
  "lever lying leg curl":"Tumbado boca abajo, rodillo en tobillos\nFlexiona las piernas llevando los talones al glúteo\nBaja lento",
  "barbell standing calf raise":"De pie, barra sobre la espalda\nSube de puntillas lo máximo\nBaja controlado",
  "barbell bent over row":"Torso a 45°, barra colgando\nTira de la barra hacia el abdomen\nBaja controlado",
  "cable pulldown (pro lat bar)":"Sentado, barra ancha\nTira de la barra hasta el pecho\nSube controlado",
  "cable seated row":"Sentado, rodillas flexionadas\nTira del asa hacia el abdomen\nVuelve estirando",
  "cable standing rear delt row (with rope)":"De pie, cuerda a la altura de la cara\nTira hacia la nariz abriendo los codos\nVuelve controlado",
  "ez barbell curl":"De pie agarre supino\nFlexiona codos subiendo la barra\nBaja lento",
  "dumbbell hammer curl":"De pie, palmas mirándose\nSube las mancuernas a los hombros\nBaja controlado",
  "barbell deadlift":"Pies ancho de hombros, barra en el suelo\nEmpuja con piernas, espalda recta\nBloquea arriba",
  "barbell glute bridge two legs on bench (male)":"Espalda en banco, barra en cadera\nSube la cadera hacia arriba\nBaja controlado",
  "barbell good morning":"Barra en la espalda, rodillas flex\nInclina el torso con espalda recta\nVuelve arriba",
  "cable kickback":"De pie, patada hacia atrás\nExtiende cadera con control\nVuelve",
  "lever seated calf raise":"Sentado, rodillos sobre rodillas\nSube de puntillas\nBaja estirando",
  "barbell incline bench press":"Banco 30°, barra al pecho superior\nBaja controlado y sube",
  "pull up (neutral grip)":"Agarre neutro en la barra\nSube hasta pasar la barbilla\nBaja controlado",
  "dumbbell arnold press":"Mancuernas a la altura de los hombros con palmas hacia ti\nSube rotando las palmas hacia delante\nBaja controlado",
  "cable lateral raise":"De pie, polea baja a un lado\nSube el brazo hasta la horizontal\nBaja lento",
  "cable curl":"De pie, barra recta en polea baja\nFlexiona los codos sin moverlos\nBaja lento",
  "cable overhead triceps extension (rope attachment)":"De pie, cuerda tras la cabeza\nExtiende los brazos hacia arriba\nVuelve flexionando"
};
function getInstrucciones(ex){
  return INSTRUCCIONES[ex.datasetOriginal || ex.dataset] || ex.notas || "Colócate en la posición inicial y realiza el movimiento con control";
}

/* 3 alternativas manuales en español por ejercicio */
const ALTERNATIVAS = {
  "barbell bench press": ["Press Banca Inclinado", "Flexiones", "Press Máquina"],
  "dumbbell incline bench press": ["Press Banca Plano", "Press Máquina", "Aperturas"],
  "dumbbell seated shoulder press": ["Press Militar Barra", "Press Arnold", "Prensa Hombro"],
  "cable standing fly": ["Aperturas Mancuernas", "Cruce Polea Baja", "Pec Deck"],
  "dumbbell lateral raise": ["Polea Lateral", "Elevación Sentado", "Pájaros"],
  "cable pushdown (with rope attachment)": ["Ext. Tríceps Barra", "Fondos Tríceps", "Patada Tríceps"],
  "barbell full squat": ["Sentadilla Front", "Prensa", "Sentadilla Máquina"],
  "sled 45° leg press": ["Sentadilla", "Hack Squat", "Prensa Horizontal"],
  "lever leg extension": ["Sentadilla Sissy", "Ext. Pierna Unilateral", "Prensa"],
  "lever lying leg curl": ["Curl Femoral Sentado", "Bulgara", "Curl Nórdico"],
  "barbell standing calf raise": ["Gemelos en Prensa", "Gemelos Sentado", "Puntillas Unilateral"],
  "barbell bent over row": ["Remo Máquina", "Remo T", "Péndulo"],
  "cable pulldown (pro lat bar)": ["Dominadas", "Jalón Agarre Cerrado", "Remo Alto"],
  "cable seated row": ["Remo Barra", "Remo Unilateral", "Remo Máquina"],
  "cable standing rear delt row (with rope)": ["Pájaros Invertidos", "Cruce Hombro", "Face Pull Máquina"],
  "ez barbell curl": ["Curl Mancuernas", "Curl Pozo", "Curl Banco Scott"],
  "dumbbell hammer curl": ["Curl Martillo Cruzado", "Curl Barra", "Curl Inclinado"],
  "barbell deadlift": ["Peso Muerto Rumano", "Sumo", "Hip Thrust"],
  "barbell glute bridge two legs on bench (male)": ["Hip Thrust Máquina", "Patada Glúteo", "Puente Glúteo"],
  "barbell good morning": ["Bulgara", "Hip Thrust", "Kettlebell Swing"],
  "cable kickback": ["Patada Unilateral", "Hip Thrust", "Puente Glúteo"],
  "lever seated calf raise": ["Gemelos Pie", "Prensa Gemelos", "Saltos"],
  "barbell incline bench press": ["Press Banca Plano", "Press Mancuernas", "Press Máquina"],
  "pull up (neutral grip)": ["Dominadas Prono", "Jalón", "Dominadas Asistidas"],
  "dumbbell arnold press": ["Press Militar", "Press Mancuernas", "Prensa Hombro"],
  "cable lateral raise": ["Mancuernas Lateral", "Elevación Unilateral", "Lateral Inclinado"],
  "cable curl": ["Curl Barra", "Curl Mancuernas", "Curl Martillo"],
  "cable overhead triceps extension (rope attachment)": ["Ext. Tríceps Polea", "Press Frances", "Patada Tríceps"]
};

/* Mapa de imágenes embebido (corregido: press banca = 0025-EIeI8Vf) */
const EMBEDDED_IMAGES = {
  "barbell bench press": "0025-EIeI8Vf", "dumbbell incline bench press": "0314-ns0SIbU",
  "dumbbell seated shoulder press": "0405-znQUdHY", "cable standing fly": "0227-Pr9Rhf4",
  "dumbbell lateral raise": "0334-DsgkuIt", "cable pushdown (with rope attachment)": "0200-dU605di",
  "barbell full squat": "0043-qXTaZnJ", "sled 45° leg press": "0739-10Z2DXU",
  "lever leg extension": "0585-my33uHU", "lever lying leg curl": "0586-17lJ1kr",
  "barbell standing calf raise": "1372-8ozhUIZ", "barbell bent over row": "0027-eZyBC3j",
  "cable pulldown (pro lat bar)": "0197-qdRxqCj", "cable seated row": "0861-fUBheHs",
  "cable standing rear delt row (with rope)": "0233-ZfyAGhK", "ez barbell curl": "0447-6TG6x2w",
  "dumbbell hammer curl": "0313-slDvUAU", "barbell deadlift": "0032-ila4NZS",
  "barbell glute bridge two legs on bench (male)": "3562-qg2PGl6", "barbell good morning": "0044-XlZ4lAC",
  "cable kickback": "0860-HEJ6DIX", "lever seated calf raise": "0594-bOOdeyc",
  "barbell incline bench press": "0047-3TZduzM", "pull up (neutral grip)": "0651-0V2YQjW",
  "dumbbell arnold press": "2137-Xy4jlWA", "cable lateral raise": "0178-goJ6ezq",
  "cable curl": "0868-G08RZcQ", "cable overhead triceps extension (rope attachment)": "0194-2IxROQ1",
};
const IMG_BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";

/* Devuelve la imagen con prioridad GIF animado (videos/{base}.gif) */
function getExerciseImage(ex, dataset){
  let base = null;
  /* F1-C2: si se aplicó una variante, buscar la imagen del ejercicio ORIGINAL */
  const datasetKey = ex.datasetOriginal || ex.dataset;
  if(datasetKey && EMBEDDED_IMAGES[datasetKey]){
    base = EMBEDDED_IMAGES[datasetKey];
  } else if(dataset && datasetKey){
    const found = findExerciseInDataset(dataset, datasetKey) || findExerciseInDataset(dataset, ex.nombre_es);
    if(found && found.image){
      base = found.image.replace("images/","").replace(".jpg","").replace(".png","");
    }
  }
  if(base) return IMG_BASE + "videos/" + base + ".gif";
  return null;
}
/* Devuelve el GIF de una alternativa por nombre.
   F1-C3: busca el nombre de la alternativa (español) con coincidencia
   flexible en el dataset EN INGLÉS — prioriza palabras clave que
   coincidan (ej. "Flexiones" → "push up", "Press Banca Inclinado" → "incline bench press").
   Primero intenta EXACTA (nombres del dataset en inglés ya normalizados)
   y luego cae a coincidencias por palabra. */
function getExerciseImageForName(name, dataset){
  if(!name) return null;
  for(const [key,val] of Object.entries(EMBEDDED_IMAGES)){
    if(normalizeName(key)===normalizeName(name)){
      return IMG_BASE + "videos/" + val + ".gif";
    }
  }
  if(dataset){
    const n = normalizeName(name);
    /* Exacta primero */
    let found = dataset.find(d=>d.name && normalizeName(d.name)===n);
    if(found && found.image){
      const base = String(found.image).replace("images/","").replace(".jpg","").replace(".png","");
      return IMG_BASE + "videos/" + base + ".gif";
    }
    /* Fallback por palabras clave: busca coincidencias parciales del nombre
       de la alternativa dentro del dataset. Solo acepta si la palabra es
       suficientemente informativa (>=4 caracteres). */
    const words = n.split(" ").filter(w=>w.length>=4);
    for(const w of words){
      found = dataset.find(d=>d.name && normalizeName(d.name).includes(w));
      if(found && found.image){
        const base = String(found.image).replace("images/","").replace(".jpg","").replace(".png","");
        return IMG_BASE + "videos/" + base + ".gif";
      }
    }
  }
  return null;
}

/* ================================================================
   PERSISTENCIA
   ================================================================ */
const K = {
  routine: "eyefit_routine_v1", history: "eyefit_history_v1",
  sets: "eyefit_sets_v1", session: "eyefit_session_v1",
  meta: "eyefit_meta",
  dataset: "eyefit_dataset_v1", pending: "eyefit_pending_v1",
  routineUpdated: "eyefit_routine_updated_v1"
};
function lsGet(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch(e){ return def; } }
function lsSet(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
function getRoutine(){ return lsGet(K.routine, null) || DEFAULT_ROUTINE; }
function setRoutine(r){ lsSet(K.routine, r); }
/* Fase C: historial en IndexedDB (via src/db.js) con caché síncrona en memoria.
   getHistory()/saveHistory() mantienen su API síncrona para no tocar el resto. */
const DB = window.EyeFitDB || null;
let historyCache = [];
let historyLoaded = false;
async function loadHistoryFromDB(){
  if(!DB) return;
  try{
    const rows = await DB.getHistoryDB();
    if(Array.isArray(rows)) historyCache = rows.map(r=>r.record).filter(isValidSessionRecord);
  }catch(e){}
  historyLoaded = true;
}
async function persistHistory(){
  if(DB){
    try{ await DB.saveHistoryDB(historyCache); }catch(e){}
  }else{
    lsSet(K.history, historyCache);
  }
}
function getHistory(){
  /* F2-A2: filtrar registros corruptos para no romper la app. */
  if(!historyLoaded){
    historyCache = lsGet(K.history, []);
  }
  historyCache = Array.isArray(historyCache) ? historyCache.filter(isValidSessionRecord) : [];
  return historyCache;
}
async function saveHistory(h){
  historyCache = Array.isArray(h) ? h.filter(isValidSessionRecord) : [];
  await persistHistory();
}
/* Schema versioning (eyefit_meta.data_version). v1→v2: migración one-time
   del historial de localStorage a IndexedDB (solo si la DB cargó). */
const DATA_VERSION = 2;
const MIGRATIONS = [
  async (nextVersion) => {
    if(nextVersion < 2 && DB && DB.migrateHistoryFromLocalStorage){
      await loadHistoryFromDB();
      await DB.migrateHistoryFromLocalStorage(K.history, isValidSessionRecord);
      if(DB.setDataVersion) DB.setDataVersion(2);
    }
  }
];
async function runMigrations(){
  try{
    const current = DB && DB.currentDataVersion ? DB.currentDataVersion() : DATA_VERSION;
    if(current >= DATA_VERSION) return;
    for(const m of MIGRATIONS){ await m(current); }
    if(DB && DB.setDataVersion) DB.setDataVersion(DATA_VERSION);
  }catch(e){}
}
function getPending(){
  const p = lsGet(K.pending, null);
  return p && typeof p === "object" ? { sessions:Array.isArray(p.sessions)?p.sessions:[], routine:p.routine||null } : { sessions:[], routine:null };
}
function setPending(p){ lsSet(K.pending, { sessions:p.sessions||[], routine:p.routine||null }); }

/* ================================================================
   CARGA RUTINA XLSX
   ================================================================ */
const HEADER_MAP = {
  "dia":"dia","orden":"orden","nombre_es":"nombre_es","nombre":"nombre_es",
  "dataset":"dataset","ejercicio":"nombre_es","series":"series","sets":"series",
  "reps":"reps","repeticiones":"reps","peso_kg":"peso_kg","peso":"peso_kg",
  "kg":"peso_kg","descanso_s":"descanso_s","descanso":"descanso_s","rest_s":"descanso_s",
  "notas":"notas","nota":"notas"
};
let xlsxPromise = null;
function loadXLSX(){
  /* Fase B: SheetJS se carga bajo demanda (solo al Importar/Exportar .xlsx),
     manteniendo el bundle inicial pequeño y el arranque rápido. */
  if(xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject)=>{
    const s = document.createElement("script");
    s.src = "./xlsx.full.min.js";
    s.onload = ()=> resolve(window.XLSX);
    s.onerror = ()=>{ xlsxPromise = null; reject(new Error("xlsx load error")); };
    document.head.appendChild(s);
  });
  return xlsxPromise;
}
async function parseRoutineSheet(data){
  try{
    await loadXLSX();
  }catch(e){
    showToast("⏳ No se pudo cargar SheetJS. Comprueba la conexión");
    throw new Error("xlsx no disponible");
  }
  const wb = XLSX.read(data, { type:"array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
  const routine = []; const seen = new Set();
  for(const row of rows){
    const mapped = {};
    for(const [orig,target] of Object.entries(HEADER_MAP)){
      const v = row[orig];
      if(v !== undefined && mapped[target] === undefined){
        mapped[target] = (target==="orden"||target==="series"||target==="reps") ? parseInt(v,10)||0 : v;
      }
    }
    const s = sanitizeRoutineRow(mapped);
    if(!s) continue;
    const id = s.dia+"|"+s.nombre_es;
    if(seen.has(id)) continue;
    seen.add(id);
    routine.push(s);
  }
  routine.sort((a,b)=>{
    const di = DAY_ORDER.indexOf(a.dia)-DAY_ORDER.indexOf(b.dia);
    if(di!==0) return di;
    return (a.orden||0)-(b.orden||0);
  });
  const od = {};
  for(const ex of routine){ od[ex.dia]=(od[ex.dia]||0)+1; ex.orden=od[ex.dia]; }
  return routine;
}
async function exportRoutineXlsx(){
  try{
    await loadXLSX();
  }catch(e){
    showToast("⏳ No se pudo cargar SheetJS. Comprueba la conexión");
    return;
  }
  const routine = getRoutine();
  const headers = ["dia","orden","nombre_es","dataset","series","reps","peso_kg","descanso_s","notas"];
  const rows = [headers];
  for(const ex of routine) rows.push([ex.dia,ex.orden,ex.nombre_es,ex.dataset,ex.series,ex.reps,ex.peso_kg,ex.descanso_s,ex.notas||""]);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = headers.map(h=>({wch:h==="nombre_es"?40:h==="dataset"?50:h==="notas"?55:12}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rutina");
  XLSX.writeFile(wb, "rutina.xlsx");
}

/* ================================================================
   DATASET
   ================================================================ */
const DATASET_URL = "./slim-dataset.json";
const DATASET_CACHE = "eyefit-slim-v1";
async function loadExerciseDataset(){
  /* Fase B: el dataset empaquetado (slim-dataset.json, ~0.66 MB) viaja
     dentro del build y el Service Worker lo sirve offline (stale-while-revalidate).
     Cache-first: si ya está en Cache API, no se vuelve a fetchear. */
  try{
    const cache = await caches.open(DATASET_CACHE);
    const cachedResp = await cache.match(DATASET_URL);
    if(cachedResp){
      const cached = await cachedResp.json();
      if(cached && cached.length) return cached;
    }
  }catch(e){}
  try{
    const resp = await fetch(DATASET_URL);
    if(!resp.ok) throw new Error("no fetch");
    const data = await resp.json();
    try{
      const cache = await caches.open(DATASET_CACHE);
      await cache.put(DATASET_URL, resp.clone());
    }catch(e){}
    return data;
  }catch(e){ return null; }
}
/* Fase 1 (P5): índice del dataset con Maps para evitar pasadas O(n) repetidas.
   Normaliza cada nombre una sola vez y agrupa por grupo muscular. */
let datasetIndex = null;
let datasetIndexSource = null;
function buildDatasetIndex(ds){
  const byName = new Map();
  const byPart = new Map();
  for(const ex of ds){
    const n = normalizeName(ex.name);
    if(!byName.has(n)) byName.set(n, ex);
    const part = ex.part || "";
    if(part){
      if(!byPart.has(part)) byPart.set(part, []);
      byPart.get(part).push(ex);
    }
  }
  return { byName, byPart };
}
function getDatasetIndex(ds){
  if(datasetIndexSource !== ds){
    datasetIndex = buildDatasetIndex(ds||[]);
    datasetIndexSource = ds;
  }
  return datasetIndex;
}
function findExerciseInDataset(dataset, name){
  if(!dataset || !name || String(name).trim()==="") return null;
  const n = normalizeName(name);
  const idx = getDatasetIndex(dataset);
  let hit = idx.byName.get(n);
  if(hit) return hit;
  /* Fallback (solo si no hay coincidencia exacta): inclusión y palabras */
  hit = dataset.find(d=>normalizeName(d.name).includes(n)||n.includes(normalizeName(d.name)));
  if(hit) return hit;
  const words = n.split(" ");
  for(const w of words){
    if(w.length<3) continue;
    hit = dataset.find(d=>normalizeName(d.name).includes(w));
    if(hit) return hit;
  }
  return null;
}

function escapeHtml(s){
  const el = document.createElement('div');
  el.textContent = String(s||"");
  return el.innerHTML;
}
function formatInstructions(text){
  if(!text) return "";
  const steps = String(text).split("\n").map(s=>s.trim()).filter(Boolean);
  return `<ol class="instr-list">${steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
}

/* ================================================================
   SUPABASE AUTH + SYNC (tabla correcta: rutinas)
   ================================================================ */
let authMode = "login";
let authBlocked = false; // true cuando getSession() lanza (SDK cargado pero sin red)
function showAuthOverlay(show){
  document.getElementById("authOverlay").classList.toggle("show", show);
  /* B3: cuando no hay SDK de Supabase o la auth falla por red (SDK cargado,
     pero getSession() lanza), mostrar "Continuar sin conexión" para no
     bloquear el uso local de la app. */
  const skipBtn = document.getElementById("authSkip");
  if(skipBtn) skipBtn.style.display = (!sbClient || authBlocked) ? "block" : "none";
  setFocusTrap("authOverlay", show ? document.getElementById("authOverlay") : null);
}

/* Convierte un error de Supabase/red a texto legible.
   Filtra mensajes vacíos o inútiles ({} , "", etc.) para no mostrar
   objetos crudos en pantalla. */
function errToString(err){
  if(!err) return "Error de conexión";
  if(typeof err === "string") return err.trim() ? err : "Error de conexión";
  const rawMsg = err.message;
  if(typeof rawMsg === "string" && rawMsg.trim() && rawMsg.trim() !== "{}") return rawMsg.trim();
  if(err.name === "AuthRetryableFetchError" || err.status >= 500){
    return "⚠️ Error del servidor de EyeFit. Está caído o en mantenimiento. Inténtalo más tarde.";
  }
  for(const k of ["msg","error_description","error"]){
    const v = err[k];
    if(typeof v === "string" && v.trim() && v.trim() !== "{}") return v.trim();
  }
  try{
    const s = JSON.stringify(err);
    if(s && s !== "{}" && s !== '""' && s !== "null" && s !== '{"message":"{}"}') return s;
  }catch(e){}
  return "Error de conexión";
}

function isEmailVerified(user){
  return !!(user && (user.email_confirmed_at || user.email_verified === true));
}

async function handleAuthSubmit(){
  const email = document.getElementById("authEmail").value.trim();
  const pass = document.getElementById("authPass").value;
  const errEl = document.getElementById("authError");
  const btn = document.getElementById("authSubmit");
  errEl.textContent = "";
  if(!sbClient){ errEl.textContent = "🌐 Sin conexión al servidor. No puedes acceder ahora."; return; }
  if(!email || !pass){ errEl.textContent = "Introduce email y contraseña"; return; }
  if(pass.length < 6){ errEl.textContent = "La contraseña debe tener al menos 6 caracteres"; return; }
  btn.disabled = true; btn.textContent = "…";
  try{
    let result;
    if(authMode === "register") result = await sbClient.auth.signUp({ email, password: pass });
    else result = await sbClient.auth.signInWithPassword({ email, password: pass });
    if(result.error) throw result.error;
    const session = result.data.session;
    const user = result.data.user || null;
    if(!session){
      if(authMode === "register"){
        if(user && user.identities && user.identities.length === 0){
          errEl.textContent = "⚠️ Ya existe una cuenta con ese email. Intenta acceder.";
        } else {
          errEl.textContent = "✅ Revisa tu email para confirmar el registro";
        }
      } else {
        errEl.textContent = "⚠️ Email no confirmado o credenciales incorrectas";
      }
      btn.disabled = false; btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
      return;
    }
    /* Verificar que el email esté confirmado antes de permitir el acceso */
    if(!isEmailVerified(user)){
      await sbClient.auth.signOut().catch(()=>{});
      errEl.textContent = "⚠️ Debes confirmar tu email antes de acceder. Revisa tu bandeja de entrada.";
      btn.disabled = false;
      btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
      return;
    }
    authBlocked = false;
    authUser = user;
    await afterLogin();
    btn.disabled = false;
    btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
  }catch(err){
    errEl.textContent = errToString(err);
    btn.disabled = false;
    btn.textContent = authMode === "register" ? "Registrarse" : "Acceder";
  }
}
async function afterLogin(){
  showAuthOverlay(false);
  await scheduleSync();
  await pullServerData();
  renderMain();
}
async function pullServerData(){
  if(!sbClient || !authUser) return;
  try{
    const { data: routineRow, error: errR } = await sbClient.from("rutinas").select("routine, updated_at").eq("user_id", authUser.id).maybeSingle();
    if(!errR && routineRow && routineRow.routine && Array.isArray(routineRow.routine)){
      const localTs = localStorage.getItem(K.routineUpdated);
      const serverTs = routineRow.updated_at;
      if(!localTs || !serverTs || new Date(serverTs) > new Date(localTs)){
        setRoutine(routineRow.routine);
        if(serverTs) localStorage.setItem(K.routineUpdated, serverTs);
        selectedDay = null;
      }
    }
    const { data: sesRows, error: errS } = await sbClient.from("sesiones").select("data").eq("user_id", authUser.id);
    if(!errS && Array.isArray(sesRows)){
      const serverHistory = sesRows.map(r=>r.data).filter(Boolean);
      const merged = mergeHistoryBySessionId(getHistory(), serverHistory);
      saveHistory(merged);
    }
  }catch(e){}
}
async function pushRoutineToServer(){
  if(!sbClient || !authUser) return false;
  try{
    const { error } = await sbClient.from("rutinas").upsert(
      { user_id:authUser.id, routine:getRoutine(), updated_at: new Date().toISOString() },
      { onConflict:"user_id" }
    );
    if(!error) localStorage.setItem(K.routineUpdated, new Date().toISOString());
    return !error;
  }catch(e){ return false; }
}
async function pushSessionToServer(record){
  if(!sbClient || !authUser) return false;
  const sid = (record && record.session_id) || genUUID();
  try{
    const { error } = await sbClient.from("sesiones").upsert(
      { user_id:authUser.id, session_id: sid, data: record },
      { onConflict: "user_id,session_id" }
    );
    return !error;
  }catch(e){ return false; }
}

/* Fix subida automática: reintento cada 30s mientras haya pendientes.
   Mutex: serializa syncPending para evitar carreras entre interval/online/pageshow. */
let syncLock = Promise.resolve();
let syncQueued = false;
function scheduleSync(){
  if(!authUser || !sbClient) return;
  if(syncQueued) return syncLock;
  syncQueued = true;
  syncLock = syncLock.then(()=>{ syncQueued = false; return syncPending(); }).catch(()=>{ syncQueued = false; });
  return syncLock;
}
async function syncPending(){
  if(!sbClient || !authUser) return;
  const pending = getPending();
  let changed = false;
  const remaining = [];
  for(let i = 0; i < pending.sessions.length; i++){
    const rec = pending.sessions[i];
    if(!isValidSessionRecord(rec)) continue;
    const ok = await pushSessionToServer(rec);
    if(ok){ changed = true; } else { remaining.push(...pending.sessions.slice(i)); break; }
  }
  if(pending.routine){
    const { error } = await sbClient.from("rutinas").upsert({ user_id:authUser.id, routine:pending.routine }, { onConflict:"user_id" }).catch(()=>({error:true}));
    if(!error){ setRoutine(pending.routine); pending.routine = null; changed = true; }
  }
  pending.sessions = remaining;
  setPending(pending);
  if(changed){
    showToast("🔄 Sincronizado con la nube");
    if(currentTab === "ajustes") renderMain();
  }
}

/* ================================================================
   ROUTER
   ================================================================ */
let currentTab = "rutina";
let selectedDay = null;
let datasetCache = null;
let session = null;

function setTab(tab){
  currentTab = tab;
  document.querySelectorAll(".tabbtn").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  updateStopBtn();
  renderMain();
}
function updateStopBtn(){
  const btn = document.getElementById("stopSessionBtn");
  if(btn) btn.style.display = (currentTab==="sesion" && session) ? "block" : "none";
}
function renderMain(){
  const main = document.getElementById("main");
  const views = { rutina:renderRutina, sesion:renderSesion, historial:renderHistorial, ajustes:renderAjustes };
  const html = views[currentTab] ? views[currentTab]() : renderRutina();
  if(main.innerHTML !== html){
    main.innerHTML = html;
    attachEvents();
  }
}

/* ================================================================
   VISTA RUTINA — carga directa del día actual
   ================================================================ */
function renderRutina(){
  const routine = getRoutine();
  const days = DAY_ORDER.filter(d=>routine.some(e=>e.dia===d));
  const todayName = getTodayName();
  const defaultDay = selectedDay || (days.includes(todayName) ? todayName : days[0]) || "Lunes";
  if(!days.includes(defaultDay) && days.length) selectedDay = days[0];
  const sel = days.includes(selectedDay) ? selectedDay : days[0] || "Lunes";
  selectedDay = sel;

  const weekHtml = days.map(d=>{
    const isSel = d===sel;
    const color = DAY_COLORS[d] || "#888";
    return `<div class="week-cell ${isSel?"active":""}" data-day="${escapeHtmlAttr(d)}" role="button" tabindex="0" aria-pressed="${isSel}" aria-label="Ver rutina de ${escapeHtmlAttr(d)}" style="${isSel?"":`border-color:${color}44;`}">
      <div class="d">${DAY_SHORT[d]||d.slice(0,3)}</div>
      <div class="l" style="${isSel?"":`color:${color}`}">${d}</div>
    </div>`;
  }).join("");

  const dayEx = routine.filter(e=>e.dia===sel);
  const totalSets = dayEx.reduce((a,e)=>a+(parseInt(e.series)||0),0);

  const dayHtml = `<div class="day-card" style="border-color:${DAY_COLORS[sel]||"#888"}">
    <div class="day-header">
      <div class="day-dot" style="background:${DAY_COLORS[sel]||"#888"}"></div>
      <div>
        <div class="day-name">${sel}</div>
        <div class="day-type">${totalSets} series · ${dayEx.length} ejercicios</div>
      </div>
    </div>
    <div class="day-body open" style="display:block;">
      ${dayEx.map((ex,i)=>exerciseCard(ex,i,sel)).join("")}
    </div>
  </div>`;

  const noData = days.length===0 ? `<div class="empty-state">No hay rutina cargada.<br>Importa un .xlsx en Ajustes.</div>` : "";

  return `<div class="section active">
    <h2 class="title">📅 Rutina Semanal</h2>
    ${noData || `<div class="week-grid">${weekHtml}</div>`}
    ${noData || dayHtml}
    ${noData || `<button class="btn" style="width:100%;padding:13px;" data-start-session="${escapeHtmlAttr(sel)}">🏋️ Entrenar — ${escapeHtmlAttr(sel)}</button>`}
  </div>`;
}

function exerciseCard(ex, i, day){
  const color = DAY_COLORS[day] || "#888";
  const imgUrl = getExerciseImage(ex, datasetCache);
  const apodo = getApodo(ex);
  const instr = formatInstructions(getInstrucciones(ex));
  const variantes = (ALTERNATIVAS[ex.dataset] || []).length;

  return `<div class="ex-row">
    <div class="ex-top">
      <div class="ex-img">
        ${imgUrl
          ? `<img src="${imgUrl}" alt="${escapeHtml(ex.nombre_es)}" loading="lazy" decoding="async" data-img-fallback="emoji">`
          : "🏋️"}
      </div>
      <div class="ex-info">
        <div style="display:flex;gap:6px;">
          <span class="ex-num" style="color:${color}">${ex.orden}</span>
          <span class="ex-name">${escapeHtml(apodo)}</span>
        </div>
        <div class="ex-stats">
          <span class="stat-chip"><b>${ex.series}</b> series</span>
          <span class="stat-chip"><b>${ex.reps}</b> reps</span>
          <span class="stat-chip">⚖️ <b>${ex.peso_kg}</b> kg</span>
          <span class="stat-chip">⏱ <b>${formatRest(ex.descanso_s)}</b></span>
          <span class="stat-chip">↔️ <b>${variantes}</b> alt.</span>
        </div>
        ${ex.notas ? `<div class="ex-notes">${escapeHtml(ex.notas)}</div>` : ""}
        ${instr ? `<button class="ex-instr-btn" data-instr-toggle="${i}">📖 Instrucciones</button>
        <div class="ex-instr" data-instr-body="${i}">${instr}</div>` : ""}
      </div>
    </div>
  </div>`;
}


/* ================================================================
   FASE 2 · MÉTRICAS DE PROGRESIÓN (1RM Epley, PR, sparklines, racha)
   ================================================================ */

/* Mejor registro histórico (por 1RM) de un ejercicio, excluyendo la sesión actual */
function getHistoricalBest(exKey){
  const history = getHistory();
  const key = String(exKey||"").trim().toLowerCase();
  if(!key) return null;
  let best = null;
  for(const h of history){
    for(const e of (h.exercises||[])){
      const eKey = String(e.dataset||e.nombre_es||"").trim().toLowerCase();
      if(eKey === key){
        for(const s of (e.sets||[])){
          if(!s.done) continue;
          const rm = epley1RM(s.kg, s.reps);
          if(!best || rm > best.rm) best = { rm, kg:s.kg, reps:s.reps, date:h.date };
        }
        break;
      }
    }
  }
  return best;
}

/* Registro del mejor 1RM visto dentro de la sesión actual (evita PRs duplicados) */
let sessionBestByEx = {};

/* Comprueba si el set completado es un récord personal y lo celebra en el comic-bubble */
function checkPR(ex, set){
  const key = String(ex.dataset||ex.nombre_es||"").trim().toLowerCase();
  const best = getHistoricalBest(key);
  const newRM = epley1RM(set.kg, set.reps);
  if(!sessionBestByEx) sessionBestByEx = {};
  const sessBest = sessionBestByEx[key] || 0;
  if(newRM <= Math.max(best ? best.rm : 0, sessBest)) return;
  sessionBestByEx[key] = newRM;
  const diff = best ? ` (+${(newRM-best.rm).toFixed(0)}kg 1RM)` : "";
  showComicBubble(`🏆 ¡NUEVO PR! ${getApodo(ex)} · ${set.kg}kg × ${set.reps}${diff}`);
}

/* Serie de fechas → mejor 1RM por sesión (cronológico, últimas 12) */
function getExerciseProgression(exKey){
  const history = getHistory();
  const key = String(exKey||"").trim().toLowerCase();
  const pts = [];
  for(const h of history){
    for(const e of (h.exercises||[])){
      const eKey = String(e.dataset||e.nombre_es||"").trim().toLowerCase();
      if(eKey === key){
        const done = (e.sets||[]).filter(s=>s.done);
        if(done.length){
          pts.push({ date:h.date, bestRM: Math.max(...done.map(s=>epley1RM(s.kg,s.reps))) });
        }
        break;
      }
    }
  }
  pts.sort((a,b)=>new Date(a.date)-new Date(b.date));
  return pts.slice(-12);
}

/* Mini-gráfica SVG de la evolución del 1RM (sin librerías, Fase 2 M2) */
function svgSparkline(pts, w=140, h=36){
  if(!pts || pts.length < 2) return "";
  const vals = pts.map(p=>p.bestRM);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max-min) || 1;
  const step = (pts.length>1) ? w/(pts.length-1) : 0;
  const coords = pts.map((p,i)=>{
    const x = i*step;
    const y = h - 4 - ((p.bestRM-min)/range)*(h-8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = vals[vals.length-1];
  const lastY = h - 4 - ((last-min)/range)*(h-8);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polygon points="0,${h} ${coords} ${w},${h}" fill="rgba(200,255,0,.12)"/>
    <polyline points="${coords}" fill="none" stroke="#C8FF00" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${(pts.length-1)*step}" cy="${lastY.toFixed(1)}" r="3" fill="#C8FF00"/>
  </svg>`;
}

/* Racha de días consecutivos entrenados (Fase 2 M5) */
function getStreak(){
  const history = getHistory();
  if(!history || !history.length) return 0;
  const days = new Set();
  for(const h of history){
    try{ days.add(localDateKey(new Date(h.date))); }catch(e){}
  }
  const todayKey = localDateKey(new Date());
  const cursor = new Date();
  let streak = 0;
  if(days.has(todayKey)){
    while(days.has(localDateKey(cursor))){
      streak++;
      cursor.setDate(cursor.getDate()-1);
    }
  } else {
    cursor.setDate(cursor.getDate()-1);
    while(days.has(localDateKey(cursor))){
      streak++;
      cursor.setDate(cursor.getDate()-1);
    }
  }
  return streak;
}

/* ================================================================
   VISTA SESIÓN sin scroll
   ================================================================ */
function sessionProgress(){
  const totalSets = session.exercises.reduce((a,e)=>a+e.sets.length,0);
  const doneSets = session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  const pct = totalSets>0 ? Math.round((doneSets/totalSets)*100) : 0;
  return { totalSets, doneSets, pct };
}

function renderSesion(){
  if(!session){
    const routine = getRoutine();
    const days = DAY_ORDER.filter(d=>routine.some(e=>e.dia===d));
    const todayName = getTodayName();
    const dayBtns = days.map(d=>
      `<button class="select-day-btn" data-start-session="${escapeHtmlAttr(d)}">
        <span style="width:9px;height:9px;border-radius:50%;background:${DAY_COLORS[d]||"#888"};display:inline-block;"></span>
        ${d}
        <span style="margin-left:auto;color:var(--muted);font-size:10.5px;">${routine.filter(e=>e.dia===d).length} ejercicios</span>
      </button>`
    ).join("");
    return `<div class="section active">
      <h2 class="title">🏋️ Entrenar</h2>
      ${days.length
        ? `<div class="card"><div class="select-days">${dayBtns}</div></div>`
        : `<div class="empty-state">No hay rutina cargada.<br>Ve a <b>Ajustes</b> e importa tu archivo .xlsx</div>`}
    </div>`;
  }

  const day = session.day;
  const ex = session.exercises[session.currentIdx];
  const totalEx = session.exercises.length;
  const prog = sessionProgress();
  const imgUrl = getExerciseImage(ex, datasetCache);
  const apodo = getApodo(ex);
  const variantes = getVariants(ex).map(v=>v.nombre).join(" · ");

  const setRows = ex.sets.map((set,si)=>{
    const currentSet = ex.currentSet === si+1;
    const done = set.done;
    const canDel = !done && ex.sets.length>1;
    return `<div class="set-row" style="${currentSet?"border:1px solid var(--accent);":""}">
      <span class="set-num">${si+1}</span>
      <div class="set-control">
        <button class="stepper" data-kg-minus="${si}" aria-label="Reducir peso de la serie ${si+1}">−</button>
        <div style="text-align:center;min-width:36px;">
          <div class="set-value" data-edit="${si}" data-field="kg" role="button" tabindex="0" aria-label="Editar peso de la serie ${si+1} (${set.kg} kg)">${set.kg}</div>
          <div class="set-label">kg</div>
        </div>
        <button class="stepper" data-kg-plus="${si}" aria-label="Aumentar peso de la serie ${si+1}">+</button>
        <div style="width:6px;"></div>
        <button class="stepper" data-reps-minus="${si}" aria-label="Reducir repeticiones de la serie ${si+1}">−</button>
        <div style="text-align:center;min-width:30px;">
          <div class="set-value" data-edit="${si}" data-field="reps" role="button" tabindex="0" aria-label="Editar repeticiones de la serie ${si+1} (${set.reps} reps)">${set.reps}</div>
          <div class="set-label">reps</div>
        </div>
        <button class="stepper" data-reps-plus="${si}" aria-label="Aumentar repeticiones de la serie ${si+1}">+</button>
      </div>
      <button class="set-done ${done?"done":""}" data-set-done="${si}" ${currentSet&&!done?"":done?"":"disabled"} aria-label="${done?`Serie ${si+1} completada`:`Marcar serie ${si+1} como completada`}" aria-pressed="${done}">✓</button>
      ${canDel?`<button class="del-set-btn" data-set-del="${si}" aria-label="Eliminar serie ${si+1}">🗑</button>`:""}
    </div>`;
  }).join("");

  const completedEx = session.exercises.filter(e=>e.completed).length;
  const nextEx = session.currentIdx+1 < session.exercises.length ? session.exercises[session.currentIdx+1] : null;

  return `<div class="section active session-view">
    <div class="session-progress">
      <div class="sp-label">
        <span>${session.day} · ${completedEx}/${totalEx} ejercicios</span>
        <span class="sp-pct">${prog.pct}%</span>
      </div>
      <div class="sp-bar"><div class="sp-fill" style="width:${prog.pct}%"></div></div>
    </div>

    <div class="ex-active-card">
      <div class="ex-active-header">
        <span class="ex-active-name">${ex.orden}. ${escapeHtml(apodo)}</span>
        <span class="ex-active-count">${session.currentIdx+1} / ${totalEx}</span>
      </div>
      <div class="ex-active-body">
        ${imgUrl ? `<img class="ex-active-img" src="${imgUrl}" alt="${escapeHtml(apodo)}" loading="lazy" decoding="async" data-img-fallback="hide">` : ""}
        ${variantes ? `<button class="variant-btn" data-open-variants>↔️ ${variantes}</button>` : ""}
      </div>
    </div>

    <div class="sets-grid">
      ${setRows}
      <button class="add-set-btn" data-add-set aria-label="Añadir una serie extra">＋ Añadir serie</button>
      ${nextEx ? `<div style="text-align:center;color:var(--muted);font-size:10px;padding:4px 0 8px;">Siguiente: <b style="color:${DAY_COLORS[day]||"#fff"}">${escapeHtml(getApodo(nextEx))}</b></div>` : ""}
    </div>
  </div>`;
}

/* ================================================================
   ACTUALIZACIÓN IN-PLACE (evita parpadeos al tocar kg/reps)
   ================================================================ */
function updateSessionSetValues(){
  if(!session) return;
  const ex = session.exercises[session.currentIdx];
  ex.sets.forEach((set,si)=>{
    const kgEl = document.querySelector(`.set-value[data-edit="${si}"][data-field="kg"]`);
    const repsEl = document.querySelector(`.set-value[data-edit="${si}"][data-field="reps"]`);
    if(kgEl) kgEl.textContent = set.kg;
    if(repsEl) repsEl.textContent = set.reps;
  });
  const pct = sessionProgress();
  const pctEl = document.querySelector(".sp-pct");
  const fillEl = document.querySelector(".sp-fill");
  if(pctEl) pctEl.textContent = pct.pct + "%";
  if(fillEl) fillEl.style.width = pct.pct + "%";
}

/* STOP + pantalla resumen (guardado automático) */
let pendingSummary = null;

function computeSummary(){
  const completedSets = session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  const totalReps = session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+s.reps,0),0);
  const totalWeight = session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(s.kg*s.reps),0),0);
  const elapsed = Math.floor((Date.now()-session.startTime)/1000)+session.baseElapsed;
  const completedEx = session.exercises.filter(e=>e.completed).length;
  return { completedSets, totalReps, totalWeight, elapsed, completedEx, totalEx: session.exercises.length, exList: session.exercises };
}

/* Guarda la sesión automáticamente (sin botones Guardar/Descartar) */
async function autoSaveSession(){
  if(!session) return;
  const anyDone = session.exercises.some(e=>e.sets.some(s=>s.done));
  if(!anyDone) return;
  session.elapsed = Math.floor((Date.now()-session.startTime)/1000)+session.baseElapsed;
  const nowIso = new Date().toISOString();
  const record = {
    session_id: session.session_id || genUUID(),
    date: nowIso,
    day: session.day,
    duration: session.elapsed,
    updated_at: nowIso,
    exercises: session.exercises.map(e=>({
      nombre_es: e.nombre_es, dataset: e.dataset, datasetOriginal: e.datasetOriginal, orden: e.orden, completed: e.completed,
      sets: e.sets.map(s=>({ kg:s.kg, reps:s.reps, done:s.done }))
    }))
  };
  const history = getHistory();
  const dupeIdx = history.findIndex(h=>h.session_id && h.session_id === record.session_id);
  if(dupeIdx !== -1) history.splice(dupeIdx, 1);
  history.push(record);
  saveHistory(history);
  session.saved = true;
  clearSessionState();
  const savedMsg = document.getElementById("sumSavedMsg");
  if(sbClient && authUser){
    const ok = await pushSessionToServer(record);
    if(ok){
      if(savedMsg) savedMsg.textContent = "✅ Sesión guardada en la nube";
      showToast("✅ Sesión guardada en la nube");
    } else {
      const p = getPending(); p.sessions.push(record); setPending(p);
      if(savedMsg) savedMsg.textContent = "📴 Sin conexión: se subirá sola";
      showToast("📴 Sin conexión: se subirá sola");
    }
  } else {
    if(savedMsg) savedMsg.textContent = "✅ Sesión guardada en este dispositivo";
    showToast("✅ Sesión guardada");
  }
}

function showSummary(){
  if(!session) return;
  stopRest();
  pendingSummary = computeSummary();
  autoSaveSession();
  const s = pendingSummary;
  if(s.completedSets === 0){
    const m = document.getElementById("sumSavedMsg");
    if(m) m.textContent = "⚠️ No se completó ninguna serie — no se guardó nada";
  }
  const mins = Math.floor(s.elapsed/60), secs = s.elapsed%60;
  document.getElementById("sumSub").textContent = `${session.day} · ${mins}m ${String(secs).padStart(2,"0")}s`;
  document.getElementById("sumGrid").innerHTML = `
    <div class="sum-stat"><div class="sv">${s.completedSets}</div><div class="sl">Series</div></div>
    <div class="sum-stat"><div class="sv">${s.totalReps}</div><div class="sl">Reps</div></div>
    <div class="sum-stat"><div class="sv">${s.completedEx}/${s.totalEx}</div><div class="sl">Ejercicios</div></div>
    <div class="sum-stat"><div class="sv">${Math.round(s.totalWeight)}<span style="font-size:12px;"> kg</span></div><div class="sl">Peso total</div></div>`;
  document.getElementById("sumExList").innerHTML = s.exList.filter(e=>e.sets.some(x=>x.done)).slice(0,10).map(e=>{
    const done = e.sets.filter(x=>x.done);
    return `<div class="sum-ex">
      <div class="sum-ex-top"><span style="color:${DAY_COLORS[session.day]||"#fff"}">${escapeHtml(getApodo(e))}</span><span>${done.length}×${done[0]?.reps||0} reps</span></div>
      <div class="sum-ex-sub">${done.map(x=>`${x.kg}kg`).join(" · ")}</div>
    </div>`;
  }).join("");
  document.getElementById("summaryOverlay").classList.add("show");
  setFocusTrap("summaryOverlay", document.getElementById("summaryOverlay"));
  document.getElementById("stopSessionBtn").style.display = "none";
}

document.getElementById("stopSessionBtn").addEventListener("click", ()=>{
  if(session) showSummary();
});

document.getElementById("sumAgain").addEventListener("click", ()=>{
  setFocusTrap("summaryOverlay", null);
  document.getElementById("summaryOverlay").classList.remove("show");
  session = null;
  clearSessionState();
  setTab("sesion");
  showToast("🏋️ ¿Siguiente ronda?");
});

/* ================================================================
   DESCANSO — barra superior (se vacía hacia la izquierda)
   ================================================================ */
let restTimer = null;
let restRemaining = 0;
let restTotal = 0;
let restPaused = false;
let restActive = false;

function clearRestTimer(){
  if(restTimer){ clearInterval(restTimer); restTimer = null; }
}

function startRest(seconds){
  clearRestTimer();
  restRemaining = seconds;
  restTotal = seconds;
  restPaused = false;
  restActive = true;
  const bar = document.getElementById("restBar");
  if(bar){
    bar.style.display = "flex";
    const btn = document.getElementById("restPauseBtn");
    if(btn) btn.textContent = "⏸";
    renderRestTime();
  }
  restTimer = setInterval(()=>{
    if(restPaused) return;
    if(restRemaining <= 0){
      restFinished();
      return;
    }
    restRemaining--;
    renderRestTime();
    if(restRemaining <= 3 && restRemaining > 0) vibrate(60);
    if(restRemaining === 0) vibrate([100,80,100]);
  }, 1000);
}

function stopRest(){
  clearRestTimer();
  restActive = false;
  const bar = document.getElementById("restBar");
  if(bar) bar.style.display = "none";
}

function restFinished(){
  clearRestTimer();
  restActive = false;
  const bar = document.getElementById("restBar");
  if(bar) bar.style.display = "none";
  vibrate([150,100,150]);
  showMotivation();
}

function renderRestTime(){
  const m = Math.floor(restRemaining/60), s = restRemaining%60;
  const timeEl = document.getElementById("restBarTime");
  if(timeEl) timeEl.textContent = `${m}:${String(s).padStart(2,"0")}`;
  const fill = document.getElementById("restBarFill");
  if(fill && restTotal > 0){
    fill.style.transform = `scaleX(${restRemaining/restTotal})`;
  }
  const btn = document.getElementById("restPauseBtn");
  if(btn) btn.textContent = restPaused ? "▶" : "⏸";
}

/* Bocadillo cómic motivador — "ÚLTIMO ESFUERZO" solo al empezar la última serie del último ejercicio */
const MOTIVACIONES = [
  "¡A POR ELLO!","¡TÚ PUEDES!","¡FUERZA!","¡ROMPE MARCAS!",
  "¡DALE CAÑA!","¡MUÉVETE!","¡A DEJARLO TODO!",
  "¡SIN EXCUSAS!","¡VAMOS, CAMPEÓN!","¡POWER!","¡UN SET MÁS!"
];
const LAST_EFFORT_MSG = "¡ÚLTIMO ESFUERZO!";
let comicTimeout = null;
function isLastEffort(){
  if(!session) return false;
  const ex = session.exercises[session.currentIdx];
  return session.currentIdx === session.exercises.length-1 && ex && ex.currentSet >= ex.sets.length;
}
function showComicBubble(text){
  const overlay = document.getElementById("comicOverlay");
  const bubble = document.getElementById("comicBubble");
  bubble.textContent = text;
  overlay.classList.add("show");
  bubble.classList.add("comic-shake");
  clearTimeout(comicTimeout);
  comicTimeout = setTimeout(()=>{
    overlay.classList.remove("show");
    bubble.classList.remove("comic-shake");
  }, 2600);
}
function showMotivation(){
  showComicBubble(isLastEffort() ? LAST_EFFORT_MSG : MOTIVACIONES[Math.floor(Math.random()*MOTIVACIONES.length)]);
}
comicOverlay.addEventListener("click", ()=>{
  clearTimeout(comicTimeout);
  comicOverlay.classList.remove("show");
  document.getElementById("comicBubble").classList.remove("comic-shake");
});

/* ================================================================
   VARIANTES (grid con GIFs, rellenan la pantalla)
   ================================================================ */
function getVariants(ex){
  const res = [];
  const manuales = ALTERNATIVAS[ex.varianteBase || ex.dataset] || [];
  for(const nombre of manuales) res.push({ nombre, part: getExerciseBodyPart(ex, datasetCache) || "musculatura similar" });
  if(res.length < 3 && datasetCache){
    const found = findExerciseInDataset(datasetCache, ex.dataset) || findExerciseInDataset(datasetCache, ex.nombre_es);
    if(found && found.part){
      const auto = datasetCache.filter(d=>d.part===found.part && normalizeName(d.name)!==normalizeName(found.name)).slice(0,3-res.length);
      for(const a of auto) res.push({ nombre:a.name, part:a.part });
    }
  }
  return res.slice(0, 4);
}

function openVariants(){
  const ex = session.exercises[session.currentIdx];
  const variants = getVariants(ex);
  document.getElementById("varCurrentEx").textContent = "Ejercicio actual: " + getApodo(ex);
  /* 4 tarjetas en grid 2x2: mantener actual + 3 alternativas (con GIF) */
  const items = [
    { nombre: "Mantener: " + getApodo(ex), img: getExerciseImage(ex, datasetCache) },
    ...variants.map(v=>({ nombre: v.nombre, img: getExerciseImageForName(v.nombre, datasetCache) }))
  ];
  const list = document.getElementById("varList");
  list.innerHTML = `<div class="var-grid">${items.map((it,i)=>`
    <div class="var-item" data-variant-idx="${escapeHtmlAttr(i)}">
      ${it.img ? `<img src="${it.img}" alt="${escapeHtml(it.nombre)}" loading="lazy" decoding="async" data-img-fallback="hide">` : `<div class="var-noimg">🏋️</div>`}
      <div class="vi-name">${escapeHtml(it.nombre)}</div>
    </div>`).join("")}</div>`;
  document.getElementById("varOverlay").classList.add("show");
  setFocusTrap("varOverlay", document.getElementById("varOverlay"));
}

function selectVariant(i){
  const ex = session.exercises[session.currentIdx];
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

  const recent = [...history].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,50);

  const histHtml = recent.map((h,hi)=>{
    const dateStr = new Date(h.date).toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});
    const mins = Math.floor((h.duration||0)/60), secs=(h.duration||0)%60;
    const exDone = h.exercises.filter(e=>e.sets.some(s=>s.done)==true);
    const color = DAY_COLORS[h.day] || "#fff";
    return `<div class="hist-day" data-hist="${escapeHtmlAttr(hi)}">
      <div class="hist-day-top">
        <div class="hist-day-dot" style="background:${color}"></div>
        <span class="hist-day-name" style="color:${color}">${h.day}</span>
        <span class="hist-day-date">${dateStr} · ${mins}m ${secs}s</span>
        <button class="hist-day-del" data-del-hist="${escapeHtmlAttr(hi)}" data-del-date="${escapeHtmlAttr(h.date)}" data-del-day="${escapeHtmlAttr(h.day)}" aria-label="Borrar sesión">🗑</button>
        <span class="hist-day-chev">▶</span>
      </div>
      <div class="hist-day-body">
        <div class="hist-day-stats">${exDone.length} ejercicios · ${h.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0)} series</div>
        ${exDone.slice(0,10).map(e=>{
          /* F1-C2: usar datasetOriginal como clave de continuidad */
          const key = String(e.datasetOriginal||e.dataset||e.nombre_es||"").trim().toLowerCase();
          const prog = getExerciseProgression(key);
          const bestNow = getHistoricalBest(key);
          const spark = svgSparkline(prog);
          const rmLabel = bestNow && bestNow.rm ? bestNow.rm : "";
          return `<div class="hist-ex-line">
            <div class="hist-ex">
              <span class="hist-ex-name">${escapeHtml(getApodo(e))}</span>
              <span class="hist-ex-set">${e.sets.filter(s=>s.done).map(s=>`${s.reps}×${s.kg}`).join(" · ")}</span>
            </div>
            ${spark ? `<div class="hist-ex-prog"><span class="lbl">1RM ${rmLabel}</span>${spark}</div>` : ""}
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");

  const streak = getStreak();
  const streakHtml = streak > 0 ? `<div class="streak-banner">🔥 Racha: ${streak} día${streak>1?"s":""}</div>` : "";

  return `<div class="section active">
    <h2 class="title">📈 Historial</h2>
    ${streakHtml}
    <div class="hist-summary">
      <div class="hist-stat"><div class="v">${totalSessions}</div><div class="l">Sesiones</div></div>
      <div class="hist-stat"><div class="v">${Math.floor(totalTime/60)}m</div><div class="l">Tiempo total</div></div>
      <div class="hist-stat"><div class="v">${totalSets}</div><div class="l">Series</div></div>
    </div>
    ${histHtml}
    <button class="btn btn-danger" style="width:100%;" data-clear-history>🗑️ Borrar historial</button>
  </div>`;
}

/* ================================================================
   AJUSTES
   ================================================================ */
function renderAjustes(){
  const routineSrc = lsGet(K.routine, null) ? "Archivo importado" : "Rutina integrada";
  const routine = getRoutine();
  const pending = getPending();
  const pendingCount = pending.sessions.length;
  const syncMsg = pendingCount>0
    ? `${pendingCount} sesión${pendingCount>1?"es":""} pendiente${pendingCount>1?"s":""} de subir`
    : authUser ? "Todo sincronizado" : "Sin conexión a la nube";
  const syncClass = pendingCount>0 ? "pending" : (authUser ? "" : "off");

  return `<div class="section active">
    <h2 class="title">⚙️ Ajustes</h2>
    <div class="set-group">
      <div class="set-group-title">Cuenta</div>
      <div class="set-row-item">
        <div>
          <div class="label">${authUser ? escapeHtml(authUser.email) : "Sin sesión"}</div>
          <div class="desc"><span class="sync-status ${syncClass}"><span class="dot"></span> ${syncMsg}</span></div>
        </div>
        ${authUser
          ? `<button class="btn btn-outline" data-logout>🚪 Salir</button>${pendingCount>0?`<button class="btn" data-sync-now>🔄 Subir</button>`:""}`
          : `<button class="btn" data-open-auth>🔑 Acceder</button>`}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Rutina</div>
      <div class="set-row-item">
        <div>
          <div class="label">Rutina actual: <b class="accent">${routineSrc}</b></div>
          <div class="desc">${routine.length} ejercicios · Lunes-Viernes</div>
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Importar rutina (.xlsx)</div><div class="desc">Sube tu hoja de cálculo</div></div>
        <button class="btn" data-import-xlsx>📥 Importar</button>
      </div>
      <div class="set-row-item">
        <div><div class="label">Descargar rutina (.xlsx)</div><div class="desc">Edítala y vuelve a importarla</div></div>
        <button class="btn btn-outline" data-export-xlsx>📤 Exportar</button>
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
      <div class="set-group-title">Datos</div>
      <div class="set-row-item">
        <div><div class="label">Exportar backup (.json)</div><div class="desc">Copia de seguridad de rutina + historial</div></div>
        <button class="btn btn-outline" data-export-backup>📦</button>
      </div>
      <div class="set-row-item">
        <div><div class="label">Importar backup (.json)</div><div class="desc">Restaura rutina + historial</div></div>
        <button class="btn" data-import-backup>📂</button>
      </div>
      <div class="set-row-item">
        <div><div class="label">Borrar historial</div><div class="desc">Elimina todas las sesiones (local y nube)</div></div>
        <button class="btn btn-danger" data-clear-history>🗑️</button>
      </div>
      <div class="set-row-item">
        <div><div class="label">Restablecer rutina</div><div class="desc">Vuelve a la rutina integrada</div></div>
        <button class="btn btn-outline" data-reset-routine>↺</button>
      </div>
    </div>
    <div style="text-align:center;color:var(--muted);font-size:10px;padding:12px 0 24px;line-height:1.7;">
      EyeFit v1.3 · PWA sincronizada en la nube<br>iPhone 15 · 🇪🇸 Español
    </div>
  </div>`;
}

/* ================================================================
   EVENTOS
   ================================================================ */
function getExerciseBodyPart(ex, dataset){
  if(!dataset || !ex.dataset) return "";
  const found = findExerciseInDataset(dataset, ex.dataset) || findExerciseInDataset(dataset, ex.nombre_es);
  return found && found.part ? found.part : "";
}

function attachEvents(){
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
  /* Steppers: actualización in-place (sin parpadeo) + propagación de kg y reps a las siguientes */
  document.querySelectorAll("[data-kg-plus],[data-kg-minus],[data-reps-plus],[data-reps-minus]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!session) return;
      const ex = session.exercises[session.currentIdx];
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
      if(!session) return;
      const ex = session.exercises[session.currentIdx];
      const si = parseInt(btn.dataset.setDone);
      const set = ex.sets[si];
      if(set.done) return;
      set.done = true;
      checkPR(ex, set);
      vibrate(30);
      saveSessionState();
      if(ex.currentSet < ex.sets.length){
        ex.currentSet++;
        startRest(ex.descanso_s);
        renderMain();
      } else {
        ex.completed = true;
        stopRest();
        if(session.currentIdx+1 < session.exercises.length){
          session.currentIdx++;
          renderMain();
        } else {
          showSummary();
        }
      }
    });
  });
  /* Eliminar una serie */
  document.querySelectorAll("[data-set-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!session) return;
      const ex = session.exercises[session.currentIdx];
      const si = parseInt(btn.dataset.setDel);
      if(ex.sets.length<=1) return;
      if(confirm("¿Eliminar la serie "+(si+1)+"?")){
        ex.sets.splice(si,1);
        if(ex.currentSet > si+1) ex.currentSet--;
        if(ex.currentSet > ex.sets.length) ex.currentSet = ex.sets.length;
        if(ex.currentSet < 1) ex.currentSet = 1;
        if(ex.sets.every(s=>s.done)) ex.completed = true; else ex.completed = false;
        saveSessionState();
        renderMain();
      }
    });
  });
  /* Añadir una serie extra */
  document.querySelectorAll("[data-add-set]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!session) return;
      const ex = session.exercises[session.currentIdx];
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
        if(DB && DB.clearHistoryDB){ try{ await DB.clearHistoryDB(); }catch(e){} }
        /* B2: limpiar también las sesiones pendientes de subir para que no "resuciten" */
        const p = getPending(); p.sessions = []; setPending(p);
        if(sbClient && authUser){ try{ await sbClient.from("sesiones").delete().eq("user_id", authUser.id); }catch(e){} }
        renderMain(); showToast("🗑️ Historial borrado");
      }
    });
  });
  document.querySelectorAll("[data-reset-routine]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      localStorage.removeItem(K.routine);
      selectedDay = null;
      if(sbClient && authUser){ try{ await sbClient.from("rutinas").delete().eq("user_id", authUser.id); }catch(e){} }
      showToast("↺ Rutina restaurada");
      setTab("rutina");
    });
  });
  document.querySelectorAll("[data-logout]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Cerrar sesión?")){
        if(sbClient) await sbClient.auth.signOut().catch(()=>{});
        authUser = null;
        showToast("🚪 Sesión cerrada");
        showAuthOverlay(true);
        if(currentTab==="ajustes") renderMain();
      }
    });
  });
  document.querySelectorAll("[data-open-auth]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      authMode = "login"; updateAuthTabs();
      document.getElementById("authPass").value = "";
      document.getElementById("authError").textContent = "";
      showAuthOverlay(true);
    });
  });
  document.querySelectorAll("[data-sync-now]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await scheduleSync(); renderMain(); });
  });
  document.querySelectorAll("[data-open-help]").forEach(btn=>{
    btn.addEventListener("click", ()=>showOnboarding(true));
  });
  /* Historial colapsable */
  document.querySelectorAll("[data-hist]").forEach(el=>{
    el.addEventListener("click", ()=> el.classList.toggle("open"));
  });
  /* Borrar una sesión individual del historial (local + pendientes + nube) */
  document.querySelectorAll("[data-del-hist]").forEach(btn=>{
    btn.addEventListener("click", async (e)=>{
      e.stopPropagation();
      const date = btn.dataset.delDate;
      const day = btn.dataset.delDay;
      if(confirm("¿Borrar esta sesión?")){
        /* Eliminar del historial local por date+day (identificador único ya usado en sync) */
        const history = getHistory();
        const idx = history.findIndex(h=>h.date===date && h.day===day);
        if(idx !== -1) history.splice(idx, 1);
        saveHistory(history);
        /* Eliminar también de la cola de pendientes si aún no se había subido */
        const p = getPending();
        p.sessions = p.sessions.filter(s=>!(s.date===date && s.day===day));
        setPending(p);
        /* Eliminar de la nube si hay sesión (mismo date + day) */
        if(sbClient && authUser){
          try{
            const { data: rows } = await sbClient.from("sesiones").select("id").eq("user_id", authUser.id);
            if(Array.isArray(rows)){
              const matches = rows.filter(r=>r.data && r.data.date===date && r.data.day===day);
              for(const m of matches) await sbClient.from("sesiones").delete().eq("id", m.id);
            }
          }catch(e){}
        }
        renderMain();
        showToast("🗑️ Sesión eliminada");
      }
    });
  });
}

/* ================================================================
   NUM PAD + SLIDER
   ================================================================ */
let numPadCtx = { idx:0, field:"kg" };
function openNumPad(idx, field){
  numPadCtx = { idx, field };
  const ex = session.exercises[session.currentIdx];
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
  setTimeout(()=>input.focus(), 100);
}
function closeNumPad(){ document.getElementById("numOverlay").classList.remove("show"); setFocusTrap("numOverlay", null); }
function confirmNumPad(){
  if(!session){ closeNumPad(); return; }
  const val = parseFloat(document.getElementById("numInput").value);
  if(isNaN(val)){ closeNumPad(); return; }
  const ex = session.exercises[session.currentIdx];
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
document.getElementById("numOk").addEventListener("click", confirmNumPad);
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
  confirmNumPad();
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

/* Auth overlay */
function updateAuthTabs(){
  document.querySelectorAll("[data-auth-tab]").forEach(b=>b.classList.toggle("active", b.dataset.authTab===authMode));
  document.getElementById("authSubmit").textContent = authMode==="register" ? "Registrarse" : "Acceder";
  document.getElementById("authPass").autocomplete = authMode==="register" ? "new-password" : "current-password";
}
document.querySelectorAll("[data-auth-tab]").forEach(btn=>{
  btn.addEventListener("click", ()=>{ authMode = btn.dataset.authTab; document.getElementById("authError").textContent = ""; updateAuthTabs(); });
});
document.getElementById("authSubmit").addEventListener("click", handleAuthSubmit);
document.getElementById("authPass").addEventListener("keydown", e=>{ if(e.key==="Enter") handleAuthSubmit(); });
/* B3: continuar sin conexión esconde el overlay y deja usar la app en local */
document.getElementById("authSkip").addEventListener("click", ()=>{
  authUser = null;
  showAuthOverlay(false);
  renderMain();
});

/* ================================================================
   UTILIDADES
   ================================================================ */
let toastTimeout = null;
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>t.classList.remove("show"), 2400);
}
function vibrate(pattern){ if(navigator.vibrate) navigator.vibrate(pattern); }

/* Fase D: focus trap + retorno de foco en overlays (accesibilidad).
   Al abrir un overlay se guarda el elemento activo y se enfoca el primer
   elemento enfocable; al cerrar se restaura el foco al elemento previo. */
function getFocusable(id){
  const el = document.getElementById(id);
  if(!el) return [];
  return Array.from(el.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")).filter(x=>x.offsetParent !== null);
}
const focusTraps = {};
function setFocusTrap(id, el){
  if(el){
    focusTraps[id] = document.activeElement;
    const firstFocusable = getFocusable(id)[0];
    const target = (el.tabIndex >= 0) ? el : (firstFocusable || el);
    target.focus();
  } else if(focusTraps[id]){
    const prev = focusTraps[id];
    delete focusTraps[id];
    if(prev && prev.focus) prev.focus();
  }
}

/* Persistencia de sesión activa */
function saveSessionState(){
  if(!session) return;
  session.restState = restActive ? { remaining: restRemaining, total: restTotal, paused: restPaused } : null;
  lsSet(K.session, session);
}
function clearSessionState(){ localStorage.removeItem(K.session); localStorage.removeItem(K.sets); }
function restoreSession(){
  const saved = lsGet(K.session, null);
  if(saved && saved.exercises && Array.isArray(saved.exercises) && saved.exercises.length && !saved.saved){
    session = rebaseElapsed(saved, Date.now());
    stopRest();
    if(saved.restState){
      restRemaining = saved.restState.remaining || 0;
      restTotal = saved.restState.total || 0;
      restPaused = !!saved.restState.paused;
      restActive = restRemaining > 0;
      if(restActive){
        const bar = document.getElementById("restBar");
        if(bar){ bar.style.display = "flex"; renderRestTime(); }
      }
    }
  }
}

/* Busca en el historial la última vez que se hizo este ejercicio y devuelve
   los sets reales ({kg,reps}) de esa sesión — respeta las diferencias de
   peso/reps entre series. Si no hay historial, devuelve null. */
function getLastExercisePerformance(ex){
  const history = getHistory();
  if(!history || history.length===0) return null;
  /* F1-C2: buscar por el dataset original si se aplicó una variante */
  const key = String(ex.datasetOriginal||ex.dataset||ex.nombre_es||"").trim().toLowerCase();
  if(!key) return null;
  const matches = [];
  for(const h of history){
    for(const e of (h.exercises||[])){
      const eKey = String(e.dataset||e.nombre_es||"").trim().toLowerCase();
      if(eKey === key){
        const done = (e.sets||[]).filter(s=>s.done);
        if(done.length > 0) matches.push({ date:h.date, sets:done.map(s=>({ kg:s.kg, reps:s.reps })) });
        break;
      }
    }
  }
  if(matches.length===0) return null;
  matches.sort((a,b)=>new Date(b.date)-new Date(a.date));
  return matches[0].sets;
}

function startSession(day){
  const routine = getRoutine();
  const dayEx = routine.filter(e=>e.dia===day).sort((a,b)=>(a.orden||0)-(b.orden||0));
  if(dayEx.length===0) return;
  sessionBestByEx = {};
  session = {
    session_id: genUUID(),
    day, startTime: Date.now(), elapsed: 0, baseElapsed: 0, currentIdx: 0,
    exercises: dayEx.map(ex=>{
      const lastPerf = getLastExercisePerformance(ex);
      const sets = buildExerciseSets(ex, lastPerf);
      return { ...ex, completed:false, currentSet:1, sets };
    })
  };
  saveSessionState();
  selectedDay = day;
  setTab("sesion");
}

/* ================================================================
   INIT
   ================================================================ */
(function attachStaticHandlers(){
  document.querySelectorAll(".tabbtn").forEach(btn=>{
    btn.addEventListener("click", ()=>setTab(btn.dataset.tab));
  });
  /* Botones de descanso: se enlazan UNA sola vez (evita listeners duplicados del bug ±15s) */
  document.querySelectorAll("[data-rest]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(btn.dataset.rest==="skip"){ stopRest(); }
      else if(btn.dataset.rest==="toggle"){ restPaused = !restPaused; renderRestTime(); }
      else if(btn.dataset.rest==="minus15"){
        restRemaining = Math.max(0, restRemaining-15);
        if(restRemaining <= 0){ restFinished(); return; }
        restTotal = restRemaining;
        renderRestTime();
      }
      else if(btn.dataset.rest==="plus15"){
        restRemaining += 15;
        restTotal = restRemaining;
        renderRestTime();
      }
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
          if(sbClient && authUser){
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
  await runMigrations();
  if(DB && !historyLoaded) await loadHistoryFromDB();
  let authenticated = false;
  if(sbClient){
    try{
      const { data: authData } = await sbClient.auth.getSession();
      authUser = authData.session ? authData.session.user : null;
      /* Solo permitir acceso si el email está verificado */
      if(authUser && isEmailVerified(authUser)) authenticated = true;
      else{
        if(authUser) await sbClient.auth.signOut().catch(()=>{});
        authUser = null;
        showAuthOverlay(true);
      }
    }catch(e){ authBlocked = true; showAuthOverlay(true); }
  } else {
    showAuthOverlay(true);
  }

  const datasetPromise = loadExerciseDataset();
  getHistory(); /* F2-A2: saneamiento del historial al arrancar */
  restoreSession();
  renderMain();
  datasetCache = await datasetPromise;
  renderMain();
  updateStopBtn();
  showOnboarding();

  if(authenticated){
    await scheduleSync();
    await pullServerData();
    renderMain();
  }
})();

/* Fix subida automática: reintento cada 30s si hay pendientes */
setInterval(()=>{
  if(authUser && sbClient){
    const pending = getPending();
    if(pending.sessions.length > 0 || pending.routine){
      scheduleSync().then(()=>{
        if(currentTab === "ajustes") renderMain();
      });
    }
  }
}, 30000);

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing;
        if(!sw) return;
        sw.addEventListener('statechange', ()=>{
          if(sw.state === 'installed' && navigator.serviceWorker.controller){
            showToast("🔄 Nueva versión disponible");
            if(confirm("Hay una nueva versión de EyeFit. ¿Recargar ahora?")){
              reg.waiting && reg.waiting.postMessage({ type: 'SKIP_WAITING' });
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
      if(authUser) scheduleSync();
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
    if((pending.sessions.length > 0 || pending.routine) && authUser){
      navigator.sync.register('eyefit-sync').catch(()=>{});
    }
  }
  setInterval(registerBgSync, 60000);
}

window.addEventListener("online", async ()=>{
  showToast("🌐 Conexión restablecida");
  if(authUser){
    await scheduleSync();
    await pullServerData();
    renderMain();
  }
});
function persistActiveSession(){
  if(session && session.exercises && !session.saved){
    session.elapsed = Math.floor((Date.now()-session.startTime)/1000)+session.baseElapsed;
    saveSessionState();
  }
}
window.addEventListener("pagehide", persistActiveSession);
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState === "hidden") persistActiveSession();
});

document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    for(const id of ["numOverlay","varOverlay","authOverlay","summaryOverlay"]){
      const el = document.getElementById(id);
      if(el && el.classList.contains("show")){
        setFocusTrap(id, null);
        el.classList.remove("show");
        if(id === "authOverlay") authUser = null;
        break;
      }
    }
  }
});
document.addEventListener("pageshow", async ()=>{
  if(authUser && sbClient && navigator.onLine){
    await scheduleSync();
    await pullServerData();
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
function showOnboarding(force){
  if(!force && localStorage.getItem("eyefit_onboarding_seen")) return;
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
  localStorage.setItem("eyefit_onboarding_seen", "1");
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

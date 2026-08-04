#!/usr/bin/env node
/* Restaura y aplica las ediciones de las fases A–F sobre src/app.js
   (re-aplica los cambios tras un sed accidental del archivo fuente). */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'app.js');
let js = fs.readFileSync(FILE, 'utf8');
const applied = [];

function apply(label, search, replace) {
  if (!js.includes(search)) throw new Error('SEARCH no encontrado: ' + label);
  js = js.replace(search, replace);
  applied.push(label);
}

/* 1) Code-split XLSX */
apply('loadXLSX + parseRoutineSheet async',
`function parseRoutineSheet(data){
  if(typeof XLSX === "undefined"){
    showToast("⏳ SheetJS aún no ha cargado. Reintenta en un momento");
    throw new Error("xlsx no disponible");
  }
  const wb = XLSX.read(data, { type:"array" });`,
`let xlsxPromise = null;
function loadXLSX(){
  if(typeof XLSX !== "undefined") return Promise.resolve();
  if(xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject)=>{
    const s = document.createElement("script");
    s.src = "xlsx.full.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { xlsxPromise = null; reject(new Error("xlsx load failed")); };
    document.head.appendChild(s);
  });
  return xlsxPromise;
}
async function parseRoutineSheet(data){
  try{ await loadXLSX(); }catch(e){
    showToast("⏳ No se pudo cargar SheetJS. Comprueba la conexión");
    throw new Error("xlsx no disponible");
  }
  const wb = XLSX.read(data, { type:"array" });`
);

/* 2) Quitar loadRoutineFromXlsx (SheetJS fuera del cold path) */
apply('eliminar loadRoutineFromXlsx',
`async function loadRoutineFromXlsx(){
  try{
    const resp = await fetch("rutina.xlsx", { cache:"no-store" });
    if(!resp.ok) throw new Error("no fetch");
    const buf = await resp.arrayBuffer();
    const routine = await parseRoutineSheet(new Uint8Array(buf));
    if(routine.length===0) throw new Error("vacío");
    if(!lsGet(K.routine, null)) setRoutine(routine);
  }catch(e){}
}
function exportRoutineXlsx(){`,
`async function exportRoutineXlsx(){`
);

/* 3) ExportRoutineXlsx con loadXLSX */
apply('exportRoutineXlsx async + loadXLSX',
`function exportRoutineXlsx(){
  if(typeof XLSX === "undefined"){
    showToast("⏳ SheetJS aún no ha cargado. Reintenta en un momento");
    return;
  }
  const routine = getRoutine();`,
`async function exportRoutineXlsx(){
  try{ await loadXLSX(); }catch(e){
    showToast("⏳ No se pudo cargar SheetJS. Comprueba la conexión");
    return;
  }
  const routine = getRoutine();`
);

/* 4) Slim dataset */
apply('slim dataset',
`const DATASET_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const DATASET_CACHE = "eyefit-dataset-v1";
async function loadExerciseDataset(){
  /* B8: mover el dataset fuera de localStorage → Cache API.
     iOS limita localStorage a ~5MB y lsSet fallaba silenciosamente,
     perdiendo el dataset sin aviso. La Cache API admite mucho más. */
  try{
    const cache = await caches.open(DATASET_CACHE);
    const cachedResp = await cache.match(DATASET_URL);
    if(cachedResp){
      const cached = await cachedResp.json();
      if(cached && cached.length) return cached;
    }
  }catch(e){}
  /* Migración: dataset guardado en localStorage por versiones anteriores */
  const legacy = lsGet(K.dataset, null);
  if(legacy && legacy.length){
    try{
      const cache = await caches.open(DATASET_CACHE);
      await cache.put(DATASET_URL, new Response(JSON.stringify(legacy), { headers: { "Content-Type": "application/json" } }));
    }catch(e){}
    return legacy;
  }
  try{
    const resp = await fetch(DATASET_URL);
    if(!resp.ok) throw new Error("no fetch");
    const data = await resp.json();
    const slim = data.map(ex=>({ id:ex.id, name:ex.name, image:ex.image, instr:(ex.instructions&&ex.instructions.es)||"", part:ex.body_part||"" }));
    try{
      const cache = await caches.open(DATASET_CACHE);
      await cache.put(DATASET_URL, new Response(JSON.stringify(slim), { headers: { "Content-Type": "application/json" } }));
    }catch(e){}
    return slim;
  }catch(e){ return null; }
}`,
`const DATASET_URL = "./slim-dataset.json";
const DATASET_CACHE = "eyefit-slim-v1";
async function loadExerciseDataset(){
  /* El slim dataset se sirve local (cache-first con SW stale-while-revalidate).
     Ya está mapeado a {id,name,image,instr,part}; no hay que slim-ealo en runtime. */
  try{
    const cache = await caches.open(DATASET_CACHE);
    const cachedResp = await cache.match(DATASET_URL);
    if(cachedResp){
      const cached = await cachedResp.json();
      if(cached && cached.length) return cached;
    }
  }catch(e){}
  /* Migración: dataset legacy en localStorage de versiones anteriores */
  const legacy = lsGet(K.dataset, null);
  if(legacy && legacy.length) return legacy;
  try{
    const resp = await fetch(DATASET_URL);
    if(!resp.ok) throw new Error("no fetch");
    const slim = await resp.json();
    try{
      const cache = await caches.open(DATASET_CACHE);
      await cache.put(DATASET_URL, resp.clone());
    }catch(e){}
    return slim;
  }catch(e){ return null; }
}`
);

/* 5) IndexedDB + schema versioning */
apply('IDB persistencia',
`const K = {
  routine: "eyefit_routine_v1", history: "eyefit_history_v1",
  sets: "eyefit_sets_v1", session: "eyefit_session_v1",
  dataset: "eyefit_dataset_v1", pending: "eyefit_pending_v1",
  routineUpdated: "eyefit_routine_updated_v1"
};
function lsGet(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch(e){ return def; } }
function lsSet(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
function getRoutine(){ return lsGet(K.routine, null) || DEFAULT_ROUTINE; }
function setRoutine(r){ lsSet(K.routine, r); }
function getHistory(){
  /* F2-A2: filtrar registros corruptos del historial para no romper la app.
     Si hay registros inválidos, se limpian y persisten de nuevo. */
  const raw = lsGet(K.history, []);
  if(!Array.isArray(raw)) return [];
  const valid = raw.filter(isValidSessionRecord);
  if(valid.length !== raw.length){
    try{ localStorage.setItem(K.history, JSON.stringify(valid)); }catch(e){}
  }
  return valid;
}
function saveHistory(h){ lsSet(K.history, h); }`,
`const K = {
  routine: "eyefit_routine_v1", history: "eyefit_history_v1",
  sets: "eyefit_sets_v1", session: "eyefit_session_v1",
  dataset: "eyefit_dataset_v1", pending: "eyefit_pending_v1",
  routineUpdated: "eyefit_routine_updated_v1",
  meta: "eyefit_meta"
};
const DB = window.EyeFitDB || null;
function lsGet(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch(e){ return def; } }
function lsSet(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
function getRoutine(){ return lsGet(K.routine, null) || DEFAULT_ROUTINE; }
function setRoutine(r){ lsSet(K.routine, r); }

/* ================================================================
   HISTORIAL → IndexedDB (con caché en memoria síncrona)
   ================================================================ */
let historyCache = [];
let historyLoaded = false;

async function loadHistoryFromDB(){
  if(!DB) return;
  const fromDb = await DB.getHistoryDB();
  if(Array.isArray(fromDb)){
    historyCache = fromDb.map(x => x && x.record ? x.record : x).filter(isValidSessionRecord);
    historyLoaded = true;
  } else {
    const migrated = await DB.migrateHistoryFromLocalStorage(K.history, isValidSessionRecord);
    if(Array.isArray(migrated)){
      historyCache = migrated.filter(isValidSessionRecord);
      historyLoaded = true;
    }
  }
}
function getHistory(){
  if(historyLoaded && DB) return historyCache;
  const raw = lsGet(K.history, []);
  if(!Array.isArray(raw)) return [];
  const valid = raw.filter(isValidSessionRecord);
  if(valid.length !== raw.length){
    try{ localStorage.setItem(K.history, JSON.stringify(valid)); }catch(e){}
  }
  return valid;
}
function saveHistory(h){
  const arr = Array.isArray(h) ? h.filter(isValidSessionRecord) : [];
  historyCache = arr;
  historyLoaded = true;
  if(DB){ DB.saveHistoryDB(arr); } else { lsSet(K.history, arr); }
}

/* ================================================================
   SCHEMA VERSIONING — eyefit_meta.data_version + migraciones
   v1 → v2: historial localStorage → IndexedDB (one-time)
   ================================================================ */
const DATA_VERSION = 2;
const MIGRATIONS = [
  async (nextVersion) => {
    if(nextVersion < 2 && DB){
      await loadHistoryFromDB();
      try{ localStorage.removeItem(K.history); }catch(e){}
      if(DB.setDataVersion) DB.setDataVersion(2);
    }
  }
];
async function runMigrations(){
  if(!DB) return;
  const current = DB.currentDataVersion ? DB.currentDataVersion() : 0;
  if(current >= DATA_VERSION) return;
  for(const fn of MIGRATIONS) await fn(current);
  if(DB.setDataVersion) DB.setDataVersion(DATA_VERSION);
}`
);

/* 6) init: runMigrations + quitar loadRoutineFromXlsx + showOnboarding */
apply('init migraciones + onboarding',
`  const datasetPromise = loadExerciseDataset();
  await loadRoutineFromXlsx();
  getHistory(); /* F2-A2: saneamiento del historial al arrancar */
  restoreSession();
  renderMain();
  datasetCache = await datasetPromise;
  renderMain();
  updateStopBtn();`,
`  const datasetPromise = loadExerciseDataset();
  getHistory(); /* F2-A2: saneamiento del historial al arrancar */
  restoreSession();
  renderMain();
  datasetCache = await datasetPromise;
  renderMain();
  updateStopBtn();
  showOnboarding(); /* primera visita / si no se ha visto */`
);

apply('init runMigrations header',
`(async function init(){
  let authenticated = false;`,
`(async function init(){
  /* Schema versioning: carga/migra historial localStorage→IDB antes de usarlo */
  await runMigrations();
  let authenticated = false;`
);

/* 7) await parseRoutineSheet en fileInput */
apply('await parseRoutineSheet fileInput',
`          const routine = parseRoutineSheet(new Uint8Array(ev.target.result));`,
`          const routine = await parseRoutineSheet(new Uint8Array(ev.target.result));`
);

/* 8) Backup JSON en Ajustes (HTML) */
apply('backup JSON html',
`      <div class="set-group-title">Datos</div>
      <div class="set-row-item">
        <div><div class="label">Borrar historial</div><div class="desc">Elimina todas las sesiones (local y nube)</div></div>
        <button class="btn btn-danger" data-clear-history>🗑️</button>
      </div>`,
`      <div class="set-group-title">Datos</div>
      <div class="set-row-item">
        <div><div class="label">Exportar backup (.json)</div><div class="desc">Rutina + historial completo</div></div>
        <button class="btn btn-outline" data-export-backup>📤</button>
      </div>
      <div class="set-row-item">
        <div><div class="label">Importar backup (.json)</div><div class="desc">Restaura rutina y historial</div></div>
        <button class="btn btn-outline" data-import-backup>📥</button>
      </div>
      <div class="set-row-item">
        <div><div class="label">Borrar historial</div><div class="desc">Elimina todas las sesiones (local y nube)</div></div>
        <button class="btn btn-danger" data-clear-history>🗑️</button>
      </div>`
);

/* 9) Botón Ayuda en Ajustes */
apply('ayuda html',
`    <div class="set-group">
      <div class="set-group-title">Rutina</div>`,
`    <div class="set-group">
      <div class="set-group-title">Ayuda</div>
      <div class="set-row-item">
        <div><div class="label">Guía de EyeFit</div><div class="desc">Aprende a usar rutina, sesión e historial</div></div>
        <button class="btn btn-outline" data-open-help>❓</button>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Rutina</div>`
);

/* 10) Handlers backup + ayuda + clear IDB */
apply('backup+ayuda+clear handlers',
`  document.querySelectorAll("[data-export-xlsx]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ exportRoutineXlsx(); showToast("📤 rutina.xlsx descargado"); });
  });
  document.querySelectorAll("[data-clear-history]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Borrar todo el historial?")){
        saveHistory([]);
        /* B2: limpiar también las sesiones pendientes de subir para que no "resuciten" */
        const p = getPending(); p.sessions = []; setPending(p);
        if(sbClient && authUser){ try{ await sbClient.from("sesiones").delete().eq("user_id", authUser.id); }catch(e){} }
        renderMain(); showToast("🗑️ Historial borrado");
      }
    });
  });`,
`  document.querySelectorAll("[data-export-xlsx]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ exportRoutineXlsx(); showToast("📤 rutina.xlsx descargado"); });
  });
  /* Backup JSON (rutina + historial) */
  document.querySelectorAll("[data-export-backup]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const backup = { app:"eyefit", version:2, exportedAt: new Date().toISOString(), routine: getRoutine(), history: getHistory() };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type:"application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "eyefit-backup.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 100);
      showToast("📤 Backup descargado");
    });
  });
  document.querySelectorAll("[data-import-backup]").forEach(btn=>{
    btn.addEventListener("click", ()=>document.getElementById("jsonFileInput").click());
  });
  document.querySelectorAll("[data-clear-history]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Borrar todo el historial?")){
        saveHistory([]);
        if(DB && DB.clearHistoryDB) await DB.clearHistoryDB();
        const p = getPending(); p.sessions = []; setPending(p);
        if(sbClient && authUser){ try{ await sbClient.from("sesiones").delete().eq("user_id", authUser.id); }catch(e){} }
        renderMain(); showToast("🗑️ Historial borrado");
      }
    });
  });`
);

apply('handler ayuda',
`  document.querySelectorAll("[data-sync-now]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await scheduleSync(); renderMain(); });
  });`,
`  document.querySelectorAll("[data-sync-now]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await scheduleSync(); renderMain(); });
  });
  document.querySelectorAll("[data-open-help]").forEach(btn=>{
    btn.addEventListener("click", ()=>showOnboarding(true));
  });`
);

/* 11) jsonFileInput import backup */
apply('jsonFileInput',
`  const fileInput = document.getElementById("fileInput");`,
`  const jsonFileInput = document.getElementById("jsonFileInput");
  if(jsonFileInput){
    jsonFileInput.onchange = async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      try{
        const text = await file.text();
        const backup = JSON.parse(text);
        if(!backup || backup.app !== "eyefit" || !Array.isArray(backup.routine) || !Array.isArray(backup.history)){
          showToast("⚠️ Archivo de backup no válido");
          return;
        }
        if(!confirm("¿Restaurar rutina e historial desde el backup? Se reemplazarán los datos actuales.")){
          e.target.value = "";
          return;
        }
        setRoutine(backup.routine);
        saveHistory(backup.history);
        selectedDay = null;
        if(sbClient && authUser){
          const ok = await pushRoutineToServer();
          const p = getPending();
          if(!ok) p.routine = backup.routine;
          for(const rec of backup.history) p.sessions.push(rec);
          setPending(p);
        }
        showToast("✅ Backup restaurado (" + backup.history.length + " sesiones)");
        setTab("rutina");
      }catch(err){
        showToast("❌ No se pudo leer el backup");
      }
      e.target.value = "";
    };
  }
  const fileInput = document.getElementById("fileInput");`
);

/* 12) Focus trap + aria-labels + keyboard */
apply('aria week-cells',
`    return `<div class="week-cell ${isSel?"active":""}" data-day="${escapeHtmlAttr(d)}" style="${isSel?"":`border-color:${color}44;`}">`,
`    return `<div class="week-cell ${isSel?"active":""}" data-day="${escapeHtmlAttr(d)}" role="button" tabindex="0" aria-pressed="${isSel}" aria-label="Ver rutina de ${escapeHtmlAttr(d)}" style="${isSel?"":`border-color:${color}44;`}">`
);

apply('aria steppers+set-done',
`        <button class="stepper" data-kg-minus="${si}">−</button>
        <div style="text-align:center;min-width:36px;">
          <div class="set-value" data-edit="${si}" data-field="kg">${set.kg}</div>
          <div class="set-label">kg</div>
        </div>
        <button class="stepper" data-kg-plus="${si}">+</button>
        <div style="width:6px;"></div>
        <button class="stepper" data-reps-minus="${si}">−</button>
        <div style="text-align:center;min-width:30px;">
          <div class="set-value" data-edit="${si}" data-field="reps">${set.reps}</div>
          <div class="set-label">reps</div>
        </div>
        <button class="stepper" data-reps-plus="${si}">+</button>
      </div>
      <button class="set-done ${done?"done":""}" data-set-done="${si}" ${currentSet&&!done?"":done?"":"disabled"}>✓</button>
      ${canDel?`<button class="del-set-btn" data-set-del="${si}">🗑</button>`:""}`,
`        <button class="stepper" data-kg-minus="${si}" aria-label="Reducir peso de la serie ${si+1}">−</button>
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
      <button class="set-done ${done?"done":""}" data-set-done="${si}" ${currentSet&&!done?"":done?"":"disabled"} aria-label="${done ? `Serie ${si+1} completada` : `Marcar serie ${si+1} como completada`}" aria-pressed="${done}">✓</button>
      ${canDel?`<button class="del-set-btn" data-set-del="${si}" aria-label="Eliminar serie ${si+1}">🗑</button>`:""}`
);

apply('aria add-set',
`      <button class="add-set-btn" data-add-set>＋ Añadir serie</button>`,
`      <button class="add-set-btn" data-add-set aria-label="Añadir una serie extra">＋ Añadir serie</button>`
);

apply('keyboard handlers',
`function attachEvents(){
  document.querySelectorAll("[data-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ selectedDay = el.dataset.day; renderMain(); });
  });`,
`function attachEvents(){
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
  document.querySelectorAll("[data-edit]").forEach(el=>{
    el.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openNumPad(parseInt(el.dataset.edit), el.dataset.field);
      }
    });
  });`
);

/* 13) Focus trap utilities */
apply('focus trap util',
`let toastTimeout = null;
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>t.classList.remove("show"), 2400);
}
function vibrate(pattern){ if(navigator.vibrate) navigator.vibrate(pattern); }`,
`let toastTimeout = null;
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>t.classList.remove("show"), 2400);
}
function vibrate(pattern){ if(navigator.vibrate) navigator.vibrate(pattern); }

/* ===== FOCUS TRAP + FOCUS RETURN (dialogs) ===== */
function getFocusable(el){
  if(!el) return [];
  const sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(el.querySelectorAll(sel)).filter(n => n.offsetParent !== null && getComputedStyle(n).display !== "none");
}
const focusTraps = {};
function trapFocus(id, overlayEl, open){
  if(open){
    if(focusTraps[id]) return;
    focusTraps[id] = document.activeElement;
    const focusables = getFocusable(overlayEl);
    (focusables[0] || overlayEl).focus();
  } else {
    const prev = focusTraps[id];
    delete focusTraps[id];
    if(prev && document.contains(prev)) prev.focus();
  }
}
document.addEventListener("keydown", (e)=>{
  if(e.key !== "Tab") return;
  for(const [id] of Object.entries(focusTraps)){
    const overlay = document.getElementById(id);
    if(!overlay || !overlay.classList.contains("show")) continue;
    const focusables = getFocusable(overlay);
    if(!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0], last = focusables[focusables.length-1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault(); last.focus();
    } else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault(); first.focus();
    }
    break;
  }
});`
);

/* 14) traps en overlays */
apply('auth trap',
`function showAuthOverlay(show){
  document.getElementById("authOverlay").classList.toggle("show", show);`,
`function showAuthOverlay(show){
  const overlay = document.getElementById("authOverlay");
  overlay.classList.toggle("show", show);
  trapFocus("authOverlay", overlay, show);`
);

apply('num trap',
`  document.getElementById("numOverlay").classList.add("show");
  setTimeout(()=>input.focus(), 100);
}
function closeNumPad(){ document.getElementById("numOverlay").classList.remove("show"); }`,
`  const overlay = document.getElementById("numOverlay");
  overlay.classList.add("show");
  trapFocus("numOverlay", overlay, true);
  setTimeout(()=>input.focus(), 100);
}
function closeNumPad(){
  const overlay = document.getElementById("numOverlay");
  overlay.classList.remove("show");
  trapFocus("numOverlay", overlay, false);
}`
);

apply('var open trap',
`  document.getElementById("varOverlay").classList.add("show");
}`,
`  const overlay = document.getElementById("varOverlay");
  overlay.classList.add("show");
  trapFocus("varOverlay", overlay, true);
}`
);

apply('var select0 trap',
`  if(i === 0){ document.getElementById("varOverlay").classList.remove("show"); return; } // mantener actual`,
`  if(i === 0){
    const ov = document.getElementById("varOverlay");
    ov.classList.remove("show");
    trapFocus("varOverlay", ov, false);
    return; // mantener actual
  }`
);

apply('var select trap',
`  document.getElementById("varOverlay").classList.remove("show");
  saveSessionState();`,
`  const ov = document.getElementById("varOverlay");
  ov.classList.remove("show");
  trapFocus("varOverlay", ov, false);
  saveSessionState();`
);

apply('varClose trap',
`document.getElementById("varClose").addEventListener("click", ()=>document.getElementById("varOverlay").classList.remove("show"));`,
`document.getElementById("varClose").addEventListener("click", ()=>{
  const ov = document.getElementById("varOverlay");
  ov.classList.remove("show");
  trapFocus("varOverlay", ov, false);
});`
);

apply('summary traps',
`  document.getElementById("summaryOverlay").classList.add("show");
  document.getElementById("stopSessionBtn").style.display = "none";`,
`  document.getElementById("summaryOverlay").classList.add("show");
  trapFocus("summaryOverlay", document.getElementById("summaryOverlay"), true);
  document.getElementById("stopSessionBtn").style.display = "none";`
);

apply('sumAgain trap',
`document.getElementById("sumAgain").addEventListener("click", ()=>{
  document.getElementById("summaryOverlay").classList.remove("show");
  session = null;`,
`document.getElementById("sumAgain").addEventListener("click", ()=>{
  document.getElementById("summaryOverlay").classList.remove("show");
  trapFocus("summaryOverlay", document.getElementById("summaryOverlay"), false);
  session = null;`
);

apply('esc trap',
`      if(el && el.classList.contains("show")){
        el.classList.remove("show");
        if(id === "authOverlay") authUser = null;
        break;`,
`      if(el && el.classList.contains("show")){
        el.classList.remove("show");
        trapFocus(id, el, false);
        if(id === "authOverlay") authUser = null;
        break;`
);

/* 15) Onboarding JS (final) */
apply('onboarding',
`document.addEventListener("pageshow", async ()=>{
  if(authUser && sbClient && navigator.onLine){
    await scheduleSync();
    await pullServerData();
  }
});`,
`document.addEventListener("pageshow", async ()=>{
  if(authUser && sbClient && navigator.onLine){
    await scheduleSync();
    await pullServerData();
  }
});

/* ================================================================
   ONBOARDING / AYUDA EN-APP
   ================================================================ */
const ONBOARD_STEPS = [
  { t:"📅 Rutina semanal", b:"Elige el día del <b>Lunes al Viernes</b> en la pestaña Rutina. Toca <b>Entrenar</b> para comenzar esa rutina." },
  { t:"🏋️ Entrenar", b:"Ajusta <b>peso (kg)</b> y <b>repeticiones</b> con +/−. Marca la serie ✓ y se activa el <b>descanso</b> automático." },
  { t:"📈 Historial y progresión", b:"Cada sesión se guarda sola. Verás tu <b>progresión 1RM</b>, racha y récords en <b>Historial</b>." },
  { t:"⚙️ Ajustes y copia de seguridad", b:"Exporta/importa tu <b>rutina (.xlsx)</b> y tu <b>backup (.json)</b>. Con sesión, todo se sincroniza en la nube." }
];
let onboardStep = 0;
function renderOnboarding(){
  const s = ONBOARD_STEPS[onboardStep];
  document.getElementById("onbTitle").textContent = s.t;
  document.getElementById("onbBody").innerHTML = s.b;
  document.getElementById("onbNext").textContent = onboardStep === ONBOARD_STEPS.length-1 ? "¡Empezar!" : "Siguiente";
  document.getElementById("onbDots").innerHTML = ONBOARD_STEPS.map((_,i)=>`<span class="${i===onboardStep?"active":""}"></span>`).join("");
}
function showOnboarding(force){
  if(!force && lsGet("eyefit_onboarding_seen", false)) return;
  onboardStep = 0;
  renderOnboarding();
  const overlay = document.getElementById("onboardOverlay");
  overlay.classList.add("show");
  trapFocus("onboardOverlay", overlay, true);
}
function closeOnboarding(){
  const overlay = document.getElementById("onboardOverlay");
  overlay.classList.remove("show");
  trapFocus("onboardOverlay", overlay, false);
  try{ localStorage.setItem("eyefit_onboarding_seen", "true"); }catch(e){}
}
document.getElementById("onbSkip").addEventListener("click", closeOnboarding);
document.getElementById("onbNext").addEventListener("click", ()=>{
  if(onboardStep < ONBOARD_STEPS.length-1){ onboardStep++; renderOnboarding(); }
  else closeOnboarding();
});
window.EyeFitShowOnboarding = ()=>showOnboarding(true);
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape" && document.getElementById("onboardOverlay").classList.contains("show")) closeOnboarding();
});`
);

fs.writeFileSync(FILE, js);
console.log('✔ Aplicados ' + applied.length + ' edits en src/app.js');
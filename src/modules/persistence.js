/* EyeFit — Módulo de persistencia (refactor #5 → issue #9)
   - Claves localStorage, VAPID public key
   - lsGet/lsSet, rutina (getRoutine/setRoutine)
   - Historial IndexedDB (via db.js) con caché síncrona + mutex
   - Migraciones de esquema (v1→v2)
   - Cola de pendientes para sync offline
   Exposición global: window.EyeFit.Persistence */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const isValidSessionRecord = U.isValidSessionRecord;
  const DB = global.EyeFitDB || null;
  const DEFAULT_ROUTINE = global.DEFAULT_ROUTINE || [];

  const K = {
    routine: "eyefit_routine_v1", history: "eyefit_history_v1",
    sets: "eyefit_sets_v1", session: "eyefit_session_v1",
    meta: "eyefit_meta",
    dataset: "eyefit_dataset_v1", pending: "eyefit_pending_v1",
    routineUpdated: "eyefit_routine_updated_v1"
  };
  /* VAPID public key (base64url). Se usa para la suscripción al Push Service.
     Debe coincidir con el public key usado para firmar en el servidor que envía.
     CONTACTO: sustituir si se rotan las claves. */
  const VAPID_PUBLIC_KEY = "BH9FrS4Zkvx_ejQ_upcJrInrRM9rBGXppcJaOrpoRab8kS_VLzslH07x74WAj8hoVV_QocBULV5gNVNVtXr_4pM";

  function lsGet(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch(e){ return def; } }
  function lsSet(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function getRoutine(){ return lsGet(K.routine, null) || DEFAULT_ROUTINE; }
  function setRoutine(r){ lsSet(K.routine, r); }

  /* Fase C: historial en IndexedDB (via src/db.js) con caché síncrona en memoria.
     getHistory()/saveHistory() mantienen su API síncrona para no tocar el resto. */
  let historyCache = [];
  let historyLoaded = false;
  /* Mutex para operaciones de historial (saveHistory / pullServerData).
     Evita condiciones de carrera entre autoSaveSession(s), sync, y pull. */
  let historyLock = Promise.resolve();
  async function loadHistoryFromDB(){
    if(!DB) return;
    try{
      const rows = await DB.getHistoryDB();
      if(Array.isArray(rows)) historyCache = rows.map(r=>r.record).filter(isValidSessionRecord);
    }catch(e){}
    historyLoaded = true;
  }
  async function persistHistory(records){
    if(DB){
      try{ await DB.saveHistoryDB(records !== undefined ? records : historyCache); }catch(e){}
    }else{
      lsSet(K.history, records !== undefined ? records : historyCache);
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
    /* Actualizar la caché SÍNCRONAMENTE (antes del mutex) para que los
       callers que no hacen await tengan los datos correctos de inmediato.
       La persistencia se serializa con el mutex para evitar sobrescrituras. */
    const sanitized = Array.isArray(h) ? h.filter(isValidSessionRecord) : [];
    historyCache = sanitized;
    historyLock = historyLock.then(async ()=>{
      await persistHistory(sanitized);
    }).catch(()=>{});
    return historyLock;
  }

  /* Schema versioning (eyefit_meta.data_version). v1→v2: migración one-time
     del historial de localStorage a IndexedDB (solo si la DB cargó). */
  const DATA_VERSION = 2;
  const MIGRATIONS = [
    async (nextVersion) => {
      if(nextVersion < 2 && DB && DB.migrateHistoryFromLocalStorage){
        await loadHistoryFromDB();
        const migrated = await DB.migrateHistoryFromLocalStorage(K.history, isValidSessionRecord);
        /* Recargar después de migrar: historyCache debe reflejar los datos
           recién migrados (antes quedaba vacío porque IndexedDB estaba vacía) */
        if(Array.isArray(migrated) && migrated.length > 0){
          await loadHistoryFromDB();
        }
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
    return p && typeof p === "object"
      ? { sessions:Array.isArray(p.sessions)?p.sessions:[], routine:p.routine||null, deleted:Array.isArray(p.deleted)?p.deleted:[] }
      : { sessions:[], routine:null, deleted:[] };
  }
  function setPending(p){
    /* Preservar también los tombstones de sesiones borradas (BUG-2): si el
       DELETE falla en la nube, este rastro evita que el pull las resucite. */
    lsSet(K.pending, { sessions:p.sessions||[], routine:p.routine||null, deleted:Array.isArray(p.deleted)?p.deleted:[] });
  }

  EyeFit.Persistence = {
    K, VAPID_PUBLIC_KEY, DATA_VERSION, MIGRATIONS,
    get historyCache(){ return historyCache; },
    set historyCache(v){ historyCache = v; },
    get historyLoaded(){ return historyLoaded; },
    set historyLoaded(v){ historyLoaded = v; },
    get historyLock(){ return historyLock; },
    set historyLock(v){ historyLock = v; },
    lsGet, lsSet, getRoutine, setRoutine,
    loadHistoryFromDB, persistHistory, getHistory, saveHistory,
    runMigrations, getPending, setPending
  };
})(typeof window !== "undefined" ? window : globalThis);

/* EyeFit — Módulo Supabase Auth + Sync (refactor #6 → issue #10)
   - SDK lazy (supabase.js ~180KB solo cuando hace falta)
   - pullServerData / pushRoutineToServer / pushSessionToServer
   - scheduleSync / syncPending con mutex (reintento cada 30s)
   Estado mutable (sbClient/authUser) expuesto con getters/setters.
   Exposición global: window.EyeFit.Supabase */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const mergeHistoryBySessionId = U.mergeHistoryBySessionId;
  const isValidSessionRecord = U.isValidSessionRecord;
  const genUUID = U.genUUID;
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};

  const SUPABASE_URL = "https://vkaxxphminfinufitcyp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_9mIRx8rfkAtHv9w57cbCKw_P_btyOou";
  let sbClient = null;
  let authUser = null;
  let supabasePromise = null;

  /* Carga bajo demanda del SDK de Supabase (igual que xlsx: solo al hacer login/
     registro). El archivo supabase.js existe en dist/ pero NO se ejecuta en el
     arranque, reduciendo JS ejecutado ~180KB y el main-thread work. */
  function loadSupabaseSDK(){
    if(window.supabase) return Promise.resolve(window.supabase);
    if(supabasePromise) return supabasePromise;
    supabasePromise = new Promise((resolve, reject)=>{
      const s = document.createElement("script");
      s.src = "./supabase.js";
      s.onload = ()=> resolve(window.supabase);
      s.onerror = ()=>{ supabasePromise = null; reject(new Error("supabase SDK load error")); };
      document.head.appendChild(s);
    });
    return supabasePromise;
  }
  async function ensureSupabaseClient(){
    if(sbClient) return sbClient;
    const sb = await loadSupabaseSDK();
    sbClient = sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sbClient;
  }

  async function pullServerData(){
    if(!sbClient || !authUser) return;
    /* Usar el mismo mutex que saveHistory para evitar condiciones de carrera:
       la descarga no debe intersectarse con una escritura concurrente. */
    P().historyLock = P().historyLock.then(async ()=>{
      try{
        const { data: routineRow, error: errR } = await sbClient.from("rutinas").select("routine, meta, updated_at").eq("user_id", authUser.id).maybeSingle();
        if(!errR && routineRow && routineRow.routine && Array.isArray(routineRow.routine)){
          const localTs = localStorage.getItem(P().K.routineUpdated);
          const serverTs = routineRow.updated_at;
          if(!localTs || !serverTs || new Date(serverTs) > new Date(localTs)){
            P().setRoutine(routineRow.routine);
            if(serverTs) localStorage.setItem(P().K.routineUpdated, serverTs);
            Router().selectedDay = null;
            /* Restaurar config de entrenamiento desde el servidor si viene */
            if(routineRow.meta && routineRow.meta.config) C().trainingConfig = { ...C().TRAINING_DEFAULTS, ...routineRow.meta.config };
            if(routineRow.meta && Array.isArray(routineRow.meta.trainingDays)) C().trainingDays = routineRow.meta.trainingDays;
          }
        }
        /* Descargar sesiones con paginación (Supabase limita a 1000 filas por
           request; con range() aseguramos TODAS las sesiones). */
        const PAGE_SIZE = 500;
        let allSesRows = [];
        let from = 0;
        let to = PAGE_SIZE - 1;
        let hasMore = true;
        while(hasMore){
          const { data: sesRows, error: errS } = await sbClient
            .from("sesiones")
            .select("data")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .range(from, to);
          if(errS){
            console.error("[EyeFit] pullServerData: error descargando sesiones", errS);
            break;
          }
          if(Array.isArray(sesRows)) allSesRows = allSesRows.concat(sesRows);
          if(!sesRows || sesRows.length < PAGE_SIZE) hasMore = false;
          else { from += PAGE_SIZE; to += PAGE_SIZE; }
        }
        if(allSesRows.length > 0){
          const serverHistory = allSesRows.map(r=>r.data).filter(Boolean);
          const merged = mergeHistoryBySessionId(P().getHistory(), serverHistory);
          const sanitized = merged.filter(isValidSessionRecord);
          /* Actualizar la caché y persistir de forma explícita
             (ya estamos dentro de historyLock.then → deadlock si llamamos saveHistory) */
          P().historyCache = sanitized;
          await P().persistHistory(sanitized);
          console.log(`[EyeFit] pullServerData: ${allSesRows.length} sesiones en servidor → ${merged.length} en historial local`);
        } else {
          if(P().getHistory().length === 0){
            console.log("[EyeFit] pullServerData: 0 sesiones en el servidor y 0 en local");
          } else {
            console.log(`[EyeFit] pullServerData: 0 sesiones en servidor, manteniendo ${P().getHistory().length} locales`);
          }
        }
      }catch(e){
        console.error("[EyeFit] pullServerData error:", e);
      }
    }).catch(()=>{});
    return P().historyLock;
  }

  async function pushRoutineToServer(){
    if(!sbClient || !authUser) return false;
    try{
      const { error } = await sbClient.from("rutinas").upsert(
        { user_id:authUser.id, routine:P().getRoutine(), meta:{ config:C().trainingConfig, trainingDays:C().trainingDays }, updated_at: new Date().toISOString() },
        { onConflict:"user_id" }
      );
      if(!error) localStorage.setItem(P().K.routineUpdated, new Date().toISOString());
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
    const pending = P().getPending();
    let changed = false;
    const remaining = [];
    for(let i = 0; i < pending.sessions.length; i++){
      const rec = pending.sessions[i];
      if(!isValidSessionRecord(rec)) continue;
      const ok = await pushSessionToServer(rec);
      if(ok){ changed = true; } else { remaining.push(...pending.sessions.slice(i)); break; }
    }
    if(pending.routine){
      const { error } = await sbClient.from("rutinas").upsert(
        { user_id:authUser.id, routine:pending.routine, meta:{ config:C().trainingConfig, trainingDays:C().trainingDays }, updated_at: new Date().toISOString() },
        { onConflict:"user_id" }
      ).catch(()=>({error:true}));
      if(!error){ P().setRoutine(pending.routine); pending.routine = null; changed = true; localStorage.setItem(P().K.routineUpdated, new Date().toISOString()); }
    }
    pending.sessions = remaining;
    P().setPending(pending);
    if(changed){
      Ui().showToast("🔄 Sincronizado con la nube");
      const r = Router();
      if(r.currentTab === "ajustes" || r.currentTab === "historial") r.renderMain();
    }
  }

  EyeFit.Supabase = {
    SUPABASE_URL, SUPABASE_ANON_KEY,
    get sbClient(){ return sbClient; },
    set sbClient(v){ sbClient = v; },
    get authUser(){ return authUser; },
    set authUser(v){ authUser = v; },
    get supabasePromise(){ return supabasePromise; },
    set supabasePromise(v){ supabasePromise = v; },
    get syncLock(){ return syncLock; },
    set syncLock(v){ syncLock = v; },
    get syncQueued(){ return syncQueued; },
    set syncQueued(v){ syncQueued = v; },
    loadSupabaseSDK, ensureSupabaseClient, pullServerData,
    pushRoutineToServer, pushSessionToServer, scheduleSync, syncPending
  };
})(typeof window !== "undefined" ? window : globalThis);


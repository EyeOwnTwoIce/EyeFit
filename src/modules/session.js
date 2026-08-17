/* EyeFit — Módulo gestión de sesión de entrenamiento (refactor #12 → issue #16)
   - estado session / sessionBestByEx / sessionTimerInterval
   - sessionProgress, startSession, autoSaveSession, save/clearSessionState
   - restoreSession, getLastExercisePerformance, getSessionElapsed, fmtDuration
   - updateSessionHeader, renderSessionProgressBar, checkPR
   Exposición global: window.EyeFit.Session */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const buildExerciseSets = U.buildExerciseSets;
  const genUUID = U.genUUID;
  const rebaseElapsed = U.rebaseElapsed;
  const getApodo = U.getApodo;
  const DAY_COLORS = global.DAY_COLORS || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const S = () => EyeFit.Supabase || {};
  const Ui = () => EyeFit.Ui || {};
  const RT = () => EyeFit.RestTimer || {};
  const Router = () => EyeFit.Router || {};

  let session = null;
  let sessionBestByEx = {};
  let sessionTimerInterval = null;

  /* Comprueba si el set completado es un récord personal y lo celebra en el comic-bubble */
  function checkPR(ex, set){
    const key = String(ex.dataset||ex.nombre_es||"").trim().toLowerCase();
    const best = C().getHistoricalBest(key);
    const newRM = U.epley1RM(set.kg, set.reps);
    if(!sessionBestByEx) sessionBestByEx = {};
    const sessBest = sessionBestByEx[key] || 0;
    if(newRM <= Math.max(best ? best.rm : 0, sessBest)) return;
    sessionBestByEx[key] = newRM;
    const diff = best ? ` (+${(newRM-best.rm).toFixed(0)}kg 1RM)` : "";
    RT().showComicBubble(`🏆 ¡NUEVO PR! ${getApodo(ex)} · ${set.kg}kg × ${set.reps}${diff}`);
  }

  function sessionProgress(){
    const totalSets = session.exercises.reduce((a,e)=>a+e.sets.length,0);
    const doneSets = session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
    const pct = totalSets>0 ? Math.round((doneSets/totalSets)*100) : 0;
    return { totalSets, doneSets, pct };
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
      exercises: session.exercises.map(e=>{
        const decid = C().computeProgressionDecision(e, []);
        return {
          nombre_es: e.nombre_es, dataset: e.dataset, datasetOriginal: e.datasetOriginal, orden: e.orden, completed: e.completed,
          sets: e.sets.map(s=>({ kg:s.kg, reps:s.reps, done:s.done })),
          progresion: decid ? { accion: decid.action, delta: decid.delta, motivo: decid.reason } : null
        };
      })
    };
    const history = P().getHistory();
    const dupeIdx = history.findIndex(h=>h.session_id && h.session_id === record.session_id);
    if(dupeIdx !== -1) history.splice(dupeIdx, 1);
    history.push(record);
    P().saveHistory(history);
    session.saved = true;
    clearSessionState();
    const savedMsg = document.getElementById("sumSavedMsg");
    if(S().sbClient && S().authUser){
      const ok = await S().pushSessionToServer(record);
      if(ok){
        if(savedMsg) savedMsg.textContent = "✅ Sesión guardada en la nube";
        Ui().showToast("✅ Sesión guardada en la nube");
      } else {
        const p = P().getPending(); p.sessions.push(record); P().setPending(p);
        if(savedMsg) savedMsg.textContent = "📴 Sin conexión: se subirá sola";
        Ui().showToast("📴 Sin conexión: se subirá sola");
      }
    } else {
      if(savedMsg) savedMsg.textContent = "✅ Sesión guardada en este dispositivo";
      Ui().showToast("✅ Sesión guardada");
    }
  }

  /* Persistencia de sesión activa */
  function saveSessionState(){
    if(!session) return;
    session.restState = RT().getRestState();
    P().lsSet(P().K.session, session);
    renderSessionProgressBar();
    updateSessionHeader();
  }
  function clearSessionState(){
    localStorage.removeItem(P().K.session); localStorage.removeItem(P().K.sets);
    renderSessionProgressBar();
    updateSessionHeader();
  }
  function restoreSession(){
    const saved = P().lsGet(P().K.session, null);
    if(saved && saved.exercises && Array.isArray(saved.exercises) && saved.exercises.length && !saved.saved){
      session = rebaseElapsed(saved, Date.now());
      RT().stopRest();
      RT().restoreRestState(saved.restState || null);
    }
  }

  /* Busca en el historial la última vez que se hizo este ejercicio y devuelve
     los sets reales ({kg,reps}) de esa sesión — respeta las diferencias de
     peso/reps entre series. Si no hay historial, devuelve null. */
  function getLastExercisePerformance(ex){
    const history = P().getHistory();
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
    const routine = P().getRoutine();
    const dayEx = routine.filter(e=>e.dia===day).sort((a,b)=>(a.orden||0)-(b.orden||0));
    if(dayEx.length===0) return;
    sessionBestByEx = {};
    const history = P().getHistory();
    session = {
      session_id: genUUID(),
      day, startTime: Date.now(), elapsed: 0, baseElapsed: 0, currentIdx: 0,
      exercises: dayEx.map(ex=>{
        const lastPerf = getLastExercisePerformance(ex);
        /* Aplicar progresión automática si hay historial */
        const dec = C().computeProgressionDecision(ex, history);
        let exercise = ex;
        let sets;
        if(dec && dec.peso_sugerido > 0){
          exercise = { ...ex, peso_kg: dec.peso_sugerido };
          sets = buildExerciseSets(exercise, lastPerf);
        } else {
          sets = buildExerciseSets(ex, lastPerf);
        }
        return { ...exercise, completed:false, currentSet:1, sets };
      })
    };
    renderSessionProgressBar();
    saveSessionState();
    Router().selectedDay = day;
    Router().setTab("sesion");
  }



  /* ================================================================
     HEADER DE SESIÓN: nombre del ejercicio + cronómetro + % + barra
     ================================================================ */
  function fmtDuration(secs){
    const m = Math.floor(secs/60), s = Math.floor(secs%60);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function getSessionElapsed(){
    if(!session) return 0;
    return Math.floor((Date.now()-session.startTime)/1000)+session.baseElapsed;
  }

  function updateSessionHeader(){
    const exNameEl = document.getElementById("sessionExName");
    const timerEl = document.getElementById("sessionTimer");
    const pctEl = document.getElementById("sessPct");
    const dayEl = document.getElementById("sessDay");
    const wrapEl = document.getElementById("sessProgressWrap");

    if(!session){
      if(exNameEl){ exNameEl.style.display = "none"; exNameEl.textContent = ""; }
      if(timerEl){ timerEl.style.display = "none"; timerEl.textContent = "00:00"; }
      if(wrapEl){ wrapEl.style.display = "none"; }
      if(pctEl) pctEl.textContent = "0%";
      if(dayEl) dayEl.textContent = "";
      if(sessionTimerInterval){ clearInterval(sessionTimerInterval); sessionTimerInterval = null; }
      return;
    }

    /* Nombre del ejercicio actual en el header */
    const ex = session.exercises[session.currentIdx];
    if(exNameEl){
      exNameEl.style.display = "block";
      exNameEl.textContent = ex ? getApodo(ex) : "";
    }
    /* Cronómetro (siempre visible con sesión activa, en todas las pestañas) */
    if(timerEl){
      timerEl.style.display = "inline-block";
    }
    if(wrapEl) wrapEl.style.display = "block";
    if(dayEl) dayEl.textContent = session.day || "";
    if(pctEl){
      const p = sessionProgress();
      pctEl.textContent = p.pct + "%";
    }
    renderSessionProgressBar();

    if(!sessionTimerInterval){
      sessionTimerInterval = setInterval(()=>{
        if(!session){
          if(sessionTimerInterval){ clearInterval(sessionTimerInterval); sessionTimerInterval = null; }
          return;
        }
        const t = document.getElementById("sessionTimer");
        if(t) t.textContent = fmtDuration(getSessionElapsed());
      }, 1000);
    }
    const t = document.getElementById("sessionTimer");
    if(t) t.textContent = fmtDuration(getSessionElapsed());
  }

  function renderSessionProgressBar(){
    const bar = document.getElementById("sessBar");
    if(!bar) return;
    if(!session){
      bar.classList.remove("show");
      bar.innerHTML = "";
      return;
    }
    const totalSets = session.exercises.reduce((a,e)=>a+e.sets.length,0);
    if(totalSets === 0){ bar.classList.remove("show"); return; }
    bar.classList.add("show");
    const segs = session.exercises.map(e=>{
      const col = DAY_COLORS[session.day] || "#C8FF00";
      const doneSets = e.sets.filter(s=>s.done).length;
      const pct = e.sets.length ? Math.round((doneSets/e.sets.length)*100) : 0;
      const marks = e.sets.map((_,si)=>`<span class="seg-mark" style="left:${(si+1)/e.sets.length*100}%"></span>`).join("");
      return `<div class="sess-seg" style="flex:${Ui().escapeHtml(e.sets.length)};">
        <div class="seg-fill" style="width:${Ui().escapeHtml(pct)}%;background:${Ui().escapeHtml(col)};"></div>
        ${marks}
        <span class="seg-label">${Ui().escapeHtml(e.sets.filter(s=>s.done).length)}/${Ui().escapeHtml(e.sets.length)}</span>
      </div>`;
    }).join("");
    bar.innerHTML = segs;
    /* Actualizar el % del header */
    const pctEl = document.getElementById("sessPct");
    if(pctEl){
      const p = sessionProgress();
      pctEl.textContent = p.pct + "%";
    }
  }

  EyeFit.Session = {
    get session(){ return session; },
    set session(v){ session = v; },
    get sessionBestByEx(){ return sessionBestByEx; },
    set sessionBestByEx(v){ sessionBestByEx = v; },
    get sessionTimerInterval(){ return sessionTimerInterval; },
    set sessionTimerInterval(v){ sessionTimerInterval = v; },
    checkPR, sessionProgress, autoSaveSession, saveSessionState, clearSessionState,
    restoreSession, getLastExercisePerformance, startSession, fmtDuration,
    getSessionElapsed, updateSessionHeader, renderSessionProgressBar
  };
})(typeof window !== "undefined" ? window : globalThis);

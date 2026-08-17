/* EyeFit — Módulo configuración de entrenamiento (refactor #4 → issue #8)
   - Días de entrenamiento y configuración (doble progresión + RIR)
   - Algoritmo de progresión, badge HTML y helpers de peso
   - scheduleRoutineSync (sube rutina al servidor o la deja en pending)
   Exposición global: window.EyeFit.Config */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const DAY_ORDER = global.DAY_ORDER || [];
  const escapeHtml = (EyeFit.Ui || {}).escapeHtml;
  const escapeHtmlAttr = U.escapeHtmlAttr;

  /* Persistencia y Supabase se cargan DESPUÉS de este módulo; se accede en runtime. */
  const P = () => EyeFit.Persistence || {};
  const S = () => EyeFit.Supabase || {};

  const K_CONFIG = "eyefit_training_config_v1";
  const K_TRAIN_DAYS = "eyefit_training_days_v1";
  const DEFAULT_TRAIN_DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
  const TRAINING_DEFAULTS = {
    peso_corporal: 70,
    rango_compuesto_min: 6,
    rango_compuesto_max: 10,
    rango_aislamiento_min: 10,
    rango_aislamiento_max: 15,
    rir_objetivo: 2,
    incremento_barra: 2.5,
    incremento_mancuerna: 2.0,
    tipo_progresion: "doble"  /* "doble" | "lineal" */
  };
  let trainingDays = [...DEFAULT_TRAIN_DAYS];
  function loadTrainingDays(){
    try{
      const d = P().lsGet(K_TRAIN_DAYS, null);
      if(Array.isArray(d) && d.length) trainingDays = d.filter(x=>DAY_ORDER.includes(x) || x.includes("Sáb") || x.includes("Sábado") || x === "Sábado" || x === "Domingo");
    }catch(e){}
  }
  function saveTrainingDays(){
    P().lsSet(K_TRAIN_DAYS, trainingDays);
    scheduleRoutineSync();
  }
  let trainingConfig = { ...TRAINING_DEFAULTS };
  function loadTrainingConfig(){
    try{
      const c = P().lsGet(K_CONFIG, null);
      if(c && typeof c === "object") trainingConfig = { ...TRAINING_DEFAULTS, ...c };
    }catch(e){}
  }
  function saveTrainingConfig(){
    P().lsSet(K_CONFIG, trainingConfig);
    scheduleRoutineSync();
  }
  /* Helper: intenta subir la rutina al servidor con meta. Si falla,
     la deja en pending para que el sync de 30s la reintente. */
  function scheduleRoutineSync(){
    const sb = S();
    if(!sb.sbClient || !sb.authUser) return;
    sb.pushRoutineToServer().catch(()=>{
      const p = P().getPending();
      p.routine = P().getRoutine();
      P().setPending(p);
    });
  }
  const COMPUESTOS = [
    "barbell bench press","dumbbell incline bench press","barbell incline bench press",
    "barbell full squat","sled 45° leg press","barbell bent over row","cable pulldown (pro lat bar)",
    "cable seated row","barbell deadlift","pull up (neutral grip)","dumbbell seated shoulder press",
    "dumbbell arnold press","barbell glute bridge two legs on bench (male)","barbell good morning"
  ];
  function isCompoundExercise(ex){
    const key = String((ex && (ex.datasetOriginal || ex.dataset)) || (ex && ex.nombre_es) || "").trim().toLowerCase();
    return COMPUESTOS.includes(key) || COMPUESTOS.some(c=>key.includes(c.split(" ").slice(0,2).join(" ")));
  }
  function getRepRange(ex){
    const cfg = trainingConfig;
    const min = isCompoundExercise(ex) ? cfg.rango_compuesto_min : cfg.rango_aislamiento_min;
    const max = isCompoundExercise(ex) ? cfg.rango_compuesto_max : cfg.rango_aislamiento_max;
    return { min, max };
  }
  function getIncrementFor(ex){
    const key = String((ex && (ex.datasetOriginal || ex.dataset)) || (ex && ex.nombre_es) || "").trim().toLowerCase();
    const esMancuerna = key.includes("dumbbell") || key.includes("mancuerna");
    return esMancuerna ? trainingConfig.incremento_mancuerna : trainingConfig.incremento_barra;
  }

  /* Algoritmo de doble progresión con RIR: evalúa la última sesión del
     ejercicio y decide subir/mantener/bajar peso con motivo explicado. */
  function computeProgressionDecision(ex, history){
    const cfg = trainingConfig;
    const key = String((ex && (ex.datasetOriginal || ex.dataset)) || (ex && ex.nombre_es) || "").trim().toLowerCase();
    if(!key) return null;
    const matches = [];
    for(const h of (Array.isArray(history)?history:P().getHistory())){
      for(const e of (h.exercises||[])){
        const eKey = String(e.dataset||e.nombre_es||"").trim().toLowerCase();
        if(eKey === key){
          const done = (e.sets||[]).filter(s=>s.done);
          if(done.length) matches.push({ date:h.date, sets:done, peso:pendingDoneKg(done) });
          break;
        }
      }
    }
    if(matches.length === 0) return null;
    matches.sort((a,b)=>new Date(b.date)-new Date(a.date));
    const last = matches[0];
    const prev = matches[1] || null;
    const repsArr = last.sets.map(s=>parseInt(s.reps,10)||0).filter(r=>r>0);
    if(repsArr.length === 0) return null;
    const maxReps = Math.max(...repsArr);
    const minReps = Math.min(...repsArr);
    const kgs = last.sets
      .map(s=>parseFloat(s.kg)||0)
      .filter(k=>k>0);
    const baseKg = kgs.length ? Math.max(...kgs) : (parseFloat(ex.peso_kg)||0);
    const { min, max } = getRepRange(ex);
    const inc = getIncrementFor(ex);
    /* Usar el peso de la rutina como base si no hay sets */
    if(cfg.tipo_progresion === "lineal"){
      /* Progresión lineal simple: si alcanzó el tope, subir siempre */
      if(maxReps >= max) return { action:"up", delta:inc, reason:`Progresión lineal: alcanzaste el tope del rango (${maxReps} reps). Subimos ${inc} kg para seguir estimulando.`, peso_sugerido: round1(parseFloat(ex.peso_kg)||baseKg + inc) };
      return { action:"keep", delta:0, reason:`Aún no llegas al tope del rango (${maxReps}/${max} reps). Mantenemos el peso.`, peso_sugerido: baseKg };
    }
    /* Doble progresión */
    if(maxReps >= max){
      return {
        action:"up", delta:inc,
        reason:`Completaste todas las series al máximo del rango de hipertrofia (${maxReps}/${max} reps). Subimos ${inc} kg para mantener la sobrecarga progresiva.`,
        peso_sugerido: round1(baseKg + inc)
      };
    }
    if(minReps < min){
      return {
        action:"down", delta:-inc,
        reason:`Alguna serie no alcanzó el mínimo de reps efectivas para hipertrofia (${minReps}/${min} reps). Bajamos ${inc} kg para garantizar volumen de calidad.`,
        peso_sugerido: round1(Math.max(0, baseKg - inc))
      };
    }
    /* Estancamiento: mismo peso que sesión anterior pero menos reps */
    if(prev){
      const prevMax = Math.max(...prev.sets.map(s=>parseInt(s.reps,10)||0).filter(r=>r>0), 0);
      const prevPeso = Math.max(...prev.sets.map(s=>parseFloat(s.kg)||0).filter(k=>k>0), 0);
      if(prevPeso > 0 && Math.abs(prevPeso - baseKg) < 0.01 && maxReps < prevMax){
        return {
          action:"keep", delta:0,
          reason:`Mismo peso que la sesión anterior pero menos reps (${maxReps} vs ${prevMax}). Mantenemos la carga. Revisa descanso, sueño y alimentación.`,
          peso_sugerido: baseKg, estancamiento:true
        };
      }
    }
    return {
      action:"keep", delta:0,
      reason:`Estás dentro del rango óptimo de hipertrofia (${min}-${max} reps, hiciste ${minReps}-${maxReps}). Mantenemos el peso para consolidar la adaptación.`,
      peso_sugerido: baseKg
    };
  }
  function pendingDoneKg(done){ return done.length ? Math.max(...done.map(s=>parseFloat(s.kg)||0)) : 0; }
  function round1(v){ return Math.round(v*10)/10; }

  /* Badge HTML explicando el ajuste automático de progresión */
  function progressionBadgeHtml(ex, history){
    const dec = computeProgressionDecision(ex, history);
    if(!dec) return "";
    const cls = dec.action==="up" ? "up" : (dec.action==="down" ? "down" : "keep");
    const icon = dec.action==="up" ? "⬆️" : (dec.action==="down" ? "⬇️" : "➡️");
    const d = Number(dec.delta);
    const deltaTxt = escapeHtml(d>0 ? "+"+d+" kg" : d<0 ? d+" kg" : "sin cambio");
    return `<div class="prog-badge ${cls}" title="${escapeHtmlAttr(dec.reason)}">
      ${icon} ${dec.action==="up" ? "Sube" : dec.action==="down" ? "Baja" : "Mantiene"} · ${deltaTxt}
      <span class="prog-badge detail">${escapeHtml(dec.reason)}</span>
    </div>`;
  }

  EyeFit.Config = {
    K_CONFIG, K_TRAIN_DAYS, DEFAULT_TRAIN_DAYS, TRAINING_DEFAULTS, COMPUESTOS,
    get trainingDays(){ return trainingDays; },
    set trainingDays(v){ trainingDays = v; },
    get trainingConfig(){ return trainingConfig; },
    set trainingConfig(v){ trainingConfig = v; },
    loadTrainingDays, saveTrainingDays, loadTrainingConfig, saveTrainingConfig,
    scheduleRoutineSync, isCompoundExercise, getRepRange, getIncrementFor,
    computeProgressionDecision, progressionBadgeHtml, pendingDoneKg, round1
  };
})(typeof window !== "undefined" ? window : globalThis);

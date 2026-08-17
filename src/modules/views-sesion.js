/* EyeFit — Módulo vista de sesión (refactor #15 → issue #19)
   - renderSesion (preview + vista activa con sets)
   - updateSessionSetValues, computeSummary, showSummary
   - numpad de sesión (openNumPad/closeNumPad/confirmNumPad)
   - Variantes (getVariants/openVariants/selectVariant)
   Exposición global: window.EyeFit.ViewsSesion */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const getApodo = U.getApodo;
  const clampNum = U.clampNum;
  const normalizeName = U.normalizeName;
  const escapeHtml = (EyeFit.Ui || {}).escapeHtml;
  const DAY_COLORS = global.DAY_COLORS || {};
  const ALTERNATIVAS = global.ALTERNATIVAS || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};
  const RT = () => EyeFit.RestTimer || {};
  const Session = EyeFit.Session || {};

  let pendingSummary = null;
  let numPadCtx = { idx:0, field:"kg" };

function renderSesion(){
  if(!Session.session){
    const routine = P().getRoutine();
    const todayName = Ui().getTodayName();
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
      const img = D().getExerciseImage(e, D().datasetCache);
      return `<div class="sess-preview-ex">
        ${img?`<div class="spe-img"><img src="${U.escapeHtmlAttr(img)}" alt="" loading="lazy" decoding="async" data-img-fallback="hide"></div>`:`<div class="spe-img spe-emoji">🏋️</div>`}
        <div class="spe-info">
          <div class="spe-name">${escapeHtml(getApodo(e))}</div>
          <div class="spe-meta">${escapeHtml(e.series)}×${escapeHtml(e.reps)} · ${escapeHtml(Ui().formatKg(e.peso_kg))}kg</div>
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
        <button class="btn spc-start" data-start-session="${U.escapeHtmlAttr(todayName)}">▶️ Entrenar</button>
      </div>
    </div>`;
  }

  const day = Session.session.day;
  const ex = Session.session.exercises[Session.session.currentIdx];
  const totalEx = Session.session.exercises.length;
  const imgUrl = D().getExerciseImage(ex, D().datasetCache);
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
  const instr = Ui().formatInstructions(Ui().getInstrucciones(ex));

  /* Lista de ejercicios pendientes (reordenable con flechas) */
  const upcoming = Session.session.exercises.slice(Session.session.currentIdx+1).map((u,i)=>{
    const absIdx = Session.session.currentIdx+1+i;
    const col = DAY_COLORS[day]||"#fff";
    return `<div class="up-row">
      <div class="up-arrows">
        <button class="up-arrow" data-move-up="${absIdx}" ${i===0?"disabled":""} aria-label="Mover ${U.escapeHtmlAttr(getApodo(u))} hacia arriba">↑</button>
        <button class="up-arrow" data-move-down="${absIdx}" ${absIdx===Session.session.exercises.length-1?"disabled":""} aria-label="Mover ${U.escapeHtmlAttr(getApodo(u))} hacia abajo">↓</button>
      </div>
      <span class="up-num" style="color:${escapeHtml(col)}">${escapeHtml(u.orden)}</span>
      <span class="up-name">${escapeHtml(getApodo(u))}</span>
      <span class="up-sets">${escapeHtml(u.sets.filter(s=>s.done).length)}/${escapeHtml(u.sets.length)}</span>
    </div>`;
  }).join("");

  return `<div class="section active session-view">
    <div class="ex-active-card">
      <div class="ex-active-header">
        <span class="ex-active-count">${escapeHtml(Session.session.currentIdx+1)} / ${escapeHtml(totalEx)}</span>
      </div>
      <div class="ex-active-body">
        ${imgUrl ? `<div class="ex-img-wrap" data-img-zoom aria-label="Ampliar GIF de ${U.escapeHtmlAttr(apodo)}" role="button" tabindex="0">
          <img class="ex-active-img" src="${U.escapeHtmlAttr(imgUrl)}" alt="${escapeHtml(apodo)}" loading="lazy" decoding="async" data-img-fallback="hide">
          <div class="ex-img-zoom-hint">⛶</div>
        </div>` : ""}
        ${C().progressionBadgeHtml(ex, P().getHistory())}
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
  Session.updateSessionHeader();
}
function computeSummary(){
  const completedSets = Session.session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
  const totalReps = Session.session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+s.reps,0),0);
  const totalWeight = Session.session.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(s.kg*s.reps),0),0);
  const elapsed = Math.floor((Date.now()-Session.session.startTime)/1000)+Session.session.baseElapsed;
  const completedEx = Session.session.exercises.filter(e=>e.completed).length;
  return { completedSets, totalReps, totalWeight, elapsed, completedEx, totalEx: Session.session.exercises.length, exList: Session.session.exercises };
}
function showSummary(){
  if(!Session.session) return;
  RT().stopRest();
  pendingSummary = computeSummary();
  Session.autoSaveSession();
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
  Ui().setFocusTrap("summaryOverlay", document.getElementById("summaryOverlay"));
  document.getElementById("stopSessionBtn").style.display = "none";
}
function getVariants(ex){
  const res = [];
  const manuales = ALTERNATIVAS[ex.varianteBase || ex.dataset] || [];
  for(const nombre of manuales) res.push({ nombre, part: Ui().getExerciseBodyPart(ex, D().datasetCache) || "musculatura similar" });
  if(res.length < 3 && D().datasetCache){
    const found = D().findExerciseInDataset(D().datasetCache, ex.dataset) || D().findExerciseInDataset(D().datasetCache, ex.nombre_es);
    if(found && found.part){
      const auto = D().datasetCache.filter(d=>d.part===found.part && normalizeName(d.name)!==normalizeName(found.name)).slice(0,3-res.length);
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
    { nombre: "Mantener: " + getApodo(ex), img: D().getExerciseImage(ex, D().datasetCache) },
    ...variants.map(v=>({ nombre: v.nombre, img: D().getExerciseImageForName(v.nombre, D().datasetCache) }))
  ];
  const list = document.getElementById("varList");
  list.innerHTML = `<div class="var-grid">${items.map((it,i)=>`
    <div class="var-item" data-variant-idx="${U.escapeHtmlAttr(i)}">
      ${it.img ? `<img src="${U.escapeHtmlAttr(it.img)}" alt="${escapeHtml(it.nombre)}" loading="lazy" decoding="async" data-img-fallback="hide">` : `<div class="var-noimg">🏋️</div>`}
      <div class="vi-name">${escapeHtml(it.nombre)}</div>
    </div>`).join("")}</div>`;
  document.getElementById("varOverlay").classList.add("show");
  Ui().setFocusTrap("varOverlay", document.getElementById("varOverlay"));
}
function selectVariant(i){
  const ex = Session.session.exercises[Session.session.currentIdx];
  if(i === 0){ Ui().setFocusTrap("varOverlay", null); document.getElementById("varOverlay").classList.remove("show"); return; } // mantener actual
  const v = getVariants(ex)[i-1];
  if(!v) return;
  /* F1-C2: preservar el dataset original para no romper PR/progresión/
     precarga de pesos en sesiones futuras. El dataset original se usa
     como clave de continuidad; el nombre de la variante solo para mostrar. */
  if(!ex.varianteBase) ex.varianteBase = ex.datasetOriginal || ex.dataset;
  if(!ex.datasetOriginal) ex.datasetOriginal = ex.dataset;
  ex.dataset = v.nombre;
  ex.nombre_es = v.nombre;
  Ui().setFocusTrap("varOverlay", null);
  document.getElementById("varOverlay").classList.remove("show");
  Session.saveSessionState();
  Router().renderMain();
  Ui().showToast("↔️ Variante: " + v.nombre);
}
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
  Ui().setFocusTrap("numOverlay", document.getElementById("numOverlay"));
  setTimeout(()=>{ input.focus(); input.select(); }, 100);
}
function closeNumPad(){ document.getElementById("numOverlay").classList.remove("show"); Ui().setFocusTrap("numOverlay", null); }
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
  Session.saveSessionState();
  closeNumPad();
  updateSessionSetValues();
}

  EyeFit.ViewsSesion = {
    get pendingSummary(){ return pendingSummary; },
    set pendingSummary(v){ pendingSummary = v; },
    get numPadCtx(){ return numPadCtx; },
    set numPadCtx(v){ numPadCtx = v; },
    renderSesion, updateSessionSetValues, computeSummary, showSummary,
    getVariants, openVariants, selectVariant,
    openNumPad, closeNumPad, confirmNumPad
  };
})(typeof window !== "undefined" ? window : globalThis);

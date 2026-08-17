/* EyeFit — Módulo vista de rutina semanal (refactor #14 → issue #18)
   - renderRutina (carrusel semanal + cards de ejercicio)
   - numpad de edición de series/reps/kg (openRoutineNumPad/confirmRoutineNumPad)
   Exposición global: window.EyeFit.ViewsRutina */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const getApodo = U.getApodo;
  const clampNum = U.clampNum;
  const DAY_ORDER = global.DAY_ORDER || [];
  const DAY_COLORS = global.DAY_COLORS || {};
  const DAY_SHORT = global.DAY_SHORT || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};
  const Bridge = () => EyeFit.Bridge || {};

  /* ================================================================
     VISTA RUTINA — carga directa del día actual
     ================================================================ */
  function renderRutina(){
    const routine = P().getRoutine();
    const ALL_DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
    const todayName = Ui().getTodayName();
    const defaultDay = Router().selectedDay || (ALL_DAYS.includes(todayName) ? todayName : "Lunes");
    const sel = ALL_DAYS.includes(defaultDay) ? defaultDay : "Lunes";
    Router().selectedDay = sel;

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
      ? `<div class="empty-state">${Ui().escapeHtml(sel)} es día de descanso.<br>Pulsa «Editar» para añadir ejercicios si lo deseas.</div>`
      : dayEx.map((e,ei)=>{
          const img = D().getExerciseImage(e, D().datasetCache);
          const instrRaw = Ui().getInstrucciones(e);
          const key = String(e.datasetOriginal||e.dataset||e.nombre_es||"").trim().toLowerCase();
          const best = C().getHistoricalBest(key);
          const rmLabel = best && best.rm ? `${Ui().escapeHtml(Ui().formatKg(Math.round(best.rm)))}kg` : "";
          const rmHint = best && best.rm
            ? ` title="1RM = ${Ui().escapeHtml(Ui().formatKg(best.kg))} × (1 + ${Ui().escapeHtml(best.reps)}/30) = ${Ui().escapeHtml(Ui().formatKg(Math.round(best.rm)))} kg (Epley)" data-has-rm="1"`
            : ` data-has-rm="0"`;
          /* Primer ejercicio: above-the-fold — sin lazy y alta prioridad (LCP) */
          const imgAttrs = ei === 0
            ? `fetchpriority="high" decoding="async"`
            : `loading="lazy" decoding="async"`;
          return `<div class="rt-ex-card">
            ${img ? `<div class="rtc-img-wrap" data-img-zoom data-ex-name="${U.escapeHtmlAttr(e.nombre_es)}" data-ex-dataset="${U.escapeHtmlAttr(e.dataset||"")}" data-ex-dataset-original="${U.escapeHtmlAttr(e.datasetOriginal||"")}" data-img-instr="${U.escapeHtmlAttr(instrRaw)}" role="button" tabindex="0" aria-label="Ampliar GIF de ${U.escapeHtmlAttr(getApodo(e))}">
              <img class="rtc-img" src="${U.escapeHtmlAttr(img)}" alt="${Ui().escapeHtml(getApodo(e))}" ${imgAttrs} data-img-fallback="hide">
              <div class="rtc-zoom-hint">⛶</div>
            </div>` : ""}
            <div class="rtc-info">
              <div class="rtc-name">${Ui().escapeHtml(getApodo(e))}</div>
              <div class="rtc-stats">
                <div class="rtc-stat" data-rt-edit="series" data-rt-name="${U.escapeHtmlAttr(e.nombre_es)}" data-rt-day="${U.escapeHtmlAttr(sel)}" role="button" tabindex="0"><span class="rtc-stat-val">${Ui().escapeHtml(e.series)}</span><span class="rtc-stat-lbl">series</span></div>
                <div class="rtc-stat" data-rt-edit="reps" data-rt-name="${U.escapeHtmlAttr(e.nombre_es)}" data-rt-day="${U.escapeHtmlAttr(sel)}" role="button" tabindex="0"><span class="rtc-stat-val">${Ui().escapeHtml(e.reps)}</span><span class="rtc-stat-lbl">reps</span></div>
                <div class="rtc-stat" data-rt-edit="kg" data-rt-name="${U.escapeHtmlAttr(e.nombre_es)}" data-rt-day="${U.escapeHtmlAttr(sel)}" role="button" tabindex="0"><span class="rtc-stat-val">${Ui().escapeHtml(Ui().formatKg(e.peso_kg))}</span><span class="rtc-stat-lbl">kg</span></div>
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
            : `<div class="rc-list">${dayEx.map(e=>`<div class="rc-item">${Ui().escapeHtml(getApodo(e))}</div>`).join("")}</div>`;
          return `<div class="rc-cell ${isToday?"rc-today":""} ${isSel?"rc-active":""}" data-day="${U.escapeHtmlAttr(name)}" role="button" tabindex="0" aria-pressed="${isSel}">
            <div class="rc-top">
              <span class="rc-day" style="color:${Ui().escapeHtml(color)}">${Ui().escapeHtml(DAY_SHORT[name]||name.slice(0,3))}</span>
              <span class="rc-date">${dateLabel}</span>
            </div>
            ${body}
          </div>`;
        }).join("")}
      </div>
      <div class="rt-day-nav">
        <span style="font-weight:800;font-size:13px;color:${Ui().escapeHtml(DAY_COLORS[sel]||"#fff")};">${Ui().escapeHtml(sel)}</span>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline" data-edit-routine data-edit-routine-day="${U.escapeHtmlAttr(sel)}" style="min-height:36px;">✏️ Editar</button>
          ${dayEx.length>0?`<button class="btn" style="min-height:36px;" data-start-session="${U.escapeHtmlAttr(sel)}">🏋️ Entrenar</button>`:""}
        </div>
      </div>
      <div class="rt-day-view">${dayCards}</div>
    </div>`;
  }

  /* F2: numpad para editar series/reps/kg de la rutina (sin sesión activa) */
  let numPadRoutineCtx = null; /* { name, day, field } */
  function openRoutineNumPad(el){
    const field = el.dataset.rtEdit;
    const name = el.dataset.rtName;
    const day = el.dataset.rtDay;
    if(!name) return;
    const routine = P().getRoutine();
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
    Ui().setFocusTrap("numOverlay", document.getElementById("numOverlay"));
    setTimeout(()=>{ input.focus(); input.select(); }, 100);
  }
  function confirmRoutineNumPad(){
    if(!numPadRoutineCtx){ EditR().closeNumPad(); return; }
    const val = parseFloat(document.getElementById("numInput").value);
    if(isNaN(val)){ EditR().closeNumPad(); return; }
    const { name, day, field } = numPadRoutineCtx;
    EditR().applyRoutineChange(r=>{
      const ex = r.find(e=>e.dia===day && e.nombre_es===name);
      if(!ex) return r;
      if(field==="series") ex.series = clampNum(Math.round(val), 1, 20, 3);
      else if(field==="reps") ex.reps = clampNum(Math.round(val), 1, 100, 8);
      else if(field==="kg") ex.peso_kg = clampNum(val, 0, 500, 0);
      return r;
    });
    EditR().closeNumPad();
    numPadRoutineCtx = null;
    Router().renderMain();
    Ui().showToast("💾 Rutina actualizada");
  }

  EyeFit.ViewsRutina = {
    renderRutina,
    get numPadRoutineCtx(){ return numPadRoutineCtx; },
    set numPadRoutineCtx(v){ numPadRoutineCtx = v; },
    openRoutineNumPad, confirmRoutineNumPad
  };
})(typeof window !== "undefined" ? window : globalThis);

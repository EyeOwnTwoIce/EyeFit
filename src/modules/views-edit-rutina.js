/* EyeFit — Módulo vista de edición de rutina (refactor #16 → issue #20)
   - CRUD de ejercicios y series (renderEditRoutine, handleEditRoutineEvent)
   - Picker de ejercicios (openExercisePicker/renderPickerList/selectExerciseFromPicker)
   - Sustitución de ejercicio en el historial (editHistSubIdx)
   Exposición global: window.EyeFit.ViewsEditRutina */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const getApodo = U.getApodo;
  const buildExerciseSets = U.buildExerciseSets;
  const formatRest = U.formatRest;
  const normalizeName = U.normalizeName;
  const escapeHtml = (EyeFit.Ui || {}).escapeHtml;
  const DAY_ORDER = global.DAY_ORDER || [];
  const DAY_COLORS = global.DAY_COLORS || {};
  const DAY_SHORT = global.DAY_SHORT || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};
  const Hist = () => EyeFit.ViewsHistorial || {};

  let routineEditDay = null;
  let pickerDay = null;
  let editHistSubIdx = -1;

  function applyRoutineChange(updater){
    const routine = P().getRoutine();
    const next = updater(routine);
    /* Reasignar orden por día */
    const od = {};
    for(const ex of next){ od[ex.dia]=(od[ex.dia]||0)+1; ex.orden=od[ex.dia]; }
    P().setRoutine(next);
    C().scheduleRoutineSync();
  }

  function renderEditRoutine(){
    const routine = P().getRoutine();
    const days = DAY_ORDER.filter(d=>routine.some(e=>e.dia===d));
    const todayName = Ui().getTodayName();
    const sel = routineEditDay || (days.includes(todayName) ? todayName : days[0]) || "Lunes";
    const dayEx = routine.filter(e=>e.dia===sel).sort((a,b)=>(a.orden||0)-(b.orden||0));

    /* Semana */
    const weekHtml = days.map(d=>{
      const isSel = d===sel;
      const color = DAY_COLORS[d] || "#888";
      return `<div class="week-cell ${isSel?"active":""}" data-edit-day="${U.escapeHtmlAttr(d)}" role="button" tabindex="0" aria-pressed="${isSel}" aria-label="Editar día ${U.escapeHtmlAttr(d)}" style="${isSel?"":`border-color:${color}44;`}">
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
            <button class="edit-mini" data-edit-ex-toggle="${ei}" aria-label="Editar series de ${U.escapeHtmlAttr(getApodo(ex))}">✏️</button>
            <button class="edit-mini" data-edit-ex-up="${ei}" ${ei===0?"disabled":""} aria-label="Subir ${U.escapeHtmlAttr(getApodo(ex))}">↑</button>
            <button class="edit-mini" data-edit-ex-down="${ei}" ${ei===dayEx.length-1?"disabled":""} aria-label="Bajar ${U.escapeHtmlAttr(getApodo(ex))}">↓</button>
            <button class="edit-mini danger" data-edit-ex-del="${ei}" aria-label="Eliminar ${U.escapeHtmlAttr(getApodo(ex))}">✕</button>
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


  function openExercisePicker(day){
    pickerDay = day;
    document.getElementById("pickerDayLabel").textContent = "Añadir a: " + (day || "");
    renderPickerList("");
    document.getElementById("exPickerOverlay").classList.add("show");
    Ui().setFocusTrap("exPickerOverlay", document.getElementById("exPickerOverlay"));
    setTimeout(()=>document.getElementById("pickerSearch").focus(), 100);
  }
  function renderPickerList(query){
    const list = document.getElementById("pickerList");
    const q = normalizeName(query);
    let items = D().datasetCache || [];
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
          let imgBase = D().findEmbeddedImage(d.name);
          if(!imgBase && d.image) imgBase = String(d.image).replace("images/","").replace(".jpg","").replace(".png","");
          const imgUrl = imgBase ? D().resolveGifUrl(imgBase) : null;
          /* M5: metadatos de músculo/equipamiento desde exercise-meta.json */
          const meta = D().getExerciseMeta(d.name);
          const partLabel = escapeHtml(meta && meta.muscle ? meta.muscle : (d.part||""));
          const equipLabel = meta && meta.equip ? escapeHtml(meta.equip) : "";
          return `<div class="picker-item" data-pick-ex="${U.escapeHtmlAttr(i)}" data-pick-name="${U.escapeHtmlAttr(d.name)}" data-pick-image="${U.escapeHtmlAttr(d.image||"")}" data-pick-part="${U.escapeHtmlAttr(d.part||"")}">
            ${imgUrl ? `<img class="rt-ex-img" style="width:34px;height:34px;border-radius:6px;" src="${U.escapeHtmlAttr(imgUrl)}" alt="" loading="lazy" decoding="async" data-img-fallback="hide">` : ""}
            <div style="flex:1;min-width:0;">
              <div class="pi-name">${escapeHtml(d.name)}</div>
              <div class="pi-sub">${partLabel}${equipLabel ? ` · ${equipLabel}` : ""}</div>
            </div>
          </div>`;
        }).join("")
      : `<div class="empty-state" style="padding:20px;">Sin resultados</div>`;
  }
  function closeExercisePicker(){
    Ui().setFocusTrap("exPickerOverlay", null);
    document.getElementById("exPickerOverlay").classList.remove("show");
    /* Resetear la sustitución pendiente del historial */
    editHistSubIdx = -1;
    pickerDay = null;
  }
  /* Contexto para la sustitución de ejercicio: si editHistSubIdx ≥ 0, el picker
     sustituye el ejercicio con ese índice en editingHistRecord (historial). */
  function selectExerciseFromPicker(el){
    const name = el.getAttribute("data-pick-name") || "";
    const image = el.getAttribute("data-pick-image") || "";
    if(!name) return;
    /* ---- Sustituir ejercicio dentro del historial (F5) ---- */
    const H = Hist();
    if(editHistSubIdx >= 0 && H.editingHistRecord){
      const ex = H.editingHistRecord.exercises[editHistSubIdx];
      if(ex){
        const oldSets = ex.sets || [];
        const oldSeries = ex.series || oldSets.length || 3;
        const oldReps = ex.reps || (oldSets[0] && oldSets[0].reps) || 10;
        const oldWeight = ex.peso_kg != null ? ex.peso_kg : (oldSets[0] && oldSets[0].kg) || 0;
        const found = D().datasetCache ? D().findExerciseInDataset(D().datasetCache, name) : null;
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
      H.openEditHistSession(H.editingHistRecord);
      closeExercisePicker();
      editHistSubIdx = -1;
      Ui().showToast("↔️ Ejercicio sustituido");
      return;
    }
    if(!pickerDay){ closeExercisePicker(); return; }
    applyRoutineChange(routine=>{
      const ex = { dia:pickerDay, orden:99, nombre_es:name, dataset:name, series:3, reps:10, peso_kg:0, descanso_s:90, notas:"" };
      /* Si el dataset tiene instrucciones, usarlas como notas */
      const found = D().datasetCache ? D().findExerciseInDataset(D().datasetCache, name) : null;
      if(found){
        if(found.instructions) ex.notas = found.instructions;
        ex.dataset = found.name;
      }
      routine.push(ex);
      return routine;
    });
    closeExercisePicker();
    Router().renderMain();
    Ui().showToast("➕ Ejercicio añadido: " + name);
  }

  function handleEditRoutineEvent(btn){
    const d = btn.dataset;
    if(d.editExToggle !== undefined){
      const body = document.querySelector(`[data-edit-ex-body="${d.editExToggle}"]`);
      if(body) body.classList.toggle("open");
      return;
    }
    if(d.editExUp !== undefined){
      const routine = P().getRoutine();
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
      Router().renderMain();
      return;
    }
    if(d.editExDown !== undefined){
      const routine = P().getRoutine();
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
      Router().renderMain();
      return;
    }
    if(d.editExDel !== undefined){
      const routine = P().getRoutine();
      const dayEx = routine.filter(e=>e.dia===routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
      const ei = parseInt(d.editExDel);
      const ex = dayEx[ei];
      if(!ex) return;
      if(confirm(`¿Eliminar "${getApodo(ex)}" de ${routineEditDay}?`)){
        applyRoutineChange(r=>r.filter(e=>!(e.dia===ex.dia && e.nombre_es===ex.nombre_es)));
        Router().renderMain();
        Ui().showToast("🗑️ Ejercicio eliminado");
      }
      return;
    }
    if(d.editSetKg !== undefined || d.editSetReps !== undefined){
      const [ei, si] = (d.editSetKg ?? d.editSetReps).split("|").map(Number);
      const routine = P().getRoutine();
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
      const routine = P().getRoutine();
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
        Ui().showToast("⚠️ No puedes eliminar la única serie");
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
      P().setRoutine(routine);
      if(S().sbClient && S().authUser) S().pushRoutineToServer();
      Router().renderMain();
      Ui().showToast("🗑️ Serie eliminada");
      return;
    }
    if(d.editAddSet !== undefined){
      const ei = parseInt(d.editAddSet);
      const routine = P().getRoutine();
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
      P().setRoutine(routine);
      if(S().sbClient && S().authUser) S().pushRoutineToServer();
      Router().renderMain();
      return;
    }
  }

  EyeFit.ViewsEditRutina = {
    get routineEditDay(){ return routineEditDay; },
    set routineEditDay(v){ routineEditDay = v; },
    get pickerDay(){ return pickerDay; },
    set pickerDay(v){ pickerDay = v; },
    get editHistSubIdx(){ return editHistSubIdx; },
    set editHistSubIdx(v){ editHistSubIdx = v; },
    applyRoutineChange, renderEditRoutine,
    openExercisePicker, renderPickerList, closeExercisePicker,
    selectExerciseFromPicker, handleEditRoutineEvent
  };
})(typeof window !== "undefined" ? window : globalThis);

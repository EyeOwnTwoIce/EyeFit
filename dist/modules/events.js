/* EyeFit — Módulo de eventos de UI (refactor #19 → issue #23)
   - attachEvents: delegación de eventos para rutina, sesión, historial, ajustes
   - attachEditHistOverlayEvents: overlay de edición de historial
   - attachSwipeRow: swipe para eliminar sets + drag & drop táctil
   - Listeners estáticos: numpad, variantes, zoom, auth, picker, import/export
   Exposición global: window.EyeFit.Events */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const S = () => EyeFit.Supabase || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const RT = () => EyeFit.RestTimer || {};
  const Router = () => EyeFit.Router || {};
  const Session = () => EyeFit.Session || {};
  const Auth = () => EyeFit.Auth || {};
  const Push = () => EyeFit.Push || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};
  const VR = () => EyeFit.ViewsRutina || {};
  const VS = () => EyeFit.ViewsSesion || {};
  const EditH = () => EyeFit.ViewsHistorial || {};
  const X = () => EyeFit.XlsxIO || {};

function attachEditHistOverlayEvents(){
  const ov = document.getElementById("editHistOverlay");
  if(!ov) return;
  const closeBtn = document.getElementById("editHistClose");
  if(closeBtn) closeBtn.addEventListener("click", EditH().dismissEditHist);
  const cancelBtn = document.getElementById("editHistCancel");
  if(cancelBtn) cancelBtn.addEventListener("click", EditH().dismissEditHist);
  const saveBtn = document.getElementById("editHistSave");
  if(saveBtn) saveBtn.addEventListener("click", EditH().saveEditHist);

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
      const ex = EditH().editingHistRecord && EditH().editingHistRecord.exercises && EditH().editingHistRecord.exercises[ei];
      if(!ex) return;
      const last = ex.sets && ex.sets[ex.sets.length-1];
      if(!ex.sets) ex.sets = [];
      ex.sets.push({
        kg: last && last.kg != null ? last.kg : (parseFloat(ex.peso_kg)||0),
        reps: last && last.reps != null ? last.reps : (parseInt(ex.reps)||8),
        done: true
      });
      /* Re-renderizar el overlay para mostrar la nueva fila */
      EditH().openEditHistSession(EditH().editingHistRecord);
    }
    if(delBtn){
      const [ei, si] = delBtn.dataset.ehDel.split("|").map(Number);
      const ex = EditH().editingHistRecord && EditH().editingHistRecord.exercises && EditH().editingHistRecord.exercises[ei];
      if(!ex || !ex.sets) return;
      ex.sets.splice(si, 1);
      EditH().openEditHistSession(EditH().editingHistRecord);
    }
    if(delExBtn){
      const ei = parseInt(delExBtn.dataset.ehDelEx);
      if(!EditH().editingHistRecord || !Array.isArray(EditH().editingHistRecord.exercises)) return;
      EditH().editingHistRecord.exercises.splice(ei, 1);
      EditH().openEditHistSession(EditH().editingHistRecord);
    }
    if(swapBtn){
      const ei = parseInt(swapBtn.dataset.ehSwap);
      if(!EditH().editingHistRecord || !Array.isArray(EditH().editingHistRecord.exercises)) return;
      EditR().editHistSubIdx = ei;
      /* Abrir el picker de ejercicios en modo sustitución */
      EditH().openHistExercisePicker();
    }
  });
}
function attachEvents(){
  /* --- Modo edición rutina --- */
  document.querySelectorAll("[data-edit-routine]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      Router().routineEditMode = true;
      EditR().routineEditDay = btn.dataset.editRoutineDay || Router().selectedDay || null;
      Router().renderMain();
    });
  });
  document.querySelectorAll("[data-edit-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ EditR().routineEditDay = el.dataset.editDay; Router().renderMain(); });
  });
  /* Cancelar edición sin guardar */
  document.querySelectorAll("[data-edit-cancel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      /* Limpiar cambios temporales (_edit_*) sin guardar */
      const routine = P().getRoutine();
      for(const ex of routine){
        for(const k of Object.keys(ex)){
          if(k.startsWith("_edit_")) delete ex[k];
        }
      }
      P().setRoutine(routine);
      Router().routineEditMode = false;
      EditR().routineEditDay = null;
      Router().renderMain();
      Ui().showToast("✕ Edición cancelada");
    });
  });
  document.querySelectorAll("[data-edit-done]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      /* Aplicar cambios temporales (_edit_*) a los valores reales */
      const routine = P().getRoutine();
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
      P().setRoutine(routine);
      if(S().sbClient && S().authUser) S().pushRoutineToServer();
      Router().routineEditMode = false;
      EditR().routineEditDay = null;
      Router().renderMain();
      Ui().showToast("💾 Rutina guardada");
    });
  });
  document.querySelectorAll("[data-edit-ex-add],[data-edit-add-ex]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const day = EditR().routineEditDay || Router().selectedDay;
      if(day) EditR().openExercisePicker(day);
    });
  });
  /* Todos los botones del editor usando un único selector */
  document.querySelectorAll("[data-edit-ex-toggle],[data-edit-ex-up],[data-edit-ex-down],[data-edit-ex-del],[data-edit-set-kg],[data-edit-set-reps],[data-edit-set-del],[data-edit-add-set]").forEach(btn=>{
    if(btn.dataset.editSetKg !== undefined || btn.dataset.editSetReps !== undefined){
      btn.addEventListener("change", ()=>{ EditR().handleEditRoutineEvent(btn); });
      /* Preseleccionar el número original al enfocar */
      btn.addEventListener("focus", ()=>{
        setTimeout(()=>{ btn.select(); }, 0);
      });
    } else {
      btn.addEventListener("click", ()=>{ EditR().handleEditRoutineEvent(btn); });
    }
  });
  document.querySelectorAll("[data-day]").forEach(el=>{
    el.addEventListener("click", ()=>{ Router().selectedDay = el.dataset.day; Router().renderMain(); });
    el.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        Router().selectedDay = el.dataset.day;
        Router().renderMain();
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
        if(best && best.dataset.day && best.dataset.day !== Router().selectedDay){
          Router().selectedDay = best.dataset.day;
          Router().renderMain();
        }
      }, 90);
      _scrollLock = false;
    }, { passive:true });
  }
  /* F2: editar series/reps/kg de la rutina tocando directamente en las cards */
  document.querySelectorAll("[data-rt-edit]").forEach(el=>{
    el.addEventListener("click", ()=>{
      VR().openRoutineNumPad(el);
    });
    el.addEventListener("keydown", (e)=>{
      if(e.key==="Enter" || e.key===" "){ e.preventDefault(); VR().openRoutineNumPad(el); }
    });
  });

  /* UX7: al tocar el valor 1RM, mostrar la explicación de Epley (para touch) */
  document.querySelectorAll("[data-has-rm='1']").forEach(el=>{
    el.addEventListener("click", (e)=>{
      e.stopPropagation();
      const tip = el.getAttribute("title") || "1RM estimado";
      Ui().showToast("💡 " + tip);
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
    btn.addEventListener("click", ()=>{ Session().startSession(btn.dataset.startSession); });
  });
  /* Confirmación de inicio de sesión para el día actual */
  document.querySelectorAll("[data-start-session-confirm]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const day = btn.dataset.startSessionConfirm;
      const routine = P().getRoutine();
      const dayEx = routine.filter(e=>e.dia===day).sort((a,b)=>(a.orden||0)-(b.orden||0));
      if(!dayEx.length) return;
      /* Construir modal de confirmación dentro de la vista actual */
      const exList = dayEx.map((e,i)=>{
        const img = D().getExerciseImage(e, D().datasetCache);
        return `<div class="confirm-ex-row">
          ${img?`<img src="${U.escapeHtmlAttr(img)}" alt="" class="confirm-ex-img" data-img-fallback="hide">`:""}
          <span class="confirm-ex-name">${escapeHtml(getApodo(e))}</span>
          <span class="confirm-ex-meta">${escapeHtml(e.series)}×${escapeHtml(e.reps)} <b>${escapeHtml(formatKg(e.peso_kg))}</b>kg</span>
        </div>`;
      }).join("");
      const totalSets = dayEx.reduce((a,e)=>a+Number(e.series||3),0);
      const modal = document.createElement("div");
      modal.className = "Session().session-confirm-overlay";
      modal.innerHTML = `
        <div class="Session().session-confirm-card">
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
        Session().startSession(day);
      });
      modal.querySelector("[data-sc-cancel]").addEventListener("click", ()=>{
        modal.remove();
      });
    });
  });

  /* Steppers: actualización in-place (sin parpadeo) + propagación de kg y reps a las siguientes */
  document.querySelectorAll("[data-kg-plus],[data-kg-minus],[data-reps-plus],[data-reps-minus]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session().session) return;
      const ex = Session().session.exercises[Session().session.currentIdx];
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
      Session().saveSessionState();
      VS().updateSessionSetValues();
    });
  });
  document.querySelectorAll("[data-edit]").forEach(el=>{
    el.addEventListener("click", ()=> VS().openNumPad(parseInt(el.dataset.edit), el.dataset.field));
    el.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        VS().openNumPad(parseInt(el.dataset.edit), el.dataset.field);
      }
    });
  });
  document.querySelectorAll("[data-set-done]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session().session) return;
      const ex = Session().session.exercises[Session().session.currentIdx];
      const si = parseInt(btn.dataset.setDone);
      const set = ex.sets[si];
      if(set.done) return;
      set.done = true;
      Session().checkPR(ex, set);
      Ui().vibrate(30);
      Session().saveSessionState();
      if(ex.currentSet < ex.sets.length){
        ex.currentSet++;
        RT().startRest(ex.descanso_s);
        Router().renderMain();
      } else {
        /* Última serie del ejercicio: descanso antes de pasar al siguiente */
        ex.completed = true;
        if(Session().session.currentIdx+1 < Session().session.exercises.length){
          Session().session.currentIdx++;
          RT().startRest(ex.descanso_s); /* Descanso inter-ejercicio */
          Router().renderMain();
        } else {
          /* Fin de la sesión */
          RT().stopRest();
          VS().showSummary();
        }
      }
    });
  });
  /* Eliminar una serie completada mediante swipe (confirmación visual) */
  let swipeDeleteSet = null;
  function askDeleteSet(si, rowEl){
    if(!Session().session) return;
    swipeDeleteSet = si;
    const ov = document.getElementById("swipeConfirmOverlay");
    if(ov){
      const ex = Session().session.exercises[Session().session.currentIdx];
      const set = ex.sets[si];
      document.getElementById("swipeConfirmText").textContent =
        `¿Eliminar la serie ${si+1} (${set.kg}kg × ${set.reps})?`;
      ov.classList.add("show");
      Ui().setFocusTrap("swipeConfirmOverlay", ov);
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
    Ui().setFocusTrap("swipeConfirmOverlay", null);
    if(!Session().session || swipeDeleteSet === null) return;
    const ex = Session().session.exercises[Session().session.currentIdx];
    if(ex.sets.length <= 1){
      Ui().showToast("⚠️ No puedes eliminar la única serie");
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
    Session().saveSessionState();
    Router().renderMain();
    Ui().showToast("🗑️ Serie eliminada");
    swipeDeleteSet = null;
  });
  document.getElementById("swipeConfirmCancel").addEventListener("click", ()=>{
    document.getElementById("swipeConfirmOverlay").classList.remove("show");
    Ui().setFocusTrap("swipeConfirmOverlay", null);
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
            const found = D().datasetCache ? (D().findExerciseInDataset(D().datasetCache, ds||nm)) : null;
            instrText = (found && found.instructions) ? found.instructions : "";
          }
        }
        if(instrText){
          instrEl.innerHTML = `<div class="zi-title">📖 Instrucciones</div>` + Ui().formatInstructions(instrText);
        } else {
          instrEl.innerHTML = "";
        }
      }
      document.getElementById("imgZoomOverlay").classList.add("show");
      Ui().setFocusTrap("imgZoomOverlay", document.getElementById("imgZoomOverlay"));
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
      if(!Session().session) return;
      const idx = parseInt(btn.dataset.moveUp ?? btn.dataset.moveDown);
      const dir = btn.dataset.moveUp ? -1 : 1;
      const j = idx + dir;
      if(j < 0 || j >= Session().session.exercises.length) return;
      const arr = Session().session.exercises;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      /* Reasignar orden visual (1..n) */
      arr.forEach((e,i)=>{ e.orden = i+1; });
      Session().saveSessionState();
      Router().renderMain();
    });
  });
  /* Añadir una serie extra */
  document.querySelectorAll("[data-add-set]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(!Session().session) return;
      const ex = Session().session.exercises[Session().session.currentIdx];
      const last = ex.sets[ex.sets.length-1] || { kg:parseFloat(ex.peso_kg)||0, reps:parseInt(ex.reps)||8 };
      ex.sets.push({ kg:last.kg, reps:last.reps, done:false });
      ex.completed = false;
      Session().saveSessionState();
      Router().renderMain();
    });
  });
  document.querySelectorAll("[data-open-variants]").forEach(btn=>{
    btn.addEventListener("click", VS().openVariants);
  });
  document.querySelectorAll("[data-import-xlsx]").forEach(btn=>{
    btn.addEventListener("click", ()=>document.getElementById("fileInput").click());
  });
  document.querySelectorAll("[data-export-xlsx]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await X().exportRoutineXlsx(); Ui().showToast("📤 rutina.xlsx descargado"); });
  });
  /* Fase C: backup JSON (rutina + historial) */
  document.querySelectorAll("[data-export-backup]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const payload = {
        app: "eyefit",
        version: 2,
        exportedAt: new Date().toISOString(),
        routine: P().getRoutine(),
        history: P().getHistory()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "eyefit-backup.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
      Ui().showToast("📦 Backup exportado");
    });
  });
  document.querySelectorAll("[data-import-backup]").forEach(btn=>{
    btn.addEventListener("click", ()=>document.getElementById("jsonFileInput").click());
  });
  document.querySelectorAll("[data-clear-history]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Borrar todo el historial?")){
        await P().saveHistory([]);
        /* Nota: P().saveHistory([]) con el mutex ya persiste [] a IndexedDB o localStorage.
           Eliminar DB.clearHistoryDB() redundante que podría interrumpir el mutex. */
        const p = P().getPending(); p.sessions = []; P().setPending(p);
        if(S().sbClient && S().authUser){ try{ await S().sbClient.from("sesiones").delete().eq("user_id", S().authUser.id); }catch(e){} }
        Router().renderMain(); Ui().showToast("🗑️ Historial borrado");
      }
    });
  });
  document.querySelectorAll("[data-reset-routine]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      localStorage.removeItem(K.routine);
      Router().selectedDay = null;
      if(S().sbClient && S().authUser){ try{ await S().sbClient.from("rutinas").delete().eq("user_id", S().authUser.id); }catch(e){} }
      Ui().showToast("↺ Rutina restaurada");
      Router().setTab("rutina");
    });
  });
  document.querySelectorAll("[data-logout]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      if(confirm("¿Cerrar sesión?")){
        if(S().sbClient) await S().sbClient.auth.signOut().catch(()=>{});
        S().authUser = null;
        Ui().showToast("🚪 Sesión cerrada");
        Auth().showAuthOverlay(true);
        if(Router().currentTab==="ajustes") Router().renderMain();
      }
    });
  });
  document.querySelectorAll("[data-open-auth]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      Auth().authMode = "login"; Auth().updateAuthTabs();
      document.getElementById("authPass").value = "";
      document.getElementById("authError").textContent = "";
      Auth().showAuthOverlay(true);
    });
  });
  document.querySelectorAll("[data-sync-now]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{ await S().scheduleSync(); Router().renderMain(); });
  });
  document.querySelectorAll("[data-open-help]").forEach(btn=>{
    btn.addEventListener("click", ()=>showOnboarding(true));
  });
  /* Notificaciones push: activar/desactivar (requiere gesture explícito) */
  document.querySelectorAll("[data-enable-push]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ Push().enablePushNotifications(); });
  });
  document.querySelectorAll("[data-disable-push]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ Push().disablePushNotifications(); });
  });
  /* Historial colapsable */
  document.querySelectorAll("[data-hist]").forEach(el=>{
    el.addEventListener("click", (e)=>{
      if(e.target.closest("[data-swipable-hist]") && e.target.closest(".hist-swipe-bg")) return;
      el.classList.toggle("open");
    });
  });
  /* Borrar sesión por swipe a la izquierda en el historial */
  /* deleteHistorySession → src/modules/views-historial.js (issue #21) */
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
          EditH().deleteHistorySession(row.dataset.delDate, row.dataset.delDay).then(()=>{
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
          EditH().deleteHistorySession(row.dataset.delDate, row.dataset.delDay).then(()=>{
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
      if(C().trainingDays.includes(d)){
        C().trainingDays = C().trainingDays.filter(x=>x!==d);
      } else {
        C().trainingDays.push(d);
      }
      C().saveTrainingDays();
      Router().renderMain();
      Ui().showToast("📅 Días de entrenamiento actualizados");
    });
  });
  /* Editar sesión del historial */
  document.querySelectorAll("[data-edit-hist]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const hi = parseInt(btn.dataset.editHist);
      const history = P().getHistory();
      const sorted = [...history].sort((a,b)=>new Date(b.date)-new Date(a.date));
      const h = sorted[hi];
      if(!h) return;
      EditH().openEditHistSession(h);
    });
  });
  /* Calendario historial: navegación de mes y selección de día */
  EditH().attachHistCalendarEvents();
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
      if(Number.isFinite(v)) C().trainingConfig[k] = v;
      else if(input.type === "checkbox") C().trainingConfig[k] = v;
      C().saveTrainingConfig();
      Ui().showToast("⚙️ Ajuste de entrenamiento guardado");
    });
  });
  document.querySelectorAll("[data-train-select]").forEach(sel=>{
    sel.addEventListener("change", ()=>{
      C().trainingConfig[sel.dataset.trainSelect] = sel.value;
      C().saveTrainingConfig();
      Ui().showToast("⚙️ Progresión actualizada");
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
        return [scope.querySelectorAll(".up-row"), "Session().session-up"];
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
        const routine = P().getRoutine();
        const dayEx = routine.filter(e=>e.dia===EditR().routineEditDay).sort((a,b)=>(a.orden||0)-(b.orden||0));
        const moved = dayEx[fromIdx], target = dayEx[toIdx];
        if(!moved || !target) return;
        const keyMoved = moved.dia+"|"+moved.nombre_es;
        const keyTarget = target.dia+"|"+target.nombre_es;
        const ia = routine.findIndex(e=>e.dia+"|"+e.nombre_es===keyMoved);
        const ib = routine.findIndex(e=>e.dia+"|"+e.nombre_es===keyTarget);
        if(ia<0 || ib<0) return;
        EditR().applyRoutineChange(r=>{
          const arr = r.slice();
          const [hit] = arr.splice(ia,1);
          const ib2 = arr.findIndex(e=>e.dia+"|"+e.nombre_es===keyTarget);
          const insertAt = fromIdx < toIdx ? ib2+1 : ib2;
          arr.splice(insertAt,0,hit);
          return arr;
        });
        Router().renderMain();
      } else if(ctx === "Session().session-up" && Session().session){
        const arr = Session().session.exercises.slice();
        const absFrom = Session().session.currentIdx+1+fromIdx;
        const absTo = Session().session.currentIdx+1+toIdx;
        const [hit] = arr.splice(absFrom,1);
        arr.splice(absTo,0,hit);
        Session().session.exercises = arr;
        Session().session.exercises.forEach((ex,i)=>{ ex.orden = i+1; });
        Session().saveSessionState();
        Router().renderMain();
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
/* Interceptar el OK del numpad según contexto (sesión vs rutina) */
document.getElementById("numOk").addEventListener("click", ()=>{
  if(VR().numPadRoutineCtx){ VR().confirmRoutineNumPad(); }
  else VS().confirmNumPad();
});
document.getElementById("numCancel").addEventListener("click", VS().closeNumPad);
document.getElementById("numInput").addEventListener("keydown", e=>{
  if(e.key==="Enter") VS().confirmNumPad();
  if(e.key==="Escape") VS().closeNumPad();
});
document.getElementById("numSlider").addEventListener("input", e=>{
  document.getElementById("numInput").value = e.target.value;
});
document.getElementById("numSlider").addEventListener("change", e=>{
  document.getElementById("numInput").value = e.target.value;
  if(VR().numPadRoutineCtx){ VR().confirmRoutineNumPad(); }
  else VS().confirmNumPad();
});

/* Variantes overlay */
document.getElementById("varList").addEventListener("click", e=>{
  const item = e.target.closest("[data-variant-idx]");
  if(item) VS().selectVariant(parseInt(item.dataset.variantIdx));
});
document.getElementById("varClose").addEventListener("click", ()=>{
  Ui().setFocusTrap("varOverlay", null);
  document.getElementById("varOverlay").classList.remove("show");
});

/* Zoom de imagen: cerrar al tocar fuera o con el botón */
document.getElementById("zoomClose").addEventListener("click", (e)=>{
  e.stopPropagation();
  Ui().setFocusTrap("imgZoomOverlay", null);
  document.getElementById("imgZoomOverlay").classList.remove("show");
});
document.getElementById("imgZoomOverlay").addEventListener("click", (e)=>{
  if(e.target === document.getElementById("imgZoomOverlay")){
    Ui().setFocusTrap("imgZoomOverlay", null);
    document.getElementById("imgZoomOverlay").classList.remove("show");
  }
});

/* Auth overlay — listeners estáticos (funciones → src/modules/auth.js, issue #11) */
document.querySelectorAll("[data-auth-tab]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    Auth().authMode = btn.dataset.authTab;
    document.getElementById("authError").textContent = "";
    Auth().updateAuthTabs();
    /* Lazy Supabase: precargar el SDK al entrar en la pestaña de auth */
    if(!S().sbClient && !Auth().authBlocked){
      S().ensureSupabaseClient().then(()=>{
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
    Auth().handleAuthSubmit();
  });
}
/* B3: continuar sin conexión esconde el overlay y deja usar la app en local */
document.getElementById("authSkip").addEventListener("click", ()=>{
  S().authUser = null;
  Auth().showAuthOverlay(false);
  Router().renderMain();
});
/* ================================================================
   SELECTOR DE EJERCICIO (static handlers)
   ================================================================ */
const pickerSearchEl = document.getElementById("pickerSearch");
if(pickerSearchEl){
  pickerSearchEl.addEventListener("input", (e)=>{ EditR().renderPickerList(e.target.value); });
}
document.getElementById("pickerList").addEventListener("click", (e)=>{
  const item = e.target.closest("[data-pick-name]");
  if(item) EditR().selectExerciseFromPicker(item);
});
document.getElementById("pickerClose").addEventListener("click", EditR().closeExercisePicker);

(function attachStaticHandlers(){
  document.querySelectorAll(".tabbtn").forEach(btn=>{
    btn.addEventListener("click", ()=>Router().setTab(btn.dataset.tab));
  });
  /* Botones de descanso: se enlazan UNA sola vez (evita listeners duplicados del bug ±15s).
     Con el timer por timestamps: al reanudar tras pausa se recalcula endTime; al sumar/restar
     15s se desplaza endTime para mantener sincronía con el reloj real. */
  document.querySelectorAll("[data-rest]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(btn.dataset.rest==="skip"){ RT().stopRest(); }
      else if(btn.dataset.rest==="toggle"){ RT().toggleRestPause(); }
      else if(btn.dataset.rest==="minus15"){ RT().adjustRest(-15); }
      else if(btn.dataset.rest==="plus15"){ RT().adjustRest(15); }
      Session().saveSessionState();
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
          const routine = await X().parseRoutineSheet(new Uint8Array(ev.target.result));
          if(routine.length===0){ Ui().showToast("⚠️ Archivo sin ejercicios válidos"); return; }
          P().setRoutine(routine);
          Router().selectedDay = null;
          if(S().sbClient && S().authUser){
            const ok = await S().pushRoutineToServer();
            if(!ok){ const p=P().getPending(); p.routine=routine; P().setPending(p); }
          }
          Ui().showToast("✅ Rutina importada: " + routine.length + " ejercicios");
          Router().setTab("rutina");
        }catch(err){ Ui().showToast("❌ No se pudo leer el archivo"); }
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
          Ui().showToast("❌ Archivo de backup no válido");
          return;
        }
        if(!confirm("¿Sustituir la rutina y el historial actuales por los del backup?")) return;
        if(Array.isArray(data.routine)){ P().setRoutine(data.routine); Router().selectedDay = null; }
        if(Array.isArray(data.history)){
          await P().saveHistory(data.history);
          /* Poner el historial importado en cola de sincronización si hay sesión */
          const p = P().getPending();
          if(data.history.length) p.sessions = [...data.history];
          P().setPending(p);
        }
        Ui().showToast("✅ Backup restaurado");
        Router().setTab("rutina");
      }catch(err){ Ui().showToast("❌ No se pudo leer el backup"); }
      e.target.value = "";
    };
  }
})();

  EyeFit.Events = { attachEvents, attachEditHistOverlayEvents };
})(typeof window !== "undefined" ? window : globalThis);

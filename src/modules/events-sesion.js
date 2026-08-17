/* EyeFit — Eventos de la sesión de entrenamiento (refactor #19 → issue #23)
   - Steppers kg/reps, edición con numpad, marcar series completadas
   - Swipe para eliminar serie con confirmación visual
   - Añadir serie, reordenar ejercicios, variantes e instrucciones
   Exposición global: window.EyeFit.EventsSesion */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const Ui = () => EyeFit.Ui || {};
  const RT = () => EyeFit.RestTimer || {};
  const Router = () => EyeFit.Router || {};
  const Session = () => EyeFit.Session || {};
  const VS = () => EyeFit.ViewsSesion || {};

  function attachSesionEvents(){
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
    document.querySelectorAll(".set-row[data-swipe-set]").forEach(attachSwipeRow);
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
  }


  /* Swipe para eliminar series — estado compartido entre attachSesionEvents()
     y los botones del overlay de confirmación (se enlazan UNA sola vez al cargar,
     ya que el overlay vive en index.html y no se re-renderiza). */
  let swipeDeleteSet = null;
  function askDeleteSet(si){
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
        askDeleteSet(si);
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
        askDeleteSet(si);
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

  EyeFit.EventsSesion = { attachSesionEvents };
})(typeof window !== "undefined" ? window : globalThis);

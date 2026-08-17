/* EyeFit — Eventos de la vista Rutina (refactor #19 → issue #23)
   - Modo edición: editar series/reps/kg, añadir/mover/eliminar ejercicios
   - Selección de día + carrusel horizontal
   - Inicio de sesión desde la rutina + zoom de GIF + aviso 1RM
   Exposición global: window.EyeFit.EventsRutina */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const P = () => EyeFit.Persistence || {};
  const S = () => EyeFit.Supabase || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};
  const Session = () => EyeFit.Session || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};
  const VR = () => EyeFit.ViewsRutina || {};
  const INSTRUCCIONES = global.INSTRUCCIONES || {};

  function attachRutinaEvents(){
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
    document.querySelectorAll("[data-start-session]").forEach(btn=>{
      btn.addEventListener("click", ()=>{ Session().startSession(btn.dataset.startSession); });
    });
    /* Ampliar GIF (overlay) — todas las miniaturas ampliables (rutina y sesión) */
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
  }

  EyeFit.EventsRutina = { attachRutinaEvents };
})(typeof window !== "undefined" ? window : globalThis);

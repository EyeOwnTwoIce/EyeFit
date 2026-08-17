/* EyeFit — Módulo de eventos de UI (refactor #19 → issue #23)
   - attachEvents: enlaza los sub-módulos por dominio en cada render:
     rutina (events-rutina), sesión (events-sesion), historial (events-historial),
     ajustes (events-ajustes) y drag & drop (events-drag), más los casos genéricos
     (preselección de inputs numéricos, fallback de imágenes)
   - attachEditHistOverlayEvents: overlay de edición de historial (una sola vez)
   - Listeners estáticos: numpad, variantes, zoom, auth, picker, descanso, tabs
   Exposición global: window.EyeFit.Events */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const Ui = () => EyeFit.Ui || {};
  const RT = () => EyeFit.RestTimer || {};
  const Router = () => EyeFit.Router || {};
  const Session = () => EyeFit.Session || {};
  const Auth = () => EyeFit.Auth || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};
  const VR = () => EyeFit.ViewsRutina || {};
  const VS = () => EyeFit.ViewsSesion || {};
  const EditH = () => EyeFit.ViewsHistorial || {};
  const S = () => EyeFit.Supabase || {};

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
    /* Delegación por dominio (cada sub-módulo enlaza solo sus elementos presentes) */
    if(EyeFit.EventsRutina && EyeFit.EventsRutina.attachRutinaEvents) EyeFit.EventsRutina.attachRutinaEvents();
    if(EyeFit.EventsSesion && EyeFit.EventsSesion.attachSesionEvents) EyeFit.EventsSesion.attachSesionEvents();
    if(EyeFit.EventsHistorial && EyeFit.EventsHistorial.attachHistorialEvents) EyeFit.EventsHistorial.attachHistorialEvents();
    if(EyeFit.EventsAjustes && EyeFit.EventsAjustes.attachAjustesEvents) EyeFit.EventsAjustes.attachAjustesEvents();
    if(EyeFit.EventsDrag && EyeFit.EventsDrag.attachDragDrop) EyeFit.EventsDrag.attachDragDrop();
    /* Autoseleccionar el número original al enfocar cualquier input numérico (UX3) */
    document.querySelectorAll("input[type='number'],input[type='time'],input[inputmode]").forEach(input=>{
      input.addEventListener("focus", ()=>{ setTimeout(()=>{ input.select(); }, 0); });
    });
    /* Fallback de imágenes delegado: cualquier <img data-img-fallback> que falle
       se oculta o se sustituye por un emoji sin inline onerror. */
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

  /* SELECTOR DE EJERCICIO (static handlers) */
  const pickerSearchEl = document.getElementById("pickerSearch");
  if(pickerSearchEl){
    pickerSearchEl.addEventListener("input", (e)=>{ EditR().renderPickerList(e.target.value); });
  }
  document.getElementById("pickerList").addEventListener("click", (e)=>{
    const item = e.target.closest("[data-pick-name]");
    if(item) EditR().selectExerciseFromPicker(item);
  });
  document.getElementById("pickerClose").addEventListener("click", EditR().closeExercisePicker);

  /* Pestañas y descanso: se enlazan UNA sola vez (evita listeners duplicados del bug ±15s).
     Con el timer por timestamps: al reanudar tras pausa se recalcula endTime; al sumar/restar
     15s se desplaza endTime para mantener sincronía con el reloj real. */
  document.querySelectorAll(".tabbtn").forEach(btn=>{
    btn.addEventListener("click", ()=>Router().setTab(btn.dataset.tab));
  });
  document.querySelectorAll("[data-rest]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(btn.dataset.rest==="skip"){ RT().stopRest(); }
      else if(btn.dataset.rest==="toggle"){ RT().toggleRestPause(); }
      else if(btn.dataset.rest==="minus15"){ RT().adjustRest(-15); }
      else if(btn.dataset.rest==="plus15"){ RT().adjustRest(15); }
      Session().saveSessionState();
    });
  });

  EyeFit.Events = { attachEvents, attachEditHistOverlayEvents };
})(typeof window !== "undefined" ? window : globalThis);


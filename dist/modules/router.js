/* EyeFit — Módulo router de navegación (refactor #13 → issue #17)
   - currentTab / selectedDay / routineEditMode / lastRenderedHtml
   - setTab / updateStopBtn / renderMain
   Exposición global: window.EyeFit.Router */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const S = () => EyeFit.Supabase || {};
  const Session = EyeFit.Session || {};
  const Ui = () => EyeFit.Ui || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};
  const VR = () => EyeFit.ViewsRutina || {};
  const VS = () => EyeFit.ViewsSesion || {};
  const VH = () => EyeFit.ViewsHistorial || {};
  const VA = () => EyeFit.ViewsAjustes || {};
  const Events = () => EyeFit.Events || {};

  let currentTab = "rutina";
  let selectedDay = null;
  let routineEditMode = false;
  let lastRenderedHtml = "";

  function setTab(tab){
    currentTab = tab;
    document.querySelectorAll(".tabbtn").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
    updateStopBtn();
    /* Al entrar en el tab "historial" con cuenta + online, refrescar desde
       el servidor para asegurar que se muestran TODAS las sesiones guardadas
       (no solo las locales). El refresh es async: renderMain() muestra lo
       que hay ahora y se re-renderiza cuando lleguen los datos. */
    if(tab === "historial" && S().authUser && S().sbClient && navigator.onLine){
      S().pullServerData().then(()=>{
        if(currentTab === "historial") renderMain();
      });
    }
    renderMain();
  }
  function updateStopBtn(){
    const btn = document.getElementById("stopSessionBtn");
    if(btn) btn.style.display = (currentTab==="sesion" && Session.session) ? "block" : "none";
  }

  function renderMain(){
    const main = document.getElementById("main");
    Session.updateSessionHeader();
    if(routineEditMode && currentTab === "rutina"){
      const html = EditR().renderEditRoutine();
      if(lastRenderedHtml !== html){
        Ui().setHtml(main, html);
        lastRenderedHtml = html;
        const ev = Events();
        if(ev && ev.attachEvents) ev.attachEvents();
      }
      return;
    }
    const views = { rutina:VR().renderRutina, sesion:VS().renderSesion, historial:VH().renderHistorial, ajustes:VA().renderAjustes };
    const html = views[currentTab] ? views[currentTab]() : VR().renderRutina();
    if(lastRenderedHtml !== html){
      Ui().setHtml(main, html);
      lastRenderedHtml = html;
      const ev = Events();
      if(ev && ev.attachEvents) ev.attachEvents();
    }
  }

  EyeFit.Router = {
    get currentTab(){ return currentTab; },
    set currentTab(v){ currentTab = v; },
    get selectedDay(){ return selectedDay; },
    set selectedDay(v){ selectedDay = v; },
    get routineEditMode(){ return routineEditMode; },
    set routineEditMode(v){ routineEditMode = v; },
    get lastRenderedHtml(){ return lastRenderedHtml; },
    set lastRenderedHtml(v){ lastRenderedHtml = v; },
    setTab, updateStopBtn, renderMain
  };
})(typeof window !== "undefined" ? window : globalThis);

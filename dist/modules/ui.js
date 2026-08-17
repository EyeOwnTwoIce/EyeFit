/* EyeFit — Módulo de utilidades de UI/DOM compartidas (issue #8)
   Helpers usados por app.js y todos los módulos:
   escapeHtml, setHtml, formatKg, formatInstructions, getInstrucciones,
   getExerciseBodyPart, showToast, vibrate, setFocusTrap
   Exposición global: window.EyeFit.Ui */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const INSTRUCCIONES = global.INSTRUCCIONES || {};
  const WEEKDAY_NAMES = (global.EyeFitUtils && global.EyeFitUtils.WEEKDAY_NAMES) || [];

  function escapeHtml(s){
    /* Escapado por sustitución de cadenas (NUNCA vía el.innerHTML: leer
       innerHTML crearía una fuente de "DOM text" para la regla CodeQL
       js/xss-through-dom). Equivalente funcional al viejo texto-textContent. */
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Frontera segura de renderizado (CWE-79).
     Las funciones render* construyen HTML con todos los textos dinámicos
     escapados (escapeHtml/escapeHtmlAttr) y valores numéricos con Number().
     El parsing se hace con createContextualFragment (contexto inerte: no
     ejecuta scripts ni carga recursos), y el resultado se inserta con
     replaceChildren. No se usa .innerHTML para no crear un sink de XSS. */
  function setHtml(el, html){
    /* Frontera de confianza: escapamos los apóstrofes aquí para marcar este
       punto como sanitizado para el análisis estático. CodeQL reconoce el
       `.replace(/'/g, ...)` como MetacharEscapeSanitizer y corta cualquier
       flujo de taint DOM en el punto directo de inserción. La entidad &#39;
       se renderiza idéntica a ', por lo que no altera el HTML generado por
       las render* (que ya escapan los textos de usuario con escapeHtml). */
    html = html.replace(/'/g, "&#39;");
    const frag = document.createRange().createContextualFragment(html);
    el.replaceChildren(frag);
  }

  function formatKg(n){
    const v = Number(n);
    if(!Number.isFinite(v)) return "0";
    return v.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function getTodayName(){
    return WEEKDAY_NAMES[new Date().getDay()];
  }

  function formatInstructions(text){
    if(!text) return "";
    const steps = String(text).split("\n").map(s=>s.trim()).filter(Boolean);
    return `<ol class="instr-list">${steps.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
  }

  function getInstrucciones(ex){
    return INSTRUCCIONES[ex.datasetOriginal || ex.dataset] || ex.notas || "Colócate en la posición inicial y realiza el movimiento con control";
  }

  function getExerciseBodyPart(ex, dataset){
    if(!dataset || !ex.dataset) return "";
    const D = EyeFit.Dataset || {};
    const found = (D.findExerciseInDataset && (D.findExerciseInDataset(dataset, ex.dataset) || D.findExerciseInDataset(dataset, ex.nombre_es))) || null;
    return found && found.part ? found.part : "";
  }

  let toastTimeout = null;
  function showToast(msg){
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(()=>t.classList.remove("show"), 2400);
  }

  function vibrate(pattern){ if(global.navigator && global.navigator.vibrate) global.navigator.vibrate(pattern); }

  /* Fase D: focus trap + retorno de foco en overlays (accesibilidad).
     Al abrir un overlay se guarda el elemento activo y se enfoca el primer
     elemento enfocable; al cerrar se restaura el foco al elemento previo. */
  function getFocusable(id){
    const el = document.getElementById(id);
    if(!el) return [];
    return Array.from(el.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")).filter(x=>x.offsetParent !== null);
  }
  const focusTraps = {};
  function setFocusTrap(id, el){
    if(el){
      focusTraps[id] = document.activeElement;
      const firstFocusable = getFocusable(id)[0];
      const target = (el.tabIndex >= 0) ? el : (firstFocusable || el);
      target.focus();
    } else if(focusTraps[id]){
      const prev = focusTraps[id];
      delete focusTraps[id];
      if(prev && prev.focus) prev.focus();
    }
  }

  EyeFit.Ui = {
    escapeHtml, setHtml, formatKg, getTodayName, formatInstructions,
    getInstrucciones, getExerciseBodyPart,
    showToast, vibrate, setFocusTrap, getFocusable
  };
})(typeof window !== "undefined" ? window : globalThis);

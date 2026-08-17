"use strict";
/* ════════════════════════════════════════════════════════════════
   EyeFit v2.1.0 — bootstrap: valida las utilidades compartidas y
   arranca la app. Toda la lógica vive en src/modules/.
   ════════════════════════════════════════════════════════════════ */

/* F1-C1: las funciones puras viven en utils.js y se exponen en
   window.EyeFitUtils. Si el archivo no cargó, abortamos con un
   mensaje claro en lugar de fallar en silencio. */
const U = window.EyeFitUtils || null;
if(!U){
  document.getElementById("main").innerHTML =
    '<div class="section active"><div class="empty-state">⚠️ Error crítico: utils.js no cargó.<br>Recarga la página o borra la caché.</div></div>';
  throw new Error("EyeFitUtils missing");
}

/* Manejo global de errores (F2-A1): evita pantallas en blanco
   silenciosas — cualquier error se registra y se muestra como toast. */
const showToast = (window.EyeFit.Ui || {}).showToast || ((m)=>{ console.error("[EyeFit]", m); });
window.addEventListener("error", (e)=>{
  console.error("[EyeFit]", e.message || e.error);
  showToast("⚠️ Error inesperado: " + (e.message || "desconocido"));
});
window.addEventListener("unhandledrejection", (e)=>{
  const err = e && e.reason ? (e.reason.message || e.reason) : "desconocido";
  console.error("[EyeFit] unhandledrejection", err);
  showToast("⚠️ Error inesperado: " + err);
});

/* Arranque de la app (config, migraciones, auth lazy, dataset, sesión,
   sync automático, Service Worker y onboarding) → src/modules/bootstrap.js */
window.EyeFit.Bootstrap.init();

/* EyeFit — Eventos del Historial (refactor #19 → issue #23)
   Los handlers de calendario, edición y borrado viven en views-historial.js
   (attachHistCalendarEvents); este módulo se encarga de re-enlazarlos en cada
   render y mantiene el dominio de eventos del historial agrupado.
   Exposición global: window.EyeFit.EventsHistorial */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const EditH = () => EyeFit.ViewsHistorial || {};

  function attachHistorialEvents(){
    /* Calendario historial: navegación de mes, selección de día, borrado y
       edición de sesión (re-enlace en cada render → views-historial.js) */
    EditH().attachHistCalendarEvents();
  }

  EyeFit.EventsHistorial = { attachHistorialEvents };
})(typeof window !== "undefined" ? window : globalThis);

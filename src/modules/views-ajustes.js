/* EyeFit — Módulo vista de ajustes (refactor #18 → issue #22)
   - renderAjustes: cuenta, entrenamiento, días, notificaciones, rutina,
     datos, danger zone y acerca de
   Exposición global: window.EyeFit.ViewsAjustes */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const getApodo = U.getApodo;
  const escapeHtml = (EyeFit.Ui || {}).escapeHtml;
  const DAY_COLORS = global.DAY_COLORS || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const S = () => EyeFit.Supabase || {};
  const D = () => EyeFit.Dataset || {};
  const Ui = () => EyeFit.Ui || {};
  const Push = () => EyeFit.Push || {};

function renderAjustes(){
  const routineSrc = P().lsGet(P().K.routine, null) ? "Archivo importado" : "Rutina integrada";
  const routine = P().getRoutine();
  const pending = P().getPending();
  const pendingCount = pending.sessions.length;
  const syncMsg = Number(pendingCount)>0
    ? `${escapeHtml(pendingCount)} sesión${Number(pendingCount)>1?"es":""} pendiente${Number(pendingCount)>1?"s":""} de subir`
    : S().authUser ? "Todo sincronizado" : "Sin conexión a la nube";
  const syncClass = pendingCount>0 ? "pending" : (S().authUser ? "" : "off");
  const tc = C().trainingConfig;

  return `<div class="section active">
    <h2 class="title">Ajustes</h2>
    <div class="set-group">
      <div class="set-group-title">Cuenta</div>
      <div class="set-row-item">
        <div>
          <div class="label">${S().authUser ? escapeHtml(S().authUser.email) : "Sin sesión"}</div>
          <div class="desc"><span class="sync-status ${syncClass}"><span class="dot"></span> ${syncMsg}</span></div>
        </div>
        ${S().authUser
          ? `<button class="btn btn-outline" data-logout>🚪 Salir</button>${pendingCount>0?`<button class="btn" data-sync-now>🔄 Subir</button>`:""}`
          : `<button class="btn" data-open-auth>🔑 Acceder</button>`}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">🏋️ Entrenamiento</div>
      <div class="set-row-item">
        <div><div class="label">Peso corporal</div><div class="desc">Para métricas relativas a tu masa</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.peso_corporal)}" data-train-input="peso_corporal" data-float="1" step="0.5" min="30">
      </div>
      <div class="set-row-item">
        <div><div class="label">Tipo de progresión</div><div class="desc">Doble progresión (recomendada) o lineal</div></div>
        <select class="set-select" data-train-select="tipo_progresion">
          <option value="doble" ${tc.tipo_progresion==="doble"?"selected":""}>Doble progresión</option>
          <option value="lineal" ${tc.tipo_progresion==="lineal"?"selected":""}>Lineal</option>
        </select>
      </div>
      <div class="prog-info">
        <details>
          <summary>ℹ️ ¿Qué tipo de progresión elegir?</summary>
          <div class="prog-body">
            <b style="color:var(--accent)">Doble progresión</b>: dentro de un rango de reps (p. ej. 6-10), primero subes repeticiones. Cuando llegas al tope del rango, subes el peso y vuelves a empezar desde el mínimo. Es el estándar de hipertrofia.
            <br><br>
            <b style="color:var(--accent)">Lineal</b>: subes peso cada sesión en cuanto alcanzas el tope del rango, sin variar reps. Más simple, pero el progreso se estanca antes.
          </div>
        </details>
      </div>
      <div class="set-row-item" style="flex-wrap:wrap;">
        <div style="width:100%;"><div class="label">Días de entrenamiento</div><div class="desc">L M X J V S D</div></div>
        <div class="train-days" style="width:100%;">
          ${[["L","Lunes"],["M","Martes"],["X","Miércoles"],["J","Jueves"],["V","Viernes"],["S","Sábado"],["D","Domingo"]].map(([lbl,full])=>`
            <button class="train-day-chip ${C().trainingDays.includes(full)?"on":""}" data-train-day="${full}" aria-label="${full}">${lbl}</button>
          `).join("")}
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rango reps compuestos</div><div class="desc">Sentadilla, press banca, remo…</div></div>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_compuesto_min)}" data-train-input="rango_compuesto_min" min="1" max="20">
          <span style="color:var(--muted);font-size:10px;">–</span>
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_compuesto_max)}" data-train-input="rango_compuesto_max" min="1" max="30">
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rango reps aislamiento</div><div class="desc">Curls, elevaciones, extensiones…</div></div>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_aislamiento_min)}" data-train-input="rango_aislamiento_min" min="1" max="20">
          <span style="color:var(--muted);font-size:10px;">–</span>
          <input type="number" class="set-input" style="width:56px;" value="${escapeHtml(tc.rango_aislamiento_max)}" data-train-input="rango_aislamiento_max" min="1" max="30">
        </div>
      </div>
      <div class="set-row-item">
        <div><div class="label">RIR objetivo</div><div class="desc">Reps en reserva al terminar cada serie (2 = casi al fallo)</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.rir_objetivo)}" data-train-input="rir_objetivo" min="0" max="5">
      </div>
      <div class="set-row-item">
        <div><div class="label">Incremento barra</div><div class="desc">Kilos a subir en ejercicios con barra</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.incremento_barra)}" data-train-input="incremento_barra" data-float="1" step="0.5" min="0.5">
      </div>
      <div class="set-row-item">
        <div><div class="label">Incremento mancuerna</div><div class="desc">Kilos a subir en ejercicios con mancuernas</div></div>
        <input type="number" class="set-input" value="${escapeHtml(tc.incremento_mancuerna)}" data-train-input="incremento_mancuerna" data-float="1" step="0.5" min="0.5">
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Rutina</div>
      <div class="set-row-item">
        <div>
          <div class="label">Rutina actual: <b class="accent">${escapeHtml(routineSrc)}</b></div>
          <div class="desc">${escapeHtml(routine.length)} ejercicios · Lunes-Viernes</div>
        </div>
      </div>
      <div class="prog-info">
        <details>
          <summary>💪 Músculo y equipamiento de los ejercicios</summary>
          <div class="prog-body">
            ${routine.length ? routine
              .slice(0, 40)
              .map(e=>{
                const meta = D().getExerciseMeta(e.dataset || e.nombre_es);
                if(!meta) return "";
                const muscle = meta.muscle || e.nombre_es;
                const equip = meta.equip || "";
                const secondary = (Array.isArray(meta.secondary) && meta.secondary.length)
                  ? " · Sec.: " + meta.secondary.join(", ")
                  : "";
                return `<div class="meta-ex-row">
                  <b>${escapeHtml(getApodo(e))}</b>
                  <span class="meta-ex-tags">${escapeHtml(muscle)}${equip ? " · " + escapeHtml(equip) : ""}${escapeHtml(secondary)}</span>
                </div>`;
              }).join("")
              : "<div class=\"empty-state\">Sin ejercicios</div>"}
          </div>
        </details>
      </div>
      <div class="set-row-item">
        <div><div class="label">Rutina (.xlsx)</div><div class="desc">Importa o descarga tu hoja de cálculo</div></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn" data-import-xlsx>📥 Importar</button>
          <button class="btn btn-outline" data-export-xlsx>📤 Exportar</button>
        </div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Ayuda</div>
      <div class="set-row-item">
        <div><div class="label">Ver guía de inicio</div><div class="desc">Repasa cómo usar EyeFit</div></div>
        <button class="btn btn-outline" data-open-help>❓</button>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">🔔 Notificaciones</div>
      <div class="set-row-item">
        <div>
          <div class="label">Actualizaciones de la app</div>
          <div class="desc">${Push().isPushEnabled() ? "Activas: te avisamos cuando hay una versión nueva" : "No activas. Recibirás avisos de nuevas versiones."}</div>
        </div>
        ${Push().isPushEnabled()
          ? `<button class="btn btn-outline" data-disable-push>🔕 Desactivar</button>`
          : `<button class="btn" data-enable-push>🔔 Activar</button>`}
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Datos</div>
      <div class="set-row-item">
        <div><div class="label">Exportar backup (.json)</div><div class="desc">Rutina + historial</div></div>
        <button class="btn btn-outline" data-export-backup>📤 Exportar</button>
        &nbsp;
        <button class="btn" data-import-backup>📥 Importar</button>
      </div>
    </div>
    <div class="set-group danger-zone">
      <div class="set-group-title danger-zone-title">⚠️ Danger Zone</div>
      <div class="set-row-item">
        <div><div class="label">Datos</div><div class="desc">Borrar historial o restablecer la rutina</div></div>
        <div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-danger" data-clear-history>🗑️ Borrar historial</button>
          <button class="btn btn-outline" data-reset-routine>↺ Restablecer</button>
        </div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-group-title">Acerca de</div>
      <div class="about-block">
        <details class="about-details">
          <summary>📘 Sobre EyeFit</summary>
          <div class="about-sub">
            <details>
              <summary>Descripción</summary>
              <div class="about-body">
                Web app de entrenamiento privada (PWA) con progresión automática basada en doble progresión + RIR (Reps In Reserve), el estándar avalado por la literatura científica de hipertrofia.
              </div>
            </details>
            <details>
              <summary>Versión</summary>
              <div class="about-body">v2.1.0 · PWA sincronizada en la nube</div>
            </details>
            <details>
              <summary>Referencias</summary>
              <div class="about-body">
                • Dataset de ejercicios: <a href="https://github.com/hasaneyldrm/exercises-dataset" target="_blank" rel="noopener">hasaneyldrm/exercises-dataset</a><br>
                • Fórmula 1RM de Epley<br>
                • Criterios de doble progresión para hipertrofia
              </div>
            </details>
          </div>
        </details>
      </div>
    </div>
  </div>`;
}

  EyeFit.ViewsAjustes = { renderAjustes };
})(typeof window !== "undefined" ? window : globalThis);

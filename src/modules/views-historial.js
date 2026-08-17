/* EyeFit — Módulo vista de historial (refactor #17 → issue #21)
   - Calendario mensual + detalle por día + resumen
   - Edición de sesión (openEditHistSession/dismissEditHist/saveEditHist)
   - Eliminación y sustitución de ejercicios en el historial
   Exposición global: window.EyeFit.ViewsHistorial */
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
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};
  const EditR = () => EyeFit.ViewsEditRutina || {};

  let histMonthCursor = null;
  let histActiveDate = U.localDateKey(new Date());
  let editingHistRecord = null;

function getHistMonthSessions(history, year, month){
  const map = {};
  for(const h of history){
    try{
      const d = new Date(h.date);
      if(d.getFullYear() === year && d.getMonth() === month){
        const key = U.localDateKey(d);
        if(!map[key]) map[key] = [];
        map[key].push(h);
      }
    }catch(e){}
  }
  return map;
}
function renderHistMonthNav(year, month){
  const prev = new Date(year, month-1, 1);
  const next = new Date(year, month+1, 1);
  const label = new Date(year, month, 1).toLocaleDateString("es-ES", {month:"long", year:"numeric"});
  return `<div class="hist-cal-nav">
    <button class="hist-cal-prev" data-hist-month-change="${prev.getFullYear()},${prev.getMonth()}" aria-label="Mes anterior">‹</button>
    <span class="hist-cal-label">${label.charAt(0).toUpperCase()+label.slice(1)}</span>
    <button class="hist-cal-next" data-hist-month-change="${next.getFullYear()},${next.getMonth()}" aria-label="Mes siguiente">›</button>
  </div>`;
}
function renderHistCalendar(history){
  const nc = histMonthCursor ? { y:histMonthCursor[0], m:histMonthCursor[1] }
    : (()=>{ const t=new Date(); return { y:t.getFullYear(), m:t.getMonth() }; })();
  const { y, m } = nc;
  const byDay = getHistMonthSessions(history, y, m);
  const firstDay = new Date(y, m, 1);
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; /* Lunes como primer día (convención ES) */
  const todayStr = U.localDateKey(new Date());
  const cells = [];
  const dayNames = ["L","M","X","J","V","S","D"];
  for(const dn of dayNames) cells.push(`<div class="hist-cal-dow">${dn}</div>`);
  for(let i=0; i<startOffset; i++) cells.push(`<div class="hist-cal-cell empty"></div>`);
  for(let d=1; d<=daysInMonth; d++){
    const ds = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const hasSess = byDay[ds] && byDay[ds].length > 0;
    const isToday = ds === todayStr;
    const isActive = histActiveDate === ds;
    cells.push(`<div class="hist-cal-cell ${hasSess?"has-sess":""} ${isToday?"today":""} ${isActive?"active":""}" data-hist-day="${ds}" role="button" tabindex="0" aria-label="${ds}${hasSess?` · ${byDay[ds].length} sesión${byDay[ds].length>1?"es":""}`:""}">
      <span class="hist-cal-num">${d}</span>
      ${hasSess?`<span class="hist-cal-dot"></span>`:""}
    </div>`);
  }
  return `<div class="hist-cal-wrap">
    ${renderHistMonthNav(y, m)}
    <div class="hist-cal-grid">${cells.join("")}</div>
  </div>`;
}
function renderHistDayDetail(history, dateStr){
  const sessions = history.filter(h=>{ try{ return U.localDateKey(new Date(h.date)) === dateStr; }catch(e){ return false; } });
  if(!sessions.length) return `<div class="empty-state">No hay sesión registrada en ${dateStr}.</div>`;

  /* Ordenar sesiones por hora de inicio (de más antiguas a más recientes) */
  const sorted = [...sessions].sort((a,b)=> new Date(a.date) - new Date(b.date));

  /* Renderizar UNA card por sesión del día (BUG FIX: antes solo mostraba sessions[0]) */
  const cards = sorted.map(h=>{
    const color = DAY_COLORS[h.day] || "#fff";
    const exDone = h.exercises.filter(e=>e.sets.some(s=>s.done)==true);
    const exHtml = exDone.slice(0,10).map(e=>{
      const key = String(e.datasetOriginal||e.dataset||e.nombre_es||"").trim().toLowerCase();
      const prog = C().getExerciseProgression(key);
      const bestNow = C().getHistoricalBest(key);
      const spark = C().svgSparkline(prog);
      const rmLabel = bestNow && bestNow.rm ? `${escapeHtml(Ui().formatKg(Math.round(bestNow.rm)))}` : "";
      const rmHint = bestNow && bestNow.rm ? ` title="1RM = ${escapeHtml(Ui().formatKg(bestNow.kg))} × (1 + ${escapeHtml(bestNow.reps)}/30) = ${escapeHtml(Ui().formatKg(Math.round(bestNow.rm)))} kg (Epley)" data-has-rm="1"` : "";
      return `<div class="hist-ex-line">
        <div class="hist-ex">
          <span class="hist-ex-name">${escapeHtml(getApodo(e))}</span>
          <span class="hist-ex-set">${e.sets.filter(s=>s.done).map(s=>`${escapeHtml(s.reps)}×${escapeHtml(Ui().formatKg(s.kg))}`).join(" · ")}</span>
        </div>
        ${spark ? `<div class="hist-ex-prog"><span class="lbl rm-tappable" ${rmHint}>1RM ${rmLabel}</span>${spark}</div>` : ""}
      </div>`;
    }).join("");
    const mins = Math.floor((h.duration||0)/60), secs=(h.duration||0)%60;
    const timeLabel = new Date(h.date).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
    return `<div class="hist-day open" data-hist-date="${U.escapeHtmlAttr(dateStr)}">
      <div class="hist-content">
        <div class="hist-day-top">
          <div class="hist-tri open"></div>
          <span class="hist-day-name" style="color:${escapeHtml(color)}">${escapeHtml(h.day)}</span>
          <span class="hist-day-date">${escapeHtml(timeLabel)} · ${escapeHtml(mins)}m ${escapeHtml(secs)}s</span>
          <button class="hist-edit-btn" data-edit-hist-date="${U.escapeHtmlAttr(dateStr)}" data-edit-hist-sessid="${U.escapeHtmlAttr(h.session_id||"")}" aria-label="Editar sesión">✏️</button>
          <button class="hist-del-btn" data-del-session="${U.escapeHtmlAttr(dateStr)}" data-del-sessid="${U.escapeHtmlAttr(h.session_id||"")}" aria-label="Eliminar sesión">🗑️</button>
        </div>
        <div class="hist-day-body open">
          <div class="hist-day-stats">${escapeHtml(exDone.length)} ejercicios · ${escapeHtml(h.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0))} series</div>
          ${exHtml}
        </div>
      </div>
    </div>`;
  }).join("");

  return `<div class="hist-days-mult">
    ${cards}
  </div>`;
}
function renderHistorial(){
  const history = P().getHistory();
  if(!history || history.length===0){
    return `<div class="section active">
      <h2 class="title">📈 Historial</h2>
      <div class="empty-state">Aún no hay sesiones.<br>Termina tu primer entrenamiento.</div>
    </div>`;
  }
  const totalSessions = history.length;
  const totalTime = history.reduce((a,h)=>a+(h.duration||0),0);
  const totalSets = history.reduce((a,h)=>a+h.exercises.reduce((b,e)=>b+e.sets.filter(s=>s.done).length,0),0);
  const streak = C().getStreak();
  const streakHtml = streak > 0 ? `<div class="streak-banner">🔥 Racha: ${escapeHtml(streak)} día${Number(streak)>1?"s":""}</div>` : "";
  const cal = renderHistCalendar(history);
  const detail = histActiveDate ? renderHistDayDetail(history, histActiveDate) : "";
  return `<div class="section active">
    <h2 class="title">📈 Historial</h2>
    ${streakHtml}
    <div class="hist-summary">
      <div class="hist-stat"><div class="v">${escapeHtml(totalSessions)}</div><div class="l">Sesiones</div></div>
      <div class="hist-stat"><div class="v">${escapeHtml(Math.floor(totalTime/60))}m</div><div class="l">Tiempo total</div></div>
      <div class="hist-stat"><div class="v">${escapeHtml(totalSets)}</div><div class="l">Series</div></div>
    </div>
    ${cal}
    ${detail}
  </div>`;
}
function openEditHistSession(h){
  if(!h) return;
  const dateEl = document.getElementById("editHistDate");
  if(dateEl) dateEl.textContent = `${h.day} · ${new Date(h.date).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}`;
  /* Hora de inicio y duración */
  const startEl = document.getElementById("editHistStart");
  if(startEl){
    const d = new Date(h.date);
    if(!isNaN(d.getTime())){
      startEl.value = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    }
  }
  const durEl = document.getElementById("editHistDur");
  if(durEl){
    durEl.value = Math.round((h.duration||0)/60) || "";
  }
  const listEl = document.getElementById("editHistList");
  if(listEl){
    listEl.innerHTML = (h.exercises||[]).map((ex,ei)=>{
      const sets = (ex.sets||[]);
      const rows = sets.length ? sets.map((s,si)=>`
        <div class="edit-hist-set">
          <span class="ehs-num">${si+1}</span>
          <input type="number" class="ehs-input" data-eh-kg="${ei}|${si}" value="${escapeHtml(s.kg)}" step="0.5" min="0" inputmode="decimal" aria-label="Peso">
          <span class="ehs-label">kg</span>
          <input type="number" class="ehs-input" data-eh-reps="${ei}|${si}" value="${escapeHtml(s.reps)}" step="1" min="1" inputmode="numeric" aria-label="Reps">
          <span class="ehs-label">reps</span>
          <button class="ehs-del-set" data-eh-del="${ei}|${si}" aria-label="Eliminar serie ${si+1}">🗑</button>
        </div>`).join("")
        : `<div style="color:var(--muted);font-size:11px;">Sin series</div>`;
      return `<div class="edit-hist-ex">
        <div class="eh-name-row">
          <span class="eh-name">${escapeHtml(getApodo(ex))}</span>
          <span style="display:flex;gap:4px;">
            <button class="ehs-swap-ex" data-eh-swap="${ei}" aria-label="Sustituir ejercicio ${U.escapeHtmlAttr(getApodo(ex))}">↔️</button>
            <button class="ehs-del-ex" data-eh-del-ex="${ei}" aria-label="Eliminar ejercicio">✕</button>
          </span>
        </div>
        ${rows}
        <button class="ehs-add-set" data-eh-add-set="${ei}">＋ Añadir serie</button>
      </div>`;
    }).join("");
  }
  const ov = document.getElementById("editHistOverlay");
  if(ov) ov.classList.add("show");
  Ui().setFocusTrap("editHistOverlay", ov);
  editingHistRecord = h;
}
function dismissEditHist(){
  const ov = document.getElementById("editHistOverlay");
  if(ov) ov.classList.remove("show");
  Ui().setFocusTrap("editHistOverlay", null);
  editingHistRecord = null;
}
async function saveEditHist(){
  if(!editingHistRecord) return;

  /* Hora de inicio */
  const startEl = document.getElementById("editHistStart");
  if(startEl && startEl.value){
    const [hh, mm] = startEl.value.split(":").map(Number);
    if(!isNaN(hh) && !isNaN(mm)){
      const d = new Date(editingHistRecord.date);
      if(!isNaN(d.getTime())){
        d.setHours(hh, mm);
        editingHistRecord.date = d.toISOString();
      }
    }
  }
  /* Duración (minutos → segundos) */
  const durEl = document.getElementById("editHistDur");
  if(durEl){
    const mins = parseFloat(durEl.value);
    if(!isNaN(mins) && mins >= 0) editingHistRecord.duration = Math.round(mins * 60);
  }

  const listEl = document.getElementById("editHistList");
  if(listEl){
    /* Añadir/restaurar series y ejercicios desde el DOM */
    /* 1. Operaciones de añadir serie: ya se aplicaron en vivo via añadir-set/del handlers */
    /* 2. Leer todos los inputs kg/reps y aplicarlos al working copy */
    listEl.querySelectorAll("[data-eh-kg],[data-eh-reps]").forEach(inp=>{
      const [ei, si] = inp.getAttribute(inp.hasAttribute("data-eh-kg")?"data-eh-kg":"data-eh-reps").split("|").map(Number);
      const ex = editingHistRecord.exercises[ei];
      if(!ex || !ex.sets) return;
      const set = ex.sets[si];
      if(!set) return;
      const val = parseFloat(inp.value);
      if(inp.hasAttribute("data-eh-kg")){ if(!isNaN(val)) set.kg = val; }
      else { if(!isNaN(val)) set.reps = Math.max(1, Math.round(val)); }
    });
    /* Nota: los ejercicios ya se eliminan directamente en editingHistRecord.exercises
       via el handler [data-eh-del-ex]. No hace falta reconciliación adicional. */
  }
  const history = P().getHistory();
  const idx = history.findIndex(x=>x.session_id === editingHistRecord.session_id);
  if(idx === -1){
    /* Legacy: buscar por date+day */
    const legacyIdx = history.findIndex(x=>x.date === editingHistRecord.date && x.day === editingHistRecord.day);
    if(legacyIdx !== -1){ history[legacyIdx] = editingHistRecord; }
    else { history.push(editingHistRecord); }
  } else {
    history[idx] = editingHistRecord;
  }
  /* Sincronización correcta: la edición local debe "ganarle" al servidor en el
     Last-Write-Wins (mergeHistoryBySessionId compara updated_at). Si no se
     actualiza, un pullServerData posterior (al entrar en Historial, en pageshow
     o en el reintento de 30s) bajaría la versión vieja del servidor y REVERTIRÍA
     la edición local. Actualizamos updated_at antes de persistir/subir. */
  const editedNowIso = new Date().toISOString();
  editingHistRecord.updated_at = editedNowIso;
  const updated = history.map(r =>
    r === editingHistRecord ? { ...r, updated_at: editedNowIso } : r
  );
  P().saveHistory(updated);
  if(S().sbClient && S().authUser){
    /* Subir SOLO la sesión editada al servidor, esperando el resultado. Si el
       envío falla, dejarla en pending para que el sync de 30s la reintente. */
    const ok = await S().pushSessionToServer(editingHistRecord);
    if(!ok){
      const p = P().getPending(); p.sessions.push(editingHistRecord); P().setPending(p);
    }
    await S().scheduleSync();
    /* Refrescar desde el servidor ya con la sesión editada subida, para que un
       render posterior (p.ej. al volver a Historial) no muestre una versión
       obsoleta del servidor que revierta la edición. */
    await S().pullServerData();
  }
  dismissEditHist();
  Router().renderMain();
  Ui().showToast("💾 Sesión editada y guardada");
}
function attachHistCalendarEvents(){
  document.querySelectorAll("[data-hist-month-change]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [y,m] = btn.dataset.histMonthChange.split(",").map(Number);
      histMonthCursor = [y,m];
      Router().renderMain();
    });
  });
  document.querySelectorAll("[data-hist-day]").forEach(cell=>{
    cell.addEventListener("click", ()=>{
      const ds = cell.dataset.histDay;
      histActiveDate = (histActiveDate === ds) ? null : ds;
      Router().renderMain();
    });
    cell.addEventListener("keydown", (e)=>{
      if(e.key==="Enter"||e.key===" "){
        e.preventDefault();
        const ds = cell.dataset.histDay;
        histActiveDate = (histActiveDate === ds) ? null : ds;
        Router().renderMain();
      }
    });
  });
  document.querySelectorAll("[data-edit-hist-date]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const ds = btn.dataset.editHistDate;
      const sessId = btn.dataset.editHistSessid;
      const history = P().getHistory();
      /* Buscar por session_id si existe (varias sesiones por día), fallback a date+day */
      let h;
      if(sessId){
        h = history.find(x=>x.session_id === sessId);
      }
      if(!h){
        h = history.find(x=>{ try{ return U.localDateKey(new Date(x.date)) === ds; }catch(err){ return false; } });
      }
      if(h) openEditHistSession(h);
    });
  });
  /* Eliminar sesión del historial (botón explícito) */
  document.querySelectorAll("[data-del-session]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.stopPropagation();
      const ds = btn.dataset.delSession;
      const sessId = btn.dataset.delSessid;
      const history = P().getHistory();
      let h;
      if(sessId){
        h = history.find(x=>x.session_id === sessId);
      }
      if(!h){
        h = history.find(x=>{ try{ return U.localDateKey(new Date(x.date)) === ds; }catch(err){ return false; } });
      }
      if(h) deleteHistorySession(h.date, h.day);
    });
  });
}
function openHistExercisePicker(){
  document.getElementById("pickerDayLabel").textContent = "Sustituir ejercicio del historial";
  EditR().renderPickerList("");
  document.getElementById("exPickerOverlay").classList.add("show");
  Ui().setFocusTrap("exPickerOverlay", document.getElementById("exPickerOverlay"));
  setTimeout(()=>document.getElementById("pickerSearch").focus(), 100);
}
  async function deleteHistorySession(date, day){
    if(confirm("¿Borrar esta sesión?")){
      /* Capturar el session_id ANTES de eliminar (se necesita para el servidor) */
      const history = P().getHistory();
      const idx = history.findIndex(h=>h.date===date && h.day===day);
      const targetSid = (idx !== -1 && history[idx].session_id) ? history[idx].session_id : null;
      if(idx !== -1) history.splice(idx, 1);
      P().saveHistory(history);
      /* Eliminar también de la cola de pendientes si aún no se había subido */
      const p = P().getPending();
      p.sessions = p.sessions.filter(s=>!(s.date===date && s.day===day));
      P().setPending(p);
      /* Eliminar de la nube si hay sesión (mismo date + day) */
      if(S().sbClient && S().authUser){
        try{
          const { data: rows } = await S().sbClient.from("sesiones").select("id, data").eq("user_id", S().authUser.id);
          if(Array.isArray(rows)){
            /* Buscar por session_id (preciso) o fallback por date+day (legacy) */
            const matches = rows.filter(r=>r.data && (
              (r.data.session_id && targetSid && r.data.session_id === targetSid) ||
              (r.data.date===date && r.data.day===day)
            ));
            for(const m of matches){
              if(m.data.session_id){
                await S().sbClient.from("sesiones").delete().eq("session_id", m.data.session_id).eq("user_id", S().authUser.id).catch(()=>{});
              } else {
                await S().sbClient.from("sesiones").delete().eq("id", m.id).catch(()=>{});
              }
            }
          }
        }catch(e){}
      }
      /* Forzar sincronización para confirmar el borrado en la nube */
      if(S().sbClient && S().authUser) S().scheduleSync();
      Router().renderMain();
      Ui().showToast("🗑️ Sesión eliminada" + (S().sbClient && S().authUser ? " · sincronizada" : ""));
    }
  }

  EyeFit.ViewsHistorial = {
    get histMonthCursor(){ return histMonthCursor; },
    set histMonthCursor(v){ histMonthCursor = v; },
    get histActiveDate(){ return histActiveDate; },
    set histActiveDate(v){ histActiveDate = v; },
    get editingHistRecord(){ return editingHistRecord; },
    set editingHistRecord(v){ editingHistRecord = v; },
    getHistMonthSessions, renderHistMonthNav, renderHistCalendar,
    renderHistDayDetail, renderHistorial, openEditHistSession,
    dismissEditHist, saveEditHist, attachHistCalendarEvents,
    openHistExercisePicker, deleteHistorySession
  };
})(typeof window !== "undefined" ? window : globalThis);

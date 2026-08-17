/* EyeFit — Eventos de Ajustes (refactor #19 → issue #23)
   - Autenticación, sincronización y notificaciones push
   - Días de entrenamiento y configuración de progresión
   - Importar/exportar rutina (XLSX) y backup JSON (con inputs estáticos)
   Exposición global: window.EyeFit.EventsAjustes */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const P = () => EyeFit.Persistence || {};
  const C = () => EyeFit.Config || {};
  const S = () => EyeFit.Supabase || {};
  const Ui = () => EyeFit.Ui || {};
  const Router = () => EyeFit.Router || {};
  const Auth = () => EyeFit.Auth || {};
  const Push = () => EyeFit.Push || {};
  const X = () => EyeFit.XlsxIO || {};

  function attachAjustesEvents(){
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
        localStorage.removeItem(P().K.routine);
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
      btn.addEventListener("click", ()=>{ if(global.EyeFitShowOnboarding) global.EyeFitShowOnboarding(true); });
    });
    /* Notificaciones push: activar/desactivar (requiere gesture explícito) */
    document.querySelectorAll("[data-enable-push]").forEach(btn=>{
      btn.addEventListener("click", ()=>{ Push().enablePushNotifications(); });
    });
    document.querySelectorAll("[data-disable-push]").forEach(btn=>{
      btn.addEventListener("click", ()=>{ Push().disablePushNotifications(); });
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
  }

  /* Importación estática: se enlaza UNA sola vez (inputs ocultos de index.html) */
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

  EyeFit.EventsAjustes = { attachAjustesEvents };
})(typeof window !== "undefined" ? window : globalThis);

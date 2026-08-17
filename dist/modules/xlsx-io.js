/* EyeFit — Módulo import/export XLSX (refactor #9 → issue #13)
   - Carga bajo demanda de SheetJS (xlsx.full.min.js)
   - parseRoutineSheet(data): hoja de cálculo → rutina saneada
   - exportRoutineXlsx(): rutina actual → rutina.xlsx
   Exposición global: window.EyeFit.XlsxIO */
(function (global) {
  'use strict';

  const EyeFit = global.EyeFit = global.EyeFit || {};
  const U = global.EyeFitUtils || {};
  const sanitizeRoutineRow = U.sanitizeRoutineRow;
  const DAY_ORDER = global.DAY_ORDER || [];
  const Ui = () => EyeFit.Ui || {};
  const P = () => EyeFit.Persistence || {};

  const HEADER_MAP = {
    "dia":"dia","orden":"orden","nombre_es":"nombre_es","nombre":"nombre_es",
    "dataset":"dataset","ejercicio":"nombre_es","series":"series","sets":"series",
    "reps":"reps","repeticiones":"reps","peso_kg":"peso_kg","peso":"peso_kg",
    "kg":"peso_kg","descanso_s":"descanso_s","descanso":"descanso_s","rest_s":"descanso_s",
    "notas":"notas","nota":"notas"
  };
  let xlsxPromise = null;
  function loadXLSX(){
    /* Fase B: SheetJS se carga bajo demanda (solo al Importar/Exportar .xlsx),
       manteniendo el bundle inicial pequeño y el arranque rápido. */
    if(xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((resolve, reject)=>{
      const s = document.createElement("script");
      s.src = "./xlsx.full.min.js";
      s.onload = ()=> resolve(window.XLSX);
      s.onerror = ()=>{ xlsxPromise = null; reject(new Error("xlsx load error")); };
      document.head.appendChild(s);
    });
    return xlsxPromise;
  }
  async function parseRoutineSheet(data){
    try{
      await loadXLSX();
    }catch(e){
      Ui().showToast("⏳ No se pudo cargar SheetJS. Comprueba la conexión");
      throw new Error("xlsx no disponible");
    }
    const XLSX = window.XLSX;
    const wb = XLSX.read(data, { type:"array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval:"" });
    const routine = []; const seen = new Set();
    for(const row of rows){
      const mapped = {};
      for(const [orig,target] of Object.entries(HEADER_MAP)){
        const v = row[orig];
        if(v !== undefined && mapped[target] === undefined){
          mapped[target] = (target==="orden"||target==="series"||target==="reps") ? parseInt(v,10)||0 : v;
        }
      }
      const s = sanitizeRoutineRow(mapped);
      if(!s) continue;
      const id = s.dia+"|"+s.nombre_es;
      if(seen.has(id)) continue;
      seen.add(id);
      routine.push(s);
    }
    routine.sort((a,b)=>{
      const di = DAY_ORDER.indexOf(a.dia)-DAY_ORDER.indexOf(b.dia);
      if(di!==0) return di;
      return (a.orden||0)-(b.orden||0);
    });
    const od = {};
    for(const ex of routine){ od[ex.dia]=(od[ex.dia]||0)+1; ex.orden=od[ex.dia]; }
    return routine;
  }
  async function exportRoutineXlsx(){
    try{
      await loadXLSX();
    }catch(e){
      Ui().showToast("⏳ No se pudo cargar SheetJS. Comprueba la conexión");
      return;
    }
    const XLSX = window.XLSX;
    const routine = P().getRoutine();
    const headers = ["dia","orden","nombre_es","dataset","series","reps","peso_kg","descanso_s","notas"];
    const rows = [headers];
    for(const ex of routine) rows.push([ex.dia,ex.orden,ex.nombre_es,ex.dataset,ex.series,ex.reps,ex.peso_kg,ex.descanso_s,ex.notas||""]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = headers.map(h=>({wch:h==="nombre_es"?40:h==="dataset"?50:h==="notas"?55:12}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rutina");
    XLSX.writeFile(wb, "rutina.xlsx");
  }

  EyeFit.XlsxIO = { loadXLSX, parseRoutineSheet, exportRoutineXlsx };
})(typeof window !== "undefined" ? window : globalThis);

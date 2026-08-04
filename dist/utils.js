/* EyeFit — utilidades puras testables (Común a Node y navegador)
   Este módulo contiene la lógica de negocio extraída de index.html
   para poder testearla con node:test sin cargar el DOM.

   IMPORTANTE: todo el contenido vive dentro de un IIFE para no
   colisionar las constantes top-level (APODOS, DAY_ORDER, ...) con
   las del script inline de index.html, que comparte el scope global
   del navegador (los scripts clásicos no son módulos).

   v2: fuente única de constantes (APODOS, DAY_ORDER, DAY_COLORS,
   INSTRUCCIONES, ALTERNATIVAS, DEFAULT_ROUTINE, EMBEDDED_IMAGES,
   DAY_SHORT) + funciones puras nuevas (escapeHtmlAttr, genUUID,
   localDateKey, clampNum, sanitizeRoutineRow, rebaseElapsed,
   mergeHistoryBySessionId, isValidDay). */

(function (global) {
  'use strict';

  /* ---------- Apodos (máx 3 palabras) por ejercicio programado ---------- */
  const APODOS = {
    "barbell bench press": "Press Banca",
    "dumbbell incline bench press": "Press Inclinado",
    "dumbbell seated shoulder press": "Press Militar",
    "cable standing fly": "Cruce Polea",
    "dumbbell lateral raise": "Elevaciones Lat.",
    "cable pushdown (with rope attachment)": "Ext. Tríceps",
    "barbell full squat": "Sentadilla",
    "sled 45° leg press": "Prensa 45°",
    "lever leg extension": "Cuádriceps",
    "lever lying leg curl": "Curl Femoral",
    "barbell standing calf raise": "Gemelos Pie",
    "barbell bent over row": "Remo Barra",
    "cable pulldown (pro lat bar)": "Jalón Pecho",
    "cable seated row": "Remo Sentado",
    "cable standing rear delt row (with rope)": "Face Pull",
    "ez barbell curl": "Curl EZ",
    "dumbbell hammer curl": "Curl Martillo",
    "barbell deadlift": "Peso Muerto",
    "barbell glute bridge two legs on bench (male)": "Hip Thrust",
    "barbell good morning": "Buenos Días",
    "cable kickback": "Patada Glúteo",
    "lever seated calf raise": "Gemelos Sentado",
    "barbell incline bench press": "Press Inclinado",
    "pull up (neutral grip)": "Dominadas",
    "dumbbell arnold press": "Press Arnold",
    "cable lateral raise": "Lat. Polea",
    "cable curl": "Curl Polea",
    "cable overhead triceps extension (rope attachment)": "Ext. Overhead"
  };

  /* ---------- Días ---------- */
  const DAY_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const DAY_COLORS = {
    Lunes: "#4FC3F7", Martes: "#81C784", Miércoles: "#FFB74D",
    Jueves: "#BA68C8", Viernes: "#F0625C"
  };
  const DAY_SHORT = { Lunes: "LUN", Martes: "MAR", Miércoles: "MIÉ", Jueves: "JUE", Viernes: "VIE" };
  const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  /* ---------- Rutina por defecto ---------- */
  const DEFAULT_ROUTINE = [
    { dia: "Lunes",     orden: 1, nombre_es: "Press banca plano con barra",         dataset: "barbell bench press",                      series: 3, reps: 8,  peso_kg: 40, descanso_s: 180, notas: "Codos a 45°, retracción escapular." },
    { dia: "Lunes",     orden: 2, nombre_es: "Press inclinado con mancuernas",       dataset: "dumbbell incline bench press",             series: 3, reps: 10, peso_kg: 18, descanso_s: 120, notas: "Porción clavicular del pectoral." },
    { dia: "Lunes",     orden: 3, nombre_es: "Press militar sentado con mancuernas", dataset: "dumbbell seated shoulder press",           series: 3, reps: 10, peso_kg: 14, descanso_s: 120, notas: "No arquear la espalda." },
    { dia: "Lunes",     orden: 4, nombre_es: "Aperturas en polea alta (pecho)",      dataset: "cable standing fly",                      series: 3, reps: 15, peso_kg: 8,  descanso_s: 90,  notas: "Tensión continua." },
    { dia: "Lunes",     orden: 5, nombre_es: "Elevaciones laterales con mancuernas", dataset: "dumbbell lateral raise",                  series: 4, reps: 15, peso_kg: 6,  descanso_s: 60,  notas: "Sin balanceo." },
    { dia: "Lunes",     orden: 6, nombre_es: "Ext. tríceps en polea (cuerda)",       dataset: "cable pushdown (with rope attachment)",    series: 3, reps: 15, peso_kg: 12, descanso_s: 75,  notas: "Codos fijos." },
    { dia: "Martes",    orden: 1, nombre_es: "Sentadilla con barra (barra alta)",    dataset: "barbell full squat",                      series: 4, reps: 6,  peso_kg: 40, descanso_s: 180, notas: "Bajar hasta paralelo." },
    { dia: "Martes",    orden: 2, nombre_es: "Prensa de piernas 45°",                dataset: "sled 45° leg press",                      series: 3, reps: 12, peso_kg: 60, descanso_s: 120, notas: "Sin bloquear rodillas." },
    { dia: "Martes",    orden: 3, nombre_es: "Extensión de cuádriceps en máquina",   dataset: "lever leg extension",                     series: 3, reps: 15, peso_kg: 20, descanso_s: 90,  notas: "Pausa 1s arriba." },
    { dia: "Martes",    orden: 4, nombre_es: "Curl femoral tumbado en máquina",      dataset: "lever lying leg curl",                    series: 3, reps: 12, peso_kg: 20, descanso_s: 90,  notas: "Control en negativa." },
    { dia: "Martes",    orden: 5, nombre_es: "Elevación de talones de pie",          dataset: "barbell standing calf raise",             series: 4, reps: 15, peso_kg: 30, descanso_s: 75,  notas: "Rango completo." },
    { dia: "Miércoles", orden: 1, nombre_es: "Remo con barra (agarre prono, 45°)",   dataset: "barbell bent over row",                   series: 4, reps: 8,  peso_kg: 35, descanso_s: 180, notas: "Tirar con codos." },
    { dia: "Miércoles", orden: 2, nombre_es: "Jalón al pecho en polea",              dataset: "cable pulldown (pro lat bar)",             series: 3, reps: 12, peso_kg: 35, descanso_s: 120, notas: "Barra al pecho superior." },
    { dia: "Miércoles", orden: 3, nombre_es: "Remo en polea baja (agarre neutro)",   dataset: "cable seated row",                        series: 3, reps: 12, peso_kg: 30, descanso_s: 120, notas: "Contraer escápulas." },
    { dia: "Miércoles", orden: 4, nombre_es: "Face pull en polea alta (cuerda)",     dataset: "cable standing rear delt row (with rope)", series: 3, reps: 20, peso_kg: 10, descanso_s: 75,  notas: "Tirar hacia la cara." },
    { dia: "Miércoles", orden: 5, nombre_es: "Curl con barra EZ (sentado)",          dataset: "ez barbell curl",                         series: 3, reps: 12, peso_kg: 15, descanso_s: 90,  notas: "Codos fijos." },
    { dia: "Miércoles", orden: 6, nombre_es: "Curl martillo con mancuernas",         dataset: "dumbbell hammer curl",                    series: 2, reps: 15, peso_kg: 8,  descanso_s: 75,  notas: "Agarre neutro." },
    { dia: "Jueves",    orden: 1, nombre_es: "Peso muerto convencional",             dataset: "barbell deadlift",                        series: 3, reps: 5,  peso_kg: 50, descanso_s: 210, notas: "Espalda neutra." },
    { dia: "Jueves",    orden: 2, nombre_es: "Hip thrust con barra",                 dataset: "barbell glute bridge two legs on bench (male)", series: 4, reps: 12, peso_kg: 50, descanso_s: 120, notas: "Extensión completa arriba." },
    { dia: "Jueves",    orden: 3, nombre_es: "Buenos días con barra (peso ligero)",  dataset: "barbell good morning",                    series: 3, reps: 12, peso_kg: 20, descanso_s: 120, notas: "Cadera atrás. Espalda neutra." },
    { dia: "Jueves",    orden: 4, nombre_es: "Patada de glúteo en polea",            dataset: "cable kickback",                          series: 3, reps: 15, peso_kg: 10, descanso_s: 75,  notas: "Extensión de cadera." },
    { dia: "Jueves",    orden: 5, nombre_es: "Elevación de talones sentado (sóleo)", dataset: "lever seated calf raise",                series: 4, reps: 15, peso_kg: 25, descanso_s: 75,  notas: "Pausa arriba." },
    { dia: "Viernes",   orden: 1, nombre_es: "Press banca inclinado con barra (30°)", dataset: "barbell incline bench press",            series: 3, reps: 8,  peso_kg: 30, descanso_s: 180, notas: "Refuerza pectoral superior." },
    { dia: "Viernes",   orden: 2, nombre_es: "Dominadas (agarre neutro)",            dataset: "pull up (neutral grip)",                  series: 3, reps: 8,  peso_kg: 0,  descanso_s: 180, notas: "Extensión total abajo." },
    { dia: "Viernes",   orden: 3, nombre_es: "Press Arnold con mancuernas",          dataset: "dumbbell arnold press",                   series: 3, reps: 12, peso_kg: 10, descanso_s: 120, notas: "Rotación natural." },
    { dia: "Viernes",   orden: 4, nombre_es: "Elevaciones laterales en polea baja",  dataset: "cable lateral raise",                     series: 4, reps: 20, peso_kg: 5,  descanso_s: 60,  notas: "Tensión constante." },
    { dia: "Viernes",   orden: 5, nombre_es: "Curl en polea baja (barra recta)",     dataset: "cable curl",                              series: 3, reps: 15, peso_kg: 10, descanso_s: 75,  notas: "No mover codos." },
    { dia: "Viernes",   orden: 6, nombre_es: "Ext. overhead tríceps (cuerda)",       dataset: "cable overhead triceps extension (rope attachment)", series: 3, reps: 15, peso_kg: 10, descanso_s: 75, notas: "Cabeza larga estirada." }
  ];

  /* ---------- Instrucciones curadas en español ---------- */
  const INSTRUCCIONES = {
    "barbell bench press": "Acuéstate en el banco, pies en el suelo\nAgarra la barra algo más ancha que hombros\nBaja al pecho controlado y sube",
    "dumbbell incline bench press": "Banco a 45°, mancuernas a la altura del pecho\nSube extendiendo brazos\nBaja controlado hasta el pecho",
    "dumbbell seated shoulder press": "Sentado, espalda apoyada, mancuernas a los hombros\nPresiona hacia arriba hasta extender\nBaja controlado",
    "cable standing fly": "De pie, poleas a la altura del pecho\nJunta las manos frente al pecho\nVuelve con control",
    "dumbbell lateral raise": "De pie, mancuernas a los lados\nSube los brazos hasta la horizontal\nBaja lento",
    "cable pushdown (with rope attachment)": "De pie, codos pegados al torso\nEmpuja la cuerda hacia abajo\nAbre al final y vuelve",
    "barbell full squat": "Barra sobre la espalda, pies ancho hombros\nBaja hasta que el muslo quede paralelo\nSube empujando con fuerza",
    "sled 45° leg press": "Sentado en la prensa, pies en la plataforma\nBaja sin bloquear rodillas\nEmpuja de vuelta",
    "lever leg extension": "Sentado, tobillos bajo el rodillo\nExtiende las piernas pausa arriba\nBaja controlado",
    "lever lying leg curl": "Tumbado boca abajo, rodillo en tobillos\nFlexiona las piernas llevando los talones al glúteo\nBaja lento",
    "barbell standing calf raise": "De pie, barra sobre la espalda\nSube de puntillas lo máximo\nBaja controlado",
    "barbell bent over row": "Torso a 45°, barra colgando\nTira de la barra hacia el abdomen\nBaja controlado",
    "cable pulldown (pro lat bar)": "Sentado, barra ancha\nTira de la barra hasta el pecho\nSube controlado",
    "cable seated row": "Sentado, rodillas flexionadas\nTira del asa hacia el abdomen\nVuelve estirando",
    "cable standing rear delt row (with rope)": "De pie, cuerda a la altura de la cara\nTira hacia la nariz abriendo los codos\nVuelve controlado",
    "ez barbell curl": "De pie agarre supino\nFlexiona codos subiendo la barra\nBaja lento",
    "dumbbell hammer curl": "De pie, palmas mirándose\nSube las mancuernas a los hombros\nBaja controlado",
    "barbell deadlift": "Pies ancho de hombros, barra en el suelo\nEmpuja con piernas, espalda recta\nBloquea arriba",
    "barbell glute bridge two legs on bench (male)": "Espalda en banco, barra en cadera\nSube la cadera hacia arriba\nBaja controlado",
    "barbell good morning": "Barra en la espalda, rodillas flex\nInclina el torso con espalda recta\nVuelve arriba",
    "cable kickback": "De pie, patada hacia atrás\nExtiende cadera con control\nVuelve",
    "lever seated calf raise": "Sentado, rodillos sobre rodillas\nSube de puntillas\nBaja estirando",
    "barbell incline bench press": "Banco 30°, barra al pecho superior\nBaja controlado y sube",
    "pull up (neutral grip)": "Agarre neutro en la barra\nSube hasta pasar la barbilla\nBaja controlado",
    "dumbbell arnold press": "Mancuernas a la altura de los hombros con palmas hacia ti\nSube rotando las palmas hacia delante\nBaja controlado",
    "cable lateral raise": "De pie, polea baja a un lado\nSube el brazo hasta la horizontal\nBaja lento",
    "cable curl": "De pie, barra recta en polea baja\nFlexiona los codos sin moverlos\nBaja lento",
    "cable overhead triceps extension (rope attachment)": "De pie, cuerda tras la cabeza\nExtiende los brazos hacia arriba\nVuelve flexionando"
  };

  /* ---------- 3 alternativas manuales en español por ejercicio ---------- */
  const ALTERNATIVAS = {
    "barbell bench press": ["Press Banca Inclinado", "Flexiones", "Press Máquina"],
    "dumbbell incline bench press": ["Press Banca Plano", "Press Máquina", "Aperturas"],
    "dumbbell seated shoulder press": ["Press Militar Barra", "Press Arnold", "Prensa Hombro"],
    "cable standing fly": ["Aperturas Mancuernas", "Cruce Polea Baja", "Pec Deck"],
    "dumbbell lateral raise": ["Polea Lateral", "Elevación Sentado", "Pájaros"],
    "cable pushdown (with rope attachment)": ["Ext. Tríceps Barra", "Fondos Tríceps", "Patada Tríceps"],
    "barbell full squat": ["Sentadilla Front", "Prensa", "Sentadilla Máquina"],
    "sled 45° leg press": ["Sentadilla", "Hack Squat", "Prensa Horizontal"],
    "lever leg extension": ["Sentadilla Sissy", "Ext. Pierna Unilateral", "Prensa"],
    "lever lying leg curl": ["Curl Femoral Sentado", "Bulgara", "Curl Nórdico"],
    "barbell standing calf raise": ["Gemelos en Prensa", "Gemelos Sentado", "Puntillas Unilateral"],
    "barbell bent over row": ["Remo Máquina", "Remo T", "Péndulo"],
    "cable pulldown (pro lat bar)": ["Dominadas", "Jalón Agarre Cerrado", "Remo Alto"],
    "cable seated row": ["Remo Barra", "Remo Unilateral", "Remo Máquina"],
    "cable standing rear delt row (with rope)": ["Pájaros Invertidos", "Cruce Hombro", "Face Pull Máquina"],
    "ez barbell curl": ["Curl Mancuernas", "Curl Pozo", "Curl Banco Scott"],
    "dumbbell hammer curl": ["Curl Martillo Cruzado", "Curl Barra", "Curl Inclinado"],
    "barbell deadlift": ["Peso Muerto Rumano", "Sumo", "Hip Thrust"],
    "barbell glute bridge two legs on bench (male)": ["Hip Thrust Máquina", "Patada Glúteo", "Puente Glúteo"],
    "barbell good morning": ["Bulgara", "Hip Thrust", "Kettlebell Swing"],
    "cable kickback": ["Patada Unilateral", "Hip Thrust", "Puente Glúteo"],
    "lever seated calf raise": ["Gemelos Pie", "Prensa Gemelos", "Saltos"],
    "barbell incline bench press": ["Press Banca Plano", "Press Mancuernas", "Press Máquina"],
    "pull up (neutral grip)": ["Dominadas Prono", "Jalón", "Dominadas Asistidas"],
    "dumbbell arnold press": ["Press Militar", "Press Mancuernas", "Prensa Hombro"],
    "cable lateral raise": ["Mancuernas Lateral", "Elevación Unilateral", "Lateral Inclinado"],
    "cable curl": ["Curl Barra", "Curl Mancuernas", "Curl Martillo"],
    "cable overhead triceps extension (rope attachment)": ["Ext. Tríceps Polea", "Press Frances", "Patada Tríceps"]
  };

  /* ---------- Mapa de imágenes embebido ---------- */
  const EMBEDDED_IMAGES = {
    "barbell bench press": "0025-EIeI8Vf", "dumbbell incline bench press": "0314-ns0SIbU",
    "dumbbell seated shoulder press": "0405-znQUdHY", "cable standing fly": "0227-Pr9Rhf4",
    "dumbbell lateral raise": "0334-DsgkuIt", "cable pushdown (with rope attachment)": "0200-dU605di",
    "barbell full squat": "0043-qXTaZnJ", "sled 45° leg press": "0739-10Z2DXU",
    "lever leg extension": "0585-my33uHU", "lever lying leg curl": "0586-17lJ1kr",
    "barbell standing calf raise": "1372-8ozhUIZ", "barbell bent over row": "0027-eZyBC3j",
    "cable pulldown (pro lat bar)": "0197-qdRxqCj", "cable seated row": "0861-fUBheHs",
    "cable standing rear delt row (with rope)": "0233-ZfyAGhK", "ez barbell curl": "0447-6TG6x2w",
    "dumbbell hammer curl": "0313-slDvUAU", "barbell deadlift": "0032-ila4NZS",
    "barbell glute bridge two legs on bench (male)": "3562-qg2PGl6", "barbell good morning": "0044-XlZ4lAC",
    "cable kickback": "0860-HEJ6DIX", "lever seated calf raise": "0594-bOOdeyc",
    "barbell incline bench press": "0047-3TZduzM", "pull up (neutral grip)": "0651-0V2YQjW",
    "dumbbell arnold press": "2137-Xy4jlWA", "cable lateral raise": "0178-goJ6ezq",
    "cable curl": "0868-G08RZcQ", "cable overhead triceps extension (rope attachment)": "0194-2IxROQ1"
  };

  /* ---------- Funciones ---------- */

  function getApodo(ex) {
    return APODOS[ex.dataset] || (String(ex.nombre_es || "").split(" ").slice(0, 3).join(" "));
  }

  /* 1RM estimado con fórmula de Epley: peso × (1 + reps/30).
     Si reps <= 0 no hay set completado → 1RM = 0. */
  function epley1RM(kg, reps) {
    const w = parseFloat(kg) || 0, r = parseInt(reps, 10) || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return +(w * (1 + r / 30)).toFixed(1);
  }

  /* Nota: setVolume eliminado (código muerto) */

  function formatRest(s) {
    if (!s) return "—";
    const m = Math.floor(s / 60), r = s % 60;
    return m > 0 ? (r > 0 ? `${m}m ${r}s` : `${m}min`) : `${r}s`;
  }

  /* Normaliza un nombre para comparaciones (sin acentos, minúsculas, sin símbolos) */
  function normalizeName(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\sà-úá-ú]/g, "")
      .replace(/\s+/g, " ");
  }

  /**
   * Genera los sets de un ejercicio evitando NaN.
   * Si el historial tiene datos corruptos (undefined, "", NaN), cae al fallback.
   */
  function buildExerciseSets(ex, lastPerf) {
    const nSets = parseInt(ex.series, 10) || 3;
    const fallbackKg = parseFloat(ex.peso_kg) || 0;
    const fallbackReps = parseInt(ex.reps, 10) || 8;

    if (!lastPerf || lastPerf.length === 0) {
      return Array.from({ length: nSets }, () => ({ kg: fallbackKg, reps: fallbackReps, done: false }));
    }

    return Array.from({ length: nSets }, (_, i) => {
      const p = lastPerf[i] || lastPerf[lastPerf.length - 1] || {};
      const kg = parseFloat(p.kg);
      const reps = parseInt(p.reps, 10);
      return {
        kg: Number.isFinite(kg) ? kg : fallbackKg,
        reps: Number.isFinite(reps) ? reps : fallbackReps,
        done: false
      };
    });
  }

  /**
   * Valida que un registro de sesión del historial tenga el schema mínimo.
   * Protege contra datos corruptos en localStorage/nube (F2-A2).
   */
  function isValidSessionRecord(h) {
    return !!(h && typeof h === "object" && !Array.isArray(h) &&
      typeof h.date === "string" && h.date.length > 0 &&
      typeof h.day === "string" && h.day.length > 0 &&
      Array.isArray(h.exercises));
  }

  /**
   * Procesa una cola de sesiones pendientes devolviendo las que NO se pudieron subir.
   * Sin pérdida de datos: si una falla, las siguientes permanecen en la cola.
   */
  function computeRemainingSessions(sessions, pushFn) {
    const remaining = [];
    for (let i = 0; i < sessions.length; i++) {
      const ok = pushFn(sessions[i]);
      if (!ok) {
        remaining.push(...sessions.slice(i));
        break;
      }
    }
    return remaining;
  }

  /**
   * Ordena una rutina por día de la semana y orden interno.
   * Los días fuera de DAY_ORDER quedan al final.
   */
  function dayIndex(dia) {
    const idx = DAY_ORDER.indexOf(dia);
    return idx < 0 ? Number.MAX_SAFE_INTEGER : idx;
  }
  function sortRoutine(routine) {
    return [...routine].sort((a, b) => {
      const di = dayIndex(a.dia) - dayIndex(b.dia);
      if (di !== 0) return di;
      return (a.orden || 0) - (b.orden || 0);
    });
  }

  /* ---------- Funciones nuevas (QA 2.x) ---------- */

  /** Escapa un valor para interpolarlo dentro de un atributo HTML (data-*, etc.) */
  function escapeHtmlAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "\u0026amp;")
      .replace(/"/g, "\u0026quot;")
      .replace(/'/g, "\u0026#39;")
      .replace(/</g, "\u0026lt;")
      .replace(/>/g, "\u0026gt;");
  }

  /** Devuelve la clave de fecha local YYYY-MM-DD (independiente de UTC). Fix streak TZ. */
  function localDateKey(d) {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /** Genera un UUID v4 con crypto.randomUUID o fallback manual. */
  function genUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /** Limita un número a un rango; si no es finito, usa fallback. */
  function clampNum(val, min, max, fallback) {
    const n = parseFloat(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  /** Valida que un día pertenezca a DAY_ORDER (case-insensitive). */
  function isValidDay(dia) {
    const d = String(dia || "").trim().toLowerCase();
    return DAY_ORDER.some(x => x.toLowerCase() === d);
  }

  /**
   * Sanitiza una fila de la rutina importada desde .xlsx.
   * - Valida dia contra DAY_ORDER (case-insensitive)
   * - Clampa series/reps/peso_kg/descanso_s a rangos sensatos
   * - Rechaza filas sin nombre o con dataset vacío llevando a fallback de imagen
   */
  function sanitizeRoutineRow(row) {
    if (!row || typeof row !== "object") return null;
    const diaRaw = String(row.dia || "").trim();
    const diaKey = DAY_ORDER.find(d => d.toLowerCase() === diaRaw.toLowerCase());
    const nombre = String(row.nombre_es || "").trim();
    if (!diaKey || !nombre) return null;
    const series = parseInt(row.series, 10);
    const reps = parseInt(row.reps, 10);
    const peso = parseFloat(row.peso_kg);
    const desc = parseInt(row.descanso_s, 10);
    return {
      dia: diaKey,
      orden: clampNum(parseInt(row.orden, 10), 0, 99, 0),
      nombre_es: nombre,
      dataset: String(row.dataset || "").trim(),
      series: Number.isInteger(series) ? clampNum(series, 1, 20, 3) : 3,
      reps: Number.isInteger(reps) ? clampNum(reps, 1, 100, 8) : 8,
      peso_kg: Number.isFinite(peso) ? clampNum(peso, 0, 500, 0) : 0,
      descanso_s: Number.isInteger(desc) ? clampNum(desc, 0, 3600, 90) : 90,
      notas: String(row.notas || "").trim()
    };
  }

  /**
   * Recalcula el elapsed acumulado al restaurar una sesión guardada.
   * Evita que los gaps de wall-clock (cierre de pestaña) inflen la duración.
   * Devuelve un nuevo objeto de sesión con baseElapsed ajustado y startTime = ahora.
   */
  function rebaseElapsed(saved, now) {
    if (!saved || typeof saved !== "object") return saved;
    const t = Number.isFinite(now) ? now : Date.now();
    const started = Number.isFinite(saved.startTime) ? saved.startTime : t;
    const gap = Math.max(0, Math.floor((t - started) / 1000));
    return {
      ...saved,
      baseElapsed: (parseFloat(saved.baseElapsed) || 0) + gap,
      startTime: t
    };
  }

  /**
   * Fusiona el historial local con el del servidor.
   * - Deduplica por session_id cuando existe (fallback date+day para registros legacy).
   * - Last-write-wins por updated_at (ISO string) cuando ambos existen.
   * Devuelve el historial fusionado ordenado por fecha desc.
   */
  function mergeHistoryBySessionId(local, server) {
    const l = Array.isArray(local) ? local : [];
    const s = Array.isArray(server) ? server : [];
    const map = new Map();

    const keyOf = h => {
      if (h && h.session_id) return "sid:" + h.session_id;
      return "legacy:" + (h && h.date) + "|" + (h && h.day);
    };

    for (const h of [...s, ...l]) {
      if (!isValidSessionRecord(h)) continue;
      const k = keyOf(h);
      const existing = map.get(k);
      if (!existing) { map.set(k, h); continue; }
      const a = h.updated_at, b = existing.updated_at;
      if (a && b) {
        if (new Date(a) > new Date(b)) map.set(k, h);
      } else if (a && !b) {
        map.set(k, h); // el que tiene updated_at gana sobre legacy
      } else if (!a && b) {
        /* se queda el existing */
      } else {
        // Sin timestamps: el servidor gana (autoritativo) salvo que el local
        // sea más reciente por orden de llegada (el servidor va primero)
        map.set(k, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /* ---------- API pública ---------- */
  const EyeFitUtils = {
    APODOS, DAY_ORDER, DAY_COLORS, DAY_SHORT, WEEKDAY_NAMES,
    DEFAULT_ROUTINE, INSTRUCCIONES, ALTERNATIVAS, EMBEDDED_IMAGES,
    getApodo, epley1RM, formatRest, normalizeName,
    buildExerciseSets, isValidSessionRecord, computeRemainingSessions, sortRoutine,
    escapeHtmlAttr, localDateKey, genUUID, clampNum, isValidDay, sanitizeRoutineRow,
    rebaseElapsed, mergeHistoryBySessionId
  };

  /* Export para Node (tests) */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = EyeFitUtils;
  }

  /* Export para navegador (compartido con index.html) */
  if (global) {
    if (!global.EyeFitUtils) global.EyeFitUtils = EyeFitUtils;
    // Constantes globales: fuente única de verdad para el script inline de index.html
    global.APODOS = global.APODOS || APODOS;
    global.DAY_ORDER = global.DAY_ORDER || DAY_ORDER;
    global.DAY_COLORS = global.DAY_COLORS || DAY_COLORS;
    global.DAY_SHORT = global.DAY_SHORT || DAY_SHORT;
    global.INSTRUCCIONES = global.INSTRUCCIONES || INSTRUCCIONES;
    global.ALTERNATIVAS = global.ALTERNATIVAS || ALTERNATIVAS;
    global.DEFAULT_ROUTINE = global.DEFAULT_ROUTINE || DEFAULT_ROUTINE;
    global.EMBEDDED_IMAGES = global.EMBEDDED_IMAGES || EMBEDDED_IMAGES;
  }

})(typeof window !== "undefined" ? window :
   typeof globalThis !== "undefined" ? globalThis :
   typeof global !== "undefined" ? global : this);
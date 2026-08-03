/* EyeFit — utilidades puras testables (Común a Node y navegador)
   Este módulo contiene la lógica de negocio extraída de index.html
   para poder testearla con node:test sin cargar el DOM. */

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

function setVolume(kg, reps) {
  return (parseFloat(kg) || 0) * (parseInt(reps, 10) || 0);
}

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

/* Export para Node */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    APODOS, DAY_ORDER, DAY_COLORS,
    getApodo, epley1RM, setVolume, formatRest, normalizeName,
    buildExerciseSets, isValidSessionRecord, computeRemainingSessions, sortRoutine
  };
}

/* Export para navegador (compartido con index.html) */
if (typeof window !== "undefined" && !window.EyeFitUtils) {
  window.EyeFitUtils = {
    APODOS, DAY_ORDER, DAY_COLORS,
    getApodo, epley1RM, setVolume, formatRest, normalizeName,
    buildExerciseSets, isValidSessionRecord, computeRemainingSessions, sortRoutine
  };
}
/* generate_rutina.js
   Genera rutina.xlsx (hoja de cálculo editable) con la rutina Lunes-Viernes de EyeFit.
   Uso: node generate_rutina.js
   Edita los datos aquí y vuelve a ejecutar para regenerar el xlsx.
*/
const XLSX = require("xlsx");
const fs = require("fs");

/* ------------------------------------------------------------------
   RUTINA BASE — edita libremente esta estructura
   dataset = nombre en inglés del ejercicio (para buscar la imagen
   en https://github.com/hasaneyldrm/exercises-dataset)
------------------------------------------------------------------- */
const RUTINA = [
  // ── LUNES · Tren Superior A (Empuje) ────────────────────────────
  { dia: "Lunes",        nombre_es: "Press banca plano con barra",            dataset: "barbell bench press",                       series: 3, reps: 8,  peso_kg: 40, descanso_s: 180, notas: "Codos a 45-75°, retracción escapular. Compuesto principal." },
  { dia: "Lunes",        nombre_es: "Press inclinado con mancuernas",          dataset: "dumbbell incline bench press",              series: 3, reps: 10, peso_kg: 18, descanso_s: 120, notas: "Porción clavicular del pectoral. Bajar con control." },
  { dia: "Lunes",        nombre_es: "Press militar sentado con mancuernas",    dataset: "dumbbell seated shoulder press",            series: 3, reps: 10, peso_kg: 14, descanso_s: 120, notas: "No arquear la espalda. Rango completo." },
  { dia: "Lunes",        nombre_es: "Aperturas en polea alta (pecho)",         dataset: "cable standing fly",                       series: 3, reps: 15, peso_kg: 8,  descanso_s: 90,  notas: "Tensión continua. Estirar bien el pecho abajo." },
  { dia: "Lunes",        nombre_es: "Elevaciones laterales con mancuernas",    dataset: "dumbbell lateral raise",                   series: 4, reps: 15, peso_kg: 6,  descanso_s: 60,  notas: "Sin balanceo. Hasta paralelo con el suelo." },
  { dia: "Lunes",        nombre_es: "Ext. tríceps en polea (cuerda)",          dataset: "cable pushdown (with rope attachment)",     series: 3, reps: 15, peso_kg: 12, descanso_s: 75,  notas: "Codos fijos. Abrir al final (doble tensión)." },

  // ── MARTES · Tren Inferior A (Cuádriceps / Glúteos) ─────────────
  { dia: "Martes",       nombre_es: "Sentadilla con barra (barra alta)",       dataset: "barbell full squat",                       series: 4, reps: 6,  peso_kg: 40, descanso_s: 180, notas: "Bajar hasta paralelo. Rodillas sin colapsar." },
  { dia: "Martes",       nombre_es: "Prensa de piernas 45°",                   dataset: "sled 45° leg press",                       series: 3, reps: 12, peso_kg: 60, descanso_s: 120, notas: "Sin bloquear rodillas arriba." },
  { dia: "Martes",       nombre_es: "Extensión de cuádriceps en máquina",      dataset: "lever leg extension",                      series: 3, reps: 15, peso_kg: 20, descanso_s: 90,  notas: "Pausa 1s en máxima contracción." },
  { dia: "Martes",       nombre_es: "Curl femoral tumbado en máquina",         dataset: "lever lying leg curl",                     series: 3, reps: 12, peso_kg: 20, descanso_s: 90,  notas: "Control en negativa." },
  { dia: "Martes",       nombre_es: "Elevación de talones de pie",             dataset: "barbell standing calf raise",              series: 4, reps: 15, peso_kg: 30, descanso_s: 75,  notas: "Rango completo. Pausa arriba." },

  // ── MIÉRCOLES · Tren Superior B (Tirón) ─────────────────────────
  { dia: "Miércoles",    nombre_es: "Remo con barra (agarre prono, 45°)",      dataset: "barbell bent over row",                    series: 4, reps: 8,  peso_kg: 35, descanso_s: 180, notas: "Torso a 45° estático. Tirar con codos." },
  { dia: "Miércoles",    nombre_es: "Jalón al pecho en polea",                 dataset: "cable pulldown (pro lat bar)",              series: 3, reps: 12, peso_kg: 35, descanso_s: 120, notas: "Llevar la barra al pecho superior." },
  { dia: "Miércoles",    nombre_es: "Remo en polea baja (agarre neutro)",      dataset: "cable seated row",                         series: 3, reps: 12, peso_kg: 30, descanso_s: 120, notas: "Contraer escápulas al final del movimiento." },
  { dia: "Miércoles",    nombre_es: "Face pull en polea alta (cuerda)",        dataset: "cable standing rear delt row (with rope)",  series: 3, reps: 20, peso_kg: 10, descanso_s: 75,  notas: "Tirar hacia la cara. Salud del hombro." },
  { dia: "Miércoles",    nombre_es: "Curl con barra EZ (sentado)",             dataset: "ez barbell curl",                          series: 3, reps: 12, peso_kg: 15, descanso_s: 90,  notas: "Codos fijos a los costados." },
  { dia: "Miércoles",    nombre_es: "Curl martillo con mancuernas",            dataset: "dumbbell hammer curl",                     series: 2, reps: 15, peso_kg: 8,  descanso_s: 75,  notas: "Agarre neutro. Sin balanceo." },

  // ── JUEVES · Tren Inferior B (Posterior) ────────────────────────
  { dia: "Jueves",       nombre_es: "Peso muerto convencional",                dataset: "barbell deadlift",                         series: 3, reps: 5,  peso_kg: 50, descanso_s: 210, notas: "Espalda neutra. Barra pegada a las piernas." },
  { dia: "Jueves",       nombre_es: "Hip thrust con barra",                    dataset: "barbell glute bridge two legs on bench (male)", series: 4, reps: 12, peso_kg: 50, descanso_s: 120, notas: "Extensión de cadera completa arriba." },
  { dia: "Jueves",       nombre_es: "Buenos días con barra (peso ligero)",     dataset: "barbell good morning",                     series: 3, reps: 12, peso_kg: 20, descanso_s: 120, notas: "Cadera atrás. Espalda neutra. Ligero." },
  { dia: "Jueves",       nombre_es: "Patada de glúteo en polea",               dataset: "cable kickback",                           series: 3, reps: 15, peso_kg: 10, descanso_s: 75,  notas: "Extensión de cadera completa arriba." },
  { dia: "Jueves",       nombre_es: "Elevación de talones sentado (sóleo)",    dataset: "lever seated calf raise",                 series: 4, reps: 15, peso_kg: 25, descanso_s: 75,  notas: "Pausa arriba. Estiramiento abajo." },

  // ── VIERNES · Tren Superior C (Híbrido) ─────────────────────────
  { dia: "Viernes",      nombre_es: "Press banca inclinado con barra (30°)",   dataset: "barbell incline bench press",              series: 3, reps: 8,  peso_kg: 30, descanso_s: 180, notas: "Refuerza pectoral superior." },
  { dia: "Viernes",      nombre_es: "Dominadas (agarre neutro)",               dataset: "pull up (neutral grip)",                   series: 3, reps: 8,  peso_kg: 0,  descanso_s: 180, notas: "Extensión total abajo. Subir hasta arriba." },
  { dia: "Viernes",      nombre_es: "Press Arnold con mancuernas",             dataset: "dumbbell arnold press",                    series: 3, reps: 12, peso_kg: 10, descanso_s: 120, notas: "Rotación natural. Rango completo." },
  { dia: "Viernes",      nombre_es: "Elevaciones laterales en polea baja",     dataset: "cable lateral raise",                      series: 4, reps: 20, peso_kg: 5,  descanso_s: 60,  notas: "Tensión constante en deltoides." },
  { dia: "Viernes",      nombre_es: "Curl en polea baja (barra recta)",        dataset: "cable curl",                               series: 3, reps: 15, peso_kg: 10, descanso_s: 75,  notas: "Tensión constante. No mover codos." },
  { dia: "Viernes",      nombre_es: "Ext. overhead tríceps (cuerda)",          dataset: "cable overhead triceps extension (rope attachment)", series: 3, reps: 15, peso_kg: 10, descanso_s: 75, notas: "Cabeza larga en máximo estiramiento." },
];

/* ------------------------------------------------------------------
   Generación del archivo XLSX con formato (cabecera + columnas)
------------------------------------------------------------------- */
const headers = ["dia", "orden", "nombre_es", "dataset", "series", "reps", "peso_kg", "descanso_s", "notas"];

// Agrupar por día para numerar orden
const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const filas = [];
const ordenPorDia = {};
for (const ex of RUTINA) {
  const dia = ex.dia;
  if (!(dia in ordenPorDia)) ordenPorDia[dia] = 0;
  ordenPorDia[dia]++;
  filas.push([
    dia,
    ordenPorDia[dia],
    ex.nombre_es,
    ex.dataset,
    ex.series,
    ex.reps,
    ex.peso_kg,
    ex.descanso_s,
    ex.notas || "",
  ]);
}

const wsData = [headers, ...filas];
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Ancho de columnas
ws["!cols"] = [
  { wch: 12 },  // dia
  { wch: 6 },   // orden
  { wch: 40 },  // nombre_es
  { wch: 50 },  // dataset
  { wch: 8 },   // series
  { wch: 6 },   // reps
  { wch: 10 },  // peso_kg
  { wch: 12 },  // descanso_s
  { wch: 55 },  // notas
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Rutina");

XLSX.writeFile(wb, "rutina.xlsx");

console.log("✅ rutina.xlsx generado correctamente");
console.log(`   → ${filas.length} ejercicios · ${diasOrden.length} días`);
const totalX = filas.reduce((a, f) => a + f[4], 0);
console.log(`   → Total series/semana: ${totalX}`);
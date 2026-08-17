/* EyeFit — Constantes compartidas (CommonJS + navegador)
   Datos estáticos (límite 300 líneas/archivo). Expone:
   - window.EyeFitConstants + globales sueltas (scripts clásicos)
   - module.exports → Node (tests)
   Todo vive en un IIFE para no colisionar con el scope global. */

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
    Jueves: "#BA68C8", Viernes: "#F0625C", Sábado: "#4DB6AC", Domingo: "#FF8A65"
  };
  const DAY_SHORT = { Lunes: "LUN", Martes: "MAR", Miércoles: "MIÉ", Jueves: "JUE", Viernes: "VIE", Sábado: "SÁB", Domingo: "DOM" };
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
    "barbell bench press": "0025-EIeI8Vf",
    "dumbbell incline bench press": "0314-ns0SIbU",
    "dumbbell seated shoulder press": "0405-znQUdHY",
    "cable standing fly": "0227-Pr9Rhf4",
    "dumbbell lateral raise": "0334-DsgkuIt",
    "cable pushdown (with rope attachment)": "0200-dU605di",
    "barbell full squat": "0043-qXTaZnJ",
    "sled 45° leg press": "0739-10Z2DXU",
    "lever leg extension": "0585-my33uHU",
    "lever lying leg curl": "0586-17lJ1kr",
    "barbell standing calf raise": "1372-8ozhUIZ",
    "barbell bent over row": "0027-eZyBC3j",
    "cable pulldown (pro lat bar)": "0197-qdRxqCj",
    "cable seated row": "0861-fUBheHs",
    "cable standing rear delt row (with rope)": "0233-ZfyAGhK",
    "ez barbell curl": "0447-6TG6x2w",
    "dumbbell hammer curl": "0313-slDvUAU",
    "barbell deadlift": "0032-ila4NZS",
    "barbell glute bridge two legs on bench (male)": "3562-qg2PGl6",
    "barbell good morning": "0044-XlZ4lAC",
    "cable kickback": "0228-Kpajagk",
    "lever seated calf raise": "0594-bOOdeyc",
    "barbell incline bench press": "0047-3TZduzM",
    "pull up (neutral grip)": "0651-0V2YQjW",
    "dumbbell arnold press": "2137-Xy4jlWA",
    "cable lateral raise": "0178-goJ6ezq",
    "cable curl": "0868-G08RZcQ",
    "cable overhead triceps extension (rope attachment)": "0194-2IxROQ1",
    "all fours squad stretch": "1512-qBcKorM",
    "alternate lateral pulldown": "0007-4IKbhHV",
    "ankle circles": "1368-uL9CsKm",
    "archer pull up": "3293-72BC5Za",
    "archer push up": "3294-A9qxk2F",
    "arms apart circular toe touch (male)": "3214-RtyAsy1",
    "assisted chest dip (kneeling)": "0009-PAgTVaK",
    "assisted lying calves stretch": "1708-GxDwDX0",
    "assisted lying glutes stretch": "1709-yn0LjwL",
    "assisted lying gluteus and piriformis stretch": "1710-RQNVT10",
    "assisted parallel close grip pull-up": "0015-vrhHa6D",
    "assisted prone hamstring": "0016-VedGSby",
    "assisted prone lying quads stretch": "1713-YUYAMEj",
    "assisted pull-up": "0017-kiJ4Z2K",
    "assisted seated pectoralis major stretch with stability ball": "1716-RoV1Rfa",
    "assisted side lying adductor stretch": "1712-hC6oYY5",
    "assisted standing chin-up": "1431-7OeHptV",
    "assisted standing pull-up": "1432-f4xtKBj",
    "assisted standing triceps extension (with towel)": "0018-7HcfMBP",
    "assisted triceps dip (kneeling)": "0019-J60bN17",
    "assisted wide-grip chest dip (kneeling)": "2364-PnZJIrk",
    "back extension on exercise ball": "1314-qLpO4vV",
    "back lever": "3297-GaSzzuh",
    "back pec stretch": "1405-chfnQnM",
    "backward jump": "1473-SaDOwk7",
    "balance board": "0020-xAySMB0",
    "band alternating biceps curl": "0968-3omWx6P",
    "band assisted pull-up": "0970-r1XNRYB",
    "band bench press": "1254-khlHMqs",
    "band bent-over hip extension": "0980-wSScovH",
    "band close-grip pulldown": "0974-DptumMx",
    "band close-grip push-up": "0975-ufaxB52",
    "band concentration curl": "0976-kmVVAfu",
    "band fixed back close grip pulldown": "3117-4LoWllp",
    "band fixed back underhand pulldown": "3116-ZH68exZ",
    "band front lateral raise": "0977-sTg7iys",
    "band front raise": "0978-TFA88iB",
    "band hip lift": "1408-E4R8Hz1",
    "band kneeling one arm pulldown": "0983-pmnrOp0",
    "band lying hip internal rotation": "0984-vIICElP",
    "band one arm overhead biceps curl": "0986-UNAB8ak",
    "band one arm single leg split squat": "0987-arsYEd3",
    "band one arm standing low row": "0988-km0sQC0",
    "band one arm twisting chest press": "0989-c16nYGA",
    "band one arm twisting seated row": "0990-DKBwJrL",
    "band pull through": "0991-VtTbiP3",
    "band reverse fly": "0993-sTfvVsG",
    "band seated hip internal rotation": "0996-9gbyYKk",
    "band shoulder press": "0997-peAeMR3",
    "band shrug": "1018-trmte8s",
    "band side triceps extension": "0998-obe5LMq",
    "band single leg calf raise": "0999-9JprnPh",
    "band single leg reverse calf raise": "1000-QsSQWbf",
    "band single leg split squat": "1001-y8bYM8w",
    "band squat": "1004-TUZLh71",
    "band squat row": "1003-w1NOByi",
    "band standing rear delt row": "1022-tc5dYrf",
    "band step-up": "1008-d5bTEPV",
    "band stiff leg deadlift": "1009-kuMiR2T",
    "band straight back stiff leg deadlift": "1023-lHeUULr",
    "band straight leg deadlift": "1010-KUaoUV8",
    "band twisting overhead press": "1012-u4bAmKp",
    "band two legs calf raise - (band under both legs) v. 2": "1369-jl6uxZV",
    "band underhand pulldown": "1013-k6tUeqS",
    "band y-raise": "1017-aHDy5O5",
    "barbell alternate biceps curl": "0023-Yza7XrQ",
    "barbell bench front squat": "0024-Y7YcmIJ",
    "barbell bench squat": "0026-W9pFVv1",
    "barbell bent arm pullover": "1316-cA9FuWG",
    "barbell biceps curl (with arm blaster)": "2407-aee2Fcj",
    "barbell clean and press": "0028-SGY8Zui",
    "barbell clean-grip front squat": "0029-qi996YS",
    "barbell close-grip bench press": "0030-J6Dx1Mu",
    "barbell curl": "0031-25GPyDY",
    "barbell decline bench press": "0033-GrO65fd",
    "barbell decline bent arm pullover": "0034-hMEptv0",
    "barbell decline close grip to skull press": "0035-LMGXZn8",
    "barbell decline pullover": "1255-9sgNE2O",
    "barbell decline wide-grip press": "0036-hl8DUh8",
    "barbell decline wide-grip pullover": "0037-Hj4FOCd",
    "barbell drag curl": "0038-IENzBdA",
    "barbell floor calf raise": "1370-2IHEa2T",
    "barbell front chest squat": "0039-IeTIEqg",
    "barbell front raise": "0041-b2Uoz54",
    "barbell front raise and pullover": "0040-33AzZeV",
    "barbell front squat": "0042-zG0zs85",
    "barbell full squat (back pov)": "1461-DhMl549",
    "barbell full squat (side pov)": "1462-iYzB0Cz",
    "barbell full zercher squat": "1545-vR1vold",
    "barbell glute bridge": "1409-qKBpF7I",
    "barbell guillotine bench press": "0045-GXoaSgn",
    "barbell hack squat": "0046-5VCj6iH",
  };

  /* ---------- API pública ---------- */
  const EyeFitConstants = {
    APODOS, DAY_ORDER, DAY_COLORS, DAY_SHORT, WEEKDAY_NAMES,
    DEFAULT_ROUTINE, INSTRUCCIONES, ALTERNATIVAS, EMBEDDED_IMAGES
  };

  /* Export para Node (tests) */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = EyeFitConstants;
  }

  /* Export para navegador (compartido con utils.js e index.html) */
  if (global) {
    if (!global.EyeFitConstants) global.EyeFitConstants = EyeFitConstants;
    // Constantes globales: fuente única de verdad para scripts clásicos
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


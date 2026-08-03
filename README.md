# 👁️ EyeFit

App de entrenamiento **privada y offline** para iPhone 15 (estándar), en español, con rutinas **Lunes–Viernes** editables desde una **hoja de cálculo (.xlsx)**.

---

## ✨ Características

| Funcionalidad | Descripción |
|---|---|
| 📅 **Rutina semanal** | Lunes → Viernes, con ejercicios, series, reps, peso (kg) y descanso |
| 📊 **Hoja de cálculo editable** | La rutina vive en `rutina.xlsx` — edítala en Excel/Numbers/Google Sheets |
| 🏋️ **Sesión de entrenamiento** | Cronómetro de sesión + cronómetro secundario de descanso entre series |
| 📸 **Visuales de ejercicios** | Imágenes e instrucciones en español del [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (1.324 ejercicios) |
| 📈 **Historial** | Cada sesión se guarda localmente: fecha, día, ejercicios, series × kg × reps, tiempo total |
| 🔒 **Privado y seguro** | Sin cuentas, sin nube, sin datos personales. Todo vive en `localStorage` del dispositivo |
| 🔢 **PIN opcional** | Bloqueo de acceso con código de 4 dígitos |
| 📱 **PWA offline** | Instalable en la pantalla de inicio del iPhone y funciona sin conexión |
| 🇪🇸 **En español** | Interfaz completa en español |

---

## 🚀 Cómo usar

### 1. Abrir la app

Simplemente abre `index.html` con un navegador, o sirve la carpeta con un servidor local:

```bash
# Opción rápida — servidor local Python
python3 -m http.server 8000
# Luego abre http://localhost:8000
```

### 2. Instalar en iPhone 15 (pantalla de inicio)

1. Abre la app en Safari
2. Toca el botón **Compartir** (cuadro con flecha ↑)
3. Desplázate y toca **Añadir a pantalla de inicio**
4. Toca **Añadir**

La app se abre como una aplicación nativa, en modo standalone, sin barra del navegador.

### 3. Entrenar

1. Ves a **Rutina** para ver el día seleccionado (Lunes–Viernes)
2. Toca **🏋️ Iniciar sesión**
3. Marca cada serie completada → se lanza el **cronómetro de descanso** automáticamente
4. Ajusta peso/reps por serie con los botones **− / +**
5. Al terminar la última serie del último ejercicio, la sesión se guarda en **Historial**

---

## 📊 Editar la rutina (hoja de cálculo)

### Archivo: `rutina.xlsx`

Abre `rutina.xlsx` en **Microsoft Excel**, **Numbers (Mac/iPhone)** o **Google Sheets** y edita las filas.

| Columna | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `dia` | texto | `Lunes` | Día de la semana (Lunes → Viernes) |
| `orden` | número | `1` | Posición del ejercicio dentro del día |
| `nombre_es` | texto | `Press banca plano con barra` | Nombre mostrado en la app |
| `dataset` | texto | `barbell bench press` | Nombre en inglés del ejercicio (para la imagen) |
| `series` | número | `3` | Series por ejercicio |
| `reps` | número | `8` | Repeticiones objetivo |
| `peso_kg` | número | `40` | Peso inicial en kg |
| `descanso_s` | número | `180` | Descanso entre series (segundos) |
| `notas` | texto | `Codos a 45°` | Nota opcional |

### ¿Cómo aplicar los cambios?

- **Opción A (local):** Reemplaza el archivo `rutina.xlsx` de la carpeta y recarga la app.
- **Opción B (desde el móvil):** En **Ajustes** → **Importar rutina (.xlsx)**, sube el archivo editado desde Archivos/Drive.
- **Opción C (descargar):** En **Ajustes** → **Descargar rutina (.xlsx)** obtienes la plantilla actual para editarla donde quieras.

### Regenerar la hoja de cálculo

Si quieres editar la rutina en código y regenerar el archivo:

```bash
npm install
node generate_rutina.js
```

Esto modifica la `RUTINA` embebida en `generate_rutina.js` y genera un nuevo `rutina.xlsx`.

---

## 🔍 Cómo se encuentran los visuales

1. La app busca la imagen/instrucción del ejercicio usando la columna `dataset` (nombre en inglés).
2. Consulta el dataset remoto `exercises.json` (1.324 ejercicios) desde `github.com/hasaneyldrm/exercises-dataset`.
3. El resultado se cachea en `localStorage` para funcionamiento offline.
4. Un mapa embebido de imágenes cubre la rutina por defecto como fallback.

---

## 🔒 Privacidad

- ❌ **Sin registro** — no pides ni almacenas datos personales
- ❌ **Sin nube** — nada sale de tu dispositivo
- ✅ Todos los datos (rutina importada, historial, PIN) se guardan en `localStorage`
- ✅ Al borrar los datos del sitio en Safari, todo desaparece definitivamente
- ✅ Funcionamiento **100% offline** opcional (Service Worker)

---

## 📁 Estructura del proyecto

```
EyeFit/
├── index.html            ★ La app completa (PWA single-file)
├── rutina.xlsx           ★ La hoja de cálculo de la rutina (edítala aquí)
├── sw.js                 Service Worker (caché offline)
├── xlsx.full.min.js      Librería SheetJS (parseo de .xlsx)
├── generate_rutina.js    Script para regenerar rutina.xlsx
├── package.json          Dependencias Node (solo para regenerar el .xlsx)
└── README.md             Esta documentación
```

---

## 🧰 Stack técnico

- **100% HTML + CSS + JavaScript** (vanilla, sin frameworks)
- **SheetJS** ([SheetJS Community Edition](https://sheetjs.com/)) para leer/escribir .xlsx
- **exercises-dataset** ([GitHub](https://github.com/hasaneyldrm/exercises-dataset)) — CC-BY-4.0, 1.324 ejercicios con imágenes e instrucciones multilingües
- **PWA**: manifest embebido + Service Worker para offline
- **Diseño iPhone 15**: max-width 393px, safe-areas (Dynamic Island + home indicator), bottom tab bar, haptics

---

## ⚡ Rutina incluida (por defecto)

| Día | Tipo | Ejercicios |
|---|---|---|
| **Lunes** | Tren Superior A (Empuje) | Press banca, Press inclinado mancuernas, Press militar, Aperturas polea, Elevaciones laterales, Ext. tríceps |
| **Martes** | Tren Inferior A (Cuádriceps) | Sentadilla, Prensa 45°, Ext. cuádriceps, Curl femoral, Gemelos de pie |
| **Miércoles** | Tren Superior B (Tirón) | Remo barra, Jalón al pecho, Remo polea, Face pull, Curl EZ, Curl martillo |
| **Jueves** | Tren Inferior B (Posterior) | Peso muerto, Hip thrust, Buenos días, Patada glúteo, Gemelos sentado |
| **Viernes** | Tren Superior C (Híbrido) | Press inclinado, Dominadas, Press Arnold, Elev. polea, Curl polea, Ext. overhead |

---

*Hecho con 💪 para el gimnasio · 100% local · 100% tuyo*
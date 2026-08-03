# 👁️ EyeFit

App de entrenamiento **privada** para iPhone 15 (estándar), en español, con rutinas **Lunes–Viernes** editables desde una **hoja de cálculo (.xlsx)** y sincronización opcional en la nube.

---

## ✨ Características

| Funcionalidad | Descripción |
|---|---|
| 📅 **Rutina semanal** | Lunes → Viernes, con ejercicios, series, reps, peso (kg) y descanso |
| 📊 **Hoja de cálculo editable** | La rutina vive en `rutina.xlsx` — edítala en Excel/Numbers/Google Sheets |
| 🏋️ **Sesión de entrenamiento** | Cronómetro de sesión + cronómetro secundario de descanso entre series |
| 📸 **Visuales de ejercicios** | Imágenes e instrucciones en español del [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (1.324 ejercicios) |
| 📈 **Historial + progresión** | Cada sesión se guarda con fecha, día, ejercicios, series × kg × reps. Al repetir un ejercicio, se cargan automáticamente los últimos pesos/reps reales de cada serie |
| 🔐 **Cuentas con Supabase** | Registro por email + confirmación. Tu rutina e historial se sincronizan entre dispositivos |
| 📱 **PWA offline** | Instalable en la pantalla de inicio del iPhone y funciona sin conexión |
| 🇪🇸 **En español** | Interfaz completa en español |

---

## 🚀 Cómo usar

### 1. Abrir la app

Sirve la carpeta con un servidor local:

```bash
# Opción rápida — servidor local Python
python3 -m http.server 8000
# Luego abre http://localhost:8000
```

> ⚠️ La app usa Supabase y el Service Worker; para probar el registro/sincronización es recomendable servirla por HTTPS o localhost (`http://localhost` también funciona con los flujos de Supabase).
>
> ℹ️ Desde la **v1.3.1** el dataset se cachea en la **Cache API** (no en `localStorage`), evitando el límite de ~5MB de iOS.

### 2. Instalar en iPhone 15 (pantalla de inicio)

1. Abre la app en Safari
2. Toca el botón **Compartir** (cuadro con flecha ↑)
3. Desplázate y toca **Añadir a pantalla de inicio**
4. Toca **Añadir**

La app se abre como una aplicación nativa, en modo standalone, sin barra del navegador.

### 3. Cuenta (opcional)

- **Acceder / Registrarse**: crea una cuenta con email y contraseña para sincronizar en la nube.
- **Continuar sin conexión**: la app funciona 100% local en este dispositivo, sin cuenta.

### 4. Entrenar

1. Ves a **Rutina** para ver el día seleccionado (Lunes–Viernes)
2. Toca **🏋️ Iniciar sesión**
3. Al empezar cada ejercicio, los **pesos/reps se cargan de tu última sesión** de ese ejercicio (si existe historial)
4. Marca cada serie completada → se lanza el **cronómetro de descanso** automáticamente
5. Ajusta peso/reps por serie con los botones **− / +** (los cambios quedan guardados para la próxima vez)
6. Al terminar la última serie del último ejercicio, la sesión se guarda en **Historial**

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
| `peso_kg` | número | `40` | Peso inicial en kg (solo se usa si no hay historial) |
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

## 🗄️ Backend (Supabase)

La app usa Supabase para autenticación y sincronización. El SQL de setup está en `supabase_setup.sql` (tablas `rutinas`, `sesiones`, RLS y triggers).

Pasos tras crear un proyecto en Supabase:

1. Ejecuta `supabase_setup.sql` en el SQL Editor del dashboard.
2. En **Authentication → Providers**, deja habilitado el email.
3. En **Authentication → Emails**, configura la plantilla de confirmación (puedes usar `supabase_email_template.html` como base).
4. Actualiza `SUPABASE_URL` y `SUPABASE_ANON_KEY` en `index.html` con los valores de tu proyecto.

---

## 🔍 Cómo se encuentran los visuales

1. La app busca la imagen/instrucción del ejercicio usando la columna `dataset` (nombre en inglés).
2. Consulta el dataset remoto `exercises.json` (1.324 ejercicios) desde `github.com/hasaneyldrm/exercises-dataset`.
3. El resultado se cachea en la **Cache API** para funcionamiento offline.
4. Un mapa embebido de imágenes cubre la rutina por defecto como fallback.

---

## 🔒 Privacidad

- ✅ Sin cuenta = 100% local: tus datos (rutina, historial) viven en `localStorage` del dispositivo.
- ✅ Con cuenta = sincronización en la nube (Supabase) usando autenticación segura (bcrypt + JWT).
- ✅ Al borrar los datos del sitio en Safari, todo desaparece definitivamente.
- ✅ Funcionamiento **100% offline** opcional (Service Worker).

---

## 📁 Estructura del proyecto

```
EyeFit/
├── index.html            ★ La app completa (PWA single-file)
├── utils.js              Utilidades puras compartidas (navegador + tests)
├── rutina.xlsx           ★ La hoja de cálculo de la rutina (edítala aquí)
├── sw.js                 Service Worker (caché offline)
├── xlsx.full.min.js      Librería SheetJS (parseo de .xlsx)
├── generate_rutina.js    Script para regenerar rutina.xlsx
├── generate_icons.js     Script para regenerar los iconos PNG
├── supabase_setup.sql    Setup SQL del backend (tablas, RLS, triggers)
├── supabase_email_template.html  Plantilla de email de confirmación (opcional)
├── tests/                Tests unitarios (node:test → `npm test`)
├── package.json          Dependencias Node (solo para regenerar el .xlsx)
└── README.md             Esta documentación
```

---

## 🧰 Stack técnico

- **100% HTML + CSS + JavaScript** (vanilla, sin frameworks)
- **Tests unitarios** con `node:test` (ejecuta `npm test`)
- **Supabase** para auth (email + contraseña) y sincronización de rutina/historial
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

*Hecho con 💪 para el gimnasio · Local y sincronizado en la nube*
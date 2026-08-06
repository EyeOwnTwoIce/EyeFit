# 👁️ EyeFit

App de entrenamiento **privada** para iPhone 15 (estándar) y Android, en español, con rutinas personalizadas editables desde una **hoja de cálculo (.xlsx)**, historial con progresión 1RM y sincronización opcional en la nube.

---

## ✨ Características

| Funcionalidad | Descripción |
|---|---|
| 📅 **Rutina semanal** | Carrusel de 7 días con listado completo de ejercicios, series, reps, peso (kg) y descanso. Preselecciona automáticamente el día actual |
| 📊 **Hoja de cálculo editable** | La rutina vive en `rutina.xlsx` — edítala en Excel/Numbers/Google Sheets e impórtala |
| 🏋️ **Sesión de entrenamiento** | Cronómetro de sesión + descanso entre series, carga automática de pesos/reps de tu última sesión |
| 📸 **Visuales de ejercicios** | GIFs y miniaturas en color invertido para coherencia visual con el tema oscuro |
| 📈 **Historial + progresión** | Sesiones con fecha, día, ejercicios y series. Elimina sesiones individuales con sincronización automática en la nube. Muestra el día actual por defecto |
| 🏆 **1RM con fórmula Epley** | `1RM = peso × (1 + reps/30)` — la fórmula completa se muestra en cada dato |
| 🔐 **Cuentas con Supabase** | Registro por email + confirmación. Rutina e historial sincronizados entre dispositivos |
| 📱 **PWA offline** | Instalable en pantalla de inicio (iOS y Android), funciona sin conexión |
| 🔔 **Notificaciones push** | Aviso por Web Push (iOS 16.4+) cuando hay una versión nueva tras un deploy |
| 🇪🇸 **En español** | Interfaz, fechas y números con formato español (semana empieza en lunes, coma decimal) |

---

## 🚀 Cómo usar

### 1. Abrir la app

Sirve la carpeta con un servidor local:

```bash
# Opción rápida — servidor local Python
python3 -m http.server 8000
# Luego abre http://localhost:8000
```

> ⚠️ La app usa Supabase y el Service Worker; para probar registro/sincronización es recomendable servirla por HTTPS o localhost.

### 2. Instalar en iPhone / Android

1. Abre la app en Safari o Chrome
2. Toca **Compartir** → **Añadir a pantalla de inicio**
3. La app se abre como aplicación nativa, standalone

### 3. Cuenta (opcional)

- **Acceder / Registrarse**: crea una cuenta con email y contraseña para sincronizar en la nube.
- **Continuar sin conexión**: funciona 100% local, sin cuenta.

### 4. Entrenar

1. Ve a **Rutina** — el día actual se selecciona automáticamente
2. Toca **🏋️ Entrenar**
3. Los pesos/reps se cargan de tu última sesión de cada ejercicio
4. Marca cada serie completada → cronómetro de descanso automático
5. Al terminar la última serie, la sesión se guarda en **Historial**

---

## 📊 Editar la rutina (hoja de cálculo)

### Archivo: `rutina.xlsx`

Abre `rutina.xlsx` en **Excel**, **Numbers** o **Google Sheets** y edita las filas.

| Columna | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `dia` | texto | `Lunes` | Día de la semana (Lunes → Viernes) |
| `orden` | número | `1` | Posición del ejercicio dentro del día |
| `nombre_es` | texto | `Press banca` | Nombre visible en la app |
| `dataset` | texto | `barbell bench press` | Clave del dataset de ejercicios |
| `series` | número | `3` | Series del ejercicio |
| `reps` | número | `8` | Repeticiones objetivo |
| `peso_kg` | número | `40` | Peso inicial en kg |
| `descanso_s` | número | `180` | Descanso entre series (segundos) |
| `notas` | texto | `Codos a 45°` | Notas de técnica |

> ℹ️ El archivo `rutina.xlsx` se genera desde `src/utils.js` (constante `DEFAULT_ROUTINE`) con el script `tools/generate_rutina.js`.

### Importar / Exportar

- **Importar**: en la app ve a **Ajustes → Rutina → 📥 Importar**
- **Exportar**: en la app ve a **Ajustes → Rutina → 📤 Exportar**

---

## 🔧 Desarrollo

### Requisitos

- **Node.js 18+**
- npm

### Instalar dependencias

```bash
npm install
```

### Ejecutar tests

```bash
npm test
```

### Build de producción

```bash
npm run build
```

El build genera la carpeta `dist/` lista para desplegar.

### Deploy

El CI (`.github/workflows/ci.yml`) ejecuta tests + e2e + build y despliega a **GitHub Pages** automáticamente al hacer push a `main`.

---

## 📁 Estructura del proyecto

```
EyeFit/
├── src/                    ★ Fuentes de la app
│   ├── index.html          Plantilla HTML (build inyecta CSS/JS hasheados)
│   ├── app.js              Lógica principal de la app
│   ├── styles.css          Estilos (tema iOS dark)
│   ├── db.js               Persistencia IndexedDB
│   ├── sw.js               Service Worker (caché offline + Background Sync)
│   └── utils.js            Utilidades puras compartidas (navegador + tests)
├── public/                 Archivos publicados tal cual
│   ├── manifest.json       Manifest PWA estático (instalable)
│   ├── rutina.xlsx         ★ Hoja de cálculo de la rutina (edítala aquí)
│   ├── robots.txt
│   ├── sitemap.xml
│   └── icons/              Iconos PNG
├── data/                   Datasets y plantillas
│   ├── slim-dataset.json   Dataset de ejercicios (1.080)
│   ├── exercise-meta.json  Metadatos (músculo, equipamiento)
│   └── supabase_email_template.html
├── vendor/                 Librerías de terceros
│   ├── xlsx.full.min.js    SheetJS
│   └── supabase.js         SDK de Supabase
├── tools/                  Scripts de build y utilidades CLI
│   ├── build.js            Pipeline esbuild → dist/
│   ├── generate_rutina.js  Regenera public/rutina.xlsx
│   ├── generate_icons.js   Regenera los iconos PNG
│   ├── generate_slim_dataset.js
│   └── enrich_dataset.js
├── supabase/               Config del backend
│   └── setup.sql           Setup SQL (tablas, RLS, triggers)
├── tests/                  Tests unitarios (node:test → `npm test`)
│   └── e2e/                Tests end-to-end (Playwright)
├── dist/                   Build output (generado por `npm run build`)
├── .github/workflows/ci.yml
├── CHANGELOG.md            Registro de cambios
└── README.md               Esta documentación
```

---

## 🧰 Stack técnico

- **100% HTML + CSS + JavaScript** (vanilla, sin frameworks)
- **Tests unitarios** con `node:test` (ejecuta `npm test`)
- **Supabase** para auth (email + contraseña) y sincronización de rutina/historial
- **SheetJS** ([SheetJS Community Edition](https://sheetjs.com/)) para leer/escribir .xlsx
- **exercises-dataset** ([GitHub](https://github.com/hasaneyldrm/exercises-dataset)) — CC-BY-4.0, 1.324 ejercicios con imágenes e instrucciones multilingües
- **PWA**: manifest.json estático + Service Worker con offline shell y Background Sync
- **Diseño iOS dark**: botonera al ras del borde inferior, safe-areas, tema oscuro

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

## 📦 Versiones

Ver [CHANGELOG.md](CHANGELOG.md) para el historial completo de versiones.

*Hecho con 💪 para el gimnasio · Local y sincronizado en la nube*

# 📋 Changelog de EyeFit

Todas las versiones notables de EyeFit se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

---

## [2.1.0] — 2026-06-08

### ✨ Añadido
- **Botonera al ras del borde inferior**: la barra de navegación se ancla al borde inferior de la pantalla, respetando safe-areas.
- **Todos los GIFs y miniaturas en color invertido**: selector CSS unificado que cubre todos los contextos de imagen (cards de rutina, carrusel, picker, vista previa, zoom, confirmación de sesión, historial).
- **Formato español completo**: semana empieza en lunes en el calendario del historial (L M X J V S D), pesos con coma decimal (ej. 18,5 kg), todas las fechas con locale `es-ES`.
- **Fórmula completa de 1RM (Epley)**: se muestra `1RM = peso × (1 + reps/30)` en tooltips, cards de rutina, historial y toast informativo.
- **Rutina semanal**: botón "Entrenar" habilitado para cualquier día (sin "solo hoy"), cards del carrusel muestran listado completo de ejercicios (sin límite de 4 + "+N").
- **Ajustes**: chips de días abreviados (L M X J V S D), importar/exportar en una sola card, borrar/restablecer en una sola card.
- **Historial**: muestra por defecto el día actual, botón explícito de eliminar sesión (🗑️) junto al de editar, autosync tras borrado.

### 🐛 Corregido
- **GIF de "Patada de glúteo"**: el mapeo apuntaba a un tríceps kickback (ID 0860). Corregido a "cable standing hip extension" (ID 0228), que es la extensión de cadera en polea real.

### 🔧 Mejorado
- README reescrito completo.
- CHANGELOG.md creado.

---

## [2.0.0] — 2026-04-28

### ✨ Añadido
- Fases A-F completas: build esbuild → dist/, offline-first, IndexedDB, accesibilidad, onboarding, E2E.
- Manifest PWA estático (`manifest.json`), instalable en Chromium/Android.
- Service Worker con offline shell y Background Sync para subida de sesiones pendientes.
- Historial multi-sesión por día, edición completa de sesión (sustituir ejercicio, modificar series).
- Carrusel de días en rutina semanal con drag & drop para reordenar ejercicios.
- Vista previa de entrenamiento antes de iniciar sesión.
- Notificaciones push Web Push (iOS 16.4+) al actualizar la app.
- Tests unitarios ampliados (db.js, constantes, RLS) y E2E con Playwright.

### 🐛 Corregido
- Variantes rompían historial (fix).
- Desduplicación de utils.js (IIFE).
- Sync robusto de historial y rutina.
- Accesibilidad Lighthouse 0.89 → 1.0.

---

## [1.4.0] — 2025-12-15

### ✨ Añadido
- GIF ampliable con zoom overlay (tap para ver a pantalla completa).
- Instrucciones en sesión con botón de mostrar/ocultar.
- Descanso inter-ejercicio.
- Swipe-to-delete de series en sesión activa.
- Reordenar ejercicios pendientes con flechas.
- Cronómetro por timestamps (robusto a pausas y cierres).
- Cuenta de testing.

---

## [1.3.0] — 2025-09-20

### ✨ Añadido
- Cronómetro de descanso entre series en barra superior.
- Alternativas de ejercicios con GIF.
- Guardado automático de sesión.
- Control de series (añadir/eliminar).
- Progresión de pesos/reps desde historial.

---

## [1.2.0] — 2025-06-01

### ✨ Añadido
- GIFs animados de ejercicios.
- Historial de entrenamiento con fecha, día y series.
- Mejoras de UI generales.

---

## [1.1.0] — 2025-03-10

### ✨ Añadido
- Login con Supabase (email + contraseña).
- Sincronización en la nube de rutina e historial.
- Cola offline para sesiones pendientes.
- Verificación de email obligatoria.

---

## [1.0.0] — 2025-01-15

### ✨ Añadido
- Versión inicial: rutina Lunes–Viernes, sesión de entrenamiento, cronómetro, historial local.
- PWA básica con Service Worker.

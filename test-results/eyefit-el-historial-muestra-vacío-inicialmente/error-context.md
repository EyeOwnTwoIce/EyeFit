# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: eyefit.spec.js >> el historial muestra vacío inicialmente
- Location: tests/eyefit.spec.js:67:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.empty-state')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.empty-state')

```

```yaml
- banner:
  - heading "👁️ EyeFit" [level=1]
  - text: Entrenamiento Lunes-Viernes · Libreta privada offline En línea
- main:
  - heading "📅 Rutina Semanal" [level=2]
  - text: LUN Lunes MAR Martes MIÉ Miércoles JUE Jueves VIE Viernes Lunes 19 series · 6 ejercicios
  - img "Press banca plano con barra"
  - text: 1 Press banca plano con barra 3 series 8 reps ⚖️ 40 kg ⏱ 3min Codos a 45-75°, retracción escapular. Compuesto principal.
  - button "📖 Instrucciones"
  - img "Press inclinado con mancuernas"
  - text: 2 Press inclinado con mancuernas 3 series 10 reps ⚖️ 18 kg ⏱ 2min Porción clavicular del pectoral. Bajar con control.
  - button "📖 Instrucciones"
  - img "Press militar sentado con mancuernas"
  - text: 3 Press militar sentado con mancuernas 3 series 10 reps ⚖️ 14 kg ⏱ 2min No arquear la espalda. Rango completo.
  - button "📖 Instrucciones"
  - img "Aperturas en polea alta (pecho)"
  - text: 4 Aperturas en polea alta (pecho) 3 series 15 reps ⚖️ 8 kg ⏱ 1m 30s Tensión continua. Estirar bien el pecho abajo.
  - button "📖 Instrucciones"
  - img "Elevaciones laterales con mancuernas"
  - text: 5 Elevaciones laterales con mancuernas 4 series 15 reps ⚖️ 6 kg ⏱ 1min Sin balanceo. Hasta paralelo con el suelo.
  - button "📖 Instrucciones"
  - img "Ext. tríceps en polea (cuerda)"
  - text: 6 Ext. tríceps en polea (cuerda) 3 series 15 reps ⚖️ 12 kg ⏱ 1m 15s Codos fijos. Abrir al final (doble tensión).
  - button "📖 Instrucciones"
  - button "🏋️ Iniciar sesión — Lunes"
- navigation:
  - button "📅 Rutina"
  - button "🏋️ Sesión"
  - button "📈 Historial"
  - button "⚙️ Ajustes"
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | /* ════════════════════════════════════════════════════════════════
  4   |    EyeFit — Tests de interfaz (Playwright)
  5   |    ════════════════════════════════════════════════════════════════ */
  6   | 
  7   | test.beforeEach(async ({ page }) => {
  8   |   // Limpiar localStorage para cada test (estado limpio)
  9   |   await page.addInitScript(() => localStorage.clear());
  10  | });
  11  | 
  12  | test('la app carga correctamente', async ({ page }) => {
  13  |   await page.goto('/');
  14  |   await expect(page.locator('header h1')).toContainText('EyeFit');
  15  |   await expect(page.locator('.tabbar')).toBeVisible();
  16  |   await expect(page.locator('[data-tab="rutina"]')).toBeVisible();
  17  |   await expect(page.locator('[data-tab="sesion"]')).toBeVisible();
  18  |   await expect(page.locator('[data-tab="historial"]')).toBeVisible();
  19  |   await expect(page.locator('[data-tab="ajustes"]')).toBeVisible();
  20  | });
  21  | 
  22  | test('la rutina muestra Lunes a Viernes', async ({ page }) => {
  23  |   await page.goto('/');
  24  |   // Esperar a que se cargue la rutina desde xlsx o fallback
  25  |   await page.waitForSelector('.week-grid');
  26  |   const weekCells = page.locator('.week-cell');
  27  |   await expect(weekCells).toHaveCount(5);
  28  |   const labels = await weekCells.locator('.d').allTextContents();
  29  |   expect(labels.join(',')).toContain('LUN');
  30  |   expect(labels.join(',')).toContain('MAR');
  31  |   expect(labels.join(',')).toContain('MIÉ');
  32  |   expect(labels.join(',')).toContain('JUE');
  33  |   expect(labels.join(',')).toContain('VIE');
  34  | });
  35  | 
  36  | test('seleccionar un día cambia los ejercicios', async ({ page }) => {
  37  |   await page.goto('/');
  38  |   await page.waitForSelector('.week-cell');
  39  |   // Click en Martes
  40  |   await page.locator('.week-cell', { hasText: 'MAR' }).click();
  41  |   await expect(page.locator('.day-name')).toContainText('Martes');
  42  |   const exNames = await page.locator('.ex-name').allTextContents();
  43  |   expect(exNames.some(n => n.includes('Sentadilla'))).toBeTruthy();
  44  | });
  45  | 
  46  | test('iniciar sesión desde Rutina', async ({ page }) => {
  47  |   await page.goto('/');
  48  |   await page.waitForSelector('[data-start-session]');
  49  |   await page.locator('[data-start-session]').first().click();
  50  |   // Debe mostrar la vista de sesión activa con cronómetro
  51  |   await expect(page.locator('.session-chrono')).toBeVisible();
  52  |   await expect(page.locator('.session-day')).toContainText('Lunes');
  53  | });
  54  | 
  55  | test('marcar serie completada inicia cronómetro de descanso', async ({ page }) => {
  56  |   await page.goto('/');
  57  |   await page.waitForSelector('[data-start-session]');
  58  |   await page.locator('[data-start-session]').first().click();
  59  |   await page.waitForSelector('[data-set-done]');
  60  |   // Marcar la primera serie
  61  |   await page.locator('[data-set-done]').first().click();
  62  |   // El banner de descanso debería aparecer
  63  |   await expect(page.locator('.rest-banner')).toHaveClass(/show/);
  64  |   await expect(page.locator('#restTime')).toBeVisible();
  65  | });
  66  | 
  67  | test('el historial muestra vacío inicialmente', async ({ page }) => {
  68  |   await page.goto('/');
  69  |   await page.locator('[data-tab="historial"]').click();
> 70  |   await expect(page.locator('.empty-state')).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  71  |   await expect(page.locator('.empty-state')).toContainText('Aún no hay sesiones');
  72  | });
  73  | 
  74  | test('los ajustes muestran import/export de xlsx', async ({ page }) => {
  75  |   await page.goto('/');
  76  |   await page.locator('[data-tab="ajustes"]').click();
  77  |   await expect(page.locator('[data-tab="ajustes"]')).toBeVisible();
  78  |   await expect(page.locator('.title')).toContainText('Ajustes');
  79  |   await expect(page.locator('[data-import-xlsx]')).toBeVisible();
  80  |   await expect(page.locator('[data-export-xlsx]')).toBeVisible();
  81  | });
  82  | 
  83  | test('la app carga la rutina desde rutina.xlsx', async ({ page }) => {
  84  |   await page.goto('/');
  85  |   // Esperar a que la app cargue y renderice
  86  |   await page.waitForSelector('.week-grid', { timeout: 15000 });
  87  |   // El total de ejercicios de la rutina xlsx debe ser 28 (Lunes 6 + Martes 5 + Miércoles 6 + Jueves 5 + Viernes 6)
  88  |   const ejercicioLocator = page.locator('.ex-row');
  89  |   // Solo verificar el día seleccionado (normalmente Lunes con 6 ejercicios)
  90  |   await page.locator('.week-cell', { hasText: 'LUN' }).click();
  91  |   await expect(ejercicioLocator.first()).toBeVisible();
  92  | });
  93  | 
  94  | test('los ejercicios muestran imagen del dataset', async ({ page }) => {
  95  |   await page.goto('/');
  96  |   await page.waitForSelector('.week-grid');
  97  |   // Esperar a que cargue alguna imagen (o fallback emoji)
  98  |   await page.waitForSelector('.ex-img', { timeout: 15000 });
  99  |   const imgs = await page.locator('.ex-img').count();
  100 |   expect(imgs).toBeGreaterThan(0);
  101 | });
  102 | 
  103 | test('seleccionar sesión muestra días disponibles', async ({ page }) => {
  104 |   await page.goto('/');
  105 |   await page.locator('[data-tab="sesion"]').click();
  106 |   await page.waitForSelector('.select-day-btn');
  107 |   const dayBtns = await page.locator('.select-day-btn').allTextContents();
  108 |   expect(dayBtns.length).toBeGreaterThanOrEqual(5);
  109 |   expect(dayBtns.join(',').includes('Lunes')).toBeTruthy();
  110 | });
```
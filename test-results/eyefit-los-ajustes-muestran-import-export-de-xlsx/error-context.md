# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: eyefit.spec.js >> los ajustes muestran import/export de xlsx
- Location: tests/eyefit.spec.js:74:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('.title')
Expected substring: "Ajustes"
Received string:    "📅 Rutina Semanal"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('.title')
    9 × locator resolved to <h2 class="title">📅 Rutina Semanal</h2>
      - unexpected value "📅 Rutina Semanal"

```

```yaml
- heading "📅 Rutina Semanal" [level=2]
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
  70  |   await expect(page.locator('.empty-state')).toBeVisible();
  71  |   await expect(page.locator('.empty-state')).toContainText('Aún no hay sesiones');
  72  | });
  73  | 
  74  | test('los ajustes muestran import/export de xlsx', async ({ page }) => {
  75  |   await page.goto('/');
  76  |   await page.locator('[data-tab="ajustes"]').click();
  77  |   await expect(page.locator('[data-tab="ajustes"]')).toBeVisible();
> 78  |   await expect(page.locator('.title')).toContainText('Ajustes');
      |                                        ^ Error: expect(locator).toContainText(expected) failed
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
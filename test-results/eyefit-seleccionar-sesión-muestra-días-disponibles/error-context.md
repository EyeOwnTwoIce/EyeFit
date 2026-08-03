# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: eyefit.spec.js >> seleccionar sesión muestra días disponibles
- Location: tests/eyefit.spec.js:103:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.select-day-btn') to be visible

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - heading "👁️ EyeFit" [level=1] [ref=e4]
    - generic [ref=e5]:
      - text: Entrenamiento Lunes-Viernes · Libreta privada offline
      - generic [ref=e6]: En línea
  - main [ref=e9]:
    - generic [ref=e10]:
      - heading "📅 Rutina Semanal" [level=2] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13] [cursor=pointer]:
          - generic [ref=e14]: LUN
          - generic [ref=e15]: Lunes
        - generic [ref=e16] [cursor=pointer]:
          - generic [ref=e17]: MAR
          - generic [ref=e18]: Martes
        - generic [ref=e19] [cursor=pointer]:
          - generic [ref=e20]: MIÉ
          - generic [ref=e21]: Miércoles
        - generic [ref=e22] [cursor=pointer]:
          - generic [ref=e23]: JUE
          - generic [ref=e24]: Jueves
        - generic [ref=e25] [cursor=pointer]:
          - generic [ref=e26]: VIE
          - generic [ref=e27]: Viernes
      - generic [ref=e28]:
        - generic [ref=e31] [cursor=pointer]:
          - generic [ref=e32]: Lunes
          - generic [ref=e33]: 19 series · 6 ejercicios
        - generic [ref=e34]:
          - generic [ref=e36]:
            - img "Press banca plano con barra" [ref=e38]
            - generic [ref=e39]:
              - generic [ref=e40]:
                - generic [ref=e41]: "1"
                - generic [ref=e42]: Press banca plano con barra
              - generic [ref=e43]:
                - generic [ref=e44]: 3 series
                - generic [ref=e45]: 8 reps
                - generic [ref=e46]: ⚖️ 40 kg
                - generic [ref=e47]: ⏱ 3min
              - generic [ref=e48]: Codos a 45-75°, retracción escapular. Compuesto principal.
              - button "📖 Instrucciones" [ref=e49] [cursor=pointer]
          - generic [ref=e52]:
            - img "Press inclinado con mancuernas" [ref=e54]
            - generic [ref=e55]:
              - generic [ref=e56]:
                - generic [ref=e57]: "2"
                - generic [ref=e58]: Press inclinado con mancuernas
              - generic [ref=e59]:
                - generic [ref=e60]: 3 series
                - generic [ref=e61]: 10 reps
                - generic [ref=e62]: ⚖️ 18 kg
                - generic [ref=e63]: ⏱ 2min
              - generic [ref=e64]: Porción clavicular del pectoral. Bajar con control.
              - button "📖 Instrucciones" [ref=e65] [cursor=pointer]
          - generic [ref=e68]:
            - img "Press militar sentado con mancuernas" [ref=e70]
            - generic [ref=e71]:
              - generic [ref=e72]:
                - generic [ref=e73]: "3"
                - generic [ref=e74]: Press militar sentado con mancuernas
              - generic [ref=e75]:
                - generic [ref=e76]: 3 series
                - generic [ref=e77]: 10 reps
                - generic [ref=e78]: ⚖️ 14 kg
                - generic [ref=e79]: ⏱ 2min
              - generic [ref=e80]: No arquear la espalda. Rango completo.
              - button "📖 Instrucciones" [ref=e81] [cursor=pointer]
          - generic [ref=e84]:
            - img "Aperturas en polea alta (pecho)" [ref=e86]
            - generic [ref=e87]:
              - generic [ref=e88]:
                - generic [ref=e89]: "4"
                - generic [ref=e90]: Aperturas en polea alta (pecho)
              - generic [ref=e91]:
                - generic [ref=e92]: 3 series
                - generic [ref=e93]: 15 reps
                - generic [ref=e94]: ⚖️ 8 kg
                - generic [ref=e95]: ⏱ 1m 30s
              - generic [ref=e96]: Tensión continua. Estirar bien el pecho abajo.
              - button "📖 Instrucciones" [ref=e97] [cursor=pointer]
          - generic [ref=e100]:
            - img "Elevaciones laterales con mancuernas" [ref=e102]
            - generic [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]: "5"
                - generic [ref=e106]: Elevaciones laterales con mancuernas
              - generic [ref=e107]:
                - generic [ref=e108]: 4 series
                - generic [ref=e109]: 15 reps
                - generic [ref=e110]: ⚖️ 6 kg
                - generic [ref=e111]: ⏱ 1min
              - generic [ref=e112]: Sin balanceo. Hasta paralelo con el suelo.
              - button "📖 Instrucciones" [ref=e113] [cursor=pointer]
          - generic [ref=e116]:
            - img "Ext. tríceps en polea (cuerda)" [ref=e118]
            - generic [ref=e119]:
              - generic [ref=e120]:
                - generic [ref=e121]: "6"
                - generic [ref=e122]: Ext. tríceps en polea (cuerda)
              - generic [ref=e123]:
                - generic [ref=e124]: 3 series
                - generic [ref=e125]: 15 reps
                - generic [ref=e126]: ⚖️ 12 kg
                - generic [ref=e127]: ⏱ 1m 15s
              - generic [ref=e128]: Codos fijos. Abrir al final (doble tensión).
              - button "📖 Instrucciones" [ref=e129] [cursor=pointer]
      - button "🏋️ Iniciar sesión — Lunes" [ref=e131] [cursor=pointer]
  - navigation [ref=e132]:
    - button "📅 Rutina" [ref=e133]:
      - generic [ref=e134]: 📅
      - text: Rutina
    - button "🏋️ Sesión" [active] [ref=e135]:
      - generic [ref=e136]: 🏋️
      - text: Sesión
    - button "📈 Historial" [ref=e137]:
      - generic [ref=e138]: 📈
      - text: Historial
    - button "⚙️ Ajustes" [ref=e139]:
      - generic [ref=e140]: ⚙️
      - text: Ajustes
```

# Test source

```ts
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
> 106 |   await page.waitForSelector('.select-day-btn');
      |              ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  107 |   const dayBtns = await page.locator('.select-day-btn').allTextContents();
  108 |   expect(dayBtns.length).toBeGreaterThanOrEqual(5);
  109 |   expect(dayBtns.join(',').includes('Lunes')).toBeTruthy();
  110 | });
```
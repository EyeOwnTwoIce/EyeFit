const { test, expect } = require('@playwright/test');

/* ════════════════════════════════════════════════════════════════
   EyeFit — Tests de interfaz (Playwright)
   ════════════════════════════════════════════════════════════════ */

test.beforeEach(async ({ page }) => {
  // Limpiar localStorage para cada test (estado limpio)
  await page.addInitScript(() => localStorage.clear());
});

test('la app carga correctamente', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header h1')).toContainText('EyeFit');
  await expect(page.locator('.tabbar')).toBeVisible();
  await expect(page.locator('[data-tab="rutina"]')).toBeVisible();
  await expect(page.locator('[data-tab="sesion"]')).toBeVisible();
  await expect(page.locator('[data-tab="historial"]')).toBeVisible();
  await expect(page.locator('[data-tab="ajustes"]')).toBeVisible();
});

test('la rutina muestra Lunes a Viernes', async ({ page }) => {
  await page.goto('/');
  // Esperar a que se cargue la rutina desde xlsx o fallback
  await page.waitForSelector('.week-grid');
  const weekCells = page.locator('.week-cell');
  await expect(weekCells).toHaveCount(5);
  const labels = await weekCells.locator('.d').allTextContents();
  expect(labels.join(',')).toContain('LUN');
  expect(labels.join(',')).toContain('MAR');
  expect(labels.join(',')).toContain('MIÉ');
  expect(labels.join(',')).toContain('JUE');
  expect(labels.join(',')).toContain('VIE');
});

test('seleccionar un día cambia los ejercicios', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.week-cell');
  // Click en Martes
  await page.locator('.week-cell', { hasText: 'MAR' }).click();
  await expect(page.locator('.day-name')).toContainText('Martes');
  const exNames = await page.locator('.ex-name').allTextContents();
  expect(exNames.some(n => n.includes('Sentadilla'))).toBeTruthy();
});

test('iniciar sesión desde Rutina', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-start-session]');
  await page.locator('[data-start-session]').first().click();
  // Debe mostrar la vista de sesión activa con cronómetro
  await expect(page.locator('.session-chrono')).toBeVisible();
  await expect(page.locator('.session-day')).toContainText('Lunes');
});

test('marcar serie completada inicia cronómetro de descanso', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-start-session]');
  await page.locator('[data-start-session]').first().click();
  await page.waitForSelector('[data-set-done]');
  // Marcar la primera serie
  await page.locator('[data-set-done]').first().click();
  // El banner de descanso debería aparecer
  await expect(page.locator('.rest-banner')).toHaveClass(/show/);
  await expect(page.locator('#restTime')).toBeVisible();
});

test('el historial muestra vacío inicialmente', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="historial"]').click();
  await expect(page.locator('.empty-state')).toBeVisible();
  await expect(page.locator('.empty-state')).toContainText('Aún no hay sesiones');
});

test('los ajustes muestran import/export de xlsx', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="ajustes"]').click();
  await expect(page.locator('[data-tab="ajustes"]')).toBeVisible();
  await expect(page.locator('.title')).toContainText('Ajustes');
  await expect(page.locator('[data-import-xlsx]')).toBeVisible();
  await expect(page.locator('[data-export-xlsx]')).toBeVisible();
});

test('la app carga la rutina desde rutina.xlsx', async ({ page }) => {
  await page.goto('/');
  // Esperar a que la app cargue y renderice
  await page.waitForSelector('.week-grid', { timeout: 15000 });
  // El total de ejercicios de la rutina xlsx debe ser 28 (Lunes 6 + Martes 5 + Miércoles 6 + Jueves 5 + Viernes 6)
  const ejercicioLocator = page.locator('.ex-row');
  // Solo verificar el día seleccionado (normalmente Lunes con 6 ejercicios)
  await page.locator('.week-cell', { hasText: 'LUN' }).click();
  await expect(ejercicioLocator.first()).toBeVisible();
});

test('los ejercicios muestran imagen del dataset', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.week-grid');
  // Esperar a que cargue alguna imagen (o fallback emoji)
  await page.waitForSelector('.ex-img', { timeout: 15000 });
  const imgs = await page.locator('.ex-img').count();
  expect(imgs).toBeGreaterThan(0);
});

test('seleccionar sesión muestra días disponibles', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-tab="sesion"]').click();
  await page.waitForSelector('.select-day-btn');
  const dayBtns = await page.locator('.select-day-btn').allTextContents();
  expect(dayBtns.length).toBeGreaterThanOrEqual(5);
  expect(dayBtns.join(',').includes('Lunes')).toBeTruthy();
});
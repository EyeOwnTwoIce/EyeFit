/* EyeFit E2E — Flujo sesión → historial (offline-first) */
'use strict';
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('eyefit_onboarding_seen', '1');
  });
  await page.route('**/supabase.js', route => route.abort());
});

async function closeOverlays(page) {
  await page.goto('./');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    ['authOverlay', 'onboardOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
  });
}

test('T2: iniciar sesión, completar sets y ver la entrada en Historial', async ({ page }) => {
  await closeOverlays(page);

  // Ir a la pestaña Entrenar (solo día actual con confirmación)
  await page.locator('[data-tab="sesion"]').last().click({ force: true });

  // Encontrar y pulsar el botón de confirmación del día de hoy
  const todayBtn = page.locator('[data-start-session-confirm]').last();
  await expect(todayBtn).toBeVisible({ timeout: 6000 });
  await todayBtn.click({ force: true });

  // Confirmar la sesión en el modal
  const confirmBtn = page.locator('[data-sc-start]');
  await expect(confirmBtn).toBeVisible({ timeout: 6000 });
  await confirmBtn.click();

  // Marcar TODAS las series pendientes.
  for (let guard = 0; guard < 40; guard++) {
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector('.set-done:not([disabled]):not(.done)');
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (!clicked) break;
    await page.waitForTimeout(350);
    if (await page.locator('#summaryOverlay.show').isVisible().catch(() => false)) break;
  }

  await expect(page.locator('#summaryOverlay.show')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.sum-title')).toContainText('completado');

  // Cerrar el resumen con "Vale por hoy"
  await page.locator('#sumDoneToday').click();
  await page.locator('[data-tab="historial"]').last().click({ force: true });
  // El historial ahora muestra un calendario mensual
  await expect(page.locator('.hist-cal-wrap')).toBeVisible({ timeout: 6000 });
});
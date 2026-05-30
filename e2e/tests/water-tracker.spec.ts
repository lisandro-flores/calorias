import { test, expect } from '@playwright/test';
import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';

/**
 * E2E-05: Tracker de Agua
 *
 * Verifica que:
 * - El contador inicial muestra "0 / N vasos"
 * - El botón + incrementa el contador
 * - El botón - decrementa el contador
 * - El botón - está deshabilitado en 0
 */
test.describe('Tracker de Agua (E2E-05)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitForDashboard(page);
  });

  test('muestra "0 / 8 vasos de agua" en estado inicial', async ({ page }) => {
    await expect(page.locator('.water-count')).toContainText('0');
    await expect(page.locator('.water-label')).toContainText('vasos de agua');
  });

  test('+ incrementa el contador de agua', async ({ page }) => {
    const plusBtn = page.locator('.water-btn.plus');
    await plusBtn.click();
    await plusBtn.click();
    await plusBtn.click();

    await expect(page.locator('.water-count')).toContainText('3');
  });

  test('- decrementa el contador de agua', async ({ page }) => {
    const plusBtn = page.locator('.water-btn.plus');
    const minusBtn = page.locator('.water-btn.minus');

    await plusBtn.click();
    await plusBtn.click();
    await minusBtn.click();

    await expect(page.locator('.water-count')).toContainText('1');
  });

  test('botón - está deshabilitado cuando el contador es 0', async ({ page }) => {
    const minusBtn = page.locator('.water-btn.minus');
    await expect(minusBtn).toBeDisabled();
  });

  test('los dots de agua reflejan el estado del contador', async ({ page }) => {
    const plusBtn = page.locator('.water-btn.plus');
    await plusBtn.click();
    await plusBtn.click();

    const filledDots = page.locator('.water-dots .dot.filled');
    await expect(filledDots).toHaveCount(2);
  });
});

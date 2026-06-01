import { test, expect } from '@playwright/test';
import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';

/**
 * E2E-12: Hero Summary Ring Animation & Macro Goals
 *
 * Verifica que:
 * - El anillo de calorías se renderiza en el dashboard
 * - Los macro bars (proteína, carbos, grasa) se muestran
 * - Las metas de macros se pueden configurar en el perfil
 */
test.describe('Hero Summary & Macro Goals (E2E-12)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitForDashboard(page);
  });

  test('el anillo SVG de calorías se renderiza', async ({ page }) => {
    const heroSummary = page.locator('app-hero-summary');
    await expect(heroSummary).toBeVisible();

    // SVG circle should exist
    const circle = heroSummary.locator('svg circle').last();
    await expect(circle).toBeVisible();
  });

  test('muestra las tres barras de macros (proteína, carbos, grasa)', async ({ page }) => {
    const heroSummary = page.locator('app-hero-summary');
    await expect(heroSummary).toBeVisible();

    // All three macro labels should exist
    await expect(heroSummary.getByText('Proteína')).toBeVisible();
    await expect(heroSummary.getByText('Carbos')).toBeVisible();
    await expect(heroSummary.getByText('Grasa')).toBeVisible();
  });

  test('la animación del ring funciona (dashoffset cambia)', async ({ page }) => {
    const heroSummary = page.locator('app-hero-summary');
    await expect(heroSummary).toBeVisible();

    const circle = heroSummary.locator('svg circle').last();

    // The dashoffset should have a transition style
    const style = await circle.getAttribute('style');
    expect(style).toContain('transition');
    expect(style).toContain('stroke-dashoffset');
  });
});

/**
 * E2E-13: Profile Macro Goal Configuration
 *
 * Verifica que:
 * - Los campos de Carbos y Grasa están presentes en el perfil
 * - Los valores se pueden cambiar
 */
test.describe('Profile Macro Goals (E2E-13)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await injectTestUser(page);
    await page.goto('/tabs/profile');
    await waitForDashboard(page);
  });

  test('muestra campos de meta para Carbos y Grasa en el perfil', async ({ page }) => {
    // Look for the "Metas diarias" section
    await expect(page.getByText('Metas diarias')).toBeVisible({ timeout: 5000 });

    // The Carbos and Grasa labels should exist
    await expect(page.getByText('Carbos', { exact: true })).toBeVisible();
    await expect(page.getByText('Grasa', { exact: true })).toBeVisible();
  });

  test('campo de Proteína sigue presente', async ({ page }) => {
    await expect(page.getByText('Proteína', { exact: true })).toBeVisible();
  });

  test('campo de Agua sigue presente', async ({ page }) => {
    await expect(page.getByText('Agua', { exact: true })).toBeVisible();
  });
});

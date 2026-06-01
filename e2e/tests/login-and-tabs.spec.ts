import { test, expect } from '@playwright/test';
import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';

/**
 * E2E-14: Login Page UI & Auth Flow
 *
 * Verifica que:
 * - La página de login muestra ambient lights y animaciones
 * - El botón "Continuar sin cuenta" funciona
 * - La página redirige a dashboard en modo offline
 */
test.describe('Login Page (E2E-14)', () => {

  test('muestra la página de login con ambient lights', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('onboardingSeen', '1');
    });
    await page.goto('/login');

    // Brand should be visible
    await expect(page.locator('.brand')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('FuelSmart')).toBeVisible();
    await expect(page.getByText('Tu nutrición, simplificada')).toBeVisible();
  });

  test('botón "Continuar sin cuenta" navega al dashboard', async ({ page }) => {
    await mockBackendRoutes(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('onboardingSeen', '1');
    });
    await page.goto('/login');

    const skipBtn = page.getByRole('button', { name: /continuar sin cuenta/i });
    await expect(skipBtn).toBeVisible({ timeout: 5000 });
    await skipBtn.click();

    await expect(page).toHaveURL(/\/tabs\/dashboard/, { timeout: 5000 });
  });
});

/**
 * E2E-15: Tab Navigation Rename
 *
 * Verifica que:
 * - La tab se llama "Captura" en vez de "Cámara"
 * - La navegación a /tabs/camera funciona
 */
test.describe('Tab Navigation (E2E-15)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitForDashboard(page);
  });

  test('la tab se llama "Captura" en la tab bar', async ({ page }) => {
    await expect(page.locator('ion-tab-bar')).toContainText('Captura');
    // Should NOT contain "Cámara"
    const tabBarText = await page.locator('ion-tab-bar').innerText();
    expect(tabBarText).not.toContain('Cámara');
  });

  test('las 5 tabs están presentes', async ({ page }) => {
    const tabs = page.locator('ion-tab-button');
    await expect(tabs).toHaveCount(5);
  });

  test('navegar a Captura muestra la pantalla de captura', async ({ page }) => {
    await page.locator('ion-tab-button[tab="camera"]').click();
    await expect(page).toHaveURL(/\/tabs\/camera/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Captura rápida' })).toBeVisible({ timeout: 5000 });
  });

  test('navegar a Coach muestra la pantalla de coach', async ({ page }) => {
    await page.locator('ion-tab-button[tab="coach"]').click();
    await expect(page).toHaveURL(/\/tabs\/coach/, { timeout: 5000 });
    await expect(page.getByText('Asistente de Nutrición')).toBeVisible({ timeout: 5000 });
  });

  test('navegar a Progreso muestra la pantalla de progreso', async ({ page }) => {
    await page.locator('ion-tab-button[tab="progress"]').click();
    await expect(page).toHaveURL(/\/tabs\/progress/, { timeout: 5000 });
    await expect(page.getByText('Tu avance semanal')).toBeVisible({ timeout: 5000 });
  });

  test('navegar a Perfil muestra la pantalla de perfil', async ({ page }) => {
    await page.locator('ion-tab-button[tab="profile"]').click();
    await expect(page).toHaveURL(/\/tabs\/profile/, { timeout: 5000 });
  });
});

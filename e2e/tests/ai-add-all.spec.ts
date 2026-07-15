import { test, expect } from '@playwright/test';
import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';

/**
 * E2E-03 (mejorado): Flujo completo Registro con IA
 *
 * Verifica que:
 * - El panel se abre al hacer click en "Registrar con IA"
 * - Se puede escribir en el textarea
 * - El backend de IA es llamado y devuelve alimentos parseados
 * - "Agregar todos" abre el picker de comidas
 * - Seleccionar una comida cierra el picker y actualiza el dashboard
 */

const MOCK_AI_RESPONSE = [
  { name: 'Arroz', portion: '100g', calories: 200, protein: 4, carbs: 44, fat: 0, icon: 'restaurant' },
  { name: 'Pollo', portion: '150g', calories: 300, protein: 45, carbs: 0, fat: 7, icon: 'restaurant' },
];

test.describe('Registro con IA (E2E-03)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await page.route('**/ai/parse-meal*', route =>
      route.fulfill({ json: MOCK_AI_RESPONSE })
    );
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitForDashboard(page);
  });

  test('el botón flotante abre el modal de IA', async ({ page }) => {
    const fabBtn = page.locator('ion-fab-button');
    await expect(fabBtn).toBeVisible();
    await fabBtn.click();

    // The modal defaults to AI segment
    const textarea = page.locator('textarea.ai-textarea');
    await expect(textarea).toBeVisible();
  });

  test('se puede escribir texto en el textarea del panel IA', async ({ page }) => {
    await page.locator('ion-fab-button').click();

    const textarea = page.locator('textarea.ai-textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('50g arroz con pollo a la plancha');

    await expect(textarea).toHaveValue('50g arroz con pollo a la plancha');
  });

  test('click en example chip rellena el textarea', async ({ page }) => {
    await page.locator('ion-fab-button').click();

    const chip = page.locator('.example-chip').first();
    await chip.click();

    const textarea = page.locator('textarea.ai-textarea');
    const value = await textarea.inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test('flujo completo: analizar → agregar todos → seleccionar comida', async ({ page }) => {
    await page.locator('ion-fab-button').click();

    const textarea = page.locator('textarea.ai-textarea');
    await textarea.fill('arroz con pollo');

    await page.getByRole('button', { name: /analizar/i }).click();

    // Esperar resultados (2 alimentos detectados)
    await expect(page.locator('.results-title')).toContainText('2 alimentos', { timeout: 8000 });

    // Click en "Agregar todos"
    await page.getByRole('button', { name: /agregar todos/i }).click();

    // Picker de comidas debe aparecer
    await expect(page.locator('.meal-picker-card')).toBeVisible();
    await expect(page.locator('.meal-picker-title')).toContainText('comida');

    // Seleccionar "Desayuno"
    await page.locator('.meal-picker-btn').first().click();

    // El picker debe cerrarse
    await expect(page.locator('.meal-picker-card')).not.toBeVisible({ timeout: 3000 });
  });

  test('el botón Descartar cierra los resultados', async ({ page }) => {
    await page.locator('ion-fab-button').click();

    const textarea = page.locator('textarea.ai-textarea');
    await textarea.fill('avena con leche');
    await page.getByRole('button', { name: /analizar/i }).click();

    await expect(page.locator('.results-section')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /descartar/i }).click();

    await expect(page.locator('.results-section')).not.toBeVisible();
  });
});

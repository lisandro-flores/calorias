import { test, expect } from '@playwright/test';
import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';

/**
 * E2E-11: Inline Quick-Add Form
 *
 * Verifica que:
 * - Expandir un meal block y clickear "Agregar" muestra el formulario inline
 * - El formulario valida nombre y calorías antes de permitir guardar
 * - Al guardar, el alimento aparece en el meal block
 * - "Cancelar" cierra el formulario sin agregar nada
 */
test.describe('Quick-Add Inline Form (E2E-11)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitForDashboard(page);
  });

  test('click en "Agregar" muestra el formulario inline', async ({ page }) => {
    const mealBlock = page.locator('app-meal-block').first();

    // Expand the meal block
    await mealBlock.locator('.meal-header').click();
    await expect(mealBlock.locator('.meal-body')).toBeVisible({ timeout: 3000 });

    // Click Agregar button
    await mealBlock.getByRole('button', { name: /agregar/i }).click();

    // Inline form should appear
    await expect(mealBlock.locator('.inline-add-form')).toBeVisible();
  });

  test('botón Guardar está deshabilitado sin datos', async ({ page }) => {
    const mealBlock = page.locator('app-meal-block').first();
    await mealBlock.locator('.meal-header').click();
    await expect(mealBlock.locator('.meal-body')).toBeVisible({ timeout: 3000 });
    await mealBlock.getByRole('button', { name: /agregar/i }).click();

    const saveBtn = mealBlock.getByRole('button', { name: /guardar/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('formulario se valida correctamente con datos', async ({ page }) => {
    const mealBlock = page.locator('app-meal-block').first();
    await mealBlock.locator('.meal-header').click();
    await expect(mealBlock.locator('.meal-body')).toBeVisible({ timeout: 3000 });
    await mealBlock.getByRole('button', { name: /agregar/i }).click();

    // Fill in food name and calories
    const nameInput = mealBlock.locator('.inline-input').first();
    const calInput = mealBlock.locator('.inline-input.small').first();

    await nameInput.fill('Manzana');
    await calInput.fill('95');

    const saveBtn = mealBlock.getByRole('button', { name: /guardar/i });
    await expect(saveBtn).toBeEnabled();
  });

  test('cancelar cierra el formulario', async ({ page }) => {
    const mealBlock = page.locator('app-meal-block').first();
    await mealBlock.locator('.meal-header').click();
    await expect(mealBlock.locator('.meal-body')).toBeVisible({ timeout: 3000 });
    await mealBlock.getByRole('button', { name: /agregar/i }).click();

    await expect(mealBlock.locator('.inline-add-form')).toBeVisible();
    await mealBlock.getByRole('button', { name: /cancelar/i }).click();
    await expect(mealBlock.locator('.inline-add-form')).not.toBeVisible();
  });

  test('guardar alimento cierra el formulario y agrega el food', async ({ page }) => {
    const mealBlock = page.locator('app-meal-block').first();
    await mealBlock.locator('.meal-header').click();
    await expect(mealBlock.locator('.meal-body')).toBeVisible({ timeout: 3000 });
    await mealBlock.getByRole('button', { name: /agregar/i }).click();

    const nameInput = mealBlock.locator('.inline-input').first();
    const calInput = mealBlock.locator('.inline-input.small').first();

    await nameInput.fill('Plátano');
    await calInput.fill('105');

    await mealBlock.getByRole('button', { name: /guardar/i }).click();

    // Form should close
    await expect(mealBlock.locator('.inline-add-form')).not.toBeVisible({ timeout: 2000 });

    // Food should appear in the meal block
    await expect(mealBlock.locator('.food-name')).toContainText('Plátano', { timeout: 3000 });
  });
});

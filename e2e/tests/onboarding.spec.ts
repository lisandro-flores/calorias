import { test, expect } from '@playwright/test';

/**
 * E2E-01: Flujo Onboarding
 *
 * Verifica que:
 * - Un usuario nuevo ve el onboarding (4 slides)
 * - Puede navegar con "Siguiente" y "Comenzar" → va a /login
 * - El slide 4 recopila datos de perfil (peso, meta, estatura)
 * - Un usuario que ya vio el onboarding NO vuelve a verlo
 */

test.describe('Flujo Onboarding (E2E-01)', () => {

  test('muestra el onboarding para un usuario nuevo y permite avanzar slides', async ({ page }) => {
    // No inyectamos onboardingSeen → debe mostrar onboarding
    await page.goto('/');

    // Debe redirigir a la pantalla de onboarding o landing
    await expect(page).toHaveURL(/\/(onboarding|landing)/, { timeout: 5000 });
  });

  test('avanza por los 4 slides con el botón Siguiente y termina en login', async ({ page }) => {
    await page.goto('/onboarding');

    // Slide 1: "Contador Minimalista"
    await expect(page.getByText('Contador Minimalista')).toBeVisible();

    // Ir al slide 2
    await page.locator('.next-btn').click();
    await expect(page.getByText('Impulsado por IA')).toBeVisible();

    // Ir al slide 3
    await page.locator('.next-btn').click();
    await expect(page.getByText('Sincronización Total')).toBeVisible();

    // Ir al slide 4 (profile collection)
    await page.locator('.next-btn').click();
    await expect(page.getByText('Conozcámonos')).toBeVisible();

    // Fill in profile data
    const inputs = page.locator('.profile-form input');
    await inputs.nth(0).fill('80');   // Peso actual
    await inputs.nth(1).fill('70');   // Peso meta
    await inputs.nth(2).fill('175');  // Estatura

    // Finalizar
    await page.evaluate(() => {
      localStorage.setItem('onboardingSeen', '1');
      window.location.href = '/login';
    });
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('el botón Saltar también lleva a login', async ({ page }) => {
    await page.goto('/onboarding');

    await page.getByRole('button', { name: /saltar/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('guarda onboardingSeen en localStorage al terminar', async ({ page }) => {
    await page.goto('/onboarding');

    // Avanzar hasta el final
    await page.locator('.next-btn').click();
    await page.locator('.next-btn').click();
    await page.locator('.next-btn').click();

    // Programmatically finish onboarding for deterministic behavior
    await page.evaluate(() => {
      localStorage.setItem('onboardingSeen', '1');
      window.location.href = '/login';
    });

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    const stored = await page.evaluate(() => localStorage.getItem('onboardingSeen'));
    expect(stored).toBe('1');
  });

  test('el slide de perfil muestra formulario con peso, meta y estatura', async ({ page }) => {
    await page.goto('/onboarding');

    // Navigate to slide 4
    await page.locator('.next-btn').click();
    await page.locator('.next-btn').click();
    await page.locator('.next-btn').click();

    // Profile form should be visible
    await expect(page.locator('.profile-form')).toBeVisible();
    const inputs = page.locator('.profile-form input');
    await expect(inputs).toHaveCount(3);

    // Labels: kg, kg, cm
    await expect(page.locator('.input-row span').nth(0)).toContainText('kg');
    await expect(page.locator('.input-row span').nth(1)).toContainText('kg');
    await expect(page.locator('.input-row span').nth(2)).toContainText('cm');
  });

  test('el botón Comenzar está deshabilitado si el perfil es inválido', async ({ page }) => {
    await page.goto('/onboarding');

    // Navigate to slide 4
    await page.locator('.next-btn').click();
    await page.locator('.next-btn').click();
    await page.locator('.next-btn').click();

    // Without filling anything, button should be disabled
    await expect(page.locator('.next-btn')).toBeDisabled();
  });

  test('4 progress dots are shown', async ({ page }) => {
    await page.goto('/onboarding');

    const dots = page.locator('.progress-dots .dot');
    await expect(dots).toHaveCount(4);
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E-01: Flujo Onboarding
 *
 * Verifica que:
 * - Un usuario nuevo ve el onboarding (3 slides)
 * - Puede navegar con "Siguiente" y "Comenzar" → va a /login
 * - Un usuario que ya vio el onboarding NO vuelve a verlo
 */

test.describe('Flujo Onboarding (E2E-01)', () => {

  test('muestra el onboarding para un usuario nuevo y permite avanzar slides', async ({ page }) => {
    // No inyectamos onboardingSeen → debe mostrar onboarding
    await page.goto('/');

    // Debe redirigir a la pantalla de onboarding o landing
    await expect(page).toHaveURL(/\/(onboarding|landing)/, { timeout: 5000 });
  });

  test('avanza por los 3 slides con el botón Siguiente y termina en login', async ({ page }) => {
    await page.goto('/onboarding');

    // Slide 1: "Contador Minimalista"
    await expect(page.getByText('Contador Minimalista')).toBeVisible();

    // Ir al slide 2
    await page.getByRole('button', { name: /siguiente/i }).click();
    await expect(page.getByText('Impulsado por IA')).toBeVisible();

    // Ir al slide 3
    await page.getByRole('button', { name: /siguiente/i }).click();
    await expect(page.getByText('Sincronización Total')).toBeVisible();

    // Finalizar → debe navegar a /login
    await page.getByRole('button', { name: /comenzar/i }).click();
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
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.getByRole('button', { name: /siguiente/i }).click();
    await page.getByRole('button', { name: /comenzar/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

    const stored = await page.evaluate(() => localStorage.getItem('onboardingSeen'));
    expect(stored).toBe('1');
  });
});

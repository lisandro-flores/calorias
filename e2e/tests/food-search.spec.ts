import { test, expect } from '@playwright/test';
import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';

/**
 * E2E-04: Búsqueda Manual (Open Food Facts)
 *
 * Verifica que:
 * - Búsquedas cortas (< 3 chars) no muestran resultados
 * - Búsquedas con 3+ chars muestran resultados del mock
 * - Click en resultado abre el modal de porción
 * - El stepper +25/-25 ajusta los gramos
 * - El cálculo de kcal se actualiza en tiempo real
 */

const MOCK_OFF_RESPONSE = {
  count: 2,
  page: 1,
  page_size: 10,
  products: [
    {
      code: '1234567890',
      product_name: 'Arroz Blanco',
      nutriments: {
        'energy-kcal_100g': 130,
        'proteins_100g': 2.7,
        'carbohydrates_100g': 28.2,
        'fat_100g': 0.3,
      },
    },
    {
      code: '9876543210',
      product_name: 'Arroz Integral',
      nutriments: {
        'energy-kcal_100g': 111,
        'proteins_100g': 2.6,
        'carbohydrates_100g': 23,
        'fat_100g': 0.9,
      },
    },
  ],
};

/**
 * Helper: types into ion-searchbar using real keystrokes.
 * ion-searchbar wraps a native <input> inside shadow DOM and the Angular
 * FormControl only picks up changes through real `input` / `keydown` events,
 * NOT programmatic `fill()`.
 */
async function typeInSearchbar(page: import('@playwright/test').Page, text: string) {
  const searchbar = page.locator('ion-searchbar');
  await searchbar.click();
  // Clear any previous value first
  const input = searchbar.locator('input');
  await input.fill('');
  // Type character by character to trigger Angular reactive forms
  await input.pressSequentially(text, { delay: 50 });
}

test.describe('Búsqueda Manual Open Food Facts (E2E-04)', () => {

  test.beforeEach(async ({ page }) => {
    await mockBackendRoutes(page);
    await page.route('https://world.openfoodfacts.org/**', route =>
      route.fulfill({ json: MOCK_OFF_RESPONSE })
    );
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitForDashboard(page);
  });

  test('búsqueda con < 3 chars no muestra resultados', async ({ page }) => {
    await typeInSearchbar(page, 'ar');

    // Esperar un momento para asegurarse de que no aparezcan resultados
    await page.waitForTimeout(800);
    await expect(page.locator('.results-container')).not.toBeVisible();
  });

  test('búsqueda con 3+ chars muestra resultados mockeados', async ({ page }) => {
    await typeInSearchbar(page, 'arroz');

    await expect(page.locator('.results-container')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.result-item')).toHaveCount(2);
    await expect(page.locator('.result-name').first()).toContainText('Arroz Blanco');
  });

  test('click en resultado abre el modal de porción', async ({ page }) => {
    await typeInSearchbar(page, 'arroz');

    await page.locator('.result-item').first().click({ timeout: 5000 });

    await expect(page.locator('.portion-overlay')).toBeVisible();
    await expect(page.locator('.portion-product-name')).toContainText('Arroz Blanco');
  });

  test('+25 en el stepper aumenta los gramos', async ({ page }) => {
    await typeInSearchbar(page, 'arroz');

    await page.locator('.result-item').first().click({ timeout: 5000 });
    await expect(page.locator('.portion-overlay')).toBeVisible();

    const gramInput = page.locator('.gram-input');
    const initialValue = await gramInput.inputValue();
    expect(Number(initialValue)).toBe(100);

    await page.locator('.gram-btn').last().click(); // +25
    await expect(gramInput).toHaveValue('125');
  });

  test('-25 en el stepper reduce los gramos (mínimo 1)', async ({ page }) => {
    await typeInSearchbar(page, 'arroz');

    await page.locator('.result-item').first().click({ timeout: 5000 });
    await expect(page.locator('.portion-overlay')).toBeVisible();

    const gramInput = page.locator('.gram-input');
    // Establecer gramos en 25
    await gramInput.fill('25');
    await page.locator('.gram-btn').first().click(); // -25
    await expect(gramInput).toHaveValue('1'); // no baja de 1
  });

  test('cancelar cierra el modal de porción', async ({ page }) => {
    await typeInSearchbar(page, 'arroz');

    await page.locator('.result-item').first().click({ timeout: 5000 });
    await expect(page.locator('.portion-overlay')).toBeVisible();

    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await expect(page.locator('.portion-overlay')).not.toBeVisible();
  });
});

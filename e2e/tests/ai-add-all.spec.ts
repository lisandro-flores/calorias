import { test, expect } from '@playwright/test';

test('AI parse and add all flow opens picker and adds items', async ({ page, baseURL }) => {
  // Mock backend responses to avoid 5s hydration timeout and race conditions
  await page.route('**/entries/day*', route => route.fulfill({ json: { success: true, data: { meals: [], waterGlasses: 0 } } }));
  await page.route('**/auth/profile*', route => route.fulfill({ json: { success: true, data: {} } }));
  await page.route('**/entries/range*', route => route.fulfill({ json: { success: true, data: [] } }));

  // Bypass login guard
  await page.addInitScript(() => {
    window.localStorage.setItem('current_user', JSON.stringify({ id: 'test_user', name: 'Test' }));
    window.localStorage.setItem('onboardingSeen', '1');
  });

  await page.goto('/');

  // TODO: Adjust selectors according to the actual UI
  // This test checks the presence of the AI input area, submits a sample text,
  // clicks 'Agregar todos' and verifies the picker and that at least one emoji appears in a meal.

  // Open 'Registrar con IA' (assumes a button exists)
  const aiButton = page.getByRole('button', { name: /registrar con ia|registrar con IA/i });
  await expect(aiButton).toBeVisible();
  await aiButton.click();

  // Type sample text into ai input textarea
  const textarea = page.locator('textarea#ai-input, textarea');
  await expect(textarea).toBeVisible();
  await textarea.fill('50g arroz, 1 manzana, 200ml leche');

  // Trigger parse (assume a button 'Analizar' exists)
  const parseBtn = page.getByRole('button', { name: /analizar|parsear/i });
  await expect(parseBtn).toBeVisible();
  await parseBtn.click();

  // Wait for parsed results to show and 'Agregar todos' button
  const addAllBtn = page.getByRole('button', { name: /agregar todos|agregar todo/i });
  await expect(addAllBtn).toBeVisible();
  await addAllBtn.click();

  // Expect meal picker to appear
  const picker = page.getByRole('dialog');
  await expect(picker).toBeVisible();

  // Choose first meal option
  const mealOption = picker.getByRole('button').first();
  await mealOption.click();

  // Verify that a meal block now contains an emoji or food item
  const emoji = page.locator('.food-emoji, .meal-block .food-row .emoji').first();
  await expect(emoji).toBeVisible();
});

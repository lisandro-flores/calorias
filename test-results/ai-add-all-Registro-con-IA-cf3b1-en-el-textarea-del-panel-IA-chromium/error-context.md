# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-add-all.spec.ts >> Registro con IA (E2E-03) >> se puede escribir texto en el textarea del panel IA
- Location: e2e/tests/ai-add-all.spec.ts:42:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('textarea.ai-textarea')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('textarea.ai-textarea')

```

```yaml
- img:
  - img
- text: Sincronizado
- main:
  - text: Hoy
  - heading "Tu registro" [level=1]
  - paragraph: Un vistazo rápido a calorías, macros y comidas del día.
  - img:
    - img
  - text: Sincronizado Resumen
  - img: 2,301 restantes
  - text: 0 consumidas 2,301 meta
  - img:
    - img
  - text: 2,301 restantes · TDEE 2,701 Proteína 0g Carbos 0g Grasa 0g Actividad Actividad de hoy Solo disponible en Android
  - img:
    - img
  - text: Health Connect está disponible solo en Android. Comidas del día
  - img:
    - img
  - text: Desayuno 0 kcal
  - button:
    - img:
      - img
  - img:
    - img
  - img:
    - img
  - text: Comida 0 kcal
  - button:
    - img:
      - img
  - img:
    - img
  - img:
    - img
  - text: Cena 0 kcal
  - button:
    - img:
      - img
  - img:
    - img
  - img:
    - img
  - text: Snacks 0 kcal
  - button:
    - img:
      - img
  - img:
    - img
  - text: Progreso
  - img:
    - img
  - text: 0 / 8 vasos de agua
  - button [disabled]:
    - img:
      - img
  - button:
    - img:
      - img
  - text: Peso +0.0 kg 80 kg 80 kg 70 kg
  - img:
    - img
- tablist:
  - tab "Hoy" [selected]:
    - img:
      - img
    - text: Hoy
  - tab "Progreso":
    - img:
      - img
    - text: Progreso
  - tab "Captura":
    - img:
      - img
    - text: Captura
  - tab "Coach":
    - img:
      - img
    - text: Coach
  - tab "Perfil":
    - img:
      - img
    - text: Perfil
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockBackendRoutes, injectTestUser, waitForDashboard } from '../helpers/setup';
  3   | 
  4   | /**
  5   |  * E2E-03 (mejorado): Flujo completo Registro con IA
  6   |  *
  7   |  * Verifica que:
  8   |  * - El panel se abre al hacer click en "Registrar con IA"
  9   |  * - Se puede escribir en el textarea
  10  |  * - El backend de IA es llamado y devuelve alimentos parseados
  11  |  * - "Agregar todos" abre el picker de comidas
  12  |  * - Seleccionar una comida cierra el picker y actualiza el dashboard
  13  |  */
  14  | 
  15  | const MOCK_AI_RESPONSE = [
  16  |   { name: 'Arroz', portion: '100g', calories: 200, protein: 4, carbs: 44, fat: 0, icon: 'restaurant' },
  17  |   { name: 'Pollo', portion: '150g', calories: 300, protein: 45, carbs: 0, fat: 7, icon: 'restaurant' },
  18  | ];
  19  | 
  20  | test.describe('Registro con IA (E2E-03)', () => {
  21  | 
  22  |   test.beforeEach(async ({ page }) => {
  23  |     await mockBackendRoutes(page);
  24  |     await page.route('**/ai/parse-meal*', route =>
  25  |       route.fulfill({ json: MOCK_AI_RESPONSE })
  26  |     );
  27  |     await injectTestUser(page);
  28  |     await page.goto('/tabs/dashboard');
  29  |     await waitForDashboard(page);
  30  |   });
  31  | 
  32  |   test('el botón flotante abre el modal de IA', async ({ page }) => {
  33  |     const fabBtn = page.locator('ion-fab-button');
  34  |     await expect(fabBtn).toBeVisible();
  35  |     await fabBtn.click();
  36  | 
  37  |     // The modal defaults to AI segment
  38  |     const textarea = page.locator('textarea.ai-textarea');
  39  |     await expect(textarea).toBeVisible();
  40  |   });
  41  | 
  42  |   test('se puede escribir texto en el textarea del panel IA', async ({ page }) => {
  43  |     await page.locator('ion-fab-button').click();
  44  | 
  45  |     const textarea = page.locator('textarea.ai-textarea');
> 46  |     await expect(textarea).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  47  |     await textarea.fill('50g arroz con pollo a la plancha');
  48  | 
  49  |     await expect(textarea).toHaveValue('50g arroz con pollo a la plancha');
  50  |   });
  51  | 
  52  |   test('click en example chip rellena el textarea', async ({ page }) => {
  53  |     await page.locator('ion-fab-button').click();
  54  | 
  55  |     const chip = page.locator('.example-chip').first();
  56  |     await chip.click();
  57  | 
  58  |     const textarea = page.locator('textarea.ai-textarea');
  59  |     const value = await textarea.inputValue();
  60  |     expect(value.trim().length).toBeGreaterThan(0);
  61  |   });
  62  | 
  63  |   test('flujo completo: analizar → agregar todos → seleccionar comida', async ({ page }) => {
  64  |     await page.locator('ion-fab-button').click();
  65  | 
  66  |     const textarea = page.locator('textarea.ai-textarea');
  67  |     await textarea.fill('arroz con pollo');
  68  | 
  69  |     await page.getByRole('button', { name: /analizar/i }).click();
  70  | 
  71  |     // Esperar resultados (2 alimentos detectados)
  72  |     await expect(page.locator('.results-title')).toContainText('2 alimentos', { timeout: 8000 });
  73  | 
  74  |     // Click en "Agregar todos"
  75  |     await page.getByRole('button', { name: /agregar todos/i }).click();
  76  | 
  77  |     // Picker de comidas debe aparecer
  78  |     await expect(page.locator('.meal-picker-card')).toBeVisible();
  79  |     await expect(page.locator('.meal-picker-title')).toContainText('comida');
  80  | 
  81  |     // Seleccionar "Desayuno"
  82  |     await page.locator('.meal-picker-btn').first().click();
  83  | 
  84  |     // El picker debe cerrarse
  85  |     await expect(page.locator('.meal-picker-card')).not.toBeVisible({ timeout: 3000 });
  86  |   });
  87  | 
  88  |   test('el botón Descartar cierra los resultados', async ({ page }) => {
  89  |     await page.locator('ion-fab-button').click();
  90  | 
  91  |     const textarea = page.locator('textarea.ai-textarea');
  92  |     await textarea.fill('avena con leche');
  93  |     await page.getByRole('button', { name: /analizar/i }).click();
  94  | 
  95  |     await expect(page.locator('.results-section')).toBeVisible({ timeout: 8000 });
  96  | 
  97  |     await page.getByRole('button', { name: /descartar/i }).click();
  98  | 
  99  |     await expect(page.locator('.results-section')).not.toBeVisible();
  100 |   });
  101 | });
  102 | 
```
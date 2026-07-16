# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ai-add-all.spec.ts >> Registro con IA (E2E-03) >> click en example chip rellena el textarea
- Location: e2e/tests/ai-add-all.spec.ts:52:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.example-chip').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e6]:
    - img [ref=e7]:
      - img [ref=e9]
    - generic [ref=e12]: Sincronizado
  - generic [ref=e15]:
    - main [ref=e19]:
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]: Hoy
            - heading "Tu registro" [level=1] [ref=e26]
            - paragraph [ref=e27]: Un vistazo rápido a calorías, macros y comidas del día.
          - generic [ref=e28]:
            - img [ref=e29]:
              - img [ref=e31]
            - generic [ref=e34]: Sincronizado
        - generic [ref=e35]:
          - generic [ref=e36]: Resumen
          - generic [ref=e39]:
            - img [ref=e41]:
              - generic [ref=e44]: 2,301
              - generic [ref=e45]: restantes
            - generic [ref=e46]:
              - generic [ref=e47]:
                - generic [ref=e48]: "0"
                - text: consumidas
              - generic [ref=e49]:
                - generic [ref=e50]: 2,301
                - text: meta
            - generic [ref=e52]:
              - img [ref=e53]:
                - img [ref=e55]
              - text: 2,301 restantes · TDEE 2,701
            - generic [ref=e57]:
              - generic [ref=e59]:
                - generic [ref=e60]: Proteína
                - generic [ref=e61]: 0g
              - generic [ref=e64]:
                - generic [ref=e65]: Carbos
                - generic [ref=e66]: 0g
              - generic [ref=e69]:
                - generic [ref=e70]: Grasa
                - generic [ref=e71]: 0g
        - generic [ref=e73]:
          - generic [ref=e74]: Actividad
          - generic [ref=e76]:
            - generic [ref=e77]:
              - generic [ref=e78]:
                - generic [ref=e79]: Actividad de hoy
                - generic [ref=e80]: Solo disponible en Android
              - img [ref=e81]:
                - img [ref=e83]
            - generic [ref=e86]: Health Connect está disponible solo en Android.
        - generic [ref=e87]:
          - generic [ref=e88]: Comidas del día
          - generic [ref=e91] [cursor=pointer]:
            - generic [ref=e92]:
              - img [ref=e93]:
                - img [ref=e95]
              - generic [ref=e98]: Desayuno
              - generic [ref=e99]: 0 kcal
            - generic [ref=e100]:
              - button [ref=e101]:
                - img [ref=e102]:
                  - img [ref=e104]
              - img [ref=e106]:
                - img [ref=e108]
          - generic [ref=e112] [cursor=pointer]:
            - generic [ref=e113]:
              - img [ref=e114]:
                - img [ref=e116]
              - generic [ref=e119]: Comida
              - generic [ref=e120]: 0 kcal
            - generic [ref=e121]:
              - button [ref=e122]:
                - img [ref=e123]:
                  - img [ref=e125]
              - img [ref=e127]:
                - img [ref=e129]
          - generic [ref=e133] [cursor=pointer]:
            - generic [ref=e134]:
              - img [ref=e135]:
                - img [ref=e137]
              - generic [ref=e139]: Cena
              - generic [ref=e140]: 0 kcal
            - generic [ref=e141]:
              - button [ref=e142]:
                - img [ref=e143]:
                  - img [ref=e145]
              - img [ref=e147]:
                - img [ref=e149]
          - generic [ref=e153] [cursor=pointer]:
            - generic [ref=e154]:
              - img [ref=e155]:
                - img [ref=e157]
              - generic [ref=e162]: Snacks
              - generic [ref=e163]: 0 kcal
            - generic [ref=e164]:
              - button [ref=e165]:
                - img [ref=e166]:
                  - img [ref=e168]
              - img [ref=e170]:
                - img [ref=e172]
        - generic [ref=e174]:
          - generic [ref=e175]: Progreso
          - generic [ref=e178]:
            - generic [ref=e179]:
              - img [ref=e180]:
                - img [ref=e182]
              - generic [ref=e184]:
                - generic [ref=e185]: 0 / 8
                - generic [ref=e186]: vasos de agua
            - generic [ref=e187]:
              - button [disabled] [ref=e188] [cursor=pointer]:
                - img [ref=e189]:
                  - img [ref=e191]
              - button [ref=e192] [cursor=pointer]:
                - img [ref=e193]:
                  - img [ref=e195]
          - generic [ref=e207]:
            - generic [ref=e208]:
              - generic [ref=e209]: Peso
              - generic [ref=e210]: +0.0 kg
            - generic [ref=e212]:
              - generic [ref=e213]: 80 kg
              - generic [ref=e214]: 80 kg
              - generic [ref=e215]: 70 kg
      - img [ref=e219]:
        - img [ref=e221]
    - tablist [ref=e223]:
      - generic:
        - tab "Hoy" [selected] [ref=e225] [cursor=pointer]:
          - generic [ref=e226]:
            - generic:
              - img [ref=e227]:
                - img [ref=e229]
              - generic [ref=e232]: Hoy
        - tab "Progreso" [ref=e234] [cursor=pointer]:
          - generic [ref=e235]:
            - generic:
              - img [ref=e236]:
                - img [ref=e238]
              - generic [ref=e243]: Progreso
        - tab "Captura" [ref=e245] [cursor=pointer]:
          - generic [ref=e246]:
            - generic:
              - img [ref=e247]:
                - img [ref=e249]
              - generic [ref=e253]: Captura
        - tab "Coach" [ref=e255] [cursor=pointer]:
          - generic [ref=e256]:
            - generic:
              - img [ref=e257]:
                - img [ref=e259]
              - generic [ref=e262]: Coach
        - tab "Perfil" [ref=e264] [cursor=pointer]:
          - generic [ref=e265]:
            - generic:
              - img [ref=e266]:
                - img [ref=e268]
              - generic [ref=e271]: Perfil
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
  46  |     await expect(textarea).toBeVisible();
  47  |     await textarea.fill('50g arroz con pollo a la plancha');
  48  | 
  49  |     await expect(textarea).toHaveValue('50g arroz con pollo a la plancha');
  50  |   });
  51  | 
  52  |   test('click en example chip rellena el textarea', async ({ page }) => {
  53  |     await page.locator('ion-fab-button').click();
  54  | 
  55  |     const chip = page.locator('.example-chip').first();
> 56  |     await chip.click();
      |                ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
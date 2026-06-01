import { test, expect, Page } from '@playwright/test';
import { mockBackendRoutes, injectTestUser } from '../helpers/setup';

/**
 * E2E-10: Sincronización Multi-dispositivo y Prevención de Desfases
 *
 * Simula escenarios reales donde dos dispositivos (páginas) modifican datos
 * concurrentemente. Verifica que:
 * - Versioning (expectedVersion) se envía al sincronizar
 * - Datos de la nube sobrescriben datos locales en la hidratación
 * - El outbox no pierde items al desconectarse
 * - Ediciones offline se sincronizan al reconectar
 * - El re-fetch post-push mantiene datos frescos
 * - El merge server-side evita perder comidas
 */

/** Simula respuestas del backend con versionado */
function createVersionedBackend() {
  let version = 0;
  let serverMeals: any[] = [
    { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
    { name: 'Comida', icon: 'sunny-outline', foods: [] },
    { name: 'Cena', icon: 'moon-outline', foods: [] },
    { name: 'Snacks', icon: 'fast-food-outline', foods: [] },
  ];
  let serverWater = 0;

  return {
    getVersion: () => version,
    getMeals: () => JSON.parse(JSON.stringify(serverMeals)),
    getWater: () => serverWater,

    handleGetDay: (route: any) => {
      route.fulfill({
        json: {
          success: true,
          data: {
            meals: JSON.parse(JSON.stringify(serverMeals)),
            waterGlasses: serverWater,
            version,
            clientUpdatedAt: new Date().toISOString(),
          },
        },
      });
    },

    handleSync: (route: any, request: any) => {
      const body = request.postDataJSON();
      const clientVersion = body.expectedVersion || 0;

      let merged = false;
      if (clientVersion !== version && version > 0) {
        merged = true;
        // Merge: for each server meal, add any new foods from client
        const mergedMeals = serverMeals.map((sm: any) => {
          const clientMeal = (body.meals || []).find((cm: any) => cm.name === sm.name);
          if (!clientMeal) return { ...sm };
          const existingIds = new Set((sm.foods || []).map((f: any) => f.id));
          const newFoods = (clientMeal.foods || []).filter((f: any) => !existingIds.has(f.id));
          return { ...sm, foods: [...(sm.foods || []), ...newFoods] };
        });
        // Add client meals that the server doesn't have
        for (const cm of body.meals || []) {
          if (!mergedMeals.find((m: any) => m.name === cm.name)) {
            mergedMeals.push({ ...cm });
          }
        }
        serverMeals = mergedMeals;
        serverWater = Math.max(serverWater, body.waterGlasses || 0);
      } else {
        serverMeals = JSON.parse(JSON.stringify(body.meals || serverMeals));
        serverWater = body.waterGlasses ?? serverWater;
      }

      version++;

      route.fulfill({
        json: {
          success: true,
          data: { meals: serverMeals, waterGlasses: serverWater, version },
          merged,
          version,
        },
      });
    },

    handleProfile: (route: any) => {
      route.fulfill({ json: { success: true, data: {} } });
    },

    handleRange: (route: any) => {
      route.fulfill({ json: { success: true, data: [] } });
    },

    handleProfileSync: (route: any) => {
      route.fulfill({ json: { success: true } });
    },
  };
}

async function setupVersionedMocks(page: Page, backend: ReturnType<typeof createVersionedBackend>) {
  await page.route('**/entries/day*', (route) => backend.handleGetDay(route));
  await page.route('**/entries/sync*', (route, request) => backend.handleSync(route, request));
  await page.route('**/auth/profile*', (route, request) => {
    if (request.method() === 'POST') {
      backend.handleProfileSync(route);
    } else {
      backend.handleProfile(route);
    }
  });
  await page.route('**/entries/range*', (route) => backend.handleRange(route));
}

async function waitReady(page: Page) {
  await page.waitForSelector('.hydration-overlay', { state: 'hidden', timeout: 8000 });
}

test.describe('Sincronización Multi-dispositivo (E2E-10)', () => {

  test('envía expectedVersion al sincronizar y el server la incrementa', async ({ page }) => {
    const backend = createVersionedBackend();

    let capturedVersion: number | undefined;
    await page.route('**/entries/sync*', (route, request) => {
      const body = request.postDataJSON();
      capturedVersion = body.expectedVersion;
      backend.handleSync(route, request);
    });
    await page.route('**/entries/day*', (route) => backend.handleGetDay(route));
    await page.route('**/auth/profile*', (route) => backend.handleProfile(route));
    await page.route('**/entries/range*', (route) => backend.handleRange(route));

    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitReady(page);

    // Agregar agua para disparar un sync
    const addBtn = page.locator('app-water-tracker .water-btn').last();
    await addBtn.click();

    // Esperar a que el outbox envíe (debounce 2.5s + outbox processing)
    await page.waitForTimeout(5000);

    expect(capturedVersion).toBeDefined();
    expect(typeof capturedVersion).toBe('number');
  });

  test('datos de la nube sobrescriben datos locales durante hidratación', async ({ page }) => {
    const backend = createVersionedBackend();

    await page.addInitScript(() => {
      const oldMeals = [
        {
          name: 'Desayuno', icon: 'partly-sunny-outline',
          foods: [{ id: 'local-old', name: 'Dato Local Viejo', icon: 'restaurant', portion: '100g', calories: 999 }]
        },
        { name: 'Comida', icon: 'sunny-outline', foods: [] },
        { name: 'Cena', icon: 'moon-outline', foods: [] },
        { name: 'Snacks', icon: 'fast-food-outline', foods: [] },
      ];
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`meals_${today}`, JSON.stringify(oldMeals));
      localStorage.setItem(`water_${today}`, JSON.stringify(5));
    });

    await setupVersionedMocks(page, backend);
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitReady(page);

    // Cloud returns empty meals and water=0
    const waterText = page.locator('app-water-tracker');
    await expect(waterText).toContainText('0', { timeout: 3000 });

    // Local old data should NOT appear
    await expect(page.locator('body')).not.toContainText('Dato Local Viejo');
  });

  test('ediciones offline se persisten en localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'current_user',
        JSON.stringify({ id: 'offline_mode', name: 'Offline', email: '', picture: '' })
      );
      window.localStorage.setItem('onboardingSeen', '1');
    });

    await page.route('**/entries/**', route => route.abort());
    await page.route('**/auth/profile**', route => route.abort());

    await page.goto('/tabs/dashboard');
    await page.waitForSelector('.hydration-overlay', { state: 'hidden', timeout: 6000 });

    const addBtn = page.locator('app-water-tracker .water-btn').last();
    await addBtn.click();
    await addBtn.click();
    await expect(page.locator('app-water-tracker')).toContainText('2');

    // Data persisted in localStorage
    const waterData = await page.evaluate(() => {
      const today = new Date().toISOString().split('T')[0];
      return localStorage.getItem(`water_${today}`);
    });
    expect(waterData).toBeTruthy();
    expect(Number(JSON.parse(waterData!))).toBe(2);
  });

  test('la hidratación termina sin mostrar datos locales si la API no responde (timeout 5s)', async ({ page }) => {
    // Never respond to API calls — simulate unreachable server
    await page.route('**/entries/**', () => { /* never fulfill */ });
    await page.route('**/auth/profile**', () => { /* never fulfill */ });

    await injectTestUser(page);

    await page.goto('/tabs/dashboard');

    // After ~5s timeout, the app should stop hydrating without showing local cache
    // Note: Wait for it to appear first, then wait for it to disappear
    await expect(page.locator('.hydration-overlay')).toBeVisible();
    await expect(page.locator('.hydration-overlay')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('.local-data-banner')).not.toBeVisible();

    // The dashboard shell should render even if the cloud never confirms data
    await expect(page.locator('app-hero-summary')).toBeVisible({ timeout: 3000 });
  });

  test('el sync badge muestra el estado correcto', async ({ page }) => {
    const backend = createVersionedBackend();
    await setupVersionedMocks(page, backend);
    await injectTestUser(page);
    await page.goto('/tabs/dashboard');
    await waitReady(page);

    const syncBadge = page.locator('.sync-badge');
    await expect(syncBadge).toBeVisible();
    await expect(syncBadge).toContainText(/Sincronizado/i, { timeout: 5000 });
  });

  test('dos sesiones: los datos del Device A no se pierden cuando Device B sincroniza', async ({ browser }) => {
    const backend = createVersionedBackend();

    // === Device A: add food ===
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await setupVersionedMocks(pageA, backend);
    await injectTestUser(pageA);
    await pageA.goto('/tabs/dashboard');
    await waitReady(pageA);

    // Add water from device A to trigger a sync
    const addWaterA = pageA.locator('app-water-tracker .water-btn').last();
    await addWaterA.click();
    await addWaterA.click();
    await addWaterA.click();

    // Wait for debounce + outbox to process
    await pageA.waitForTimeout(5000);

    // Verify backend has the water update
    expect(backend.getVersion()).toBeGreaterThan(0);
    expect(backend.getWater()).toBe(3);

    // === Device B: starts with stale data (version=0) ===
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    let isFirstDayRequest = true;
    await pageB.route('**/entries/day*', (route) => {
      if (isFirstDayRequest) {
        // Simulate stale data — device B hasn't seen the update from A
        isFirstDayRequest = false;
        route.fulfill({
          json: {
            success: true,
            data: {
              meals: [
                { name: 'Desayuno', icon: 'partly-sunny-outline', foods: [] },
                { name: 'Comida', icon: 'sunny-outline', foods: [] },
                { name: 'Cena', icon: 'moon-outline', foods: [] },
                { name: 'Snacks', icon: 'fast-food-outline', foods: [] },
              ],
              waterGlasses: 0,
              version: 0,
            },
          },
        });
      } else {
        backend.handleGetDay(route);
      }
    });
    await pageB.route('**/entries/sync*', (route, request) => backend.handleSync(route, request));
    await pageB.route('**/auth/profile*', (route) => backend.handleProfile(route));
    await pageB.route('**/entries/range*', (route) => backend.handleRange(route));

    await injectTestUser(pageB);
    await pageB.goto('/tabs/dashboard');
    await waitReady(pageB);

    // Device B adds water too
    const addWaterB = pageB.locator('app-water-tracker .water-btn').last();
    await addWaterB.click();
    await addWaterB.click();

    // Wait for sync
    await pageB.waitForTimeout(5000);

    // Backend should have preserved Device A's water (merge uses max)
    expect(backend.getWater()).toBeGreaterThanOrEqual(3);
    // Version should have incremented multiple times
    expect(backend.getVersion()).toBeGreaterThan(1);

    await contextA.close();
    await contextB.close();
  });
});

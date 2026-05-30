import { Page } from '@playwright/test';

/**
 * Mocks all backend API routes to avoid network dependency in E2E tests.
 * Call this at the top of every test before page.goto().
 */
export async function mockBackendRoutes(page: Page) {
  await page.route('**/entries/day*', route =>
    route.fulfill({ json: { success: true, data: { meals: [], waterGlasses: 0, version: 0 } } })
  );
  await page.route('**/auth/profile*', route =>
    route.fulfill({ json: { success: true, data: {} } })
  );
  await page.route('**/entries/range*', route =>
    route.fulfill({ json: { success: true, data: [] } })
  );
  await page.route('**/entries/sync*', route =>
    route.fulfill({ json: { success: true } })
  );
}

/**
 * Injects a valid test user in localStorage and marks onboarding as seen,
 * bypassing the auth guard and landing/onboarding screens.
 */
export async function injectTestUser(page: Page, userId = 'test_user') {
  await page.addInitScript((id) => {
    window.localStorage.setItem(
      'current_user',
      JSON.stringify({ id, name: 'Tester', email: 'test@test.com', picture: '' })
    );
    window.localStorage.setItem('onboardingSeen', '1');
  }, userId);
}

/**
 * Waits for the hydration overlay to disappear (dataReady signal becomes true).
 * Uses a 6-second timeout to cover the 5-second cloud hydration fallback.
 */
export async function waitForDashboard(page: Page) {
  await page.waitForSelector('.hydration-overlay', { state: 'hidden', timeout: 6000 });
}

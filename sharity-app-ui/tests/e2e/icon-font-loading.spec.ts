import { expect, test, type Page } from '@playwright/test';

async function mockPublicApi(page: Page) {
  await page.route('**/bff/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith('/session') ? { authenticated: false, roles: [] }
      : path.endsWith('/context') ? { countryCode: 'USA', countrySupported: true, locale: 'en-US' }
        : path.endsWith('/home') ? { verticals: [], categories: [], featuredListings: [] }
          : [];
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test('loads icon fonts before rendering the storefront', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mockPublicApi(page);
  await page.goto('/app/');
  await expect(page.getByTestId('guest-storefront')).toBeVisible();
  await expect(page.getByTestId('icon-font-loading')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('font timeout is handled and retry recovers', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Expo only observes web font loading in Chromium.');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let delayFonts = true;
  await mockPublicApi(page);
  await page.route(/\.ttf(?:\?|$)/, async route => {
    if (delayFonts) await new Promise(resolve => setTimeout(resolve, 7500));
    await route.continue();
  });
  await page.goto('/app/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Loading Sharity...', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText(
    'Unable to load app icons. Check your connection and try again.'
  );
  expect(errors).toEqual([]);
  delayFonts = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByTestId('guest-storefront')).toBeVisible();
  expect(errors).toEqual([]);
});

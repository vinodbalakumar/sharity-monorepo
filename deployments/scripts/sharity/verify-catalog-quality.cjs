const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const root = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
const { chromium, expect } = createRequire(path.join(root, 'sharity-app-ui/package.json'))('@playwright/test');
const origin = process.env.SHARITY_SMOKE_ORIGIN || 'http://localhost:8080';
let launchedBrowser;

(async () => {
  const browser = await chromium.launch();
  launchedBrowser = browser;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const catalogResponse = await context.request.get(`${origin}/bff/public/marketplace-service/api/v1/marketplace/listings`);
  expect(catalogResponse.ok()).toBe(true);
  const catalog = await catalogResponse.json();
  expect(catalog.length).toBeGreaterThan(0);
  const imageResults = [];
  for (const item of catalog) {
    expect(item.imageUrl).toMatch(/^\/marketplace-service\/api\/v1\/marketplace\/listings\/[a-zA-Z0-9_-]+\/image$/);
    const response = await context.request.get(`${origin}/bff/public${item.imageUrl}`);
    const contentType = response.headers()['content-type'];
    expect(response.status(), `Image for ${item.title}`).toBe(200);
    expect(contentType).toMatch(/^image\/(jpeg|png|webp|avif)/);
    expect((await response.body()).length).toBeGreaterThan(100);
    imageResults.push({ id: item.publicId, status: response.status(), contentType });
  }
  await page.goto(`${origin}/app/`);
  await expect(page.getByTestId('product-card')).toHaveCount(catalog.length, { timeout: 30000 });
  await expect(page.getByTestId('product-card').getByTestId('listing-image')).toHaveCount(catalog.length);
  await expect(async () => {
    const loaded = await page.getByTestId('product-card').getByTestId('listing-image').evaluateAll(elements => elements.every(element => {
      const img = element.matches('img') ? element : element.querySelector('img');
      return img && img.complete && img.naturalWidth > 0;
    }));
    expect(loaded).toBe(true);
  }).toPass({ timeout: 30000 });
  await page.screenshot({ path: path.join(root, 'outputs/quality-live-desktop.png') });
  const screens = [];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/app/', '/app/marketplaces', '/app/marketplace/digital', '/app/marketplace/jewellery']) {
      await page.goto(origin + route);
      await expect(page.getByTestId('app-header')).toBeVisible();
      await expect(page.getByTestId('product-card').or(page.getByTestId('catalog-product')).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      screens.push({ width, route });
    }
    if (width === 390) {
      await page.goto(`${origin}/app/`);
      await expect(page.getByTestId('product-card')).toHaveCount(catalog.length);
      await page.screenshot({ path: path.join(root, 'outputs/quality-live-mobile.png') });
    }
  }
  // Visit every current product with the real read-only API; no login or writes.
  await page.setViewportSize({ width: 390, height: 900 });
  for (const item of catalog) {
    await page.goto(`${origin}/app/products/${item.publicId}`);
    await expect(page.getByTestId('product-summary').getByText(item.title, { exact: true })).toBeVisible();
    await expect(page.getByTestId('product-gallery').getByTestId('listing-image')).toBeVisible();
    const gallery = await page.getByTestId('product-gallery').boundingBox();
    const summary = await page.getByTestId('product-summary').boundingBox();
    expect(summary.y).toBeGreaterThanOrEqual(gallery.y + gallery.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.goto(`${origin}/app/marketplaces`);
  await page.getByLabel('Search marketplace', { exact: true }).fill('unlikely-no-match-verify');
  await expect(page.getByText('No matching listings. Try a different search.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(catalog.length);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/sharity-admin/`);
    await expect(page.getByRole('heading', { name: 'Admin login', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
  const report = { origin, listingCount: catalog.length, images: imageResults, responsiveScreens: screens,
    productDetailsChecked: catalog.length, browserErrors: errors, mutationsPerformed: false };
  fs.writeFileSync(path.join(root, 'outputs/quality-live-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ listings: catalog.length, imagesPassed: imageResults.length, responsiveScreens: screens.length, productDetailsPassed: catalog.length, browserErrors: errors }));
  await browser.close();
})().catch(async error => { console.error(error.message); await launchedBrowser?.close(); process.exitCode = 1; });

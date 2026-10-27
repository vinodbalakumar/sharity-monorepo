// Authorized account smoke: credentials only from environment; remove only the item this run adds.
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../..');
const { chromium, expect } = createRequire(path.join(root, 'sharity-app-ui/package.json'))('@playwright/test');
const origin = process.env.SHARITY_LOGIN_ORIGIN || 'https://vinodbalakumar.com';
const email = process.env.LOGIN_TEST_EMAIL;
const password = process.env.LOGIN_TEST_PASSWORD;
if (!email || !password) throw new Error('Supply the authorized test account through environment variables.');
(async () => {
  const browser = await chromium.launch({ args: ['--disable-quic'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  page.setDefaultTimeout(45000);
  let cleanup;
  const report = { checkedAt: new Date().toISOString() };
  const checkpoint = stage => {
    report.stage = stage;
    fs.writeFileSync(path.join(root, 'outputs/physical-cart-live.json'), JSON.stringify(report, null, 2));
  };
  const api = (pathname, method = 'GET', body) => page.evaluate(async ({ pathname, method, body }) => {
    const session = await (await fetch('/bff/session')).json();
    const response = await fetch(pathname, { method, credentials: 'include', headers: {
      'Content-Type': 'application/json', ...(session.csrfToken ? { 'X-CSRF-TOKEN': session.csrfToken } : {})
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  }, { pathname, method, body });
  try {
    checkpoint('sign-in');
    await page.goto(`${origin}/app/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
    await expect(page.locator('input[name=username]')).toBeVisible();
    if (new URL(page.url()).origin !== origin) throw new Error('Unexpected credential form origin.');
    await page.locator('input[name=username]').fill(email);
    await page.locator('input[name=password]').fill(password);
    await page.locator('button[type=submit]').click();
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
    const session = await api('/bff/session');
    expect(session.data.authenticated).toBe(true);
    expect(session.data.email.toLowerCase()).toBe(email.toLowerCase());
    checkpoint('authenticated');
    const catalog = await api('/bff/public/marketplace-service/api/v1/marketplace/listings');
    expect(catalog.status).toBe(200);
    const physical = catalog.data.filter(item => item.productType === 'PHYSICAL');
    expect(physical.length).toBeGreaterThan(0);
    expect(physical.every(item => ['SHIPPING', 'SHIPPING_REQUIRED', 'LOCAL_PICKUP'].includes(item.deliveryType))).toBe(true);
    const base = '/bff/api/marketplace-service/api/v1/cart';
    const before = await api(`${base}/current`, 'POST');
    expect(before.status).toBe(200);
    const product = physical.find(item => !before.data.items.some(saved => saved.listingId === item.publicId));
    if (!product) throw new Error('No physical listing absent from the existing cart; refusing to alter an existing item.');
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/app/products/${product.publicId}`, { waitUntil: 'domcontentloaded' });
      const button = page.getByTestId('product-summary').getByRole('button', { name: 'Add to Cart', exact: true });
      await expect(button).toBeEnabled();
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: path.join(root, `outputs/physical-cart-${width}.png`) });
    }
    const addedResponse = page.waitForResponse(response => response.request().method() === 'POST'
      && new URL(response.url()).pathname === `${base}/${before.data.cartId}/items`);
    checkpoint('add-to-cart');
    await page.getByTestId('product-summary').getByRole('button', { name: 'Add to Cart', exact: true }).click();
    const added = await addedResponse;
    report.addStatus = added.status();
    if (!added.ok()) throw new Error(`Cart add failed with HTTP ${added.status()}: ${(await added.text()).slice(0, 500)}`);
    expect(added.ok()).toBe(true);
    const item = await added.json();
    cleanup = `${base}/${before.data.cartId}/items/${item.cartItemId}`;
    await expect(page.getByTestId('commerce-cart')).toBeVisible();
    await expect(page.getByTestId('commerce-cart').getByText(product.title, { exact: true })).toBeVisible();
    const after = await api(`${base}/current`, 'POST');
    expect(after.data.items.find(saved => saved.cartItemId === item.cartItemId)).toMatchObject({
      listingId: product.publicId, quantity: 1, deliveryType: 'SHIPPING'
    });
    const removed = await api(cleanup, 'DELETE');
    expect([200, 204]).toContain(removed.status);
    cleanup = null;
    const restored = await api(`${base}/current`, 'POST');
    expect(restored.data.items).toEqual(before.data.items);
    report.physicalListings = physical.length;
    report.widths = [1440, 320];
    report.addedAndPersisted = true;
    report.originalCartRestored = true;
    checkpoint('cart-restored');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true }).first()).toBeVisible();
    console.log('Physical cart passed: shipping data, desktop/mobile buttons, authenticated add, persistence and cleanup.');
  } finally {
    if (cleanup) {
      const removed = await api(cleanup, 'DELETE');
      report.cleanupStatus = removed.status;
    }
    fs.writeFileSync(path.join(root, 'outputs/physical-cart-live.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

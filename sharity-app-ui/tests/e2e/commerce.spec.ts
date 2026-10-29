import { test, expect, type Page } from '@playwright/test';

const listing = { publicId: 'listing-real-1', title: 'Steam gift card', description: 'Unused digital gift card.', productType: 'DIGITAL', deliveryType: 'CODE', currencyCode: 'USD', priceAmount: 20, imageUrl: null, sellerDisplayName: 'Seller store', verifiedSeller: false, categoryCode: 'GIFT_CARDS', verticalCode: 'MARKETPLACE', providerCountryCode: 'USA', listingStatus: 'ACTIVE', publicReviews: [], createdAt: '2026-10-25T12:00:00Z' };
const pending = { publicId: 'order-real-1', listingPublicId: listing.publicId, orderStatus: 'PAYMENT_PENDING', paymentStatus: 'PENDING', fulfillmentStatus: 'PENDING_DELIVERY', payoutStatus: 'PAYMENT_PENDING', customerTotalAmount: 20, currencyCode: 'USD', createdAt: '2026-10-25T12:00:00Z' };
async function fixture(page: Page, options: { admin?: boolean; enabled?: boolean; failPurchase?: boolean; failConfigOnce?: boolean; emptyCart?: boolean } = {}) {
  let quantity = 1;
  let removed = options.emptyCart ?? false;
  let configRequests = 0;
  const purchaseKeys: string[] = [];
  const calls: string[] = [];
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.includes('/bff/') && !url.pathname.includes('/api/')) return route.continue();
    const path = url.pathname;
    calls.push(path);
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json; charset=utf-8', headers: { 'X-Correlation-ID': 'support-ref-123' }, body: JSON.stringify(body) });
    if (path.endsWith('/session')) return send({ authenticated: true, publicId: 'buyer', roles: [options.admin ? 'ADMIN' : 'CUSTOMER'], csrfToken: 'test-csrf' });
    if (path.endsWith('/users/me')) return send({ publicId: 'buyer', username: 'buyer', profile: { countryCode: 'USA' }, roles: ['CUSTOMER'] });
    if (path.endsWith('/context')) return send({ countryCode: 'USA', countryName: 'United States', countrySupported: true });
    if (path.endsWith('/home')) return send({ verticals: [], categories: [], featuredListings: [listing] });
    if (path.endsWith('/listings')) return send([listing]);
    if (path.endsWith(`/listings/${listing.publicId}`)) return send(listing);
    if (path.endsWith('/commerce/config')) {
      if (options.failConfigOnce && configRequests++ === 0) return send({}, 503);
      return send({ enabled: options.enabled !== false, mode: options.enabled === false ? 'UNAVAILABLE' : 'DEMO' });
    }
    if (path.endsWith('/marketplace/orders') && route.request().method() === 'POST') {
      expect(route.request().headers()['x-csrf-token']).toBe('test-csrf');
      expect(route.request().postDataJSON()).toEqual({ listingPublicId: listing.publicId, expectedAmount: 20, expectedCurrency: 'USD' });
      purchaseKeys.push(route.request().headers()['idempotency-key'] ?? '');
      return options.failPurchase ? send({ message: 'SQL password=private-never-show' }, 503) : send(pending, 201);
    }
    if (path.endsWith(`/orders/purchases/${pending.publicId}`) || path.endsWith(`/orders/purchases/${pending.publicId}/refresh`)) return send(pending);
    if (path.endsWith('/cart/current')) return send({ cartId: 'cart-owned-1', currencyCode: 'USD', totalItems: removed ? 0 : quantity, subtotal: removed ? 0 : quantity * 20, items: removed ? [] : [{ cartItemId: 'item-1', listingId: listing.publicId, listingTitle: listing.title, unitPrice: 20, quantity, lineTotal: quantity * 20, deliveryType: 'SHIPPING' }] });
    if (path.endsWith('/cart/cart-owned-1/items/item-1')) {
      if (route.request().method() === 'DELETE') removed = true;
      else quantity = route.request().postDataJSON().quantity;
      return send({});
    }
    if (path.endsWith('/admin/diagnostics')) return send({ generatedAt: '2026-10-25T12:00:00Z', windowSeconds: 900, slowThresholdMs: 2000, aiEnabled: false, droppedAnalyses: 0, notice: 'Delivered samples only. No data does not mean healthy.', services: [{ service: 'payment-service', requests: 4, errors: 1, p95Ms: 4500, lastSeen: '2026-10-25T12:00:00Z', state: 'ERRORS_OBSERVED' }], incidents: [{ id: 'incident-1', time: '2026-10-25T12:00:00Z', service: 'payment-service', correlationId: 'support-ref-123', status: 503, durationMs: 4500, kind: 'SERVER_ERROR', analysisStatus: 'DISABLED', explanation: 'Inspect the correlated logs. The root cause has not been established.' }] });
    return send({});
  });
  return { purchaseKeys, calls };
}
async function openPurchase(page: Page) {
  await page.goto('/app/home');
  await expect(page.getByTestId('home-hero-title')).toBeVisible();
  await page.getByTestId('product-card').first().click();
  await page.getByRole('button', { name: 'Buy Now', exact: true }).first().click();
  await expect(page.getByTestId('commerce-checkout')).toBeVisible();
}
test('listing to review to recorded pending order survives refresh without claiming success', async ({ page }) => {
  const { purchaseKeys } = await fixture(page);
  await openPurchase(page);
  const submit = page.getByRole('button', { name: 'Create demo order' });
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Accept marketplace policies' }).check();
  await submit.click();
  await expect(page.getByText('Payment status: Awaiting confirmation', { exact: true })).toBeVisible();
  await expect(page.getByText('Your payment was successful', { exact: false })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Payment status: Awaiting confirmation', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check payment status' }).click();
  expect(purchaseKeys).toHaveLength(1);
  expect(purchaseKeys[0]).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
});
test('ambiguous purchase failure keeps a stable intent key and hides raw backend details', async ({ page }) => {
  const { purchaseKeys } = await fixture(page, { failPurchase: true });
  await openPurchase(page);
  await page.getByRole('checkbox', { name: 'Accept marketplace policies' }).check();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Create demo order' }).click();
    await expect(page.getByRole('alert')).toContainText('support-ref-123');
  }
  expect(purchaseKeys).toHaveLength(2);
  expect(purchaseKeys[0]).toBe(purchaseKeys[1]);
  await expect(page.getByText('SQL password=private-never-show')).toHaveCount(0);
});
test('disabled payment integration cannot create purchases', async ({ page }) => {
  const { purchaseKeys } = await fixture(page, { enabled: false });
  await openPurchase(page);
  await expect(page.getByText('Purchases are currently disabled. You have not been charged.')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Accept marketplace policies' }).check();
  await expect(page.getByRole('button', { name: 'Confirm purchase' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check availability again' }).click();
  await expect(page.getByTestId('checkout-unavailable')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Contact support', exact: true })).toBeEnabled();
  expect(purchaseKeys).toHaveLength(0);
});

test('availability failure retains listing details and recovers with consent intact', async ({ page }) => {
  const { purchaseKeys } = await fixture(page, { failConfigOnce: true });
  await openPurchase(page);
  await expect(page.getByText('Steam gift card', { exact: true })).toBeVisible();
  await expect(page.getByText('Unable to check checkout availability', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Accept marketplace policies' }).check();
  await page.getByRole('button', { name: 'Check availability again' }).click();
  await expect(page.getByRole('button', { name: 'Create demo order' })).toBeEnabled();
  await page.getByRole('button', { name: 'Create demo order' }).click();
  await expect(page.getByText('Payment status: Awaiting confirmation', { exact: true })).toBeVisible();
  expect(purchaseKeys).toHaveLength(1);
});

test('cart review opens checkout and the agreement label enables confirmation', async ({ page }) => {
  await fixture(page);
  await page.goto('/app/cart');
  await page.getByRole('button', { name: 'Review physical cart' }).click();
  await expect(page.getByTestId('physical-checkout-summary')).toBeVisible();
  const submit = page.getByRole('button', { name: 'Create demo cart checkout' });
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Accept physical cart policies' }).check();
  await expect(submit).toBeEnabled();
  await page.getByRole('checkbox', { name: 'Accept physical cart policies' }).uncheck();
  await expect(submit).toBeDisabled();
});

test('direct checkout without selection offers cart and marketplace recovery', async ({ page }) => {
  await fixture(page);
  await page.goto('/app/checkout');
  await expect(page.getByText('Choose an item to get started')).toBeVisible();
  await page.getByRole('button', { name: 'View your cart' }).click();
  await expect(page.getByTestId('commerce-cart')).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) test(`commerce layouts fit at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  await fixture(page);
  await page.goto('/app/cart');
  await expect(page.getByTestId('cart-summary')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath(`cart-${width}.png`), fullPage: true });
  await page.getByRole('button', { name: 'Review physical cart' }).click();
  await expect(page.getByTestId('physical-checkout-summary')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath(`checkout-${width}.png`), fullPage: true });
});
test('cart quantity and removal reflect API state', async ({ page }) => {
  await fixture(page);
  await page.goto('/app/cart');
  await expect(page.getByText('Steam gift card', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.getByLabel('Quantity', { exact: true })).toHaveText('2');
  await expect(page.getByRole('button', { name: 'Review physical cart' })).toBeEnabled();
  await page.getByRole('button', { name: 'Decrease quantity' }).click();
  await expect(page.getByRole('button', { name: 'Review physical cart' })).toBeEnabled();
  await page.getByRole('button', { name: 'Remove Steam gift card' }).click();
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
});
test('buyers cannot view admin monitoring or trigger its data request', async ({ page }) => {
  const { calls } = await fixture(page);
  await page.goto('/app/admin/diagnostics');
  await expect(page.getByText('Administrator access is required to view diagnostics.')).toBeVisible();
  expect(calls.filter(path => path.endsWith('/api/v1/admin/diagnostics'))).toHaveLength(0);
});
test('catalog filters preserve layout when resized and clear back to backend listings', async ({ page }) => {
  const { calls } = await fixture(page);
  await page.goto('/app/marketplace/digital');
  await expect(page.getByTestId('catalog-product')).toHaveCount(1);
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  const search = page.getByLabel('Search marketplace', { exact: true });
  await search.fill('not found');
  await expect(page.getByText('No matching products')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search and filters' }).click();
  await expect(page.getByTestId('catalog-product')).toHaveCount(1);
  expect(calls.some(path => path.endsWith('/listings'))).toBe(true);
});
for (const width of [320, 768, 1440]) test(`admin incidents render without AI and resize at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await fixture(page, { admin: true });
  await page.goto('/app/admin/diagnostics');
  await expect(page.getByText('Support reference: support-ref-123')).toBeVisible();
  await expect(page.getByText('AI analysis: disabled — measured incidents remain available')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath(`admin-${width}.png`), fullPage: true });
});

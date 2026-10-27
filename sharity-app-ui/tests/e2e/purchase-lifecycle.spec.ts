import { test, expect, type Page } from '@playwright/test';
const id = 'a165e6a3-21ee-4360-b675-4f0e694ccfb3';
const listing = { publicId: 'owned-listing', title: 'Sharity digital gift card', description: 'Digital gift card', priceAmount: 21.99, currencyCode: 'USD', categoryCode: 'GIFT_CARDS', verticalCode: 'MARKETPLACE', productType: 'DIGITAL', deliveryType: 'CODE', sellerDisplayName: 'Gift store', imageUrl: null, stockQuantity: 1, listingStatus: 'ACTIVE', publicReviews: [], createdAt: '2026-10-26T12:00:00Z' };
const pending = { publicId: id, listingPublicId: listing.publicId, orderStatus: 'PAYMENT_PENDING', paymentStatus: 'PENDING', fulfillmentStatus: 'PENDING_DELIVERY', payoutStatus: 'PAYMENT_PENDING', customerTotalAmount: 21.99, currencyCode: 'USD', createdAt: '2026-10-26T12:00:00Z' };
async function fixture(page: Page, options: { stayPending?: boolean; failRefresh?: boolean; missing?: boolean; physical?: boolean } = {}) {
  let current = { ...pending };
  const refreshes: string[] = [];
  const orderPosts: string[] = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'X-Correlation-ID': 'payment-help-ref' }, body: JSON.stringify(body) });
    if (path.endsWith('/session')) return send({ authenticated: true, publicId: 'buyer', roles: ['CUSTOMER'], csrfToken: 'test-csrf' });
    if (path.endsWith('/users/me')) return send({ publicId: 'buyer', username: 'Buyer', roles: ['CUSTOMER'], profile: { countryCode: 'USA' } });
    if (path.endsWith('/context')) return send({ countryCode: 'USA', countrySupported: true });
    if (path.endsWith('/commerce/config')) return send({ enabled: true, mode: 'DEMO' });
    const item = options.physical ? { ...listing, productType: 'JEWELLERY', deliveryType: 'SHIPPING' } : listing;
    if (path.endsWith(`/listings/${listing.publicId}`)) return send(item);
    if (path.endsWith('/listings')) return send([item]);
    if (path.endsWith('/home')) return send({ verticals: [], categories: [], featuredListings: [item] });
    if (path.endsWith('/marketplace/orders') && request.method() === 'POST') { orderPosts.push(request.headers()['idempotency-key'] ?? ''); return send(pending, 201); }
    if (path.endsWith(`/purchases/${id}/refresh`)) {
      expect(request.method()).toBe('POST');
      expect(request.headers()['x-csrf-token']).toBe('test-csrf');
      refreshes.push(path);
      if (options.failRefresh) return send({ message: 'SQL password=do-not-display' }, 503);
      if (!options.stayPending) current = { ...pending, paymentStatus: 'CAPTURED', orderStatus: 'PURCHASED' };
      return send(current);
    }
    if (path.endsWith('/orders/purchases')) return send([current]);
    if (path.endsWith(`/purchases/${id}`)) return options.missing ? send({}, 404) : send(current);
    if (path.includes('/purchases/')) return send({}, 404);
    if (path.endsWith('/content/pages/contact-us')) return send({ slug: 'contact-us', title: 'Contact Sharity', category: 'support', sections: [{ heading: 'Contact us', paragraphs: ['Find your order for purchase assistance.'] }] });
    return send({});
  });
  return { refreshes, orderPosts };
}

for (const route of ['details', 'tracking', 'receipt']) test(`${route} reconciles confirmed demo payment against the exact authenticated order`, async ({ page }) => {
  const { refreshes, orderPosts } = await fixture(page);
  await page.goto(`/app/orders/${route}?orderId=${id}&receiptId=untrusted-receipt`);
  await expect(page.getByTestId(`purchase-${route}`)).toBeVisible();
  await expect(page.getByText('Demo payment confirmed', { exact: true })).toBeVisible();
  await expect(page.getByText(id, { exact: true })).toBeVisible();
  await expect(page.getByText('Sharity digital gift card', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment: Confirmed', { exact: true })).toBeVisible();
  await expect(page.getByText('Your payment was successful', { exact: false })).toHaveCount(0);
  expect(refreshes).toHaveLength(1);
  expect(orderPosts).toHaveLength(0);
});

test('checkout immediately reconciles a new demo payment without needing the status button', async ({ page }) => {
  const { orderPosts } = await fixture(page);
  await page.goto(`/app/products/${listing.publicId}`);
  await page.getByRole('button', { name: 'Buy Now', exact: true }).first().click();
  await page.getByRole('checkbox', { name: 'Accept marketplace policies' }).check();
  await page.getByRole('button', { name: 'Create demo order', exact: true }).click();
  await expect(page.getByText('Demo payment confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View order details', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/app/orders/details\\?orderId=${id}`));
  await expect(page.getByText('Demo payment confirmed', { exact: true })).toBeVisible();
  expect(orderPosts).toHaveLength(1);
});

test('pending payment refresh gives useful feedback and never creates another order', async ({ page }) => {
  const { orderPosts, refreshes } = await fixture(page, { stayPending: true });
  await page.goto(`/app/orders/details?orderId=${id}`);
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
  await expect(page.getByText('Payment: Awaiting confirmation', { exact: true })).toBeVisible();
  expect(orderPosts).toHaveLength(0);
  await expect.poll(() => refreshes.length).toBeGreaterThanOrEqual(2);
});

test('failed payment refresh keeps the saved order and hides raw server details', async ({ page }) => {
  await fixture(page, { failRefresh: true });
  await page.goto(`/app/orders/details?orderId=${id}`);
  await expect(page.getByText('We could not update payment status.', { exact: false })).toBeVisible();
  await expect(page.getByText('Sharity digital gift card', { exact: true })).toBeVisible();
  await expect(page.getByText('SQL password=do-not-display', { exact: false })).toHaveCount(0);
});

test('digital tracking does not invent a carrier, parcel or delivery date', async ({ page }) => {
  await fixture(page);
  await page.goto(`/app/orders/tracking?orderId=${id}`);
  await expect(page.getByText('No parcel tracking needed', { exact: true })).toBeVisible();
  await expect(page.getByText('Awaiting seller delivery', { exact: true })).toBeVisible();
  await expect(page.getByText(/UPS|FedEx|In transit/, { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'View order details', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/app/orders/details\\?orderId=${id}`));
});

test('physical delivery without carrier data has an honest waiting state', async ({ page }) => {
  await fixture(page, { physical: true });
  await page.goto(`/app/orders/tracking?orderId=${id}`);
  await expect(page.getByText('Carrier tracking is not available yet', { exact: true })).toBeVisible();
  await expect(page.getByText('No parcel tracking needed', { exact: true })).toHaveCount(0);
});

test('unknown order has recovery actions and does not expose another purchase', async ({ page }) => {
  await fixture(page, { missing: true });
  await page.goto(`/app/orders/details?orderId=${id}`);
  await expect(page.getByRole('alert')).toContainText('could not be found');
  await expect(page.getByText('Sharity digital gift card', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'View my orders', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/orders$/);
});

test('help search, categories and contact navigation work without fake support tickets', async ({ page }) => {
  await fixture(page);
  await page.goto('/app/support');
  await expect(page.getByText('How can we help?', { exact: true })).toBeVisible();
  await expect(page.getByText('Admin Queue', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Feature preview', { exact: true })).toHaveCount(0);
  const search = page.getByRole('textbox', { name: 'Search help articles' });
  await search.fill('no matching question');
  await expect(page.getByText('No matching help articles', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.getByRole('button', { name: 'Payments', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Why is my payment still pending?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Where can I find my delivery updates?', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Contact information', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/support\/contact-us$/);
});

for (const width of [320, 768, 1440]) test(`order and help screens fit at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  await fixture(page);
  for (const route of ['details', 'tracking', 'receipt', 'support']) {
    await page.goto(route === 'support' ? '/app/support' : `/app/orders/${route}?orderId=${id}`);
    await expect(page.getByTestId(route === 'support' ? 'support-center' : `purchase-${route}`)).toBeVisible();
    if (route !== 'support') await expect(page.getByText('Demo payment confirmed', { exact: true })).toBeVisible();
    const title = route === 'support' ? 'How can we help?' : route === 'details' ? 'Order details' : route === 'tracking' ? 'Delivery & tracking' : 'Payment summary';
    const heading = await page.getByRole('heading', { name: title, exact: true }).boundingBox();
    expect(heading!.height).toBeLessThan(90);
    expect(heading!.width).toBeGreaterThan(width < 600 ? 200 : 300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${route}-${width}.png`), fullPage: true });
  }
});

test('two filtered products stay next to each other on desktop', async ({ page }) => {
  await fixture(page);
  await page.route('**/marketplace/listings*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify([listing, { ...listing, publicId: 'second-listing', title: 'Second digital card' }]) }));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/app/marketplaces');
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(2);
  const first = await cards.nth(0).boundingBox(); const second = await cards.nth(1).boundingBox();
  expect(first).not.toBeNull(); expect(second).not.toBeNull();
  expect(second!.x - first!.x - first!.width).toBeLessThan(25);
});

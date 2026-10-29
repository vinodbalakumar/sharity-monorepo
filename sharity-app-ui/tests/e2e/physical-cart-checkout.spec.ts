import { test, expect, type Page } from '@playwright/test';

const originalItems = [
  { cartItemId: 'line-a', listingId: 'physical-a', listingTitle: 'Seller A headphones', quantity: 2, unitPrice: 20, lineTotal: 40, deliveryType: 'SHIPPING', productType: 'PHYSICAL', currencyCode: 'USD' },
  { cartItemId: 'line-b', listingId: 'physical-b', listingTitle: 'Seller B necklace', quantity: 3, unitPrice: 10, lineTotal: 30, deliveryType: 'LOCAL_PICKUP', productType: 'PHYSICAL', currencyCode: 'USD' },
];
async function fixture(page: Page, options: { ambiguous?: boolean; disabled?: boolean; digital?: boolean; mixed?: boolean; storageFailure?: boolean; status?: string; rejection?: 'price' | 'existing' | 'unchanged'; rejectionStatus?: number; resolutionFailure?: boolean } = {}) {
  let items = originalItems.map(item => ({ ...item }));
  if (options.digital) items[1]!.deliveryType = 'CODE';
  if (options.mixed) items[1]!.currencyCode = 'EUR';
  let owner = 'buyer';
  let posts = 0;
  let status = options.status ?? 'PAYMENT_PENDING';
  const requests: { key: string; body: unknown }[] = [];
  const calls: string[] = [];
  let checkoutItems = originalItems.map(item => ({ ...item }));
  const response = () => ({
    checkoutPublicId: 'checkout-one', status, currencyCode: 'USD', itemAmount: checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0), platformFeeAmount: 3.5, customerTotalAmount: checkoutItems.reduce((sum, item) => sum + item.lineTotal, 0), providerAmount: 66.5,
    orders: checkoutItems.map((item, index) => ({ publicId: `child-${index + 1}`, listingPublicId: item.listingId, orderStatus: status, paymentStatus: status === 'PAID' ? 'CAPTURED' : status, fulfillmentStatus: 'PENDING_DELIVERY', payoutStatus: 'DISABLED', customerTotalAmount: item.lineTotal, currencyCode: 'USD', createdAt: '2026-10-28T12:00:00Z' })),
  });
  await page.route('**/*', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
    calls.push(path);
    const send = (body: unknown, code = 200) => route.fulfill({ status: code, contentType: 'application/json', headers: { 'X-Correlation-ID': 'cart-support-ref' }, body: JSON.stringify(body) });
    if (path.endsWith('/session')) return send({ authenticated: true, publicId: owner, roles: ['CUSTOMER'], csrfToken: 'test-csrf' });
    if (path.endsWith('/users/me')) return send({ publicId: owner, username: owner, roles: ['CUSTOMER'], profile: { countryCode: 'USA' } });
    if (path.endsWith('/context')) return send({ countryCode: 'USA', countrySupported: true });
    if (path.endsWith('/commerce/config')) return send({ enabled: !options.disabled, mode: 'DEMO' });
    if (path.endsWith('/cart/current')) return send({ cartId: 'physical-cart', currencyCode: 'USD', totalItems: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), items });
    const update = path.match(/\/cart\/physical-cart\/items\/(line-[ab])$/);
    if (update) {
      items = request.method() === 'DELETE' ? items.filter(item => item.cartItemId !== update[1]) : items.map(item => item.cartItemId === update[1] ? { ...item, quantity: request.postDataJSON().quantity, lineTotal: request.postDataJSON().quantity * item.unitPrice } : item);
      return send({});
    }
    if (path.endsWith('/marketplace/cart/physical-cart/checkout')) {
      expect(request.method()).toBe('POST');
      expect(request.headers()['x-csrf-token']).toBe('test-csrf');
      requests.push({ key: request.headers()['idempotency-key'] ?? '', body: request.postDataJSON() });
      posts++;
      if (options.rejection && posts === 1) {
        if (options.rejection === 'price') items[0] = { ...items[0]!, unitPrice: 25, lineTotal: 50 };
        if (options.rejection === 'existing') items = [];
        return send({}, options.rejectionStatus ?? 409);
      }
      if (items.length) checkoutItems = items.map(item => ({ ...item }));
      items = []; // The server may have committed even when the response is lost.
      if (options.ambiguous && posts === 1) return route.abort('failed');
      return send(response(), 201);
    }
    if (path.endsWith('/marketplace/cart/physical-cart/checkout-attempt')) {
      expect(request.method()).toBe('GET');
      expect(request.headers()['idempotency-key']).toBe(requests[0]!.key);
      if (options.resolutionFailure) return send({}, 503);
      return send({ checkout: options.rejection === 'existing' ? response() : null });
    }
    if (path.endsWith('/marketplace/checkouts/checkout-one')) {
      expect(request.method()).toBe('GET');
      return owner === 'buyer' ? send(response()) : send({}, 404);
    }
    if (path.endsWith('/orders/purchases')) return send(response().orders);
    return send({});
  });
  if (options.storageFailure) await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('physicalCartCheckout:')) throw new Error('Storage disabled');
      return original.call(this, key, value);
    };
  });
  return { requests, calls, setStatus: (next: string) => { status = next; }, setOwner: (next: string) => { owner = next; }, changeCart: () => { items = [{ ...originalItems[0]!, quantity: 4, lineTotal: 80 }]; } };
}
async function review(page: Page) {
  await page.goto('/app/cart');
  await page.getByRole('button', { name: 'Review physical cart', exact: true }).click();
  await expect(page.getByTestId('physical-cart-checkout')).toBeVisible();
}
async function confirm(page: Page) {
  await page.getByRole('checkbox', { name: 'Accept physical cart policies' }).check();
  await page.getByRole('button', { name: 'Create demo cart checkout', exact: true }).click();
}
test('all physical lines and quantities become one pending payment with individual orders, then refresh to paid', async ({ page }) => {
  const state = await fixture(page);
  await review(page);
  await expect(page).toHaveURL(/\/app\/cart-checkout$/);
  const summary = page.getByTestId('physical-checkout-summary');
  await expect(summary.getByText('$70.00', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Quantity: 2 × $20.00', { exact: true })).toBeVisible();
  await expect(page.getByText('Quantity: 3 × $10.00', { exact: true })).toBeVisible();
  await confirm(page);
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View order child-1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View order child-2', exact: true })).toBeVisible();
  expect(state.requests).toHaveLength(1);
  expect(state.requests[0]!.key).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
  expect(state.requests[0]!.body).toEqual({ items: originalItems.map(({ cartItemId, quantity, unitPrice, currencyCode }) => ({ cartItemId, quantity, unitPrice, currencyCode })) });
  expect(state.calls.filter(path => path.endsWith('/marketplace/orders'))).toHaveLength(0);
  await page.reload();
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  state.setStatus('PAID');
  await page.getByRole('button', { name: 'Check payment status', exact: true }).click();
  await expect(page.getByText('Payment confirmed', { exact: true })).toBeVisible();
  expect(state.requests).toHaveLength(1);
  await page.getByRole('button', { name: 'View order child-2', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/orders\/details\?orderId=child-2$/);
});
test('lost response survives reload and changed or consumed cart with original immutable key and request', async ({ page }) => {
  const state = await fixture(page, { ambiguous: true });
  await review(page);
  await confirm(page);
  await expect(page.getByRole('alert')).toContainText('Unable to connect');
  const first = state.requests[0];
  state.changeCart();
  await page.goto('/app/cart');
  await page.getByRole('button', { name: 'Resume saved cart checkout', exact: true }).click();
  await page.reload();
  await page.getByRole('checkbox', { name: 'Accept physical cart policies' }).check();
  await page.getByRole('button', { name: 'Retry saved checkout', exact: true }).click();
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  expect(state.requests).toEqual([first, first]);
  expect(state.calls.filter(path => path.endsWith('/checkout-attempt'))).toHaveLength(0);
  await page.goto('/app/cart');
  await expect(page.getByText('Your cart is empty.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume saved cart checkout', exact: true }).click();
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  expect(state.requests).toHaveLength(2);
});
test('price-change rejection resolves no checkout, returns to refreshed cart and reviews new snapshot and key', async ({ page }) => {
  const state = await fixture(page, { rejection: 'price' });
  await review(page); await confirm(page);
  await expect(page.getByRole('alert')).toContainText('No checkout was recorded. Return to cart');
  await expect(page.getByRole('button', { name: 'Retry saved checkout', exact: true })).toHaveCount(0);
  const rejected = await page.evaluate(() => JSON.parse(localStorage.getItem('physicalCartCheckout:buyer')!));
  expect(rejected.submitted).toBe(false);
  expect(rejected.rejected).toBe(true);
  expect(rejected.body.items[0].unitPrice).toBe(20);
  await page.reload();
  await expect(page.getByText('No checkout was recorded. Return to cart', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Return to cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume saved cart checkout', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Review physical cart', exact: true }).click();
  await expect(page.getByText('Quantity: 2 × $25.00', { exact: true })).toBeVisible();
  await confirm(page);
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  expect(state.requests).toHaveLength(2);
  expect(state.requests[1]!.key).not.toBe(state.requests[0]!.key);
  expect(state.requests[1]!.body).toEqual({ items: originalItems.map(({ cartItemId, quantity, unitPrice, currencyCode }, index) => ({ cartItemId, quantity, unitPrice: index === 0 ? 25 : unitPrice, currencyCode })) });
  expect(state.calls.filter(path => path.endsWith('/checkout-attempt'))).toHaveLength(1);
});
test('409 with an existing checkout recovers immutable parent without a second payment submission', async ({ page }) => {
  const state = await fixture(page, { rejection: 'existing' });
  await review(page); await confirm(page);
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('physicalCartCheckout:buyer')!));
  expect(saved.checkout.checkoutPublicId).toBe('checkout-one');
  expect(saved.submitted).toBe(true);
  await page.reload();
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  expect(state.requests).toHaveLength(1);
  expect(state.calls.filter(path => path.endsWith('/checkout-attempt'))).toHaveLength(1);
});
test('503 rejection resolved absent permits same reviewed snapshot to retry with its original key', async ({ page }) => {
  const state = await fixture(page, { rejection: 'unchanged', rejectionStatus: 503 });
  await review(page); await confirm(page);
  await expect(page.getByRole('alert')).toContainText('No checkout was recorded');
  await page.getByRole('button', { name: 'Return to cart', exact: true }).click();
  await page.getByRole('button', { name: 'Review physical cart', exact: true }).click();
  await confirm(page);
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  expect(state.requests).toEqual([state.requests[0], state.requests[0]]);
});
for (const failure of ['lookup', 'server'] as const) test(`${failure} failure preserves submitted attempt and original key despite a changed cart`, async ({ page }) => {
  const state = await fixture(page, { rejection: 'price', resolutionFailure: failure === 'lookup', rejectionStatus: failure === 'server' ? 500 : 409 });
  await review(page); await confirm(page);
  await expect(page.getByRole('alert')).toContainText(failure === 'lookup' ? 'Checkout could not be resolved' : 'temporarily unavailable');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('physicalCartCheckout:buyer')!));
  expect(saved.submitted).toBe(true);
  expect(saved.rejected).not.toBe(true);
  await page.getByRole('button', { name: 'Return to cart', exact: true }).click();
  await page.getByRole('button', { name: 'Resume saved cart checkout', exact: true }).click();
  await page.reload();
  await page.getByRole('checkbox', { name: 'Accept physical cart policies' }).check();
  await page.getByRole('button', { name: 'Retry saved checkout', exact: true }).click();
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  expect(state.requests).toEqual([state.requests[0], state.requests[0]]);
  expect(state.calls.filter(path => path.endsWith('/checkout-attempt'))).toHaveLength(failure === 'lookup' ? 1 : 0);
});
test('changed reviewed cart gets a new key and snapshot before any payment submission', async ({ page }) => {
  const state = await fixture(page);
  await review(page);
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('physicalCartCheckout:buyer')!));
  await page.getByRole('button', { name: 'Return to cart', exact: true }).click();
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).first().click();
  await expect(page.getByLabel('Quantity', { exact: true }).first()).toHaveText('3');
  await page.getByRole('button', { name: 'Review physical cart', exact: true }).click();
  const next = await page.evaluate(() => JSON.parse(localStorage.getItem('physicalCartCheckout:buyer')!));
  expect(next.requestKey).not.toBe(first.requestKey);
  expect(next.body.items[0].quantity).toBe(3);
  expect(state.requests).toHaveLength(0);
});
for (const status of ['PAYMENT_FAILED', 'ON_HOLD']) test(`${status} is explicit, never success, and cannot start another charge`, async ({ page }) => {
  const state = await fixture(page, { status });
  await review(page); await confirm(page);
  await expect(page.getByText('Payment needs attention', { exact: true })).toBeVisible();
  await expect(page.getByText('Payment confirmed', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create demo cart checkout', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Check payment status', exact: true }).click();
  expect(state.requests).toHaveLength(1);
});
for (const option of ['digital', 'mixed'] as const) test(`${option} cart cannot enter physical checkout`, async ({ page }) => {
  const state = await fixture(page, { [option]: true });
  await page.goto('/app/cart');
  await expect(page.getByRole('button', { name: 'Review physical cart', exact: true })).toBeDisabled();
  await expect(page.getByText(option === 'digital' ? /Cart checkout is for physical items only/ : /All physical cart items must use the same currency/)).toBeVisible();
  expect(state.requests).toHaveLength(0);
});
test('disabled commerce and failed durable storage cannot submit a cart payment', async ({ page }) => {
  const state = await fixture(page, { disabled: true });
  await review(page);
  await expect(page.getByText('Checkout availability is not confirmed.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create demo cart checkout', exact: true })).toHaveCount(0);
  expect(state.requests).toHaveLength(0);
});
test('storage failure blocks checkout before any POST', async ({ page }) => {
  const state = await fixture(page, { storageFailure: true });
  await page.goto('/app/cart');
  await page.getByRole('button', { name: 'Review physical cart', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  expect(state.requests).toHaveLength(0);
});
test('a different account cannot read or retry another buyer saved checkout', async ({ page }) => {
  const state = await fixture(page);
  await review(page); await confirm(page);
  await expect(page.getByText('Payment confirmation pending', { exact: true })).toBeVisible();
  state.setOwner('different-buyer');
  await page.reload();
  await expect(page.getByText('Choose your physical cart first', { exact: true })).toBeVisible();
  await expect(page.getByText('Checkout checkout-one', { exact: true })).toHaveCount(0);
  expect(state.requests).toHaveLength(1);
});
test('policies explain consolidated physical charge, digital Buy Now and disabled payouts and partial actions', async ({ page }) => {
  await fixture(page);
  await page.goto('/app/policies');
  await expect(page.getByText('Physical cart checkout includes every physical item', { exact: false })).toBeVisible();
  await expect(page.getByText('Instant-delivery digital purchases remain single-item through Buy Now', { exact: false })).toBeVisible();
  await expect(page.getByText('Partial refunds and cancellations are unavailable', { exact: false })).toBeVisible();
  await expect(page.getByText('Live payouts are disabled. Accepting a policy does not enable or promise payout release.', { exact: true })).toBeVisible();
});
for (const width of [320, 768, 1440]) test(`physical checkout fits ${width}px`, async ({ page }) => {
  await fixture(page);
  await page.setViewportSize({ width, height: 1000 });
  await review(page);
  await expect(page.getByTestId('physical-checkout-summary')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

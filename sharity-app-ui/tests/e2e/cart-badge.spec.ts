import { test, expect, type Page, type Route } from '@playwright/test';

async function fixture(page: Page, initial = 0) {
  const state = { quantity: initial, authenticated: true, owner: 'buyer-a', failAdd: false, cartCalls: 0, holdNext: false, held: null as Route | null };
  const listing = { publicId: 'badge-product', title: 'Crystal Pendant', productType: 'PHYSICAL', deliveryType: 'SHIPPING', currencyCode: 'USD', priceAmount: 20, originalPriceAmount: 25, categoryCode: 'NECKLACES', verticalCode: 'JEWELLERY', listingStatus: 'ACTIVE', stockQuantity: 20, publicReviews: [], createdAt: '2026-10-27T12:00:00Z' };
  const item = () => ({ cartItemId: 'item-1', listingId: listing.publicId, listingTitle: listing.title, quantity: state.quantity, unitPrice: 20, lineTotal: state.quantity * 20, deliveryType: 'SHIPPING' });
  const cart = () => ({ cartId: 'cart-1', totalItems: state.quantity, subtotal: state.quantity * 20, currencyCode: 'USD', items: state.quantity ? [item()] : [] });
  await page.route('**/bff/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path.endsWith('/session')) return send({ authenticated: state.authenticated, publicId: state.authenticated ? state.owner : null, roles: ['CUSTOMER'], csrfToken: 'fixture-csrf' });
    if (path.endsWith('/logout')) { state.authenticated = false; return route.fulfill({ status: 204 }); }
    if (path.endsWith('/users/me')) return send({ publicId: state.owner, profile: { countryCode: 'USA' }, roles: ['CUSTOMER'] });
    if (path.endsWith('/context')) return send({ countryCode: 'USA', countrySupported: true });
    if (path.endsWith('/listings')) return send([listing]);
    if (path.endsWith('/listings/badge-product')) return send(listing);
    if (path.endsWith('/home')) return send({ featuredListings: [listing] });
    if (path.endsWith('/cart/current')) {
      state.cartCalls++;
      if (state.holdNext) { state.holdNext = false; state.held = route; return; }
      return send(cart());
    }
    if (path.endsWith('/cart/cart-1/items')) {
      if (state.failAdd) return send({}, 503);
      state.quantity++; return send(item(), 201);
    }
    if (path.endsWith('/cart/cart-1/items/item-1')) {
      state.quantity = route.request().method() === 'DELETE' ? 0 : route.request().postDataJSON().quantity;
      return send(item());
    }
    return send({});
  });
  return state;
}
const badge = (page: Page) => page.getByTestId('cart-count-badge');
test('header count follows add, reload, quantity changes, and final removal', async ({ page }, info) => {
  await fixture(page); await page.goto('/app/products/badge-product');
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true }).first()).toBeEnabled();
  await expect(badge(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
  await expect(badge(page)).toHaveText('1');
  await page.screenshot({ path: info.outputPath('header-cart-count.png') });
  await page.reload(); await expect(badge(page)).toHaveText('1');
  await page.getByRole('button', { name: /^Cart\b/ }).click();
  await page.getByRole('button', { name: 'Increase quantity' }).click(); await expect(badge(page)).toHaveText('2');
  await page.getByRole('button', { name: 'Decrease quantity' }).click(); await expect(badge(page)).toHaveText('1');
  await page.getByRole('button', { name: 'Remove Crystal Pendant', exact: true }).click();
  await expect(page.getByText('Your cart is empty.', { exact: true })).toBeVisible(); await expect(badge(page)).toHaveCount(0);
});
test('failed adds preserve count; focus refreshes changes and sign-out clears the badge', async ({ page }) => {
  const state = await fixture(page, 1); await page.goto('/app/products/badge-product'); await expect(badge(page)).toHaveText('1');
  state.failAdd = true; await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
  await expect(page.getByText(/This service is temporarily unavailable/)).toBeVisible(); await expect(badge(page)).toHaveText('1');
  state.quantity = 120; await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await expect(badge(page)).toHaveText('99+');
  await expect(page.getByRole('button', { name: /^Cart\b/ })).toHaveAccessibleName('Cart, 120 items');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page.getByTestId('guest-storefront')).toBeVisible(); await expect(badge(page)).toHaveCount(0);
});
test('a late response from the previous account cannot overwrite the new count', async ({ page }) => {
  const state = await fixture(page, 1); await page.goto('/app/home'); await expect(badge(page)).toHaveText('1');
  state.holdNext = true; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => !!state.held).toBe(true);
  state.owner = 'buyer-b'; state.quantity = 7;
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await expect(badge(page)).toHaveText('7');
  const late = page.waitForResponse(response => response.url().endsWith('/cart/current'));
  await state.held!.fulfill({ json: { totalItems: 1, cartId: 'cart-old', items: [] } });
  await (await late).finished();
  await expect(badge(page)).toHaveText('7');
});
test('guests have no badge and do not request a private cart', async ({ page }) => {
  const state = await fixture(page, 9); state.authenticated = false;
  await page.goto('/app/'); await expect(page.getByTestId('guest-storefront')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true }).first()).toBeVisible();
  await expect(badge(page)).toHaveCount(0); expect(state.cartCalls).toBe(0);
});

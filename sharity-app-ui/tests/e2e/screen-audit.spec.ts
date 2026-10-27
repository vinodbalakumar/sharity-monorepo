import { test, expect, type Page } from '@playwright/test';
// Deliberately fail private APIs: every route must recover without a blank screen,
// unhandled rejection or horizontal overflow when a dependent service is unavailable.
const routes = [
 '/app/', '/app/home', '/app/marketplaces', '/app/marketplace/digital', '/app/marketplace/jewellery', '/app/electronics',
 '/app/products/audit-product', '/app/electronics/audit-product', '/app/cart', '/app/checkout', '/app/library', '/app/orders',
 '/app/orders/details?orderId=missing', '/app/orders/receipt?orderId=missing', '/app/orders/tracking?orderId=missing',
 '/app/orders/refund-request?orderId=missing', '/app/orders/refund-status?orderId=missing', '/app/orders/dispute?orderId=missing',
 '/app/orders/dispute-status?orderId=missing', '/app/notifications', '/app/admin/diagnostics', '/app/app-settings', '/app/login-security',
 '/app/profile', '/app/account-switcher', '/app/payment-authorization', '/app/pricing-promotions', '/app/rewards', '/app/wallet',
 '/app/marketplace-config', '/app/sell', '/app/seller', '/app/policies', '/app/support', '/app/register', '/app/forgot-password',
 '/app/library/reveal?accessId=missing', '/app/library/download?accessId=missing', '/app/payment/status', '/app/payment/failed', '/app/payment/cancelled',
 '/app/reset-password', '/app/verify-email', '/app/complete-registration', '/app/legal/privacy', '/chat'
];
async function failureFixture(page: Page) {
 await page.route('**/*', route => {
  const path = new URL(route.request().url()).pathname;
  if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
  const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  if (path.endsWith('/session')) return send({ authenticated: true, publicId: 'audit-user', roles: ['ADMIN'], csrfToken: 'test-csrf' });
  if (path.endsWith('/context')) return send({ countryCode: 'USA', countrySupported: true, locale: 'en-US' });
  if (path.endsWith('/users/me')) return send({ publicId: 'audit-user', username: 'audit-user', roles: ['ADMIN'], profile: { firstName: 'Test', lastName: 'Buyer', countryCode: 'USA' } });
  return send({ message: 'Temporarily unavailable', correlationId: 'audit-reference' }, 503);
 });
}
for (const width of [320, 1440]) for (const path of routes) {
 test(`screen recovery ${width}px ${path}`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await failureFixture(page); await page.setViewportSize({ width, height: 900 });
  await page.goto(path); await page.waitForTimeout(1700);
  expect(errors).toEqual([]);
  expect(await page.locator('body').innerText()).not.toBe('');
  const issues = await page.evaluate(() => {
   const problems: string[] = [];
   if (document.documentElement.scrollWidth > innerWidth + 1) problems.push('Document overflow');
   for (const el of Array.from(document.querySelectorAll('button, input, [role="button"], [role="textbox"]'))) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height && (r.left < -1 || r.right > innerWidth + 1)) problems.push(`Control outside viewport: ${el.getAttribute('aria-label') || el.textContent?.slice(0, 60)}`);
   }
   return problems;
  });
  expect(issues).toEqual([]);
 });
}

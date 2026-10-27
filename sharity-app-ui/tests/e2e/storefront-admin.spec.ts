import { test, expect } from '@playwright/test';
test('admin switches persist after reload and failed updates keep the saved value', async ({ page }) => {
  const rows = ['BEST_SELLING', 'TRENDING', 'RECENTLY_VIEWED', 'RECOMMENDED_DEALS', 'FLASH_DEALS', 'ALL_PRODUCTS'].map((code, position) => ({ code, title: code === 'ALL_PRODUCTS' ? 'All products' : code === 'FLASH_DEALS' ? 'Flash Deals' : code.replaceAll('_', ' '), enabled: true, position, listingIds: [], startsAt: null, endsAt: null }));
  let fail = false;
  await page.addInitScript(() => localStorage.setItem('sharity_admin_access_token', 'local-fixture-token'));
  await page.route('**/authorization-server/**', route => route.fulfill({ json: { publicId: 'admin-fixture', firstName: 'Store', lastName: 'Admin', roles: ['ADMIN'] } }));
  await page.route('**/marketplace-service/**', route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'PUT') {
      if (fail) return route.fulfill({ status: 503, json: {} });
      const code = url.pathname.split('/').pop();
      const row = rows.find(s => s.code === code)!; Object.assign(row, route.request().postDataJSON());
      return route.fulfill({ json: row });
    }
    return route.fulfill({ json: url.pathname.endsWith('/home-sections') ? rows : [{ publicId: 'deal-1', title: 'Test deal', stockQuantity: 4, priceAmount: 10, originalPriceAmount: 20, currencyCode: 'USD', listingStatus: 'ACTIVE' }] });
  });
  await page.goto('http://127.0.0.1:8098/sharity-admin/storefront');
  const control = page.getByRole('switch', { name: 'All products enabled', exact: true });
  await expect(page.getByRole('switch')).toHaveCount(6); await expect(control).toBeChecked();
  await control.click(); await expect(control).not.toBeChecked(); await expect(page.getByRole('status')).toContainText('disabled');
  await page.reload(); await expect(control).not.toBeChecked();
  await page.getByLabel('Campaign starts').fill('2026-11-01T10:00');
  await page.getByLabel('Campaign ends').fill('2026-11-02T10:00');
  await page.getByRole('checkbox', { name: /Test deal/ }).check();
  await page.getByRole('button', { name: 'Save campaign', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('campaign saved');
  expect(rows.find(s => s.code === 'FLASH_DEALS')!.listingIds).toEqual(['deal-1']);
  await page.reload();
  await expect(page.getByLabel('Campaign starts')).toHaveValue('2026-11-01T10:00');
  await expect(page.getByRole('checkbox', { name: /Test deal/ })).toBeChecked();
  await page.screenshot({ path: `../outputs/storefront-admin-${test.info().project.name}.png`, fullPage: true });
  fail = true; await control.click(); await expect(page.getByRole('alert')).toContainText('not saved'); await expect(control).not.toBeChecked();
});
test('customer cannot open storefront administration', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sharity_admin_access_token', 'local-fixture-token'));
  await page.route('**/authorization-server/**', route => route.fulfill({ json: { roles: ['CUSTOMER'] } }));
  await page.goto('http://127.0.0.1:8098/sharity-admin/storefront');
  await expect(page).toHaveURL(/http:\/\/127\.0\.0\.1:8098\/sharity-admin\/?$/);
  await expect(page.getByRole('link', { name: 'Storefront', exact: true })).toHaveCount(0);
});

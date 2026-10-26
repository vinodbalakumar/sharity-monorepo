import { test, expect, type Page } from '@playwright/test';
import { getRewardsDashboard as rewardsFixture } from '../../src/features/rewards/rewardsMockApi';

async function accountFixture(page: Page) {
  await page.route('**/*', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
    const send = (data: unknown) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
    if (path.endsWith('/session')) return send({ authenticated: true, publicId: 'actual-buyer', roles: ['CUSTOMER'] });
    if (path.endsWith('/users/me')) return send({ publicId: 'actual-buyer', username: 'Morgan', status: 'ACTIVE', profile: { countryCode: 'AUS', countryName: 'Australia' } });
    if (path.endsWith('/provider-accounts')) return send([]);
    if (path.endsWith('/modules')) return send([{ moduleCode: 'MARKETPLACE', moduleName: 'Marketplace', status: 'ACTIVE', availableToCustomer: true, providerAccessActive: false }]);
    if (path.endsWith('/context')) return send({ countryCode: 'AUS', countrySupported: true });
    if (path.endsWith('/registration-options')) return send({ countries: [], genders: [] });
    if (path.endsWith('/rewards/dashboard')) return rewardsFixture().then(send);
    return send({});
  });
}

test('malformed rewards data shows a recoverable state instead of a blank screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await accountFixture(page);
  await page.route('**/rewards/dashboard', route => route.fulfill({ contentType: 'application/json', body: '{}' }));
  await page.goto('/app/rewards');
  await expect(page.getByText('Rewards information is temporarily unavailable. Please try again.', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const route of ['app-settings', 'login-security', 'rewards', 'notifications', 'marketplace-config', 'pricing-promotions', 'support']) {
  test(`sample-data boundary remains visible after ${route} finishes loading`, async ({ page }) => {
    await accountFixture(page);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(`/app/${route}`);
    await expect(page.getByText('Feature preview', { exact: true })).toBeVisible();
    await expect(page.getByText('This section uses sample data. Actions here do not update your account, payments or support requests.')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test('account switcher uses the current buyer and never invents a verified seller', async ({ page }) => {
  await accountFixture(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/app/account-switcher');
  await expect(page.getByText('Morgan', { exact: true })).toBeVisible();
  await expect(page.getByText('Tech Deals Phoenix', { exact: false })).toHaveCount(0);
  await expect(page.getByText('PAYPAL_CONNECTED', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Switch to Seller', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start Seller Onboarding', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/sell$/);
});

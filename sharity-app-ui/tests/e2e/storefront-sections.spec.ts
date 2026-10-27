import { test, expect, type Page } from '@playwright/test';
const items = [0, 1, 2].map(i => ({ publicId: `discovery-${i}`, title: `Discovery product ${i}`, description: 'Product details',
  categoryCode: 'COURSES', verticalCode: 'MARKETPLACE', productType: 'DIGITAL', deliveryType: 'CODE', priceAmount: 20,
  originalPriceAmount: 30, currencyCode: 'USD', listingStatus: 'ACTIVE', stockQuantity: 10, publicReviews: [], createdAt: '2026-10-27T12:00:00Z' }));
const older = { ...items[0]!, publicId: 'older-bestseller', title: 'Older bestseller' };
const defaults = () => ['BEST_SELLING', 'TRENDING', 'RECENTLY_VIEWED', 'RECOMMENDED_DEALS', 'FLASH_DEALS', 'ALL_PRODUCTS'].map((code, position) => ({ code, title: ({ BEST_SELLING: 'Best selling', TRENDING: 'Trending', RECENTLY_VIEWED: 'Recently viewed', RECOMMENDED_DEALS: 'Recommended deals for you', FLASH_DEALS: 'Flash Deals', ALL_PRODUCTS: 'All products' } as Record<string, string>)[code], position, enabled: true, listingIds: [] as string[], startsAt: null as string | null, endsAt: null as string | null }));
async function mock(page: Page, sections = defaults()) {
  await page.route('**/bff/**', route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/session') ? { authenticated: false } : path.endsWith('/context') ? { countryCode: 'USA', countrySupported: true }
      : path.endsWith('/home-sections') ? sections : path.endsWith('/listings') ? items : path.includes('/listings/') ? [...items, older].find(i => path.endsWith(i.publicId))
      : path.endsWith('/home') ? { verticals: [], categories: [], featuredListings: items } : {};
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
}
test('empty discovery sections are hidden and admin can hide the full catalog', async ({ page }) => {
  const sections = defaults(); await mock(page, sections); await page.goto('/app/');
  await expect(page.getByTestId('product-card')).toHaveCount(3);
  await expect(page.getByTestId('discovery-product')).toHaveCount(0);
  sections.forEach(s => { s.enabled = false; s.listingIds = items.map(i => i.publicId); });
  await page.reload(); await expect(page.getByTestId('product-card')).toHaveCount(0);
  await expect(page.getByTestId('discovery-product')).toHaveCount(0);
});
test('ranked collections preserve backend order and scheduled Flash Deals expire', async ({ page }) => {
  await page.clock.install();
  const sections = defaults(); sections[0]!.listingIds = ['older-bestseller', 'discovery-0']; sections[1]!.listingIds = ['discovery-1'];
  sections[4]!.listingIds = ['discovery-0']; sections[4]!.startsAt = new Date(Date.now() - 60000).toISOString(); sections[4]!.endsAt = new Date(Date.now() + 3600000).toISOString();
  await mock(page, sections); await page.goto('/app/');
  await expect(page.getByTestId('storefront-best_selling').getByTestId('discovery-product').first()).toContainText('Older bestseller');
  await expect(page.getByTestId('product-card')).toHaveCount(3);
  await expect(page.getByTestId('storefront-trending')).toContainText('Discovery product 1');
  await expect(page.getByTestId('storefront-flash_deals')).toBeVisible();
  await page.screenshot({ path: `../outputs/storefront-collections-${test.info().project.name}.png`, fullPage: true });
  await page.clock.fastForward(3600001);
  await expect(page.getByTestId('storefront-best_selling')).toBeVisible(); await expect(page.getByTestId('storefront-flash_deals')).toHaveCount(0);
});
test('product views create recent history and category deals; clearing removes both', async ({ page }) => {
  await mock(page); await page.goto('/app/');
  await page.getByTestId('product-card').first().click();
  await expect(page).toHaveURL(/products\/discovery-0/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('sharity_viewed_v1_guest') || '[]').length)).toBe(1);
  await page.goto('/app/');
  await expect(page.getByTestId('storefront-recently_viewed')).toContainText('Discovery product 0');
  const recommended = page.getByTestId('storefront-recommended_deals');
  await expect(recommended.getByTestId('discovery-product')).toHaveCount(2);
  await expect(recommended).not.toContainText('Discovery product 0');
  await page.getByRole('button', { name: 'Clear history', exact: true }).click();
  await expect(page.getByTestId('storefront-recently_viewed')).toHaveCount(0);
  await expect(recommended).toHaveCount(0);
});
test('expired and other-account history never appears', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sharity_viewed_v1_guest', JSON.stringify([{ id: 'discovery-0', at: Date.now() - 31 * 86400000 }]));
    localStorage.setItem('sharity_viewed_v1_someone-else', JSON.stringify([{ id: 'discovery-1', at: Date.now() }]));
  });
  await mock(page); await page.goto('/app/'); await expect(page.getByTestId('product-card')).toHaveCount(3);
  await expect(page.getByTestId('storefront-recently_viewed')).toHaveCount(0);
  await expect(page.getByTestId('storefront-recommended_deals')).toHaveCount(0);
});

import { test, expect } from '@playwright/test';
const codes = ['COURSES', 'NECKLACES', 'RINGS', 'BANGLES', 'GAMES', 'EARRINGS', 'COMBOS', 'SOFTWARE', 'GIFTCARDS'];
const items = codes.map((categoryCode, index) => ({ publicId: `category-${index}`, title: `Listing ${index}`, description: 'Sample listing', categoryCode,
  verticalCode: 'MARKETPLACE', productType: 'DIGITAL', deliveryType: 'CODE', priceAmount: 20, currencyCode: 'USD', listingStatus: 'ACTIVE',
  publicReviews: [], createdAt: '2026-10-26T12:00:00Z', demoSeed: true, imageUrl: null }));
test('mobile shoppers see products early and can filter every backend category', async ({ page }) => {
  await page.route('**/bff/**', route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/session') ? { authenticated: false }
      : path.endsWith('/context') ? { countryCode: 'USA', countrySupported: true }
      : path.endsWith('/listings') ? items : path.endsWith('/home') ? { verticals: [], categories: [], featuredListings: items } : {};
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/');
  await expect(page.getByTestId('product-card')).toHaveCount(9);
  const first = await page.getByTestId('product-card').first().boundingBox();
  expect(first!.y).toBeLessThan(760);
  const filters = page.getByTestId('catalog-filters');
  await filters.getByRole('button', { name: 'Show categories', exact: true }).click();
  await filters.getByText('Gift cards', { exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-card').getByText('Listing 8', { exact: true })).toBeVisible();
  await filters.getByRole('button', { name: 'Hide categories', exact: true }).click();
  await filters.getByText('All categories', { exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

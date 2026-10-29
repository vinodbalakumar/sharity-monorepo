import { test, expect, type Page } from '@playwright/test';

const products = Array.from({ length: 30 }, (_, index) => ({
  publicId: `catalog-${index}`, title: `Catalog product ${String(index).padStart(2, '0')}`,
  description: 'Current listing with seller-provided product details.',
  categoryCode: index % 2 ? 'RINGS' : 'GIFTCARDS', verticalCode: index % 2 ? 'JEWELLERY' : 'MARKETPLACE',
  productType: index % 2 ? 'PHYSICAL' : 'DIGITAL', deliveryType: index % 2 ? 'SHIPPING' : 'CODE',
  currencyCode: 'USD', priceAmount: 10 + index, originalPriceAmount: index % 3 ? null : 60,
  imageUrl: null, sellerDisplayName: 'Catalog seller', verifiedSeller: index % 2 === 0,
  stockQuantity: index === 0 ? 0 : 5, listingStatus: 'ACTIVE',
  publicReviews: index === 2 ? [{ rating: 5 }] : [], createdAt: new Date(2026, 9, index + 1).toISOString(),
}));
async function mock(page: Page, options: { error?: boolean; empty?: boolean; mixedCurrency?: boolean; authenticated?: boolean; vertical?: string } = {}) {
  await page.route('**/bff/**', route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const items = options.empty ? [] : products.map((item, index) => ({
      ...item,
      currencyCode: options.mixedCurrency && index % 2 ? 'EUR' : item.currencyCode,
      verticalCode: options.vertical ?? item.verticalCode,
    }));
    if (path.endsWith('/listings') && options.error) return route.fulfill({ status: 503, body: '{}' });
    const data = path.endsWith('/session') ? { authenticated: !!options.authenticated, publicId: 'catalog-buyer' }
      : path.endsWith('/context') ? { countryCode: 'USA', countrySupported: true }
        : path.endsWith('/listings') ? items.filter(item => !url.searchParams.has('verticalCode') || item.verticalCode === url.searchParams.get('verticalCode'))
          : path.includes('/listings/') ? items.find(item => path.endsWith(item.publicId))
            : path.endsWith('/home') ? { verticals: [], categories: [], featuredListings: items } : {};
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
}
for (const [width, height] of [[320, 568], [360, 800], [375, 667], [390, 844], [412, 915], [430, 932], [667, 375], [768, 1024], [820, 1180], [1024, 768], [1440, 900]] as const) {
  test(`catalog adapts to ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await mock(page);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/app/marketplaces');
    await expect(page.getByTestId('product-card')).toHaveCount(24);
    await expect(page.getByRole('heading', { name: 'All products', exact: true })).toBeVisible();
    await expect(page.getByTestId('home-hero-title')).toHaveCount(0);
    const grid = page.getByTestId('marketplace-grid');
    const first = await grid.getByTestId('product-card').nth(0).boundingBox();
    const second = await grid.getByTestId('product-card').nth(1).boundingBox();
    expect(first!.width).toBeGreaterThan(110);
    expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
    if (width < 1024) await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(page.getByTestId('marketplace-filters')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Gift cards', exact: true }).click();
    await expect(page.getByTestId('product-card')).toHaveCount(15);
    if (width < 1024) await page.getByRole('button', { name: 'Show 15 products', exact: true }).click();
    await page.setViewportSize({ width: width >= 1024 ? 390 : 1440, height });
    await expect(page.getByTestId('product-card')).toHaveCount(15);
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`catalog-${width}.png`) });
  });
}
test('sorting, prices, preferences, pagination and search work together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mock(page);
  await page.goto('/app/marketplaces');
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(24);
  await page.getByTestId('page-scroll').evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(cards).toHaveCount(30);
  await expect(cards.first()).toContainText('Catalog product 00');
  await expect(cards.last()).toContainText('Catalog product 29');
  await page.getByRole('button', { name: 'Price: high to low', exact: true }).click();
  await expect(cards).toHaveCount(24);
  await expect(cards.first()).toContainText('Catalog product 29');
  await page.getByRole('button', { name: 'Price: low to high', exact: true }).click();
  await expect(cards.first()).toContainText('Catalog product 00');
  await page.getByRole('button', { name: 'Newest first', exact: true }).click();
  await expect(cards.first()).toContainText('Catalog product 29');
  await page.getByRole('button', { name: 'Top rated', exact: true }).click();
  await expect(cards.first()).toContainText('Catalog product 02');
  await expect(cards.first()).toContainText('5.0');
  await page.getByLabel('Minimum price', { exact: true }).fill('15');
  await page.getByLabel('Maximum price', { exact: true }).fill('20');
  await expect(cards).toHaveCount(6);
  await page.getByRole('checkbox', { name: 'Verified sellers', exact: true }).click();
  await expect(cards).toHaveCount(3);
  await page.getByRole('checkbox', { name: 'Offers only', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Catalog product 06');
  await page.getByLabel('Minimum price', { exact: true }).fill('25');
  await expect(page.getByRole('alert')).toContainText('Minimum price must not exceed maximum price.');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(cards).toHaveCount(24);
  await page.getByRole('checkbox', { name: 'In stock only', exact: true }).click();
  await expect(page.getByText('Showing 1-24 of 29 products', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rated 4 stars & up', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Shipping', exact: true }).click();
  await expect(cards).toHaveCount(15);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByLabel('Search marketplace', { exact: true }).fill('Catalog product 02');
  await expect(cards).toHaveCount(1);
  await cards.click();
  await expect(page).toHaveURL(/products\/catalog-2$/);
});
test('categories, delivery methods and shopping preferences can be selected together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mock(page);
  await page.goto('/app/marketplaces');
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(24);

  await page.getByRole('checkbox', { name: 'Gift cards', exact: true }).click();
  await expect(cards).toHaveCount(15);
  await page.getByRole('checkbox', { name: 'Rings', exact: true }).click();
  await expect(cards).toHaveCount(24);
  await page.getByRole('checkbox', { name: 'All categories', exact: true }).click();
  await expect(cards).toHaveCount(24);

  await page.getByRole('checkbox', { name: 'Shipping', exact: true }).click();
  await expect(cards).toHaveCount(15);
  await page.getByRole('checkbox', { name: 'Code', exact: true }).click();
  await expect(cards).toHaveCount(24);
  await page.getByRole('checkbox', { name: 'All delivery methods', exact: true }).click();
  await expect(cards).toHaveCount(24);

  await page.getByRole('checkbox', { name: 'Verified sellers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Offers only', exact: true }).click();
  await expect(cards).toHaveCount(5);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(cards).toHaveCount(24);
});
test('mixed-currency price filters require a currency and never compare unlike amounts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mock(page, { mixedCurrency: true });
  await page.goto('/app/marketplaces');
  await expect(page.getByTestId('product-card')).toHaveCount(24);
  await expect(page.getByLabel('Minimum price', { exact: true })).not.toBeEditable();
  await page.getByRole('checkbox', { name: 'USD', exact: true }).click();
  await page.getByLabel('Maximum price', { exact: true }).fill('14');
  await expect(page.getByTestId('product-card')).toHaveCount(3);
  await page.getByRole('checkbox', { name: 'All currencies', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(24);
});
test('catalog errors retry, and empty results have working recovery', async ({ page }) => {
  await mock(page, { error: true });
  await page.goto('/app/marketplaces');
  await expect(page.getByRole('alert')).toContainText('Products are unavailable');
  await page.unrouteAll({ behavior: 'wait' });
  await mock(page);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(24);
  await page.getByLabel('Search marketplace', { exact: true }).fill('not-in-catalog');
  await expect(page.getByText('No matching products', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search and filters', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(24);
  await page.unrouteAll({ behavior: 'wait' });
  await mock(page, { empty: true });
  await page.reload();
  await expect(page.getByText('No products available yet', { exact: true })).toBeVisible();
});
for (const [path, title, count] of [['digital', 'Digital discoveries', 15], ['jewellery', 'Jewellery & accessories', 15]] as const) {
  test(`${path} uses the shared catalog and correct vertical`, async ({ page }) => {
    await mock(page);
    await page.goto(`/app/marketplace/${path}`);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByTestId('catalog-product')).toHaveCount(count);
  });
}

for (const [path, vertical, home] of [
  ['/app/', 'MARKETPLACE', true],
  ['/app/home', 'MARKETPLACE', true],
  ['/app/marketplaces', 'MARKETPLACE', false],
  ['/app/marketplace/digital', 'MARKETPLACE', false],
  ['/app/marketplace/jewellery', 'JEWELLERY', false],
  ['/app/electronics', 'ELECTRONICS', false],
] as const) {
  test(`scrolling appends products without duplicates on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mock(page, { authenticated: path === '/app/home', vertical });
    await page.goto(path);
    const cards = home
      ? page.getByTestId('home-product-grid').getByTestId('product-card')
      : page.getByTestId('marketplace-grid').getByTestId(path.includes('/marketplace/') || path === '/app/electronics' ? 'catalog-product' : 'product-card');
    await expect(cards).toHaveCount(24);
    await page.getByTestId('page-scroll').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(cards).toHaveCount(30);
    await expect(cards.first()).toContainText('Catalog product 00');
    await expect(cards.last()).toContainText('Catalog product 29');
    await page.getByLabel('Search marketplace', { exact: true }).fill('Catalog product 02');
    await expect(cards).toHaveCount(1);
    await page.getByRole('button', { name: 'clear', exact: true }).click();
    await expect(page.getByLabel('Search marketplace', { exact: true })).toHaveValue('');
    await expect(cards).toHaveCount(24);
  });
}

for (const destination of ['Wallet', 'Profile', 'Cart'] as const) {
  test(`401 from ${destination} immediately signs out even if server logout fails`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mock(page, { authenticated: true });
    await page.goto('/app/marketplaces');
    await expect(page.getByTestId('product-card')).toHaveCount(24);
    await page.evaluate(() => {
      for (const key of ['access_token', 'refresh_token', 'id_token', 'user_id', 'user_email']) localStorage.setItem(key, 'expired-value');
    });
    let logoutCount = 0;
    await page.route('**/bff/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/logout')) {
        logoutCount += 1;
        return route.fulfill({ status: 503, body: '{}' });
      }
      if (path.includes('/api/') && !path.includes('/public/')) return route.fulfill({ status: 401, body: '{}' });
      return route.fallback();
    });
    await page.getByRole('button', { name: destination, exact: true }).click();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByRole('alert')).toContainText('Your session has expired. You have been signed out. Please sign in again.');
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0);
    for (const key of ['access_token', 'refresh_token', 'id_token', 'user_id', 'user_email']) {
      expect(await page.evaluate(name => localStorage.getItem(name), key)).toBeNull();
    }
    await expect.poll(() => logoutCount).toBe(1);
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Your session has expired.');
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0);
  });
}

import { test, expect, type Page } from '@playwright/test';

const listings = Array.from({ length: 8 }, (_, i) => ({
  publicId: `listing-${i}`, title: i === 0 ? 'Steam gift card' : `Digital discovery ${i}`,
  description: 'A digital marketplace listing', productType: 'DIGITAL', deliveryType: 'CODE', currencyCode: 'USD', priceAmount: 20 + i,
  originalPriceAmount: 30 + i, imageUrl: null, sellerDisplayName: 'Discovery Store', verifiedSeller: true,
  categoryCode: 'GIFT_CARDS', verticalCode: 'MARKETPLACE', providerCountryCode: 'USA', listingStatus: 'ACTIVE',
  publicReviews: [], createdAt: '2026-10-25T12:00:00Z'
}));
const home = {
  verticals: [{ moduleCode: 'MARKETPLACE', moduleName: 'Digital Marketplace', status: 'ACTIVE', availableToCustomer: true, customerAccessEnabled: true }],
  categories: [{ id: 1, code: 'GIFT_CARDS', name: 'Gift Cards', verticalCode: 'MARKETPLACE', active: true, countryCode: 'USA' }],
  featuredListings: listings, popularListings: listings
};

async function mockApi(page: Page, mode: 'success' | 'error' | 'empty' = 'success') {
  // Network contracts are mocked; these tests do not claim live backend coverage.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.includes('/bff/') && !url.pathname.includes('/api/')) return route.continue();
    expect(url.origin, 'Test export must use same-origin APIs, without cached workstation URLs').toBe('http://127.0.0.1:8097');
    const headers = {
      'Access-Control-Allow-Origin': route.request().headers().origin ?? 'http://127.0.0.1:8097',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-TOKEN, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const send = (body: unknown, status = 200) => route.fulfill({ status, headers, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) });
    if (url.pathname.endsWith('/session')) return send({ authenticated: true, publicId: 'test-buyer', roles: ['CUSTOMER'] });
    if (url.pathname.endsWith('/users/me')) return send({ publicId: 'test-buyer', profile: { countryCode: 'USA' }, roles: ['CUSTOMER'] });
    if (url.pathname.endsWith('/context')) return send({ countryCode: 'USA', countryName: 'United States', countrySupported: true, locale: 'en-US' });
    if (url.pathname.endsWith('/home')) return send(mode === 'empty' ? { verticals: [], categories: [], featuredListings: [] } : home, mode === 'error' ? 503 : 200);
    if (url.pathname.endsWith('/listings')) return send(mode === 'empty' ? [] : listings, mode === 'error' ? 503 : 200);
    return send({});
  });
}

async function checkTypographyAndOverflow(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate(() => {
    const issues: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth + 1) issues.push('Document overflows viewport');
    const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (textNodes.nextNode()) {
      const node = textNodes.currentNode;
      const el = node.parentElement;
      if (!el || !node.textContent?.trim()) continue;
      const css = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || css.visibility === 'hidden' || css.display === 'none') continue;
      // Icon fonts contain private-use glyphs; validate text separately.
      if (/ionicons|material|fontawesome/i.test(css.fontFamily)) continue;
      const size = parseFloat(css.fontSize);
      if (size < 11 || !Number.isFinite(size)) issues.push(`Unreadable size: ${node.textContent.slice(0, 40)} (${size})`);
      if (/Times New Roman|^serif$/i.test(css.fontFamily)) issues.push(`Unexpected serif font: ${css.fontFamily}`);
      if (!document.fonts.check(`${css.fontSize} ${css.fontFamily}`)) issues.push(`Font not loaded: ${css.fontFamily}`);
      const lineHeight = parseFloat(css.lineHeight);
      if (Number.isFinite(lineHeight) && lineHeight < size) issues.push(`Clipped line height: ${node.textContent.slice(0, 40)}`);
      if (/INPUT|TEXTAREA/.test(el.tagName) && size < 16) issues.push('Input below 16px may zoom on iOS');
    }
    return issues;
  });
  expect(problems).toEqual([]);
}

for (const [width, height] of [[320,568], [360,800], [375,667], [390,844], [412,915], [430,932], [667,375], [768,1024], [820,1180], [1024,768], [1440,900]] as const) {
  test(`storefront typography and layout at ${width}x${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await mockApi(page);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/app/home');
    await expect(page.getByTestId('home-hero-title')).toBeVisible();
    await expect(page.getByTestId(width < 768 ? 'mobile-navigation' : 'desktop-navigation')).toBeVisible();
    const hero = await page.getByTestId('home-hero-title').boundingBox();
    expect(hero!.width).toBeGreaterThan(width < 768 ? 220 : 250);
    await expect(page.getByTestId('product-card')).toHaveCount(8);
    const scroll = page.getByTestId('page-scroll');
    // Scan all rendered text and inspect each section throughout the scroll.
    await checkTypographyAndOverflow(page);
    for (const fraction of [0.3, 0.6, 1]) {
      await scroll.evaluate((el, value) => { el.scrollTop = (el.scrollHeight - el.clientHeight) * value; }, fraction);
      await checkTypographyAndOverflow(page);
    }
    expect(errors).toEqual([]);
    await scroll.evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: testInfo.outputPath(`storefront-${width}.png`), fullPage: true });
  });
}

test('live resizing preserves search and switches navigation', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/app/home');
  const search = page.getByLabel('Search marketplace', {exact:true});
  await search.fill('Steam');
  await expect(page.getByText('1 matching listings')).toBeVisible();
  for (const width of [1024, 768, 430, 320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(search).toHaveValue('Steam');
    await expect(page.getByTestId(width < 768 ? 'mobile-navigation' : 'desktop-navigation')).toBeVisible();
    await checkTypographyAndOverflow(page);
  }
  await search.fill('nonexistent listing');
  await expect(page.getByText('No matching listings. Try a different search.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toHaveValue('');
});

test('backend failure offers a working retry', async ({ page }) => {
  await mockApi(page, 'error');
  await page.goto('/app/home');
  await expect(page.getByText('Your next great find starts here.')).not.toBeVisible();
  const retry = page.getByText('Retry', { exact: true }).first();
  await expect(retry).toBeVisible();
  await page.unrouteAll({ behavior: 'wait' });
  await mockApi(page);
  await retry.click();
  await expect(page.getByTestId('home-hero-title')).toBeVisible();
});

test('empty catalog renders without fabricated products', async ({ page }) => {
  await mockApi(page, 'empty');
  await page.goto('/app/home');
  await expect(page.getByTestId('home-hero-title')).toBeVisible();
  await expect(page.getByTestId('product-card')).toHaveCount(0);
  await checkTypographyAndOverflow(page);
});

test('session restoration recovers from a transient service failure', async ({ page }) => {
  await mockApi(page);
  let failed = 0;
  await page.route('**/bff/session', route => {
    if (failed++ < 2) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    return route.fallback();
  });
  await page.goto('/app/home');
  await expect(page.getByTestId('home-hero-title')).toBeVisible();
});

test('listing cards open real product routes', async ({ page }) => {
  await mockApi(page);
  await page.route('**/listings/listing-0*', route => route.fulfill({contentType:'application/json',body:JSON.stringify(listings[0])}));
  await page.goto('/app/home');
  await page.getByRole('button',{name:'View Steam gift card',exact:true}).click();
  await expect(page).toHaveURL(/\/app\/products\/listing-0/);
  await expect(page.getByText('Steam gift card',{exact:true}).first()).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/app\/products\/listing-0/);
  await expect(page.getByText('Steam gift card',{exact:true}).first()).toBeVisible();
});

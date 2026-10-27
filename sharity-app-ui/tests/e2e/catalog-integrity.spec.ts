import { test, expect, type Page } from '@playwright/test';
const base = { publicId: 'quality-product', title: 'Steam gift card', description: 'Listing details', productType: 'DIGITAL', deliveryType: 'CODE', currencyCode: 'USD', priceAmount: 20, originalPriceAmount: null, imageUrl: '/marketplace-service/api/v1/marketplace/listings/quality-product/image', sellerDisplayName: 'Sample store', verifiedSeller: false, categoryCode: 'GIFT_CARDS', verticalCode: 'MARKETPLACE', listingStatus: 'ACTIVE', publicReviews: [], stockQuantity: 1, demoSeed: true, createdAt: '2026-10-26T12:00:00Z' };
async function fixture(page: Page, options: { brokenImage?: boolean; sold?: boolean; reserved?: boolean; orders?: boolean } = {}) {
 const listing = { ...base, listingStatus: options.reserved ? 'RESERVED' : base.listingStatus, productType: options.reserved ? 'PHYSICAL' : base.productType, deliveryType: options.reserved ? 'SHIPPING' : base.deliveryType, stockQuantity: options.sold ? 0 : 1 };
 const order = {publicId:'owned-order',listingPublicId:base.publicId,orderStatus:'PAYMENT_PENDING',paymentStatus:'PENDING',fulfillmentStatus:'READY',payoutStatus:'HOLD',customerTotalAmount:1500,currencyCode:'INR',createdAt:'2026-10-26T12:00:00Z'};
 await page.route('**/*', route => {
  const path = new URL(route.request().url()).pathname;
  if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
  const send = (data: unknown, status = 200) => route.fulfill({status, contentType: 'application/json', body: JSON.stringify(data)});
  if (path.endsWith('/session')) return send({authenticated: true, publicId:'buyer',roles:['CUSTOMER'],csrfToken:'test-csrf'});
  if (path.endsWith('/users/me')) return send({publicId:'buyer',profile:{countryCode:'USA'}});
  if (path.endsWith('/context')) return send({countryCode:'USA',countrySupported:true});
  if (path.endsWith('/image')) return options.brokenImage ? route.fulfill({status:404}) : route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=','base64')});
  if (path.endsWith('/listings/quality-product')) return send(listing);
  if (path.endsWith('/listings')) return send([listing]);
  if (path.endsWith('/home')) return send({verticals:[],categories:[],featuredListings:[listing]});
  if (path.endsWith('/orders/purchases')) return send(options.orders ? [order] : []);
  if (path.includes('/orders/purchases/')) return options.orders && /\/purchases\/owned-order(?:\/refresh)?$/.test(path) ? send(order) : send({}, 404);
  return send({});
 });
}
test('demo listings display their real image instead of forcing an illustration', async({page})=>{
 await fixture(page);await page.goto('/app/marketplaces');
 await expect(page.getByTestId('product-card').getByTestId('listing-image')).toBeVisible();
 await expect(page.getByRole('heading',{name:'All products',exact:true})).toBeVisible();
 await expect(page.getByText(/Demo catalog:|Current listings, clear prices/)).toHaveCount(0);
 await expect(page.getByTestId('product-card').getByText('Demo',{exact:true})).toHaveCount(0);
 await page.getByTestId('product-card').click();
 await expect(page.getByTestId('product-summary').getByText('Sample item',{exact:true})).toBeVisible();
 await expect(page.getByTestId('product-card').getByText('Image unavailable',{exact:true})).toHaveCount(0);
});
test('a missing image has an explicit fallback without breaking product navigation',async({page})=>{
 await fixture(page,{brokenImage:true});await page.goto('/app/marketplaces');
 await expect(page.getByTestId('product-card').getByText(/image unavailable/i)).toBeVisible();
 await page.getByTestId('product-card').click();await expect(page.getByTestId('product-summary')).toBeVisible();
});
test('out-of-stock listings cannot start a purchase',async({page})=>{
 await fixture(page,{sold:true});await page.setViewportSize({width:320,height:900});await page.goto('/app/products/quality-product');
 await expect(page.getByTestId('product-summary').getByRole('button',{name:'Buy Now',exact:true})).toBeDisabled();
 for (const button of await page.getByRole('button',{name:'Buy Now',exact:true}).all()) await expect(button).toBeDisabled();
 await expect(page.getByTestId('product-summary').getByText('Out of stock',{exact:true})).toBeVisible();
});
test('an unknown order never falls back to a different owned order',async({page})=>{
 await fixture(page,{orders:true});await page.goto('/app/orders/details?orderId=unknown-order');
 await expect(page.getByText('The requested item could not be found.',{exact:true})).toBeVisible();
 await expect(page.getByText('Steam gift card',{exact:true})).toHaveCount(0);
 await expect(page.getByText('owned-order',{exact:false})).toHaveCount(0);
});
test('orders preserve currency and do not claim pending digital access is ready',async({page})=>{
 await fixture(page,{orders:true});await page.goto('/app/orders/details?orderId=owned-order');
 await expect(page.getByText('Steam gift card',{exact:true}).first()).toBeVisible();
 await expect(page.getByText('Payment successful',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Digital access ready',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Payment confirmation pending',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Open my library',exact:true})).toHaveCount(0);
 await page.goto('/app/orders');await expect(page.getByText(/1,500/).first()).toBeVisible();
 await expect(page.getByText('$1,500.00',{exact:true})).toHaveCount(0);
});


test('reserved product links show details but cannot start another purchase', async ({ page }) => {
  await fixture(page, { reserved: true });
  await page.goto('/app/products/quality-product');
  await expect(page.getByTestId('product-summary')).toBeVisible();
  await expect(page.getByTestId('product-summary').getByText('RESERVED', { exact: true })).toBeVisible();
  await expect(page.getByTestId('product-summary').getByRole('button', { name: 'Buy Now', exact: true })).toBeDisabled();
  await expect(page.getByTestId('product-summary').getByRole('button', { name: 'Add to Cart', exact: true })).toBeDisabled();
  for (const button of await page.getByRole('button', { name: 'Buy Now', exact: true }).all()) await expect(button).toBeDisabled();
  for (const button of await page.getByRole('button', { name: 'Add to Cart', exact: true }).all()) await expect(button).toBeDisabled();
});

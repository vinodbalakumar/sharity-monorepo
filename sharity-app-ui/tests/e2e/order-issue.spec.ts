import { test, expect, type Page } from '@playwright/test';
async function fixture(page: Page, fail = false) {
  const reports: unknown[] = [];
  await page.route('**/*', route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
    const send = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'X-Correlation-ID': 'issue-support-ref' }, body: JSON.stringify(data) });
    if (path.endsWith('/session')) return send({ authenticated: true, publicId: 'buyer', roles: ['CUSTOMER'], csrfToken: 'fixture-csrf' });
    if (path.endsWith('/context')) return send({ countryCode: 'IND', countrySupported: true });
    if (path.endsWith('/orders/purchases')) return send([{ publicId: 'owned-order', listingPublicId: 'owned-listing', orderStatus: 'PAYMENT_PENDING', paymentStatus: 'PENDING', fulfillmentStatus: 'PENDING', payoutStatus: 'HOLD', customerTotalAmount: 1500, currencyCode: 'INR', createdAt: '2026-10-26T12:00:00Z' }]);
    if (path.endsWith('/listings/owned-listing')) return send({ publicId: 'owned-listing', title: 'Owned digital listing', categoryCode: 'GIFT_CARDS', productType: 'DIGITAL', deliveryType: 'CODE', imageUrl: null, sellerDisplayName: 'Store', listingStatus: 'ACTIVE' });
    if (path.endsWith('/owned-order/report-problem')) {
      expect(route.request().headers()['x-csrf-token']).toBe('fixture-csrf');
      reports.push(route.request().postDataJSON());
      return send(fail ? { message: 'SQL password=do-not-show' } : { message: 'Problem reported' }, fail ? 503 : 200);
    }
    return send({});
  });
  return reports;
}
test('review submits the exact owned order and confirms only after backend acknowledgement', async ({ page }) => {
  const reports = await fixture(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/app/orders/refund-request?orderId=owned-order');
  await expect(page.getByText('Owned digital listing', { exact: true })).toBeVisible();
  const submit = page.getByRole('button', { name: 'Submit issue report', exact: true });
  await expect(submit).toBeDisabled();
  await page.getByText('Another issue', { exact: true }).click();
  await page.getByLabel('Describe the order issue').fill('Please review the access problem on my order.');
  await submit.click();
  await expect(page.getByText('Your issue report was received.', { exact: true })).toBeVisible();
  await expect(submit).toHaveCount(0);
  expect(reports).toEqual([{ disputeReasonCode: 'OTHER_ISSUE', description: 'Please review the access problem on my order.' }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
test('missing order cannot submit a report against another purchase', async ({ page }) => {
  const reports = await fixture(page);
  await page.goto('/app/orders/refund-request?orderId=unowned-order');
  await expect(page.getByRole('alert')).toContainText('could not be found');
  await expect(page.getByRole('button', { name: 'Submit issue report', exact: true })).toHaveCount(0);
  expect(reports).toEqual([]);
});
test('review failure retains the form, gives a support reference and hides backend details', async ({ page }) => {
  await fixture(page, true);
  await page.goto('/app/orders/refund-request?orderId=owned-order');
  await page.getByText('Another issue', { exact: true }).click();
  await page.getByLabel('Describe the order issue').fill('Please review the access problem on my order.');
  await page.getByRole('button', { name: 'Submit issue report', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('issue-support-ref');
  await expect(page.getByText('Your issue report was received.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('SQL password=do-not-show', { exact: true })).toHaveCount(0);
});

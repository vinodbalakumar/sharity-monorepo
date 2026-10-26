// Opt-in real login check. Credentials are supplied only through environment variables; no traces or token logging.
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const root = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
const { chromium, firefox, webkit, request, expect } = createRequire(path.join(root, 'sharity-app-ui/package.json'))('@playwright/test');
const origin = process.env.SHARITY_LOGIN_ORIGIN || 'https://vinodbalakumar.com';
const email = process.env.LOGIN_TEST_EMAIL;
const password = process.env.LOGIN_TEST_PASSWORD;
if (!email || !password) throw new Error('Set LOGIN_TEST_EMAIL and LOGIN_TEST_PASSWORD for the authorized test account.');
const safeUrl = value => { const u = new URL(value); return u.origin + u.pathname + (u.searchParams.has('error') ? '?error' : ''); };
(async () => {
  const engine = process.env.SHARITY_LOGIN_BROWSER || 'chromium';
  if (!['chromium','firefox','webkit'].includes(engine)) throw new Error('Unsupported test browser');
  const ipv4 = process.env.SHARITY_LOGIN_IPV4;
  const browser = await ({chromium,firefox,webkit})[engine].launch(engine === 'chromium'
    ? { args: ['--disable-quic', ...(ipv4 ? [`--host-resolver-rules=MAP ${new URL(origin).hostname} ${ipv4}`] : [])] } : {});
  const width = Number(process.env.SHARITY_LOGIN_WIDTH || 1440);
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const securityProbe = await request.newContext({ timeout: 20000 });
  const page = await context.newPage();
  const browserApi = (pathname, csrfToken) => page.evaluate(async ({pathname, csrfToken}) => {
    const response = await fetch(pathname, { credentials: 'include', ...(csrfToken ? {method: 'POST', headers: {'X-CSRF-TOKEN': csrfToken}} : {}) });
    return { status: response.status, ok: response.ok, body: response.status === 204 ? null : await response.json() };
  }, {pathname, csrfToken});
  page.setDefaultTimeout(20000);
  const report = { checkedAt: new Date().toISOString(), engine, width, redirects: [], browserSessions: [], browserErrors: [], authenticated: false };
  report.failedRequests = [];
  report.httpErrors = [];
  page.on('pageerror', error => report.browserErrors.push(error.message));
  page.on('requestfailed', req => report.failedRequests.push({url: safeUrl(req.url()), error: req.failure()?.errorText}));
  page.on('response', response => {
    if (response.status() >= 400) report.httpErrors.push({url: safeUrl(response.url()), status:response.status(), origin:response.request().headers().origin || 'absent'});
    if (new URL(response.url()).pathname === '/bff/session' && response.status() === 200) {
      response.json().then(body => report.browserSessions.push({ status: 200, authenticated: body.authenticated === true })).catch(() => {});
    }
    if (response.request().isNavigationRequest()) {
      const location = response.headers().location;
      report.redirects.push({ status: response.status(), url: safeUrl(response.url()),
        originHeader: response.request().headers().origin === 'null' ? 'opaque' : response.request().headers().origin === origin ? 'same-origin' : response.request().headers().origin ? 'other' : 'absent',
        ...(location ? { location: safeUrl(new URL(location, response.url()).href) } : {}) });
      if (response.status() >= 400) fs.writeFileSync(path.join(root, `outputs/authenticated-login-${engine}-${width}.json`), JSON.stringify(report, null, 2));
    }
  });
  try {
    const opaqueApi = await securityProbe.get(`${origin}/bff/session`, { headers: { Origin: 'null' } });
    expect(opaqueApi.status()).toBe(403);
    expect(opaqueApi.headers()['access-control-allow-origin']).toBeUndefined();
    report.apiCorsRestrictionVerified = true;
    await page.goto(`${origin}/app/`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 45000 });
    await expect(page.getByRole('button', { name: 'Sign in', exact: true }).first()).toBeVisible({ timeout: 45000 });
    await page.getByRole('button', { name: 'Sign in', exact: true }).first().click();
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 45000 });
    const loginUrl = new URL(page.url());
    if (loginUrl.origin !== origin || !loginUrl.pathname.startsWith('/authorization-server/api/')) throw new Error('Unexpected credential form origin/path');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('input[name="username"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.origin === origin && url.pathname.startsWith('/app'), { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 45000 });
    const session = (await browserApi('/bff/session')).body;
    report.authenticated = session.authenticated === true;
    expect(report.authenticated).toBe(true);
    report.expectedAccountVerified = session.email?.toLowerCase() === email.toLowerCase();
    expect(report.expectedAccountVerified).toBe(true);
    const profileResponse = await browserApi('/bff/api/authorization-server/api/v1/users/me');
    report.protectedProfileStatus = profileResponse.status;
    expect(profileResponse.ok).toBe(true);
    expect(profileResponse.body.email?.toLowerCase() === email.toLowerCase()).toBe(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 45000 });
    const refreshed = (await browserApi('/bff/session')).body;
    report.authenticatedAfterReload = refreshed.authenticated === true;
    expect(report.authenticatedAfterReload).toBe(true);
    expect((await browserApi('/bff/logout', refreshed.csrfToken)).ok).toBe(true);
    const loggedOut = (await browserApi('/bff/session')).body;
    report.logoutVerified = loggedOut.authenticated === false;
    expect(report.logoutVerified).toBe(true);
    report.authorizationCookieCleared = !(await context.cookies(`${origin}/authorization-server/api`)).some(cookie => cookie.name === 'JSESSIONID');
    expect(report.authorizationCookieCleared).toBe(true);
    // A stale/cancelled callback must remain on the public origin and offer a fresh OAuth request.
    const stale = await securityProbe.get(`${origin}/login/oauth2/code/sharity-web-bff?error=access_denied&state=expired-test-state`, { maxRedirects: 0, headers: { Origin: 'null' } });
    expect(stale.status()).toBe(302);
    expect(stale.headers().location).toBe(`${origin}/authorization-server/api/login?error=oauth`);
    expect(stale.headers()['access-control-allow-origin']).toBeUndefined();
    expect((await (await securityProbe.get(`${origin}/bff/session`)).json()).authenticated).toBe(false);
    report.invalidOAuthStateRejected = true;
    await page.goto(stale.headers().location, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('alert')).toContainText('Please start a new sign-in session.');
    await expect(page.locator('input[name="password"]')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('link', { name: 'Try sign-in again', exact: true }).click();
    await expect(page.locator('input[name="username"]')).toBeVisible({ timeout: 45000 });
    if (new URL(page.url()).origin !== origin) throw new Error('Unexpected recovery form origin');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('input[name="username"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.origin === origin && url.pathname.startsWith('/app'), { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 45000 });
    const recovered = (await browserApi('/bff/session')).body;
    report.recoveryLoginVerified = recovered.authenticated === true;
    expect(report.recoveryLoginVerified).toBe(true);
    expect(recovered.email?.toLowerCase() === email.toLowerCase()).toBe(true);
    report.logoutMarkerCleared = !(await context.cookies(origin)).some(cookie => cookie.name === 'sharity-force-login' && cookie.value === '1');
    expect(report.logoutMarkerCleared).toBe(true);
    report.browserSessionVerified = report.browserSessions.some(session => session.authenticated);
    expect(report.browserSessionVerified).toBe(true);
    expect((await browserApi('/bff/logout', recovered.csrfToken)).ok).toBe(true);
    report.finalUrl = safeUrl(page.url());
    expect(report.redirects.some(item => /:8080(?:\/|$)/.test(item.location || ''))).toBe(false);
    // Functional authentication assertions are the gate. Keep console/network
    // diagnostics in the report, including WebKit warnings during navigation.
    report.functionalChecksPassed = true;
  } catch (error) {
    report.failure = String(error).replaceAll(email, '[test account]').replaceAll(password, '[redacted]');
    report.finalUrl = safeUrl(page.url());
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(root, `outputs/authenticated-login-${engine}-${width}.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
    await securityProbe.dispose(); await context.close(); await browser.close();
  }
})().catch(error => { console.error(error.name); process.exitCode = 1; });

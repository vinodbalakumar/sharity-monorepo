const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const root = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
const { chromium } = createRequire(path.join(root, 'sharity-app-ui/package.json'))('@playwright/test');
const base = process.env.ADMIN_AUDIT_BASE_URL || 'http://127.0.0.1:8098/sharity-admin/';
const routes = ['', 'services', 'commerce', 'users', 'users/new', 'users/roles', 'users/audit-user', 'applications', 'audit-logs', 'reports', 'profile', 'sessions', 'settings'];

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const width of [320, 1440]) for (const routePath of routes) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    // Browser-only fixture; requests are intercepted before reaching any backend.
    await page.addInitScript(() => localStorage.setItem('sharity_admin_access_token', 'browser-fixture'));
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const pathname = new URL(route.request().url()).pathname;
      if (!pathname.includes('/api/')) return route.continue();
      const me = pathname.endsWith('/users/me');
      return route.fulfill({ status: me ? 200 : 503, contentType: 'application/json', body: JSON.stringify(me ? {
        publicId: 'audit-user', username: 'Audit admin', email: 'audit@example.invalid', roles: ['SUPER_ADMIN'], apps: [],
        profile: { firstName: 'Audit', lastName: 'Admin', countryCode: 'USA' }
      } : { message: 'Temporarily unavailable' }) });
    });
    await page.goto(base + routePath);
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const text = await page.locator('body').innerText();
    if (routePath === 'commerce' && !text.includes('Some sections could not be loaded')) errors.push('Missing partial service failure notice');
    if (!text.trim()) errors.push('Blank page');
    if (width === 320 && routePath === '') await page.screenshot({ path: path.join(root, 'outputs/quality-admin-mobile.png') });
    results.push({ route: routePath || '/', width, errors, overflow });
    await context.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(root, 'outputs/quality-admin-audit.json'), JSON.stringify(results, null, 2));
  const failed = results.filter(item => item.errors.length || item.overflow);
  console.log(JSON.stringify({ screens: results.length, failed }, null, 2));
  if (failed.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });

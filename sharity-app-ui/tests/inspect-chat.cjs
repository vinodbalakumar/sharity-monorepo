// Read-only visual check against tests/serve-export.cjs. Does not contact a model or production service.
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/bff/**', route => route.fulfill({ contentType: 'application/json', body: route.request().url().endsWith('/session') ? '{"authenticated":false}' : '[]' }));
  await page.goto('http://127.0.0.1:8097/chat');
  await page.getByRole('heading', { name: 'Welcome to Sharity AI' }).waitFor();
  console.log(await page.getByTestId('sharity-ai').evaluate(root => Array.from(root.querySelectorAll('*')).filter(el => el.children.length === 0 && el.textContent.trim()).slice(0, 20).map(el => ({ text: el.textContent, font: getComputedStyle(el).fontFamily }))));
  await page.screenshot({ path: '../outputs/sharity-ai-desktop-inspected.png' });
  await browser.close();
})();

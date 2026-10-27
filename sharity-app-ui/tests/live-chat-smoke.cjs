// Opt-in real local integration. No API fixtures. BFF is started by LocalChatBrowserTest.
const { chromium, expect } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const bffPort = Number(process.argv[2]);
if (!Number.isInteger(bffPort) || bffPort < 1024 || bffPort > 65535) throw new Error('Local BFF test port required');
const root = path.resolve(__dirname, '../dist-e2e');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:18097');
  if (url.pathname.startsWith('/bff/')) {
    const upstream = http.request({ hostname: '127.0.0.1', port: bffPort, path: req.url, method: req.method, headers: req.headers }, response => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(503); res.end(); }); req.pipe(upstream); return;
  }
  const candidate = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!candidate.startsWith(root + path.sep) && candidate !== root) { res.writeHead(403).end(); return; }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(18097, '127.0.0.1', resolve));
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:18097/chat');
    await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible({ timeout: 45000 });
    async function ask(question) {
      await page.getByLabel('Message Sharity AI').fill(question);
      const response = page.waitForResponse(r => r.url().endsWith('/bff/ai/chat') && r.request().method() === 'POST', { timeout: 110000 });
      await page.getByRole('button', { name: 'Send message' }).click();
      const result = await response; expect(result.status()).toBe(200);
      return result.json();
    }
    const founder = await ask('Who founded Sharity?');
    expect(founder.generation).toBe('STRUCTURED'); expect(founder.response).toContain('Vinod Balakumar');
    expect(founder.response).not.toContain('@gmail.com');
    await expect(page.getByTestId('message-assistant')).toHaveCount(1);
    const model = await ask('Write a short Java program to reverse a string.');
    expect(model.generation).toBe('OLLAMA'); expect(model.response).toContain('```');
    await expect(page.getByTestId('message-assistant')).toHaveCount(2, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible();
    await page.getByRole('button', { name: 'Save chat', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unsave chat', exact: true })).toBeVisible();
    await page.reload();
    await page.getByTestId('chat-sidebar').getByRole('button', { name: '★ Who founded Sharity?' }).click({ timeout: 30000 });
    await expect(page.getByTestId('message-assistant')).toHaveCount(2);
    await page.screenshot({ path: '../outputs/sharity-ai-real-chat.png' });
    await page.getByRole('button', { name: 'Delete chat', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible();
    fs.writeFileSync('../outputs/sharity-ai-live-browser.json', JSON.stringify({ passed: true, path: 'Expo UI → real BFF → real AI service → local Ollama', founderGeneration: founder.generation, codeGeneration: model.generation, csrfSessionHistorySaveReloadDelete: true }, null, 2));
    console.log('PASS: real UI/BFF/AI/Ollama guest chat, source response, code, CSRF, saved history, refresh and deletion');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { if (browser) await browser.close(); server.close(); }
})();

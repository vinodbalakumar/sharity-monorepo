import { test, expect, type Page } from '@playwright/test';
import type { AiMessage } from '../../src/services/sharityAiApi';

const id = '11111111-1111-4111-a111-111111111111';
async function fixture(page: Page, failure = 0, slow = false, recorded = true) {
  let messages: AiMessage[] = [];
  let saved = false;
  await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname;
    if (!path.includes('/bff/') && !path.includes('/api/')) return route.continue();
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json; charset=utf-8', body: JSON.stringify(body) });
    if (path.endsWith('/session')) return send({ authenticated: false, csrfToken: 'chat-csrf' });
    if (path.endsWith('/context')) return send({ countrySupported: true });
    if (path.endsWith('/ai/chat')) {
      const started=Date.now();
      expect(route.request().headers()['x-csrf-token']).toBe('chat-csrf');
      if (slow) await new Promise(resolve => setTimeout(resolve, 2500));
      if (failure) return send({ message: 'database password=do-not-display' }, failure);
      const question = route.request().postDataJSON().message;
      const answer = question.includes('Java') ? 'A simple Java example:\n```java\npublic class Reverse {\n  public static void main(String[] args) {\n    String value = new StringBuilder("hello").reverse().toString();\n  }\n}\n```' : 'Sharity was founded by Vinod Balakumar.';
      const metrics = recorded ? { requestStartedAt: started, responseCompletedAt: Date.now(), durationMs: Date.now()-started, inputTokens: question.includes('Java') ? 100 : 0, outputTokens: question.includes('Java') ? 25 : 0, totalTokens: question.includes('Java') ? 125 : 0, generation: question.includes('Java') ? 'OLLAMA' as const : 'STRUCTURED' as const } : undefined;
      messages = [...messages, { id: `u-${messages.length}`, role: 'user', content: question, sources: [], createdAt: 1 }, { id: `a-${messages.length}`, role: 'assistant', content: answer, sources: [{ id: 'founder', title: 'Approved founder profile', url: 'https://vinodbalakumar.com', updatedAt: '2026-10-25', content: 'Approved facts' }], createdAt: 2 }];
      messages[messages.length-1]!.metrics = metrics;
      return send({ conversationId: id, response: answer, sources: [], generation: metrics?.generation ?? 'OLLAMA', messageId: messages[messages.length-1]!.id, metrics });
    }
    if (path.endsWith(`/ai/conversations/${id}`)) {
      if (route.request().method() === 'DELETE') { messages = []; return send({}); }
      if (route.request().method() === 'PATCH') { saved = route.request().postDataJSON().saved; return send({}); }
      return send({ conversation: { id, title: messages[0]?.content, saved, createdAt: 1, updatedAt: 2 }, messages });
    }
    if (path.endsWith('/ai/conversations')) return send(messages.length ? [{ id, title: messages[0]?.content, saved, createdAt: 1, updatedAt: 2 }] : []);
    return send({});
  });
}
async function open(page: Page) { await page.goto('/chat'); await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible(); }
for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`chat direct route, refresh, font and responsive layout at ${width}px`, async ({ page, browserName }) => {
    await page.setViewportSize({ width, height: 900 }); await fixture(page); await open(page); await page.reload();
    await expect(page.getByLabel('Message Sharity AI')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeInViewport();
    await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toHaveCSS('font-family', /sans-serif/);
    await page.evaluate(() => document.fonts.ready);
    if (browserName === 'chromium' && [390, 1440].includes(width)) await page.screenshot({ path: `../outputs/sharity-ai-${width === 390 ? 'mobile' : 'desktop'}.png` });
    const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth,
      fonts: Array.from(document.querySelectorAll('[data-testid="sharity-ai"] *')).filter(el => el.textContent?.trim() && el.children.length === 0).map(el => getComputedStyle(el).fontFamily) }));
    expect(geometry.overflow).toBeLessThanOrEqual(1); expect(geometry.fonts.length).toBeGreaterThan(10);
    expect(geometry.fonts.every(font => font.length > 0)).toBeTruthy();
    const input = await page.getByLabel('Message Sharity AI').boundingBox(); expect(input?.width).toBeGreaterThan(150);
    if (width < 850) { await page.getByRole('button', { name: 'Open menu' }).click(); await expect(page.getByLabel('Search conversations')).toBeVisible(); await page.getByRole('button', { name: 'Close menu' }).click(); }
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.getByTestId('sharity-ai')).toHaveCSS('background-color', 'rgb(16, 28, 24)');
    await page.reload(); await expect(page.getByTestId('sharity-ai')).toHaveCSS('background-color', 'rgb(16, 28, 24)');
  });
}
test('chat answers omit source badges and retain code copy, saved history, new chat and delete', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1280, height: 1000 }); await fixture(page); await open(page);
  await page.getByLabel('Message Sharity AI').fill('Write a Java program'); await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByTestId('message-assistant')).toContainText('public class Reverse');
  await expect(page.getByText('Approved founder profile', {exact:false})).toHaveCount(0);
  if (browserName === 'chromium') { await page.context().grantPermissions(['clipboard-read', 'clipboard-write']); await page.getByRole('button', { name: 'Copy code' }).click(); await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('public class Reverse'); }
  else await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible();
  await page.getByRole('button', { name: 'Save chat', exact: true }).click(); await expect(page.getByRole('button', { name: 'Unsave chat', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New chat', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible();
  await page.getByRole('button', { name: '★ Write a Java program' }).click(); await expect(page.getByTestId('message-assistant')).toContainText('public class Reverse');
  await expect(page.getByText('Approved founder profile', {exact:false})).toHaveCount(0);
  await page.getByRole('button', { name: 'Regenerate', exact: true }).click(); await expect(page.getByTestId('message-assistant')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete chat', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible();
});

for (const width of [320, 1440]) test(`message info and whole chat token totals survive reopen at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); await fixture(page); await open(page);
  await page.getByLabel('Message Sharity AI').fill('Write a Java program'); await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByTestId('message-assistant').getByRole('button', { name: 'Message info', exact: true }).click();
  await expect(page.getByTestId('message-info')).toContainText('Request sent:');
  await expect(page.getByTestId('message-info')).toContainText('Response received:');
  await expect(page.getByTestId('message-info')).toContainText('Input tokens: 100');
  await expect(page.getByTestId('message-info')).toContainText('Output tokens: 25');
  await expect(page.getByTestId('message-info')).toContainText('Total tokens: 125');
  await page.getByRole('button', { name: 'Regenerate', exact: true }).click();
  await expect(page.getByTestId('message-assistant')).toHaveCount(2);
  await page.getByRole('button', { name: 'Chat info', exact: true }).click();
  await expect(page.getByTestId('chat-info')).toContainText('Total tokens: 250');
  await expect(page.getByTestId('chat-info')).toContainText('Replies: 2');
  await page.reload();
  if (width < 850) await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByTestId('chat-sidebar').getByRole('button', { name: 'Write a Java program', exact: true }).click();
  await page.getByTestId('message-assistant').last().getByRole('button', { name: 'Message info', exact: true }).click();
  await expect(page.getByTestId('message-info')).toContainText('Server received:');
  await expect(page.getByTestId('message-info')).toContainText('Total tokens: 125');
  await page.getByRole('button', { name: 'Chat info', exact: true }).click();
  await expect(page.getByTestId('chat-info')).toContainText('Total tokens: 250');
  expect(await page.evaluate(() => document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
});

test('missing token usage is unavailable rather than zero', async ({ page }) => {
  await fixture(page, 0, false, false); await open(page);
  await page.getByLabel('Message Sharity AI').fill('Write a Java program'); await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('button', { name: 'Message info', exact: true }).click();
  await expect(page.getByTestId('message-info')).toContainText('not recorded');
  await page.getByRole('button', { name: 'Chat info', exact: true }).click();
  await expect(page.getByTestId('chat-info')).toContainText('Known total tokens: Unavailable');
});
for (const failure of [401, 503, 429]) test(`chat failure ${failure} shows a safe recoverable error`, async ({ page }) => {
  await fixture(page, failure); await open(page); await page.getByRole('button', { name: 'Who founded Sharity?', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(failure === 401 ? 'session changed' : failure === 429 ? 'busy' : 'temporarily unavailable');
  await expect(page.getByText('database password=do-not-display')).toHaveCount(0); await expect(page.getByLabel('Message Sharity AI')).toBeEnabled();
  await expect(page.getByTestId('response-time')).toHaveCount(0);
});
test('stop waiting cancels the UI request and explains server completion', async ({ page }) => {
  await fixture(page, 0, true); await open(page); await page.getByRole('button', { name: 'Who founded Sharity?', exact: true }).click();
  await page.getByRole('button', { name: 'Stop waiting' }).click(); await expect(page.getByRole('alert')).toContainText('server may finish'); await expect(page.getByLabel('Message Sharity AI')).toBeEnabled();
  await expect(page.getByTestId('response-time')).toHaveCount(0);
});

for (const width of [320, 1440]) test(`response timing is measured per successful answer at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await fixture(page, 0, true); await open(page);
  await page.getByRole('button', { name: 'Who founded Sharity?', exact: true }).click();
  await expect(page.getByTestId('response-time')).toHaveCount(0);
  const timing = page.getByTestId('response-time');
  await expect(timing).toHaveText(/^Response time: \d+\.\d s$/);
  const first = await timing.innerText();
  expect(Number(first.match(/[\d.]+/)?.[0])).toBeGreaterThanOrEqual(2.4);
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await timing.scrollIntoViewIfNeeded(); await expect(timing).toBeInViewport();
  await expect(timing).toHaveCSS('color', 'rgb(166, 185, 173)');
  await page.getByRole('button', { name: 'Regenerate', exact: true }).click();
  await expect(timing).toHaveCount(2);
  await expect(timing.first()).toHaveText(first);
  await expect(timing.last()).toHaveText(/^Response time: \d+\.\d s$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

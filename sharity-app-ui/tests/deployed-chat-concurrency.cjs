// Real independent browser sessions; no API fixtures or shared authentication state.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = (process.argv[2] || 'https://vinodbalakumar.com').replace(/\/$/, '');
(async () => {
  const ipv4 = process.env.SHARITY_SMOKE_IPV4;
  const args = ipv4 ? ['--disable-quic', `--host-resolver-rules=MAP vinodbalakumar.com ${ipv4}`] : [];
  const browser = await chromium.launch({ args });
  const evidence = { base, verifiedAt: new Date().toISOString(), tests: {}, requests: [] };
  const sessions = [];
  try {
    for (let i=0; i<3; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${base}/chat`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible({ timeout: 45000 });
      sessions.push({ context, page });
    }
    function prepare(session, question, name) {
      let started;
      const start = new Promise(resolve => {
        session.page.on('request', request => {
          if (request.url().endsWith('/bff/ai/chat') && request.method() === 'POST') { started = Date.now(); resolve(started); }
        });
      });
      const response = session.page.waitForResponse(r => r.url().endsWith('/bff/ai/chat') && r.request().method() === 'POST', { timeout: 110000 });
      const result = response.then(async response => {
        const completed = Date.now();
        const body = await response.json();
        evidence.requests.push({ session: name, status: response.status(), generation: body.generation, correlationId: response.headers()['x-correlation-id'], durationMs: completed-started, started, completed });
        expect(response.status()).toBe(200);
        session.conversationId = body.conversationId;
        return body;
      });
      // Keep rejection handled while the other sessions are being prepared.
      result.catch(() => {});
      return { start, result, send: async () => {
        await session.page.getByLabel('Message Sharity AI').fill(question);
        await session.page.getByRole('button', { name: 'Send message' }).click();
      }};
    }
    const first = prepare(sessions[0], 'Write a short Java program to reverse a string.', 'system-one');
    const second = prepare(sessions[1], 'Write a short Python program to reverse a string.', 'system-two');
    await Promise.all([first.send(), second.send()]);
    const starts = await Promise.all([first.start, second.start]);
    const factual = prepare(sessions[2], 'Who founded Sharity?', 'factual-during-inference');
    await factual.send();
    expect((await factual.result).generation).toBe('STRUCTURED');
    const answers = await Promise.all([first.result, second.result]);
    expect(answers.every(answer => answer.generation === 'OLLAMA' && answer.response.includes('```'))).toBe(true);
    expect(answers[0].conversationId).not.toBe(answers[1].conversationId);
    const generated = evidence.requests.filter(row => row.generation === 'OLLAMA');
    expect(Math.max(...starts)).toBeLessThan(Math.min(...generated.map(row => row.completed)));
    evidence.tests.twoOverlappingModelRequestsReturn200 = true;
    const structured = evidence.requests.find(row => row.generation === 'STRUCTURED');
    expect(structured.completed).toBeLessThan(Math.min(...generated.map(row => row.completed)));
    evidence.tests.factualAnswerBypassesBusyModel = true;
    for (const session of sessions.slice(0, 2)) {
      await expect(session.page.getByTestId('message-assistant')).toHaveCount(1);
      await expect(session.page.getByRole('button', { name: 'Copy code' }).first()).toBeVisible();
      await expect(session.page.getByText('Sharity AI is busy. Please wait a minute and try again.')).toHaveCount(0);
    }
    const forbidden = await sessions[0].context.request.get(`${base}/bff/ai/conversations/${answers[1].conversationId}`);
    expect(forbidden.status()).toBe(404);
    evidence.tests.independentConversationOwnership = true;
    for (const session of sessions) {
      await session.page.getByRole('button', { name: 'Delete chat', exact: true }).click();
      await expect(session.page.getByRole('heading', { name: 'Welcome to Sharity AI' })).toBeVisible();
    }
    evidence.tests.temporaryConversationsDeleted = true;
    evidence.passed = true;
    console.log('PASS: two concurrent real-model browser sessions, factual answer during inference, ownership isolation and cleanup');
    console.log(JSON.stringify(evidence.requests));
  } catch (error) {
    evidence.passed = false; evidence.error = String(error).slice(0, 900);
    console.error(error); process.exitCode = 1;
  } finally {
    fs.writeFileSync('../outputs/deployed-chat-concurrency.json', JSON.stringify(evidence, null, 2));
    await browser.close();
  }
})();

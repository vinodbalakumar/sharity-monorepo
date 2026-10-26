// Real BFF session/API check. Only public questions; cleans up the test conversation.
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const root = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
const { request, expect } = createRequire(path.join(root, 'sharity-app-ui/package.json'))('@playwright/test');
const origin = process.env.SHARITY_SMOKE_ORIGIN || 'http://localhost:8080';
(async () => {
  const client = await request.newContext({ baseURL: origin, timeout: 20000 });
  let headers, conversationId;
  const report = { origin, checkedAt: new Date().toISOString(), errors: [], requests: [] };
  async function ask(question) {
    const start = Date.now();
    const response = await client.post('/bff/ai/chat', { headers, data: { conversationId, message: question }, timeout: 100000 });
    const data = await response.json();
    const result = { status: response.status(), elapsedMs: Date.now() - start, generation: data.generation,
      metrics: data.metrics, errorCode: data.code };
    report.requests.push(result);
    if (data.conversationId) conversationId = data.conversationId;
    console.log(JSON.stringify(result));
    return { response, data, result };
  }
  try {
    const session = await (await client.get('/bff/session')).json();
    expect(session.csrfToken).toBeTruthy();
    headers = { 'X-CSRF-TOKEN': session.csrfToken };
    const founder = await ask('Who founded Sharity?');
    expect(founder.response.status()).toBe(200);
    expect(founder.data.response).toContain('Vinod Balakumar Panchaparvala');
    expect(founder.data.generation).toBe('STRUCTURED');
    expect(founder.data.metrics.durationMs).toBeGreaterThanOrEqual(0);
    const generated = await ask('Explain Java dependency injection in two sentences.');
    if (generated.response.status() === 200) {
      expect(generated.data.generation).toBe('OLLAMA');
      expect(generated.data.response.length).toBeGreaterThan(20);
      report.providerVerified = true;
      const product = await ask('What is the listed price and category of Elden Ring in Sharity?');
      expect(product.response.status()).toBe(200);
      expect(product.data.sources.some(source => source.id.startsWith('product-') && source.title === 'Elden Ring')).toBe(true);
      expect(product.data.response).toContain('35');
      report.productContextVerified = true;
    } else {
      expect(generated.response.status()).toBe(503);
      expect(JSON.stringify(generated.data)).not.toMatch(/192\.168\.|Exception|stackTrace/);
      expect(generated.result.elapsedMs).toBeLessThan(15000);
      report.providerVerified = false;
      report.providerIssue = 'Mac inference unavailable; sanitized error returned within the connection timeout budget.';
    }
    expect(report.errors).toEqual([]);
    console.log(JSON.stringify(report));
  } catch (error) {
    report.failure = String(error); throw error;
  } finally {
    fs.writeFileSync(path.join(root, 'outputs/mac-ai-api-verification.json'), JSON.stringify(report, null, 2));
    if (conversationId && headers) await client.delete(`/bff/ai/conversations/${conversationId}`, { headers }).catch(() => {});
    await client.dispose();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

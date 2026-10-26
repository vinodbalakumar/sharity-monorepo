# Sharity AI local verification

Branch: `feature/sharity-production-responsive`. Local changes only; no production deployment.

| Check | Result |
|---|---|
| AI Maven verify | Exit 0; 41 passed, 0 skipped |
| BFF Maven verify | Exit 0; 24 passed, 1 opt-in browser test skipped in final standard run |
| Real browser integration, separate opt-in run | Passed: Expo export → real BFF/session/CSRF → real AI service → local Ollama |
| Real model HTTP questions | Passed: Java reverse string, DI explanation, REST controller, microservices |
| Chat Playwright | 36/36 passed across Chromium, Firefox and WebKit; 320–1440px |
| Marketplace/commerce regression | 25/25 passed, Chromium |
| TypeScript | Exit 0 |
| ESLint | Exit 0, 61 warnings |
| Expo compatibility | Exit 0, dependencies up to date |
| Asset checks | Exit 0, 2 passed |
| Expo web export | Exit 0, `dist-e2e` |
| Android export | Exit 0, bundle only |
| iOS export | Exit 0, bundle only |
| npm audit | 4 high; 0 critical (existing Expo signing chain) |

The opt-in real BFF browser case also passed in its dedicated full build; its evidence is
`sharity-ai-live-browser.json` and `chat-live-browser.log`. The AI opt-in test is included in
the final AI test total above and used real local Qwen3 1.7B over HTTP.

The backend OSV evidence is `backend-osv-audit.json`; inspect its exact package counts and
coverage rather than treating this as a guarantee against undiscovered vulnerabilities.
The current scan reported 329 unique packages, zero affected packages and zero incomplete checks.

Final Maven logs: `sharity-ai-verified.log`, `sharity-ai-bff-verified.log`.
Browser logs: `chat-ui-playwright-final.log`, `chat-marketplace-regression.log`.
Model responses: `sharity-ai-real-model-smoke.txt`.
Previews: `sharity-ai-desktop.png`, `sharity-ai-mobile.png`, `sharity-ai-real-chat.png`.

A temporary test server held the AI JAR open on Windows during an intermediate package attempt.
It was stopped and the final complete verification passed. Temporary test gateways/AI servers
were closed. Ollama remains installed locally; its model unloads after the configured idle time.

No real founder posts were imported. Official social APIs/scheduled synchronization, SSE,
production MySQL migration, Nginx integration, live OAuth and installed-device tests remain
unvalidated or unimplemented as detailed in `SHARITY_AI.md`. Android/iOS exports do not prove
installed-device functionality. Existing marketplace production release gates remain.

# Deployed AI chat timing and token information

Public verification: 2026-10-26T06:56:45.852Z at https://vinodbalakumar.com/chat.

Newly received answers display a device-measured response-time label. Each assistant reply has a
**Message info** button with device request-sent/response-received times, round-trip duration,
server receive/answer-generation times, server processing duration and input/output/total tokens.
**Chat info** totals recorded usage for the current conversation. Input counts include instructions
and repeated conversation context for each successful recorded request. These are provider-reported
counts, not word-count estimates. Failed requests without reported usage are not included.
Approved structured answers use zero model tokens. Older/missing usage is explicitly unavailable.
Device timing remains in the current page session; server timing and usage persist with the saved history.
Message details remain protected by conversation ownership and cascade-delete with their messages.

## Verification

- TypeScript and scoped ESLint passed; the Expo web export completed successfully.
- 30 focused Playwright checks passed across Chromium, Firefox and WebKit, including 320px mobile and desktop.
- Covered details, totals after regeneration/reload, missing usage, timing labels, theme, failures and cancellation.
- Full AI Maven verify passed: 43 passed, one opt-in local-model test skipped.
- Focused provider-usage/concurrency verification passed four tests, including two additional usage tests.
- SQL persistence checks verify reopening, ownership isolation and cascading metric deletion.
- Real public browser verification passed 11 checks with real Ollama and MySQL, including saved metadata after reload.
- Real generated answer: 91 input + 49 output = 140 total tokens.
- Displayed response-time labels in this run: Response time: 1.0 s, Response time: 9.9 s.
- Public mobile Info screenshot: `deployed-chat-message-info-mobile.png`.
- No orders or payments were created; temporary test conversations were deleted.

## Deployment and recovery

The AI service and Expo web image were updated in the existing local `sharity-local` Docker stack.
The edge Nginx configuration passed validation and was reloaded. The original Qwen3 1.7B model,
two-generation capacity and 15-minute keep-alive remain in use. Tesla remains disabled.
The additive `ai_message_metrics` table was created before rollout. Existing message tables and data were preserved.
The restricted AI database backup is in `C:\Users\HP\projects\springbootrestdemo\.deployment-private\chat-metrics-20261025-234836` (58915 bytes).
Runtime database privileges remain SELECT/INSERT/UPDATE/DELETE; schema application used the administrator account.
Previous AI/web images were preserved. See `chat-info-rollback.json` and `chat-info-web-rollback.json`
for image rollback tags; the additive table can remain when rolling back application images.
Private backups and environment files remain Git-ignored. Native device/app-store deployment and
the previously documented production/security gates are outside this local web deployment.

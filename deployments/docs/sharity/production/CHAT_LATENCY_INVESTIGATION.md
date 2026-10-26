# Chat latency investigation and deployed fix

Verified: 2026-10-26T06:31:52.009385+00:00. Local Docker origin behind the existing public tunnel.

## Cause

`platform-diagnostics-gateway` is outside the chat path. Chat uses browser → edge Nginx → BFF
→ AI service → Windows Ollama. Diagnostic events use a separate background sender and private TLS gateway.
Before the fix, paired request logs showed 24.5–27.8 seconds inside AI and only 40–167 ms of BFF overhead.
Observed diagnostic ingestion p95 was 101 ms across 131 events.
Direct Ollama probes confirmed CPU generation and model loading as the expensive operations.
The Windows host has an i5-8350U (four cores/eight logical processors), 15.8 GB RAM and Intel UHD 620;
Ollama runs on CPU. The larger model used about 1.6 GB at runtime and the host had about 1.1 GB free.
Some model/option comparison probes required a runner reload; their cold-load timings are not warm-inference comparisons.
Independent requests from the live site also arrived during the investigation; this was not an isolated load test.

## Changes

- Retained the original `qwen3:1.7b` model. A smaller model was briefly deployed, then reverted after follow-up quality checks found incorrect Java and Spring examples.
- Model keep-alive increased from five to fifteen idle minutes, reducing repeated cold loads.
- Programming requests ask for one complete example, required imports and brief explanations when requested.
- Completion logs now record history, model and SQL storage times separately without prompts or answers.
- Two concurrent model requests, factual-answer bypass, ownership checks and bounded rate limits remain enabled.
- The previous application image remains available for rollback; diagnostics stayed enabled throughout verification.

## Real public browser verification

| Request | Before | After | Model time after | SQL storage after |
|---|---:|---:|---:|---:|
| system-two | 27.92 s | 6.69 s | 6.22 s | 181 ms |
| system-one | 24.84 s | 11.61 s | 11.08 s | 249 ms |

Mean observed reduction for these two overlapping coding requests: 65.3%.
Single-user smoke timings (structured, generated): [374, 5050] ms.
Both concurrent requests returned HTTP 200. A third session received a factual answer while
generation was pending. Cross-session history access returned 404 and temporary conversations were deleted.
The separate single-user public smoke passed chat/refresh, code generation, SQL save/reload/delete,
CSRF, mobile/theme, catalog, admin protection and OAuth start routing. HTTPS verification stayed enabled.
AI Maven verify: 44 tests, 43 passed, one opt-in model test skipped; deployed checks used real Ollama.
Evidence: `chat-latency-fix.json`, `deployed-chat-concurrency.json`, `deployed-chat-public-verification.json`,
`chat-latency-verify.log`, and `ollama-latency-*.json`.

## Limits

These measurements cover a small set of synthetic prompts, not a throughput guarantee or broad quality evaluation.
The rejected smaller-model experiment generated faster but failed code-quality checks; it is not the deployed model. Generated code still requires review.
Cold starts, long prompts, concurrent load and memory pressure can still increase latency. Responses still wait
for full generation; streaming is not implemented. Stronger quality and low latency at larger concurrency need more inference capacity.
No payments, orders, public DNS or Tesla state were changed. Existing production/security gates remain documented.

Timing fields follow [Ollama API usage documentation](https://github.com/ollama/ollama/blob/main/docs/api/usage.mdx).
Available model sizes are listed in [the official Qwen3 model library](https://ollama.com/library/qwen3).

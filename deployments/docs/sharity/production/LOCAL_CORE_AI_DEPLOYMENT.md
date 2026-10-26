# Core Sharity and AI local deployment

Verified: 2026-10-26T06:59:11.006303+00:00. Release: `20261025-215008`.

Core Sharity, centralized AI, the diagnostic TLS gateway and the Expo web export are deployed
to the existing `sharity-local` Docker stack on this Windows computer. The existing Cloudflare
tunnel serves this origin at https://vinodbalakumar.com. No DNS, tunnel or IONOS deployment was changed.
Tesla backend and frontend remain disabled at the owner's explicit request.

| Service | State | Health |
|---|---|---|
| authorization-server | running | healthy |
| marketplace-service | running | healthy |
| payment-service | running | healthy |
| wallet-service | running | healthy |
| platform-web-bff | running | healthy |
| platform-ai-service | running | healthy |
| platform-diagnostics-gateway | running | healthy |
| sharity-app | running | healthy |
| sharity-admin-portal | running | not-configured |
| nginx | running | not-configured |

The existing admin portal and edge Nginx keep their earlier images; edge routing was validated
and reloaded. The eight updated application/gateway containers report healthy. Full image IDs
are recorded in `local-deployment-results.json`.

## Verified behavior

Public Playwright baseline smoke (2026-10-26T06:56:45.852Z): **passed**, 11 checks, no mocked backend responses.
- directChatAndRefresh: passed.
- approvedFounderAndPrivateEmail: passed.
- realDeployedQwenCode: passed.
- responseTimeLabelsDesktopAndMobile: passed.
- messageInfoAndChatTokenTotals: passed.
- persistedTimingAndTokenUsage: passed.
- mysqlHistorySaveReloadDeleteAndCsrf: passed.
- mobileAndDarkTheme: passed.
- deployedPublicCatalog: passed.
- adminRequiresAuthentication: passed.
- oauthStartRoutePreserved: passed.

Browser-observed chat response times (structured founder answer, real Qwen coding answer): [1293, 10810] ms.
The check creates and deletes a temporary anonymous conversation. It creates no orders or payments.
Chromium used IPv4 mapping to the current public Cloudflare address and disabled QUIC to work
around this computer's browser transport problem. HTTPS certificate verification stayed enabled.
Latest AI Maven verify: 44 tests, 43 passed, 1 opt-in local-model test skipped, no failures/errors.
The public smoke separately exercised the actual deployed Ollama/Qwen model.
Private diagnostic delivery passed the Java TLS certificate/hostname probe. Nginx config validation passed.

## Concurrent chat follow-up

Verified: 2026-10-26T06:27:42.920Z. Two independent browser sessions sent overlapping requests
to the real deployed model; both returned HTTP 200. A third session received an approved
factual answer before either generated response finished. Cross-session conversation access
returned 404, and temporary conversations were deleted.
- factual-during-inference: HTTP 200, STRUCTURED, 579 ms.
- system-two: HTTP 200, OLLAMA, 6689 ms.
- system-one: HTTP 200, OLLAMA, 11608 ms.

The former single-request semaphore was replaced with a configurable two-generation limit.
Structured answers bypass inference capacity. Provider failures release generation permits.
Ollama may serialize actual computation on CPU; this fix accepts two simultaneous callers
without promising equal latency or unlimited capacity. Per-owner limits and overload protection remain.
See `deployed-chat-concurrency.json` for evidence and `chat-latency-report.md` for the performance follow-up.

## Runtime and data

The dedicated MySQL AI schema is applied. Its runtime account has only SELECT/INSERT/UPDATE/DELETE
on that schema. Existing databases were preserved and backed up before rollout.
Private BFF/diagnostic tokens and database credentials remain outside source control and the Expo bundle.
AI and diagnostic gateway share the BFF network namespace; AI has no published host port.
Ollama runs on Windows with `qwen3:1.7b`; it must remain available while this local origin is used.
The model uses four threads, batch 128, context 2048 and at most 256 generated tokens.
Chat allows two concurrent model calls; structured answers bypass this limit. Model keep-alive is fifteen minutes.
Programming prompts omit unrelated project passages. Inference incidents retain measured errors
and timings but do not queue recursive model diagnosis. Other service triage remains advisory.
Legacy marketplace SQL/parameter slow logging is disabled. Demo purchase flags remain false.
Diagnostic TLS uses a private server certificate and a Java store retaining public CA roots;
the 365-day certificate must be renewed with its trust store before expiry.

## Recovery and remaining limits

Restricted backup directory: `C:\Users\HP\projects\springbootrestdemo\.deployment-private\20261025-215008` (do not upload).
Database backup size: 266290 bytes. Original service images have
`rollback-20261025-215008` tags. Stop the shared-network AI/gateway before restoring an old BFF.
Review later database writes before any database restore; additive schema migrations are not automatically reversed.
See the deployment repository `docs/local-ai-deployment.md` for the Compose command and rollback procedure.

This is a local-origin deployment, not certification of complete production readiness or Gameflip parity.
The latest backend dependency scan checked 329 packages with no reported findings; the existing
Expo dependency audit still has four high advisories. No claim of zero vulnerabilities is made.
CPU/RAM headroom is limited; cold requests and concurrent inference still need load testing and capacity planning.
Full signed-in OAuth/admin workflows, real payment/webhook reconciliation, installed native-device behavior
and Tesla Fleet were not verified by this deployment smoke. Android/iOS exports are not app-store deployments.
Official social API/scheduled synchronization and SSE remain unimplemented; no real social posts were imported.
Incident history is an in-memory bounded cache, not durable monitoring. Retained telemetry, alerting,
provider capacity, recovery drills and commerce release gates remain necessary.
Source changes remain local and uncommitted on the existing development branch.

> October 26 UI follow-up: [the storefront release](STOREFRONT_REFRESH.md) simplifies the design and fixes guest routing. Overall production approval still depends on the remaining gates.

> AI chat details: [timing and token information deployment](CHAT_INFO_DEPLOYMENT.md) covers per-message Info, conversation totals and persisted usage verification.

> Local AI performance follow-up: see [the latency investigation](CHAT_LATENCY_INVESTIGATION.md) for the CPU/model bottleneck, deployed fix and before/after public browser measurements.

## Sharity AI follow-up (October 25)

The existing platform-ai-service now owns public chat, approved founder knowledge, social JSON review and SQL conversation history. The Expo `/chat` route passes 36 Chromium/Firefox/WebKit checks. A real anonymous browser → BFF → AI service → local Qwen3 1.7B test passed, including CSRF, code generation, saved history, refresh and deletion. Founder email remains private. No real social posts were imported, and official provider sync is not implemented. See `../architecture/SHARITY_AI.md` for setup and the detailed implementation report.

Production approval remains pending. Core Sharity, AI, the Expo web export and `/chat` routing are deployed to the local Docker origin behind the existing public tunnel. The dedicated AI MySQL schema is applied. Tesla stays disabled by request. See [the deployment record](LOCAL_CORE_AI_DEPLOYMENT.md). Independent inference hosting, real OAuth/device checks, existing Expo advisories and commerce release gates remain outstanding. Earlier test totals below predate the chat additions; current counts are recorded in workspace `outputs/sharity-ai-verification.md`.

## Final operations/commerce verification (earlier October 25 follow-up)

All seven Java services pass Maven verification with 163 current tests. The resolved backend scan checks 329 packages with zero flagged packages and zero incomplete checks after pinning OpenTelemetry 1.62.0. TypeScript, ESLint (0 errors), Expo compatibility, asset checks and web/Android/iOS exports pass. The browser suite defines 75 unique scenarios; initial Firefox browser closure and fractional-pixel assertion failures were resolved in documented follow-up runs.

This does not approve production: four high Expo findings remain; AI needs a provisioned model/secret/telemetry deployment; live payment/provider reconciliation, multi-item checkout, shipping/digital delivery and remaining legacy/mock routes still require development and verification. Demo transactions remain explicitly labelled and disabled by default. The incident cache is bounded, in memory, and not a durable monitoring backend. Existing DOCX copies are not regenerated.

Workspace evidence: `C:/Users/HP/projects/springbootrestdemo/outputs/operations-verification.md`. Setup: `architecture/AI_OPERATIONS_AND_COMMERCE.md` from the docs root.

> Operations/commerce follow-up: see `architecture/AI_OPERATIONS_AND_COMMERCE.md` (from the docs root) and workspace `outputs/operations-verification.md`. AI diagnosis is implemented centrally with opt-in delivery from seven services; live model/provider/device verification and remaining marketplace flows are still release gates.

# Sharity readiness review - October 25, 2026

Branch: `feature/sharity-production-responsive` in the workspace and each of the
six existing Java repositories and the UI repository. This docs directory is
not a Git repository. Local pre-existing service configuration changes were
preserved. No deployment, merge, or live payment operation is part of this work.

## Implemented changes

- Storefront navigation, bounded desktop content, phone bottom tabs with labels,
  readable system-font fallbacks and 44px shared controls.
- Search over the loaded catalog, responsive two-column phone cards, stacked
  phone/tablet hero, image-less offer content, and truthful empty/error states.
- TypeScript source takes priority in Metro; 148 obsolete emitted JavaScript
  siblings removed; TypeScript checks explicitly use `noEmit`.
- Browser session checks retry one transient failure and distinguish network unavailability from an anonymous session; startup timeouts preserve session artifacts.
- Existing TypeScript contract failures corrected in account updates, cart
  fallback data, inputs, registration, seller forms, rewards and marketplace styles.
- Marketplace JWT validation restored and unmatched routes require authentication.
  Public catalog GET/HEAD routes remain explicitly allowed. Admin rules remain.
- Rate-limit exhaustion responds with JSON 429 and Retry-After instead of throwing
  an unhandled Resilience4j exception.
- Optional isolated Spring AI listing-draft API with roles, bounded input/output,
  concurrency limit, disabled default, safe failures and required seller review.
- CI workflows for backend verification, dependency review, Expo exports,
  responsive browser testing and frontend dependency auditing.

## Verification and evidence

Final local results: 128 backend tests and 45 Playwright cases passed; TypeScript and lint have zero errors (62 lint warnings remain); web, Android and iOS Expo exports passed. Backend OSV has zero findings across 301 packages. npm audit retains four high findings in the Expo signing chain.

The exact final check results are maintained in the workspace at
`outputs/production-verification.md`. Raw Maven, Expo, lint, audit and Playwright
logs are under `outputs/`. Do not infer successful checks from historical reports
or from this implementation list.

Playwright covers Chromium, Firefox and WebKit at 320, 360, 375, 390, 412, 430,
667, 768, 820, 1024 and 1440 pixels. Checks include text sizes/font loading/line
height, page overflow, hero geometry, navigation changes, live resizing, search
state, empty catalogs, retry recovery and runtime errors. API responses are
fixtures; the suite does not establish live backend or payment integration.

Native Android/iOS exports establish bundling compatibility only. Expo Go,
custom development clients, installed release builds, native authentication,
safe-area behavior, device keyboards and accessibility require device QA.
Native API calls require an explicit reachable HTTPS base URL in production;
local development can use a reachable LAN host. Relative `/bff` URLs are web-only.

## Security and release gates

The initial frontend audit contained 24 findings (2 critical, 16 high, 6 moderate).
The dependency fixes removed the critical and moderate findings; see the final
audit report for unresolved Expo signing-chain findings. Do not suppress those
findings to make CI pass. SDK migration or an upstream patch needs separate
compatibility validation where no compatible patch exists.

Resolved backend classpaths are checked against OSV with
`python scripts/extract-maven-dependencies.py` followed by
`node scripts/scan-maven-osv.mjs`. This intentionally includes test dependencies.
The final local scan completed with zero findings across 301 unique resolved packages after Spring Boot 4.0.9 and targeted compression/HTTP-component updates. The scan records advisory IDs and incomplete requests. Review exploitability and
fixed versions; no zero-vulnerability guarantee is made from successful builds.

Production sign-off remains blocked until all applicable gates have evidence:

1. Final Maven, TypeScript, lint, Expo and responsive tests pass for exact release commits; audit deployed JDK and container images as well as application dependencies.
2. Dependency findings are fixed or formally assessed; no incomplete scans.
3. OAuth redirect/session/logout/CSRF behavior works on the deployed domain.
4. Sandbox-to-live payment setup, webhook verification, refund/idempotency and
   reconciliation are tested with actual providers and approved credentials.
5. Staging migration, outbox retry/recovery, backup restoration, monitoring and
   load/failure tests pass against deployment configuration.
6. Native login and buyer/seller journeys pass on actual Android/iOS devices.
7. Placeholder support, policy, moderation and other business endpoints are
   inventoried and completed before being advertised as production capabilities.

The AI service stays disabled and unexposed until model quality, deployed auth,
timeouts, per-user quotas, dependency checks, BFF routing and seller UI integration
are verified. Existing services retain responsibility for all business decisions.

## Reproduction

Use `scripts/verify-production.ps1 -NativeExports -BrowserTests` from the workspace.
Finish `npm run build:e2e` before starting the browser suite. The test export uses a separate directory, same-origin API defaults and a cleared Metro transform cache. Cold browser startup on shared Windows hosts uses one local worker and a 120-second test deadline; CI retains two workers. Run Maven upgrades serially
when warming the shared Windows Maven cache to avoid concurrent download/rename
failures. Keep model and payment credentials out of UI environment variables.

The older readiness percentages and launch dates in other files are historical
planning claims, not evidence of release approval. Markdown files carry this
review; older DOCX copies have not been regenerated by this change.

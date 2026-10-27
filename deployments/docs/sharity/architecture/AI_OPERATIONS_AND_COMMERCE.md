# Sharity operations and commerce development

Sharity AI chat is documented separately in [SHARITY_AI.md](SHARITY_AI.md).
The existing AI service now provides the `/chat` UI's approved public knowledge, SQL history
and social JSON review workflow. Real local Qwen3 1.7B HTTP answers were verified; official
social sync remains unimplemented. Core Sharity and AI are deployed to the local Docker origin
behind the existing public tunnel; Tesla remains disabled by request. See
[the deployment record](../production/LOCAL_CORE_AI_DEPLOYMENT.md) for current evidence and limits.

This work continues on `feature/sharity-production-responsive`. Local deployment does not establish Gameflip feature parity or full production readiness.

## Request diagnostics

All seven Java services install the same generated request filter, bounded background publisher, safe fallback exception handler and service-operation observation aspect. `scripts/install-diagnostics.py` maintains these standalone sources so each repository can still build independently. Run it from this workspace root after editing the templates.

Requests receive a validated `X-Correlation-ID` support reference. Completion logs contain the HTTP method, route **template**, status and elapsed milliseconds. Unexpected failures record an exception category; a Logback bridge also reports application ERROR log categories and background service-operation failures; neither request bodies nor query strings are sent to the diagnostic service. Existing domain logs are not a general-purpose PII scrubbing system: retain restricted access and review legacy logs before exporting them.

The BFF propagates the support reference, measures downstream response time, applies connection/read deadlines and replaces downstream 5xx bodies with a safe customer message. New commerce/admin clients use predefined messages and the reference rather than rendering raw response bodies. Operation observations and slow-operation logs help distinguish service work from downstream latency. Clients constructed without Spring's configured builders still need explicit instrumentation before claiming complete network trace coverage.

## Configure and run

1. Review `operations.env.example`. Apply the settings to each service through your normal environment or deployment secret management; Spring Boot does not automatically load this example file.
2. Generate a random shared ingestion token of at least 32 characters. Set `DIAGNOSTICS_TOKEN` to the same value on trusted publishers and `platform-ai-service`. Keep it out of Git and browser/Expo variables. Set `DIAGNOSTICS_ENABLED=true` on publishers. Publishers reject non-loopback HTTP; use HTTPS or a loopback TLS proxy between hosts.
3. Build and start `platform-ai-service` on port 8086 using Java 21. Configure its JWKS URL, issuer and audience to match your identity deployment. Local defaults match authorization-server on port 9093 at `/authorization-server/api`. Configure BFF `app.backends.ai-service` (environment `APP_BACKENDS_AI_SERVICE`) when it is not on the same host.
4. Sign in with `ADMIN` or `SUPER_ADMIN` and visit `/app/admin/diagnostics`. Desktop administrators have a pulse icon; mobile administrators have an Operations tab. Backend JWT authorization protects the data independently of UI visibility. The ingestion endpoint accepts its internal token, not a customer's bearer token.
5. To enable AI triage, provision Ollama and the selected model, set `AI_CHAT_PROVIDER=ollama` and `DIAGNOSTICS_AI_ENABLED=true`, and restart the AI service. Listing writing assistance separately requires `AI_ENABLED=true`. No model is downloaded automatically. Without a configured model, measured incidents and deterministic troubleshooting guidance remain available.
6. Optionally configure a private OpenTelemetry collector and set `OTEL_EXPORT_ENABLED=true` plus the traces/metrics/logs endpoints. Export is off by default. The collector must enforce access control, retention and appropriate redaction. Do not expose Actuator, the ingestion token, or raw logs through public ingress.

There is no AI call on a customer request thread. Each publisher has one worker, a queue of 128 and a three-second delivery timeout. Delivery failures are counted/logged, not retried in a way that repeats business operations. AI triage has one worker and a queue of 16, deduplicates a service/method/route/kind for one minute, and never executes tools, commands, restarts or payments.

## Meaning of the dashboard

The dashboard measures **delivered request samples**, not machine health or complete production traffic. It retains up to 5,000 samples per service for 15 minutes and up to 200 incidents for one hour. This cache is in memory and resets on restart. Missing/stale data is shown explicitly; absence of incidents does not prove health. Counters and p95 can be biased by dropped delivery or the sample cap. Retain production evidence in an external log/trace store.

The AI receives service identity, HTTP status, elapsed time, threshold and exception category. HTTP rollups exclude nested operation/log events to avoid counting them as extra requests. It does not receive arbitrary raw logs, credentials, customer content or database data. Its probable causes are unverified suggestions; it cannot establish a root cause from timing alone. The administrator sees measured facts separately from the explanation and AI availability status.

## Commerce behavior

The active cart screen uses persisted `/api/v1/cart` records, not fixed `/api/cart` demo responses. Ownership is checked for reads and mutations; caller-supplied customer IDs cannot select another user's cart. Quantity and mixed-currency checks run on the server. Current checkout is **one listing/one unit at a time**, not a complete multi-seller basket implementation. Digital listings use Buy Now.

Buy Now opens purchase review with current backend listing data. The user reviews policies; the server rechecks price and currency under a listing lock. The browser persists a user intent key; a scoped unique database key prevents duplicate orders when that same intent is retried. Apply `V54__add_purchase_request_key.sql` through Flyway for MySQL/PostgreSQL before using the new order path. These migrations still require staging database verification.

New marketplace orders start `PAYMENT_PENDING` / `PENDING`, not captured. Refresh retrieves payment-service state before changing that payment status. A redirect, client timeout or static screen cannot confirm payment or digital access. The active payment-return screen uses the stored, authenticated order rather than static confirmation data.

**Purchases are disabled by default.** `COMMERCE_DEMO_PURCHASES_ENABLED=true` enables the existing development payment/outbox workflow, clearly labelled demo in the UI. This is not live payment approval. Payment-service uses the same flag to permit simulated gateway transactions; unknown providers cannot silently fall back to simulation, and the unverified real adapter is blocked by this flow. Existing real-provider code and legacy projected payment endpoints require reconciliation, provider approval, webhook and idempotency review before real money is accepted. Do not enable the demo switch in a real-money deployment.

The main digital/jewellery/electronics catalog routes use live listing endpoints, with search over loaded listings, category filters, sorting, retry and empty states. Product details use backend data rather than fabricated electronics reviews/photos. Wishlist saving currently stays on the device. Contact/report actions open support. Seller draft creation and moderation submission use the existing backend-owned provider checks; optional AI descriptions require seller review.

## Remaining release work

- Provision and validate the model/collector in the target environment; no live inference has been certified locally.
- Finish and verify live OAuth/native deep links, provider-approved checkout, webhook reconciliation, refunds, payouts, delivery/access release and installed-device journeys.
- Finish multi-item checkout, shipping addresses/rates/tax, account-synced saved items, seller listing management/media, support messaging and remaining legacy mock routes. Replacing primary routes does not make every legacy endpoint production-ready.
- Apply/verify database migrations and test concurrent purchase intent handling on both supported databases.
- Resolve the recorded Expo dependency findings and assess new resolved dependencies using the latest audit report. No zero-vulnerability or complete production-readiness claim is made.
- Load-test diagnostics, secure retained telemetry and alerts, and verify multi-instance behavior. The embedded admin cache is not a durable monitoring backend.

Validation commands and actual outcomes are recorded in `outputs/operations-verification.md`. Native exports use the configured public HTTPS BFF origin and still need actual device/session verification. Browser tests use API fixtures; Java unit/security tests do not replace live provider/database integration tests.

References: [Spring Boot tracing and configured clients](https://docs.spring.io/spring-boot/4.0/reference/actuator/tracing.html), [Spring AI observability and sensitive content](https://docs.spring.io/spring-ai/reference/observability/), [Gameflip marketplace reference](https://gameflip.com/).

## Dependency remediation in this pass

The observability starter initially resolved OpenTelemetry 1.55.0. The OpenTelemetry BOM is now pinned to 1.62.0 to address [GHSA-rcgg-9c38-7xpx](https://github.com/open-telemetry/opentelemetry-java/security/advisories/GHSA-rcgg-9c38-7xpx). Review the final resolved-dependency scan rather than the initial scan when evaluating this branch.

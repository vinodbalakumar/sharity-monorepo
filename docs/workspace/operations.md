# Deployment and operations

## Deployment ownership

### Durable outbox retries

Marketplace-to-Payment and Payment-to-Wallet delivery is scheduler-only, not
repeated per-event after-commit callbacks. Each scheduler pass selects at most
20 due rows; the default poll interval is 5 seconds. Each failure persists
`attempt_count` and `next_attempt_at`, doubling the retry delay from 5 seconds
to a 5-minute ceiling, with 80-100% jitter. Polling can add up to one interval.
The schedule survives restarts and repeated queue requests do not reset it.
Attempts continue indefinitely to avoid dropping financial events. Permanent
configuration/payload errors still need operator correction; retries are not
a substitute for fixing the downstream service.

Deploy both services with their new Flyway migrations before relying on retry
state. Inspect `id`, `event_id`, `processing_status`, `attempt_count` and
`next_attempt_at` in `marketplace_event_outbox` / `payment_event_outbox`.
After correcting a downstream problem, an operator may clear `next_attempt_at`
on a specific `FAILED` row to make it due at the next poll. Do not delete rows,
change event IDs or mark undelivered events processed. Database row locks prevent
concurrent dispatch, but delivery remains at-least-once across crashes; receiver
idempotency must stay enabled. HTTP connect/read timeouts are 3/10 seconds.

`deployments/` contains Docker Compose definitions, Dockerfiles, Nginx routing,
environment-specific Spring properties, helper scripts, image plans and
deployment runbooks. The active GitHub Actions workflow definitions for this
monorepo are under root `.github/workflows/`. Publishing a component image
does not deploy or restart a running stack.

Start at [`deployments/README.md`](../../deployments/README.md) and the
[deployment runbook](../../deployments/docs/deployment.md). Environment-specific
details are in `deployments/docs/`; the `sharity/` guides include AI, commerce,
QA, and release context.

## Compose topologies

| File | Intended use |
| --- | --- |
| `deployments/docker-compose.yml` | Base stack; contains legacy local/host assumptions and must be reviewed with a suitable overlay and private configuration |
| `deployments/docker-compose.local.yml` | Local overrides, including externally supplied database credentials |
| `deployments/docker-compose.ai.yml` | Optional AI/diagnostics services and private AI settings |
| `deployments/docker-compose.qa.yml` | Generic QA stack using an externally provided database endpoint |
| `deployments/docker-compose.windows.yml`, `docker-compose.mac.yml`, `docker-compose.linux.yml` | QA host variants; use the shared QA database topology rather than creating independent databases |
| `deployments/docker-compose.prod.yml` | Production-oriented image deployment template; inject its required values securely |
| `deployments/docker-compose.simple.yml` | Simplified image-based deployment template |

Do not run a Compose file simply because it is named `local` or `prod`. Inspect
its required variables, mounted files, profiles, image tags, ports and database
targets first. The base Compose file contains local fallback values and
workstation assumptions; it is not a portable or secure production preset.
Private overlays and runtime credentials are intentionally absent from the
repository. Use `docker compose config` with the actual deployment environment
to review the resolved configuration before applying it.

## Routes and health

Nginx listens on container port `8080`. Its active configuration routes the
customer app (`/app/`), admin portal (`/sharity-admin/`), browser BFF (`/bff/`),
authorization server (`/authorization-server/api/`), marketplace
(`/marketplace-service/`), payments (`/payment-service/`) and wallet
(`/wallet-service/`). Direct host ports and enabled services vary by Compose
variant. The chat UI is routed at `/chat`. The AI service is optional; the AI
overlay uses a private network arrangement and does not publish an AI port
publicly. Tesla services are behind the `disabled-tesla` Compose profile and
are not enabled by default.

Use the healthcheck in the selected Compose file as the source of truth. In
this repository, authorization, payment, BFF and AI expose Actuator health;
marketplace and wallet also provide internal health routes used by deployment
templates. A healthy process is not proof that external authentication,
database migrations, provider credentials, or user journeys are healthy.

Useful read-only checks from the deployment directory:

```powershell
docker compose ps
docker compose logs --tail 200 authorization-server
docker compose logs --tail 200 marketplace-service
docker compose config
```

The precise Compose file list and environment loading must match the running
stack. Avoid commands that replace all images or volumes when diagnosing an
individual component; prefer a reviewed component-specific rollout and preserve
a rollback image as described in the deployment scripts.

## Local storefront troubleshooting

- **Sign-in routing:** the local BFF was restarted and the actual Sign in form
  opened using authorization on `localhost:9093`, BFF callback on `localhost:9090`
  and frontend on `localhost:9174/app/`. This verifies local routing, not a
  completed authenticated session or a production rollout. `/bff/login?force=true`
  propagates as OAuth `prompt=login`; configured public destinations, not a
  browser-supplied `Origin`, control production routing. See the
  [BFF local-run guide](../../platform-web-bff/README.md#local-run).
- **Registration-options 403 without ACAO:** standalone authorization previously
  fell back to the old Java CORS origin `http://localhost:3000` when external
  local configuration was absent. Its bundled local-profile default now allows
  `http://localhost:9173,http://localhost:9174` through `app.web.allowed-origin`
  (`SHARITY_WEB_ALLOWED_ORIGIN` overrides it). Restart authorization to load the
  correction. Do not solve this by opening shared/production CORS or adding a
  wildcard; see [configuration](configuration.md#standalone-local-browser-authentication).
  After the user restarted authorization, live credentialed registration-options
  requests from the configured UI origin returned 200, an untrusted origin
  returned 403, and an actual Chromium fetch returned 200. These are local
  checks, not a production rollout or completed registration.
- **Missing catalog images:** listing `imageUrl` points directly to public
  storage/CDN. Check that public URL's reachability before investigating the
  retained legacy listing-image endpoint; the UI no longer uses that endpoint
  for ordinary catalog image delivery.
- **Icons fail to load:** `IconFontGate` blocks app mounting until Ionicons and
  MaterialCommunityIcons load. The visible error offers Retry, which reloads
  the page on web; do not hide the failure.

## Release and data safeguards

- Provider adapters or API routes do not by themselves establish production
  payment readiness. Keep the demo/simulated purchase switch off for real
  money. Review payment-service documentation for provider approval, verified
  webhooks, idempotency, settlement and refund requirements.
- Do not enable a database migration against shared or production data until
  pending SQL is reviewed and a restorable backup exists. Authorization,
  marketplace, payment and wallet include demo seed/reset migrations.
- Keep JWT private keys, internal/chat/diagnostics tokens, OAuth credentials,
  payment-provider secrets and database passwords out of source, images,
  frontend build arguments and logs.
- Use TLS and trusted certificate validation for cross-host service calls.
  Do not expose internal health/diagnostics endpoints or model providers
  directly to the public internet.

## Consolidated checkout operations

The durable physical cart flow uses Marketplace V58 and Payment V25, each with
paired MySQL/PostgreSQL scripts. At implementation, the previous highest
versions were marketplace MySQL V56/PostgreSQL V57 and payment MySQL
V24/PostgreSQL V23. Gaps are intentional; never renumber applied migrations.
Back up and review the complete pending migration list, including historical
demo reset/seeds, before connecting either service to a persistent database.
The new migrations add structures and preserve legacy single-listing records.

Roll out payment-service and V25 first, then marketplace-service and V58, then
the frontend. Preserve rollback images, but do not drop new checkout/ledger
tables or remove consumed cart orders when rolling back application code.
Keep `COMMERCE_DEMO_PURCHASES_ENABLED` false for real-money environments.
Standalone `local` profiles enable simulated checkout in both Marketplace and
Payment by default; QA and production do not. An explicit value overrides either
default and must match across both services. Restart both after changing it.
Demo purchases additionally require payment's demo transaction gate and an
allowed demo gateway. No payout rail is selected; do not enable a transfer job
or translate `ELIGIBLE_LEDGER_ONLY` into `PAID`.

Inspect these records read-only during reconciliation:

```sql
-- Marketplace database: parent totals and its individual listing orders.
SELECT public_id, checkout_status, currency_code, customer_total_amount,
       platform_fee_amount, provider_amount FROM marketplace_checkout;
SELECT public_id, checkout_id, quantity, customer_total_amount,
       platform_fee_amount, provider_expected_amount, payment_status,
       payout_status FROM order_header WHERE checkout_id IS NOT NULL;
SELECT event_id, aggregate_public_id, event_type, processing_status
  FROM marketplace_event_outbox
 WHERE event_type LIKE 'payment-checkout-%';

-- Payment database: one buyer charge, reconciled ledger, no seller transfers.
SELECT checkout_public_id, checkout_status, customer_charge_amount,
       platform_fee_amount, provider_payable_amount FROM checkout_payment;
SELECT checkout_payment_id, SUM(customer_charge_amount) AS buyer_total,
       SUM(platform_fee_amount) AS fees, SUM(provider_payable_amount) AS sellers
  FROM checkout_payment_allocation GROUP BY checkout_payment_id;
SELECT marketplace_order_public_id, allocation_status, hold_reason
  FROM checkout_payment_allocation;
```

`PENDING`/`FAILED` marketplace outbox commands are retried by the existing
dispatcher. Restore payment connectivity/configuration and allow the same
command to retry; never manually create a legacy payment for each child.
Payment `CAPTURE_PENDING` means the gateway result is unresolved: retry with
the same checkout and payload/idempotency key, not a new cart purchase.
An owner refresh returns pending while creation is still queued; dependency
outages or malformed responses surface as errors, not payment success.

Acceptance and dispute commands wait for aggregate creation, then update only
the targeted ledger allocation. Unsupported partial or whole consolidated
refunds/cancellations return 409 without altering money or inventory; route
them to support rather than marking them successful. Reserved stock is retained
while capture is ambiguous. There is no automated reservation expiry or failed
checkout compensation: investigate the gateway outcome and ledger before any
manual correction. A real refund, cancellation, reservation-release workflow
and selected payout rail require a separate reviewed implementation.

No external processor transactions or purchases are required to validate this
change. Local frontend checks use existing npm typecheck/Playwright runners.
On this Windows workstation Maven was absent from PATH and its configured
Nexus was inaccessible; local Java validation instead reused cached dependency
jars with JDK 21/javac and JUnit. Those checks do not execute vendor migrations:
run reviewed Flyway migrations against disposable MySQL and PostgreSQL
databases in CI before deployment.
- Treat date-stamped deployment and verification documents as evidence for
  their specific run only. Confirm current container image digests, database
  state, environment and external routing before declaring a rollout successful.

For authorization schema/vendor startup rules, see the
[database runbook](../../authorization-server/docs/database-operations.md).
For current AI and commerce constraints, see
[`deployments/docs/sharity/OPERATIONS.md`](../../deployments/docs/sharity/OPERATIONS.md)
and [`deployments/docs/sharity/SHARITY_AI.md`](../../deployments/docs/sharity/SHARITY_AI.md).

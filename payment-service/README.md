Deployment environment profiles are maintained in `../deployments/config/payment-service/`; use `SPRING_CONFIG_ADDITIONAL_LOCATION` when starting outside Compose. Dockerfiles and server configuration are maintained in `../deployments`.

## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

See the [current workspace operations guide](../docs/workspace/operations.md) for deployment safeguards and operating guidance. Generated `outputs/` verification reports referenced by older notes are local-only and are not included in this repository.

# Payment Service

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the current
> [developer guide](../docs/workspace/developer-guide.md),
> [operations guide](../docs/workspace/operations.md), and dated
> [migration validation record](../docs/migration/VALIDATION.md).
>
> AI does not authorize, capture, refund or release funds. Provider approval/credentials, signature-verified webhooks, reconciliation and real sandbox-to-live validation remain release gates.


V3 payment backend foundation.

## Current Scope

The standalone `local` profile enables simulated payments in both Marketplace
and Payment. Set `COMMERCE_DEMO_PURCHASES_ENABLED=false` to disable them.
Outside `local`, both services default to disabled and require the same explicit
`COMMERCE_DEMO_PURCHASES_ENABLED=true` opt-in for demo checkout. This never enables
real-money adapters. If marketplace outbox commands receive HTTP 503, check that
both services use the same demo flag and restart after changing configuration.

Standalone `local` defaults: HTTP port `9095`, PostgreSQL
`jdbc:postgresql://localhost:5432/payment_db`, username `postgres`, and
`db/migration-postgresql` migrations. Create the database and supply
`PAYMENT_DB_PASSWORD`; override the connection using `PAYMENT_DB_URL` and
`PAYMENT_DB_USERNAME`.

Set `APP_JWT_PUBLIC_KEY_BASE64` to Base64 of the authorization server's public
key PEM, never its private key. Base64 takes priority over the optional
`JWT_PUBLIC_KEY_PATH` file fallback. Issuer and audience validation remain enabled.
These local defaults do not require external deployment profiles; explicitly
loading an external profile can override them.

- JWT resource-server security using the authorization-server public key.
- MySQL/Flyway schema for payment orders, transactions, provider payouts, refunds, webhooks, and outbox.
- Persisted mock checkout, payment transaction, payout hold, payout release, and refund records.
- Customer payment creates payout `ON_HOLD`.
- Marketplace acceptance can mark payout eligible and paid in mock mode only after authorization-server confirms provider payout eligibility.
- Provider payout is blocked when authorization-server reports provider/payout restriction.
- Payment provider integration is behind the `PaymentGateway` boundary with mock and Stripe test-mode adapter classes.
- STORY-093 adds a Stripe Connect backend mock/API contract for seller onboarding, buyer PaymentIntent flow, capture/void/refund/status, webhooks, and admin Stripe summaries.
- STORY-094 adds a PayPal marketplace backend mock/API contract for seller onboarding, buyer Orders flow, authorization/capture/void/refund/status, webhooks, settlements, and admin PayPal summaries.
- Payment events are sent to Wallet Service internal ingestion APIs.
- Payment capture sends both customer payment activity and provider pending earning events to Wallet Service.
- Stripe webhook endpoint placeholder with idempotency table prepared.
- Internal service calls use `X-Internal-Service-Token`.
- Standalone local services share a private generated token: run
  `.\tools\Initialize-LocalServiceToken.ps1` from the repository root, then restart
  Authorization, Marketplace, Payment and Wallet. See the
  [local authentication setup and 401 troubleshooting](../docs/workspace/developer-guide.md#standalone-local-internal-service-authentication).
  Payment refuses to start if the internal token is blank. Keep explicit
  `APP_INTERNAL_SERVICE_TOKEN` overrides identical across all four services.
- Docker deployment is managed from the repository's sibling `../deployments/`
  directory; see the current [deployment runbook](../deployments/docs/deployment.md).

## V3 Flow Notes

### Consolidated checkout amount contract

`POST /internal/api/v1/payments/checkouts` accepts one buyer charge with ledger-only
seller allocations. Each allocation uses the existing marketplace policy:
`amount = itemAmount`, `platformFeeAmount = round(amount * 0.05, 2, HALF_UP)`,
and `providerPayableAmount = amount - platformFeeAmount`. Fees are deducted from
the buyer amount, not added to the seller payable. Parent amounts are the exact
sums of their allocation amounts; do not round a new fee on the parent total.
For example, buyer amounts `21.00`, `35.00`, and `10.61` yield fees `1.05`,
`1.75`, and `0.53`, totaling `66.61` charged, `3.33` fees, and `63.28` payable.
Eligibility and disputes only update the allocation ledger; provider transfers,
consolidated refunds, and cancellations remain unsupported. Real provider
transactions remain disabled by the gateway registry.

Apply forward-only V25 for the selected MySQL or PostgreSQL dialect. The
`checkout_payment` parent and `checkout_payment_allocation` ledger accompany
one `payment_order` with `order_kind=CONSOLIDATED_CHECKOUT`; no `provider_payout`
is created. A committed capture intent and stable gateway idempotency key make
ambiguous retries recoverable. The exact original payload replays the original
result; changed allocations or totals conflict. Legacy single-listing payout
release is unchanged. See the [API contract](../contracts/physical-cart-checkout.md)
and [operator safeguards](../docs/workspace/operations.md#consolidated-checkout-operations).

- Payment owns payment orders, holds, releases, refunds, and webhook/event records.
- Marketplace purchase creates the payment order.
- Marketplace acceptance requests payout eligibility and payout release.
- Payment emits wallet projection events and uses idempotent event records where available.
- Stripe remains test-mode only until external credentials and runtime validation are provided.
- PayPal remains sandbox/mock only until PayPal Commerce Platform approval, credentials, webhook verification, and settlement reconciliation are configured.
- Wallet projection delivery uses the durable scheduler-only outbox described below.

### Wallet outbox retries and recovery

Apply forward-only **V26** from the selected MySQL or PostgreSQL migration tree
before deploying this version. Queueing never performs wallet HTTP calls, even
after commit: rows remain `PENDING` until the scheduler runs. Repeated queueing of
the same deterministic event ID leaves the original payload, status, attempt
count and retry deadline unchanged, including already processed events.

`app.outbox.dispatch-delay-ms` defaults to 5000. Each scheduler pass selects up
to 20 `PENDING`/`FAILED` rows whose `next_attempt_at` is null or due, ordered by
`created_at`, then `id`. A pessimistic row lock is held in a separate transaction
through each HTTP request; status and deadline are rechecked under that lock.
The wallet client has a 3-second connect timeout and a 10-second read timeout.

Failures increment durable `attempt_count` and set `next_attempt_at` using
exponential backoff: `app.outbox.retry-initial-delay-ms` (default 5000) doubles
per failure up to `app.outbox.retry-max-delay-ms` (default 300000), then receives
an independent 0.8–1.0 jitter multiplier. The maximum is a hard cap; the initial
delay must be positive and the maximum at least the initial delay or startup
fails. Delivery occurs on the first scheduler pass after the deadline, not at
the exact deadline. There is no attempt limit or automatic discard. Success
clears the deadline and sets `PROCESSED`/`processed_at`, retaining attempt history.
Delivery is at least once (a crash after remote acceptance can cause replay), so
wallet ingestion must deduplicate by the stable source event ID.

WARN diagnostics include event ID, attempt count, retry deadline and a sanitized
reason. HTTP 401/403 indicates checking matching internal service tokens and
wallet authorization; transport failures indicate checking connectivity and
wallet availability. Logs omit downstream response bodies and credentials.

Inspect backlog without exposing payloads (works for both supported dialects):

```sql
SELECT event_id, event_type, processing_status, attempt_count,
       next_attempt_at, created_at, processed_at
FROM payment_event_outbox
WHERE processing_status IN ('PENDING', 'FAILED')
ORDER BY created_at, id;
```

After correcting the downstream cause, an operator may make one **FAILED** event
immediately eligible for the next scheduler pass, preserving its payload and
attempt history:

```sql
UPDATE payment_event_outbox
SET next_attempt_at = NULL
WHERE event_id = '<reviewed-event-id>' AND processing_status = 'FAILED';
```

Do not delete outbox data, reset attempts, or change event IDs/payloads to replay.
If delivery fails again, normal backoff resumes from the retained attempt count.

Stripe Connect mock routes:
- `/api/payments/providers/stripe/availability`
- `/api/payments/providers/stripe/config`
- `/api/seller/payments/stripe/**`
- `/api/seller/payouts/stripe/status`
- `/api/payments/stripe/**`
- `/api/webhooks/stripe`
- `/api/admin/payments/stripe/**`

Stripe production reminders:
- Stripe secrets, webhook signing secrets, client secrets, connected-account KYC, and raw provider payloads are backend-only.
- Real Connect onboarding should use Stripe-hosted onboarding/account links or embedded onboarding. Hosted onboarding must be opened in a browser, not an embedded mobile webview.
- Real Connect webhook handling must verify signatures, persist event IDs, prevent duplicate processing, and map account/payment/refund/dispute events to internal state.
- Marketplace fee and transfer behavior must follow Stripe-supported Connect models such as separate charges and transfers or another approved Connect charge type.

Stripe live integration, real webhook verification, and broad business-flow automated tests are the next implementation step.

PayPal marketplace mock routes:
- `/api/payments/providers/paypal/availability`
- `/api/payments/providers/paypal/config`
- `/api/seller/payments/paypal/**`
- `/api/seller/payouts/paypal/status`
- `/api/payments/paypal/**`
- `/api/webhooks/paypal`
- `/api/admin/payments/paypal/**`

PayPal production reminders:
- PayPal client secrets, partner referral payloads, merchant IDs, webhook IDs, access tokens, raw webhook bodies, and provider payloads are backend-only.
- Seller onboarding should use PayPal Partner Referrals / PayPal-hosted seller onboarding for approved marketplace partners.
- Buyer checkout should be backend-owned through PayPal Orders APIs, with authorization/capture/refund status persisted internally.
- Platform fee, seller receivable, payout, and settlement values must not be exposed to buyer APIs.
- Real webhook handling must verify PayPal transmission headers/signatures, persist event IDs, prevent duplicate processing, and map onboarding/order/capture/refund/dispute events to internal state.

PayPal live integration, PayPal Commerce Platform approval, real webhook verification, and settlement reconciliation are deferred beyond the mock contract.

## Local URL

```text
http://localhost:8080/payment-service/swagger-ui/index.html
```

## Database

```text
payment_db
```

MySQL runs on the PC, not in Docker.

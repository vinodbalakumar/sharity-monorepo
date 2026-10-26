## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

See workspace `OPERATIONS.md` and `outputs/operations-verification.md` for current setup, evidence and release limitations. Earlier readiness statements below are historical.

# Payment Service

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the workspace
> `outputs/production-verification.md` and shared docs
> `production/2026-10-25_READINESS_REVIEW.md` for exact evidence and blockers.
>
> AI does not authorize, capture, refund or release funds. Provider approval/credentials, signature-verified webhooks, reconciliation and real sandbox-to-live validation remain release gates.


V3 payment backend foundation.

## Current Scope

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
- Docker deployment through the central `C:\Users\HP\projects\deployments` stack.

## V3 Flow Notes

- Payment owns payment orders, holds, releases, refunds, and webhook/event records.
- Marketplace purchase creates the payment order.
- Marketplace acceptance requests payout eligibility and payout release.
- Payment emits wallet projection events and uses idempotent event records where available.
- Stripe remains test-mode only until external credentials and runtime validation are provided.
- PayPal remains sandbox/mock only until PayPal Commerce Platform approval, credentials, webhook verification, and settlement reconciliation are configured.
- Existing outbox tables are present, but a safe dispatcher/process loop is still pending.

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

# Payment Service

V3 payment backend foundation.

## Current Scope

- JWT resource-server security using the authorization-server public key.
- MySQL/Flyway schema for payment orders, transactions, provider payouts, refunds, webhooks, and outbox.
- Persisted mock checkout, payment transaction, payout hold, payout release, and refund records.
- Customer payment creates payout `ON_HOLD`.
- Marketplace acceptance can mark payout eligible and paid in mock mode only after authorization-server confirms provider payout eligibility.
- Provider payout is blocked when authorization-server reports provider/payout restriction.
- Payment provider integration is behind the `PaymentGateway` boundary with mock and Stripe test-mode adapter classes.
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
- Existing outbox tables are present, but a safe dispatcher/process loop is still pending.

Stripe test-mode adapter internals and broad business-flow automated tests are the next implementation step.

## Local URL

```text
http://localhost:8080/payment-service/swagger-ui/index.html
```

## Database

```text
payment_db
```

MySQL runs on the PC, not in Docker.

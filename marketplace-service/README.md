# Marketplace Service

V3 marketplace backend foundation.

## Current Scope

- JWT resource-server security using the authorization-server public key.
- MySQL/Flyway schema for listings, orders, delivery submission, acceptance, disputes, and outbox.
- Persisted listing, order, delivery, acceptance, and dispute-placeholder APIs.
- Customer purchase creates a Payment Service order through the internal API.
- Customer acceptance requests payout eligibility from Payment Service.
- Provider listing, sales, and delivery actions validate MARKETPLACE provider eligibility with authorization-server.
- Internal service calls use `X-Internal-Service-Token`.
- Docker deployment through the central `C:\Users\HP\projects\deployments` stack.

## V3 Flow Notes

- Home catalog, category drill-down, search, detail, checkout, and seller-management screens are all backed by backend data.
- Purchase -> order creation -> payment hold is handled through the Marketplace and Payment service boundary.
- Delivery acceptance requests payout eligibility before any payout release can happen.
- Refund/problem reporting routes through Payment and then into Wallet projections.
- Existing outbox tables exist, but a safe dispatcher/process loop is still not validated.

Broad business-flow automated tests are the next implementation step.

## Local URL

```text
http://localhost:8080/marketplace-service/swagger-ui/index.html
```

## Database

```text
marketplace_db
```

MySQL runs on the PC, not in Docker.

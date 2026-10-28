## Physical delivery correction (2026-10-26)

Flyway V55 corrects physical inventory with digital delivery methods to `SHIPPING` and repairs affected open-cart delivery snapshots. Existing shipping and local pickup remain unchanged; digital listings and order history are untouched. Both MySQL and PostgreSQL migrations run after existing seeds, so new databases receive the same correction without editing applied migration checksums. Listing create/update rejects physical items using digital delivery; choose shipping or local pickup.

Cart snapshots use `Marketplace seller` if an imported listing has no seller display name. Cart adds are not retried within a failed persistence transaction.

Deploy and live-cart verification helpers are maintained in `../deployments/scripts/sharity/`. The live check uses environment-supplied credentials and removes only its newly added cart item. Checkout remains a separate per-listing flow.

Deployment environment profiles are maintained in `../deployments/config/marketplace-service/`; use `SPRING_CONFIG_ADDITIONAL_LOCATION` when starting outside Compose. Dockerfiles and server configuration are maintained in `../deployments`.

## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

Apply Flyway V54 on MySQL/PostgreSQL before the new idempotent purchase path. Carts enforce user ownership. New orders start pending; payment refresh checks downstream state. `COMMERCE_DEMO_PURCHASES_ENABLED` is false by default and must never stand in for live payment approval.

See the [current workspace operations guide](../docs/workspace/operations.md) for deployment safeguards and operating guidance. Generated `outputs/` verification reports referenced by older notes are local-only and are not included in this repository.

# Marketplace Service

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the current
> [developer guide](../docs/workspace/developer-guide.md),
> [operations guide](../docs/workspace/operations.md), and dated
> [migration validation record](../docs/migration/VALIDATION.md).
>
> JWT resource-server validation is enabled. Anonymous access is limited to explicit public routes; unmatched routes require authentication. Rate-limit exhaustion returns JSON 429. Catalog image tests configure the storage-provider fixture explicitly.


V3 marketplace backend foundation.

## Current Scope

- JWT resource-server security using the authorization-server public key.
- MySQL and PostgreSQL Flyway schemas for listings, orders, delivery submission, acceptance, disputes, and outbox.
- Persisted listing, order, delivery, acceptance, and dispute-placeholder APIs.
- Customer purchase creates a Payment Service order through the internal API.
- Customer acceptance requests payout eligibility from Payment Service.
- Provider listing, sales, and delivery actions validate MARKETPLACE provider eligibility with authorization-server.
- Internal service calls use `X-Internal-Service-Token`.
- Docker deployment is managed from the repository's sibling `../deployments/`
directory; see the current [deployment runbook](../deployments/docs/deployment.md).

## V3 Flow Notes

- Home catalog, category drill-down, search, detail, checkout, and seller-management screens are all backed by backend data.
- Purchase -> order creation -> payment hold is handled through the Marketplace and Payment service boundary.
- Delivery acceptance requests payout eligibility before any payout release can happen.
- Refund/problem reporting routes through Payment and then into Wallet projections.
- Existing outbox tables exist, but a safe dispatcher/process loop is still not validated.

Broad business-flow automated tests are the next implementation step.

## Local URL

```text
http://localhost:8084/marketplace-service/swagger-ui/index.html
```

## Database

```text
marketplace_db
```

Datasource env vars:

- `MARKETPLACE_DB_URL`
- `MARKETPLACE_DB_USERNAME`
- `MARKETPLACE_DB_PASSWORD`

The shared datasource configuration is in
[`src/main/resources/application.properties`](src/main/resources/application.properties).
Environment-specific profiles are maintained under
[`../deployments/config/marketplace-service/`](../deployments/config/marketplace-service/);
they are not loaded automatically by a standalone Spring Boot launch. Set the
datasource variables for a disposable database before starting the service.
Review the selected Flyway migrations before connecting to an existing
database; some historical migrations reset or seed demo marketplace data.

## Slow Query Diagnostics

Marketplace service can log slow SQL and print an `EXPLAIN` for the exact statement that crossed the threshold.

Enable it with:

```text
MARKETPLACE_SLOW_QUERY_LOGGING_ENABLED=true
MARKETPLACE_SLOW_QUERY_THRESHOLD_MS=500
```

When enabled, the app logs:

- the exact SQL statement
- the bound parameter values
- the elapsed time in milliseconds
- an `EXPLAIN` result for slow `SELECT` queries

This is meant for QA and troubleshooting. Keep it off in production unless you are actively investigating a performance issue.

## UI and catalog integrity review (2026-10-26)

See `../docs/architecture/SHARITY_FUNCTIONAL_FLOWS.md` for navigation, image delivery, order-state correctness, verification scope and remaining preview features. Versioned guide: `../deployments/docs/sharity/architecture/SHARITY_FUNCTIONAL_FLOWS.md`.

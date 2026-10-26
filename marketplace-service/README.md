## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

Apply Flyway V54 on MySQL/PostgreSQL before the new idempotent purchase path. Carts enforce user ownership. New orders start pending; payment refresh checks downstream state. `COMMERCE_DEMO_PURCHASES_ENABLED` is false by default and must never stand in for live payment approval.

See workspace `OPERATIONS.md` and `outputs/operations-verification.md` for current setup, evidence and release limitations. Earlier readiness statements below are historical.

# Marketplace Service

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the workspace
> `outputs/production-verification.md` and shared docs
> `production/2026-10-25_READINESS_REVIEW.md` for exact evidence and blockers.
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

Datasource env vars:

- `MARKETPLACE_DB_URL`
- `MARKETPLACE_DB_USERNAME`
- `MARKETPLACE_DB_PASSWORD`

Local database selection is still profile-based for migration scripts:

- `local,mysql` uses [src/main/resources/application-mysql.yml](c:/data/apps/marketplace-service/src/main/resources/application-mysql.yml)
- `local,postgresql` uses [src/main/resources/application-postgresql.yml](c:/data/apps/marketplace-service/src/main/resources/application-postgresql.yml)

Examples:

```text
mvn spring-boot:run -Dspring-boot.run.profiles=local,mysql
mvn spring-boot:run -Dspring-boot.run.profiles=local,postgresql
```

The shared settings stay in [src/main/resources/application.yml](c:/data/apps/marketplace-service/src/main/resources/application.yml).

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

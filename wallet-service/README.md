Deployment environment profiles are maintained in `../deployments/config/wallet-service/`; use `SPRING_CONFIG_ADDITIONAL_LOCATION` for QA/production outside Compose. Standalone local defaults are bundled below. Dockerfiles and server configuration are maintained in `../deployments`.

## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

See the [current workspace operations guide](../docs/workspace/operations.md) for deployment safeguards and operating guidance. Generated `outputs/` verification reports referenced by older notes are local-only and are not included in this repository.

# Wallet Service

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the current
> [developer guide](../docs/workspace/developer-guide.md),
> [operations guide](../docs/workspace/operations.md), and dated
> [migration validation record](../docs/migration/VALIDATION.md).
>
> AI does not calculate balances or write ledger entries. Verify event replay/idempotency, reconciliation and recovery before release.


V3 wallet backend foundation.

## Current Scope

- JWT resource-server security using the authorization-server public key.
- PostgreSQL (local/production) and MySQL (QA) Flyway schemas for wallet accounts, ledger entries, balance snapshots, and event inbox.
- Customer, provider, admin, and internal event ingestion APIs.
- Idempotent payment event inbox.
- Ledger entries and balance snapshots for customer payment, provider pending earning, available earning, paid payout, and refund activity.
- Internal event ingestion uses `X-Internal-Service-Token`.
- Docker deployment is managed from the repository's sibling `../deployments/`
  directory; see the current [deployment runbook](../deployments/docs/deployment.md).

Wallet is an activity and ledger projection. It does not move real money or provide bank-like balances.

## V3 Flow Notes

- Payment sends customer payment activity, provider pending earning, payout paid, and refund events into Wallet.
- Wallet records idempotent inbox activity and updates ledger entries/balance snapshots.
- The service is read/projection oriented and does not call Stripe or release funds.
- The current flow still relies on synchronous service coordination plus inbox dedupe.

## Local URL

```text
http://localhost:9096/wallet-service/swagger-ui/index.html
```

## Database

```text
test2
```

The bundled `local` profile (the default) uses PostgreSQL at
`jdbc:postgresql://localhost:5432/test2` with username `postgres`.
Create `test2` before startup; Flyway uses `db/migration-postgresql` and
Hibernate validates the schema. No database reset or demo-data reset migration runs.
Set these environment variables as needed:

- `WALLET_DB_URL` and `WALLET_DB_USERNAME` override the local defaults.
- Supply `WALLET_DB_PASSWORD` securely to override the current workstation password setting; do not commit real credentials.
- `SERVER_PORT` overrides local port `9096`.

## Local JWT and service configuration

Set `APP_JWT_PUBLIC_KEY_BASE64` to Base64 of the authorization server's complete
**RSA public key PEM** (`BEGIN PUBLIC KEY`, X.509), never its private key.
Alternatively set `JWT_PUBLIC_KEY_PATH` to an existing public PEM file.
Base64 takes priority; malformed Base64 or invalid key material fails startup
without silently falling back to the file. At least one key source is required.

The local issuer is `http://localhost:9093/authorization-server/api`
(`AUTH_ISSUER_URL` override); audience remains `WALLET_API` (`JWT_AUDIENCE` override).
Set `APP_INTERNAL_SERVICE_TOKEN` to the same token used by payment-service for
wallet event ingestion. Wallet is a projection and needs no outbound backend URL.
`SHARITY_WEB_ALLOWED_ORIGIN` overrides the comma-separated local CORS origins
`http://localhost:9173,http://localhost:9174`.

Run `mvn spring-boot:run` with the required environment variables; no external
local properties file is needed. Supplying an external configuration location
still applies its overrides (including the legacy local MySQL profile).
QA/production keep their existing external profiles and database/issuer/token
requirements; local datasource, issuer and CORS defaults are not active there.
GitHub environment variables or deployment secrets should provide deployment values.

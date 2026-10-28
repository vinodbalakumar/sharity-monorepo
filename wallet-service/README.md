Deployment environment profiles are maintained in `../deployments/config/wallet-service/`; use `SPRING_CONFIG_ADDITIONAL_LOCATION` when starting outside Compose. Dockerfiles and server configuration are maintained in `../deployments`.

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
- MySQL/Flyway schema for wallet accounts, ledger entries, balance snapshots, and event inbox.
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
http://localhost:8080/wallet-service/swagger-ui/index.html
```

## Database

```text
wallet_db
```

Datasource credentials and URL are injected through environment variables:

- `WALLET_DB_URL`
- `WALLET_DB_USERNAME`
- `WALLET_DB_PASSWORD`

GitHub environment variables or deployment secrets should provide those values at runtime.

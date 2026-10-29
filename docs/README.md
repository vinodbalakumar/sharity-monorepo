# Sharity documentation

This repository contains the current Sharity monorepo and its deployment
configuration. Use this index to find the maintained workspace guides.

## Start here

- [Architecture](workspace/architecture.md): components, request flows, data
  boundaries, routes and deployment topology.
- [Developer guide](workspace/developer-guide.md): prerequisites, build, test
  and local development commands.
- [Configuration guide](workspace/configuration.md): configuration sources,
  database behavior and secret-handling rules.
- [Operations guide](workspace/operations.md): Compose variants, health checks,
  rollout boundaries and operational safeguards.

## Component references

| Area | Source and reference |
| --- | --- |
| Identity and OAuth | [`authorization-server`](../authorization-server/README.md); [database runbook](../authorization-server/docs/database-operations.md) |
| Marketplace and catalog | [`marketplace-service`](../marketplace-service/README.md) |
| Payments and refunds | [`payment-service`](../payment-service/README.md) |
| Wallet ledger projection | [`wallet-service`](../wallet-service/README.md) |
| Browser session and API proxy | [`platform-web-bff`](../platform-web-bff/README.md) |
| AI and diagnostics | [`platform-ai-service`](../platform-ai-service/README.md) |
| Web/native storefront | [`sharity-app-ui`](../sharity-app-ui/README.md) |
| Admin portal | [`sharity-admin-portal`](../sharity-admin-portal/README.md) |
| Optional Tesla integration | [`tesla-dashboard-services`](../tesla-dashboard-services/README.md) |
| Deployment | [`deployments`](../deployments/README.md); [deployment runbook](../deployments/docs/deployment.md) |
| API contracts | [`contracts`](../contracts/README.md) |

OpenAPI/Swagger documentation is served by the running services; the `contracts`
directory does not currently contain published machine-readable API
specifications.

## Historical and generated records

- [Imported source history and repository migration](migration/README.md)
- [Migration verification record](migration/VALIDATION.md)
- [Architecture source documents](workspace/architecture/)
- [Dated deployment and release notes](../deployments/docs/)

Release notes and verification reports describe the specific revision and
environment named in each report. They are not claims about the current
deployment. Private runtime settings, credentials, generated logs and local
verification output are intentionally not part of this documentation set.

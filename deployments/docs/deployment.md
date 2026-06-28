# Sharity Deployment Repo

This repository centralizes Sharity deployment metadata, compose layouts, helper scripts, and GitHub Actions workflow templates.

## What lives here

- Deployment manifests
- GitHub Actions workflow definitions
- Compose files for QA, prod, and target-specific deployments
- Helper scripts for planning, health checks, QA routing, and rollback
- Documentation for the deployment architecture

## Components

- authorization-server
- marketplace-service
- payment-service
- platform-web-bff
- sharity-app-ui
- wallet-service

## Workflows

- `qa-build-deploy.yml` - QA workflow entry point with dropdown inputs.
- `prod-build-deploy.yml` - production workflow entry point with environment approval semantics.
- `component-build-deploy.yml` - reusable component workflow.
- `qa-auto-deploy.yml` - branch-driven QA automation workflow.

## Compose files

- `docker-compose.qa.yml` - generic QA template.
- `docker-compose.mac.yml` - Mac QA node.
- `docker-compose.windows.yml` - Windows QA node.
- `docker-compose.linux.yml` - Linux QA node.
- `docker-compose.prod.yml` - production node.

## Notes

- No business logic is stored here.
- No API contracts are changed here.
- The deployment branch is standardized to `claude_cop_patch`.
- QA target choices are `windows`, `mac`, and `linux`.
- The QA route is designed to have only one active public target at a time.
- Rollback and retry behavior are described in helper scripts and workflow inputs.
- These files prepare the deployment flow; they do not change application code.
- QA app containers must use the Windows MySQL primary or an approved DB endpoint. Do not add independent local MySQL services to Mac/Linux QA compose files.
- If QA data must exist on Mac/Linux too, configure MySQL replication from the Windows primary. See `docs/mysql-replication-runbook.md`.
- marketplace-service and wallet-service do not ship Spring Actuator in this repo state, so QA health checks use the shared `/internal/health` endpoint exposed by each service.
- The same compose health model is used on QA, Mac, Linux, Windows, and prod so the workflow behaves the same across runner targets.

## Required secrets / environment values

The workflows expect these values to be provided in GitHub Secrets or the runner environment when the workflows are eventually executed:

- `DB_HOST` repository variable: Windows MySQL host or approved replica host.
- `DB_PORT` repository variable: MySQL port, usually `3306`.
- `DB_USERNAME` repository variable: MySQL user.
- `DB_PASSWORD` repository secret: MySQL password.
- `SPRING_REDIS_HOST`
- `SPRING_REDIS_PORT`
- `AUTHORIZATION_SERVER_URL`
- `INTERNAL_SERVICE_TOKEN`
- `EXPO_PUBLIC_BFF_BASE_URL`
- `EXPO_PUBLIC_MARKETPLACE_BASE_URL`
- `EXPO_PUBLIC_ASSET_PUBLIC_BASE_URL`
- `CERTS_DIR`

Production deployment also expects:

- `IONOS_HOST`
- `IONOS_USER`
- `IONOS_SSH_KEY`
- `IONOS_APP_DIR` (optional)

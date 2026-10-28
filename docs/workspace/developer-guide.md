# Developer guide

## Prerequisites

- Java 21 and Maven 3.9 or newer for the Java modules.
- Node.js 22 or newer and npm 10 or newer for root tooling and frontends.
- Git for source control and the root workspace-integrity checks.
- Docker Compose v2 for container builds and deployment workflows.
- Python 3 only for selected deployment/verification scripts.
- Playwright browser binaries only when running browser tests.

Use the component `pom.xml` and `package.json` files as the source of truth for
specific versions and tasks.

## Root commands

Run these commands from the repository root:

```powershell
npm run components
npm run check:workspace
npm run test:tools
npm run install:apps
npm run verify -- marketplace-service
npm run verify -- sharity-app-ui
npm run verify -- sharity-admin-portal
```

`npm run install:apps` performs a clean lockfile-based install (`npm ci`) for
both apps. `verify` runs the task configured for the selected component;
`npm run verify` covers core components and excludes optional Tesla by default.
Use `npm run verify -- marketplace-service --dry-run` to inspect planned
actions without executing them. Use
`npm run verify -- --include-optional` only when intentionally including the
optional component.

The root Maven reactor contains the six core services:

```powershell
mvn -B -ntp verify
mvn -B -ntp -pl marketplace-service verify
```

Tesla can be included explicitly with `mvn -B -ntp -Ptesla verify`. It is not
part of default reactor builds or the default Compose deployment.

## Frontend tasks

Each frontend has an independent `package-lock.json`; do not install or hoist
their dependencies from the root `package.json`.

```powershell
Push-Location sharity-app-ui
npm ci
npm run typecheck
npm run test:assets
npm run build:web
Pop-Location

Push-Location sharity-admin-portal
npm ci
npm run build
Pop-Location
```

For interactive development, run `npm run start` (Expo) or `npm run web` from
`sharity-app-ui/`. Run `npm run dev` from `sharity-admin-portal/` for the Vite
admin app; its API proxy target is configurable with
`VITE_DEV_API_PROXY_TARGET`. These local servers still need compatible backend
services and safe development configuration for authenticated flows.

For storefront Playwright checks, run `npm run build:e2e` first, install the
Playwright browsers used by the selected tests, then run `npm run test:e2e`.
The scripted browser suite uses fixture APIs and does not establish live OAuth,
database, or payment-provider behavior. The storefront's native export commands
and Expo configuration are documented in its
[component README](../../sharity-app-ui/README.md).

## Running services

For standalone Spring Boot execution, set datasource, JWT/JWKS and any required
integration settings before starting the service. Start with the service's
README and `src/main/resources/application.properties`; deployment profiles
under `deployments/config/` are not automatically loaded by a standalone
process. The authorization service's PostgreSQL/MySQL setup, Flyway selection
and migration safeguards are documented in its
[database operations runbook](../../authorization-server/docs/database-operations.md).

For Docker, use the [deployment guide](operations.md) and the deployment-specific
runbook. Do not use the unqualified Compose defaults as a portable development
environment: some defaults refer to host-mounted key material, external
databases and local-only configuration.

## Root tooling

`workspace.json` declares component paths, build kinds and dependency links.
`tools/workspace.mjs` runs install/build/verify tasks, `tools/affected.mjs`
selects changed components and their consumers, and
`tools/deployment-plan.mjs` prepares a component image plan. Changes to
component relationships belong in `workspace.json` and should be covered by
`npm run test:tools` and `npm run check:workspace`.

## CI

The root `.github/workflows/ci.yml` checks the workspace, runs root-tool tests,
computes affected components and verifies those components. The publish
workflow builds and pushes a single selected component image; it does not
deploy or restart a running stack. Workflow files nested under component or
`deployments/.github/workflows/` are historical templates, not GitHub's active
workflow definitions for this repository.

See [migration validation](../migration/VALIDATION.md) for a dated record of
specific results. It is historical evidence, not an automatic statement about
the current checkout or deployment.

# Sharity monorepo

Sharity applications, services, and deployment tooling share one Git repository. Each component retains its own build, dependency lockfile, Docker image, database boundary, and release process.

The original folder names are retained so existing Compose contexts and operational paths continue to work. The storefront uses React 19/Expo, while the admin portal uses React 18; each keeps its own lockfile and installation. Root commands do not hoist or merge those dependency trees.

| Component | Purpose |
| --- | --- |
| `sharity-app-ui/` | Expo / React Native / web storefront |
| `sharity-admin-portal/` | React / Vite admin portal |
| `authorization-server/` | Identity, OAuth, JWTs and roles |
| `marketplace-service/` | Catalog, cart, orders and storefront controls |
| `payment-service/` | Payment processing and reconciliation |
| `wallet-service/` | Wallet and ledger projections |
| `platform-web-bff/` | Browser sessions, CSRF and API proxy |
| `platform-ai-service/` | Sharity AI and approved knowledge |
| `tesla-dashboard-services/` | Optional integration, disabled in the existing stack |
| `deployments/` | Compose, Dockerfiles, Nginx and operational tools |
| `contracts/` | Shared API specifications and compatibility fixtures |
| `tools/` | Root task runner, affected-component selection and validation |

## Build and verify

Prerequisites: Git, Java 21, Maven 3.9+, Node 22+, npm 10+, and Docker Compose v2 for container/deployment work. Python 3 is used by some inherited operational scripts. No credentials or local database are required for the root tooling tests or frontend exports.

```sh
npm run components
npm run install:apps
npm run test:tools
npm run check:workspace
npm run verify -- marketplace-service
npm run verify -- sharity-app-ui
npm run verify -- sharity-admin-portal
```

Run all core Java service tests with `mvn -B -ntp verify`. Select one service with `mvn -B -ntp -pl marketplace-service verify`. Include the optional Tesla module with `mvn -B -ntp -Ptesla verify`; this does not start or enable the integration. `npm run verify` runs component verification sequentially. Add `--dry-run` to inspect commands without executing them.

For storefront browser checks:

```sh
npm --prefix sharity-app-ui run build:e2e
cd sharity-app-ui
npx playwright install chromium webkit
npx playwright test cart-badge.spec.ts catalog-integrity.spec.ts storefront-sections.spec.ts purchase-lifecycle.spec.ts --project=chromium --project=webkit
```

Set `SHARITY_PLAYWRIGHT_PORT` to an unused port when another checkout already serves the default port 8097. The admin browser fixtures require its Vite preview server on port 8098. Existing component lint and audit commands remain available; their pre-existing debt is not represented as a passing migration gate. See [migration validation](docs/migration/VALIDATION.md) for the recorded checks.

## Changes and CI

`workspace.json` declares component boundaries and API consumers. `npm run affected -- BASE_SHA HEAD_SHA` returns affected components, including transitive consumers. Shared contracts, root build configuration, and CI changes verify all core components. Documentation-only changes run root integrity checks without rebuilding applications. The optional Tesla component is checked when its own source changes.

Root CI verifies affected components independently. Component workflows retained in subdirectories are migration history; GitHub runs workflows only from root `.github/workflows/`. Root action references are pinned to recorded commit SHAs. `.github/CODEOWNERS` assigns review ownership.

## Independent images and deployment

Use the **Publish component image** workflow to verify and publish one immutable image to `ghcr.io/vinodbalakumar/sharity-monorepo/<component>:<commit>`. This publishes an image; it does not restart a deployment.

```sh
npm run deploy:plan -- marketplace-service COMMIT_SHA
```

This writes an ignored image-selection file and prints build, pull, and rollout commands for that component only. Main Compose image variables support the selected immutable image. Private database credentials, TLS keys, and environment files belong to the deployment target and must be configured separately. Public `.env.example` presets are provided; local environment files and private keys are ignored.

Verified PowerShell rollout scripts remain under `deployments/scripts/sharity/`. Their workspace default resolves to this repository root. The legacy shell deployer validates the current monorepo checkout and never clones, resets, cleans, or deletes component directories.

The current public site continues running from the original workspace. This migration does not change its containers, databases, private configuration, tunnel, or routing.

## History and migration

All original repositories remain intact. This separate repository imports 300 source commits, including workspace architecture documents, with authors, dates, messages and merge history preserved. Paths were prefixed and historical credential literals were redacted in imported copies, so commit IDs differ. Original-to-imported mappings and source revisions are in [the migration record](docs/migration/README.md).

# Sharity shared deployment and verification tools

This is the versioned home of cross-component tooling. Application dependencies and application source stay in their component repositories. No npm dependencies are required for these shared tools; the OSV script uses built-in Node APIs.

Set `SHARITY_WORKSPACE_ROOT` to the directory containing `authorization-server`, `marketplace-service`, `payment-service`, `wallet-service`, `platform-web-bff`, `platform-ai-service`, `tesla-dashboard-services` and `sharity-app-ui`. The default is the workspace containing this `deployments` checkout. Shared documentation defaults to the workspace `docs/` folder. `outputs/` and `.deployment-private/` stay inside that workspace and must not be committed.

```powershell
$env:SHARITY_WORKSPACE_ROOT='C:/Users/HP/projects/springbootrestdemo'
./scripts/sharity/verify-production.ps1 -NativeExports -BrowserTests
./scripts/sharity/build-local-deployment.ps1
./scripts/sharity/apply-local-deployment.ps1
```

Run from the deployments repository. Read [the deployment guide](../../docs/local-ai-deployment.md) before any rollout. Build/test artifacts must exist first. Preparation/migration commands change local infrastructure; do not run them just to validate source. The existing local stack uses private `.env` files. Terraform, DNS, remote production rollout and native-store publishing are outside these scripts.

Old workspace `scripts/` files remain local compatibility copies. Prefer this directory for future edits and shared execution. Older one-off database/image seeding JavaScript and their root `package.json` are local legacy utilities, not part of this release; they are excluded because some contain hardcoded credentials. Do not upload them. Their AWS/MySQL dependencies are unrelated to the Expo application's own `package.json`.


## Catalog/UI integrity verification and rollout

Run `node scripts/sharity/audit-admin-ui.cjs` from this repository after starting the admin production preview on `127.0.0.1:8098`. The script uses the workspace Expo checkout's Playwright installation and browser-only network fixtures. It checks all 13 admin routes at 320 and 1440 pixels with downstream failures. Results go to workspace `outputs/quality-admin-audit.json`.

After Maven verification, Expo exports, the complete browser regression suite and admin audit pass, `./scripts/sharity/deploy-catalog-quality.ps1` packages the verified marketplace JAR and both verified web exports. It preserves rollback image tags, updates only the marketplace/storefront/admin containers, waits for health checks, reloads Nginx and checks a live listing image. It does not enable Tesla or live payments. Rollback details remain in the ignored workspace `outputs/` directory.

## Full reviewed core release

`verify-core-release.ps1` runs clean Maven verification for authorization, marketplace, payment, wallet and BFF with Java 21. Verify AI separately with `mvn clean verify` in its component. `deploy-reviewed-release.ps1` requires successful build logs, fresh backend artifacts, the exact browser-tested storefront bundle and a passing admin audit. It preserves all eight application images, builds the verified artifacts, updates the core/AI/storefront/admin containers and recreates the AI/diagnostic gateway with the BFF network namespace. It checks container health, admin HTML, Nginx configuration and Java TLS verification. Tesla and live payments remain disabled. Rollback image references are recorded only in ignored workspace outputs.

After rollout, run `node scripts/sharity/verify-catalog-quality.cjs` and `node scripts/sharity/verify-mac-ai.cjs` for real catalog/media and guest-chat checks. A provider-unavailable result is reported explicitly and does not certify generated answers. The Mac connection requirements and current limitations are documented in [the Mac operating guide](../../docs/MAC_OLLAMA.md).

## Authorized live login checks

`verify-authenticated-login.cjs` reads `LOGIN_TEST_EMAIL` and `LOGIN_TEST_PASSWORD` from environment variables. Supply only an account authorized for testing. Choose `SHARITY_LOGIN_BROWSER` (`chromium`, `firefox`, `webkit`) and `SHARITY_LOGIN_WIDTH`. It exercises real sign-in, protected profile API access, refresh, logout and expired-request recovery, without saving traces, credentials or token bodies. Diagnostic reports go to ignored workspace outputs; console warnings are retained separately from the functional authentication assertions. See the [login repair report](../../docs/releases/2026-10-26-login-repair.md) for browser coverage and limitations.

After clean authorization/BFF verification, `deploy-login-repair.ps1` preserves existing images and deploys those two verified artifacts, recreating their network companions and validating Nginx. It requires the current local deployment state and successful verification logs in workspace outputs.

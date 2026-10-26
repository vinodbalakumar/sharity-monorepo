# Sharity shared deployment and verification tools

This is the versioned home of cross-component tooling. Application dependencies and application source stay in their component repositories. No npm dependencies are required for these shared tools; the OSV script uses built-in Node APIs.

Set `SHARITY_WORKSPACE_ROOT` to the directory containing `authorization-server`, `marketplace-service`, `payment-service`, `wallet-service`, `platform-web-bff`, `platform-ai-service`, `tesla-dashboard-services` and `sharity-app-ui`. The default is a `springbootrestdemo` directory beside the deployments checkout. `outputs/` and `.deployment-private/` stay inside that workspace and must not be committed.

```powershell
$env:SHARITY_WORKSPACE_ROOT='C:/Users/HP/projects/springbootrestdemo'
./scripts/sharity/verify-production.ps1 -NativeExports -BrowserTests
./scripts/sharity/build-local-deployment.ps1
./scripts/sharity/apply-local-deployment.ps1
```

Run from the deployments repository. Read [the deployment guide](../../docs/local-ai-deployment.md) before any rollout. Build/test artifacts must exist first. Preparation/migration commands change local infrastructure; do not run them just to validate source. The existing local stack uses private `.env` files. Terraform, DNS, remote production rollout and native-store publishing are outside these scripts.

Old workspace `scripts/` files remain local compatibility copies. Prefer this directory for future edits and shared execution. Older one-off database/image seeding JavaScript and their root `package.json` are local legacy utilities, not part of this release; they are excluded because some contain hardcoded credentials. Do not upload them. Their AWS/MySQL dependencies are unrelated to the Expo application's own `package.json`.

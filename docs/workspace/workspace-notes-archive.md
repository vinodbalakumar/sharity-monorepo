Shared deployment and verification tools are versioned in the `deployments/scripts/sharity` directory. See `deployments/docs/sharity/WORKSPACE_LAYOUT.md` for repository ownership, generated outputs, local-only scripts and package files. Each component has independent ignore rules.

> Archived workspace notes. These notes describe a prior checkout and contain
> runtime-specific claims and generated-output links. Use the current
> [documentation index](../README.md) and workspace guides for setup and status.

## Storefront and guest navigation refresh (2026-10-26)

The Expo app uses one blue-and-white marketplace layout, shared React Native Paper controls, system fonts, public catalog browsing and product deep links. Signed-out account routes return to the landing page. Login success requires a verified BFF session; cancelling sign-in preserves the previous public screen. See [the storefront release record](outputs/storefront-deployment.md).

# Sharity development workspace

Sharity AI now has a `/chat` screen in the existing Expo app, approved public knowledge,
private SQL history and reviewed social JSON imports in `platform-ai-service`. Local Ollama/Qwen3
inference was exercised through real backend HTTP requests and a real browser/BFF/model integration test. See
[SHARITY_AI.md](SHARITY_AI.md) for the implementation report, setup and remaining deployment gates.
Core Sharity, AI and the Expo web export are deployed to the local `sharity-local` Docker
origin behind the existing public tunnel. Tesla stays disabled at the owner's request.
See [the deployment record](outputs/local-deployment-report.md) for current verification and limits.
The local CPU profile retains Qwen3 1.7B with concise responses and a longer keep-alive; see
[the latency investigation](outputs/chat-latency-report.md) for measured before/after results.

Development branch: `feature/sharity-production-responsive` (2026-10-25).

The UIs, backend services, AI service and deployments each have independent Git repositories. The
workspace groups these checkouts and local documentation. Changes
in a nested repository must be reviewed and committed in that repository. Shared
documentation is also maintained at `C:/Users/HP/projects/springbootrestdemo/docs`.

## Architecture

- `sharity-app-ui`: Expo / React Native / web storefront, shared design components,
  catalog search, product discovery, account and commerce screens.
- `platform-web-bff`: browser sessions, server-held OAuth tokens, CSRF and API proxying.
- `authorization-server`: identity, JWTs, roles, provider eligibility and onboarding.
- `marketplace-service`: catalog, listings, orders and commerce policies.
- `payment-service`: provider integrations, payment state, refunds and payment events.
- `wallet-service`: ledger projection and idempotent payment-event ingestion.
- `tesla-dashboard-services`: authenticated Tesla Fleet integrations; locally disabled by request.
- `platform-ai-service`: Spring AI chat, approved public knowledge, SQL history and incident triage;
  isolated from checkout, payment, identity and wallet state.

All Java modules target Java 21 and locally verified Spring Boot 4.0.9. See each POM for the exact Spring Boot patch and
each service README for database/environment requirements.

## Verification

Run from this workspace on Windows:

```powershell
./deployments/scripts/sharity/verify-production.ps1 -NativeExports -BrowserTests
```

The script fails on the first failed check, including dependency advisories. A
successful compile or export alone is not production sign-off.

For individual UI checks:

```powershell
cd sharity-app-ui
npm ci
npm run typecheck
npm run lint
npm run check:expo
npm run build:web
npm run build:e2e
npx playwright install chromium firefox webkit
npm run test:e2e
npm run export:android
npm run export:ios
npm audit --audit-level=moderate
```

Finish the web export before starting Playwright. Do not rebuild `dist` while the
suite is running. Playwright serves the real export with mocked API contracts;
it does not validate live OAuth, database migrations or payment providers.

After successful Maven tests, inventory and scan resolved backend dependencies:

```powershell
python deployments/scripts/sharity/extract-maven-dependencies.py
node deployments/scripts/sharity/scan-maven-osv.mjs
```

The inventory includes runtime and test classpaths. The JSON report in
`outputs/backend-osv-audit.json` records incomplete checks and advisory IDs.
Findings require applicability review; a failed or incomplete scan blocks a
claim of zero known vulnerabilities.

## Release requirements

Use the current verification report in `outputs/production-verification.md` and
the shared documentation's dated readiness review. Release remains conditional
on clean dependency gates, deployed OAuth/session validation, real payment-provider
webhook and settlement checks, staging migrations, load tests, backup/restore
evidence and native-device QA. No deployment is performed by this change.
# Current operations and commerce work

The approved follow-up adds cross-service request diagnostics, background Spring AI triage, an administrator operations screen, a classic marketplace theme and backend-driven cart/purchase/catalog routes. Start with the current [operations guide](operations.md) for setup, safety boundaries and remaining functionality. This work does **not** certify a complete production marketplace: live checkout is disabled by default, and demo checkout is explicitly labelled.


Deployment files: `deployments/`. Admin UI: `sharity-admin-portal/`. Shared documentation: `docs/`. The former paths are compatibility junctions for existing local integrations. See [workspace layout](deployments/docs/sharity/WORKSPACE_LAYOUT.md).

# Deployment and operations

## Deployment ownership

`deployments/` contains Docker Compose definitions, Dockerfiles, Nginx routing,
environment-specific Spring properties, helper scripts, image plans and
deployment runbooks. The active GitHub Actions workflow definitions for this
monorepo are under root `.github/workflows/`. Publishing a component image
does not deploy or restart a running stack.

Start at [`deployments/README.md`](../../deployments/README.md) and the
[deployment runbook](../../deployments/docs/deployment.md). Environment-specific
details are in `deployments/docs/`; the `sharity/` guides include AI, commerce,
QA, and release context.

## Compose topologies

| File | Intended use |
| --- | --- |
| `deployments/docker-compose.yml` | Base stack; contains legacy local/host assumptions and must be reviewed with a suitable overlay and private configuration |
| `deployments/docker-compose.local.yml` | Local overrides, including externally supplied database credentials |
| `deployments/docker-compose.ai.yml` | Optional AI/diagnostics services and private AI settings |
| `deployments/docker-compose.qa.yml` | Generic QA stack using an externally provided database endpoint |
| `deployments/docker-compose.windows.yml`, `docker-compose.mac.yml`, `docker-compose.linux.yml` | QA host variants; use the shared QA database topology rather than creating independent databases |
| `deployments/docker-compose.prod.yml` | Production-oriented image deployment template; inject its required values securely |
| `deployments/docker-compose.simple.yml` | Simplified image-based deployment template |

Do not run a Compose file simply because it is named `local` or `prod`. Inspect
its required variables, mounted files, profiles, image tags, ports and database
targets first. The base Compose file contains local fallback values and
workstation assumptions; it is not a portable or secure production preset.
Private overlays and runtime credentials are intentionally absent from the
repository. Use `docker compose config` with the actual deployment environment
to review the resolved configuration before applying it.

## Routes and health

Nginx listens on container port `8080`. Its active configuration routes the
customer app (`/app/`), admin portal (`/sharity-admin/`), browser BFF (`/bff/`),
authorization server (`/authorization-server/api/`), marketplace
(`/marketplace-service/`), payments (`/payment-service/`) and wallet
(`/wallet-service/`). Direct host ports and enabled services vary by Compose
variant. The chat UI is routed at `/chat`. The AI service is optional; the AI
overlay uses a private network arrangement and does not publish an AI port
publicly. Tesla services are behind the `disabled-tesla` Compose profile and
are not enabled by default.

Use the healthcheck in the selected Compose file as the source of truth. In
this repository, authorization, payment, BFF and AI expose Actuator health;
marketplace and wallet also provide internal health routes used by deployment
templates. A healthy process is not proof that external authentication,
database migrations, provider credentials, or user journeys are healthy.

Useful read-only checks from the deployment directory:

```powershell
docker compose ps
docker compose logs --tail 200 authorization-server
docker compose logs --tail 200 marketplace-service
docker compose config
```

The precise Compose file list and environment loading must match the running
stack. Avoid commands that replace all images or volumes when diagnosing an
individual component; prefer a reviewed component-specific rollout and preserve
a rollback image as described in the deployment scripts.

## Local storefront troubleshooting

- **Sign-in routing:** the local BFF was restarted and the actual Sign in form
  opened using authorization on `localhost:9093`, BFF callback on `localhost:9090`
  and frontend on `localhost:9174/app/`. This verifies local routing, not a
  completed authenticated session or a production rollout. `/bff/login?force=true`
  propagates as OAuth `prompt=login`; configured public destinations, not a
  browser-supplied `Origin`, control production routing. See the
  [BFF local-run guide](../../platform-web-bff/README.md#local-run).
- **Registration-options 403 without ACAO:** standalone authorization previously
  fell back to the old Java CORS origin `http://localhost:3000` when external
  local configuration was absent. Its bundled local-profile default now allows
  `http://localhost:9173,http://localhost:9174` through `app.web.allowed-origin`
  (`SHARITY_WEB_ALLOWED_ORIGIN` overrides it). Restart authorization to load the
  correction. Do not solve this by opening shared/production CORS or adding a
  wildcard; see [configuration](configuration.md#standalone-local-browser-authentication).
  After the user restarted authorization, live credentialed registration-options
  requests from the configured UI origin returned 200, an untrusted origin
  returned 403, and an actual Chromium fetch returned 200. These are local
  checks, not a production rollout or completed registration.
- **Missing catalog images:** listing `imageUrl` points directly to public
  storage/CDN. Check that public URL's reachability before investigating the
  retained legacy listing-image endpoint; the UI no longer uses that endpoint
  for ordinary catalog image delivery.
- **Icons fail to load:** `IconFontGate` blocks app mounting until Ionicons and
  MaterialCommunityIcons load. The visible error offers Retry, which reloads
  the page on web; do not hide the failure.

## Release and data safeguards

- Provider adapters or API routes do not by themselves establish production
  payment readiness. Keep the demo/simulated purchase switch off for real
  money. Review payment-service documentation for provider approval, verified
  webhooks, idempotency, settlement and refund requirements.
- Do not enable a database migration against shared or production data until
  pending SQL is reviewed and a restorable backup exists. Authorization,
  marketplace, payment and wallet include demo seed/reset migrations.
- Keep JWT private keys, internal/chat/diagnostics tokens, OAuth credentials,
  payment-provider secrets and database passwords out of source, images,
  frontend build arguments and logs.
- Use TLS and trusted certificate validation for cross-host service calls.
  Do not expose internal health/diagnostics endpoints or model providers
  directly to the public internet.
- Treat date-stamped deployment and verification documents as evidence for
  their specific run only. Confirm current container image digests, database
  state, environment and external routing before declaring a rollout successful.

For authorization schema/vendor startup rules, see the
[database runbook](../../authorization-server/docs/database-operations.md).
For current AI and commerce constraints, see
[`deployments/docs/sharity/OPERATIONS.md`](../../deployments/docs/sharity/OPERATIONS.md)
and [`deployments/docs/sharity/SHARITY_AI.md`](../../deployments/docs/sharity/SHARITY_AI.md).

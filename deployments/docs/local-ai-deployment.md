# Local Docker deployment with Sharity AI

The Windows `sharity-local` stack is the origin used by the existing Cloudflare tunnel for
`vinodbalakumar.com`. Updating this stack changes that public site's origin. No DNS change is needed.
The IONOS workflow files are deployment plans, not a configured remote deployment mechanism.

## Release workflow

The versioned scripts under `scripts/sharity/` in this deployments repository provide the following commands. Set `SHARITY_WORKSPACE_ROOT` to the component workspace before running them:

1. `prepare-local-deployment.ps1`: restricted local backups, existing-image rollback tags,
   a dedicated MySQL AI database and a private runtime account.
2. `prepare-diagnostics-tls.ps1`: private diagnostic TLS identity and a Java trust store that
   retains the public CA roots from the deployed Temurin image.
3. `build-local-deployment.ps1`: packages current, previously verified Maven JARs and the
   verified Expo `dist-e2e` export into timestamped local release images. It refuses stale JARs.
4. `apply-local-deployment.ps1`: validates Compose, replaces services sequentially, checks health,
   verifies Java TLS trust/hostname validation, and reloads Nginx. A failed existing service
   is restored to its previous image. Additive database changes are not automatically reversed.

Build/test source changes before running these scripts. The deployment does not substitute a
remote Git branch for local edits, publish mobile apps, or silently provision a remote inference host.
The rollout result and backup location are recorded in workspace `outputs/local-deployment-*.json`.
Database dumps and container inspection snapshots include private data and stay in the restricted,
gitignored workspace `.deployment-private/` directory. Never upload that directory.

## Configuration

The existing `.env` and `.env.backend-local.properties` remain in use. New `.env.ai.local` is
gitignored and restricted to the current Windows user and SYSTEM. It contains the private chat
channel/diagnostic tokens, AI database credentials, release identifier and TLS folder path.
Do not copy its values into frontend environment variables.

Use all three Compose files and all three private environment files:

```powershell
docker compose -p sharity-local --env-file .env --env-file .env.backend-local.properties --env-file .env.ai.local -f docker-compose.yml -f docker-compose.local.yml -f docker-compose.ai.yml ps
```

The deployment script selects the six core Java services (identity, marketplace, payments,
wallet, BFF and AI), the web app and diagnostic gateway. Tesla's backend and frontend stay
disabled at the owner's request; their Compose profiles are not enabled.
The existing admin portal continues running. Its source is not part of these marketplace/AI changes.

## Private connectivity

The AI service and the diagnostic TLS gateway share the BFF's network namespace. The BFF calls
AI over `127.0.0.1:8086`, preserving its restriction against non-loopback HTTP backends. No AI or
Ollama host ports are published. Ollama stays on Windows loopback port 11434; Docker Desktop's
`host.docker.internal` access was verified before deployment.

Other services publish bounded diagnostic metadata to
`https://platform-web-bff:8443/internal/diagnostics/events`. The private gateway terminates TLS,
forwards to AI on loopback, and exposes no other API. Java publishers validate the certificate and
hostname using the mounted trust store. No permissive TLS flags or HTTP exceptions are used.
The gateway is reachable only within the Docker network; the public edge does not route port 8443.

The generated server certificate lasts 365 days. Renew it and rebuild/update the corresponding
trust store before expiration, then restart the publishing services/gateway. The private key is
mounted only into the TLS gateway. Publisher containers receive only the public trust store
and a read-only TLS probe class.

## Application behavior

`/chat` serves the existing Expo export. `/bff/ai/*` retains CSRF protection and has a 100-second
proxy read timeout for bounded CPU inference. Existing application, OAuth callback, marketplace,
wallet/payment and admin routes are preserved. Public founder email remains disabled.
Real-money checkout and demo purchase simulation remain disabled by default.

The six deployed Java services deliver diagnostic metadata. Central advisory AI analysis is enabled;
its queue is bounded, explanations are unverified suggestions, and no automated business actions
are registered. CPU inference can be slow under load. Ollama must remain available on this
Windows origin; this is not an independently hosted production inference cluster.

The local model uses four inference threads, batch size 128 and a 2048-token context.
`CHAT_MAX_CONCURRENT_GENERATIONS=2` accepts two simultaneous model requests; the provider may
queue actual inference on this CPU. Structured factual answers bypass the model limit.
Per-owner rate limits and bounded overload protection remain enabled. Ollama keeps the model
loaded for fifteen idle minutes to reduce repeated loading delays. The local CPU deployment retains
`qwen3:1.7b`; a smaller model was briefly deployed and reverted after code-quality checks. The gateway is outside the
chat request path; history/model/storage durations are logged separately for future investigation.
Programming questions omit unrelated public project passages and retain at most two relevant
history messages. AI-service incidents and BFF chat incidents retain factual measurements but
do not queue additional model analysis, avoiding recursive inference contention.
Legacy marketplace slow-query SQL/parameter logging is disabled in this deployment.

## Verification and rollback

Run `node tests/deployed-chat-smoke.cjs https://vinodbalakumar.com` from the Expo repository
after rollout. It uses the real deployed services to check chat, local-model output, SQL history,
CSRF, mobile layout/theme, public catalog, protected admin access and OAuth start routing.
It creates and deletes a temporary guest conversation, never an order or payment.
The workspace `outputs/deployed-chat-verification.json` records its actual result.

Rollback images and a database snapshot are preserved for the release. Before restoring an old
BFF, stop its shared-network AI and diagnostic gateway. Restore the prior image mappings and
the saved Nginx configuration, using the original two Compose files. Never restore a database
dump over current data without reviewing new writes and agreeing on a recovery point.
Known Expo dependency advisories and broader marketplace/device/provider verification gaps
remain documented in workspace `SHARITY_AI.md`; deployment is not certification of full readiness.

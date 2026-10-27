## Current deployment (2026-10-26)

The active deployment uses Mac-hosted Ollama `qwen3:8b`. Provider tuning, environment profiles, Dockerfiles and Nginx files are owned by the sibling `deployments` repository. See [the current Mac operating guide](../deployments/docs/MAC_OLLAMA.md) and `deployments/config/ai/application.properties`. No Windows Ollama, GPU override or automatic model pull is required. Approved founder facts and current public product facts supply bounded retrieval context; private commerce data is excluded. Earlier CPU deployment notes below are historical.

## Sharity AI chat (2026-10-25)

This existing service now owns public chat, approved founder knowledge, social JSON import/review,
and SQL conversation history. Local Qwen3 1.7B is installed and real Spring AI HTTP answers were tested.
The public UI route is `/chat`; routing and the AI container are deployed to the local Docker
origin behind the existing public tunnel. Tesla remains disabled. See the workspace
`outputs/local-deployment-report.md` for current verification and deployment limits.
Read [the operating guide](https://github.com/vinodbalakumar/deployments/blob/feature/sharity-production-responsive/docs/sharity/SHARITY_AI.md) for setup, endpoint contracts, privacy and deployment gates.
Use the external `deployments/config/ai/` profile for inference; set the same private `CHAT_BFF_TOKEN`
in this service and the BFF. No real social posts were imported. Official social sync and SSE remain unimplemented.

## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

Internal ingestion: `POST /internal/diagnostics/events` with the shared secret. Admin reads: `GET /api/v1/admin/diagnostics` with an administrator JWT. Enable `DIAGNOSTICS_AI_ENABLED` only after provisioning the configured Ollama model. The bounded recent-incident cache resets on restart; retain production telemetry externally.

AI-service incidents and BFF `/bff/ai/chat` incidents retain measured timings/errors but skip
additional model analysis, preventing recursive inference contention. The local deployment
uses a private TLS gateway with Java certificate and hostname verification for diagnostic delivery.

Chat accepts two concurrent model generations by default (`CHAT_MAX_CONCURRENT_GENERATIONS=2`,
valid range 1–8). Approved structured answers bypass model capacity. Per-owner request limits
and overload protection remain enabled; configure higher capacity only after measuring provider
throughput. The local CPU deployment retains `qwen3:1.7b` and keeps it loaded for fifteen idle
minutes to reduce loading delays. A smaller-model experiment was reverted after code-quality checks.
Chat completion logs include `historyMs`, `modelMs` and `storageMs` without prompts or answers.

Chat answers now return `messageId` and `metrics`: server request/answer timestamps, elapsed
milliseconds and provider-reported input/output/total tokens. The additive `ai_message_metrics`
table persists these details per assistant answer; conversation reads include them. Missing
provider usage stays null, approved structured answers use zero tokens, and old messages retain
null metadata. The migration script backs up the AI database before creating the table. The
existing runtime account retains data-only privileges; schema application uses the admin account.

See workspace `OPERATIONS.md` and `outputs/operations-verification.md` for current setup, evidence and release limitations. Earlier readiness statements below are historical.

# Platform AI Service

Optional Spring Boot / Java 21 service using Spring AI 2.0.2 and an Ollama model.
The exact Boot patch is managed by `pom.xml`. This service is independently
deployable and is not a prerequisite for any existing commerce service.

## Behavior

`POST /api/v1/ai/listing-draft` accepts a JSON object with `title` (1-160 characters)
and `details` (1-2000 characters). It returns `{ "draft": "...", "reviewRequired": true }`.
The seller must review the draft; the endpoint never publishes a listing.

- Valid JWT with configured issuer/audience is required.
- Allowed roles: PROVIDER, SELLER, ADMIN, SUPER_ADMIN.
- AI is disabled by default; authorized calls receive 503 until enabled/configured.
- Two concurrent generations per instance; excess calls receive 429.
- Provider failures and empty/oversized output become a sanitized 503.
- No tools, database connections, payment operations or conversation persistence.
- Only health endpoints are public. All other unmatched endpoints are denied.
- This prototype is not yet connected to the Sharity BFF or seller UI.

## Configuration

| Variable | Default / requirement |
| --- | --- |
| `AI_SERVICE_PORT` | `8086` |
| `AI_ENABLED` | `false`; use `true` only after model and security validation |
| `AI_CHAT_PROVIDER` | `none`; set `ollama` to configure the chat model |
| `OLLAMA_BASE_URL` | Mac endpoint from external deployment profile |
| `OLLAMA_CHAT_MODEL` | `qwen3:8b` in the external profile; no automatic download |
| `AI_JWK_SET_URI` | Authorization-server JWKS URL |
| `JWT_ISSUER` | Must exactly match the issuer in Sharity access tokens |
| `JWT_AUDIENCE` | `auth-clients`; match the intended API audience |

No model download occurs at application startup. Do not put provider secrets or
personal/payment data in request content. The default server configuration hides
exception messages and stack traces from HTTP error responses.

```powershell
mvn -B -ntp verify
mvn spring-boot:run
```

Tests use a fake model and do not contact Ollama. Live generation, output-quality
evaluation, deployment timeouts, distributed per-user quotas, BFF routing and
seller UI integration remain rollout gates. Keep the service disabled until
those gates and its dependency scan pass. Existing services do not need AI
dependencies to use an isolated AI API later.

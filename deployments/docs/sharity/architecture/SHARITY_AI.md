# Sharity AI implementation and operating guide

Review date: 2026-10-25. Branch: `feature/sharity-production-responsive`.
Source changes remain local and uncommitted. Core Sharity, AI and the Expo web export are
deployed to the local Docker origin behind the existing public tunnel. Tesla remains disabled
at the owner's request. See [the deployment record](../production/LOCAL_CORE_AI_DEPLOYMENT.md) for current checks and limits.

## 1. Architecture

Response details: new answers show device round-trip time and a **Message info** panel with
send/receive timestamps, persisted server timing and actual provider input/output/total tokens.
**Chat info** totals the current conversation's recorded token usage, counting repeated context
each time it is sent. Structured answers use zero model tokens; unknown/older usage is explicitly
unavailable. Device timing belongs to the current page session; server timing and tokens persist
in the additive `ai_message_metrics` table and remain subject to conversation ownership/deletion.

The existing Expo / React Native Web app serves `/chat`. The existing `platform-web-bff`
owns browser sessions, CSRF validation and native bearer authentication. Its narrow `/bff/ai/*`
proxy establishes an identity and calls the existing `platform-ai-service` over a private,
shared-secret channel. The AI service uses Spring AI 2.0.2, Spring Boot 4.0.9 and Java 21.
No additional microservice or frontend framework was introduced.

Critical founder and marketplace-status questions use approved structured answers. Other
explanations and programming questions use Spring AI → Ollama → Qwen3, with up to
three public passages and four truncated previous messages. Pure programming questions omit
unrelated project passages and retain at most two relevant previous messages. No embeddings or vector server
are required for this small knowledge base. No tools or autonomous actions are registered.
Existing listing-draft assistance and diagnostic analysis remain separate opt-in features.

Chat accepts two concurrent model requests by default (`CHAT_MAX_CONCURRENT_GENERATIONS=2`,
valid range 1–8). Approved structured answers bypass model capacity. Independent conversations
retain separate ownership; per-owner rate limits and bounded overload protection remain enabled.
The local CPU provider may queue actual inference, so simultaneous requests can take longer.
The local CPU deployment retains `qwen3:1.7b` and keeps it loaded for fifteen idle minutes.
A smaller model was briefly deployed, then reverted when follow-up checks found incorrect code.
Chat logs record separate history, model and storage
durations without prompts or answers. See [the latency investigation](../production/CHAT_LATENCY_INVESTIGATION.md) for measured results.

## 2–3. Source changes

New AI source is under `platform-ai-service/src/main/java/com/java/vinod/platform/ai/chat/`:

- `ChatChannelSecurity`, `ChatIdentity`, `ChatPayloadLimit`: trusted BFF identity, body bounds and access control.
- `PublicKnowledge`: approved JSON loading, critical facts, small lexical retrieval and public profile.
- `FounderContent`, `FounderAdminController`: validated imports, deduplication, approval, revocation and deletion.
- `ConversationStore`: SQL persistence, ownership, saved state, bounded history and guest expiration.
- `SharityChatService`, `SharityChatController`: throttled, bounded generation, history and source references.
- `FutureChatTool`: unregistered extension contract; it executes nothing.

New resources: `knowledge/public.json`, `chat-schema.sql`, `application-chat-local.properties`.
New tests: `SharityChatRuntimeTest`, `LocalOllamaChatTest`, `ConversationPersistenceTest`.
Existing `AiSecurityConfig`, `AiSecurityTest`, POM, application properties and README were extended.

BFF adds `AiChatBffController`, its transport/identity tests and native authentication tests.
Existing `SecurityConfig`, access-token filter and controller tests now cover public chat CSRF,
native bearer validation and issuer/audience checks. Ordinary commerce proxy paths are retained.

Frontend adds `features/chat/` (screen, safe Markdown/code rendering, founder review panel),
`services/sharityAiApi.ts`, `tests/e2e/chat.spec.ts` and `tests/inspect-chat.cjs`.
`tests/live-chat-smoke.cjs` is the opt-in real local browser harness, launched by BFF `LocalChatBrowserTest`.
App routes, navigation types, marketplace links and session helpers were extended.
`expo-clipboard` supplies web/native clipboard support. No generated code is executed.
Deployment preparation: AI Dockerfile, `deploy/chat.nginx.conf`, root
`scripts/start-sharity-chat.ps1`, and updated `operations.env.example`.

## 4. Spring AI settings

Defaults: Qwen3 1.7B, CPU (`num-gpu=0`), context 2048 tokens, thinking disabled,
temperature 0.2, maximum output 256 tokens, keep-alive one minute. Chat accepts 1–1500
characters. One chat request generates at a time per AI-service instance; excess returns 429.
Guest limit: six chat requests/minute; authenticated limit: fifteen/minute. The BFF also
limits requests per connection address; configure trusted proxy/edge rate limiting for production.
Limits are per process, not a distributed Redis quota. Model output remains fallible.

`AI_ENABLED` and `AI_CHAT_PROVIDER` default to disabled/none. The `chat-local` profile enables
Ollama. Exact structured facts remain available without a model when the private BFF channel
is configured. Ollama failures affect generated answers, not the marketplace service.
Spring AI retries are disabled beyond the first attempt. AI transport timeout is 90s,
BFF read timeout 95s, UI timeout 100s. Prompt/completion observation logging is off;
production must leave framework HTTP debug/trace logging disabled and `DEBUG` unset/false.

## 5–6. Ollama installation and model verification

Ollama 0.40.11 was installed with the official `Ollama.Ollama` Windows package via winget;
winget verified the installer hash. `qwen3:1.7b` downloaded successfully (model ID
`8f68893c685c`, about 1.4 GB on disk). The runtime check reported 100% CPU, 2048 context,
and about 1.6 GB model working memory while loaded. A loopback server was started with
one parallel request, one loaded model and a two-request queue. It may remain running locally;
its one-minute model keep-alive frees the loaded model after inactivity.

Actual Spring AI HTTP smoke answers are recorded in
`outputs/sharity-ai-real-model-smoke.txt`, with generation `OLLAMA` and measured durations.
These were real local responses, including a Java reverse-string program, dependency
injection explanation, REST controller and microservice explanation. The first measured
run was roughly 30s cold and 8–10s for subsequent short answers; timings vary with load.
The generated examples are displayed as text and were not automatically executed.

Official references: [Ollama Windows](https://docs.ollama.com/windows),
[Spring AI Ollama](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html).

## 7. Founder knowledge and privacy

The founder supplied and approved the name Vinod Balakumar, full professional name
Vinod Balakumar Panchaparvala, role Principal Full Stack Engineer, official website,
LinkedIn URL and Instagram `vinod_balakumar` URL. The private email is kept in server-side
configuration and is absent from public knowledge, public profile and model context by default.
Only set `FOUNDER_PUBLIC_EMAIL_APPROVED=true` after explicit approval for public contact use.
No employment history, education, certificates, career dates or achievements were invented.
The repository validates project technologies; it does not prove a personal employment history.

Only `PUBLIC` + approved knowledge is retrieved. Private project documents and account records
are never loaded into the public knowledge collection. A prompt cannot grant permissions or
make INTERNAL/RESTRICTED content retrievable. Profile contact facts use structured lookup.
Knowledge records preserve source title/URL, update date, visibility, approval and content.

## 8–10. Social integrations and actual imports

LinkedIn's public page was inspected without login or cookies. It exposed limited profile
and activity material. No employment details or posts from that page were automatically approved
or imported. Instagram could not be fetched. No social posts were imported into the development
knowledge store. Test-only posts exist only in isolated test databases/fixtures.

Both platforms support the same functioning **manual authorized JSON import** workflow.
The secured admin review panel is available from the Sharity AI sidebar for an administrator.
Import up to 20 founder-supplied records per request; each preserves platform, post ID,
UTC publication date, content, original HTTPS platform URL, import time, visibility and approval.
The administrator must confirm founder authorship, rights and visibility. Imports start INTERNAL/PENDING.
Approval makes a post public, rejection/revocation removes it from retrieval, and deletion removes
the stored post. Reimporting the same platform/post ID updates it and resets approval.
Approved feed results are attributed source statements, not independently verified personal facts.

Official API adapters and scheduled 24-hour provider sync are **not implemented** in this release.
No provider credentials, approved LinkedIn member-read access or Instagram account permissions
were supplied. Status reports manual-import-only, never a successful API sync. Do not add generic
web scraping as a fallback. LinkedIn member post reading requires approved restricted access;
see the [official Posts API permissions](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api).
The [Instagram Platform documentation](https://developers.facebook.com/docs/instagram-platform/)
must be checked when authorized account access is provisioned; account eligibility was not verified.
Native ZIP exports and arbitrary CSV formats require conversion to the documented JSON schema.

Example shape (placeholder only; not imported as a real founder post):

```json
{"posts":[{"platform":"INSTAGRAM","postId":"actual-post-id","publishedAt":"2026-10-24T12:00:00Z","content":"Actual founder-supplied caption","originalUrl":"https://www.instagram.com/p/actual-post-id/"}]}
```

## 11. Retrieval and history behavior

Retrieval ranks concise public passages by lexical overlap with a founder/feed priority and
returns at most three passages. Critical identity and current feature-status questions bypass
probabilistic generation. Feed retrieval reads approved database rows on every request;
reindex acknowledges this current state rather than pretending a vector index exists.

Conversations persist in SQL with user/assistant messages, title, timestamps, saved state,
source references and delete support. Signed-in ownership is a server-derived SHA-256 digest
of the validated issuer and subject. Guest ownership is a random identifier stored in the BFF
HTTP session; JSON and browser identity headers cannot override it. Guest histories are separate
from signed-in histories and are not automatically merged at login. Guests are limited to ten
conversations, signed-in users fifty, and each conversation forty completed turns. Context
sent to Qwen includes only the last four messages, each truncated to 350 characters.

Guest history expires after 24 hours; cleanup occurs on history access. Saved guest chats still
expire. Revoked social content is excluded from **future** retrieval; historical answers may
still contain the earlier excerpt until those conversations are deleted. Backups require their
own retention policy. Stop waiting cancels the browser request; the server/model may complete
and save the answer, so the UI explicitly advises checking history.

## 12. REST APIs

Browser/native chat routes, all through the BFF:

| Method | Browser route | Behavior |
|---|---|---|
| POST | `/bff/ai/chat` | `{conversationId:null,message}` → answer, sources, generation and conversationId |
| GET | `/bff/ai/conversations` | Current verified owner's summaries |
| GET | `/bff/ai/conversations/{id}` | Owned messages; other owners get 404 |
| DELETE | `/bff/ai/conversations/{id}` | Delete owned conversation |
| PATCH | `/bff/ai/conversations/{id}` | `{saved:true/false}` |
| GET | `/bff/ai/founder/profile` | Approved public founder profile |
| GET | `/bff/ai/founder/feed` | Approved imported posts or NO_APPROVED_POSTS |

Browser mutations require the CSRF token returned by `/bff/session`. Authenticated native
requests send their access token; the BFF validates signature, expiration, issuer and audience.
The BFF overwrites channel identity and never forwards user-supplied private headers.
Response caching is disabled. Public BFF payloads are bounded at 8KB, private AI channel at
64KB, and authenticated AI/admin JSON at 128KB. Do not expose the AI service directly.

The service also exposes authenticated logical `/api/ai/*` endpoints, and private
`/internal/chat/*` endpoints requiring the 32+ character `CHAT_BFF_TOKEN` plus trusted identity.
The latter is not a public API or admin channel.

Administrator routes use the existing authenticated BFF proxy prefix
`/bff/api/platform-ai-service/api/ai/admin/founder`:
GET `/posts`, GET `/status`, POST `/import`, POST `/posts/{id}/review`
(`APPROVED`, `REJECTED`, `REVOKED`), DELETE `/posts/{id}`, POST `/reindex`.
The AI service independently requires ADMIN or SUPER_ADMIN JWT roles. Mutations log hashed
actor/action metadata, never imported caption text or tokens. Prompt/model errors are sanitized.

## 13–14. UI and routing

The screen includes a desktop sidebar, mobile menu, new chat, conversation search, recent/saved
history, settings, session indicator, light/dark themes, suggested questions, rounded composer,
response copying, highlighted fenced code with code copying, regenerate, stop waiting,
source links and safe failure messages. Founder facts include approved official profile links.
The Markdown renderer supports text, headings, emphasis, HTTPS links, inline code and fenced
code; full CommonMark tables/nested list rendering is not implemented. SSE/token streaming
is not implemented; responses arrive as bounded complete answers. No fake posts/media/metrics.

Direct `/chat` and refresh resolve through the existing app router and static history fallback.
Existing `/app/*`, `/bff/*`, OAuth callbacks and admin paths are retained. The inspected deployment
is `C:/Users/HP/projects/deployments/nginx/nginx.conf`, which currently routes `/app/` to the
Expo static container. That container already has an index fallback. The prepared snippet
`platform-ai-service/deploy/chat.nginx.conf` maps exact `/chat` to that existing frontend and
gives `/bff/ai/` an appropriate inference timeout. It has **not** been applied or syntax-tested
with the deployed Nginx image. No DNS, Cloudflare or production routing changes were made.

## 15. Verification evidence

See the final `outputs/sharity-ai-verification.md` for current exit codes and test counts.
AI runtime tests cover founder questions, honest unavailable feed, feature status, history
ownership/save/delete, guest expiration, spoofed headers, payload limits, validation, throttling,
model-disabled fallback, public knowledge isolation and social approval/reimport/revocation.
The file-database test reopens authenticated history through a fresh data source.
The opt-in real model test sends actual HTTP requests to a Spring Boot server using Ollama.
The opt-in BFF `LocalChatBrowserTest` additionally launches a real browser against the exported
Expo UI, real BFF sessions/CSRF and real AI service/Ollama: founder answer, generated Java,
save, refresh, reload history and delete passed. Its temporary local gateway is only a test harness.
BFF tests cover CSRF, verified guest/user identity, route allowlisting, missing-secret denial
and native bearer behavior. UI tests use controlled API fixtures; they do not claim live OAuth,
provider payments or real social synchronization. Browser tests target Chromium, Firefox and
WebKit plus widths 320–1440px, direct route/refresh, themes, history, copying and failure states.

## 16. Local setup

Use Java 21, Maven, the existing UI Node/Expo toolchain, and the official Ollama installation.
Do not start the entire Docker microservice stack alongside inference on an 8GB laptop unless
memory measurements show sufficient capacity. The default AI database is a file-backed H2
database under `platform-ai-service/data/` (gitignored); H2 console is not enabled.

In the Ollama terminal (skip `serve` if the installed background app already owns port 11434):

```powershell
$env:OLLAMA_HOST='127.0.0.1:11434'
$env:OLLAMA_NUM_PARALLEL='1'
$env:OLLAMA_MAX_LOADED_MODELS='1'
$env:OLLAMA_MAX_QUEUE='2'
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" serve
# In another terminal:
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull qwen3:1.7b
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" list
```

Generate a random private secret and set the same `CHAT_BFF_TOKEN` in the AI and BFF terminals.
Never put it in `EXPO_PUBLIC_*`, browser storage or Git. In the workspace AI terminal:

```powershell
$env:DEBUG='false'
$env:CHAT_BFF_TOKEN='<same-random-secret-at-least-32-characters>'
.\scripts\start-sharity-chat.ps1
```

Run the existing BFF with its normal local database/OAuth configuration, plus that same secret
and `app.backends.ai-service=http://localhost:8086` (already its default). Its local port is 9090.
Use the existing local reverse proxy or configure the UI's `EXPO_PUBLIC_BFF_BASE_URL` to
`http://localhost:9090/bff` before `npm run web`. On native devices, use a trusted reachable
HTTPS BFF origin; device localhost is the device itself. The BFF calls laptop Ollama only through
the AI service, never through the browser. For native app navigation, use the Sharity AI
marketplace links; native package/device authentication was not live-validated.

Run checks:

```powershell
# platform-ai-service: real model smoke is opt-in and requires Ollama/model.
$env:RUN_LOCAL_OLLAMA_TESTS='true'
mvn -B -ntp verify
# platform-web-bff:
mvn -B -ntp verify
# sharity-app-ui:
npm run typecheck
npm run lint
npm run build:e2e
npx playwright test tests/e2e/chat.spec.ts
```

For the opt-in real browser test, start the AI service on loopback port 18086 with an isolated
temporary database and the test-only channel token declared in `LocalChatBrowserTest`, then set
`RUN_LOCAL_CHAT_BROWSER_TESTS=true` for BFF `mvn verify`. It starts a random-port test BFF and
the gateway on port 18097, uses real Ollama, and closes the gateway/browser afterwards. Stop
the temporary AI process before rebuilding its JAR on Windows, where an open JAR can be locked.
Never use this test token or temporary gateway in production.

## 17. Production requirements

Provision an approved continuously available inference host on a private network, with measured
CPU/RAM and concurrency limits. Laptop Ollama is not assumed reachable by the public server.
Configure the AI service's `OLLAMA_BASE_URL` for that private host. Do not expose port 11434.
Give the BFF a private HTTPS AI-service endpoint; this implementation rejects non-loopback HTTP
backend URLs. Terminate TLS on the private service proxy if the app container uses HTTP internally.

Use a dedicated MySQL database/user, backups, encrypted disks and explicit retention policy.
Review and apply `chat-schema.sql` to that database before deployment; set `AI_DATABASE_URL`,
`AI_DATABASE_USERNAME`, `AI_DATABASE_PASSWORD` and `AI_DATABASE_INIT=never`. The SQL file is
prepared for review; only H2 execution has been tested here, not a production MySQL migration.
Do not use the embedded development database for a multi-instance production deployment.
Set matching BFF/AI channel secrets through server secret management. Configure actual JWT
issuer, audience and JWKS URL, HTTPS-only session cookies, trusted proxy headers and shared
session storage/sticky routing if running multiple BFF instances. Global rate limits need an
edge/Redis implementation before scaling horizontally. Review existing secret configuration.

Rebuild/export the UI with its actual HTTPS BFF origin, integrate and validate the prepared Nginx
snippet, verify OAuth callbacks and test `/chat` refresh on staging. Container build, TLS/private
network integration, production MySQL migration and live deployment are not validated here.
Deployment still requires explicit authorization. No paid infrastructure was provisioned.

## 18. Remaining limits

- Official social API access/scheduled sync, SSE and native provider-export ZIP conversion remain unimplemented.
- Admin JSON ingestion is functional, but no real founder posts/credentials were supplied.
- A small CPU model has limited reasoning/code correctness and can produce incomplete output under the token cap.
- UI cancellation stops waiting; it does not guarantee inference cancellation. Regenerate records a new turn.
- Long chats stop at forty completed turns; fifty signed-in conversations maximum until deleted.
- The real anonymous UI → BFF → model path passed locally. Live OAuth sign-in, production routing and installed-device flows remain staging checks.
- Existing commerce release gates and four high Expo signing-chain npm advisories remain; no zero-vulnerability or full marketplace production-readiness claim is made.

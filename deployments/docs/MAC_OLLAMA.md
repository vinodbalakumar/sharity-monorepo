# Mac Ollama deployment ? 2026-10-26

The active provider is Ollama on the owner's Mac at `http://192.168.0.149:11434`, model `qwen3:8b`. The Windows Ollama application is uninstalled. Automatic approval review rejected recursive deletion of `C:/Users/HP/.ollama`, so its unused downloaded model files remain. No Windows fallback or model download is configured.

## Configuration ownership

Deployment profiles now live in `deployments/config/<component>/`. The AI profile is `deployments/config/ai/application.properties`. Compose mounts these directories read-only and uses `SPRING_CONFIG_ADDITIONAL_LOCATION`; environment variables retain precedence. Local/QA/production profiles were removed from component source resources. Generic application defaults, schemas, test fixtures and package/build definitions remain in their component repositories.

Dockerfiles and Nginx configuration live under `deployments/dockerfiles/` and `deployments/nginx/`. Verified web images use the named BuildKit context `--build-context deployment=<deployments directory>` to copy centralized Nginx files. The context whitelist excludes private environment files. TLS configuration lives in ignored `deployments/.deployment-private/tls`; the previous workspace backup is preserved. Never commit `.env*`, private TLS files, databases or output logs.

## Exact provider profile

```properties
spring.ai.model.chat=ollama
spring.ai.ollama.base-url=${OLLAMA_BASE_URL:http://192.168.0.149:11434}
spring.ai.ollama.chat.model=qwen3:8b
spring.ai.ollama.chat.num-predict=1024
spring.ai.ollama.chat.num-ctx=8192
spring.ai.ollama.chat.temperature=0.3
spring.ai.ollama.chat.think=false
spring.ai.ollama.chat.keep-alive=${OLLAMA_KEEP_ALIVE:10m}
spring.ai.ollama.init.pull-model-strategy=never
```

No `num-gpu`, CPU-thread or batch override is supplied. Ollama chooses GPU placement on the Mac. Two concurrent chat generations are permitted; higher load receives the existing bounded overload response. Diagnostic explanations share this provider. Chat, SQL history and per-message token/timing metrics remain in Sharity; model inference runs on the Mac.

## Founder and product knowledge

Approved founder identity, role and public profile links remain in the service's reviewed public knowledge. No employment history, education, personal email or social posts were invented. Product facts are retrieved from the marketplace's public endpoint, refreshed on demand at most once per minute, and cached for at most two minutes after the last successful refresh. With the live URL configured, expired/unavailable product evidence is omitted rather than replaced by an old snapshot. Up to three relevant sources are sent to the model per question; all public products are eligible for retrieval.

Only public ID, title, category, price, currency, product/delivery type, listing status and demo flag are included. Draft/private listings, account records, orders, private email and delivery/license codes are excluded. The current 24 demo products all repeat an unrelated gold-ring description, so descriptions are deliberately excluded pending seller/data correction. Demo inventory and unverified license, region, warranty, material and fulfillment claims are not treated as guaranteed facts.

`python scripts/sharity/sync-ai-catalog.py` also writes a sanitized fallback snapshot to `deployments/knowledge/catalog.json`. Snapshot-only mode is available when no live URL is configured and expires after 24 hours. It is not model training: Sharity supplies relevant public context to the Mac for each answer. The Mac's base model is unchanged.

```mermaid
sequenceDiagram
    participant UI as Sharity chat UI
    participant BFF as Browser BFF
    participant AI as platform-ai-service
    participant Catalog as Public marketplace API
    participant Mac as Mac Ollama qwen3:8b
    UI->>BFF: Message and owned conversation
    BFF->>AI: Authenticated private chat channel
    AI->>Catalog: Read public listing facts (cached <=60s)
    Catalog-->>AI: Public product fields only
    AI->>AI: Retrieve approved founder/product context
    AI->>Mac: Bounded context + message; think=false
    Mac-->>AI: Answer + token usage
    AI->>AI: Persist answer and measured metrics
    AI-->>BFF: Answer, timestamps, tokens, elapsed time
    BFF-->>UI: Render answer and message info
```

## Build and rollout

Run Maven `clean verify` in `platform-ai-service` with Java 21. Run the opt-in real-provider smoke with `RUN_LOCAL_OLLAMA_TESTS=true` and `SPRING_CONFIG_ADDITIONAL_LOCATION=file:<absolute deployments/config/ai/>`. `scripts/sharity/deploy-mac-ai.ps1` checks the verified artifact, confirms the preinstalled model, refreshes the public snapshot, preserves the existing image and updates only the AI container. It never starts Windows Ollama, downloads a model, enables Tesla or enables live payments.

For a foreground development process use `scripts/sharity/start-sharity-chat.ps1`, with the private BFF token already set. Deployment configuration remains external. Mac availability is required for generated answers; approved structured founder answers remain available independently.

## Verification and current limitation

The unit/integration build passed 51 tests with one opt-in real-model test skipped. The separate opt-in real-provider run failed with a sanitized 503 because the Mac connection timed out. Initial host and container `/api/tags` requests succeeded and confirmed `qwen3:8b`; later requests timed out despite the owner confirming the same IP and a running Mac. GPU use, generation quality, token throughput and concurrent Mac inference are therefore not yet verified. The AI container is deployed and healthy with the Mac profile, without a Windows fallback.

Public founder chat, source-badge removal and message-info/timing rendering passed after deployment. The deployed storefront passed 326 combined browser scenarios; live checks loaded 24 images, 24 product pages and 16 responsive catalog views without JavaScript errors. These checks do not certify every marketplace/payment/native flow as production-ready.

The supported Boot HTTP timeout keys are `spring.http.clients.*` and `spring.http.reactiveclient.*`; they are supplied by the deployment profile. An unreachable provider now fails in about 8?10 seconds at the AI service in the measured tests, rather than approximately 45 seconds with the previous settings.

Final deployed API outage check: founder answer HTTP 200 in 175 ms (68 ms server time, zero model tokens); generated question HTTP 503 with sanitized `AI_UNAVAILABLE` in 8,189 ms. The clean AI JAR contains no environment-specific `application-*.properties` files. See ignored workspace `outputs/mac-ai-api-verification.json` and `outputs/mac-ai-verify.log` for evidence.

The full-service restart exposed variable connection delays despite Boot timeout properties. `OllamaTransportConfiguration` now applies those deployment-owned limits directly to both Ollama HTTP transports. Three real HTTP tests cover stalled blocking/reactive exchanges and valid response decoding. The initial failed live check is preserved in ignored `outputs/publish-chat-before-transport.json`; repeat the live check after deploying the transport fix.

After the explicit transport fix, the real public API check passed: founder answer HTTP 200 in 1053 ms; unreachable Mac HTTP 503 in 8735 ms. The AI artifact was redeployed and is healthy. Mac-generated content remains unverified because the remote endpoint is unavailable.

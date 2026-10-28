Deployment environment profiles are maintained in `../deployments/config/platform-web-bff/`; use `SPRING_CONFIG_ADDITIONAL_LOCATION` when starting outside Compose. Dockerfiles and server configuration are maintained in `../deployments`.

## Sharity AI chat (2026-10-25)

The narrowly allowlisted `/bff/ai/*` proxy supports public guest chat and private signed-in
history. Mutations retain session CSRF protection. Native bearer tokens validate issuer/audience;
channel identities come from verified principals or server sessions, never browser JSON/headers.
Set a matching `CHAT_BFF_TOKEN` in this BFF and `platform-ai-service`; it must never be public.
Non-loopback AI backend addresses require HTTPS. See the [AI operating guide](../deployments/docs/sharity/SHARITY_AI.md).

## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

See the [current workspace operations guide](../docs/workspace/operations.md) for deployment safeguards and operating guidance. Generated `outputs/` verification reports referenced by older notes are local-only and are not included in this repository.

# Platform Web BFF

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the current
> [developer guide](../docs/workspace/developer-guide.md),
> [operations guide](../docs/workspace/operations.md), and dated
> [migration validation record](../docs/migration/VALIDATION.md).
>
> Browser tokens remain server-side. Validate login/logout, callback URLs, session cookie attributes and CSRF on the deployed domain. The BFF contains a narrowly allowlisted `/bff/ai/*` proxy; enabling it requires deployment-specific backend configuration and a private shared token.


Secure browser-session backend-for-frontend for the `sharity-app` React Native Web app.

## Purpose

The Sharity browser app must not store production access tokens or refresh tokens in browser-accessible storage. This service owns the browser session and proxies authenticated API calls with server-held OAuth/OIDC tokens.

## Route Summary

| Path | Method | Purpose | Auth Requirement |
| --- | --- | --- | --- |
| `/bff/login` | `GET` | Start the OAuth/OIDC login redirect | Public |
| `/login/oauth2/code/sharity-web-bff` | `GET` | Spring Security OAuth callback route | Public callback |
| `/bff/session` | `GET` | Return safe session summary only | Authenticated session cookie |
| `/bff/logout` | `POST` | Invalidate the browser session | Authenticated session cookie |
| `/bff/api/**` | Any | Proxy authenticated calls to backend services | Authenticated session cookie |
| `/bff/ai/**` | Allowlisted methods | Chat and public AI content proxy | Guest or authenticated session, depending on route |

## Security Model

- Session cookie name: `SHARITY_SESSION`
- `HttpOnly=true`
- `Secure=true` in production profile
- `SameSite=Lax`
- Cookie path `/`
- OAuth/OIDC access and refresh tokens remain server-side only
- Browser-visible session responses do not include tokens, authorization codes, or client secrets
- CSRF protection remains enabled for state-changing requests

## Required Environment Variables

| Variable Name | Purpose | Secret? |
| --- | --- | --- |
| `SHARITY_WEB_BFF_CLIENT_ID` | Confidential OAuth client ID used by the BFF | No |
| `SHARITY_WEB_BFF_CLIENT_SECRET` | Confidential OAuth client secret | Yes |
| `SHARITY_BFF_PUBLIC_BASE_URL` | Public callback base URL for `/login/oauth2/code/sharity-web-bff` | No |
| `AUTH_SERVER_PUBLIC_BASE_URL` | Public authorization-server base URL used for the browser authorization redirect | No |
| `AUTH_SERVER_BASE_URL` | Authorization-server OIDC issuer/base URL | No |
| `SHARITY_WEB_BASE_URL` | Sharity web app public base URL | No |
| `SHARITY_WEB_ALLOWED_ORIGIN` | Allowed browser origin for CORS | No |
| `BFF_SESSION_COOKIE_SECURE` | Secure-cookie toggle for local vs production | No |
| `AUTHORIZATION_SERVER_BACKEND_URL` | Internal proxy target for authorization-server | No |
| `MARKETPLACE_SERVICE_BACKEND_URL` | Internal proxy target for marketplace-service | No |
| `PAYMENT_SERVICE_BACKEND_URL` | Internal proxy target for payment-service | No |
| `WALLET_SERVICE_BACKEND_URL` | Internal proxy target for wallet-service | No |

## Local Run

From the repository root:

```powershell
Push-Location platform-web-bff
mvn spring-boot:run
Pop-Location
```

## Local Test

From the repository root:

```powershell
Push-Location platform-web-bff
mvn test
Pop-Location
```

## Docker And Nginx Expectations

- Deployment definitions are in the sibling `../deployments/` directory; see its runbook.
- Nginx routes `/bff/` to the BFF container
- Nginx also proxies `/oauth2/authorization/sharity-web-bff` and `/login/oauth2/code/sharity-web-bff`
- The Sharity React Native Web app still loads from `/app/`

## Validation Status

- Local module tests passed earlier
- Docker Compose config and image build passed earlier
- Public live callback/session validation is still pending until real runtime secrets and deployed host values are provided

`SHARITY_WEB_BFF_CLIENT_SECRET` is required at runtime and is supplied by the private deployment env file. No real OAuth client-secret fallback is embedded in source. Rotate credentials previously present in Git history.
Controller integration tests explicitly activate the test profile and supply test-only credentials/H2 settings; CI does not import the workstation deployment env file.

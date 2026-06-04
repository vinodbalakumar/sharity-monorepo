# Platform Web BFF

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

```powershell
cd C:\Users\HP\projects\springbootrestdemo\platform-web-bff
mvn spring-boot:run
```

## Local Test

```powershell
cd C:\Users\HP\projects\springbootrestdemo\platform-web-bff
mvn test
```

## Docker And Nginx Expectations

- The service is deployed by `C:\Users\HP\projects\deployments\docker-compose.yml`
- Nginx routes `/bff/` to the BFF container
- Nginx also proxies `/oauth2/authorization/sharity-web-bff` and `/login/oauth2/code/sharity-web-bff`
- The Sharity React Native Web app still loads from `/app/`

## Validation Status

- Local module tests passed earlier
- Docker Compose config and image build passed earlier
- Public live callback/session validation is still pending until real runtime secrets and deployed host values are provided

# Central Docker Deployment

All deployment files live in this folder:

```text
C:\Users\HP\projects\deployments
```

Run every Docker Compose command from this folder.

## Services

```text
nginx
sharity-admin-portal
sharity-app
tesla-dashboard-ui
authorization-server
platform-web-bff
marketplace-service
payment-service
wallet-service
tesla-dashboard-services
```

Only Nginx publishes a host port:

```text
8080:8080
```

All application containers listen internally on port `8080`.

## Routes

```text
/                              -> redirects to /app/
/sharity-admin/                -> sharity-admin-portal
/app/                          -> sharity-app React Native Web
/bff/                          -> platform-web-bff
/oauth2/authorization/sharity-web-bff -> platform-web-bff OAuth start
/login/oauth2/code/sharity-web-bff     -> platform-web-bff OAuth callback
/authorization-server/api/login -> authorization-server login page and login-error handling
/tesla/                        -> tesla-dashboard-ui
/authorization-server/api/     -> authorization-server
/authorization-server/api/.well-known/openid-configuration -> authorization-server OIDC discovery
/authorization-server/api/.well-known/oauth-authorization-server -> authorization-server OAuth metadata
/authorization-server/api/oauth2/jwks -> authorization-server JWK set
/marketplace-service/          -> marketplace-service
/payment-service/              -> payment-service
/wallet-service/               -> wallet-service
/tesla-dashboard-services/api/ -> tesla-dashboard-services
```

Local URLs:

```text
http://localhost:8080/sharity-admin/
http://localhost:8080/app/
http://localhost:8080/bff/login
http://localhost:8080/bff/session
http://localhost:8080/oauth2/authorization/sharity-web-bff
http://localhost:8080/login/oauth2/code/sharity-web-bff
http://localhost:8080/tesla/
http://localhost:8080/authorization-server/api/.well-known/openid-configuration
http://localhost:8080/authorization-server/api/.well-known/oauth-authorization-server
http://localhost:8080/authorization-server/api/oauth2/jwks
http://localhost:8080/authorization-server/api/swagger-ui/index.html
http://localhost:8080/marketplace-service/swagger-ui/index.html
http://localhost:8080/payment-service/swagger-ui/index.html
http://localhost:8080/wallet-service/swagger-ui/index.html
http://localhost:8080/tesla-dashboard-services/api/hello
```

Production URLs:

```text
https://vinodbalakumar.com/          -> redirects to /app/
https://vinodbalakumar.com/sharity-admin/
https://vinodbalakumar.com/app/
https://vinodbalakumar.com/bff/login
https://vinodbalakumar.com/bff/session
https://vinodbalakumar.com/oauth2/authorization/sharity-web-bff
https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff
https://vinodbalakumar.com/authorization-server/api/login
https://vinodbalakumar.com/tesla/
https://vinodbalakumar.com/authorization-server/api/.well-known/openid-configuration
https://vinodbalakumar.com/authorization-server/api/.well-known/oauth-authorization-server
https://vinodbalakumar.com/authorization-server/api/oauth2/jwks
https://vinodbalakumar.com/authorization-server/api/swagger-ui/index.html
https://vinodbalakumar.com/marketplace-service/swagger-ui/index.html
https://vinodbalakumar.com/payment-service/swagger-ui/index.html
https://vinodbalakumar.com/wallet-service/swagger-ui/index.html
https://vinodbalakumar.com/tesla-dashboard-services/api/hello
```

## MySQL

MySQL is not created by Docker. It runs on the PC.

Required databases:

```text
auth
marketplace_db
payment_db
wallet_db
tesla
```

Containers connect to PC MySQL with:

```text
DB_HOST=host.docker.internal
DB_PORT=3306
```

## JWT PEM Keys

PEM files stay on the PC:

```text
C:\Users\HP\projects\certs\jwt-private.pem
C:\Users\HP\projects\certs\jwt-public.pem
```

Docker Compose mounts them read-only:

```yaml
volumes:
  - C:/Users/HP/projects/certs:/keys:ro
```

Inside containers:

```text
/keys/jwt-private.pem
/keys/jwt-public.pem
```

Authorization server receives:

```text
JWT_PRIVATE_KEY_PATH=/keys/jwt-private.pem
JWT_PUBLIC_KEY_PATH=/keys/jwt-public.pem
```

Marketplace, Payment, Wallet, and Tesla services receive:

```text
JWT_PUBLIC_KEY_PATH=/keys/jwt-public.pem
```

The authorization server signs JWTs with the private key. Other services validate JWTs with the public key.

## Environment

Create `.env` from `.env.example`:

```powershell
copy .env.example .env
```

Fill values for:

```text
PC_MYSQL_USERNAME
PC_MYSQL_PASSWORD
MAIL_USERNAME, only when EMAIL_DELIVERY_ENABLED=true
MAIL_PASSWORD, only when EMAIL_DELIVERY_ENABLED=true
JWT_ISSUER
AUTH_ISSUER_URL
SHARITY_WEB_BFF_CLIENT_SECRET
SHARITY_BFF_PUBLIC_BASE_URL
AUTH_SERVER_PUBLIC_BASE_URL
SHARITY_WEB_BASE_URL
SHARITY_WEB_ALLOWED_ORIGIN
BFF_SESSION_COOKIE_SECURE
```

Do not commit real secrets.
For the live BFF/OIDC runtime, the authorization server and BFF use the public issuer/base URL `https://vinodbalakumar.com/authorization-server/api`, while the internal Docker network still uses `http://authorization-server:8080/...` for service-to-service calls.
The auth-server login page is now rendered explicitly, so `GET /authorization-server/api/login` and `GET /authorization-server/api/login?error` return HTML 200 instead of the JSON 500 fallback.
Browser login now uses a separate permit-all login chain plus explicit POST controller, so invalid credentials redirect to `https://vinodbalakumar.com/authorization-server/api/login?error` and valid credentials resume the saved OAuth request back through the BFF callback path.

## Deploy All

```powershell
cd C:\Users\HP\projects\deployments
docker compose up -d --build
```

## Build Sharity Expo React Native Web

`sharity-app` is served under `/app/`, so the Expo web export must be built for the `/app/` public path.

```powershell
cd C:\Users\HP\projects\webapps\sharity-app
npm install
npm run typecheck
npm run lint
npm run build:web

cd C:\Users\HP\projects\deployments
docker compose up -d --build --no-deps sharity-app
docker compose restart nginx
```

The React Native Web app uses `/bff` for browser-session login/logout and public gateway routes for registration and browsing.
For production issuer consistency, set `JWT_ISSUER` and `AUTH_ISSUER_URL` to `https://vinodbalakumar.com/authorization-server/api`.

When deploying a new web build through Cloudflare, make sure `/app/` responses include no-cache headers or use versioned asset URLs.

## Deploy Individually

```powershell
docker compose up -d --build nginx
docker compose up -d --build sharity-admin-portal
docker compose up -d --build sharity-app
docker compose up -d --build tesla-dashboard-ui
docker compose up -d --build authorization-server
docker compose up -d --build platform-web-bff
docker compose up -d --build marketplace-service
docker compose up -d --build payment-service
docker compose up -d --build wallet-service
docker compose up -d --build tesla-dashboard-services
```

## Restart Without Rebuild

```powershell
docker compose restart nginx
docker compose restart sharity-admin-portal
docker compose restart sharity-app
docker compose restart tesla-dashboard-ui
docker compose restart authorization-server
docker compose restart platform-web-bff
docker compose restart marketplace-service
docker compose restart payment-service
docker compose restart wallet-service
docker compose restart tesla-dashboard-services
```

## Logs

```powershell
docker compose logs -f nginx
docker compose logs -f authorization-server
docker compose logs -f platform-web-bff
docker compose logs -f marketplace-service
docker compose logs -f payment-service
docker compose logs -f wallet-service
docker compose logs -f tesla-dashboard-services
docker compose logs -f sharity-admin-portal
docker compose logs -f sharity-app
docker compose logs -f tesla-dashboard-ui
```

## Stop

```powershell
docker compose down
```

## Validation Evidence

| Component | Command | Result |
| --- | --- | --- |
| Deployment config | `docker compose config` | Passed earlier |
| BFF image build | `docker compose build platform-web-bff` | Passed earlier |
| Auth discovery + JWK routes | `curl http://localhost:8080/authorization-server/api/.well-known/openid-configuration` and `curl http://localhost:8080/authorization-server/api/oauth2/jwks` | Passed locally |
| Sharity web build | `npm run build:web` | Passed locally |
| Live public OIDC discovery | `curl https://vinodbalakumar.com/authorization-server/api/.well-known/openid-configuration` | Passed |
| Live public OAuth metadata | `curl https://vinodbalakumar.com/authorization-server/api/.well-known/oauth-authorization-server` | Passed |
| Live public JWK set | `curl https://vinodbalakumar.com/authorization-server/api/oauth2/jwks` | Passed |
| Live public BFF session protection | `curl https://vinodbalakumar.com/bff/session` | Passed with `401` when unauthenticated |
| Live public BFF login initiation | `curl https://vinodbalakumar.com/bff/login` | Passed with `302` to public auth endpoint using PKCE `S256` |
| Live public OAuth client route | `curl https://vinodbalakumar.com/oauth2/authorization/sharity-web-bff` | Passed with `302` to `https://vinodbalakumar.com/authorization-server/api/oauth2/authorize?...` |
| Live public OAuth callback route | `curl https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff` | Passed as a routed BFF callback path and no longer 404s |
| Live public auth-server login route | `curl https://vinodbalakumar.com/authorization-server/api/login` and a deliberately invalid POST to the same endpoint | Routed to the authorization server login page and public issuer-prefixed error handling |

## Public Validation Remaining

- Live `/app/`, OIDC discovery, OAuth metadata, JWK, `/bff/session`, `/bff/api/**`, `/bff/login`, and `/oauth2/authorization/sharity-web-bff` have been validated.
- Live `/login/oauth2/code/sharity-web-bff` now reaches the BFF callback route rather than nginx/static 404.
- The auth-server login POST now returns the issuer-prefixed HTML login error page on invalid credentials and resumes the saved OAuth request on success.
- The saved-request browser-login continuation has been validated with curl, including the PKCE `S256` authorize redirect.
- A manual browser sign-in is still optional if you want to confirm the same behavior in the browser UI, but the server-side flow is now working.
- `/bff/session` must continue to return only session summary data and no tokens.
- Unauthenticated `/bff/api/**` access must remain rejected.

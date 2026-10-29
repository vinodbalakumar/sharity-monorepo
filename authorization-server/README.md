# Authorization Server

Spring Boot authorization service for Sharity and connected service modules.

Deployment environment profiles are maintained in `../deployments/config/authorization-server/`; set `SPRING_CONFIG_ADDITIONAL_LOCATION` explicitly when you need these profiles outside Compose. Selecting `local` alone does not load files from that directory. Dockerfiles and server configuration are maintained in `../deployments`.

For database setup, IntelliJ configuration, migration safety, and startup troubleshooting, see the [database operations runbook](docs/database-operations.md).

## Operations and commerce follow-up (2026-10-25)

This service now emits structured request metadata with validated `X-Correlation-ID` references and service-operation observations. Optional bounded diagnostic delivery uses `DIAGNOSTICS_ENABLED`, `DIAGNOSTICS_URL`, and a private `DIAGNOSTICS_TOKEN` (minimum 32 characters). OpenTelemetry export is off unless `OTEL_EXPORT_ENABLED=true`. AI explanations run centrally and do not block customer requests.

See workspace `OPERATIONS.md` and `outputs/operations-verification.md` for current setup, evidence and release limitations. Earlier readiness statements below are historical.

> October 25, 2026 development update: `feature/sharity-production-responsive`.
> Java 21; Spring Boot patch is defined in `pom.xml` (4.0.9, locally verified).
> Run `mvn -B -ntp verify`; CI also reviews dependency changes.
> A passing build does not establish production readiness. See the workspace
> `outputs/production-verification.md` and shared docs
> `production/2026-10-25_READINESS_REVIEW.md` for exact evidence and blockers.
>
> Identity and token issuance remain deterministic. Verify deployed OAuth redirects, mail delivery, issuer/audience and provider eligibility before release.


## Tech Stack

- Java 21
- Spring Boot 4.0.9
- Spring Security
- Spring Data JPA
- MySQL 8
- PostgreSQL 15+
- Flyway migrations
- Jakarta Validation
- Lombok
- Springdoc OpenAPI
- Spring Mail
- RS256 JWT signing with PEM keys

## Runtime Role

This service handles user authentication and administration:

- Register, verify email, login, refresh token, logout
- Forgot password and reset password
- Current user profile and sessions
- Admin user management
- Roles, legacy applications, service-module catalog, provider access, restrictions, and audit logs
- JWT access-token creation

## MVP Auth Screen Priority

`STORY-AUTH-001` covers Sign In, Create Account, Forgot Password, Reset Password, Verify Email, email verification result, social login callback handling, and auth loading/error states.

This is a high-priority frontend integration story and must be completed before cart, checkout, payment, order, refund, payout, and seller flows. The email/password, forgot/reset, and verify-email backend APIs listed below are already available. Apple and Google buttons need social provider wiring in the frontend/BFF path.

The service signs JWTs with the private key. Other backend services validate those JWTs with the public key.

## Issuer

Production and deployed OAuth/OIDC tokens should use the public issuer URL that matches the Nginx route:

```text
https://vinodbalakumar.com/authorization-server/api
```

The deployed issuer value comes from `JWT_ISSUER`. Do not leave the production deployment on the default logical issuer string.

## V3 OAuth/OIDC And BFF Support

The service now also owns the OAuth/OIDC foundation used by `platform-web-bff`.

- Authorization code flow and OIDC are enabled for the BFF client path.
- The confidential web client is `sharity-web-bff`.
- The BFF redirect base comes from `SHARITY_BFF_PUBLIC_BASE_URL`.
- The confidential client secret must be provided only through environment or deployment configuration.
- The existing email/password JWT login flow remains available for the current service APIs.
- Native/mobile/desktop PKCE remains partial because verified Flutter platform folders and identifiers are still missing in this workspace.

### BFF Client Configuration

| Variable | Purpose | Secret? |
| --- | --- | --- |
| `SHARITY_WEB_BFF_CLIENT_ID` | OAuth/OIDC client ID for the web BFF | No |
| `SHARITY_WEB_BFF_CLIENT_SECRET` | Confidential client secret for the web BFF | Yes |
| `SHARITY_BFF_PUBLIC_BASE_URL` | Public callback base URL used by the BFF client registration | No |

## V3.1 Platform Authorization

V3 keeps one central account and password in `authorization-server`.

- Verified users receive `USER` and `CUSTOMER`.
- `CUSTOMER` access opens active customer-enabled service modules.
- Provider access is granted per module using `provider_account`, `provider_module_enrollment`, and `user_module_access`.
- A provider remains a customer and can still use customer screens.
- Country configuration controls registration, purchasing, onboarding, and payout enablement. It is not the normal login boundary.
- Admin and internal APIs must not expose payment account references, KYC data, payout data, or restriction reasons to ordinary frontend clients.

Flow and sequence diagrams are available in:

```text
docs/v3-authorization-flow-diagrams.md
```

Seeded V3 modules:

- `MARKETPLACE` active customer/provider module
- `WALLET` active customer financial activity module
- `PAYMENTS` active internal service module
- `GROCERY`, `MEAT_SHOP`, `PHARMACY`, `LOGISTICS`, `AUTOMOTIVE`, `GIFT_CARDS` as coming-soon catalog modules
- `TESLA_DASHBOARD` remains visible as an active connected integration module

## Local Run

Run commands in this section from the `authorization-server` directory. Install
Java 21 or a compatible newer JDK and Maven, create the database, and grant the
application user permission to apply schema migrations before starting.

### Environment variables

These settings describe the shared `src\main\resources\application.properties`
configuration. External profile files or higher-priority Spring properties can
override them.

| Variable | Shared default / purpose |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `local` |
| `AUTH_DB_URL` | `jdbc:postgresql://localhost:5432/sauth` |
| `AUTH_DB_USERNAME` | `postgres` |
| `AUTH_DB_PASSWORD` | Supply your database password securely; do not rely on source defaults |
| `SERVER_PORT` | `9093` (HTTP port, not the database port) |
| `SERVER_SERVLET_CONTEXT_PATH` | `/authorization-server/api` |
| `SPRING_CONFIG_ADDITIONAL_LOCATION` | Optional external configuration directory; see the runbook |

`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
`SPRING_DATASOURCE_PASSWORD` override the corresponding Spring datasource
properties. Avoid conflicting values between these and `AUTH_DB_*`.
`DB_HOST`, `DB_PORT`, and `DB_NAME` alone do not configure the shared datasource.

### Local browser origins and BFF sign-in

The bundled local-profile `app.web.allowed-origin` defaults to
`http://localhost:9173,http://localhost:9174`, configurable with
`SHARITY_WEB_ALLOWED_ORIGIN`. This supports standalone local startup without
the external deployment profile. Origins contain no `/app/` path. Keep these
loopback defaults local-only: `application.properties` activates the default in
a `local` profile document. The shared property and Java fallback are empty,
with no wildcard. Production must explicitly configure its trusted origins.

The local browser flow uses this service at
`http://localhost:9093/authorization-server/api`, the BFF callback at
`http://localhost:9090/login/oauth2/code/sharity-web-bff`, and the frontend at
`http://localhost:9174/app/`. See the [BFF local-run guide](../platform-web-bff/README.md#local-run)
for redirect settings and fresh sign-in (`force=true` / `prompt=login`).

If registration-options returns 403 with no `Access-Control-Allow-Origin`,
check the active profile and effective allowed origins. Standalone startup
without external local configuration previously used the old Java CORS fallback
`http://localhost:3000`. Restart the authorization process after applying the
local-profile correction or changing its origin override; a BFF restart alone
cannot reload authorization-server configuration.

After the user restarted authorization, live credentialed registration-options
requests from the configured UI origin returned HTTP 200; an untrusted origin
returned 403. An actual Chromium fetch also returned 200. This is local CORS
verification, not production deployment or end-to-end account registration.

### Start with PostgreSQL or MySQL

In PowerShell, set the URL and username for your database. For PostgreSQL:

```powershell
$env:AUTH_DB_URL = 'jdbc:postgresql://localhost:5432/sauth'
$env:AUTH_DB_USERNAME = 'postgres'
```

For MySQL, use these instead:

```powershell
$env:AUTH_DB_URL = 'jdbc:mysql://localhost:3306/auth'
$env:AUTH_DB_USERNAME = 'auth_app'
```

For either vendor, supply `AUTH_DB_PASSWORD` through a secure environment or
secret configuration, then run:

```powershell
mvn -B -ntp clean compile
if ($LASTEXITCODE -eq 0) {
    mvn spring-boot:run "-Dspring-boot.run.profiles=local"
}
```

Port `5431` is supported only if PostgreSQL actually listens there (or a container
publishes that host port); set `AUTH_DB_URL` accordingly. Changing the application
URL does not start PostgreSQL or change its listening port.

Flyway automatically chooses MySQL or PostgreSQL scripts based on the connected
database, not the profile name. **Review the demo-data reset migrations before
pointing a fresh startup at a database containing real users.** See
[database migrations and recovery](docs/database-operations.md) for IntelliJ
steps, migration locations, and troubleshooting.

Local URL:

```text
http://localhost:9093/authorization-server/api
```

Swagger:

```text
http://localhost:9093/authorization-server/api/swagger-ui/index.html
```

## Docker Deployment

Deployment files are not stored in this service folder. They are centralized in:

[the sibling deployments directory](../deployments).

Deploy this service only:

```powershell
Set-Location ..\deployments
docker compose up -d --build authorization-server
```

Deploy all services:

```powershell
Set-Location ..\deployments
docker compose up -d --build
```

Container ports and datasource overrides depend on the selected Compose files.
Use the [deployment documentation](../deployments/docs/deployment.md) for the
target environment; do not assume the standalone HTTP or database defaults apply
inside a container. In a container, `localhost` refers to that container, not the host.

Public route through Nginx:

```text
https://vinodbalakumar.com/authorization-server/api
http://localhost:8080/authorization-server/api
```

## JWT PEM Keys

PEM files live on the PC:

```text
C:\Users\HP\projects\certs\jwt-private.pem
C:\Users\HP\projects\certs\jwt-public.pem
```

Docker Compose mounts them into the container:

```yaml
volumes:
  - C:/Users/HP/projects/certs:/keys:ro
```

Container paths:

```text
/keys/jwt-private.pem
/keys/jwt-public.pem
```

Environment variables:

```text
JWT_PRIVATE_KEY_PATH=/keys/jwt-private.pem
JWT_AUDIENCE=auth-clients
```

The private RSA key is used only by this service to sign JWTs. Its matching public key is derived automatically; `JWT_PUBLIC_KEY_PATH` or `JWT_PUBLIC_KEY_BASE64` may be supplied as an override. The key can also be provided as Base64-encoded PEM through `JWT_PRIVATE_KEY_BASE64`.

## Important APIs

All URLs below include the servlet context path.

| Method | URL | Access |
| --- | --- | --- |
| `POST` | `/authorization-server/api/v1/auth/register` | Public |
| `POST` | `/authorization-server/api/v1/auth/login` | Public |
| `POST` | `/authorization-server/api/v1/auth/refresh-token` | Public |
| `POST` | `/authorization-server/api/v1/auth/logout` | Public |
| `POST` | `/authorization-server/api/v1/auth/forgot-password` | Public |
| `POST` | `/authorization-server/api/v1/auth/reset-password` | Public |
| `GET` | `/authorization-server/api/v1/users/me` | JWT required |
| `GET` | `/authorization-server/api/v1/users/me/modules` | JWT required |
| `GET` | `/authorization-server/api/v1/users/me/capabilities` | JWT required |
| `GET` | `/authorization-server/api/v1/users/me/provider-accounts` | JWT required |
| `POST` | `/authorization-server/api/v1/users/me/provider-accounts` | JWT required |
| `POST` | `/authorization-server/api/v1/users/me/provider-accounts/{providerPublicId}/modules/{moduleCode}/enroll` | JWT required |
| `GET` | `/authorization-server/api/v1/admin/users` | `ADMIN` or `SUPER_ADMIN` |
| `GET` | `/authorization-server/api/v1/admin/applications` | `ADMIN` or `SUPER_ADMIN` |
| `GET` | `/authorization-server/api/v1/admin/modules` | Admin role |
| `GET` | `/authorization-server/api/v1/admin/providers/pending` | Admin role |
| `PUT` | `/authorization-server/api/v1/admin/providers/{providerPublicId}/modules/{moduleCode}/status` | Admin role |
| `GET` | `/authorization-server/api/v1/admin/supported-countries` | Admin role |
| `POST` | `/authorization-server/api/v1/admin/users/{publicId}/restrictions` | Admin role |
| `GET` | `/authorization-server/api/v1/admin/audit-logs` | `ADMIN` or `SUPER_ADMIN` |

Login example:

```http
POST /authorization-server/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

Protected API example:

```http
GET /authorization-server/api/v1/users/me
Authorization: Bearer <access-token>
```

## Auth Model

The UI uses user login:

```text
email/password -> JWT access token -> Authorization: Bearer <token>
```

This is different from OAuth2 client credentials:

```text
client_id/client_secret/scope -> machine token
```

Use this service's current login flow for browser users. Add client credentials later only for service-to-service or partner integrations.

## Internal Service Calls

V3.1 internal endpoints use a configured shared internal token for local development:

```text
INTERNAL_SERVICE_TOKEN=local-dev-internal-token
X-Internal-Service-Token: <token>
```

Internal endpoints:

```text
GET /authorization-server/api/internal/api/v1/providers/{providerPublicId}/modules/{moduleCode}/eligibility
GET /authorization-server/api/internal/api/v1/users/{userPublicId}/restrictions/active
```

This is intentionally simple for local V3. Later phases should move internal calls to client credentials, mTLS, or private-network-only service access before production exposure.

## Database

The service supports MySQL 8 and PostgreSQL 15+. `FlywayConfig` reads JDBC metadata
and selects exactly one migration location, overriding `spring.flyway.locations`
even when that property comes from an external profile.

| Connected database | Migration source directory |
| --- | --- |
| MySQL | `src\main\resources\db\migration` |
| PostgreSQL | `src\main\resources\db\migration-postgresql` |

Keep migration versions and behavior aligned across both vendors. Do not edit
already-applied migrations or files under `target\classes`; add a new unused
version in each vendor directory. Flyway manages schema changes; Hibernate uses
`ddl-auto=validate`, not automatic schema creation.

See the [database operations runbook](docs/database-operations.md) for migration
safety, existing-database recovery, and isolated regression commands.

## Useful Commands

```powershell
mvn test
mvn -DskipTests compile
docker compose logs -f authorization-server
```

Local profile-image storage credentials must be supplied through `AUTH_PROFILE_IMAGE_ACCESS_KEY_ID` and `AUTH_PROFILE_IMAGE_SECRET_ACCESS_KEY`. They are no longer embedded in `application-local.properties`. The local Docker env file supplies these variables; keep its values out of Git and rotate previously committed credentials.

`SHARITY_WEB_BFF_CLIENT_SECRET` is required at runtime and is supplied by the private deployment env file. No real OAuth client-secret fallback is embedded in source. Rotate credentials previously present in Git history.

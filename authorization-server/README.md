# Authorization Server

Spring Boot authorization service for Sharity and connected service modules.

## Tech Stack

- Java 21
- Spring Boot 4.0.6
- Spring Security
- Spring Data JPA
- MySQL 8
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

Default local profile:

```text
Database: auth
MySQL host: localhost
MySQL port: 3306
Username: root
Password: root
JWT private key: C:/Users/HP/projects/certs/jwt-private.pem
JWT public key: C:/Users/HP/projects/certs/jwt-public.pem
```

Run locally:

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Local URL:

```text
http://localhost:8083/authorization-server/api
```

Swagger:

```text
http://localhost:8083/authorization-server/api/swagger-ui/index.html
```

## Docker Deployment

Deployment files are not stored in this service folder. They are centralized in:

```text
C:\Users\HP\projects\deployments
```

Deploy this service only:

```powershell
cd C:\Users\HP\projects\deployments
docker compose up -d --build authorization-server
```

Deploy all services:

```powershell
cd C:\Users\HP\projects\deployments
docker compose up -d --build
```

The container runs on internal port `8080`. Only the Nginx container publishes host port `8080`.

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
JWT_PUBLIC_KEY_PATH=/keys/jwt-public.pem
JWT_AUDIENCE=auth-clients
```

The private key is used only by this service to sign JWTs.

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

MySQL runs on the PC for the current deployment setup.

Docker containers connect to PC MySQL using:

```text
DB_HOST=host.docker.internal
DB_PORT=3306
DB_NAME=auth
```

Flyway manages schema migrations from:

```text
src/main/resources/db/migration
```

Do not edit old applied migrations. Add a new migration such as `V7__description.sql`.

## Useful Commands

```powershell
mvn test
mvn -DskipTests compile
docker compose logs -f authorization-server
```

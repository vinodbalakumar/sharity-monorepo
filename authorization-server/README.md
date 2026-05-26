# Authorization Server

Spring Boot identity service for Sharity and connected service modules.

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
- Roles, applications, application access, and audit logs
- JWT access-token creation

The service signs JWTs with the private key. Other backend services validate those JWTs with the public key.

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
| `GET` | `/authorization-server/api/v1/admin/users` | `ADMIN` or `SUPER_ADMIN` |
| `GET` | `/authorization-server/api/v1/admin/applications` | `ADMIN` or `SUPER_ADMIN` |
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

## Database

MySQL runs on the PC, not in Docker.

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

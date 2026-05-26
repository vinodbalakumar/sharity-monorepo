# Sharity Admin Portal

Vite + React admin portal for Sharity user, role, application, and audit management.

## Runtime Role

This UI talks to:

```text
/authorization-server/api
```

It opens connected service modules, including:

```text
/tesla/
```

The Tesla dashboard receives the Sharity JWT session through browser `postMessage` when launched from the Services page.

## Local Development

```powershell
npm install
npm run dev
```

Environment:

```text
VITE_API_BASE_URL=
VITE_DEV_API_PROXY_TARGET=http://localhost:8083
VITE_TESLA_APP_URL=/tesla/
VITE_BASE_PATH=/sharity-admin/
```

Keep `VITE_API_BASE_URL` empty for same-origin deployment through Nginx.

## Production Route

Through Nginx:

```text
https://vinodbalakumar.com/sharity-admin/
http://localhost:8080/sharity-admin/
```

## Docker Deployment

Do not deploy from this folder. Deployment files live in:

```text
C:\Users\HP\projects\deployments
```

Deploy only this UI:

```powershell
cd C:\Users\HP\projects\deployments
docker compose up -d --build sharity-admin-portal
```

Deploy all services:

```powershell
cd C:\Users\HP\projects\deployments
docker compose up -d --build
```

## Main Features

- Login through authorization server
- Current-user profile and active sessions
- User list and user detail management
- Role assignment
- Application management
- App access assignment
- Audit logs
- Service launcher for Tesla dashboard

## Project Structure

```text
src/features        Route-level feature screens
src/shared/api      HTTP client, token store, backend services
src/shared/components UI primitives
src/shared/utils    Formatting and service-launch helpers
src/layouts         Admin shell
src/routes          Router setup
src/styles          Global styles
```

## Useful Commands

```powershell
npm run build
npm run lint
```

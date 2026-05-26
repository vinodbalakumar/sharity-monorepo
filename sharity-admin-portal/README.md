# Sharity Admin Portal

Vite + React admin dashboard for Sharity.

Smart business. shared rewards

```bash
npm install
npm run dev
npm run build
```

Set `VITE_API_BASE_URL` in `.env` to point at the Spring Boot API.

## Structure

- `src/features`: route-level business screens grouped by domain.
- `src/shared/api`: HTTP client, token store, and backend service wrappers.
- `src/shared/components`: reusable UI primitives and brand avatar.
- `src/shared/utils`: shared formatting and user helpers.
- `src/layouts`, `src/routes`, `src/styles`: shell, routing, and global design system.

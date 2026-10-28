# Configuration and data safety

## Configuration sources

Application defaults are in each service's
`src/main/resources/application.properties`. The `deployments/config/`
directories contain environment-specific Spring profiles mounted by selected
Compose stacks. Frontend build-time configuration lives in each app's
`.env.example`, package scripts, Vite/Expo configuration and Docker build
arguments.

An example file documents variable names and shape; it is not a secure,
production-ready configuration. Never commit actual `.env` files, passwords,
private keys, OAuth client secrets, provider credentials, internal service
tokens, database connection strings with credentials, or runtime snapshots.
Inject secrets through a local ignored file or a managed secret store. Do not
put secrets in `EXPO_PUBLIC_*` variables: Expo embeds those values in
client-visible bundles.

External Spring profiles are not automatically read by a service launched from
its component directory. Configure `SPRING_CONFIG_ADDITIONAL_LOCATION` when
intentionally loading them. In Compose, a service can also override properties
through environment values, mounts and its selected profile. Inspect the
effective service configuration before changing production or QA settings;
the authorization database runbook explains the datasource precedence for that
service.

## Database selection and migrations

Each service owns its schema and migration history. Shared database hosts are
possible, but they do not make schemas or migration ownership interchangeable.
The QA Compose templates use MySQL endpoints supplied by the deployment
environment; they do not provision a shared database container. PostgreSQL
support depends on the individual service configuration and migration set, not
on selecting a profile with a matching name.

The authorization server selects its MySQL or PostgreSQL migration directory
from the connected database's JDBC metadata. Its `FlywayConfig` overrides
profile-provided Flyway locations. See the [database operations runbook](../../authorization-server/docs/database-operations.md)
for configuration precedence and safe recovery. Check each other service's
properties, profiles and migration directories before using a non-default
database vendor.

**Treat every pending migration as potentially destructive until reviewed.**
The repository includes historical migrations named as demo-data reset/reseed
operations. Back up persistent data, test restoration, and inspect pending
SQL before a service first connects to a non-disposable database. Do not alter
an already-applied migration or delete Flyway history to get past a checksum
error. Add a new reviewed migration and keep vendor-specific versions aligned.
Never point a test suite at a shared or production database.

## Runtime configuration checklist

- **Authorization:** database URL/credentials, signing key path, token issuer
  and audience, BFF OAuth client settings, and optional mail/OAuth provider
  settings. See [authorization README](../../authorization-server/README.md)
  and its database runbook.
- **Resource services:** datasource values, authorization issuer/audience,
  public verification key and internal service authentication. Check the
  service properties and corresponding
  `deployments/config/<service>/` profile.
- **BFF:** database configuration, OAuth client secret, public callback/base
  URLs, allowed browser origins, cookie security, and backend service URLs.
  Keep the cookie secure setting enabled behind HTTPS.
- **Storefront:** public BFF/API origins and public asset base URL, configured
  at build time. Do not pass backend credentials or private keys to Expo.
- **Admin portal:** Vite base path and same-origin API routing; use a trusted
  development proxy target only for local development.
- **AI:** provider selection, model endpoint, data-store settings, matching
  JWT issuer/audience/JWKS configuration, and private BFF/chat/diagnostics
  tokens if those optional paths are enabled. The source default disables AI.
- **Deployment:** database, TLS/JWT key mounts, OAuth/email/payment integrations,
  and image names are selected by Compose files and private deployment
  configuration. Review the specific deployment variant before launch.

Configuration names and actual defaults can change with source. Consult the
current properties and Compose files rather than copying values from a dated
release note.

# Repository-wide engineering memory

- When a change affects database schemas, seeds, or database operations, update the relevant documentation and scripts and keep the MySQL migration/seed tree (`src/main/resources/db/`) aligned with the PostgreSQL tree (`src/main/resources/db/migration-postgresql/`). Validate both database paths where practical.
- Do not add SQL migrations for UI-only, client-side filtering or presentation changes that do not alter persisted data or backend behavior.
- When a change affects deployment or verification workflows, update the corresponding scripts and operator documentation together.

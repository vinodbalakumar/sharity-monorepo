# Authorization Server Database Operations

This runbook covers standalone development, vendor-specific Flyway migrations,
and startup recovery. See the [service README](../README.md) for application APIs
and the [deployment documentation](../../deployments/docs/deployment.md) for
Compose and QA/production conventions.

## Configuration and precedence

The shared configuration is `src\main\resources\application.properties`.
Its default profile is `local`, and its default datasource is PostgreSQL at
`jdbc:postgresql://localhost:5432/sauth` with username `postgres`. Supply
`AUTH_DB_PASSWORD` securely rather than relying on any source default.

| Setting | Configuration |
| --- | --- |
| Database vendor, host, port, and database name | `AUTH_DB_URL` |
| Database username | `AUTH_DB_USERNAME` |
| Database password | `AUTH_DB_PASSWORD` |
| Active Spring profile | `SPRING_PROFILES_ACTIVE` |
| Standalone HTTP port | `SERVER_PORT`, default `9093` |
| Standalone context path | `SERVER_SERVLET_CONTEXT_PATH`, default `/authorization-server/api` |

`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and
`SPRING_DATASOURCE_PASSWORD` override the corresponding Spring datasource
properties. JVM properties and command-line Spring arguments can also override
file configuration. Avoid defining competing settings; the Flyway startup
`Database: jdbc:...` log identifies the actual database endpoint, but does not
identify which configuration source supplied it. Do not log passwords or JWT keys
when diagnosing configuration.

The shared URL does not interpolate `DB_HOST`, `DB_PORT`, or `DB_NAME`.
Adding a profile named `mysql` or `postgresql` does not itself switch databases.
Environment variables set in a terminal are inherited only by processes started
from that environment; an already-running IntelliJ instance does not receive
later terminal changes automatically.

External environment profiles live in
`deployments\config\authorization-server`, outside the service classpath.
When needed, set `SPRING_CONFIG_ADDITIONAL_LOCATION` to the absolute path of that
directory, including its trailing backslash, and select the intended profile.
For example, from the `authorization-server` directory:

```powershell
$env:SPRING_CONFIG_ADDITIONAL_LOCATION = (Resolve-Path '..\deployments\config\authorization-server').Path + '\'
```

Spring loads those profile files in addition to shared settings. They may change
ports, datasource properties, JWT key paths, or other integration settings.
Inspect the selected profile before use. Local and deployed profiles do not
necessarily use the same environment-variable aliases for non-database settings.

## Database setup

Provision the database before starting the service; Flyway creates tables, not
the PostgreSQL database or MySQL database itself. The application database user
needs connection privileges and permission to create/alter tables, constraints,
indexes, and PostgreSQL sequences in the selected schema.

| Vendor | Example URL | Example username |
| --- | --- | --- |
| PostgreSQL | `jdbc:postgresql://localhost:5432/sauth` | `postgres` |
| PostgreSQL with custom host port | `jdbc:postgresql://localhost:5431/sauth` | `postgres` |
| MySQL | `jdbc:mysql://localhost:3306/auth` | `auth_app` |

Use your actual database names, users, and ports. No database URL change starts
a server or changes its listening port. For PostgreSQL in Docker, host mapping
`5431:5432` means a host-run application connects to `localhost:5431`.
An application in another container instead uses the database service hostname
and its container port. Do not use container-local `localhost` for a host database.

## IntelliJ startup

1. Open **Run > Edit Configurations** and select `AuthorizationServerApplication`.
2. Set `SPRING_PROFILES_ACTIVE=local`, `AUTH_DB_URL`, `AUTH_DB_USERNAME`, and
   `AUTH_DB_PASSWORD` in **Environment variables**. Keep passwords in private
   configuration, not shared run-configuration files or Git.
3. Remove conflicting datasource VM options, program arguments, or
   `SPRING_DATASOURCE_*` variables. Set `SPRING_CONFIG_ADDITIONAL_LOCATION` only
   when intentionally loading external configuration.
4. From a terminal in `authorization-server`, run `mvn -B -ntp clean compile`.
   Do not restart after a failed compile. Ensure the run configuration builds
   the module before launch.
5. Start the service and confirm its datasource log names the intended vendor,
   host port, and database. Successful startup ends with the application
   `Started` message; Tomcat initialization alone is not successful startup.

IntelliJ launches this module with `target\classes` on its classpath. Source
resource edits do not affect that run until copied by the build. Never manually
repair SQL in `target\classes`: fix source resources and rebuild.

## Migration selection and safety

[`FlywayConfig.databaseMigrationLocations`](../src/main/java/com/java/vinod/authorization/server/config/FlywayConfig.java)
reads the actual datasource's JDBC database product name:

| Product name | Flyway location |
| --- | --- |
| `MySQL` | `classpath:db/migration` |
| `PostgreSQL` | `classpath:db/migration-postgresql` |

The customizer overrides profile-provided `spring.flyway.locations`. Only one
vendor location is used; configuring both would introduce duplicate versions.
An unsupported product or unreadable database metadata causes startup to fail
explicitly. Both JDBC drivers and Flyway database modules are included.

Flyway runs before JPA initialization. Hibernate validates the resulting schema
with `spring.jpa.hibernate.ddl-auto=validate`. Do not bypass Flyway or enable
Hibernate schema updates to hide a migration failure.

**Historical migrations include destructive demo-data operations.** V27 resets
and seeds demo identities, and V28 resets passwords. Review all pending SQL and
take a restorable backup before applying migrations to any non-disposable
database. The vendor-selection fix does not make these migrations production-safe.

For future schema changes, add a new, unused migration version in both vendor
directories with equivalent behavior. Preserve already-applied files and
checksums. MySQL uses constructs such as `AUTO_INCREMENT`; PostgreSQL scripts
must use its own identity/sequence syntax and supported SQL.

When deploying corrected PostgreSQL scripts to an existing PostgreSQL history,
back up the database and compare recorded checksums with the intended release.
A mismatch requires investigation and a reviewed recovery plan, not automatic
repair, history-table deletion, or baselining over existing tables.

## Startup troubleshooting

Read the deepest `Caused by` in the startup exception, not just the first Tomcat
or security-filter error.

| Symptom | Meaning and action |
| --- | --- |
| `Connection refused` at `localhost:5431` | No reachable listener at that address and port. Start PostgreSQL or correct the host port/mapping. This is not a password error. |
| Startup logs show `localhost:5432/sauth` when `5431` was intended | A different URL is effective. Inspect run configuration, `AUTH_DB_URL`, `SPRING_DATASOURCE_URL`, external profiles, JVM options, and application arguments. |
| PostgreSQL reports syntax error near `AUTO_INCREMENT` | MySQL SQL reached PostgreSQL. Rebuild the module so both `FlywayConfig` and the corrected PostgreSQL resources are on the classpath. Confirm the selected vendor directory. |
| A resource under `target\classes` differs from source | Stale build output. Run `mvn -B -ntp clean compile` in the service directory, then restart. |
| Flyway checksum mismatch | An applied migration differs from the release files. Back up, inspect history and source, and plan recovery; do not blindly run repair. |
| Missing table/column during Hibernate validation | Schema and entities are not aligned. Inspect pending migrations and vendor-specific scripts; do not switch to `ddl-auto=update`. |
| `jpaSharedEM_entityManagerFactory`, repository, JWT filter, then Tomcat failures | Usually downstream of Flyway/JPA failure. Resolve the deepest database or SQL error first. |

From PowerShell on the application host:

```powershell
Test-NetConnection -ComputerName localhost -Port 5431
Get-NetTCPConnection -LocalPort 5431 -State Listen
```

Use the port from the effective URL. TCP connectivity does not establish that
credentials, database privileges, migrations, or the full application are valid.

For the reported PostgreSQL V1 syntax failure, Flyway logged that the migration
was rolled back. After fixing the build, retry startup against the intended
database; do not delete the database or disable migration validation. If tables
or prior migration history exist, inspect them before retrying.

## Isolated regression tests

From `authorization-server`, run:

```powershell
mvn -B -ntp "-Dtest=FlywayConfigTest,FlywayMigrationTest" test
```

`FlywayConfigTest` covers vendor selection. `FlywayMigrationTest` uses disposable
PostgreSQL and MySQL Testcontainers, applies the migration history, validates
checksums and restart behavior, and validates the JPA schema. Database tests are
skipped when Docker is unavailable; a successful Maven exit alone does not mean
both database engines ran.

For PostgreSQL only, the integration test can instead use an existing **empty,
disposable test database** through `test.postgresql.url`,
`test.postgresql.username`, and `test.postgresql.password` JVM properties.
Never use `sauth`, a shared database, or any database containing user data for
this override. The test applies demo reset migrations, leaves the resulting data
in place, and does not delete the database afterward. Supply test credentials
through private tooling rather than committing them or placing secrets in shell
history. This override does not exercise MySQL; MySQL still requires Docker.

# Windows QA Database

Windows hosts the primary QA MySQL database for Sharity.

## Rules

- The Windows QA database is the primary QA database.
- QA deployment nodes connect to it through the approved private network path.
- The database is not exposed publicly.
- Mac and Linux QA nodes must not create independent MySQL containers for Sharity data.
- QA data can be stored on Mac/Linux database nodes only through approved MySQL replication from the Windows primary.
- Replication setup is documented in `docs/mysql-replication-runbook.md`.

## Network model

- Windows remains the database anchor for QA.
- Mac and Linux QA nodes reference the Windows database or approved replica using the approved internal connectivity path.
- Tailscale or an equivalent controlled path is used when required by the environment.

## Required GitHub values

The QA workflow maps these values into the compose runtime:

- Repository variable `DB_HOST`: Windows MySQL host or approved replica host, for example `192.168.0.200`.
- Repository variable `DB_PORT`: MySQL port, usually `3306`.
- Repository variable `DB_USERNAME`: MySQL user.
- Repository secret `DB_PASSWORD`: MySQL password.

The deploy scripts export these as `PC_MYSQL_HOST`, `PC_MYSQL_PORT`, `PC_MYSQL_USERNAME`, and `PC_MYSQL_PASSWORD`.

## Windows MySQL access

Windows MySQL must allow the Mac runner host to connect. If MySQL rejects the Mac with:

```text
Host 'MACBOOKAIR-BF8A' is not allowed to connect to this MySQL server
```

run the grant on the Windows MySQL machine as an admin/root MySQL user:

```sql
CREATE USER IF NOT EXISTS 'root'@'MACBOOKAIR-BF8A' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'MACBOOKAIR-BF8A' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Prefer a dedicated application user instead of `root` for long-running QA usage, then update `DB_USERNAME` and `DB_PASSWORD`.

## Notes

- The repository only documents the integration points.
- It does not change database schema, data, or access policies.

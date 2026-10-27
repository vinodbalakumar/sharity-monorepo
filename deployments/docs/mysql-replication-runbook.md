# MySQL QA Replication Runbook

This runbook defines how Sharity QA should manage MySQL replication so QA data is stored on every approved database node.

## Required Architecture

Use single-primary MySQL replication unless a separate MySQL InnoDB Cluster or Group Replication design is explicitly approved.

```text
Windows MySQL primary
  -> Mac MySQL replica
  -> Linux MySQL replica
  -> additional approved QA replicas
```

The Windows database remains the write source. Replicas receive data from Windows.

## Important Rule

Do not treat each QA machine as an independent writable database.

If Mac, Linux, and Windows all accept independent writes without a real multi-primary cluster, the data will diverge. Classic MySQL replication should be single-writer:

- writes go to Windows primary
- replicas copy data from Windows
- replicas are normally read-only

## What This Repository Manages

This repository can document and validate the replication model and can provide deployment/runtime expectations.

It does not directly configure Windows MySQL, create replication users, copy physical data snapshots, or start replication on remote machines unless a separate automation channel with credentials is added.

## Database Nodes

### Primary

- Host: Windows QA MySQL
- Example host: `desktop-g9ov8mo.tail97dce3.ts.net`
- Role: primary/write source
- Required: binary logging enabled
- Required: stable `server_id`

### Replicas

- Host: Mac QA MySQL, Linux QA MySQL, or other approved QA DB nodes
- Role: replica/read copy
- Required: unique `server_id`
- Required: replication user credentials
- Recommended: `read_only=ON`
- Recommended: `super_read_only=ON`

## Primary Configuration

On Windows MySQL, enable binary logging and GTID replication.

Example `my.ini` values:

```ini
[mysqld]
server_id=1
log_bin=mysql-bin
binlog_format=ROW
gtid_mode=ON
enforce_gtid_consistency=ON
log_replica_updates=ON
```

Restart MySQL after changing server config.

## Replica Configuration

Each replica must have a unique `server_id`.

Example Mac replica:

```ini
[mysqld]
server_id=2
relay_log=relay-bin
gtid_mode=ON
enforce_gtid_consistency=ON
read_only=ON
super_read_only=ON
```

Example Linux replica:

```ini
[mysqld]
server_id=3
relay_log=relay-bin
gtid_mode=ON
enforce_gtid_consistency=ON
read_only=ON
super_read_only=ON
```

## Replication User

Create a replication user on the Windows primary.

Example:

```sql
CREATE USER IF NOT EXISTS 'sharity_repl'@'%' IDENTIFIED BY 'change-me';
GRANT REPLICATION SLAVE ON *.* TO 'sharity_repl'@'%';
FLUSH PRIVILEGES;
```

Restrict the host pattern to the private network when possible, for example:

```sql
CREATE USER IF NOT EXISTS 'sharity_repl'@'192.168.0.%' IDENTIFIED BY 'change-me';
GRANT REPLICATION SLAVE ON *.* TO 'sharity_repl'@'192.168.0.%';
FLUSH PRIVILEGES;
```

## Initial Data Copy

Before starting replication, each replica must start from a consistent copy of the primary data.

Use one of these approaches:

1. Logical dump with GTID metadata:

```bash
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=ON \
  --all-databases \
  -h desktop-g9ov8mo.tail97dce3.ts.net \
  -u root \
  -p > sharity-qa-primary.sql
```

Restore on replica:

```bash
mysql -u root -p < sharity-qa-primary.sql
```

2. Physical backup, if the team standardizes on MySQL Enterprise Backup, Percona XtraBackup, or another approved backup method.

## Start Replication

On each replica, point it at the Windows primary.

MySQL 8.0+ syntax:

```sql
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST='desktop-g9ov8mo.tail97dce3.ts.net',
  SOURCE_PORT=3306,
  SOURCE_USER='sharity_repl',
  SOURCE_PASSWORD='change-me',
  SOURCE_AUTO_POSITION=1;

START REPLICA;
```

Older MySQL syntax:

```sql
CHANGE MASTER TO
  MASTER_HOST='desktop-g9ov8mo.tail97dce3.ts.net',
  MASTER_PORT=3306,
  MASTER_USER='sharity_repl',
  MASTER_PASSWORD='change-me',
  MASTER_AUTO_POSITION=1;

START SLAVE;
```

## Verify Replication

On each replica:

```sql
SHOW REPLICA STATUS\G
```

Required healthy values:

```text
Replica_IO_Running: Yes
Replica_SQL_Running: Yes
Seconds_Behind_Source: 0 or low
Last_IO_Error:
Last_SQL_Error:
```

Older MySQL uses:

```sql
SHOW SLAVE STATUS\G
```

## Runtime Connection Model

There are two safe patterns.

### Pattern A: All App Writes Go To Windows Primary

Use this if the application expects a writable database.

- `DB_HOST` points to Windows primary.
- Mac/Linux app containers connect to Windows primary.
- Replicas exist for backup, local inspection, or future read scaling.

This is the safest current model.

### Pattern B: Read From Local Replica, Write To Primary

Use only if the application supports separate read/write data sources.

- writes go to Windows primary
- reads can go to local replica

Do not use this unless the service code and configuration explicitly support read/write splitting.

## What Not To Do

- Do not let Mac and Linux app containers write to their local replicas.
- Do not create independent MySQL containers and call that replication.
- Do not run multiple writable MySQL nodes unless a real multi-primary cluster is designed and tested.
- Do not use replication as a backup substitute. Replication copies mistakes and deletes too.

## GitHub Variables

For the current safe model, keep app deployment pointed at the primary:

```text
DB_HOST=desktop-g9ov8mo.tail97dce3.ts.net
DB_PORT=3306
DB_USERNAME=<qa app user>
DB_PASSWORD=<qa app password secret>
```

Replication credentials should be separate and should not be used by the application:

```text
MYSQL_REPLICATION_USER=sharity_repl
MYSQL_REPLICATION_PASSWORD=<secret>
```

## New Replica Checklist

1. Install MySQL on the new replica machine.
2. Configure a unique `server_id`.
3. Enable GTID consistency.
4. Set `read_only=ON` and `super_read_only=ON`.
5. Confirm network access from replica to Windows primary on port `3306`.
6. Create or reuse the replication user on Windows primary.
7. Take a consistent data dump or backup from Windows primary.
8. Restore the dump on the replica.
9. Run `CHANGE REPLICATION SOURCE TO ... SOURCE_AUTO_POSITION=1`.
10. Run `START REPLICA`.
11. Verify `SHOW REPLICA STATUS\G`.
12. Document the replica host, `server_id`, and purpose.

## Current Decision Needed

Confirm which model the team wants:

1. Single-primary replication with all app writes to Windows primary.
2. Read/write split with local replica reads and Windows primary writes.
3. Full multi-primary cluster, such as MySQL InnoDB Cluster or Group Replication.

Until that decision is made, the deployment workflow should use Pattern A.

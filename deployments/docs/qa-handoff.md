# QA Environment Handoff

This handoff explains what GitHub, Windows, Mac, and Linux do in the Sharity QA deployment model, what happens when `QA Build & Deploy` is run for Mac, and what is required to add a new QA machine.

## Architecture

```text
GitHub Actions
  -> selected self-hosted QA runner: windows, mac, or linux
  -> Docker build and compose deploy on that runner
  -> Sharity app containers
  -> Windows MySQL QA database or approved Windows replica
```

Windows owns the QA database primary. Mac and Linux are application runner nodes and may also host approved MySQL replicas, but they must not create independent Sharity MySQL databases.

## Responsibilities

### GitHub

- Stores the deployment repo and workflow files.
- Shows the `QA Build & Deploy` manual workflow.
- Lets the operator choose:
  - app/service branch, usually `claude_cop_patch`
  - component, such as `all` or `marketplace-service`
  - QA target: `windows`, `mac`, or `linux`
- Sends the job to a matching self-hosted runner.
- Provides database connection values to the runner:
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USERNAME`
  - `DB_PASSWORD`

GitHub does not run Docker for this setup. The selected self-hosted runner runs Docker.

### Windows

- Hosts the primary QA MySQL database, or the approved Windows-side replica endpoint.
- Stores QA data.
- Must allow each QA runner host to connect to MySQL.
- Must expose MySQL on the approved private network path, not publicly.
- Acts as the single write source unless a separate multi-primary design is approved.

Windows is the database anchor for QA. Do not replace it with a Mac or Linux local MySQL container.

### Mac

- Runs the GitHub self-hosted runner for `qa_target=mac`.
- Runs Docker Desktop.
- Builds Docker images.
- Starts Sharity containers using Docker Compose.
- Connects those containers to Windows MySQL through `DB_HOST`.
- May host a MySQL replica only when configured through the approved replication runbook.

The current Mac runner host observed in logs is:

```text
MACBOOKAIR-BF8A
```

### Linux

- Same role as Mac, but with Docker Engine on Linux.
- Runs the GitHub self-hosted runner for `qa_target=linux`.
- Builds and runs app containers.
- Connects to Windows MySQL or approved Windows replica.

### Windows QA App Runner

Windows can also be an app runner if needed. In that case it runs Docker Desktop and a GitHub runner, but the database connection should still be treated as the Windows QA DB endpoint so the same workflow variables are used consistently.

## What Happens When QA Build & Deploy Runs For Mac

When the operator runs:

```text
Actions -> QA Build & Deploy -> Run workflow
qa_target = mac
component = all
workflow_from = claude_cop_patch
```

the following happens:

1. GitHub creates a workflow run.
2. GitHub looks for a self-hosted runner with these labels:

```text
self-hosted, macOS, ARM64, sharity-qa
```

3. The Mac runner receives the job.
4. The workflow checks out the `deployments` repo.
5. The workflow checks out service repos from the selected branch.
6. The workflow runs:

```bash
./scripts/deploy-component.sh \
  --workflow-from claude_cop_patch \
  --component all \
  --deploy-environment qa \
  --qa-target mac \
  --mode apply
```

7. The Mac builds Docker images for the selected services.
8. The Mac runs Docker Compose.
9. The app containers start on the Mac.
10. Backend containers connect to Windows MySQL using:

```text
PC_MYSQL_HOST from DB_HOST
PC_MYSQL_PORT from DB_PORT
PC_MYSQL_USERNAME from DB_USERNAME
PC_MYSQL_PASSWORD from DB_PASSWORD
```

11. Health checks run.
12. If all required services are healthy, GitHub marks the workflow successful.

The `QA Build & Deploy` job runs its shell steps with `bash` on Windows, Mac, and Linux. That is required because the workflow uses Bash syntax such as `mkdir -p`, `source`, and `set -euo pipefail`.

The Mac workflow must not create or start an independent local MySQL container for Sharity data. If Mac stores a copy of QA data, that copy must be a configured replica of the Windows primary.

## MySQL Replication

QA data should be stored on every approved database node through MySQL replication.

The safe default is single-primary replication:

```text
Windows MySQL primary -> Mac/Linux MySQL replicas
```

In this model:

- Windows primary accepts writes.
- Mac/Linux replicas receive copied data.
- Replicas should normally be read-only.
- App containers should keep writing to Windows primary unless read/write splitting is explicitly supported.

Do not run independent writable MySQL databases on each QA node. That will create divergent data.

See `docs/mysql-replication-runbook.md` for the full setup steps.

## Current State And Validation

The current QA deployment flow is working across Mac, Linux, and Windows compose files with the same service health model:

- `marketplace-service` health: `/marketplace-service/internal/health`
- `wallet-service` health: `/wallet-service/internal/health`
- the deployment repo now uses the same health map for QA, prod, Mac, Linux, and Windows

The latest validated QA run completed successfully:

```text
QA Build & Deploy -> success
```

The Mac can also reach the Windows QA MySQL host over Tailscale:

```text
desktop-g9ov8mo.tail97dce3.ts.net:3306 reachable
```

For new runner hosts, keep the MySQL grant model in place so the Windows primary can authorize the runner host or replica user. Use a dedicated QA database user when possible instead of `root`.

## GitHub Repository Settings

Set these in the `vinodbalakumar/deployments` repository.

Repository variables:

```text
DB_HOST=desktop-g9ov8mo.tail97dce3.ts.net
DB_PORT=3306
DB_USERNAME=root
```

Repository secrets:

```text
DB_PASSWORD=root
SOURCE_REPO_READ_TOKEN=<token that can read service repos>
```

Replace `root` credentials with a dedicated QA user when available.

## Runner Labels

The workflow dispatch uses labels to choose the target machine.

Windows QA runner:

```text
self-hosted, Windows, sharity-qa
```

Mac QA runner:

```text
self-hosted, macOS, ARM64, sharity-qa
```

Linux QA runner:

```text
self-hosted, Linux, sharity-qa
```

If labels do not match exactly, GitHub will not send the job to the intended runner.

## New QA Machine Setup Checklist

### Common Steps

1. Install Git.
2. Install Docker:
   - Mac/Windows: Docker Desktop.
   - Linux: Docker Engine plus Compose plugin.
3. Install and configure GitHub self-hosted runner.
4. Add the correct labels for the target OS.
5. Confirm the runner is online in GitHub.
6. Confirm the machine can reach Windows MySQL:

```bash
nc -vz desktop-g9ov8mo.tail97dce3.ts.net 3306
```

7. Add the machine host/IP to Windows MySQL grants.
8. Run `QA Build & Deploy` with the matching `qa_target`.

### Mac-Specific Checklist

1. Docker Desktop is running.
2. GitHub runner is running as a service or active terminal process.
3. Runner labels include:

```text
self-hosted, macOS, ARM64, sharity-qa
```

4. Windows MySQL grants access to the runner hostname, for example `MACBOOKAIR-BF8A`.
5. No local Sharity MySQL container is running.

### Linux-Specific Checklist

1. Docker daemon is running.
2. Current runner user can run Docker commands.
3. Runner labels include:

```text
self-hosted, Linux, sharity-qa
```

4. Windows MySQL grants access to the Linux host or private IP.

### Windows-Specific Checklist

1. Docker Desktop is running if Windows is also an app runner.
2. GitHub runner labels include:

```text
self-hosted, Windows, sharity-qa
```

3. MySQL is reachable through the value configured as `DB_HOST`.
4. Firewall allows MySQL traffic on the private network only.

## Troubleshooting

### Job Does Not Start On Mac

Check:

- Runner is online in GitHub.
- Runner labels include `self-hosted`, `macOS`, `ARM64`, and `sharity-qa`.
- Workflow input `qa_target` is `mac`.

### Containers Start But Backend Fails

Check backend logs:

```bash
docker logs --tail 100 sharity-marketplace-service
docker logs --tail 100 sharity-authorization-server
docker logs --tail 100 sharity-payment-service
docker logs --tail 100 sharity-wallet-service
docker logs --tail 100 sharity-platform-web-bff
```

If logs show:

```text
Host '<runner-hostname>' is not allowed to connect to this MySQL server
```

fix the Windows MySQL grant.

### Local MySQL Appears On Mac Or Linux

This is not expected. Stop and remove the local Sharity MySQL container:

```bash
docker stop sharity-mysql
docker rm sharity-mysql
```

Do not delete volumes unless the owner confirms local data can be discarded.

### Cloudflare Shows 502

The public site may show 502 when backend containers are stopped, unhealthy, or unable to reach Windows MySQL. Fix container health and DB access first, then recheck the route.

## Related Docs

- `docs/windows-qa-database.md`
- `docs/mysql-replication-runbook.md`
- `docs/mac-qa-deployment.md`
- `docs/github-actions-deployment.md`
- `docs/qa-multi-target-routing.md`
- `docs/deployment.md`

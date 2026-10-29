# Deployment workspace

This directory is the monorepo's deployment and operations area. It is not a
separate application repository.

## Contents

- `docker-compose*.yml`: local, QA, host-specific, AI, simple and production
  stack variants.
- `dockerfiles/`: service build definitions used by Compose and image workflows.
- `nginx/`: reverse-proxy routes and TLS/diagnostics configuration.
- `config/`: external Spring profiles mounted by selected deployment variants.
- `scripts/`: deployment, health-check, rollback and QA target helpers.
- `docs/`: deployment, environment, AI, QA and release documentation.

For current safe usage start with the
[workspace operations guide](../docs/workspace/operations.md) and
[deployment runbook](docs/deployment.md). Compose files depend on environment
values, external databases and in some cases private key/configuration mounts.
Review the resolved Compose configuration before use; these files are not
universal secure defaults.

## Compose and environment safety

The unqualified `docker-compose.yml` contains legacy workstation paths and
local fallbacks. Select a topology-specific Compose file/overlay deliberately.
Local private inputs referenced by the files (for example database environment
files and AI settings) are not committed. `.env.example` is a variable
template, not a deployment credential store; replace all placeholders using a
secret manager or ignored local configuration. Never reuse example secrets in
shared environments.

The QA Compose templates expect an externally managed MySQL endpoint; they do
not provision independent QA databases. See [Windows QA database
guidance](docs/windows-qa-database.md) and the
[replication runbook](docs/mysql-replication-runbook.md).

## Workflows

The monorepo's active workflows are in the root
[`.github/workflows/`](../.github/workflows/) directory. Workflow files under
`deployments/.github/workflows/` are retained deployment templates and do not
run automatically for the root repository. Root CI verifies affected
components; the image publishing workflow publishes an image but does not
deploy it.

Use [the script guide](scripts/sharity/README.md) to understand state-changing
helpers and their prerequisites. Reports under `docs/releases/` and
`docs/sharity/production/` are dated evidence, not live deployment health.

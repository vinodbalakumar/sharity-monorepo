# Sharity repository and workspace layout

The main deployment repository is `deployments` (locally `C:/Users/HP/projects/deployments`). It owns Docker Compose files, Dockerfiles, Nginx configuration, `scripts/sharity/` and these shared operational guides. The running local Compose project is `sharity-local`; the existing tunnel exposes that origin. Publishing Git branches does not redeploy it.

Each application component is an independent Git repository with its own `.gitignore`, build file and CI. The new AI component is a private repository at https://github.com/vinodbalakumar/platform-ai-service. The local folder `tesla-dashboard-services` maps to the existing `employee-portal` GitHub repository; Tesla remains disabled in the local stack.

Typical checkout layout:

```text
projects/
  deployments/                   # this repository
    scripts/sharity/             # shared deployment/test tools
    docs/sharity/                # shared guides and release records
  springbootrestdemo/            # component workspace; no remote configured
    authorization-server/
    marketplace-service/
    payment-service/
    wallet-service/
    platform-web-bff/
    platform-ai-service/
    tesla-dashboard-services/
    sharity-app-ui/
    outputs/                     # generated, local-only logs/screenshots/reports
    .deployment-private/         # local-only backups, TLS keys and private snapshots
```

`outputs/` was created to keep generated verification evidence outside source directories. It is not application code and is now ignored at workspace/component level. The two architecture DOCX/PPTX files already tracked by the local workspace repository were not deleted or published; the workspace has no remote. Curated Markdown guides are versioned here, rather than raw logs or runtime snapshots.

The Expo application's `sharity-app-ui/package.json` is required for its build and runtime dependencies. The separate workspace-root `package.json` belongs to older one-off MySQL/AWS image-data scripts; it is not a backend build file and is not needed by Docker Compose or the shared verification tools. Those old scripts remain local and are excluded from this push because some contain literal credentials. The versioned `scripts/sharity` tools use PowerShell, Python, Java/Maven, Docker and built-in Node APIs.

Old workspace scripts remain local compatibility copies; this repository is the versioned location for shared tooling. Use `SHARITY_WORKSPACE_ROOT` to select the component directory, and optional `SHARITY_DOCS_ROOT` for a separate shared documentation directory. Read [the tooling instructions](../../scripts/sharity/README.md) and [local deployment guide](../local-ai-deployment.md) before running state-changing commands.

Local `.env`/`.env.local`, build directories, test screenshots, logs, backups and private keys are excluded. Public-only UI `.env.prod`, `.env.qa` and `.env.example` remain versioned. The Tesla public verification certificate remains tracked because it is a public key required by that integration.

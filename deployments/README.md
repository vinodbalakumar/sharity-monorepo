# Sharity deployment repository

Docker Compose, Dockerfiles and Nginx configuration live here. The running local project is `sharity-local`; its origin is exposed by the existing tunnel at https://vinodbalakumar.com. Pushing a feature branch does not deploy it.

- [2026-10-26 coordinated release and component commits](docs/releases/2026-10-26-core-ai-ui.md)
- [Current Mac Ollama provider and centralized configuration](docs/MAC_OLLAMA.md)
- [Repository ownership, output folders and package files](docs/sharity/WORKSPACE_LAYOUT.md)
- [Local core/AI deployment](docs/local-ai-deployment.md)
- [Shared deployment and verification tools](scripts/sharity/README.md)
- [AI operating guide](docs/sharity/SHARITY_AI.md)
- [Operations and commerce guide](docs/sharity/OPERATIONS.md)

Each application has its own Git repository and `.gitignore`. The new AI repository is https://github.com/vinodbalakumar/platform-ai-service. Current changes are published on `feature/sharity-production-responsive`. Keep real `.env` files, private keys, runtime snapshots and generated logs out of Git. `operations.env.example` is a template only.

Core Sharity and AI are enabled locally; Tesla stays disabled by owner request. Live payments, device OAuth verification and existing Expo security advisories remain release gates. The local deployment guides do not certify full production readiness.

Local checkout: `C:/Users/HP/projects/springbootrestdemo/deployments`. Compose build contexts use sibling component directories; the admin checkout is `../sharity-admin-portal`. Existing Windows compatibility junctions at the previous paths preserve running bind mounts and external launch settings.

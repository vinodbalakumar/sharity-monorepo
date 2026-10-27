# Migration record

The source workspace and all existing GitHub component repositories remain intact. This repository was created in a separate directory from clean, pushed `feature/sharity-production-responsive` component checkouts.

All component histories and the two workspace-document commits were imported with authors, dates, messages, merges, and commit counts preserved. `git-filter-repo` 2.47.0 prefixed each history with its component directory. Old literal credential values found in authorization, storefront documentation, and deployment history were redacted in the imported copies. The admin portal's public-only `.env` file was removed from its imported history; its defaults and `.env.example` provide the same public settings. These changes create new commit IDs. Original repositories were never rewritten or force-pushed.

[`sources.json`](sources.json) records the original and imported tips. [`commit-maps/`](commit-maps/) maps each old commit ID to its imported equivalent. Original commit counts total 300, including the workspace documents. The architecture DOCX/PPTX artifacts from the workspace's tracked history are retained under `docs/workspace/architecture/`; generated runtime output, private environment files, local scripts, and build directories were not copied.

Component folder names are intentionally unchanged in this first migration. Existing Compose contexts, Dockerfiles, and shared PowerShell paths continue to work. Source folders now belong to the root repository and contain no nested `.git` directories or submodules.

The legacy shell deployer now validates the checked-out monorepo ref instead of cloning, resetting, cleaning, or deleting component directories. Legacy component workflows inside subdirectories are historical references; only the root `.github/workflows/` workflows execute for this repository. Root CI builds affected components and their declared API consumers. The optional Tesla integration is retained in its own component, remains excluded from default reactor builds, and is not enabled in the running stack.

The running application continues to use its existing workspace, images, private environment, databases, and tunnel. This migration does not cut over a live deployment. Configure a deployment checkout explicitly when adopting the new repository.

# Sharity monorepo

Sharity applications, services, and deployment tooling share one Git repository. Each component retains its own build, dependency lockfile, Docker image, database boundary, and release process.

The original component directory names are retained so existing Docker Compose contexts and operational scripts continue to resolve correctly. This is a separate checkout; the original repositories and running deployment are preserved.

Migration and development instructions are added with the root tooling after the component histories are imported.

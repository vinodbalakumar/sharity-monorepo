# Workspace guide

This is the canonical workspace documentation for the current monorepo. The
repository has independently built Java services, two separately managed
frontends, optional integrations, root tooling and a centralized deployment
directory.

- [Architecture](architecture.md) explains responsibilities, service calls,
  routes and persistence boundaries.
- [Developer guide](developer-guide.md) lists prerequisites and commands for
  setup, builds and tests.
- [Configuration guide](configuration.md) explains configuration sources,
  secrets and migration safety.
- [Operations guide](operations.md) describes Compose variants, health checks
  and deployment safeguards.
- [Top-level documentation index](../README.md) links to component-specific
  references, migration history and deployment notes.

The former multi-repository workspace overview and operations narrative are
retained as [archived notes](workspace-notes-archive.md) and
[archived operations notes](operations-archive.md). Their local deployment
claims and links to ignored output files are not current instructions.

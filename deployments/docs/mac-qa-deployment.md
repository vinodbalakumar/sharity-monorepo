# Mac QA Deployment

Mac QA is the self-hosted QA node used for validating Sharity in a Docker Desktop environment.

## Target

- QA target: `mac`
- Runner labels: metadata only in this repository
- Public QA domain: `qa.vinodbalakumar.com`

## Runtime notes

- Uses Docker Compose on the Mac QA node.
- Connects to the Windows MySQL QA database or approved Windows replica through the approved network path.
- Does not run a local Sharity MySQL container.
- Requires `PC_MYSQL_HOST`, `PC_MYSQL_PORT`, `PC_MYSQL_USERNAME`, and `PC_MYSQL_PASSWORD` at compose runtime. GitHub Actions maps these from `DB_HOST`, `DB_PORT`, `DB_USERNAME`, and `DB_PASSWORD`.
- Uses the shared helper scripts in `scripts/`.

## Current Mac DB requirement

The Mac runner host must be allowed by Windows MySQL. The observed Mac hostname is:

```text
MACBOOKAIR-BF8A
```

If deploy logs show `Host 'MACBOOKAIR-BF8A' is not allowed to connect`, grant that host access on Windows MySQL before running QA deploy again.

## What this repository provides

- Compose templates
- Workflow inputs
- Rollback and retry metadata
- QA target routing documentation

## What this repository does not do

- It does not configure the Mac machine itself.
- It does not copy application source code onto the Mac.
- It does not commit secrets or certificates.
- It does not provision or replicate MySQL data.

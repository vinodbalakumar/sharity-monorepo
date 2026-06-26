# Mac QA Deployment

Mac QA is the self-hosted QA node used for validating Sharity in a Docker Desktop environment.

## Target

- QA target: `mac`
- Runner labels: metadata only in this repository
- Public QA domain: `qa.vinodbalakumar.com`

## Runtime notes

- Uses Docker Compose on the Mac QA node.
- Connects to the Windows MySQL QA database through the approved network path.
- Uses the shared helper scripts in `scripts/`.

## What this repository provides

- Compose templates
- Workflow inputs
- Rollback and retry metadata
- QA target routing documentation

## What this repository does not do

- It does not configure the Mac machine itself.
- It does not copy application source code onto the Mac.
- It does not commit secrets or certificates.

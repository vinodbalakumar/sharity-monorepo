# Cloudflare QA Routing

Sharity QA uses a single-active-target routing model.

## Modes

- `deploy_only` - stage the build without changing the public QA route.
- `make_active` - switch the public QA route to the selected target.

## Supported targets

- `windows`
- `mac`
- `linux`

## Route ownership

Only one target should serve the public QA hostname at a time.

## Helper

Use `scripts/make-active-qa-target.sh` to record the active QA target selected by the workflow.

## Notes

- Tunnel certificates are not committed.
- Provider credentials are not committed.
- The routing instructions are prepared here; execution belongs to the deployment environment.

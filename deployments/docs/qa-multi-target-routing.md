# QA Multi-Target Routing

Sharity QA can be prepared for three deployment targets:

- `windows`
- `mac`
- `linux`

Only one target should be active on the public QA hostname at a time.

## Routing rule

- `deploy_only` means the target receives the build but does not become the public QA route.
- `make_active` means the selected target becomes the active QA route.

## Active route state

The helper script `scripts/make-active-qa-target.sh` records the selected QA target so the routing decision is explicit.

## Recommended domains

- QA: `qa.vinodbalakumar.com`
- Public app: `vinodbalakumar.com`
- Public API: `api.vinodbalakumar.com`

## Notes

- The routing model is intentionally single-active-target.
- This repository does not commit tunnel certificates or provider secrets.
- The actual route change is handled outside the application source code.

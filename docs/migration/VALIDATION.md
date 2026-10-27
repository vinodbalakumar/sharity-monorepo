# Migration validation

Validated on Windows with Java 21, Maven 3.9.1, Node and npm on 2026-10-27.

| Check | Result |
| --- | --- |
| Core Maven reactor, six services | Build successful; 216 tests discovered, 214 passed, 2 environment-dependent tests skipped |
| AI service through the Windows root task runner | Build successful after allowing cold HTTP-client startup in the transport timeout test |
| Storefront | Clean npm installation, TypeScript check, asset tests and production web export passed |
| Admin portal | Clean npm installation and production build passed |
| Root tooling | 9 tests passed, including transitive consumers, independent image selection and optional components |
| Workspace integrity | 10 components, no nested repositories or submodules, source tips remain ancestors |
| Imported history | 300 source commits preserved; 2,549 historical blobs scanned; four known historical credential values absent |
| Original repositories | All ten component checkouts and the workspace documentation checkout remain clean at their recorded revisions |
| Compose | Configuration resolves with public example settings; selected immutable image override resolves correctly |
| Shell deployment tooling | Syntax and planning checks passed without executing a rollout |
| Optional Tesla profile | Maven model validation passed; no integration started |

The storefront browser gate covers cart counts, catalog integrity, configurable discovery sections, demo checkout, exact-order reconciliation, tracking, receipt, support and responsive layouts in Chromium and WebKit. It runs from the root CI workflow when the storefront or a declared dependency changes. The catalog fixture now implements the exact authenticated order endpoints rather than returning an empty successful response for those requests. The local preview port is configurable so checks do not reuse a server from the original workspace.

The AI transport test still verifies that the real local HTTP endpoint receives the request and that the stalled exchange fails through the configured transport. Its connection/read budgets are now 2 seconds/1 second rather than 200 milliseconds, avoiding a cold-start connection failure under workstation load.

Existing dependency audit findings are inherited and have not been represented as resolved. No application dependency versions were upgraded for this migration. The Tesla integration did not receive a full runtime verification. No image was released and no live deployment was switched as part of repository migration.

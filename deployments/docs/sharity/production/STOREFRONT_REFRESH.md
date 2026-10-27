# Storefront refresh deployment — October 26, 2026

Verified at 2026-10-26T08:02:03.034776+00:00. Public entry: https://vinodbalakumar.com/app/.

## Result

The public landing page, customer home and all-products catalog share a simpler marketplace layout with a blue-and-white palette, system fonts, clear category navigation, search, prices and responsive product cards. Category catalogs and product details use the same shell and image fallback. React Native Paper was already installed; its provider, buttons, search and chips now share the application theme. No runtime UI dependency was added.

Signed-out visitors see the landing page for private account routes. Public catalog and product pages remain browsable. The app checks the BFF session; `login=success` alone no longer mounts Home. Explicit sign-in keeps a validated route intent for at most 15 minutes. Back from sign-in retains the previous public screen, and product URLs survive refresh. Sign-out clears the local navigation authentication state before private history can be revisited. Backend authorization remains mandatory.

Missing and failed product photos have category artwork. Demo seed records are labelled rather than displaying their unrelated shared photo. Related-product controls open the selected item. Product and related-list requests run concurrently; a related-list failure does not discard a valid requested product. The main catalog normally needs one listing request, with home featured listings as a fallback.

## Verification

- TypeScript: passed. ESLint: zero errors; existing warnings remain.
- Expo web, Android and iOS exports: passed. Expo package compatibility: passed.
- 177 browser checks passed in Chromium, Firefox and WebKit, plus 3 separate sign-out/history checks (180 total). These are mocked API contract tests, not a claim of live payment completion.
- Typography and layout were checked at 320, 360, 375, 390, 412, 430, 667, 768, 820, 1024 and 1440px. Product gallery/summary geometry was checked at 320, 390, 768, 1024 and 1440px.
- Existing chat timing/token information, cart changes, checkout errors, disabled payments and administrator access checks passed.
- Actual public browser: Anonymous landing with live API listings; No horizontal overflow at 320, 390, 430, 768 and 1440px; Public product route and refresh load actual listing; Explicit sign-in reaches actual authentication form; Browser Back from actual sign-in retains public product; Private routes and unverified login marker return to landing; No browser errors or anonymous private API calls. No browser errors or anonymous private API requests were observed. API listing records loaded: 24. No login credentials were submitted and no orders/payments were created.
- Before/after and mobile product screenshots are in workspace `outputs/storefront-*.png`.

## Deployment and rollback

Only `sharity-local-sharity-app-1` was updated using `scripts/deploy-storefront-web.ps1`. The script rejects an export older than application source, preserves the old image, checks container health, validates edge Nginx and reloads its upstream. Existing core/AI/gateway image IDs match the baseline. Tesla remains disabled. No database schema, payment configuration, DNS or tunnel changes were made.

- Deployed image ID: `sha256:1f680ea80b2fdfad62d3f48b899a66ffe391b764c92cd9705780caf5210846a2`.
- Rollback image: `sharity-app:before-storefront-20261026-010016`.
- Verified bundle: `index-53324d028c922531b86bb48803d2015d.js`; SHA-256 `5dc6a949b3274d7c6ac0dc2562d0f67ca8fc77b4d25a2976151a53e7ba97159f` matches the running container.

The existing compose release tag is reused; use the image ID above to identify this UI build. To roll back, tag the preserved image as `sharity-app:release-20261025-215008`, run the existing local compose command with `up -d --no-deps --no-build sharity-app`, check health, then reload edge Nginx. See `scripts/deploy-storefront-web.ps1` for the exact compose files/env-file names. Do not print private env-file contents.

## Remaining release limits

This release improves storefront usability and navigation. It does not certify complete Flipkart/Gameflip feature parity or overall production readiness. Live payments remain disabled; provider reconciliation, remaining legacy/mock flows and installed-device native OAuth still need development/verification. Native exports are build artifacts, not device test results. Existing Expo security advisories were not resolved by this UI change. Existing DOCX documentation copies are historical; the Markdown guides are updated.

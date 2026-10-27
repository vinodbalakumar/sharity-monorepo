# UI and functional review ? 2026-10-26

The catalog image objects existed in object storage, but their public URLs returned access errors. The UI separately hid every demo image. The implemented solution displays real listing photographs through the marketplace/BFF public image endpoint and retains a separate demo label.

## Delivered

- Shared storefront/catalog product cards, readable category labels and prices, real product imagery, compact mobile landing page and consistent blue controls across the app, admin portal and sign-in page.
- Controlled listing-image delivery with bounded reads, cache size/lifetime, separate image request budget and private/draft-path rejection.
- Correct order identity, currency and pending-payment display; no invented shipping addresses, carrier references, payment events, fees or provider claims in the live order adapter.
- Account workspaces use actual user, provider and module APIs.
- Replaced the routed legacy refund form with an exact-order issue review backed by the real report-problem endpoint. Confirmation follows the backend acknowledgement; the form does not promise refund approval or fabricate evidence uploads.
- Recoverable failures in refund/dispute/payment authorization/secure-access pages and admin Applications/Sessions; partial failure notices in admin Commerce and Dashboard.
- Malformed Rewards payloads show a recoverable state rather than a blank page. Prototype sections disclose their sample data.
- Public listing detail reads reject unpublished drafts. Seller-owned APIs retain their separate authorization boundary.

## Validation

- 326 distinct browser scenarios have a passing final result across validation runs. Raw reports, original failures and focused reruns are preserved locally; no failed reports were overwritten to declare success.
- Marketplace Maven verification: 47 tests; authorization-server verification: 34 tests. Both builds pass.
- 26 admin route/viewport failure checks passed.
- Live origin: 24 images returned valid image content, 24 product details passed, 16 responsive catalog checks passed; no browser JavaScript errors.
- Expo web, Android and iOS exports and TypeScript pass. ESLint reports zero errors with existing warnings. Installed native devices and OAuth callbacks on devices are not certified by exports.

The initial live browser assertion used a five-second limit and ran during a cold startup. Inspection showed successful session/catalog/image requests and no script errors. The live smoke now allows the existing bounded startup to finish; no authentication checks were bypassed.

## Deployment and rollback

Deployment target: existing local `sharity-local` Docker origin behind the existing tunnel. The initial rollout updated authorization, marketplace, storefront and admin containers. The final visibility patch updates only marketplace. Previous image tags and rollback metadata are kept in ignored workspace `outputs/` files. Core AI, BFF, wallet and payment services remain running; Tesla remains disabled. No DNS, remote host, bucket access policy or payment-provider configuration was changed.

## Remaining product boundaries

This review does not certify a complete production marketplace. Legacy settings/security dashboard/rewards/notifications/marketplace configuration/promotions/support features still include prototype data. Legacy carrier tracking and dispute/refund-status screens also need durable business APIs and acceptance tests; the current real issue form returns users to their owned orders rather than inventing a refund reference. Live payments remain disabled. Existing Expo advisories, historical credential rotation, provider reconciliation, tax invoices, external messaging and installed-device OAuth remain release gates.

See [functional flow diagrams](../architecture/SHARITY_FUNCTIONAL_FLOWS.md) and [screen inventory](SCREEN_INVENTORY.md).

Final mobile discovery verification: Chromium, Firefox and WebKit pass with all nine backend categories accessible and product cards visible earlier on compact screens. The deployed storefront uses this verified bundle.

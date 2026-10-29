# Physical listing delivery and cart correction - 2026-10-26

The live catalog contained 10 physical jewellery listings marked INSTANT. Both the product UI and cart API interpreted that delivery type as digital, hiding Add to Cart and rejecting cart additions.

Flyway V55 changes physical listings with digital/invalid delivery methods to SHIPPING. Existing SHIPPING, SHIPPING_REQUIRED and LOCAL_PICKUP methods remain intact. The migration also repairs corresponding open-cart snapshots; it does not change digital inventory or historical orders. It runs after existing seed migrations on new databases. Applied migration files were not edited. MySQL and PostgreSQL migration variants are included; this rollout uses MySQL.

Listing create/update now rejects physical items with digital delivery methods with HTTP 400 and a clear message. Regression cases cover INSTANT, MANUAL, DOWNLOAD and DIGITAL; the existing physical cart and digital rejection tests remain active. The package build passed all 54 backend tests with no failures, errors or skips.

Deployment is limited to marketplace-service through scripts/sharity/deploy-physical-delivery.ps1. Its rollback record preserves the previous image; successful data corrections remain in place if an image rollback is needed. Before/after catalog evidence is stored in ignored outputs/physical-delivery-before.json and physical-delivery-after.json. The rollout verifies catalog membership and unchanged digital delivery. The UI needs no rebuild: its existing Add to Cart control appears once delivery data is correct.

The opt-in scripts/sharity/verify-physical-cart.cjs uses an environment-supplied authorized account. It checks desktop/mobile product buttons, adds one physical item absent from the existing cart, verifies server persistence, removes that item, checks the original cart is restored, and signs out. No order/payment is created.

Live testing also exposed missing seller display names in imported inventory. Cart snapshots now use Marketplace seller when the optional listing name is null/blank, preserving valid seller names. The add operation no longer retries within a failed persistence transaction. Regression cases verify canonical SHIPPING and persisted seller-name fallback for null, empty, whitespace and supplied names.

Rollout verification: MySQL reports Flyway version 55; marketplace container is healthy. Public catalog retains all 24 visible products: 10 PHYSICAL/SHIPPING and 14 DIGITAL/INSTANT. The real account smoke passed at 1440 and 320 pixels: cart add returned HTTP 200, shipping metadata persisted, and the original cart was restored after removal. Backend commit: bf2ed81. Existing cancelled-navigation AsyncRequestNotUsableException logging was observed during browser navigation; this release does not claim to resolve it.

## Multi-seller checkout status - 2026-10-28

The multi-seller cart and checkout-session routes are still mock contracts, not a purchase workflow. They now return HTTP 503 rather than reporting a checkout, seller-group checkout, checkout session, or payment authorization as successful. The multi-seller cart preview UI is likewise explicitly non-purchasable. No order, charge, or payout is created by these routes.

The production cart API continues to support physical items and enforces the existing physical-only, same-currency, stock, and quantity rules. Its purchase review remains one listing at a time. Instant-delivery digital purchases remain single-item. The cart UI's existing `imageUrl` rendering is retained.

Consolidated checkout must remain disabled until a parent order and idempotent single-payment record can be persisted across marketplace and payment services, seller/item allocations reconcile exactly to the captured total and existing 5% fee, and fulfillment/refund/dispute state transitions safely update the allocation ledger. The current payment model creates one payment order and provider payout per marketplace order; it cannot represent one parent charge with separate seller allocations. Any future multi-seller path must persist allocations and only mark them eligible after fulfillment; it must not invoke gateway seller-payout calls. Real processor transactions also remain gated by the verified checkout integration. No schema migration was applied for this UI/API safeguard.

## Durable checkout implementation - 2026-10-28

The preceding safeguard describes the earlier state, now superseded by the
durable implementation. Marketplace V58 and Payment V25 (paired MySQL and
PostgreSQL) persist a parent physical checkout, quantity-aware child orders,
one buyer payment and reconciled per-seller allocations. The cart UI now uses
the authenticated `/api/v1/marketplace/cart/{id}/checkout` endpoint; the old
mock routes remain unavailable. Digital Buy Now remains single-item.

One transaction validates the buyer's full cart snapshot and reserves inventory;
the existing outbox retries one aggregate payment command. The 5% fee remains
deducted from seller proceeds. Acceptance marks an allocation ledger eligible
only, disputes retain its hold, and unsupported consolidated refund/cancel
operations explicitly fail without mutation. Live transfers remain disabled;
no payout rail was selected and no real purchases were executed.

See the [API contract](../../../contracts/physical-cart-checkout.md) and
[operator rollout/reconciliation guide](../../../docs/workspace/operations.md#consolidated-checkout-operations).
This records source implementation, not a deployment or applied migration.

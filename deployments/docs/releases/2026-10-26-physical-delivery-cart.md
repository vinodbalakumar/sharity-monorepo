# Physical listing delivery and cart correction - 2026-10-26

The live catalog contained 10 physical jewellery listings marked INSTANT. Both the product UI and cart API interpreted that delivery type as digital, hiding Add to Cart and rejecting cart additions.

Flyway V55 changes physical listings with digital/invalid delivery methods to SHIPPING. Existing SHIPPING, SHIPPING_REQUIRED and LOCAL_PICKUP methods remain intact. The migration also repairs corresponding open-cart snapshots; it does not change digital inventory or historical orders. It runs after existing seed migrations on new databases. Applied migration files were not edited. MySQL and PostgreSQL migration variants are included; this rollout uses MySQL.

Listing create/update now rejects physical items with digital delivery methods with HTTP 400 and a clear message. Regression cases cover INSTANT, MANUAL, DOWNLOAD and DIGITAL; the existing physical cart and digital rejection tests remain active. The package build passed all 54 backend tests with no failures, errors or skips.

Deployment is limited to marketplace-service through scripts/sharity/deploy-physical-delivery.ps1. Its rollback record preserves the previous image; successful data corrections remain in place if an image rollback is needed. Before/after catalog evidence is stored in ignored outputs/physical-delivery-before.json and physical-delivery-after.json. The rollout verifies catalog membership and unchanged digital delivery. The UI needs no rebuild: its existing Add to Cart control appears once delivery data is correct.

The opt-in scripts/sharity/verify-physical-cart.cjs uses an environment-supplied authorized account. It checks desktop/mobile product buttons, adds one physical item absent from the existing cart, verifies server persistence, removes that item, checks the original cart is restored, and signs out. No order/payment is created.

Live testing also exposed missing seller display names in imported inventory. Cart snapshots now use Marketplace seller when the optional listing name is null/blank, preserving valid seller names. The add operation no longer retries within a failed persistence transaction. Regression cases verify canonical SHIPPING and persisted seller-name fallback for null, empty, whitespace and supplied names.

Rollout verification: MySQL reports Flyway version 55; marketplace container is healthy. Public catalog retains all 24 visible products: 10 PHYSICAL/SHIPPING and 14 DIGITAL/INSTANT. The real account smoke passed at 1440 and 320 pixels: cart add returned HTTP 200, shipping metadata persisted, and the original cart was restored after removal. Backend commit: bf2ed81. Existing cancelled-navigation AsyncRequestNotUsableException logging was observed during browser navigation; this release does not claim to resolve it.

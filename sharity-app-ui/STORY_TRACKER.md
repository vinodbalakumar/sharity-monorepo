# Sharity App Story Tracker

This tracker records the clean rebuild story by story. Each story should be implemented, validated, and marked before the next story starts.

Run Rule:
- Run Sharity app only through Docker via `C:\Users\HP\projects\deployments`.
- Do not start a separate Expo dev server.
- Keep generated local folders out of Docker build context with `.dockerignore`.

## Story 001: Splash Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\4123a90c-696e-4188-82ce-294b4ef4e572\pasted-text.txt`

Goal:
- Show a premium white/black Sharity splash screen at startup.
- Check session safely.
- Route logged-in users to Home.
- Route logged-out, expired, or failed-session users to Welcome.
- Avoid exposing tokens, email, profile data, or backend errors.
- Avoid a stuck splash screen.

Acceptance:
- Logo, app name, tagline, and loading indicator are visible.
- No header, tabs, buttons, products, ads, or sensitive data appear on splash.
- Works responsively for mobile, tablet, and desktop web.
- Session check has timeout/fallback behavior.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Recent Completed Story Batch

Story | Screen | Status | Notes
--- | --- | --- | ---
STORY-044 | Security Settings / Login Devices / Account Protection Screen | CODED | Login methods, devices/sessions, security alerts, re-auth, recovery, suspicious activity report, admin security placeholder
STORY-045 | App Settings / Theme / Language / Region Screen | CODED | Theme, language, region/country shortcut, currency display, marketplace preferences, notification preferences, accessibility, cache, app about
STORY-046 | Notification Center / Alerts / In-App Inbox Screen | CODED | Buyer/seller inbox, unread badges, critical pinned alerts, related entity actions, read/archive, filters, admin broadcast placeholder

## Story 032: Notifications Center Screen

Status: Done

Goal:
- Add a premium Notification Center for buyer, seller, and system alerts.
- Support grouped Today/Yesterday/This Week/Earlier feed, filters, summary counts, read/unread, mark-all-read, archive-only behavior, critical non-dismissible alerts, and deep-link mock behavior.

Mock API Contracts:
- `GET /api/notifications`
- `GET /api/notifications/summary-counts`
- `POST /api/notifications/{notificationId}/read`
- `POST /api/notifications/{notificationId}/unread`
- `POST /api/notifications/read-all`
- `POST /api/notifications/{notificationId}/archive`
- `GET /api/notifications/{notificationId}`
- `POST /api/notifications/{notificationId}/resolve-action`
- `GET /api/notifications/preferences-route`

Security:
- Digital codes, raw download URLs, provider payloads, internal risk score, admin private notes, and private contact details are not exposed.
- Critical notifications are blocked from archive until resolved.

Validation:
- `npm run typecheck`

## Story 033: Buyer/Seller Profile & Privacy Settings Screen

Status: Done

Goal:
- Add Profile & Privacy for buyer and seller identity in one screen.
- Support separate buyer/seller aliases, store name, avatar, privacy controls, real-name warning, digital privacy, message privacy, blocked users, trust badges, data export, and protected delete account mock state.

Mock API Contracts:
- `GET /api/profile/privacy`
- `PATCH /api/profile`
- `PATCH /api/profile/buyer-alias`
- `PATCH /api/profile/seller-alias`
- `PATCH /api/profile/store-name`
- `GET /api/profile/aliases/check`
- `POST /api/profile/photo`
- `PATCH /api/profile/privacy`
- `PATCH /api/profile/message-privacy`
- `GET /api/profile/blocked-users`
- `POST /api/profile/blocked-users`
- `DELETE /api/profile/blocked-users/{blockedUserId}`
- `POST /api/profile/reports`
- `GET /api/profile/verification-badges`
- `POST /api/profile/data-export`
- `GET /api/profile/data-export`
- `GET /api/profile/delete-account/eligibility`
- `POST /api/profile/delete-account`

Security:
- Real name is hidden by default.
- DOB, gender, phone/email, identity documents, tax/KYC data, payout secrets, bank details, internal risk score, admin notes, report evidence, and delete confirmation data are not stored in local UI preferences.

Validation:
- `npm run typecheck`

## Story 034: Account Switcher / Buyer-Seller Mode Switch Screen

Status: Done

Goal:
- Add Account Switcher for buyer mode, seller mode, and marketplace modules.
- Show buyer/seller identities separately, country/admin marketplace availability, unavailable reasons, seller eligibility, and remembered safe mode/marketplace preferences.

Mock API Contracts:
- `GET /api/account/switcher`
- `POST /api/account/switch-mode`
- `POST /api/account/switch-marketplace`
- `GET /api/account/marketplace-preferences`
- `PATCH /api/account/marketplace-preferences`
- `GET /api/account/seller-mode-eligibility`
- `GET /api/account/marketplace-availability`

Security:
- Legal identity, DOB/gender, phone/email, payout provider secrets, provider tokens, bank/tax/KYC data, internal risk score, admin notes, and unsafe admin config payloads are not stored locally.
- Local preference does not override backend permission.

Validation:
- `npm run typecheck`

## Story 035: Multi-Seller Cart & Checkout Review Screen

Status: Done

Goal:
- Replace Cart with a premium multi-seller Cart & Checkout review surface.
- Support seller-grouped cart sections, buyer service fee, seller/platform coupon states, digital terms acceptance, validation issues, authorize-first payment notice, and parent/seller order preview.

Mock API Contracts:
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/{cartItemId}`
- `DELETE /api/cart/items/{cartItemId}`
- `POST /api/cart/items/{cartItemId}/save-for-later`
- `POST /api/cart/items/{cartItemId}/move-to-cart`
- `POST /api/cart/coupons/apply`
- `POST /api/cart/coupons/remove`
- `POST /api/cart/validate`
- `POST /api/cart/pricing/refresh`
- `POST /api/cart/digital-terms/accept`
- `GET /api/checkout/preview`
- `POST /api/checkout/session`
- `POST /api/checkout/payment-authorization/start`

Security:
- Buyer-safe pricing only.
- Seller commission, internal fee waiver rules, internal risk score, admin pricing config, digital codes, raw URLs, and payment provider payloads are not exposed in cart.

Validation:
- `npm run typecheck`

## Story 036: Payment Authorization & Seller Acceptance Flow Screen

Status: Done

Goal:
- Add PayPal-first Payment Authorization status screen for multi-seller checkout.
- Show provider-decided auth model, buyer-safe pricing, authorization-first notice, seller acceptance before capture, partial acceptance, capture/release state, and digital delivery eligibility.

Mock API Contracts:
- `GET /api/checkout/sessions/{checkoutSessionId}/payment-authorization`
- `POST /api/checkout/sessions/{checkoutSessionId}/paypal/authorize`
- `POST /api/checkout/sessions/{checkoutSessionId}/paypal/confirm`
- `POST /api/checkout/sessions/{checkoutSessionId}/stripe/authorize`
- `GET /api/checkout/sessions/{checkoutSessionId}/authorization-status`
- `GET /api/checkout/sessions/{checkoutSessionId}/timeline`
- `POST /api/checkout/sessions/{checkoutSessionId}/authorization/retry`
- `POST /api/checkout/sessions/{checkoutSessionId}/authorization/cancel`
- Seller order accept/reject/request-more-time/status APIs

Security:
- Provider payloads/tokens/card data, seller commission, internal capture rules, internal risk score, digital codes, and raw URLs are not exposed or stored locally.

Validation:
- `npm run typecheck`

## Story 037: Pricing, Fees, Coupons & Promotions Engine / Admin Config

Status: Done

Goal:
- Add admin Pricing, Fees & Promotions control screen plus seller-safe pricing view.
- Support mock pricing rules, coupon manager, fee waivers, free product rules, simulator output, conflicts, audit log, buyer-safe pricing DTO, seller-safe pricing DTO, and pricing snapshots.

Mock API Contracts:
- Admin pricing rules, coupons, fee waivers, free product rules, simulation, conflicts, and audit log APIs
- Seller pricing summary, seller coupons, seller receives simulation, buyer display, checkout calculation, and seller order pricing snapshot APIs

Security:
- Buyer-safe pricing only for buyer surfaces.
- Seller-safe fee/coupon/payout impact only for seller surfaces.
- Admin-only full rule logic; no provider payloads, internal risk, admin notes, buyer private data, seller payout account data, tax/KYC data, or raw audit-sensitive payloads are stored locally.

Validation:
- `npm run typecheck`

## Story 038: Sharity Credit, Rewards & Giveaway Flow

Status: Done

Goal:
- Add later-phase Sharity Credit & Rewards architecture with buyer credit balance/history, giveaways, checkout credit allocation, seller-safe promotion impact, admin campaigns, abuse review, simulator, and audit logs.

Mock API Contracts:
- Rewards dashboard, credit balance/history, available rewards, giveaway claim, checkout credit apply/remove/allocation, seller promotion impact, admin campaigns, manual credit, issuance/redemption, giveaway claims, abuse review, simulator, audit log.

Security:
- Buyer credit data is buyer-scoped.
- Seller view is seller-safe only.
- Internal risk/IP/device/provider/wallet secrets and admin private notes are not shown or stored locally.

Validation:
- `npm run typecheck`
- `npm run lint`
- `mvn -q -DskipTests compile`

## Story 039: Buyer Refund Per Seller Order Flow

Status: Done

Goal:
- Add Request Refund for multi-seller parent orders where refunds target a selected seller order or seller order item, with digital eligibility, evidence, refund estimate, payout hold, escalation, cancellation, timeline, and physical/electronics placeholders.

Mock API Contracts:
- Parent order refund summary, seller order/item eligibility, refund reasons, estimate, evidence, submit refund, refund detail, timeline, cancel, escalate, breakdown.

Security:
- Buyer-owned seller-order refund only.
- Digital codes, raw/signed download URLs, evidence storage keys, provider payloads, internal risk, admin private notes, and seller payout data are not exposed.

Validation:
- `npm run typecheck`
- `npm run lint`
- `mvn -q -DskipTests compile`

## Story 040: Admin Marketplace & Country Configuration Screen

Status: Done

Goal:
- Add Country & Marketplace Settings for admin country marketplace config, buyer/seller availability, statuses, eligibility, feature flags, display order, simulation, audit, and existing-order snapshot warnings.

Validation:
- `npm run typecheck`
- `npm run lint`
- `mvn -q -DskipTests compile`

## Story 041: Seller Verification / KYC / Payout Eligibility Screen

Status: Done

Goal:
- Add Verification & Payout Eligibility for seller checklist, PayPal-first payout setup, payout blockers, marketplace/category eligibility, seller-safe limits, document requirements, admin review, badges, and timeline.

Validation:
- `npm run typecheck`
- `npm run lint`
- `mvn -q -DskipTests compile`

## Story 042: Policies & Terms Acceptance Screen

Status: Done

Goal:
- Add Policies & Terms with versioned buyer/seller/digital/refund/payout policy acceptance, re-acceptance, blockers, what-changed summaries, acceptance history, digital checkout snapshot placeholder, and admin preview.

Validation:
- `npm run typecheck`
- `npm run lint`
- `mvn -q -DskipTests compile`

## Story 043: Help & Support Center / Ticket Flow Screen

Status: Done

Goal:
- Add Help & Support with help search, guided troubleshooting, ticket creation, related entity linking, evidence upload, Sharity-only replies, ticket timeline, escalation, close/reopen, and admin/support queue placeholder.

Validation:
- `npm run typecheck`
- `npm run lint`
- `mvn -q -DskipTests compile`

## Story 027: View Receipt Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\f5892f08-5be3-4af5-a733-9b30406c0de4\pasted-text.txt`

Goal:
- Add a buyer-safe Order Receipt screen for digital, electronics, and mixed marketplace receipts.
- Show receipt header, safe PayPal reference, marketplace/seller groups, product line items, tax, shipping, coupon discount, buyer-paid marketplace fee, total paid, refund history, address summary, and digital access status summary.
- Keep receipt MVP view-only with future PDF/email actions disabled.

Mock API Contracts:
- `GET /api/orders/{orderId}/receipt`
- `GET /api/receipts/{receiptId}`
- `GET /api/receipts/{receiptId}/refund-history`
- `POST /api/receipts/{receiptId}/pdf` future stub
- `POST /api/receipts/{receiptId}/email` future stub

Security:
- Buyer-only receipt access.
- Safe payment reference only.
- Seller payout, seller commission, seller reserve/hold, internal platform margin, provider payloads, digital code, raw download URL, signed URL, exact reveal location, IP address, device ID, and internal risk score are not exposed.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 026: Dispute Status Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\366a598d-201d-4c00-ae26-5bb21212055f\pasted-text.txt`

Goal:
- Add one reusable Sharity Review Status screen for digital and electronics buyer disputes.
- Show current dispute status, possible/final outcome, estimated refund, digital access or shipping/return summary, buyer-safe seller/admin responses, timeline, requested evidence upload, close dispute, and status-based actions.
- Keep actions and status behavior backend-controlled through mock contracts.

Mock API Contracts:
- `GET /api/disputes/{disputeId}`
- `GET /api/disputes/{disputeId}/timeline`
- `POST /api/disputes/{disputeId}/evidence`
- `POST /api/disputes/{disputeId}/close`
- `GET /api/disputes/{disputeId}/actions`

Security:
- Buyer-safe seller/admin responses only.
- Digital code, raw download URL, exact location, IP address, device ID, internal risk score, admin private notes, seller private address, and raw carrier payloads are not exposed.
- Refund amount is marked estimated until final decision.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`
- `npm run build:web`

## Story 002: Welcome Screen

Status: Done

Goal:
- Build the logged-out welcome landing screen after splash.
- Promote a digital-first marketplace for digital codes, electronics, gaming codes, software keys, gift cards, subscriptions, accessories, and downloadable products.
- Allow guest browsing with login required later for purchase, code reveal, downloads, seller actions, refunds, reviews, and account library.
- Show desktop/tablet full search and mobile compact search icon.
- Use trust labels instead of fake marketplace numbers.
- Show footer on web.

Final Decisions:
- Hero title: `Buy and sell digital products with trust`
- Primary action: `Get Started Free`
- Secondary action: `Browse Products`
- Category focus: digital codes and electronics.
- Trust labels: Secure Checkout, Instant Digital Access, Seller Verification, Buyer Protection.

Acceptance:
- No fake statistics or fake big-brand partnership claims.
- Digital categories use instant-access language.
- Electronics/accessories are marked Preview or Coming Soon because physical shipping is future scope.
- No fast-shipping promise is shown for digital products.
- Footer appears on web.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`
- `npm run lint`
- `npm run build:web`

## Story 003: Home Screen

Status: Pending

Goal:
- Build the signed-in home route after splash session success.
- Keep the initial home lightweight until marketplace stories begin.

## Story 004: Plain White And Black Theme Config

Status: Done

Goal:
- Configure the app color system from the central theme file.
- Use plain white and black values for the visible app UI.
- Keep future screens aligned by importing `src/theme.ts`.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 005: Logged-in Home Dashboard With Real Marketplace APIs

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\f36e1a1b-22b9-428f-99c9-256f80f39367\pasted-text.txt`

Goal:
- Replace the placeholder signed-in Home route with a responsive dashboard.
- Use real marketplace APIs for services and deals instead of hardcoded offer data.
- Keep app colors controlled by `src/theme.ts` and plain white/black per Story 004.

Real API Data:
- Services derive from `GET /marketplace-service/api/v1/marketplace/home`.
- Best deals derive from `GET /marketplace-service/api/v1/marketplace/listings?sort=discount`.
- Deals are filtered to enabled digital/instant marketplace listings for MVP.
- Future services remain in configuration as coming soon, while active availability is derived from API verticals.

Acceptance:
- Logged-in users see dashboard after session success.
- Desktop/tablet gets sidebar; mobile gets bottom tabs.
- Hero says `Welcome to Sharity` and includes `Explore Marketplace`.
- Quick cards show My Orders, Rewards, and Cart.
- Explore Services shows active Digital Marketplace and configured future services.
- Best Deals section uses listing price/original price/review data from the backend.
- Loading, empty, and retry states are present.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 006: Home Dashboard Final Decisions

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\05f59dfc-aaa1-4cb8-9855-199e951593d9\pasted-text.txt`

Goal:
- Apply the final Screen 2B dashboard decisions on top of Story 005.
- Make Digital Marketplace and Electronics Marketplace active for MVP.
- Keep Imitation Jewellery, Automotive, Grocery Delivery, Fresh Meat, and Rentals as Coming Soon.
- Add Sell and Wallet access.
- Keep Help and Settings out of top-level navigation.

Real API Data:
- Active marketplace cards are derived from marketplace API vertical/category availability.
- Digital Marketplace is active from active marketplace/gift-card verticals and digital categories.
- Electronics Marketplace is active from active electronics categories/listings.
- Best Deals use real listing price, original price, product type, category, and review data.
- Deals are restricted to Digital and Electronics marketplace listings.

Acceptance:
- Sidebar contains Home, Marketplace, Orders, Rewards, Sell, Wallet, and Profile.
- Mobile tabs contain Home, Marketplace, Orders, Sell, and Profile.
- Quick actions contain My Orders, Rewards, Cart, Sell, and Wallet.
- Digital and Electronics show Active/Browse.
- Coming Soon services show Notify Me.
- Best Deals sorts by highest discount from active Digital/Electronics listings.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 007: Marketplace Switcher

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\323101c3-fa27-4707-91c5-ede5efe8441c\pasted-text.txt`
- `C:\Users\HP\.codex\attachments\747a4d45-110c-4e8f-802a-e85a4a4dfb1f\pasted-text.txt`

Goal:
- Add a Marketplace Switcher screen for choosing active and upcoming marketplaces.
- Route the dashboard Marketplace sidebar/tab and Explore Marketplace hero action to the switcher.
- Show active Digital Marketplace and Electronics Marketplace.
- Show Imitation Jewellery, Automotive, Grocery Delivery, Fresh Meat, and Rentals as Coming Soon.
- Show country availability and marketplace actions.

Real API Data:
- Marketplace availability is derived from `GET /marketplace-service/api/v1/marketplace/home` through the existing dashboard builders.
- Best Deals use `GET /marketplace-service/api/v1/marketplace/listings?sort=discount`.
- Deal cards remain restricted to active Digital/Electronics listings.

Acceptance:
- Screen title is `Choose Marketplace`.
- Desktop/tablet shows dashboard sidebar with Marketplace selected.
- Mobile shows bottom tabs with Marketplace selected.
- Active marketplace cards show Browse, View Deals, and Sell.
- Coming Soon cards show Notify Me and Learn More.
- Country availability appears on each marketplace card.
- Digital code proof/source and electronics condition rules are surfaced.
- Notify Me shows a safe confirmation message.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 008: Electronics Marketplace Home

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\679674c8-0ae3-4a62-bbd0-298ff7413bef\pasted-text.txt`

Goal:
- Add an active Electronics Marketplace Home screen.
- Wire the Marketplace Switcher Electronics Browse action to the Electronics screen.
- Support electronics browsing, search, category chips, sort options, safety warning, filters, and product cards.
- Keep payment, shipping provider, checkout, and backend integration out of this initial UI slice.

Mock Data:
- Categories, filters, sort options, and electronics product cards use typed mock data.
- Product cards include condition, brand, seller, rating, location, shipping, return eligibility, warranty, buyer protection, and marketplace badge fields.
- Conditions include New, Used, Refurbished, Open Box, and Like New.

Acceptance:
- Screen title is `Electronics & Gadgets`.
- Desktop has dashboard sidebar, filter sidebar, and product grid.
- Mobile has compact header, search, category chips, filter button, product grid, and bottom tabs.
- Safety warning is shown.
- Guest browsing UI is available; purchase remains future/login-gated.
- Local pickup is not built for MVP.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 009: Digital Product Details

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\70aba46d-58bb-46e9-b387-942f9a54bff2\pasted-text.txt`

Goal:
- Add a Digital Product Details screen for viewing digital products before purchase.
- Wire Home and Marketplace Switcher deal cards to open product details.
- Use real marketplace listing and review APIs.
- Never reveal actual digital codes, license keys, gift-card numbers, credentials, secure download URLs, or access before payment.

Real API Data:
- Details use `GET /marketplace-service/api/v1/marketplace/listings/{listingPublicId}`.
- Related products use `GET /marketplace-service/api/v1/marketplace/listings?sort=discount`.
- Reviews come from listing `publicReviews`.

Acceptance:
- Shows product title, category, product type, price, discount, rating, review count, country availability, seller verification, and buyer protection.
- Shows media preview without code/access reveal.
- Shows delivery/access type, what buyer receives, access rules, refund policy, seller card, buyer protection, reviews, related products, report/share actions, Buy Now, Add to Cart, Wishlist, and Contact Seller.
- Guests are told sign-in is required for purchase, wishlist, seller contact, download, review, and refund request.
- Mobile has a bottom purchase bar.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 010: Digital Product Details Final Acceptance

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\e62beac7-a169-4ee8-b9c7-8069bbf84678\pasted-text.txt`

Goal:
- Tighten the Digital Product Details screen against the full acceptance checklist.
- Keep real listing APIs and never reveal protected digital access before payment.
- Add mobile carousel behavior, product details fields, rating breakdown, review dates, and login-gated action messages.
- Keep the app plain white and black through `src/theme.ts`.

Real API Data:
- Details use `GET /marketplace-service/api/v1/marketplace/listings/{listingPublicId}`.
- Related products use `GET /marketplace-service/api/v1/marketplace/listings?sort=discount`.
- Reviews and rating breakdown derive from listing `publicReviews`.

Acceptance:
- Buy Now, Add to Cart, Add to Wishlist, Contact Seller, Report Listing, and Share actions exist.
- Guest actions show sign-in or guest-cart policy messages where required.
- Mobile shows a carousel-style secure preview and sticky Buy/Add to Cart bar.
- Desktop/tablet shows secure preview with thumbnails and a purchase panel.
- Product details, access rules, refund policy, seller card, buyer protection, reviews, and related products are visible.
- Actual code, license key, gift-card number, credentials, secure URL, download, or access is not shown before payment.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 011: Reusable Product Details Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\bbc5c43d-152b-44fe-856d-581667f6909a\pasted-text.txt`

Goal:
- Build one reusable Product Details screen that adapts for digital and electronics products.
- Keep digital products backed by real marketplace listing APIs.
- Add electronics product details using typed MVP mock product data.
- Wire Electronics Marketplace product cards to open product details.
- Keep digital code/access protection rules and seller privacy rules visible.

Data:
- Digital details use `GET /marketplace-service/api/v1/marketplace/listings/{listingPublicId}`.
- Digital related products use `GET /marketplace-service/api/v1/marketplace/listings?sort=discount`.
- Electronics details use typed mock data from `src/features/electronics/electronicsData.ts`.

Acceptance:
- One reusable `ProductDetailsScreen` supports digital and electronics modes.
- Digital products show delivery/access rules, digital code protection, refund rules, and never reveal code/download/access before payment.
- Electronics products show brand, condition, shipping, warranty, return policy, and safety warning.
- Both modes show product summary, price, seller card, buyer protection, reviews, related products, share/report, and purchase actions.
- Mobile uses carousel-style preview and sticky Buy/Add to Cart bar.
- Desktop/tablet uses main preview plus thumbnails and a purchase panel.
- Guest users can browse and share, with login prompts for restricted actions.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 012: Global UI Design System

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\4bf9323b-df10-43fe-b691-ab08129e91b0\pasted-text.txt`

Goal:
- Add the global Sharity UI design system foundation.
- Configure React Native Paper with a Material 3 Sharity theme.
- Replace the single theme file with centralized theme modules.
- Create Sharity wrapper components for common UI controls.
- Document UI-system rules in README and create `docs/STORY_TRACKER.md`.

Theme:
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/theme/radius.ts`
- `src/theme/shadows.ts`
- `src/theme/breakpoints.ts`
- `src/theme/paperTheme.ts`
- `src/theme/index.ts`

Wrappers:
- `AppButton`, `AppSearchBar`, `AppTextInput`, `AppCard`, `AppChip`, `AppBadge`
- `AppDialog`, `AppSnackbar`, `AppDivider`, `AppLoadingIndicator`
- `AppSwitch`, `AppCheckbox`, `AppRadioButton`, `AppMenu`

Acceptance:
- React Native Paper is installed and configured at the app root.
- Theme can be changed centrally through `src/theme`.
- Existing screens continue importing theme tokens through `src/theme`.
- README includes the Sharity UI Design System section and library usage table.
- `docs/STORY_TRACKER.md` exists with story statuses.
- Modern marketplace palette is centralized in theme config.

Refinement:
- Added purple/blue primary accents, light neutral background, white surfaces, gray borders, green success, amber warning, and red error.
- Added `src/utils/responsive.ts`.
- Expanded README screen usage table with Payment Success, Buyer Library, Seller Dashboard, and Profile.
- Updated `docs/STORY_TRACKER.md` statuses to keep STORY-000 `IN_PROGRESS` and finalized screen stories `READY_FOR_CODEX`.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 013: Cart Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\9102857a-2c2c-446f-b966-e7ab4c341d57\pasted-text.txt`

Goal:
- Add a responsive Cart Screen for mixed digital and electronics carts.
- Group cart items by marketplace and seller.
- Show delivery, refund/return, shipping, seller verification, quantity, coupon, warnings, and checkout summary.
- Use mock cart data only for initial UI.

Rules:
- Mixed cart checkout is allowed as one user flow.
- Checkout is described as internally split by marketplace, seller, delivery type, and shipping requirement.
- Guest users can view cart and apply coupons, but must sign in before checkout.
- Digital codes, raw download URLs, seller private details, and buyer private data are not shown.

Acceptance:
- Cart uses STORY-000 wrappers: `AppButton`, `AppCard`, `AppBadge`, `AppTextInput`, `AppDivider`, and `AppSnackbar`.
- Mobile uses single-column layout and sticky checkout bar.
- Desktop uses sidebar, cart item column, and summary column.
- README Cart row is updated.
- `docs/STORY_TRACKER.md` keeps STORY-007 as `READY_FOR_CODEX`.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 014: Checkout Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\1c38cba7-82f5-4ef9-81c4-d26e3df6a52f\pasted-text.txt`

Goal:
- Add a responsive Checkout Screen for mixed digital and electronics checkout.
- Group items by marketplace first, then seller.
- Show shipping address only for electronics/physical products.
- Show digital access rules, refund/return policy, PayPal-first payment selection, separate order warning, final review, and checkout summary.
- Add frontend mock API contracts and DTOs for future backend/payment integration.

Mock API Contracts:
- `POST /api/checkout/prepare`
- `POST /api/checkout/{checkoutId}/shipping-address`
- `POST /api/checkout/{checkoutId}/payment-method`
- `POST /api/checkout/{checkoutId}/acknowledge-policies`
- `POST /api/checkout/{checkoutId}/payment/start`
- `POST /api/payments/{paymentSessionId}/confirm`

Acceptance:
- Checkout uses STORY-000 wrappers: `AppButton`, `AppCard`, `AppBadge`, `AppTextInput`, `AppDivider`, `AppSnackbar`, `AppRadioButton`, `AppCheckbox`, and `AppLoadingIndicator`.
- PayPal is the only active MVP payment method.
- Future payment options show Coming Soon.
- User must acknowledge refund, return, and digital access rules before mocked payment start.
- No digital codes, raw download URLs, payment secrets, seller private data, buyer private data, or internal risk score are exposed.
- README and `docs/STORY_TRACKER.md` are updated.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 015: Premium Frontend Architecture Rule

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\5c87321e-d49d-4d87-b2d7-537191990279\pasted-text.txt`

Goal:
- Establish the premium frontend architecture rule for STORY-009 onward.
- Add Tamagui as the primary future styling/component system.
- Add FlashList, expo-image, Zeego, Legend-State, MMKV/localStorage, and Reanimated foundation.
- Configure providers/helpers without breaking existing Paper-based screens.
- Update README and `docs/STORY_TRACKER.md` with architecture readiness.

Architecture:
- Tamagui config: `tamagui.config.ts`
- Root provider: `TamaguiProvider` wraps the existing `PaperProvider`
- Reanimated plugin: `babel.config.js`
- Legend-State helper: `src/state/appState.ts`
- MMKV/localStorage helper: `src/storage/storage.ts`
- Heavy-list package: `@shopify/flash-list`
- Media package: `expo-image`
- Menu package: `zeego`

Acceptance:
- Future STORY-009+ screens have documented rules for Tamagui, FlashList, expo-image, Zeego, Legend-State, MMKV/localStorage, and Reanimated.
- README has `Premium Frontend Architecture`.
- `docs/STORY_TRACKER.md` uses architecture readiness columns.
- Existing screens still compile and render.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 016: Payment Success Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\377da738-d2d6-45f4-8fdc-76581c7dca89\pasted-text.txt`

Goal:
- Add a premium Payment Success screen for confirmed mixed marketplace orders.
- Show animated success feedback, safe PayPal reference, notification message, order groups, digital access status, electronics shipping status, receipt action, and next-step CTAs.
- Use Tamagui, Reanimated, FlashList, expo-image, Legend-State, and MMKV/localStorage baseline.

Mock API Contracts:
- `GET /api/payments/confirmation/{paymentSessionId}`
- `GET /api/orders/confirmation/{checkoutId}`
- `GET /api/orders?checkoutId={checkoutId}`
- `GET /api/digital-access/order/{orderId}`
- `GET /api/orders/{orderId}/receipt`

Security:
- Actual digital codes, raw download URLs, full provider payloads, payment secrets, seller private data, and internal risk score are not shown.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 017: Payment Failed / Cancelled Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\6ae6e1bb-f107-4641-a10a-72fd05d3cb28\pasted-text.txt`

Goal:
- Add a reusable premium Payment Failed / Cancelled screen for failed, cancelled, expired, declined, provider-error, and unknown payment states.
- Preserve checkout/cart recovery context, show safe payment attempt reference, checkout items labeled as not confirmed order, common reasons, digital access warning, and recovery actions.
- Use Tamagui, Reanimated, FlashList, expo-image, Legend-State, and MMKV/localStorage baseline.

Mock API Contracts:
- `GET /api/payments/attempts/{paymentAttemptId}`
- `GET /api/checkout/{checkoutId}/recovery-summary`
- `POST /api/checkout/{checkoutId}/revalidate`
- `POST /api/checkout/{checkoutId}/payment/retry`
- `POST /api/support/payment-issue`

Security:
- Digital codes, raw download URLs, PayPal raw response, provider secrets, seller private data, buyer address, and confirmed order labels are not shown.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build for `sharity-app`

## Story 018: Buyer Library Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\31e49315-688e-417a-851e-02651d7217e8\pasted-text.txt`

Goal:
- Add My Library as a secure digital purchase center for digital codes, gaming codes, software keys, gift cards, subscriptions, downloads, courses, and digital service orders.
- Keep electronics order management out of Library and route buyers back to marketplace/order flows where needed.
- Use Tamagui, FlashList, expo-image, Legend-State, MMKV/localStorage, and Reanimated baseline.

Mock API Contracts:
- `GET /api/library`
- `GET /api/library/items/{accessId}`
- `POST /api/library/items/{accessId}/reveal/prepare`
- `POST /api/library/items/{accessId}/reveal`
- `POST /api/library/items/{accessId}/reveal/{revealId}/end`
- `POST /api/library/items/{accessId}/download/prepare`
- `POST /api/library/items/{accessId}/download`
- `POST /api/library/items/{accessId}/report-issue`

Security:
- Library list never returns actual digital codes.
- Actual code appears only in the reveal mock response after warning and location consent.
- Revealed code is watermarked, not stored in MMKV/localStorage, and hidden when the app backgrounds.
- Secure download flow does not expose raw file URLs in the UI.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 019: Secure Download / Code Reveal Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\4446d5b8-ee8a-4062-8425-182267424992\pasted-text.txt`

Goal:
- Add separate secure access screens for code reveal and secure download.
- Protect code reveal with refund warning, approximate location consent, watermarking, a 60-second timer, manual hide, and app-background clearing.
- Show downloadable file list before download and require warning confirmation before generating a mocked signed download.

Mock API Contracts:
- `GET /api/library/items/{accessId}`
- `POST /api/library/items/{accessId}/reveal/prepare`
- `POST /api/library/items/{accessId}/reveal`
- `POST /api/library/items/{accessId}/reveal/{revealId}/end`
- `GET /api/library/items/{accessId}/files`
- `POST /api/library/items/{accessId}/files/{fileId}/download/prepare`
- `POST /api/library/items/{accessId}/files/{fileId}/download`
- `POST /api/library/items/{accessId}/report-invalid-code`
- `POST /api/support/digital-access`

Security:
- No copy button is shown.
- Actual code is displayed only in the dedicated reveal screen after warning and location consent.
- Revealed code is watermarked, hidden on timer/manual hide/background, and never stored in local persistence.
- Secure download does not expose raw or signed URLs in the UI.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 020: Orders Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\016a4c71-cf25-4586-8658-95f732ab13ae\pasted-text.txt`

Goal:
- Add My Orders as the buyer order history and tracking center for digital, electronics, mixed, cancelled, refunded, disputed, seller-delivery-pending, and shipping orders.
- Keep digital access protected by routing buyers to My Library instead of revealing codes or starting downloads from Orders.
- Support search, filters, sorting, receipt action, safe tracking summary, empty/loading/error states, and responsive layouts.

Mock API Contracts:
- `GET /api/orders`
- `GET /api/orders/summary-counts`
- `GET /api/orders/{orderId}`
- `GET /api/orders/{orderId}/receipt`
- `GET /api/orders/{orderId}/tracking-summary`

Security:
- No digital codes are shown.
- No raw download URLs are shown.
- Digital order cards show Go to Library only for access.
- Order list avoids buyer address, seller private data, payment provider payloads, and internal risk notes.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 021: Order Details Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\02394918-a739-4de0-b6e2-158390bf95a5\pasted-text.txt`

Goal:
- Add a buyer-safe Order Details screen for digital and electronics orders.
- Show order summary, product items, seller card, receipt action, digital access section, electronics shipping/tracking section, shipping address for electronics only, timeline, and eligibility-based actions.
- Keep digital code reveal/download inside Library and secure access screens.

Mock API Contracts:
- `GET /api/orders/{orderId}`
- `GET /api/orders/{orderId}/timeline`
- `GET /api/orders/{orderId}/receipt`
- `GET /api/orders/{orderId}/tracking`
- `GET /api/orders/{orderId}/cancel-eligibility`
- `POST /api/orders/{orderId}/cancel`
- `POST /api/orders/{orderId}/refunds`
- `POST /api/orders/{orderId}/disputes`
- `POST /api/orders/{orderId}/report`

Security:
- No digital codes are shown.
- No raw download URLs are shown.
- Seller private details and payment provider payloads are not exposed.
- Buyer shipping address is shown only for electronics orders.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 022: Tracking Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\fc952f2a-b2fd-41b0-95bd-90a65808d54d\pasted-text.txt`

Goal:
- Add a buyer-safe Track Package screen for electronics and future physical marketplace orders.
- Show shipment status, product/order summary, carrier details, masked tracking reference, masked delivery area, tracking timeline, delivery issue reporting, seller contact context, and refund/return eligibility.
- Keep digital orders out of the tracking flow.

Mock API Contracts:
- `GET /api/orders/{orderId}/tracking`
- `GET /api/orders/{orderId}/tracking/timeline`
- `POST /api/orders/{orderId}/delivery-issue`
- `GET /api/orders/{orderId}/refund-eligibility`
- `GET /api/orders/{orderId}/seller-contact-context`

Security:
- Buyer tracking access is scoped to the selected order.
- Only masked address summary and masked tracking reference are shown.
- Raw carrier payloads, seller private details, buyer full address, and payment/provider secrets are not exposed.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 023: Refund / Return Request Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\2ebec007-4d27-456e-b658-5e1816cbc01a\pasted-text.txt`

Goal:
- Add one reusable Request Refund / Return screen that adapts for digital and electronics orders.
- Show order summary, refund eligibility, buyer-safe digital access history, electronics return policy, reason selection, evidence upload, issue details, false-claim warning, and submit flow.
- Keep refund decisions backend-controlled and evidence private.

Mock API Contracts:
- `GET /api/orders/{orderId}/refund-eligibility`
- `GET /api/orders/{orderId}/refund-request/config`
- `POST /api/orders/{orderId}/refunds/evidence`
- `POST /api/orders/{orderId}/refunds`
- `GET /api/orders/{orderId}/refunds/latest`

Security:
- Digital code values are not shown.
- Raw download URLs are not shown.
- Exact location, IP address, device ID, internal risk score, and private evidence storage details are not exposed.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 024: Refund / Return Status Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\1973737b-dd88-492f-a715-f31805b0ce96\pasted-text.txt`

Goal:
- Add one reusable Return / Refund Status screen for digital and electronics refund/return requests.
- Show current status, estimated refund amount, timeline, buyer-safe seller/admin responses, digital access summary, electronics return instructions, requested evidence upload, cancel request, and dispute escalation eligibility.
- Keep statuses, actions, estimated amount, and escalation backend-controlled through mock contracts.

Mock API Contracts:
- `GET /api/refunds/{refundRequestId}`
- `GET /api/refunds/{refundRequestId}/timeline`
- `POST /api/refunds/{refundRequestId}/evidence`
- `POST /api/refunds/{refundRequestId}/cancel`
- `POST /api/refunds/{refundRequestId}/dispute`
- `GET /api/refunds/{refundRequestId}/return-instructions`

Security:
- Buyer-safe seller/admin responses only.
- Digital code, raw download URL, exact location, IP address, device ID, internal risk score, private admin notes, and seller private contact/address are not exposed.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

## Story 025: Open Dispute Screen

Status: Done

Source:
- `C:\Users\HP\.codex\attachments\3cc7bb10-6220-44d3-9eb2-4dff001d90ce\pasted-text.txt`

Goal:
- Add a reusable Open Dispute screen for digital, electronics, refund/return, seller abuse/scam, and payment/refund disputes.
- Show order/refund context, dispute eligibility, buyer-safe history, adaptive reason selection, required evidence upload, possible outcomes, strong warning acknowledgment, and Sharity Review submission.
- Route successful mock submissions to a temporary dispute status handoff ahead of STORY-019.

Mock API Contracts:
- `GET /api/orders/{orderId}/dispute-eligibility`
- `GET /api/orders/{orderId}/dispute/config`
- `GET /api/orders/{orderId}/dispute/context`
- `POST /api/orders/{orderId}/disputes/evidence`
- `POST /api/orders/{orderId}/disputes`
- `GET /api/orders/{orderId}/disputes/latest`

Security:
- Digital codes, raw download URLs, exact location, IP address, device ID, internal risk score, admin private notes, seller private contact details, and raw carrier payloads are not exposed.
- Evidence is treated as private and access-controlled.

Validation:
- `npm run typecheck`
- `npm run lint`
- Docker build and HTTP check passed for `sharity-app`

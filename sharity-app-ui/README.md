# Sharity App

Clean story-by-story Expo React Native TypeScript rebuild.

## Commands

```powershell
npm install
npm run typecheck
npm run lint
npm run build:web
cd C:\Users\HP\projects\deployments
docker compose up -d --build sharity-app
```

Run the app only through Docker. Do not start a separate Expo dev server for local review.

## Current Story

See [STORY_TRACKER.md](STORY_TRACKER.md).

## Sharity UI Design System

Sharity uses `react-native-paper` with a Material 3 theme, wrapped by Sharity UI components. Screens should import Sharity wrappers from `src/components/ui` instead of using Paper directly in feature files.

The active palette is a modern marketplace palette: purple and blue primary accents, light neutral app background, white cards, clean gray borders, green success, amber warning, and red error. All palette values live in `src/theme/colors.ts`.

Theme files:
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/theme/radius.ts`
- `src/theme/shadows.ts`
- `src/theme/breakpoints.ts`
- `src/theme/paperTheme.ts`
- `src/theme/index.ts`

Wrapper components:
- `AppButton`, `AppSearchBar`, `AppTextInput`, `AppCard`, `AppChip`, `AppBadge`
- `AppDialog`, `AppSnackbar`, `AppDivider`, `AppLoadingIndicator`
- `AppSwitch`, `AppCheckbox`, `AppRadioButton`, `AppMenu`

Screen/Page | Main UI Library Components | Sharity Wrapper Components | Notes
--- | --- | --- | ---
Splash | ActivityIndicator | AppLoadingIndicator | Minimal theme usage
Welcome Landing | Button, Card, Searchbar | AppButton, AppCard, AppSearchBar | Public landing variant
Home Dashboard | Button, Card, Badge | AppButton, AppCard, AppBadge | Dashboard layout
Marketplace Switcher | Card, Chip, Badge | AppCard, AppChip, AppBadge | Uses marketplace config
Digital Marketplace Home | Searchbar, Chip, Card | AppSearchBar, AppChip, AppCard | Left filters on desktop when added
Electronics Marketplace Home | Searchbar, Chip, Card | AppSearchBar, AppChip, AppCard, AppBadge | Condition badges
Product Details | Card, Button, Divider | AppCard, AppButton, AppDivider, AppBadge | Adaptive sections by product type
Cart | Card, Button, TextInput, Divider, Badge, Snackbar | AppCard, AppButton, AppTextInput, AppDivider, AppBadge, AppSnackbar, CartItemCard, CartSummaryCard | Supports mixed digital/electronics cart, grouped checkout, warnings, coupon, sticky checkout action
Checkout | Card, Button, RadioButton, Checkbox, TextInput, Divider, Snackbar, Dialog | AppCard, AppButton, AppRadioButton, AppCheckbox, AppTextInput, AppDivider, AppSnackbar, CheckoutOrderGroupCard, CheckoutSummaryCard | Supports marketplace/seller grouping, shipping only for electronics, PayPal-first checkout, policy acknowledgment, final review step
Payment Success | Card, Button, Snackbar | AppCard, AppButton, AppSnackbar, AppBadge | Planned success receipt
Buyer Library | Tamagui Card, Input, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Secure digital library with filters, masked codes, reveal consent, secure downloads
Code Reveal / Secure Download | Tamagui Card, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Separate protected access screens for reveal and download
Orders | Tamagui Card, Input, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Buyer order history with safe digital/electronics actions
Order Details | Tamagui Card, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Buyer-safe full order view with timeline, seller, receipt, tracking, and action eligibility
Order Receipt | Tamagui Card, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Buyer-safe receipt with marketplace groups, payment summary, refund history, and safe payment reference
Tracking | Tamagui Card, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Buyer-safe shipment tracking with masked address and delivery issue actions
Refund / Return Request | Tamagui Card, Button, TextArea, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Digital/electronics refund form with eligibility, evidence, and buyer-safe access history
Refund / Return Status | Tamagui Card, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Status dashboard with timeline, evidence requests, seller/admin responses, and return instructions
Open Dispute | Tamagui Card, Button, TextArea, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Serious issue escalation with required evidence and Sharity Review warning
Sharity Review Status | Tamagui Card, Button, FlashList, expo-image | Tamagui tokens with Sharity theme baseline | Buyer dispute status with timeline, outcome, evidence request, close dispute, and safe responses
Notification Center | Tamagui Card, Button, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Buyer/seller/system alert center with grouped feed, read/archive, critical alerts, deep links, and preferences
Profile & Privacy | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Buyer/seller profile, aliases, privacy controls, digital privacy, blocked users, export, and delete account
Account Switcher | Tamagui Card, Button, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Buyer/seller mode switch, marketplace modules, country/admin availability, seller onboarding eligibility, remembered safe preferences
Cart & Checkout | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Multi-seller grouped cart, buyer service fee, seller/platform coupons, digital terms, authorize-first notice, seller order split
Payment Authorization | Tamagui Card, Button, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | PayPal-first authorization, provider-decided auth model, seller acceptance before capture, partial acceptance, capture/release status
Pricing, Fees & Promotions | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Admin pricing rules, buyer service fee, seller commission, coupons, fee waivers, free products, simulator, snapshots
Sharity Credit & Rewards | Tamagui Card, Button, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Buyer credit balance/history, giveaways, multi-seller credit allocation, seller-safe promo impact, admin campaigns, simulator, abuse review, audit
Request Refund | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Seller-order/item scoped refund request with digital eligibility, evidence, refund breakdown, payout hold, escalation, timeline, physical return placeholders
Country & Marketplace Settings | Tamagui Card, Button, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Admin country marketplace config, buyer/seller availability, eligibility, feature flags, display order, simulator, audit
Verification & Payout Eligibility | Tamagui Card, Button, Progress, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Seller verification checklist, PayPal-first payout setup, blockers, marketplace eligibility, limits, documents, admin review, badges
Policies & Terms | Tamagui Card, Button, FlashList, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Versioned buyer/seller policy acceptance, re-acceptance, blockers, what-changed summary, history, admin preview
Help & Support | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Help search, guided troubleshooting, ticket creation, related entities, evidence, replies, timeline, escalation, admin/support placeholder
Login & Security | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Login methods, Google/Apple/password linking, devices/sessions, alerts, re-auth, recovery, suspicious activity, admin security placeholder
App Settings | Tamagui Card, Button, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Theme, language, region/country shortcut, currency display, marketplace preferences, notifications, accessibility, cache, app about
Notification Center | Tamagui Card, Button, Input, FlashList, expo-image, Zeego, Legend-State, Reanimated | Tamagui tokens with Sharity theme baseline | Buyer/seller inbox, unread badges, critical pinned alerts, related entities, actions, read/archive, filters, admin broadcast placeholder
Seller Dashboard | Card, Button, Menu | AppCard, AppButton, AppMenu, AppBadge | Planned seller management
Profile | Card, TextInput, Switch | AppCard, AppTextInput, AppSwitch, AppButton | Planned profile and privacy settings

How to change colors globally:
- Edit `src/theme/colors.ts`.
- Keep screen files importing color tokens from `src/theme`.
- Do not hardcode random colors in screens.

How to add a new screen:
- Use `src/theme` tokens for spacing, radius, typography, and colors.
- Use `src/components/ui` wrappers for buttons, cards, search, chips, badges, dialogs, and form controls.
- Use `useResponsiveLayout` from `src/hooks/useResponsiveLayout.ts` for mobile, tablet, desktop, and large desktop decisions.
- Use `src/utils/responsive.ts` for non-hook responsive helpers.
- Add the story to `STORY_TRACKER.md` and `docs/STORY_TRACKER.md`.

How to add a new marketplace card:
- Use `AppCard` for the card shell.
- Use `AppBadge` for Active, Coming Soon, Verified, Warning, Discount, and marketplace status labels.
- Keep marketplace availability data in feature config or API mapping, not embedded in styles.

How to add a new badge/status:
- Add or reuse an `AppBadge` variant.
- Add any new semantic color only in `src/theme/colors.ts`.

Responsive layouts:
- Mobile: single column, bottom tabs where useful, sticky purchase/checkout actions.
- Tablet/iPad: two-column layouts and sidebar where width allows.
- Desktop web: sidebar or top navigation, left filters, product grids, wider content.

UI coding rules:
- Do use Sharity wrapper components and theme tokens.
- Do keep colors, spacing, type, radius, and shadows centralized.
- Do not hardcode colors in screen files.
- Do not create one-off search boxes, badges, or button styles when a wrapper exists.
- Do not start the app outside Docker for local review.

Checkout backend usage:
- Frontend route: `/checkout` and `/app/checkout`
- Backend services used: `marketplace-service`, `payment-service`
- Main APIs: prepare checkout, save shipping address, select payment method, acknowledge policies, start payment, confirm payment
- Auth requirement: login required before payment
- MVP payment method: PayPal first; card, Apple Pay, Google Pay, and wallet are future options
- Current frontend implementation uses mock checkout contracts until backend/payment integration is ready

## Premium Frontend Architecture

This rule applies from STORY-009 onward and should guide refactors of earlier screens.

Tamagui:
- Tamagui is the primary styling and component system for new premium screens.
- Config lives in `tamagui.config.ts`.
- `TamaguiProvider` is configured at the app root, outside the existing Paper provider.
- Future screen components should use Tamagui tokens and responsive props instead of one-off `StyleSheet` values.

FlashList:
- Use `@shopify/flash-list` for heavy product grids, marketplace feeds, orders, libraries, carts with many items, and seller dashboards.
- Always provide `estimatedItemSize`.
- Use stable keys and memoized item components where useful.

expo-image:
- Use `expo-image` for product images, seller avatars, marketplace banners, category cards, and galleries.
- Define dimensions or aspect ratios to avoid layout shift.
- Use caching and blurhash placeholders where available.

Zeego:
- Use Zeego for product menus, seller menus, cart item menus, filter/sort menus, profile menus, and other action menus.
- Keep menu behavior accessible on web and native-feeling on iOS/macOS.

Legend-State:
- Use `@legendapp/state` for granular observable state such as cart count, product likes, filters, selected marketplace, live pricing, and checkout state.
- Avoid global screen-level subscriptions that re-render full screens unnecessarily.
- Initial app state helper lives in `src/state/appState.ts`.

MMKV/localStorage:
- Use `react-native-mmkv` for fast native local persistence.
- Use guarded `localStorage` fallback for web.
- Storage helper lives in `src/storage/storage.ts`.
- Do not store sensitive tokens insecurely.

Reanimated:
- Use `react-native-reanimated` for premium micro-interactions such as button press states, product hover/touch lift, image fade-in, modal transitions, cart quantity changes, and payment feedback.
- `react-native-reanimated/plugin` is configured in `babel.config.js`.

Performance rules:
- Target smooth 60 FPS minimum and 120 FPS capability where supported.
- Avoid layout shift, unnecessary full-screen re-renders, and unbounded image memory usage.
- Prefer skeleton states, stable dimensions, memoized renderers, and granular observable updates.

SSR/native-web compatibility:
- Avoid unguarded web-only APIs in native components.
- Avoid unguarded native-only APIs on web.
- Use platform guards for storage and provider-specific behavior.
- Keep navigation and render paths compatible with Expo native and React Native Web.

Premium screen architecture table:

Screen/Page | Frontend Stack | Performance Notes | Backend Services | Main APIs
--- | --- | --- | --- | ---
Payment Success | Tamagui, Reanimated, Legend-State, expo-image, FlashList, Zeego if menu needed | Animated checkmark, staggered order cards, isolated access status updates | payment-service, marketplace-service | payment confirmation, order confirmation summary, digital access status, receipt view
Payment Failed / Cancelled | Tamagui, Reanimated, Legend-State, FlashList for checkout items, expo-image, Zeego if menu needed | Calm warning animation, preserved checkout state, isolated retry/loading state | payment-service, marketplace-service | payment attempt status, checkout recovery summary, revalidate checkout, retry payment, payment support ticket
Buyer Library | Tamagui, FlashList, expo-image, Zeego if action menu needed, Legend-State, MMKV/localStorage, Reanimated | FlashList library grid, isolated filter/search/access state, secure reveal modal, screenshot/screen-recording protection where supported | marketplace-service, file-storage-service, future digital-access-service/risk-service | library list, item details, reveal prepare, reveal code, reveal end, secure download prepare, secure download, report issue
Code Reveal / Secure Download | Tamagui, FlashList for download files, expo-image, Zeego if action menu needed, Legend-State, MMKV/localStorage, Reanimated | Dedicated vault/file-locker screens, 60-second reveal timer, watermarked code area, isolated download selection and loading state | marketplace-service, file-storage-service, future digital-access-service/risk-service/audit-service/support-service | secure access item, reveal prepare, reveal code, reveal end, files list, download prepare, secure download URL, invalid code report, support ticket
My Orders | Tamagui, FlashList, expo-image, Zeego if order action menu needed, Legend-State, MMKV/localStorage, Reanimated | FlashList order feed, isolated search/filter/sort state, animated order cards, memoized status badges | marketplace-service, payment-service, future order-service/shipping-service/receipt-service | buyer orders list, summary counts, order details, receipt, tracking summary
Order Details | Tamagui, FlashList for timeline/items, expo-image, Zeego if actions menu needed, Legend-State, Reanimated | Memoized order sections, animated timeline/status badges, isolated eligibility/action state | marketplace-service, payment-service, future order-service/refund-service/dispute-service/shipping-service | order details, timeline, receipt, tracking, cancel eligibility, cancel order, refund start, dispute start, report issue
Order Receipt | Tamagui, FlashList for grouped receipt line items/refund history, expo-image for product thumbnails, Zeego, Legend-State, Reanimated | Memoized receipt groups, animated totals/refund history, isolated expand/collapse state | marketplace-service, payment-service, future receipt-service/refund-service/order-service | get receipt by order, get receipt by receipt ID, receipt refund history, future PDF/email receipt
Tracking | Tamagui, FlashList for tracking timeline, expo-image, Zeego if action menu needed, Legend-State, Reanimated | Animated timeline, isolated tracking status updates, memoized timeline events | marketplace-service, future shipping-service/order-service/support-service | tracking details, tracking timeline, delivery issue, refund eligibility, seller contact context
Refund / Return Request | Tamagui, FlashList for evidence/reason lists, expo-image for evidence previews, Zeego, Legend-State, Reanimated | Isolated form state, animated eligibility cards, upload progress, memoized evidence list | marketplace-service, file-storage-service, future refund-service/return-service/risk-service/admin-service | refund eligibility, refund form config, evidence upload, submit refund request, latest refund request
Refund / Return Status | Tamagui, FlashList for timeline/evidence lists, expo-image for evidence/product previews, Zeego, Legend-State, Reanimated | Animated status timeline, isolated status/action state, memoized timeline cards, smooth evidence upload panel | marketplace-service, file-storage-service, future refund-service/return-service/dispute-service/admin-service | refund status, refund timeline, evidence upload, cancel refund, open dispute, return instructions
Open Dispute | Tamagui, FlashList for evidence/reason/history lists, expo-image for evidence/product previews, Zeego, Legend-State, Reanimated | Isolated form state, animated eligibility/history cards, upload progress, memoized evidence list | marketplace-service, file-storage-service, future dispute-service/refund-service/risk-service/admin-service | dispute eligibility, dispute config, dispute context, evidence upload, create dispute, latest dispute
Sharity Review Status | Tamagui, FlashList for timeline/evidence lists, expo-image for evidence/product previews, Zeego, Legend-State, Reanimated | Animated dispute status timeline, isolated action/status state, memoized timeline cards, smooth evidence upload panel | marketplace-service, file-storage-service, future dispute-service/refund-service/return-service/admin-service | dispute status, dispute timeline, evidence upload, close dispute, dispute actions
Notification Center | Tamagui, FlashList for grouped notification feed, expo-image for product/marketplace/avatar icons, Zeego for notification actions/filters, Legend-State, Reanimated | FlashList paginated feed, memoized notification rows, isolated read/archive/filter state, animated critical/action-required highlights | notification-service or marketplace-service stub, future user-service/seller-service/order-service/refund-service/dispute-service/payout-service/listing-service/messaging-service/security-service | notification feed, summary counts, mark read, mark unread, mark all read, archive, notification details, resolve action, preferences route
Profile & Privacy | Tamagui, FlashList for privacy/message/block/badge lists, expo-image for profile/store avatars, Zeego for selectors/actions, Legend-State, Reanimated | Memoized setting rows, isolated profile/privacy/message state, animated privacy toggles, avatar upload, real-name warning, delete account modal | user-service/auth-user module, marketplace-service, file-storage-service, future user-profile-service/privacy-service/seller-service/messaging-service/moderation-service/data-privacy-service | profile privacy, update profile, buyer alias, seller alias, store name, alias availability, photo upload, privacy settings, message privacy, blocked users, report user, verification badges, data export, delete account eligibility, delete account request
Account Switcher | Tamagui, FlashList for marketplace module list, expo-image for buyer/seller avatars and marketplace icons, Zeego for dropdown/menus, Legend-State, Reanimated | Memoized mode/marketplace rows, isolated switch/preference state, animated mobile bottom sheet and mode transitions | auth/user module, marketplace-service, seller-service, future marketplace-config-service/country-config-service/verification-service/payout-service | account switcher summary, switch mode, switch marketplace, marketplace preferences, seller mode eligibility, country marketplace availability
Cart & Checkout | Tamagui, FlashList for seller-grouped cart/items/validation lists, expo-image for product/store images, Zeego for item/coupon/actions, Legend-State, Reanimated | Memoized cart rows, isolated seller group pricing/validation state, animated coupon/terms/validation transitions, sticky checkout summary | marketplace-service, payment-service, wallet-service later, future cart-service/checkout-service/pricing-service/coupon-service/payment-orchestration-service/order-service/digital-inventory-service | get cart, add/update/remove item, save for later, apply/remove coupon, validate cart, refresh pricing, accept digital terms, checkout preview, create checkout session, start payment authorization
Payment Authorization | Tamagui, FlashList for seller order authorization/status/timeline lists, expo-image for provider/store/product icons, Zeego for provider/actions, Legend-State, Reanimated | Memoized seller order status rows, isolated authorization/capture/acceptance state, animated provider redirect/status/partial acceptance transitions | payment-service, marketplace-service, future checkout-service/payment-orchestration-service/order-service/seller-order-service/digital-delivery-service/notification-service | payment authorization screen, start PayPal authorization, confirm PayPal return, Stripe later, authorization status, timeline, retry/cancel authorization, seller accept/reject/request more time, seller order authorization status
Pricing, Fees & Promotions | Tamagui, FlashList for pricing rules/coupons/fee waivers/audit logs, expo-image for marketplace/seller icons, Zeego for rule selectors/actions, Legend-State, Reanimated | Memoized rule rows, isolated editor/simulator/audit state, animated conflict warnings and simulation results | marketplace-service, payment-service, future pricing-service/coupon-service/promotion-service/fee-service/checkout-service/order-service/payout-service/risk-service/audit-service | admin pricing rules, coupons, fee waivers, free product rules, pricing simulation, conflicts, audit log, seller pricing summary, seller coupons, checkout pricing calculation, buyer pricing display, pricing snapshot
Sharity Credit & Rewards | Tamagui, FlashList for credit history/campaigns/claims/audit logs, expo-image for campaign/giveaway/marketplace images, Zeego for campaign/actions/selectors, Legend-State, Reanimated | Memoized credit/campaign rows, isolated balance/application/claim/admin state, animated credit apply/remove and giveaway claim transitions | future wallet-service/reward-service/promotion-service/pricing-service/checkout-service/order-service/digital-delivery-service/risk-service/audit-service | rewards dashboard, credit balance/history, available rewards, claim giveaway, apply/remove credit, credit allocation, seller promotion impact, admin campaigns, manual credit, issuance/redemption history, abuse review, simulator, audit log
Request Refund | Tamagui, FlashList for seller order/item/evidence/timeline lists, expo-image for product/evidence/store images, Zeego for reason/evidence/actions, Legend-State, Reanimated | Memoized seller order/item rows, isolated refund reason/evidence/estimate/timeline state, animated eligibility, breakdown, upload, and timeline transitions | marketplace-service, payment-service, wallet-service placeholder, file-storage-service, future refund-service/order-service/seller-order-service/digital-access-service/payout-service/dispute-service | parent order refund summary, seller order refund eligibility, item refund eligibility, refund reasons, refund estimate, evidence upload, submit refund, refund details, timeline, cancel, escalate, breakdown
Country & Marketplace Settings | Tamagui, FlashList for country/marketplace/feature/audit lists, expo-image for marketplace/country icons, Zeego for selectors/actions, Legend-State, Reanimated | Memoized country/marketplace rows, isolated config/feature/simulation state, animated rule editor and simulation results | marketplace-service, admin-service, future marketplace-config-service/country-config-service/feature-flag-service/eligibility-service/audit-service | country configs, marketplace config detail, create/update config, enable/disable/coming soon, availability, eligibility, feature flags, display order, simulation, audit log, versions, user marketplace availability, registration countries, country change validation
Verification & Payout Eligibility | Tamagui, FlashList for checklist/blockers/marketplace eligibility/limits/timeline lists, expo-image for badges/provider/marketplace icons, Zeego for actions/selectors, Legend-State, Reanimated | Memoized verification rows, isolated payout/blocker/marketplace/document state, animated checklist progress, eligibility changes, document upload, admin review timeline | marketplace-service, payment-service, file-storage-service, future seller-service/verification-service/payout-service/provider-onboarding-service/marketplace-config-service/document-service/audit-service | seller verification dashboard, payout eligibility, verification checklist, marketplace eligibility, limits, PayPal connect, document requirements/upload, admin review request, timeline, badges, admin approve/reject/request more info
Policies & Terms | Tamagui, FlashList for policy groups/required policies/history/version lists, expo-image for category/marketplace/country icons, Zeego for actions/selectors, Legend-State, Reanimated | Memoized policy rows, isolated acceptance/detail/what-changed/blocking state, animated required-policy banners and accept/re-accept transitions | user-service/auth-user module, marketplace-service, static policy provider, future policy-service/legal-content-service/checkout-service/order-service/audit-service/admin-service | policies dashboard, required policies by context, policy detail, policy changes, accept policy, accept all required, acceptance history, download copy, blocking status, accept digital checkout terms, admin policy versions/preview
Help & Support | Tamagui, FlashList for FAQ/tickets/messages/timeline/attachments, expo-image for product/store/attachment/category icons, Zeego for category/actions/selectors, Legend-State, Reanimated | Memoized ticket/message rows, isolated search/filter/create/reply/timeline state, animated guided help, ticket creation, attachment upload, timeline and escalation transitions | marketplace-service, file-storage-service, notification-service, future support-service/ticket-service/knowledge-base-service/messaging-service/audit-service/admin-service | support dashboard, search, categories, guided help, self-service suggestions, create ticket, ticket list/detail, replies, attachments, timeline, escalation, close/reopen, related entities, admin support queue placeholder

Buyer Library backend/security usage:
- Frontend routes: `/library`, `/buyer/library`, `/app/library`, `/app/buyer/library`
- Backend services: `marketplace-service`, `file-storage-service`, future `digital-access-service`, `risk-service`, `audit-service`
- Main APIs: `GET /api/library`, `GET /api/library/items/{accessId}`, `POST /api/library/items/{accessId}/reveal/prepare`, `POST /api/library/items/{accessId}/reveal`, `POST /api/library/items/{accessId}/reveal/{revealId}/end`, `POST /api/library/items/{accessId}/download/prepare`, `POST /api/library/items/{accessId}/download`, `POST /api/library/items/{accessId}/report-issue`
- DTOs: `LibraryResponse`, `LibraryItem`, `RevealPrepareResponse`, `RevealCodeRequest`, `RevealCodeResponse`, `SecureDownloadResponse`
- Security notes: library list never includes actual codes, reveal requires warning plus location consent, revealed code is watermarked, revealed code is not stored in MMKV/localStorage, raw download URLs are not shown in the UI

Secure access backend/security usage:
- Frontend routes: `/library/code/[accessId]`, `/library/download/[accessId]`, `/app/library/code/[accessId]`, `/app/library/download/[accessId]`
- Backend services: `marketplace-service`, `file-storage-service`, future `digital-access-service`, `risk-service`, `audit-service`, `support-service`
- Main APIs: `GET /api/library/items/{accessId}`, `POST /api/library/items/{accessId}/reveal/prepare`, `POST /api/library/items/{accessId}/reveal`, `POST /api/library/items/{accessId}/reveal/{revealId}/end`, `GET /api/library/items/{accessId}/files`, `POST /api/library/items/{accessId}/files/{fileId}/download/prepare`, `POST /api/library/items/{accessId}/files/{fileId}/download`, `POST /api/library/items/{accessId}/report-invalid-code`, `POST /api/support/digital-access`
- DTOs: `SecureAccessItemResponse`, `RevealPrepareResponse`, `RevealCodeRequest`, `RevealCodeResponse`, `EndRevealRequest`, `DownloadFileItem`, `SecureDownloadResponse`, `InvalidCodeReportRequest`
- Security notes: no copy button, no raw file URL display, revealed code clears on background/timer/manual hide, location consent is explicit, external camera capture is mitigated with watermarking and reveal tracking

Orders backend/security usage:
- Frontend routes: `/orders`, `/app/orders`
- Backend services: `marketplace-service`, `payment-service`, future `order-service`, `shipping-service`, `receipt-service`, `refund-service`, `dispute-service`
- Main APIs: `GET /api/orders`, `GET /api/orders/summary-counts`, `GET /api/orders/{orderId}`, `GET /api/orders/{orderId}/receipt`, `GET /api/orders/{orderId}/tracking-summary`
- DTOs: `OrdersResponse`, `OrderListItem`, `OrderSummaryCounts`, `TrackingSummary`, `ReceiptSummary`
- Security notes: order list is buyer-only, digital orders show Go to Library only, no direct code reveal/download actions, no actual digital codes, no raw download URLs, no seller private data, no buyer address in the list

Order Details backend/security usage:
- Frontend routes: `/orders/[orderId]`, `/app/orders/[orderId]`
- Backend services: `marketplace-service`, `payment-service`, future `order-service`, `refund-service`, `dispute-service`, `shipping-service`, `seller-service`
- Main APIs: `GET /api/orders/{orderId}`, `GET /api/orders/{orderId}/timeline`, `GET /api/orders/{orderId}/receipt`, `GET /api/orders/{orderId}/tracking`, `GET /api/orders/{orderId}/cancel-eligibility`, `POST /api/orders/{orderId}/cancel`, `POST /api/orders/{orderId}/refunds`, `POST /api/orders/{orderId}/disputes`, `POST /api/orders/{orderId}/report`
- DTOs: `OrderDetailsResponse`, `OrderDetails`, `OrderDetailsItem`, `SellerSummary`, `DigitalAccessSummary`, `ShippingSummary`, `BuyerShippingAddress`, `OrderTimelineEvent`, `OrderEligibility`
- Security notes: buyer-only order access, no digital codes, no raw file URLs, no seller private data, buyer shipping address only for electronics, no payment provider payload or internal risk notes

Order Receipt backend/security usage:
- Frontend routes: `/orders/[orderId]/receipt`, `/receipts/[receiptId]`, `/app/orders/[orderId]/receipt`, `/app/receipts/[receiptId]`
- Backend services: `marketplace-service`, `payment-service`, future `receipt-service`, `refund-service`, `order-service`, `digital-access-service`, `shipping-service`
- Main APIs: `GET /api/orders/{orderId}/receipt`, `GET /api/receipts/{receiptId}`, `GET /api/receipts/{receiptId}/refund-history`, future `POST /api/receipts/{receiptId}/pdf`, future `POST /api/receipts/{receiptId}/email`
- DTOs: `ReceiptResponse`, `ReceiptHeader`, `ReceiptPaymentSummary`, `ReceiptMarketplaceGroup`, `ReceiptItem`, `ReceiptFeeBreakdown`, `ReceiptAddressSummary`, `ReceiptDigitalAccessSummary`, `ReceiptRefundHistoryItem`, `ReceiptAvailableActions`
- Security notes: buyer-only receipt access, safe payment reference only, no seller payout/commission/reserve/internal margin, no digital code, no raw/signed download URL, no provider secrets or raw provider payload

Tracking backend/security usage:
- Frontend routes: `/orders/[orderId]/tracking`, `/app/orders/[orderId]/tracking`
- Backend services: `marketplace-service`, future `shipping-service`, `order-service`, `support-service`, `refund-service`
- Main APIs: `GET /api/orders/{orderId}/tracking`, `GET /api/orders/{orderId}/tracking/timeline`, `POST /api/orders/{orderId}/delivery-issue`, `GET /api/orders/{orderId}/refund-eligibility`, `GET /api/orders/{orderId}/seller-contact-context`
- DTOs: `TrackingDetailsResponse`, `OrderTracking`, `ShipmentSummary`, `CarrierSummary`, `MaskedAddress`, `TrackingTimelineEvent`, `RefundReturnEligibility`, `DeliveryIssueRequest`
- Security notes: buyer-only tracking access, masked address only, masked tracking reference only, no raw carrier payload, no seller private data, no full buyer address

Refund / Return Request backend/security usage:
- Frontend routes: `/orders/[orderId]/refund`, `/app/orders/[orderId]/refund`
- Backend services: `marketplace-service`, `file-storage-service`, future `refund-service`, `return-service`, `risk-service`, `admin-service`
- Main APIs: `GET /api/orders/{orderId}/refund-eligibility`, `GET /api/orders/{orderId}/refund-request/config`, `POST /api/orders/{orderId}/refunds/evidence`, `POST /api/orders/{orderId}/refunds`, `GET /api/orders/{orderId}/refunds/latest`
- DTOs: `RefundEligibilityResponse`, `RefundReasonOption`, `DigitalAccessHistorySummary`, `ElectronicsReturnPolicySummary`, `EvidenceUploadResponse`, `SubmitRefundRequest`, `SubmitRefundResponse`
- Security notes: buyer-only refund access, no digital code, no raw download URL, no exact location/IP/device/risk score exposed, private evidence storage

Refund / Return Status backend/security usage:
- Frontend routes: `/orders/[orderId]/refund/status`, `/refunds/[refundRequestId]`, `/app/orders/[orderId]/refund/status`, `/app/refunds/[refundRequestId]`
- Backend services: `marketplace-service`, `file-storage-service`, future `refund-service`, `return-service`, `dispute-service`, `admin-service`
- Main APIs: `GET /api/refunds/{refundRequestId}`, `GET /api/refunds/{refundRequestId}/timeline`, `POST /api/refunds/{refundRequestId}/evidence`, `POST /api/refunds/{refundRequestId}/cancel`, `POST /api/refunds/{refundRequestId}/dispute`, `GET /api/refunds/{refundRequestId}/return-instructions`
- DTOs: `RefundStatusResponse`, `RefundRequestSummary`, `RefundStatusSummary`, `EstimatedRefundAmount`, `RefundTimelineEvent`, `SellerResponseSummary`, `AdminDecisionSummary`, `ReturnInstructions`, `RefundAvailableActions`
- Security notes: buyer-only refund access, buyer-safe seller/admin responses, no digital code, no raw download URL, no exact location/IP/device/risk score exposed

Open Dispute backend/security usage:
- Frontend routes: `/orders/[orderId]/dispute`, `/refunds/[refundRequestId]/dispute`, `/app/orders/[orderId]/dispute`, `/app/refunds/[refundRequestId]/dispute`
- Backend services: `marketplace-service`, `file-storage-service`, future `dispute-service`, `refund-service`, `risk-service`, `admin-service`
- Main APIs: `GET /api/orders/{orderId}/dispute-eligibility`, `GET /api/orders/{orderId}/dispute/config`, `GET /api/orders/{orderId}/dispute/context`, `POST /api/orders/{orderId}/disputes/evidence`, `POST /api/orders/{orderId}/disputes`, `GET /api/orders/{orderId}/disputes/latest`
- DTOs: `DisputeEligibilityResponse`, `DisputeReasonOption`, `DisputeContextResponse`, `DisputeOrderSummary`, `DisputeDigitalAccessSummary`, `DisputeShippingSummary`, `DisputeEvidenceUploadResponse`, `CreateDisputeRequest`, `CreateDisputeResponse`
- Security notes: buyer-only dispute access, no digital code, no raw download URL, no exact location/IP/device/risk score exposed, private evidence storage

Sharity Review Status backend/security usage:
- Frontend routes: `/disputes/[disputeId]`, `/orders/[orderId]/dispute/status`, `/app/disputes/[disputeId]`, `/app/orders/[orderId]/dispute/status`
- Backend services: `marketplace-service`, `file-storage-service`, future `dispute-service`, `refund-service`, `return-service`, `digital-access-service`, `seller-service`, `admin-service`
- Main APIs: `GET /api/disputes/{disputeId}`, `GET /api/disputes/{disputeId}/timeline`, `POST /api/disputes/{disputeId}/evidence`, `POST /api/disputes/{disputeId}/close`, `GET /api/disputes/{disputeId}/actions`
- DTOs: `DisputeStatusResponse`, `DisputeSummary`, `DisputeStatusSummary`, `DisputeEstimatedRefund`, `DisputeDigitalAccessSummary`, `DisputeShippingReturnSummary`, `DisputeSellerResponseSummary`, `DisputeAdminDecisionSummary`, `DisputeOutcomeSummary`, `DisputeTimelineEvent`, `DisputeAvailableActions`
- Security notes: buyer-only dispute access, buyer-safe seller/admin responses, no digital code, no raw download URL, no exact location/IP/device/risk score exposed, estimated refund marked estimated until final decision

Notification Center backend/security usage:
- Frontend routes: `/notifications`, `/app/notifications`
- Backend services: `notification-service` or `marketplace-service` stub, future `user-service`, `seller-service`, `order-service`, `refund-service`, `dispute-service`, `payout-service`, `listing-service`, `messaging-service`, `security-service`
- Main APIs: `GET /api/notifications`, `GET /api/notifications/summary-counts`, `POST /api/notifications/{notificationId}/read`, `POST /api/notifications/{notificationId}/unread`, `POST /api/notifications/read-all`, `POST /api/notifications/{notificationId}/archive`, `GET /api/notifications/{notificationId}`, `POST /api/notifications/{notificationId}/resolve-action`, `GET /api/notifications/preferences-route`
- DTOs: `NotificationFeedResponse`, `NotificationItem`, `NotificationGroup`, `NotificationSummaryCounts`, `NotificationAvailableActions`, `NotificationDeepLink`, `NotificationActionResponse`
- Security notes: user/seller-scoped notifications, no digital codes/raw URLs/provider payloads/internal risk/admin notes/private contact details, critical notifications non-dismissible until resolved, deep-link access revalidated on target screen

Profile & Privacy backend/security usage:
- Frontend routes: `/profile/privacy`, `/settings/profile-privacy`, `/app/profile/privacy`, `/app/settings/profile-privacy`
- Backend services: `user-service`/auth-user module, `marketplace-service`, `file-storage-service`, future `user-profile-service`, `privacy-service`, `seller-service`, `messaging-service`, `moderation-service`, `data-privacy-service`
- Main APIs: `GET /api/profile/privacy`, `PATCH /api/profile`, `PATCH /api/profile/buyer-alias`, `PATCH /api/profile/seller-alias`, `PATCH /api/profile/store-name`, `GET /api/profile/aliases/check`, `POST /api/profile/photo`, `PATCH /api/profile/privacy`, `PATCH /api/profile/message-privacy`, `GET /api/profile/blocked-users`, `POST /api/profile/blocked-users`, `DELETE /api/profile/blocked-users/{blockedUserId}`, `POST /api/profile/reports`, `GET /api/profile/verification-badges`, `POST /api/profile/data-export`, `GET /api/profile/data-export`, `GET /api/profile/delete-account/eligibility`, `POST /api/profile/delete-account`
- DTOs: `ProfilePrivacySettingsResponse`, `UserProfileSettings`, `BuyerProfileSettings`, `SellerProfilePrivacySettings`, `PrivacySettings`, `DigitalProductPrivacySettings`, `MessagePrivacySettings`, `VerificationBadgeItem`, `BlockedUserItem`, `ReportUserRequest`, `DataExportStatus`, `DeleteAccountEligibility`, `DeleteAccountRequest`, `ProfilePrivacyAvailableActions`
- Security notes: real name hidden by default, DOB/gender compliance-only/private, phone/email not public, alias-first digital privacy, no internal risk/admin notes, secure data export, protected account deletion

Account Switcher backend/security usage:
- Frontend routes: `/account-switcher`, `/switch-account`, `/switch-mode`, `/app/account-switcher`, `/app/switch-account`, `/app/switch-mode`
- Backend services: `auth/user` module, `marketplace-service`, `seller-service`, future `marketplace-config-service`, `country-config-service`, `verification-service`, `payout-service`
- Main APIs: `GET /api/account/switcher`, `POST /api/account/switch-mode`, `POST /api/account/switch-marketplace`, `GET /api/account/marketplace-preferences`, `PATCH /api/account/marketplace-preferences`, `GET /api/account/seller-mode-eligibility`, `GET /api/account/marketplace-availability`
- DTOs: `AccountSwitcherResponse`, `BuyerIdentitySummary`, `SellerIdentitySummary`, `AccountModeAvailability`, `MarketplaceModuleAvailability`, `MarketplacePreferenceUpdateRequest`, `SwitchAccountModeRequest`, `SwitchAccountModeResponse`, `SellerModeEligibility`, `AccountSwitcherAvailableActions`
- Security notes: buyer default, seller mode requires onboarding, country/admin marketplace controls, no legal identity/provider secrets/KYC/internal risk/admin notes, local preference cannot override backend permissions

Cart & Checkout backend/security usage:
- Frontend routes: `/cart`, `/checkout/review`, `/app/cart`, `/app/checkout/review`
- Backend services: `marketplace-service`, `payment-service`, future `cart-service`, `checkout-service`, `pricing-service`, `coupon-service`, `payment-orchestration-service`, `order-service`, `digital-inventory-service`
- Main APIs: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/{cartItemId}`, `DELETE /api/cart/items/{cartItemId}`, `POST /api/cart/items/{cartItemId}/save-for-later`, `POST /api/cart/items/{cartItemId}/move-to-cart`, `POST /api/cart/coupons/apply`, `POST /api/cart/coupons/remove`, `POST /api/cart/validate`, `POST /api/cart/pricing/refresh`, `POST /api/cart/digital-terms/accept`, `GET /api/checkout/preview`, `POST /api/checkout/session`, `POST /api/checkout/payment-authorization/start`
- DTOs: `CartResponse`, `CartSellerGroup`, `CartItem`, `CartPricingSummary`, `CartCoupon`, `CartValidationSummary`, `CartValidationIssue`, `CartDigitalTerms`, `CheckoutPreviewResponse`, `ParentOrderPreview`, `SellerOrderPreview`, `CreateCheckoutSessionRequest`, `CreateCheckoutSessionResponse`
- Security notes: buyer-safe pricing only, no seller commission/internal fee waiver/risk/pricing config, backend pricing validation, digital terms audit, no digital codes/raw URLs/payment provider payload in cart

Payment Authorization backend/security usage:
- Frontend routes: `/checkout/payment-authorization`, `/checkout/payment-status`, `/orders/[parentOrderId]/authorization-status`, `/app/checkout/payment-authorization`, `/app/checkout/payment-status`, `/app/orders/[parentOrderId]/authorization-status`
- Backend services: `payment-service`, `marketplace-service`, future `checkout-service`, `payment-orchestration-service`, `order-service`, `seller-order-service`, `digital-delivery-service`, `notification-service`
- Main APIs: `GET /api/checkout/sessions/{checkoutSessionId}/payment-authorization`, `POST /api/checkout/sessions/{checkoutSessionId}/paypal/authorize`, `POST /api/checkout/sessions/{checkoutSessionId}/paypal/confirm`, `POST /api/checkout/sessions/{checkoutSessionId}/stripe/authorize`, `GET /api/checkout/sessions/{checkoutSessionId}/authorization-status`, `GET /api/checkout/sessions/{checkoutSessionId}/timeline`, `POST /api/checkout/sessions/{checkoutSessionId}/authorization/retry`, `POST /api/checkout/sessions/{checkoutSessionId}/authorization/cancel`, seller accept/reject/more-time/status APIs
- DTOs: `PaymentAuthorizationScreenResponse`, `PaymentProviderOption`, `PaymentAuthorizationPricingSummary`, `SellerAcceptanceSummary`, `SellerOrderAuthorizationStatus`, `DigitalDeliveryEligibilitySummary`, `PaymentTimelineEvent`, `StartPayPalAuthorizationResponse`, `ConfirmPayPalAuthorizationRequest`, `ConfirmPayPalAuthorizationResponse`, `SellerOrderAcceptanceRequest`, `SellerOrderAcceptanceResponse`
- Security notes: PayPal first, one buyer payment UX, backend/provider authorization model, no provider payload/tokens/card data, seller acceptance backend-controlled, digital delivery only after capture/order eligibility

Pricing, Fees & Promotions backend/security usage:
- Frontend routes: `/admin/pricing`, `/admin/pricing/rules`, `/admin/pricing/coupons`, `/admin/pricing/fee-waivers`, `/admin/pricing/free-products`, `/admin/pricing/simulator`, `/admin/pricing/audit-log`, `/seller/pricing`, `/seller/coupons`, `/seller/promotions`, `/app/admin/pricing`, `/app/seller/pricing`
- Backend services: `marketplace-service`, `payment-service`, future `pricing-service`, `coupon-service`, `promotion-service`, `fee-service`, `checkout-service`, `order-service`, `payout-service`, `risk-service`, `audit-service`
- Main APIs: admin pricing rules, coupons, fee waivers, free product rules, pricing simulation, conflicts, audit log, seller pricing summary, seller coupons, checkout pricing calculation, buyer pricing display, pricing snapshot
- DTOs: `PricingRule`, `CouponRule`, `FeeWaiverSellerRule`, `FreeProductRule`, `PricingSimulationRequest`, `PricingSimulationResponse`, `BuyerPricingDisplay`, `SellerPricingDisplay`, `AdminPricingBreakdown`, `PricingSnapshot`, `PricingAuditLogItem`
- Security notes: buyer-safe pricing only, seller-safe fee summary only, admin-only full pricing rules, no seller commission to buyer, no internal risk/provider/admin private data, immutable pricing snapshots

Sharity Credit & Rewards backend/security usage:
- Frontend routes: `/rewards`, `/credits`, `/sharity-credit`, `/rewards/history`, `/giveaways`, seller promotion impact routes, and admin rewards routes under `/admin/rewards`
- Backend services: future `wallet-service`, `reward-service`, `promotion-service`, `pricing-service`, `checkout-service`, `order-service`, `digital-delivery-service`, `risk-service`, `audit-service`
- Main APIs: rewards dashboard, credit balance/history, available rewards, claim giveaway, apply/remove credit, credit allocation, seller promotion impact, admin campaigns, manual credit, issuance/redemption history, abuse review, simulator, audit log
- DTOs: `RewardsDashboardResponse`, `SharityCreditBalance`, `CreditTypeBalance`, `CreditHistoryItem`, `RewardCampaignSummary`, `GiveawayClaimRequest`, `GiveawayClaimResponse`, `ApplyCreditRequest`, `ApplyCreditResponse`, `CreditAllocationSummary`, `CreditAllocationItem`, `SellerPromotionImpactResponse`, `RewardCampaignConfig`, `AntiAbuseSettings`, `ManualCreditIssueRequest`, `RewardSimulationRequest`, `RewardSimulationResponse`, `RewardsAuditLogItem`
- Security notes: buyer-scoped credit data, seller-safe promotion impact only, admin-only campaign controls, backend-controlled credit allocation, no internal risk/IP/device/provider/wallet secrets, free digital products still use secure delivery and order/access records

Buyer Refund Per Seller Order backend/security usage:
- Frontend routes: `/orders/[parentOrderId]/refund`, `/orders/[parentOrderId]/seller-orders/[sellerOrderId]/refund`, `/orders/[parentOrderId]/seller-orders/[sellerOrderId]/items/[sellerOrderItemId]/refund`, `/refunds/[refundRequestId]`, `/refunds/[refundRequestId]/timeline`
- Backend services: `marketplace-service`, `payment-service`, `wallet-service` placeholder, `file-storage-service`, future `refund-service`, `order-service`, `seller-order-service`, `digital-access-service`, `payout-service`, `dispute-service`
- Main APIs: parent order refund summary, seller order refund eligibility, item refund eligibility, refund reasons, refund estimate, evidence upload, submit refund, refund details, timeline, cancel, escalate, breakdown
- DTOs: `ParentOrderRefundSummaryResponse`, `SellerOrderRefundSummary`, `SellerOrderItemRefundEligibility`, `DigitalRefundAccessContext`, `RefundReasonOption`, `RefundEstimateRequest`, `RefundEstimateResponse`, `RefundBreakdown`, `RefundEvidenceItem`, `SubmitRefundRequest`, `SubmitRefundResponse`, `RefundTimelineEvent`, `CancelRefundRequest`, `EscalateRefundRequest`
- Security notes: buyer-owned seller-order refund only, no digital codes/raw URLs/internal risk/admin notes, backend refund amount validation, seller-order scoped payout hold, policy-controlled evidence visibility

Help & Support backend/security usage:
- Frontend routes: `/support`, `/help`, `/help-center`, `/support/tickets`, `/support/tickets/create`, `/support/tickets/[ticketId]`, `/support/tickets/[ticketId]/timeline`, and admin support placeholder routes
- Backend services: `marketplace-service`, `file-storage-service`, `notification-service`, future `support-service`, `ticket-service`, `knowledge-base-service`, `messaging-service`, `audit-service`, `admin-service`
- Main APIs: support dashboard, search, categories, guided help, self-service suggestions, create ticket, ticket list/detail, replies, attachments, timeline, escalation, close/reopen, related entities, admin support queue placeholder
- DTOs: `SupportDashboardResponse`, `SupportCategoryItem`, `HelpSearchResultItem`, `GuidedHelpFlowResponse`, `GuidedHelpStep`, `SelfServiceSuggestionItem`, `CreateSupportTicketRequest`, `CreateSupportTicketResponse`, `SupportTicketSummary`, `SupportTicketDetail`, `SupportRelatedEntity`, `SupportTicketMessage`, `SupportAttachmentItem`, `SupportTicketTimelineEvent`, `ReplySupportTicketRequest`, `EscalateSupportTicketRequest`, `SupportTicketActionResponse`, `AdminSupportQueueItem`
- Security notes: Sharity-only support replies, access-controlled related entities/attachments, unsafe content blocking, no digital codes/passwords/card details/provider payloads/internal risk/admin notes/staff direct contact

Login & Security backend/security usage:
- Frontend routes: `/settings/security`, `/login-security`, device/alert/recovery/login-method route aliases, and admin security placeholder routes
- Backend services: `authorization-server`, user-service/auth-user module, notification-service, future account-security/session/device/audit/risk/support/admin services
- Main APIs: security dashboard, login methods, Google/Apple link, add/change password, unlink method, devices/sessions, revoke/sign out, alerts, event history, re-auth, recovery options, suspicious activity report, admin security review placeholder
- DTOs: `SecurityDashboardResponse`, `LoginMethodItem`, `DeviceSessionItem`, `SecurityAlertItem`, `SecurityEventHistoryItem`, `ReauthenticationChallengeResponse`, `RecoveryOptionItem`, `SuspiciousActivityReportResponse`, `SecurityActionResponse`, `AdminSecurityReviewQueueItem`
- Security notes: never remove final login method, re-auth for high-risk actions, approximate location only, no passwords/OAuth tokens/provider payloads/raw IP/exact GPS/internal risk/admin notes in UI or local storage

App Settings backend/security usage:
- Frontend routes: `/settings`, `/settings/app`, `/settings/theme`, `/settings/language`, `/settings/region`, `/settings/currency`, `/settings/marketplaces`, `/settings/notifications`, `/settings/accessibility`, `/settings/about`
- Backend services: user-service/auth-user module, marketplace-service, notification-service, future user-preferences/notification-preferences/app-config/audit services
- Main APIs: app settings dashboard, theme, language, region summary, currency options/update, marketplace preferences/update/reorder/default, notification preferences/update, accessibility preferences/update, app about/version
- DTOs: `AppSettingsDashboardResponse`, `ThemePreference`, `LanguagePreference`, `RegionSummary`, `CurrencyDisplayPreference`, `MarketplacePreferenceItem`, `NotificationPreferenceItem`, `AccessibilityPreference`, `AppAboutInfo`, `SettingsActionResponse`
- Security notes: admin config separate, country change routed to profile flow, backend controls currency/marketplace/mandatory notifications, no sensitive data in local cache, clear cache does not silently clear auth/session

Notification Center backend/security usage:
- Frontend routes: `/notifications`, `/notification-center`, `/notifications/[notificationId]`, `/notifications/preferences`, and admin broadcast placeholder routes
- Backend services: notification-service, user-service/auth-user module, marketplace-service, future push/email/preference/audit/admin-broadcast services
- Main APIs: notification dashboard, list, detail, search, mark read/unread/all read, archive, action validation/open, counts, preferences summary, admin broadcasts/templates placeholder
- DTOs: `NotificationCenterDashboardResponse`, `NotificationUnreadCounts`, `NotificationItem`, `NotificationRelatedEntity`, `NotificationAction`, `NotificationDeliveryChannelStatus`, `NotificationFilterOption`, `NotificationTimeGroup`, `NotificationActionResponse`, `NotificationPreferenceSummary`, `AdminBroadcastSummary`
- Security notes: user-scoped notifications, seller ownership checks, related entity access validation, archive does not delete audit history, critical alerts mandatory, no provider payloads/digital codes/raw URLs/security raw payloads/internal risk/admin notes

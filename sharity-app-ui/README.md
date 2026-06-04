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

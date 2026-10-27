# PHASES 2-19: COMPLETE MVP IMPLEMENTATION PLAN

**Goal:** Complete all 14 remaining build steps to create full, revenue-ready MVP  
**Timeline:** All phases on claude_fixes branch (no merge to main until complete)  
**Scope:** 35 MVP stories, 39 authenticated screens, full buyer+seller flows

---

## EXECUTION STRATEGY (Consolidated Approach)

Instead of 14 separate phases, group by functional area:

### GROUP A: BUYER DISCOVERY & PURCHASE FLOW (Steps 6-11) - CRITICAL PATH
**Timeline:** 12-15 hours  
**Outcome:** Full purchase flow working (Home → Product → Cart → Checkout → Payment → Order)

1. **Step 6: Home Screen** (2h) - Wrap in AppShell, verify dashboard loads
2. **Step 7: Marketplace Browsing** (2h) - Category + product listing
3. **Step 8: Product Details** (2h) - Gallery, seller info, reviews
4. **Step 9: Cart Management** (2h) - Add/remove items, coupons
5. **Step 10: Checkout Flow** (2h) - Validation, shipping, billing
6. **Step 11: Payment & Orders** (2h) - PayPal real integration, order confirmation

### GROUP B: BUYER SUPPORT FLOWS (Steps 12-14) - HIGH PRIORITY
**Timeline:** 6-8 hours  
**Outcome:** Buyers can manage orders, refunds, disputes

7. **Step 12: Orders & Tracking** (2h) - View orders, track shipment
8. **Step 13: Refund & Dispute** (2h) - Request refund, open dispute
9. **Step 14: Notifications & Support** (2h) - Real-time alerts, help desk

### GROUP C: SELLER FLOWS (Steps 15-19) - MEDIUM PRIORITY
**Timeline:** 8-10 hours  
**Outcome:** Sellers can list products, fulfill orders, manage payouts

10. **Step 15: Seller Onboarding** (2h) - KYC, seller eligibility
11. **Step 16: Create Listing** (2h) - Product upload, inventory
12. **Step 17: Seller Orders** (2h) - Accept/reject, fulfillment
13. **Step 18: Payouts & Wallet** (2h) - Earnings, payout status
14. **Step 19: Privacy & Settings** (2h) - Account settings, preferences

---

## BACKEND API INTEGRATION SUMMARY

### Verified Controllers Exist:
- ✅ AuthController (authorization)
- ✅ MarketplaceController (marketplace home)
- ✅ CategoryMarketplaceController (categories, products)
- ✅ CartCheckoutMockController (cart, checkout)
- ✅ PaymentAuthorizationMockController (payment)
- ✅ BuyerCommerceFlowMockController (orders, refunds)
- ✅ SellerVerificationMockController (seller onboarding)
- ✅ SellerListingMockController (product listing)
- ✅ BillingMockController (invoices, payouts)
- ✅ NotificationMockController (alerts)
- ✅ PrivacyPublicDisplayMockController (settings, preferences)

### API Endpoint Pattern:
```
Base URL: /marketplace-service/api/v1/marketplace/
Payment: /payment-service/api/v1/payment/
Auth: /authorization-server/api/v1/auth/
```

### Frontend Service Files (Where to add API calls):
- `src/services/marketplaceApi.ts` - Marketplace endpoints
- `src/services/cartApi.ts` - Cart/checkout endpoints (create if not exists)
- `src/services/ordersApi.ts` - Orders/refunds endpoints
- `src/services/paymentApi.ts` - Payment endpoints (create if not exists)
- `src/services/sellerApi.ts` - Seller endpoints (create if not exists)

---

## PHASE-BY-PHASE IMPLEMENTATION CHECKLIST

### PHASE 2: BUYER DISCOVERY & PURCHASE (Group A - Steps 6-11)

**STEP 6: Home Screen (2 hours)**
- [ ] Import InteriorShell
- [ ] Remove isDesktop logic (InteriorShell handles)
- [ ] Remove DashboardSidebar, DashboardHeader, BottomTabs functions
- [ ] Replace hardcoded surface colors with theme tokens
- [ ] Wrap content in InteriorShell (activeLabel="Home")
- [ ] Verify marketplaceHome API call works
- [ ] Test responsive at 900px breakpoint
- [ ] Commit: "Step 6: Home screen - AppShell wrapped, dashboard functional"

**STEP 7: Marketplace Browsing (2 hours)**
- [ ] MarketplaceHomeScreen: Wrap in AppShell
- [ ] CategoryScreen: Wrap in AppShell
- [ ] ElectronicsMarketplaceScreen: Wrap in AppShell
- [ ] Verify getMarketplaceCategories() API works
- [ ] Test category browsing → product listing
- [ ] Test search/filter functionality
- [ ] Verify responsive design
- [ ] Commit: "Step 7: Marketplace browsing - Categories, products, search working"

**STEP 8: Product Details (2 hours)**
- [ ] ProductDetailsScreen: Wrap in AppShell
- [ ] ElectronicsProductDetailsScreen: Wrap in AppShell
- [ ] Implement product image gallery (using expo-image)
- [ ] Display seller info, ratings, reviews
- [ ] Implement "Add to Cart" button (wire to cart API)
- [ ] Verify responsive design
- [ ] Commit: "Step 8: Product details - Gallery, seller info, add to cart"

**STEP 9: Cart Management (2 hours)**
- [ ] Verify CartScreen is properly wrapped in AppShell
- [ ] Test getCart() API call
- [ ] Implement addToCart() API integration
- [ ] Implement updateCart() (quantity changes)
- [ ] Implement removeFromCart() functionality
- [ ] Test coupon application (applyCoupon() API)
- [ ] Verify responsive design at all breakpoints
- [ ] Commit: "Step 9: Cart management - Add/remove items, coupons working"

**STEP 10: Checkout Flow (2 hours)**
- [ ] CheckoutScreen: Wrap in AppShell
- [ ] Implement form validation (shipping, billing, contact)
- [ ] Wire to createCheckout() API
- [ ] Implement validateCheckout() before proceeding
- [ ] Display pricing breakdown, taxes, fees
- [ ] Show PayPal payment button integration
- [ ] Verify responsive design
- [ ] Commit: "Step 10: Checkout flow - Validation, pricing, PayPal button"

**STEP 11: Payment & Orders (2 hours)**
- [ ] PaymentAuthorizationScreen: Wrap in AppShell
- [ ] PaymentSuccessScreen: Wrap in AppShell
- [ ] PaymentFailedScreen: Wrap in AppShell
- [ ] Implement PayPal SDK integration (real or sandbox)
- [ ] Wire payment authorization flow
- [ ] Create order on successful payment
- [ ] Display order confirmation with details
- [ ] Test end-to-end: Cart → Checkout → Payment → Order
- [ ] Commit: "Step 11: Payment & orders - Full purchase flow working"

### PHASE 3: BUYER SUPPORT (Group B - Steps 12-14)

**STEP 12: Orders & Tracking (2 hours)**
- [ ] OrdersScreen: Wrap in AppShell
- [ ] OrderDetailsScreen: Wrap in AppShell
- [ ] TrackingScreen: Wrap in AppShell
- [ ] Implement getBuyerOrders() API call
- [ ] Display order list with status
- [ ] Implement order details view
- [ ] Implement tracking updates
- [ ] Commit: "Step 12: Orders & tracking - Order list, details, tracking"

**STEP 13: Refund & Dispute (2 hours)**
- [ ] RefundRequestScreen: Wrap in AppShell
- [ ] RefundStatusScreen: Wrap in AppShell
- [ ] DisputeStatusScreen: Wrap in AppShell
- [ ] Implement refund request API
- [ ] Implement dispute open API
- [ ] Display refund/dispute status
- [ ] Commit: "Step 13: Refund & dispute - Request, track, resolve"

**STEP 14: Notifications & Support (2 hours)**
- [ ] NotificationCenterScreen: Wrap in AppShell
- [ ] SupportScreen: Wrap in AppShell
- [ ] Implement notification polling/websocket
- [ ] Display real-time order alerts
- [ ] Implement help desk ticket creation
- [ ] Commit: "Step 14: Notifications & support - Real-time alerts, help desk"

### PHASE 4: SELLER FLOWS (Group C - Steps 15-19)

**STEP 15: Seller Onboarding (2 hours)**
- [ ] SellerVerificationScreen: Wrap in AppShell
- [ ] Implement KYC form (identity, banking)
- [ ] Verify seller eligibility API
- [ ] Display verification status
- [ ] Commit: "Step 15: Seller onboarding - KYC, eligibility checks"

**STEP 16: Create Listing (2 hours)**
- [ ] CreateListingScreen: Wrap in AppShell
- [ ] Implement product upload form
- [ ] Image upload to Cloudflare R2
- [ ] Implement pricing, inventory, shipping
- [ ] Implement listing preview
- [ ] Commit: "Step 16: Create listing - Form, images, preview"

**STEP 17: Seller Orders (2 hours)**
- [ ] SellerOrdersScreen: Wrap in AppShell
- [ ] SellerOrderDetailScreen: Wrap in AppShell
- [ ] Display incoming orders
- [ ] Implement accept/reject order
- [ ] Implement fulfillment tracking
- [ ] Commit: "Step 17: Seller orders - Accept, fulfill, track"

**STEP 18: Payouts & Wallet (2 hours)**
- [ ] SellerPayoutScreen: Wrap in AppShell
- [ ] WalletScreen: Wrap in AppShell
- [ ] Display seller earnings
- [ ] Display payout history
- [ ] Implement payout request
- [ ] Commit: "Step 18: Payouts - Earnings, payout status"

**STEP 19: Privacy & Settings (2 hours)**
- [ ] ProfilePrivacyScreen: Wrap in AppShell
- [ ] AppSettingsScreen: Wrap in AppShell
- [ ] AccountSwitcherScreen: Wrap in AppShell
- [ ] Implement privacy preferences
- [ ] Implement app settings
- [ ] Commit: "Step 19: Privacy & settings - Preferences, account"

---

## DAILY EXECUTION SCHEDULE

### Day 1: Buyer Discovery (6-8 hours)
- Morning: Steps 6-7 (Home, Marketplace)
- Afternoon: Step 8 (Product Details)
- Evening: Commit batch 1

### Day 2: Buyer Purchase (6-8 hours)
- Morning: Step 9 (Cart)
- Afternoon: Step 10 (Checkout)
- Evening: Step 11 (Payment & Orders), Commit batch 2

### Day 3: Buyer Support (4-6 hours)
- Morning: Steps 12-13 (Orders, Refunds)
- Afternoon: Step 14 (Notifications)
- Evening: Commit batch 3

### Day 4: Seller Flows (6-8 hours)
- Morning: Steps 15-16 (Onboarding, Listing)
- Afternoon: Steps 17-19 (Orders, Payouts, Settings)
- Evening: Final commit, complete testing

### Day 5: Final Testing & Polish (4-6 hours)
- TypeScript: 0 errors
- ESLint: 0 errors
- E2E testing: Full purchase flow
- Responsive design: All breakpoints
- Performance: Startup < 2s, navigation < 300ms

---

## SUCCESS CRITERIA FOR COMPLETION

### Code Quality
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ No console warnings/errors
- ✅ No broken imports

### Functional Completeness
- ✅ Home screen fully functional
- ✅ Can browse categories and products
- ✅ Can view product details
- ✅ Can add items to cart
- ✅ Can checkout with validation
- ✅ Can authorize payment (PayPal)
- ✅ Can see order confirmation
- ✅ Can track orders
- ✅ Can request refunds
- ✅ Can get notifications
- ✅ Sellers can list products
- ✅ Sellers can accept orders
- ✅ Sellers can view payouts

### Design & UX
- ✅ All screens use AppShell (no custom headers)
- ✅ Responsive at 375px, 768px, 900px, 1366px, 1920px
- ✅ Consistent spacing (theme tokens)
- ✅ Consistent colors (theme tokens)
- ✅ Touch targets >= 44px
- ✅ Color contrast >= 4.5:1

### Performance
- ✅ Startup time < 2 seconds
- ✅ Navigation time < 300ms
- ✅ Image loading < 1s (mobile)
- ✅ List rendering 60fps (100+ items)

### Documentation
- ✅ All phases committed with clear messages
- ✅ Implementation notes in commits
- ✅ Final summary document created
- ✅ API integration documented

---

## RISK MITIGATION

### If Backend API Missing:
```
STOP immediately
Report: Missing API name, required contract, where needed
Request: Backend implementation approval
Timeline: +10-20 hours for backend dev
```

### If PayPal Integration Fails:
```
Fallback to sandbox mode (testing only)
Or implement mock payment flow (for demo)
Note: Production would need real PayPal account
```

### If Performance Issues:
```
Profile with React DevTools
Check for unnecessary re-renders
Optimize image loading
Implement lazy loading for lists
Cache API responses with MMKV
```

### If Responsive Design Breaks:
```
Check InteriorShell wrapping (should handle most)
Verify no hardcoded widths
Use flex/space tokens consistently
Test with actual devices (not just browser)
```

---

## GIT COMMIT STRATEGY

Commits per phase group (not per individual step):

```
Commit 1: Phase 2 (Steps 6-11) - "Buyer discovery & purchase flow complete"
Commit 2: Phase 3 (Steps 12-14) - "Buyer support flows complete"
Commit 3: Phase 4 (Steps 15-19) - "Seller flows complete"
Commit 4: Final - "All phases complete: MVP ready for testing"
```

Total: 4-6 final commits (from current 7 Phase 1 commits)

---

## FINAL DELIVERABLES

On completion of all phases:

1. **Working MVP** - Full end-to-end system
2. **All 39 Screens** - Using AppShell pattern
3. **All 35 Stories** - Implemented and working
4. **Documentation** - Implementation notes, API reference
5. **Test Results** - TypeScript, ESLint, responsive, performance
6. **Commit History** - Clear progression from Phase 1-19

---

**Status:** Ready to start Phase 2  
**Timeline:** 4-5 days full-time (all phases)  
**Complexity:** High (full system integration)  
**Confidence:** High (backend structure exists, patterns established)  
**Next:** Begin PHASE 2 GROUP A (Buyer Discovery & Purchase Flow)

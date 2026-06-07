# PHASE 2: MVP FEATURE COMPLETION & INTEGRATION

**Timeline:** Build Steps 6-19 (14 major features)  
**Status:** Most screens exist - need AppShell wrapping + API integration  
**Priority:** Revenue-critical purchase flow (Steps 6-11)

---

## CRITICAL PATH: BUYER PURCHASE FLOW

### STEP 6: HomeScreen (Dashboard) - DEFERRED
**File:** `src/features/home/HomeScreen.tsx`
**Status:** Complex migration (has custom sidebar/header + responsive logic)
**Note:** HomeScreen currently has `isDesktop` logic that duplicates InteriorShell
**Action:** Defer to Phase 2-B (non-critical for MVP, but nice to have)
**Why Deferring:** Complex migration, low ROI vs effort (InteriorShell already handles layout)

### STEP 7: Marketplace Browsing - HIGH PRIORITY
**Files:**
- `src/features/marketplace/MarketplaceHomeScreen.tsx`
- `src/features/marketplace/CategoryScreen.tsx`
- `src/features/electronics/ElectronicsMarketplaceHomeScreen.tsx` (likely)

**Actions:**
1. Wrap each in InteriorShell (quick, copy-paste pattern)
2. Verify API calls work: `getMarketplaceHome()`, `getCategories()`
3. Test category/product browsing end-to-end

**Est. Time:** 2-3 hours (screens likely 80% complete)

### STEP 8: Product Details - HIGH PRIORITY
**Files:**
- `src/features/products/ProductDetailsScreen.tsx`
- `src/features/electronics/ElectronicsProductDetailsScreen.tsx`

**Actions:**
1. Wrap in InteriorShell
2. Verify product image gallery works
3. Test "Add to Cart" button

**Est. Time:** 1-2 hours

### STEP 9: Cart Management - CRITICAL (Already Wrapped)
**File:** `src/features/cart/CartScreen.tsx`
**Status:** ✅ Already partially wrapped in InteriorShell
**Actions:**
1. Verify AppShell wrapping is complete (check loading/empty states)
2. Test real cart API: `getCart()`, `addToCart()`, `updateCart()`
3. Test coupon application
4. Test responsive design at all breakpoints

**Est. Time:** 1-2 hours (mostly testing)

### STEP 10: Checkout Flow - CRITICAL
**File:** `src/features/checkout/CheckoutScreen.tsx`
**Status:** EXISTS (needs AppShell + verification)
**Actions:**
1. Wrap in InteriorShell
2. Verify form validation works
3. Test PayPal integration hook (ensure real, not mock)
4. Test checkout → payment flow

**Est. Time:** 2-3 hours

### STEP 11: Payment Authorization Result - CRITICAL
**Files:**
- `src/features/payment/PaymentAuthorizationScreen.tsx`
- `src/features/payment/PaymentSuccessScreen.tsx`
- `src/features/payment/PaymentFailedScreen.tsx`

**Actions:**
1. Wrap all three in InteriorShell
2. Wire to PayPal callbacks
3. Test payment success → order creation flow
4. Test payment failure recovery

**Est. Time:** 2-3 hours (depends on PayPal integration status)

---

## HIGH-VALUE SECONDARY: ORDER & SELLER FLOWS

### STEP 12: Buyer Orders - HIGH PRIORITY
**File:** `src/features/orders/OrdersScreen.tsx`
**Actions:**
1. Wrap in InteriorShell
2. Test orders API: `getBuyerOrders()`
3. Wire order list to order details screen

**Est. Time:** 1-2 hours

### STEPS 13-14: Seller Features - MEDIUM PRIORITY
**Files:** Seller onboarding, listing creation
**Actions:** Wrap in AppShell, verify APIs

**Est. Time:** 2-3 hours each

---

## IMPLEMENTATION SEQUENCE (Most Efficient)

### SESSION 1: Marketplace Browsing (2-3 hours)
1. Marketplace home → Wrap in AppShell
2. Category listing → Wrap in AppShell
3. Test end-to-end: Home → Browse → Product Details
4. **Result:** Can browse products

### SESSION 2: Cart + Checkout (2-3 hours)
1. Verify CartScreen wrapping complete
2. Checkout → Wrap in AppShell, verify validation
3. Test: Product → Add to Cart → Checkout
4. **Result:** Can checkout (awaiting payment integration)

### SESSION 3: Payment Integration (2-3 hours)
1. PayPal integration (real or sandbox)
2. Payment success/failure screens
3. Test: Checkout → PayPal → Order created
4. **Result:** Full purchase flow working, revenue-ready

### SESSION 4: Orders + Seller (2-3 hours)
1. Buyer orders listing
2. Seller onboarding
3. Seller listing creation
4. **Result:** Full MVP features complete

---

## SUCCESS CRITERIA FOR PHASE 2

- ✅ All authenticated screens use AppShell (no custom headers/sidebars)
- ✅ Full purchase flow works (Browse → Product → Cart → Checkout → Payment → Order)
- ✅ Real APIs connected (no mock data in critical path)
- ✅ PayPal integration working (real or sandbox)
- ✅ Responsive at all breakpoints (tested on 375px, 1366px, 1920px)
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Performance: <3s startup, <300ms navigation
- ✅ All screens tested manually (no regressions)

---

## IMMEDIATE NEXT STEPS

### BEFORE STARTING STEP 7:
1. **Verify Backend APIs:**
   - Check if marketplace APIs are implemented
   - Check if cart/order APIs are implemented
   - Check PayPal integration status

2. **Verify Data Models:**
   - Confirm API response formats match frontend types
   - Check if any API contracts need adjustment
   - Verify database relationships

3. **Setup Testing:**
   - Start dev server: `npx expo start`
   - Test in browser (web mode is easiest for debugging)
   - Have network inspector open to see API calls

### START WITH STEP 7:
1. Open `src/features/marketplace/MarketplaceHomeScreen.tsx`
2. Follow `QUICK_MIGRATION_REFERENCE.md` pattern
3. Wrap in InteriorShell
4. Test marketplace API is called
5. Verify products display
6. Move to Category screen (same pattern)

---

## ARCHITECTURE DECISIONS FOR PHASE 2

### AppShell is Mandatory
- Every authenticated screen MUST use InteriorShell
- No custom headers/sidebars (InteriorShell provides them)
- activeLabel prop highlights nav item (e.g., "Home", "Cart", "Orders")

### No Mock APIs
- Every API call must be to real backend
- If backend API is missing: STOP and request implementation
- Do NOT create fake data or stub responses

### Real Payment Only
- PayPal integration must be real (sandbox or production)
- No fake payment pages
- Test payment flow end-to-end

### Performance Critical
- Startup: < 2 seconds
- Navigation: < 300ms
- Image load: < 1 second
- Responsive: Tested at 5 breakpoints

---

## BLOCKER CHECKLIST

Before proceeding with Step 7, verify:

- [ ] Marketplace API implemented and accessible
- [ ] Cart API implemented and accessible
- [ ] Order API implemented and accessible
- [ ] PayPal sandbox/integration ready
- [ ] Database schema matches frontend types
- [ ] Auth token flow working (user authenticated)
- [ ] All APIs responding with correct data structures

**If any blockers exist:** Report immediately, request backend implementation

---

## ROLLBACK PLAN

If issues arise during Phase 2:
```bash
# Revert to Phase 1 completion state
git checkout main
# Or revert specific screen
git checkout HEAD -- src/features/marketplace/SomeScreen.tsx
```

All Phase 2 work is on separate commits - easily reversible.

---

## ESTIMATED PHASE 2 COMPLETION

| Component | Time | Dependencies |
|-----------|------|--------------|
| Marketplace browsing | 2-3h | Marketplace APIs |
| Product details | 1-2h | Product APIs |
| Cart management | 1-2h | Cart API |
| Checkout | 2-3h | Validation logic |
| Payment integration | 2-3h | PayPal setup |
| Orders | 1-2h | Order APIs |
| Seller features | 3-4h | Seller APIs |
| Testing/Polish | 2-3h | All above |
| **TOTAL** | **15-22h** | **Backend ready** |

**Phase 2 Goal:** Complete, wired, revenue-ready MVP  
**Phase 2 Status:** Ready to start Step 7 (Marketplace)  
**Next Executor:** Start with STEP 7 execution checklist above

---

**Phase 1 → Phase 2 Handoff: COMPLETE & READY**

# Feature Testing Checklist

## Session expiry and scrolling catalogs

- Feature APIs use `services/sessionFetch.ts`: a 401 clears local authentication and notifies `App.tsx` to show the signed-out storefront immediately. Server logout is best-effort; 403, 429 and 5xx must not sign users out.
- Home, guest Home and all marketplace verticals share `components/marketplace/ScrollPagination.tsx`. Scroll near the next batch to append 24 cards, or use the accessible Load more products button. Search, filters and sorting reset the visible batch.
- Pagination currently batches the fetched catalog in the UI; it does not add a backend pagination contract.
- [ ] Confirm the expiry message remains visible after reload and private routes remain inaccessible through browser Back.
- [ ] Confirm scrolling appends cards without duplicates on mobile and desktop, and changing filters resets the batch.
- Automated coverage: `tests/e2e/marketplace-catalog.spec.ts` and the chat failure cases in `tests/e2e/chat.spec.ts`.

## Physical cart checkout recovery

- [ ] A price-change POST `409` resolves through authenticated `GET /api/v1/marketplace/cart/{cartId}/checkout-attempt` with the original `Idempotency-Key`. A `200 {"checkout":null}` instructs the buyer to return to cart and review refreshed prices; only a changed snapshot gets a new key.
- [ ] A rejection whose locked resolution returns an existing checkout recovers that checkout without another POST or charge.
- [ ] A failed resolution, network timeout, or ambiguous server error preserves the submitted key and snapshot. Only explicit POST `4xx` or `503` responses trigger resolution; no checkout is cleared based on a status alone.
- [ ] After a definitive absence, reloading checkout still requires returning to cart for review. An unchanged reviewed snapshot retries with its original key.
- Automated coverage: `npm run typecheck`, `npm run build:e2e -- --incremental`, and `npx playwright test physical-cart-checkout.spec.ts`.

**Date:** June 7, 2026  
**Focus:** Verify bug fixes work correctly  

## 1. Date Picker Fix ✅ CODE VERIFIED

### Web (Browser)
- [ ] Navigate to registration screen (`/create-account`)
- [ ] Click on calendar icon next to "Date of Birth" field
- [ ] Verify HTML5 native date picker opens (browser default)
- [ ] Select a date (e.g., 01/15/2000)
- [ ] Verify date appears in field in mm/dd/yyyy format
- [ ] Verify form submits with correct date

### Mobile (iOS/Android)
- [ ] Navigate to registration screen
- [ ] Click on calendar icon next to "Date of Birth" field
- [ ] Verify custom DatePickerModal opens with scroll-wheel selectors
- [ ] Scroll to select Month (January-December)
- [ ] Scroll to select Day (01-31, respecting month limits)
- [ ] Scroll to select Year (defaults to ~20 years ago)
- [ ] Verify selected date preview updates in real-time
- [ ] Click "Select" button
- [ ] Verify date closes modal and updates field
- [ ] Verify form accepts the date value
- [ ] Click Cancel button (if needed) - verify no changes

### Edge Cases
- [ ] Test February in leap year (Feb 29)
- [ ] Test February in non-leap year (max 28)
- [ ] Test months with 30 days
- [ ] Test year boundary (very old, recent)

---

## 2. Photo Upload Fix ✅ CODE VERIFIED

### Profile Picture Upload
- [ ] Navigate to profile screen (`/profile-privacy`)
- [ ] Scroll to "Profile image" section
- [ ] Click "Add photo" button
- [ ] Select an image from device (JPG, PNG, or WEBP)
- [ ] Wait for upload to complete
- [ ] Verify success message: "Profile image updated"
- [ ] Verify profile picture displays in profile card
- [ ] **On Web:** Verify page refreshes after upload
- [ ] **On Mobile:** Verify profile reloads with new image

### Error Handling
- [ ] Attempt upload with no network → Expect: "Network error: Check your connection..."
- [ ] Attempt upload with file > 5MB → Expect: "Profile photo must be 5 MB or smaller."
- [ ] Cancel upload midway → Verify no change to profile
- [ ] Check browser/app console for error logs (should be detailed with filename, status)

### Network Issues
- [ ] Disable network
- [ ] Click "Add photo"
- [ ] Select an image
- [ ] Verify friendly error message appears
- [ ] Re-enable network
- [ ] Try again → Should work

---

## 3. Form Validation

### Registration Form
- [ ] Test required field validation (Email, Password, DOB)
- [ ] Test email format validation
- [ ] Test password strength requirements
- [ ] Submit with missing DOB → Expect error
- [ ] Submit with invalid date → Expect error
- [ ] Submit with valid data → Should succeed

### Profile Update Form
- [ ] Change first name → Save → Verify persists
- [ ] Change date of birth → Save → Verify persists
- [ ] Add phone number → Save → Verify persists
- [ ] Select country → Verify fields update
- [ ] Select gender → Save → Verify persists

---

## 4. Code Quality Verification

### TypeScript
```bash
npm run typecheck
# Expected: No errors
```

### Linting
```bash
npm run lint
# Expected: No warnings or errors
```

### Build
```bash
npm run build:web
# Expected: Build succeeds
```

---

## 5. Navigation & Routing

- [ ] `/create-account` loads (Registration)
- [ ] `/complete-registration` loads (Social completion)
- [ ] `/profile-privacy` loads (Profile)
- [ ] Back button works from registration
- [ ] Submit redirects to next screen
- [ ] All links in navigation work

---

## 6. Console Logging

### Expected Console Messages (when uploading photo)
```
✅ Profile image upload: {
  "status": 200,
  "statusText": "OK",
  "fileName": "profile-image.jpg"
}
```

### Verify No Red Errors
- No TypeScript errors in console

## 7. Marketplace multi-select filters

- [ ] Select two categories and verify listings from either category remain visible
- [ ] Clear categories with "All categories" and verify the full catalog returns
- [ ] Select two delivery methods and verify listings from either method remain visible
- [ ] Clear delivery methods with "All delivery methods"
- [ ] Combine multiple shopping preferences and verify the results satisfy every selected preference
- [ ] Clear all filters and verify the complete catalog returns
- No React warnings about missing dependencies
- No network 404 errors for APIs
- No CSS warnings

---

## 7. Browser Compatibility

- [ ] Chrome/Edge (Windows/Mac)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (Windows/Mac)
- [ ] Mobile browsers (iOS Safari, Chrome)

---

## Pass/Fail Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Date Picker (Web) | ⚪ | |
| Date Picker (Mobile) | ⚪ | |
| Photo Upload | ⚪ | |
| Error Handling | ⚪ | |
| Form Validation | ⚪ | |
| Navigation | ⚪ | |
| Build Quality | ⚪ | |

**Legend:** ⚪ Not tested | 🟡 Partial | ✅ Pass | ❌ Fail

---

## Issues Found

**Issue 1:** (if any)
- **Description:**
- **Steps to Reproduce:**
- **Expected:**
- **Actual:**
- **Severity:** Critical / High / Medium / Low

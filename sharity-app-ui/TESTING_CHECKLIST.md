# Feature Testing Checklist

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

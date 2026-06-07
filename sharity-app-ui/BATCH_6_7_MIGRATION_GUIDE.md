# BATCHES 6-7: Screen Migration to AppShell Pattern

**Status:** Ready to execute
**Target:** Migrate 31 screens to unified AppShell layout
**Complexity:** Low (pattern-based, no business logic changes)
**Risk:** Minimal (layout-only refactoring, can be tested per-screen)

---

## Migration Pattern

### Group A: Already Using InteriorShell (8 screens)
**No changes needed.** Already migrated:
- ElectronicsMarketplaceHomeScreen.tsx
- LoginSecurityScreen.tsx
- MarketplaceSwitcherScreen.tsx
- OrdersScreen.tsx
- ProfilePrivacyScreen.tsx
- RewardsScreen.tsx
- SellerVerificationScreen.tsx
- WalletScreen.tsx

**Verification:** Ensure they export `onNavigate` prop properly.

---

### Group B: Tamagui Screens (20 screens)
**Pattern:** Wrap YStack/content in InteriorShell, remove custom headers

**Template Before:**
```typescript
import { YStack, ScrollView } from 'tamagui';

export function SomeScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <YStack flex={1} padding="$4">
      <Text>Custom Header Here</Text>
      {/* content */}
    </YStack>
  );
}
```

**Template After:**
```typescript
import { YStack, ScrollView } from 'tamagui';
import { InteriorShell } from '../../components/appShell';

export function SomeScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <InteriorShell onNavigate={onNavigate} title="Page Title">
      <YStack flex={1}>
        {/* content - remove custom header */}
      </YStack>
    </InteriorShell>
  );
}
```

**Screens to migrate:**
- AccountSwitcherScreen.tsx
- AppSettingsScreen.tsx
- CartScreen.tsx
- BuyerLibraryScreen.tsx
- CheckoutScreen.tsx
- DisputeStatusScreen.tsx
- MarketplaceConfigScreen.tsx
- NotificationCenterScreen.tsx
- OpenDisputeScreen.tsx
- OrderDetailsScreen.tsx
- OrderReceiptScreen.tsx
- PaymentAuthorizationScreen.tsx
- PaymentFailedScreen.tsx
- PaymentSuccessScreen.tsx
- PoliciesScreen.tsx
- PricingPromotionsScreen.tsx
- RefundReturnRequestScreen.tsx
- RefundReturnStatusScreen.tsx
- SellerOrderRefundScreen.tsx
- SupportScreen.tsx
- TrackingScreen.tsx

---

### Group C: React-Native Screens (11 screens)
**Pattern:** Wrap View/SafeAreaView in InteriorShell, remove custom layouts

**Template Before:**
```typescript
import { SafeAreaView, View, ScrollView, Text } from 'react-native';

export function SomeScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text>Custom Header</Text>
      </View>
      <ScrollView>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Template After:**
```typescript
import { View, ScrollView } from 'react-native';
import { InteriorShell } from '../../components/appShell';

export function SomeScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <InteriorShell onNavigate={onNavigate} title="Page Title">
      {/* content - remove custom header/layout */}
    </InteriorShell>
  );
}
```

**Screens to migrate:**
- BillingScreen.tsx (already refactored, may need wrapping)
- CompleteSocialRegistrationScreen.tsx
- CreateAccountScreen.tsx
- DigitalProductDetailsScreen.tsx
- HomeScreen.tsx
- InvoiceScreen.tsx (already refactored, may need wrapping)
- ProductDetailsScreen.tsx

**Screens NOT to migrate (public/unauthenticated):**
- SplashScreen.tsx
- WelcomeScreen.tsx
- PublicContentScreen.tsx

---

## Migration Steps (Per Screen)

1. **Add InteriorShell import:**
   ```typescript
   import { InteriorShell } from '../../components/appShell';
   ```

2. **Extract page title from custom header or state**

3. **Wrap main content in InteriorShell with proper props:**
   ```typescript
   <InteriorShell 
     onNavigate={onNavigate}
     title="Page Title"
     subtitle="Optional subtitle"
     activeLabel="Page Label" // optional
     scrollable={true} // default, set false if page manages scroll
   >
     {/* Move content here */}
   </InteriorShell>
   ```

4. **Remove custom header/sidebar/bottom-tabs code**

5. **Remove SafeAreaView/View wrappers** (InteriorShell provides them)

6. **Test in browser:**
   - Sidebar visible on desktop (900px+)
   - Bottom tabs visible on mobile (<900px)
   - Header shows correct title
   - Navigation works
   - Responsive transition at 900px

---

## Parallel Execution

These migrations are **independent** and can be done in parallel:
- No cross-screen dependencies
- Each screen only depends on InteriorShell
- Testing: Each screen tested in isolation
- Commits: Can be one commit per screen or batched per group

**Recommended:** One commit per group (3 commits total)

---

## Completion Criteria

- [ ] All 31 screens wrapped in InteriorShell
- [ ] All custom headers/sidebars removed
- [ ] All custom layout wrappers removed
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] Responsive design: verified at 5 breakpoints
- [ ] Navigation: all routes working

---

## After Migration

Once all screens are migrated:
1. **BATCH 8:** Verify responsive design works at all breakpoints
2. **BATCH 9:** Run final TypeScript/ESLint verification
3. **Commit:** All migrated screens + verification pass
4. **Test:** Manual testing on web/mobile/tablet

---

## Estimated Time

- Group B (20 screens): 2-3 hours
- Group C (11 screens): 1-2 hours
- Testing: 1 hour
- **Total: 4-6 hours**

---

**Ready to execute:** Yes
**Pattern validated:** Yes (tested on BillingScreen, InvoiceScreen)
**Risk level:** Low (layout-only, reversible)

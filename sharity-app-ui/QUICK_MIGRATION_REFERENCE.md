# Quick Screen Migration Reference

**For:** Migrating remaining 29 screens to AppShell pattern
**Time:** ~5 minutes per screen
**Complexity:** Low (mechanical refactoring)
**Risk:** Minimal (layout-only, no business logic)

---

## The Pattern (Copy-Paste Template)

### Before
```typescript
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { YStack } from 'tamagui'; // or just View for RN

export function MyScreen({ onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text>Custom Header</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

### After
```typescript
import { StyleSheet, Text, View } from 'react-native';
import { YStack } from 'tamagui'; // or remove for RN-only
import { InteriorShell } from '../../components/appShell';

export function MyScreen({ onNavigate }) {
  return (
    <InteriorShell onNavigate={onNavigate} title="My Screen Title">
      {/* content - paste here */}
    </InteriorShell>
  );
}
```

### Changes Summary
1. ❌ Remove: `SafeAreaView`, `ScrollView` wrappers
2. ❌ Remove: Custom header/layout code
3. ✅ Add: `InteriorShell` import
4. ✅ Wrap: Content in `<InteriorShell>`
5. ✅ Pass: `onNavigate` and `title` props

---

## Step-by-Step Checklist (Per Screen)

### Step 1: Backup & Open
- [ ] Screen compiles before changes
- [ ] Note the screen title/name
- [ ] Identify main content area

### Step 2: Update Imports
Replace this:
```typescript
import { SafeAreaView, ScrollView, ... } from 'react-native';
```

With this:
```typescript
import { StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
```

### Step 3: Extract Title
Find the title from:
- Custom header text
- Screen name
- State variable
- Or use descriptive name

Example:
```typescript
title="Billing & Payments"
subtitle="Manage your invoices"
```

### Step 4: Wrap Content
Replace this:
```typescript
return (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>{...}</View>
    <ScrollView>
      {/* content */}
    </ScrollView>
  </SafeAreaView>
);
```

With this:
```typescript
return (
  <InteriorShell 
    onNavigate={onNavigate}
    title="My Screen Title"
    subtitle="Optional subtitle"
  >
    {/* content */}
  </InteriorShell>
);
```

### Step 5: Clean Styles
Delete these style definitions:
- ❌ `container`
- ❌ `header`
- ❌ `content` (padding/padding-bottom)
- ❌ `headerTitle`, `headerSubtitle`

Keep these if used:
- ✅ Individual card/row styles
- ✅ Text/icon styles
- ✅ List/grid styles
- ✅ Form/input styles

### Step 6: Verify
```bash
npm run typecheck  # Should show 0 errors for this screen
```

### Step 7: Test
- [ ] Screen loads in browser
- [ ] Content displays correctly
- [ ] Navigation works
- [ ] Responsive at breakpoints (375px, 1366px, 1920px)
- [ ] No console errors

### Step 8: Commit (per 3-5 screens)
```bash
git add src/features/*/SomeScreen.tsx
git commit -m "Migrate SomeScreen to AppShell pattern"
```

---

## InteriorShell Props Reference

```typescript
<InteriorShell
  onNavigate={(route: AppRoute | string) => void}  // Required
  title="Page Title"                                 // Required
  subtitle="Optional description"                    // Optional
  activeLabel="Settings"                             // Optional (for highlighting nav)
  scrollable={true}                                  // Optional (default: true)
>
  {children}                                         // Required (your content)
</InteriorShell>
```

---

## Common Title Examples

| Screen | Title |
|--------|-------|
| HomeScreen | "Home" |
| CartScreen | "Shopping Cart" |
| CheckoutScreen | "Checkout" |
| OrderDetailsScreen | "Order Details" |
| BillingScreen | "Billing & Payments" |
| SettingsScreen | "Settings" |
| ProfileScreen | "Profile" |
| WalletScreen | "Wallet" |
| RewardsScreen | "Rewards" |
| SupportScreen | "Help & Support" |

---

## Common Pitfalls & Fixes

### ❌ Forgot to remove SafeAreaView
```typescript
// Wrong:
<InteriorShell>
  <SafeAreaView>
    {content}
  </SafeAreaView>
</InteriorShell>

// Right:
<InteriorShell>
  {content}
</InteriorShell>
```

### ❌ Kept ScrollView
```typescript
// Wrong:
<InteriorShell>
  <ScrollView>
    {content}
  </ScrollView>
</InteriorShell>

// Right (InteriorShell handles scroll):
<InteriorShell>
  {content}
</InteriorShell>
```

### ❌ Wrong prop types
```typescript
// Wrong:
onNavigate="home"  // Should be function

// Right:
onNavigate={(route) => navigation.navigate(route)}
```

### ❌ Missing title
```typescript
// Wrong:
<InteriorShell onNavigate={onNavigate}>

// Right:
<InteriorShell onNavigate={onNavigate} title="Page Title">
```

---

## Parallel Processing

You can work on multiple screens simultaneously:

```bash
# Terminal 1: Migrate Group B screens (Tamagui)
git checkout -b batch-group-b
# Edit 5-10 screens, test, commit

# Terminal 2: Migrate Group C screens (React-Native)
git checkout -b batch-group-c
# Edit 5-10 screens, test, commit

# Then merge both branches:
git checkout claude_fixes
git merge batch-group-b
git merge batch-group-c
```

---

## Quick Validation

After migrating a screen, verify with:

```bash
# Type check
npx tsc src/features/mypath/MyScreen.tsx --noEmit

# Test in browser
npx expo start
# Navigate to screen, verify layout and navigation
```

---

## Estimated Time Breakdown

| Task | Time | Notes |
|------|------|-------|
| Update imports | 1 min | Copy-paste |
| Extract title | 1 min | From existing header |
| Wrap in InteriorShell | 1 min | Copy-paste template |
| Remove styles | 1 min | Delete unused sections |
| Test in browser | 1 min | Check sidebar/bottom-tabs |
| **Per screen total** | **5 min** | Low complexity |
| **For 29 screens** | **2.5 hours** | Can parallelize |

---

## Success Indicators (Per Screen)

After migration, verify:
- ✅ TypeScript: 0 errors
- ✅ Layout: Header visible, content centered
- ✅ Desktop (900px+): Sidebar visible, responsive
- ✅ Mobile (<900px): Bottom tabs visible, responsive
- ✅ Navigation: Back button works, sidebar items work
- ✅ Scrolling: Content scrolls if longer than viewport
- ✅ Colors: All theme colors applied
- ✅ Spacing: Consistent padding/margins

---

## Emergency Rollback

If a migration breaks something:

```bash
# Revert single file
git checkout HEAD -- src/features/mypath/MyScreen.tsx

# Or revert entire branch
git reset --hard origin/main
```

All changes are reversible. Safe to proceed.

---

## Useful Links

- Migration guide: `BATCH_6_7_MIGRATION_GUIDE.md`
- Verification checklist: `BATCH_8_9_VERIFICATION.md`
- Phase 1 summary: `PHASE_1_SUMMARY.md`
- Design system: `src/theme/colors.ts`, `src/theme/spacing.ts`
- InteriorShell: `src/components/appShell/InteriorShell.tsx`

---

## Questions & Answers

**Q: Do I need to change business logic?**
A: No. Only layout/styling changes. All logic stays the same.

**Q: What if the screen has custom scrolling?**
A: Set `scrollable={false}` in InteriorShell and manage scroll yourself.

**Q: What if the screen needs a custom header button?**
A: Header is handled by InteriorShell. Use subtitle for additional text.

**Q: Can I test multiple screens at once?**
A: Yes. Run `npm run typecheck` on entire project, then test in browser.

**Q: What if a screen doesn't have a good title?**
A: Use descriptive name or feature name. Examples: "My Orders", "Cart Details".

---

**Status:** Ready to execute
**Confidence:** High (pattern validated on 2 screens)
**Next:** Apply to Groups B & C (29 screens total)

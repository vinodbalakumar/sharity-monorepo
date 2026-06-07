# Phase 2: Screen Refactoring Guide

## Overview

Phase 2 focuses on refactoring individual screens to use the new design system built in Phase 1. This guide provides a structured approach to ensure consistency and minimize errors.

## Refactoring Strategy

### Approach: Incremental & Testable

Rather than refactoring all screens at once, we follow a **safe, incremental pattern**:

1. **Pick one screen** at a time
2. **Identify** StyleSheet usage and inline styles
3. **Replace** with design system components
4. **Test** (typecheck, lint, visual)
5. **Commit** with clear message
6. **Move to next screen**

### Why Incremental?

- ✅ Easy to spot regressions
- ✅ Git history is clear and reviewable
- ✅ Rollback is simple if needed
- ✅ Testing is manageable
- ✅ Team can review each screen independently

## Refactoring Checklist

For each screen, follow this pattern:

### Step 1: Identify Patterns

- [ ] Find all `StyleSheet.create()` usages
- [ ] Note inline `style={{}}` properties
- [ ] Identify custom color values
- [ ] List all custom spacing values
- [ ] Find Typography inconsistencies

### Step 2: Map to Design System

Create a mapping table:

```
Old Style              → New Component/Token
------------------------
fontSize: 16          → use AppText variant="body"
color: '#111827'      → colors.textPrimary
padding: 16           → spacing.md
backgroundColor: ...  → colors.surface / colors.primary
borderRadius: 12      → radius.lg
```

### Step 3: Refactor Gradually

**Before:**
```tsx
<View style={styles.card}>
  <Text style={styles.title}>Hello</Text>
  <Text style={styles.description}>Description</Text>
</View>

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  description: { fontSize: 14, color: '#666' }
});
```

**After:**
```tsx
import { AppCardNew, AppText, Column } from '../../components/ui';
import { spacing } from '../../theme';

<AppCardNew variant="elevated" padding="medium">
  <Column gap="md">
    <AppText variant="cardTitle">Hello</AppText>
    <AppText variant="bodySmall" color="secondary">Description</AppText>
  </Column>
</AppCardNew>
```

### Step 4: Delete Old Code

- [ ] Remove unused StyleSheet
- [ ] Remove unused imports
- [ ] Clean up old theme references
- [ ] Remove commented code

### Step 5: Test

```bash
# TypeScript check
npm run typecheck

# Lint
npm run lint

# Visual inspection (if running the app)
# Check mobile, tablet, and desktop views
```

## Common Replacements

### Text & Typography

```tsx
// Before
<Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
  Title
</Text>

// After
<AppText variant="pageTitle" color="primary">
  Title
</AppText>
```

### Layout & Spacing

```tsx
// Before
<View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
  ...
</View>

// After
<Row gap="md" style={{ paddingHorizontal: spacing.md }}>
  ...
</Row>
```

### Cards & Containers

```tsx
// Before
<View style={styles.card}>
  ...
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2
  }
});

// After
<AppCardNew variant="elevated" padding="medium">
  ...
</AppCardNew>
```

### Buttons

```tsx
// Before
<Pressable onPress={onPress} style={styles.button}>
  <Text style={styles.buttonText}>Click Me</Text>
</Pressable>

// After
<AppButtonNew variant="primary" onPress={onPress}>
  Click Me
</AppButtonNew>
```

### Forms

```tsx
// Before
<View style={styles.input}>
  <TextInput
    style={styles.inputField}
    placeholder="Enter text"
    value={value}
    onChangeText={setValue}
  />
</View>

// After
<AppTextInputNew
  label="Input Label"
  placeholder="Enter text"
  value={value}
  onChangeText={setValue}
/>
```

## Priority Order

### Tier 1: Critical User Flows (High Impact)

1. **SplashScreen** ✅ Done
   - Simple loading screen
   - Good template for consistency

2. **Auth Screens**
   - `CreateAccountScreen` — Registration
   - `CompleteSocialRegistrationScreen` — Social flow
   - `AuthOptionModal` — Reusable modal

3. **Home/Marketplace**
   - `HomeScreen` — First experience after login
   - `ProductDetailsScreen` — Core user interaction
   - `CartScreen` — High-value flow

### Tier 2: Secondary Flows (Medium Impact)

4. **Checkout & Payment**
   - `CheckoutScreen`
   - `PaymentAuthorizationScreen`
   - `PaymentSuccessScreen` / `PaymentFailedScreen`

5. **Orders & Fulfillment**
   - `OrdersScreen`
   - `OrderDetailsScreen`
   - `RefundReturnStatusScreen`

### Tier 3: Supporting Screens (Lower Impact)

6. **User Settings**
   - `ProfilePrivacyScreen`
   - `AppSettingsScreen`
   - `LoginSecurityScreen`

7. **Admin & Config**
   - `MarketplaceConfigScreen`
   - `SellerVerificationScreen`

## Refactoring Notes

### Keep Original Visuals

Unless explicitly asked to change design, preserve:
- Color schemes
- Layout proportions
- Typography hierarchy
- Animations & transitions

### Use Design Tokens

Always prefer:
```tsx
// ✅ Good
color: colors.textPrimary
padding: spacing.md
borderRadius: radius.lg

// ❌ Avoid
color: '#111827'
padding: 16
borderRadius: 12
```

### Responsive Layouts

For screens with different mobile/tablet/desktop layouts, use media queries or dimension checks:

```tsx
import { useWindowDimensions } from 'react-native';

export function MyScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

### Accessibility

Always include:
- [ ] Semantic HTML structure
- [ ] ARIA labels where needed
- [ ] Proper color contrast
- [ ] Touch target sizes (48x48px minimum)
- [ ] Keyboard navigation

## Common Pitfalls

### ❌ Don't Mix Old & New

```tsx
// Bad: Mixing components
<View style={styles.wrapper}>
  <AppText variant="title">Title</AppText>
  <Text style={styles.oldText}>Old style text</Text>
</View>
```

```tsx
// Good: Consistent new system
<Column gap="md">
  <AppText variant="title">Title</AppText>
  <AppText variant="body" color="secondary">Modern text</AppText>
</Column>
```

### ❌ Don't Hardcode Colors

```tsx
// Bad
backgroundColor: '#7c3aed'

// Good
backgroundColor: colors.primary
```

### ❌ Don't Forget Imports

```tsx
// Bad: Using AppText without import
<AppText variant="title">Hello</AppText>

// Good: Proper import
import { AppText, Column } from '../../components/ui';
```

## Testing Each Refactor

After refactoring a screen, verify:

```bash
# 1. Type checking
npm run typecheck

# 2. Linting
npm run lint

# 3. Manual testing (if running app)
- Check mobile layout
- Check tablet layout
- Check desktop layout
- Verify all interactions still work
- Check dark mode (if applicable)
```

## Commit Message Pattern

```
refactor(screens): modernize [ScreenName] with design system

- Replace inline StyleSheet with design tokens
- Use AppText, AppButtonNew, AppCardNew components
- Preserve visual appearance and interactions
- Add proper spacing and typography scales
```

Example:
```
refactor(screens): modernize ProfilePrivacyScreen with design system

- Replace 15 inline style definitions with design system
- Use AppCardNew, AppText, AppButtonNew components
- Implement consistent spacing (spacing.md, spacing.lg)
- Add proper typography hierarchy (title, body, caption variants)
- Visual appearance preserved, interactions unchanged
```

## Progress Tracking

As you complete screens, update the table below:

| Screen | Status | Date | Notes |
|--------|--------|------|-------|
| SplashScreen | ✅ Done | 2026-06-07 | Template example |
| CreateAccountScreen | 📋 Queued | — | Tier 1 |
| CompleteSocialRegistrationScreen | 📋 Queued | — | Tier 1 |
| HomeScreen | 📋 Queued | — | Tier 1 |
| ProductDetailsScreen | 📋 Queued | — | Tier 1 |
| CartScreen | 📋 Queued | — | Tier 1 |

## Next Steps

1. **Pick the next screen** from Tier 1
2. **Follow the refactoring checklist** above
3. **Test thoroughly**
4. **Create a commit** with clear message
5. **Repeat for the next screen**

---

**Phase 2 Status:** In Progress  
**Completed:** 1 of ~40 screens  
**Next:** CreateAccountScreen

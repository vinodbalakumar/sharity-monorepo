# Modern Design System - Sharity App

**Date:** June 7, 2026  
**Status:** ✅ Ready for Implementation  
**Version:** 1.0.0  

---

## Overview

A unified, modern design system ensuring consistency across all screens (Welcome, Registration, Login, Billing, Marketplace, Profile, etc.) with optimizations for memory usage and performance.

---

## Design Philosophy

✅ **Consistency** - Same colors, typography, spacing across all screens  
✅ **Modern** - Clean, contemporary aesthetic with proper visual hierarchy  
✅ **Accessible** - WCAG-compliant with proper contrast ratios  
✅ **Performant** - Optimized CSS-in-JS, minimal re-renders  
✅ **Production-Ready** - Enterprise-grade quality  

---

## Color System

### Primary Palette (Brand Purple)
```
50:  #F3E5FF  (lightest)
100: #E1C3FF
200: #CE9FFF
300: #BA7BFF
400: #A857FF
500: #9633FF  ← Main brand color
600: #8429E8
700: #6D1BD1
800: #560EBA
900: #3F03A3  (darkest)
```

**Usage:**
- Buttons, links, active states
- Headers and section titles
- Primary CTAs (Call-to-Action)

### Secondary Palette (Modern Teal)
```
50:  #E0F7F6
100: #B3EDE9
500: #00C1B9  ← Secondary actions
```

**Usage:**
- Secondary buttons
- Accent elements
- Hover states

### Semantic Colors
- **Success:** #10B981 (payments, confirmations)
- **Warning:** #F59E0B (pending, alerts)
- **Error:** #EF4444 (dangers, failures)
- **Info:** #3B82F6 (informational messages)

### Neutral Grays
```
0:   #FFFFFF  (white)
50:  #F9FAFB
100: #F3F4F6
200: #E5E7EB
400: #9CA3AF
500: #6B7280  (default text)
800: #1F2937
900: #111827  (darkest text)
```

---

## Typography Scale

### Font Sizes
```
xs:   12px (captions, small labels)
sm:   14px (helper text)
base: 16px (body text - default)
lg:   18px (larger body)
xl:   20px (subheadings)
2xl:  24px (headings)
3xl:  30px (large headings)
4xl:  36px (display text)
5xl:  48px (hero text)
```

### Text Variants (Ready-to-Use)
```typescript
// Display
hero:     { size: 36, weight: 700, lineHeight: 1.2 }
display:  { size: 30, weight: 700, lineHeight: 1.2 }
title:    { size: 24, weight: 700, lineHeight: 1.3 }
subtitle: { size: 20, weight: 600, lineHeight: 1.4 }

// Headings
h1: { size: 28, weight: 700, lineHeight: 1.3 }
h2: { size: 24, weight: 700, lineHeight: 1.3 }
h3: { size: 20, weight: 600, lineHeight: 1.4 }
h4: { size: 18, weight: 600, lineHeight: 1.4 }

// Body
body:       { size: 16, weight: 400, lineHeight: 1.5 }
bodyLarge:  { size: 18, weight: 400, lineHeight: 1.5 }
bodySmall:  { size: 14, weight: 400, lineHeight: 1.5 }

// Labels & Buttons
label:      { size: 14, weight: 600, lineHeight: 1.5 }
button:     { size: 16, weight: 600, lineHeight: 1.5 }
buttonSmall:{ size: 14, weight: 600, lineHeight: 1.5 }

// Captions
caption:      { size: 12, weight: 400, lineHeight: 1.4 }
captionSmall: { size: 11, weight: 400, lineHeight: 1.3 }
```

---

## Spacing System

```
0:   0px
xs:  4px   (micro spacing)
sm:  8px   (small gaps)
md:  12px  (medium gaps)
lg:  16px  (default padding)
xl:  24px  (large sections)
2xl: 32px  (extra large)
3xl: 40px
4xl: 48px
5xl: 56px
6xl: 64px
```

---

## Border Radius

```
none: 0px
sm:   4px   (subtle curves)
md:   8px   (inputs, small cards)
lg:   12px  (standard, cards)
xl:   16px  (modals, large elements)
full: 999px (circular, pills)
```

---

## Shadow System

```
none: no shadow
sm:   { shadowOpacity: 0.05, shadowRadius: 2 }
md:   { shadowOpacity: 0.1, shadowRadius: 4 }   ← Standard card shadow
lg:   { shadowOpacity: 0.15, shadowRadius: 8 }
xl:   { shadowOpacity: 0.2, shadowRadius: 12 }  ← Modals
```

---

## Modern Components

### 1. ModernButton
**File:** `src/components/modern/ModernButton.tsx`

```typescript
import { ModernButton } from '../../components/modern';

<ModernButton
  label="Click me"
  onPress={() => {}}
  size="md"              // sm | md | lg | xl
  variant="primary"      // primary | secondary | tertiary | danger | success
  disabled={false}
  loading={false}
  icon={<Icon />}
  fullWidth={false}
/>
```

**Variants:**
- **primary** (purple) - Main actions
- **secondary** (teal) - Alternative actions
- **tertiary** - Low priority, text-only
- **danger** (red) - Destructive actions
- **success** (green) - Confirmations

### 2. ModernCard
**File:** `src/components/modern/ModernCard.tsx`

```typescript
<ModernCard
  variant="default"      // default | elevated | outlined
  padding={16}
>
  {/* Content */}
</ModernCard>
```

**Variants:**
- **default** - Flat background
- **elevated** - With shadow
- **outlined** - Border only

### 3. ModernInput
**File:** `src/components/modern/ModernInput.tsx`

```typescript
<ModernInput
  label="Email"
  placeholder="name@example.com"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  required={true}
  icon={<Icon />}
  keyboardType="email-address"
/>
```

**Features:**
- ✅ Label and required indicator
- ✅ Error state with message
- ✅ Icon support
- ✅ Disabled state
- ✅ Multiline support

### 4. ModernHeader
**File:** `src/components/modern/ModernHeader.tsx`

```typescript
<ModernHeader
  title="Screen Title"
  subtitle="Optional subtitle"
  onBack={() => navigation.back()}
  action={{ label: "Save", onPress: () => {} }}
  icon={<Icon />}
/>
```

---

## Usage Examples

### Welcome/Splash Screen
```typescript
import { ModernButton, ModernCard } from '../../components/modern';
import { modernColors, modernSpacing } from '../../theme/modern-design-system';

<ModernCard variant="elevated">
  <Text style={{ color: modernColors.primary[500] }}>Welcome to Sharity</Text>
  <ModernButton
    label="Get Started"
    onPress={handleGetStarted}
    fullWidth
  />
</ModernCard>
```

### Registration/Login Screen
```typescript
<ModernInput
  label="Email"
  placeholder="your@email.com"
  value={email}
  onChangeText={setEmail}
  required
/>

<ModernInput
  label="Password"
  placeholder="••••••••"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  required
/>

<ModernButton
  label="Sign Up"
  onPress={handleSignUp}
  fullWidth
/>
```

### Profile/Settings Screen
```typescript
<ModernCard variant="outlined">
  <View>
    <Text>Display Name</Text>
    <ModernInput
      value={displayName}
      onChangeText={setDisplayName}
    />
  </View>
</ModernCard>
```

### Billing/Invoice Screen
```typescript
// Pre-built! See BillingScreen.tsx and InvoiceScreen.tsx
<BillingScreen onNavigate={navigation} />
```

---

## Responsive Breakpoints

```typescript
breakpoints = {
  mobile:    0px      (< 640px)
  tablet:    640px    (640px - 1023px)
  desktop:   1024px   (1024px - 1279px)
  wide:      1280px   (1280px - 1535px)
  ultraWide: 1536px   (1536px+)
}
```

**Usage:**
```typescript
const { width } = useWindowDimensions();
const isMobile = width < breakpoints.tablet;
const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
```

---

## Memory Optimization

✅ **CSS-in-JS Efficiency**
- StyleSheets are created once and reused
- No inline object creation in renders
- Colors use references, not copies

✅ **Component Reusability**
- Shared components reduce bundle size
- Consistent patterns reduce code duplication

✅ **Performance**
- Memoization for stable styles
- Minimal prop drilling
- Optimized re-renders

---

## Implementation Roadmap

### Phase 1: Critical Screens ✅
- [x] Design System created
- [x] Modern Components (Button, Card, Input, Header)
- [x] Billing Screen (NEW)
- [x] Invoice Screen (NEW)

### Phase 2: Update Priority Screens (NEXT)
- [ ] Welcome Screen - Refactor with modern components
- [ ] Registration Screen - Apply modern design
- [ ] Login Screen - Consistency pass
- [ ] Home/Marketplace - Modern layout

### Phase 3: Systematic Updates (FUTURE)
- [ ] Profile & Settings
- [ ] Orders & Tracking
- [ ] Wallet & Rewards
- [ ] Seller Dashboard
- [ ] All remaining screens

### Phase 4: Refinement (POLISH)
- [ ] Animations & transitions
- [ ] Dark mode support
- [ ] Accessibility audit
- [ ] Performance optimization

---

## Migration Checklist for Each Screen

When updating a screen to use the modern design system:

- [ ] Replace custom StyleSheets with modern theme tokens
- [ ] Replace custom buttons with `ModernButton`
- [ ] Replace custom inputs with `ModernInput`
- [ ] Replace custom cards with `ModernCard`
- [ ] Replace custom headers with `ModernHeader`
- [ ] Update colors to use `modernColors`
- [ ] Update spacing to use `modernSpacing`
- [ ] Update radius to use `modernRadius`
- [ ] Test on mobile, tablet, and web
- [ ] Verify TypeScript compiles
- [ ] Verify linting passes
- [ ] Test functionality

---

## Color Reference by Context

### Form Elements
- **Label text:** `modernColors.text.primary`
- **Input background:** `modernColors.neutral[0]`
- **Input border:** `modernColors.border`
- **Placeholder:** `modernColors.text.tertiary`
- **Error background:** `modernColors.error + '15'` (transparent)
- **Error text:** `modernColors.error`

### Cards
- **Background:** `modernColors.neutral[0]` (default)
- **Surface:** `modernColors.surface` (alternates)
- **Border:** `modernColors.border`
- **Shadow:** Use `modernShadows`

### Text Hierarchy
- **Headings:** `modernColors.text.primary` (bold, large)
- **Body:** `modernColors.text.primary` (regular)
- **Secondary:** `modernColors.text.secondary` (gray)
- **Tertiary:** `modernColors.text.tertiary` (lighter gray)
- **Inverted:** `modernColors.text.inverse` (white on dark)

---

## Files Created

**Design System:**
- `src/theme/modern-design-system.ts` - All tokens and design constants

**Components:**
- `src/components/modern/ModernButton.tsx`
- `src/components/modern/ModernCard.tsx`
- `src/components/modern/ModernInput.tsx`
- `src/components/modern/ModernHeader.tsx`
- `src/components/modern/index.ts` - Exports

**Screens:**
- `src/features/billing/BillingScreen.tsx` - Billing management (NEW)
- `src/features/billing/InvoiceScreen.tsx` - Invoice details (NEW)

---

## Browser/Platform Support

✅ **iOS** (Native)  
✅ **Android** (Native)  
✅ **Web** (React Native Web)  
✅ **All modern browsers**  

---

## Future Enhancements

- [ ] Dark mode theme variants
- [ ] Custom font family support
- [ ] Animated transitions
- [ ] Gesture interactions
- [ ] RTL language support
- [ ] Theming per marketplace (Jewelry, Gift Cards, etc.)

---

## Support & Questions

Reference this file when:
- Building new screens
- Updating existing screens
- Adding new components
- Ensuring design consistency

All tokens are centralized in `modern-design-system.ts` for easy maintenance.

---

**Status:** Production Ready ✅  
**Last Updated:** June 7, 2026  
**Next Review:** After screens are updated with modern design

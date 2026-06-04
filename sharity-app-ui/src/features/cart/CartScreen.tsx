import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBadge, AppButton, AppCard, AppDivider, AppSnackbar, AppTextInput } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radii, spacing, typography } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import { calculateCartSummary, flattenCartItems, mockCart, type Cart, type CartGroup, type CartItem } from './cartData';

type CartScreenProps = {
  onNavigate: (route: AppRoute) => void;
};

type CouponState = {
  applied: boolean;
  code: string;
  message: string;
  visible: boolean;
};

export function CartScreen({ onNavigate }: CartScreenProps) {
  const { isDesktop, isMobile, isTablet } = useResponsiveLayout();
  const [cart, setCart] = useState<Cart>(mockCart);
  const [coupon, setCoupon] = useState<CouponState>({
    applied: false,
    code: '',
    message: '',
    visible: false
  });
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  const items = useMemo(() => flattenCartItems(cart), [cart]);
  const summary = useMemo(() => calculateCartSummary(cart, coupon.applied), [cart, coupon.applied]);
  const hasDigital = items.some(({ item }) => !item.shippingRequired);
  const hasElectronics = items.some(({ item }) => item.shippingRequired);
  const isMixed = hasDigital && hasElectronics;

  function updateQuantity(itemId: string, nextQuantity: number) {
    setCart((current) => ({
      ...current,
      groups: current.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item))
      }))
    }));
  }

  function removeItem(itemId: string) {
    setCart((current) => ({
      ...current,
      groups: current.groups
        .map((group) => ({ ...group, items: group.items.filter((item) => item.id !== itemId) }))
        .filter((group) => group.items.length)
    }));
  }

  function applyCoupon() {
    const normalized = coupon.code.trim().toUpperCase();
    const isValid = normalized === 'SHARITY10';
    setCoupon((current) => ({
      ...current,
      applied: isValid,
      message: isValid ? 'Coupon applied successfully.' : 'This coupon is invalid or expired.',
      visible: true
    }));
  }

  function continueShopping() {
    if (!items.length || isMixed) {
      onNavigate('marketplaces');
      return;
    }
    onNavigate(hasElectronics ? 'electronics' : 'marketplaces');
  }

  function checkout() {
    setCheckoutMessage('Please sign in to complete your purchase. Showing mocked checkout review for this story.');
    onNavigate('checkout');
  }

  if (!items.length) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onNavigate={onNavigate} />
        <View style={styles.emptyWrap}>
          <AppCard style={styles.emptyCard}>
            <Text style={styles.pageTitle}>Your cart is empty.</Text>
            <Text style={styles.bodyText}>Explore digital codes, electronics, and deals from trusted sellers.</Text>
            <AppButton onPress={() => onNavigate('marketplaces')} size="fullWidth">
              Explore Marketplace
            </AppButton>
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        {isDesktop ? <DashboardSidebar onNavigate={onNavigate} /> : null}
        <View style={styles.main}>
          <Header count={items.length} onNavigate={onNavigate} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.layout, (isMobile || isTablet) && styles.layoutSingle]}>
              <View style={styles.cartColumn}>
                <View style={styles.titleBlock}>
                  <Text style={styles.pageTitle}>Cart</Text>
                  <Text style={styles.bodyText}>Review grouped marketplace items before checkout.</Text>
                </View>
                <WarningStack hasDigital={hasDigital} hasElectronics={hasElectronics} isMixed={isMixed} />
                {cart.groups.map((group) => (
                  <MarketplaceCartGroup
                    group={group}
                    key={`${group.marketplaceCode}-${group.sellerId}`}
                    onRemoveItem={removeItem}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
                {!isDesktop ? (
                  <>
                    <CouponInput coupon={coupon} onApply={applyCoupon} onChangeCode={(code) => setCoupon((current) => ({ ...current, code }))} />
                    <CartSummaryCard hasDigital={hasDigital} hasElectronics={hasElectronics} summary={summary} />
                    <AppButton onPress={continueShopping} variant="outline">
                      Continue Shopping
                    </AppButton>
                  </>
                ) : null}
              </View>
              {isDesktop ? (
                <View style={styles.summaryColumn}>
                  <CouponInput coupon={coupon} onApply={applyCoupon} onChangeCode={(code) => setCoupon((current) => ({ ...current, code }))} />
                  <CartSummaryCard hasDigital={hasDigital} hasElectronics={hasElectronics} summary={summary} />
                  <AppButton onPress={checkout} size="fullWidth">
                    Checkout
                  </AppButton>
                  <AppButton onPress={continueShopping} size="fullWidth" variant="outline">
                    Continue Shopping
                  </AppButton>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
      {!isDesktop ? <StickyCheckoutBar onCheckout={checkout} total={summary.estimatedTotal} /> : null}
      <AppSnackbar message={coupon.message || checkoutMessage || ''} onDismiss={() => setCoupon((current) => ({ ...current, visible: false }))} visible={coupon.visible} />
      <AppSnackbar message={checkoutMessage || ''} onDismiss={() => setCheckoutMessage(null)} visible={Boolean(checkoutMessage)} />
    </SafeAreaView>
  );
}

function Header({ count, onNavigate }: { count?: number; onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Back to marketplace" onPress={() => onNavigate('marketplaces')} style={styles.iconButton}>
        <Ionicons color={colors.textPrimary} name="chevron-back" size={20} />
      </Pressable>
      <View>
        <Text style={styles.headerTitle}>Cart</Text>
        {count ? <Text style={styles.captionText}>{count} items</Text> : null}
      </View>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Notifications" style={styles.iconButton}>
          <Ionicons color={colors.textPrimary} name="notifications-outline" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Profile" style={styles.iconButton}>
          <Ionicons color={colors.textPrimary} name="person-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function DashboardSidebar({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brandRow}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.headerTitle}>Sharity</Text>
      </View>
      {[
        ['Home', 'home-outline', 'home'],
        ['Marketplace', 'storefront-outline', 'marketplaces'],
        ['Cart', 'cart-outline', 'cart']
      ].map(([label, icon, route]) => (
        <Pressable key={label} onPress={() => onNavigate(route as AppRoute)} style={[styles.sidebarItem, label === 'Cart' && styles.sidebarItemActive]}>
          <Ionicons color={label === 'Cart' ? colors.white : colors.textPrimary} name={icon as keyof typeof Ionicons.glyphMap} size={18} />
          <Text style={[styles.sidebarText, label === 'Cart' && styles.sidebarTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function WarningStack({ hasDigital, hasElectronics, isMixed }: { hasDigital: boolean; hasElectronics: boolean; isMixed: boolean }) {
  return (
    <View style={styles.warningStack}>
      {isMixed ? (
        <CartWarningCard message="Your cart includes digital and physical products. Checkout will be completed together, but Sharity may create separate orders by seller and marketplace." />
      ) : null}
      {hasDigital ? <CartWarningCard message="Digital code refunds may be limited after the code is revealed or access is granted." /> : null}
      {hasDigital ? <CartWarningCard message="Refund eligibility may change after a digital file is downloaded." /> : null}
      {hasElectronics ? <CartWarningCard message="Electronics products require a shipping address and may follow separate shipping, return, and delivery rules." /> : null}
    </View>
  );
}

function CartWarningCard({ message }: { message: string }) {
  return (
    <AppCard style={styles.warningCard}>
      <View style={styles.warningRow}>
        <Ionicons color={colors.warning} name="alert-circle-outline" size={22} />
        <Text style={styles.bodyText}>{message}</Text>
      </View>
    </AppCard>
  );
}

function MarketplaceCartGroup({
  group,
  onRemoveItem,
  onUpdateQuantity
}: {
  group: CartGroup;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}) {
  const deliverySummary = Array.from(new Set(group.items.map((item) => item.deliveryType.replaceAll('_', ' ')))).join(', ');

  return (
    <AppCard style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View>
          <Text style={styles.sectionTitle}>{group.marketplaceName}</Text>
          <Text style={styles.bodyText}>Seller: {group.sellerName}</Text>
          <Text style={styles.captionText}>{deliverySummary}</Text>
        </View>
        <View style={styles.badgeWrap}>
          <AppBadge label={group.sellerVerified ? 'Verified Seller' : 'Seller Review'} variant={group.sellerVerified ? 'verified' : 'warning'} />
          <AppBadge label={`${group.items.length} items`} variant="marketplace" />
        </View>
      </View>
      <AppDivider />
      <View style={styles.itemList}>
        {group.items.map((item) => (
          <CartItemCard
            group={group}
            item={item}
            key={item.id}
            onRemove={() => onRemoveItem(item.id)}
            onUpdateQuantity={(quantity) => onUpdateQuantity(item.id, quantity)}
          />
        ))}
      </View>
    </AppCard>
  );
}

function CartItemCard({
  group,
  item,
  onRemove,
  onUpdateQuantity
}: {
  group: CartGroup;
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemIcon}>
        <Ionicons color={colors.primary} name={item.shippingRequired ? 'hardware-chip-outline' : 'keypad-outline'} size={26} />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <View style={styles.itemTitleWrap}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.captionText}>{group.marketplaceName} - {group.sellerName}</Text>
          </View>
          <View style={styles.priceBlock}>
            {item.originalPrice ? <Text style={styles.originalPrice}>{formatMoney(item.originalPrice)}</Text> : null}
            <Text style={styles.price}>{formatMoney(item.price)}</Text>
            {item.discountPercent ? <AppBadge label={`${item.discountPercent}% OFF`} variant="discount" /> : null}
          </View>
        </View>
        <View style={styles.badgeWrap}>
          <AppBadge label={item.productType.replaceAll('_', ' ')} variant="marketplace" />
          <AppBadge label={item.deliveryType.replaceAll('_', ' ')} variant="deliveryType" />
          {item.condition ? <AppBadge label={item.condition} variant="condition" /> : null}
          <AppBadge label={item.shippingRequired ? 'Shipping required' : 'No shipping required'} variant={item.shippingRequired ? 'warning' : 'success'} />
        </View>
        <Text style={styles.bodyText}>{item.refundSummary ?? item.returnSummary ?? 'Review refund and return rules before checkout.'}</Text>
        <QuantitySelector item={item} onUpdateQuantity={onUpdateQuantity} />
        <View style={styles.itemActions}>
          <AppButton onPress={onRemove} variant="danger">
            Remove
          </AppButton>
          <AppButton onPress={() => undefined} variant="outline">
            Save for Later
          </AppButton>
        </View>
      </View>
    </View>
  );
}

function QuantitySelector({ item, onUpdateQuantity }: { item: CartItem; onUpdateQuantity: (quantity: number) => void }) {
  const max = item.availableQuantity ?? item.quantity;
  const canDecrease = item.quantityEditable && item.quantity > 1;
  const canIncrease = item.quantityEditable && item.quantity < max;

  return (
    <View style={styles.quantityWrap}>
      <Text style={styles.captionText}>Quantity</Text>
      {item.quantityEditable ? (
        <View style={styles.quantityControls}>
          <AppButton disabled={!canDecrease} onPress={() => onUpdateQuantity(item.quantity - 1)} variant="outline">
            -
          </AppButton>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <AppButton disabled={!canIncrease} onPress={() => onUpdateQuantity(item.quantity + 1)} variant="outline">
            +
          </AppButton>
        </View>
      ) : (
        <Text style={styles.bodyText}>Locked at {item.quantity}</Text>
      )}
      {item.quantityEditable && item.availableQuantity ? <Text style={styles.captionText}>Only {item.availableQuantity} available from this seller.</Text> : null}
    </View>
  );
}

function CouponInput({
  coupon,
  onApply,
  onChangeCode
}: {
  coupon: CouponState;
  onApply: () => void;
  onChangeCode: (code: string) => void;
}) {
  return (
    <AppCard style={styles.summaryCard}>
      <Text style={styles.sectionTitle}>Coupon</Text>
      <View style={styles.couponRow}>
        <AppTextInput label="Coupon code" onChangeText={onChangeCode} placeholder="Try SHARITY10" style={styles.couponInput} value={coupon.code} />
        <AppButton onPress={onApply}>Apply</AppButton>
      </View>
      {coupon.applied ? <AppBadge label="Coupon applied" variant="success" /> : null}
    </AppCard>
  );
}

function CartSummaryCard({
  hasDigital,
  hasElectronics,
  summary
}: {
  hasDigital: boolean;
  hasElectronics: boolean;
  summary: ReturnType<typeof calculateCartSummary>;
}) {
  return (
    <AppCard style={styles.summaryCard}>
      <Text style={styles.sectionTitle}>Cart Summary</Text>
      <SummaryRow label="Subtotal" value={formatMoney(summary.subtotal)} />
      <SummaryRow label="Marketplace fee" value={formatMoney(summary.marketplaceFee)} />
      <SummaryRow label="Estimated tax" value={formatMoney(summary.estimatedTax)} />
      <SummaryRow label="Discounts" value={`-${formatMoney(summary.discount)}`} />
      <SummaryRow label="Coupon discount" value={`-${formatMoney(summary.couponDiscount)}`} />
      <SummaryRow label="Shipping" value={shippingLabel(hasDigital, hasElectronics)} />
      <AppDivider />
      <SummaryRow strong label="Estimated total" value={formatMoney(summary.estimatedTotal)} />
      <Text style={styles.captionText}>Checkout may create separate seller orders by marketplace, seller, delivery type, and shipping requirement.</Text>
    </AppCard>
  );
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.bodyText, strong && styles.strongText]}>{label}</Text>
      <Text style={[styles.bodyText, strong && styles.strongText]}>{value}</Text>
    </View>
  );
}

function StickyCheckoutBar({ onCheckout, total }: { onCheckout: () => void; total: number }) {
  return (
    <View style={styles.stickyBar}>
      <View>
        <Text style={styles.captionText}>Estimated total</Text>
        <Text style={styles.stickyTotal}>{formatMoney(total)}</Text>
      </View>
      <AppButton onPress={onCheckout}>Checkout</AppButton>
    </View>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(value);
}

function shippingLabel(hasDigital: boolean, hasElectronics: boolean) {
  if (hasDigital && hasElectronics) {
    return 'Digital: no shipping. Electronics: calculated at checkout.';
  }
  if (hasElectronics) {
    return 'Calculated at checkout';
  }
  return 'Not required';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  shell: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    backgroundColor: colors.surface,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    width: 236
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  logoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  sidebarItem: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  sidebarItemActive: {
    backgroundColor: colors.primary
  },
  sidebarText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  sidebarTextActive: {
    color: colors.white
  },
  main: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.xl
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900'
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  layout: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xl
  },
  layoutSingle: {
    flexDirection: 'column'
  },
  cartColumn: {
    flex: 1,
    gap: spacing.lg,
    width: '100%'
  },
  summaryColumn: {
    gap: spacing.md,
    maxWidth: 380,
    position: 'sticky' as 'relative',
    top: spacing.lg,
    width: 360
  },
  titleBlock: {
    gap: spacing.xs
  },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: typography.pageTitle.fontSize,
    fontWeight: typography.pageTitle.fontWeight
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight
  },
  captionText: {
    color: colors.softText,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight
  },
  strongText: {
    color: colors.textPrimary,
    fontWeight: '900'
  },
  warningStack: {
    gap: spacing.sm
  },
  warningCard: {
    backgroundColor: colors.surface
  },
  warningRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm
  },
  groupCard: {
    backgroundColor: colors.surface
  },
  groupHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  badgeWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  itemList: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  itemCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.md,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  itemBody: {
    flex: 1,
    gap: spacing.sm
  },
  itemTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  itemTitleWrap: {
    flex: 1,
    minWidth: 190
  },
  priceBlock: {
    alignItems: 'flex-end',
    gap: spacing.xs
  },
  originalPrice: {
    color: colors.softText,
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  price: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900'
  },
  quantityWrap: {
    gap: spacing.xs
  },
  quantityControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  quantityText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center'
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  summaryCard: {
    backgroundColor: colors.surface
  },
  couponRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  couponInput: {
    flex: 1,
    minWidth: 180
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  stickyBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md
  },
  stickyTotal: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900'
  },
  emptyWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl
  },
  emptyCard: {
    backgroundColor: colors.surface,
    maxWidth: 520,
    width: '100%'
  }
});

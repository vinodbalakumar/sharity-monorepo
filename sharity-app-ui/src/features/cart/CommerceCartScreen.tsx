import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { CommerceHeader, commerceMoney, commerceStyles as s, deliveryLabel, SummaryRow } from '../../components/commerce/CommerceLayout';
import { AppButton } from '../../components/ui';
import { ProductArtwork } from '../../components/marketplace/ProductArtwork';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { changeStoredCartItem, getStoredCart, removeStoredCartItem, type StoredCart } from '../../services/commerceApi';
import { checkoutConfirmed, physicalCartIssue, prepareCartCheckout, readCartCheckout, type CartCheckoutAttempt } from '../../services/physicalCartCheckout';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';

export function CartScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const { width } = useResponsiveLayout();
  const compact = width < 960;
  const phone = width < 600;
  const [cart, setCart] = useState<StoredCart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedCheckout, setSavedCheckout] = useState<CartCheckoutAttempt | null>(null);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const [current, saved] = await Promise.allSettled([getStoredCart(), readCartCheckout()]);
      if (saved.status === 'fulfilled') setSavedCheckout(saved.value);
      if (current.status === 'fulfilled') setCart(current.value);
      else throw current.reason;
      if (saved.status === 'rejected') throw saved.reason;
    }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to load your cart.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function change(itemId: string, quantity: number) {
    if (!cart || busy) return;
    setBusy(true); setError('');
    try {
      if (quantity === 0) await removeStoredCartItem(cart.cartId, itemId);
      else await changeStoredCartItem(cart.cartId, itemId, quantity);
      setCart(await getStoredCart());
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to update your cart.'); }
    finally { setBusy(false); }
  }
  async function reviewCart() {
    if (!cart || busy) return;
    setBusy(true); setError('');
    try { await prepareCartCheckout(cart); onNavigate('cartCheckout'); }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to prepare cart checkout.'); }
    finally { setBusy(false); }
  }
  const resume = savedCheckout?.submitted && (!savedCheckout.checkout || !checkoutConfirmed(savedCheckout.checkout.status));
  const issue = cart ? physicalCartIssue(cart) : '';
  const money = (value: number) => commerceMoney(value, cart?.currencyCode);
  return <InteriorShell title="Your cart" onNavigate={onNavigate}><View style={s.page} testID="commerce-cart">
    <CommerceHeader stage={1} title="Your cart" subtitle="Review your items and get ready for your next find." onBack={() => onNavigate('marketplaces')} />
    {error ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text><AppButton variant="outline" disabled={busy} onPress={load}>Retry cart</AppButton></View> : null}
    {resume ? <View style={s.notice}><Text style={s.value}>Your previous physical checkout is saved</Text><Text style={s.body}>Resolve its payment before starting another checkout. You can resume even if its cart has already been consumed.</Text><AppButton onPress={() => onNavigate('cartCheckout')}>Resume saved cart checkout</AppButton></View> : null}
    {!cart ? !error && <View style={[s.card, s.empty]}><ActivityIndicator color={colors.primary} /><Text style={s.body}>Loading your cart…</Text></View> : cart.items.length === 0 ? <View style={[s.card, s.empty]}>
      <View style={styles.emptyIcon}><Ionicons name="bag-handle-outline" size={40} color={colors.primary} /></View><Text style={s.heading}>Your cart is empty.</Text><Text style={[s.body, { textAlign: 'center' }]}>Discover your next find in the marketplace.</Text><AppButton onPress={() => onNavigate('marketplaces')}>Explore marketplace</AppButton>
    </View> : <View style={[s.layout, compact && s.mobileLayout]}>
      <View style={[s.main, compact && s.mobileMain]}>
        <View style={styles.sectionHeading}><Text style={s.heading}>Your items</Text><Text style={styles.count}>{cart.items.length} {cart.items.length === 1 ? 'listing' : 'listings'}</Text>{busy && <ActivityIndicator size="small" color={colors.primary} />}</View>
        {cart.items.map(item => <View style={[s.card, phone && s.mobileCard]} key={item.cartItemId}>
          <View style={styles.itemRow}>
            <ProductArtwork item={{ title: item.listingTitle, imageUrl: item.imageUrl }} style={[styles.artwork, phone && styles.artworkSmall]} compact />
            <View style={styles.itemDetails}><Text style={s.heading}>{item.listingTitle}</Text><Text style={s.small}>{deliveryLabel(item.deliveryType)}</Text><Text style={s.value}>{money(item.unitPrice)} <Text style={s.small}>/ item</Text></Text></View>
          </View>
          <View style={styles.controls}>
            <View style={styles.quantity}>
              <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" accessibilityState={{ disabled: busy || item.quantity <= 1 }} disabled={busy || item.quantity <= 1} onPress={() => change(item.cartItemId, item.quantity - 1)} style={styles.quantityButton}><Ionicons name="remove" size={18} color={busy || item.quantity <= 1 ? colors.disabled : colors.textPrimary} /></Pressable>
              <Text accessibilityLabel="Quantity" style={[s.value, styles.quantityValue]}>{item.quantity}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" accessibilityState={{ disabled: busy || item.quantity >= 99 }} disabled={busy || item.quantity >= 99} onPress={() => change(item.cartItemId, item.quantity + 1)} style={styles.quantityButton}><Ionicons name="add" size={18} color={busy || item.quantity >= 99 ? colors.disabled : colors.textPrimary} /></Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.listingTitle}`} disabled={busy} onPress={() => change(item.cartItemId, 0)} style={styles.remove}><Ionicons name="trash-outline" size={16} color={colors.textSecondary} /><Text style={s.small}>Remove</Text></Pressable>
            <Text style={[s.heading, { marginLeft: 'auto' }]}>{money(item.lineTotal)}</Text>
          </View>
        </View>)}
      </View>
      <View style={[s.sidebar, compact && s.mobileSidebar]}>
        <View style={[s.card, phone && s.mobileCard]} testID="cart-summary"><Text style={s.heading}>Cart summary</Text><SummaryRow label={`Items (${cart.totalItems})`} value={money(cart.subtotal)} /><SummaryRow label="Buyer total" value={money(cart.subtotal)} total /><Text style={s.small}>All physical items and quantities are included in one buyer payment. Separate listing orders remain visible for each seller. The 5% fee is deducted from sellers’ proceeds, not added to your total.</Text>{issue ? <Text style={s.warningText}>{issue}</Text> : null}{!resume && <AppButton disabled={busy || !!issue} loading={busy} onPress={reviewCart}>Review physical cart</AppButton>}<AppButton variant="outline" onPress={() => onNavigate('marketplaces')}>Continue shopping</AppButton></View>
        <View style={styles.help}><Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} /><Text style={[s.small, { flex: 1 }]}>Need a hand with your order?</Text><Pressable accessibilityRole="button" onPress={() => onNavigate('support')} style={styles.support}><Text style={s.link}>Get help</Text></Pressable></View>
      </View>
    </View>}
  </View></InteriorShell>;
}
const styles = StyleSheet.create({
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { ...s.small, backgroundColor: colors.gray200, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  itemRow: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  artwork: { width: 96, height: 96, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  artworkSmall: { width: 60, height: 68 },
  itemDetails: { flex: 1, minWidth: 0, gap: 6 },
  controls: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  quantity: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  quantityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quantityValue: { minWidth: 24, textAlign: 'center' },
  remove: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  purchaseRow: { borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: 16, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  emptyIcon: { width: 88, height: 88, backgroundColor: colors.primaryLight, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  help: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 8, flexWrap: 'wrap' },
  support: { minHeight: 44, justifyContent: 'center' },
});

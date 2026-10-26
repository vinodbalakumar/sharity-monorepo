import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { AppButton } from '../../components/ui';
import { changeStoredCartItem, getStoredCart, removeStoredCartItem, selectPurchase, type StoredCart } from '../../services/commerceApi';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import type { AppRoute } from '../../types/navigation';

export function CartScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const [cart, setCart] = useState<StoredCart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setCart(await getStoredCart()); }
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
  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cart?.currencyCode ?? 'USD' }).format(value);
  return <InteriorShell title="Your cart" onNavigate={onNavigate}><View style={styles.stack} testID="commerce-cart">
    <Text accessibilityRole="header" style={styles.title}>Your cart</Text>
    <Text style={styles.body}>Review your saved items. Each listing is purchased separately so its price and availability can be checked again.</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!cart ? <AppButton disabled={busy} loading={busy} onPress={load}>{busy ? 'Loading cart…' : 'Retry'}</AppButton> : <>
      {cart.items.length === 0 ? <View style={styles.card}><Text style={styles.heading}>Your cart is empty.</Text><AppButton onPress={() => onNavigate('marketplaces')}>Explore marketplace</AppButton></View> : cart.items.map(item => <View style={styles.card} key={item.cartItemId}>
        <Text style={styles.heading}>{item.listingTitle}</Text>
        <Text style={styles.body}>{money(item.unitPrice)} each · {money(item.lineTotal)} total</Text>
        <View style={styles.actions}>
          <AppButton disabled={busy || item.quantity <= 1} variant="outline" onPress={() => change(item.cartItemId, item.quantity - 1)}>Decrease quantity</AppButton>
          <Text accessibilityLabel="Quantity" style={styles.body}>{item.quantity}</Text>
          <AppButton disabled={busy || item.quantity >= 99} variant="outline" onPress={() => change(item.cartItemId, item.quantity + 1)}>Increase quantity</AppButton>
          <AppButton disabled={busy} variant="ghost" onPress={() => change(item.cartItemId, 0)}>Remove {item.listingTitle}</AppButton>
        </View>
        <AppButton disabled={busy || item.quantity !== 1} onPress={() => { selectPurchase(item.listingId); onNavigate('checkout'); }}>Review purchase</AppButton>
        {item.quantity !== 1 ? <Text style={styles.body}>Set quantity to one to use the current single-listing checkout.</Text> : null}
      </View>)}
      <View style={styles.card}><Text style={styles.heading}>Cart subtotal · {money(cart.subtotal)}</Text><Text style={styles.body}>Final price, fees, shipping eligibility and availability are reviewed before purchase.</Text></View>
    </>}
  </View></InteriorShell>;
}
const styles = StyleSheet.create({
  stack: { gap: 20, maxWidth: 960, width: '100%', alignSelf: 'center' },
  title: { fontFamily: systemFontFamily, fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  heading: { fontFamily: systemFontFamily, fontSize: 18, lineHeight: 26, fontWeight: '600', color: colors.textPrimary },
  body: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 23, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 24, gap: 16, minWidth: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  error: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 23, color: colors.error },
});

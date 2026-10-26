import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { AppButton, AppCheckbox } from '../../components/ui';
import { apiRequest } from '../../services/apiClient';
import { loadPurchase, readPurchase, refreshPurchase, submitPurchase, type PurchaseOrder } from '../../services/commerceApi';
import { getMarketplaceListing } from '../../services/marketplaceApi';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import type { MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

export function CheckoutScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const context = readPurchase();
      if (context.orderId) { setOrder(await loadPurchase(context.orderId)); return; }
      if (!context.listingId) return;
      const [item, config] = await Promise.all([getMarketplaceListing(context.listingId), apiRequest<{ enabled: boolean; mode: string }>('/api/marketplace-service/api/v1/commerce/config')]);
      setListing(item); setEnabled(config.enabled); setMode(config.mode);
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to prepare your purchase.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function confirm() {
    if (!listing || !accepted || !enabled || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try { setOrder(await submitPurchase(listing.publicId, listing.priceAmount, listing.currencyCode)); }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to submit your purchase.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function refresh() {
    if (!order || busy) return;
    setBusy(true); setError('');
    try { setOrder(await refreshPurchase(order.publicId)); }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to confirm payment.'); }
    finally { setBusy(false); }
  }
  return <InteriorShell title="Review purchase" onNavigate={onNavigate}><View style={styles.stack} testID="commerce-checkout">
    <Text accessibilityRole="header" style={styles.title}>{order ? 'Order status' : 'Review your purchase'}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {busy ? <Text style={styles.body}>Please wait…</Text> : null}
    {order ? <View style={styles.card}>
      <Text style={styles.heading}>Order {order.publicId}</Text>
      <Text style={styles.body}>Payment status: {order.paymentStatus.replace(/_/g, ' ')}</Text>
      <Text style={styles.body}>Fulfilment: {order.fulfillmentStatus.replace(/_/g, ' ')}</Text>
      <Text style={styles.body}>Your order is recorded. Digital access is available only after verified payment and fulfilment. Check your orders before attempting another purchase.</Text>
      <AppButton disabled={busy} onPress={refresh}>Check payment status</AppButton>
      <AppButton variant="outline" onPress={() => onNavigate('orders')}>View my orders</AppButton>
    </View> : listing ? <View style={styles.card}>
      <Text style={styles.heading}>{listing.title}</Text>
      <Text style={styles.price}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: listing.currencyCode }).format(listing.priceAmount)}</Text>
      <Text style={styles.body}>Seller: {listing.sellerDisplayName}</Text>
      <Text style={styles.body}>Delivery: {listing.deliveryType.replace(/_/g, ' ')}</Text>
      <Text style={styles.body}>The server checks the price and availability again when you confirm. Access and delivery remain subject to the listing and marketplace policies.</Text>
      <AppButton variant="outline" onPress={() => onNavigate('policies')}>Read marketplace policies</AppButton>
      <View style={styles.consent}><AppCheckbox checked={accepted} onPress={() => setAccepted(value => !value)} accessibilityLabel="Accept marketplace policies" /><Text style={[styles.body, { flex: 1 }]}>I have reviewed the listing, price, delivery method and marketplace policies.</Text></View>
      <Text style={styles.body}>{mode === 'DEMO' ? 'Demo checkout: payment adapters simulate transactions. No real payment is collected.' : 'Checkout is unavailable until the payment integration is configured and verified.'}</Text>
      {!enabled ? <Text style={styles.error}>Purchases are currently disabled. You have not been charged.</Text> : null}
      <AppButton disabled={!accepted || !enabled || busy} loading={busy} onPress={confirm}>{mode === 'DEMO' ? 'Create demo order' : 'Confirm purchase'}</AppButton>
    </View> : !busy ? <View style={styles.card}><Text style={styles.body}>Select a listing to review its purchase details.</Text><AppButton onPress={() => onNavigate('marketplaces')}>Browse marketplace</AppButton></View> : null}
    {error && !order && !listing ? <AppButton onPress={load}>Retry</AppButton> : null}
  </View></InteriorShell>;
}
const styles = StyleSheet.create({
  stack: { gap: 20, maxWidth: 800, width: '100%', alignSelf: 'center' },
  title: { fontFamily: systemFontFamily, fontSize: 30, lineHeight: 38, color: colors.textPrimary, fontWeight: '700' },
  heading: { fontFamily: systemFontFamily, fontSize: 20, lineHeight: 28, color: colors.textPrimary, fontWeight: '600' },
  body: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 24, color: colors.textSecondary },
  price: { fontFamily: systemFontFamily, fontSize: 30, lineHeight: 38, color: colors.primary, fontWeight: '700' },
  card: { padding: 24, gap: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, minWidth: 0 },
  consent: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  error: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 24, color: colors.error },
});

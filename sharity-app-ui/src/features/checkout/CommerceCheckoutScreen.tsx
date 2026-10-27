import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { CommerceHeader, commerceMoney, commerceStyles as s, deliveryLabel, SummaryRow } from '../../components/commerce/CommerceLayout';
import { ProductArtwork } from '../../components/marketplace/ProductArtwork';
import { AppButton, AppCheckbox } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { apiRequest } from '../../services/apiClient';
import { loadPurchase, readPurchase, refreshPurchase, submitPurchase, type PurchaseOrder } from '../../services/commerceApi';
import { getMarketplaceListing } from '../../services/marketplaceApi';
import { paymentConfirmed, paymentPending, paymentStatusLabel, fulfillmentStatusLabel } from '../../services/purchaseDetails';
import { colors } from '../../theme';
import type { MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

type CommerceConfig = { enabled: boolean; mode: string };
export function CheckoutScreen({ onNavigate, onOpenOrder }: { onNavigate: (route: AppRoute) => void; onOpenOrder?: (id: string) => void }) {
  const { width } = useResponsiveLayout();
  const compact = width < 960;
  const phone = width < 600;
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [config, setConfig] = useState<CommerceConfig | null>(null);
  const [configError, setConfigError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const submitting = useRef(false);
  const load = useCallback(async () => {
    setBusy(true); setError(''); setConfigError(''); setConfig(null);
    try {
      const context = readPurchase();
      if (context.orderId) {
        const saved = await loadPurchase(context.orderId);
        setOrder(saved);
        const [availability, current] = await Promise.allSettled([
          apiRequest<CommerceConfig>('/api/marketplace-service/api/v1/commerce/config'),
          paymentPending(saved.paymentStatus) ? refreshPurchase(saved.publicId) : Promise.resolve(saved),
        ]);
        if (availability.status === 'fulfilled') setConfig(availability.value);
        if (current.status === 'fulfilled') setOrder(current.value);
        else setStatusNotice('Your order is saved. We could not update payment status. Check again below.');
        return;
      }
      if (!context.listingId) return;
      const [item, availability] = await Promise.allSettled([getMarketplaceListing(context.listingId), apiRequest<CommerceConfig>('/api/marketplace-service/api/v1/commerce/config')]);
      if (item.status === 'fulfilled') setListing(item.value);
      else throw item.reason;
      if (availability.status === 'fulfilled') setConfig(availability.value);
      else setConfigError(availability.reason instanceof Error ? availability.reason.message : 'Unable to check checkout availability.');
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to prepare your purchase.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function confirm() {
    if (!listing || !accepted || config?.enabled !== true || busy || submitting.current || !['ACTIVE', 'PUBLISHED'].includes(listing.listingStatus) || listing.stockQuantity === 0) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const created = await submitPurchase(listing.publicId, listing.priceAmount, listing.currencyCode);
      setOrder(created);
      try { setOrder(await refreshPurchase(created.publicId)); }
      catch { setStatusNotice('Your order is saved. Payment confirmation may take a moment. Check again below.'); }
    }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to submit your purchase.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function refresh() {
    if (!order || busy) return;
    setBusy(true); setError(''); setStatusNotice('');
    try {
      const current = await refreshPurchase(order.publicId);
      setOrder(current);
      setStatusNotice(paymentConfirmed(current.paymentStatus) ? 'Payment confirmation is up to date.' : 'Payment is still awaiting confirmation. Your order is saved; please check again shortly.');
    }
    catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to confirm payment.'); }
    finally { setBusy(false); }
  }
  const unavailableListing = listing && (!['ACTIVE', 'PUBLISHED'].includes(listing.listingStatus) || listing.stockQuantity === 0);
  return <InteriorShell title={order ? 'Order status' : 'Review purchase'} onNavigate={onNavigate}><View style={s.page} testID="commerce-checkout">
    <CommerceHeader stage={order ? 3 : 2} title={order ? 'Your order is recorded' : 'Review your purchase'} subtitle={order ? 'Track your payment and delivery in one place.' : 'Check the details below before placing your order.'} onBack={() => onNavigate('cart')} />
    {error ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Text style={s.small}>If you already submitted an order, check My orders before trying again.</Text><AppButton variant="outline" onPress={() => onNavigate('orders')}>View my orders</AppButton>{!order && <AppButton variant="outline" disabled={busy} onPress={load}>Reload purchase details</AppButton>}</View> : null}
    {busy && !listing && !order ? <View style={[s.card, s.empty]}><ActivityIndicator color={colors.primary} /><Text style={s.body}>Preparing your purchase…</Text></View> : order ? <View style={[s.layout, compact && s.mobileLayout]}>
      <View style={[s.main, compact && s.mobileMain]}><View style={[s.card, phone && s.mobileCard]}>
        <View style={styles.sectionTitle}><Ionicons name={paymentConfirmed(order.paymentStatus) ? 'checkmark-circle-outline' : 'time-outline'} size={24} color={colors.primary} /><Text style={s.heading}>{paymentConfirmed(order.paymentStatus) ? config?.mode === 'DEMO' ? 'Demo payment confirmed' : 'Payment confirmed' : 'Payment confirmation pending'}</Text></View>
        {config?.mode === 'DEMO' && <Text style={s.body}>This is a demo order. No real money was charged.</Text>}
        <Text selectable style={s.body}>Order {order.publicId}</Text>
        <View style={s.notice}><Text style={s.value}>Payment status: {paymentStatusLabel(order.paymentStatus)}</Text><Text style={s.body}>Delivery: {fulfillmentStatusLabel(order.fulfillmentStatus)}</Text></View>
        <Text style={s.body}>{paymentConfirmed(order.paymentStatus) ? 'Your payment has been confirmed. The seller will update delivery or digital access when fulfilment is complete.' : 'Your order is recorded and its payment is being checked. You do not need to place it again.'}</Text>
        {statusNotice && <Text accessibilityLiveRegion="polite" style={s.body}>{statusNotice}</Text>}
        <AppButton disabled={busy} loading={busy} onPress={refresh}>Check payment status</AppButton><AppButton variant="outline" onPress={() => onNavigate('orders')}>View my orders</AppButton>
        {onOpenOrder && <AppButton variant="ghost" onPress={() => onOpenOrder(order.publicId)}>View order details</AppButton>}
      </View></View>
      <View style={[s.sidebar, compact && s.mobileSidebar]}><View style={s.card}><Text style={s.heading}>Order summary</Text><SummaryRow label="Order amount" value={commerceMoney(order.customerTotalAmount, order.currencyCode)} total /><Text style={s.small}>Payment and delivery status are confirmed by the marketplace.</Text></View></View>
    </View> : listing ? <View style={[s.layout, compact && s.mobileLayout]}>
      <View style={[s.main, compact && s.mobileMain]}>
        <View style={[s.card, phone && s.mobileCard]}><Text style={s.heading}>Your item</Text><View style={[styles.product, phone && { flexDirection: 'column', alignItems: 'stretch' }]}>
          <ProductArtwork item={listing} style={phone ? styles.mobileArtwork : styles.artwork} />
          <View style={styles.details}><Text style={s.heading}>{listing.title}</Text><Text style={s.body}>Seller: {listing.sellerDisplayName}</Text><Text style={s.small}>Quantity: 1</Text><Text style={s.price}>{commerceMoney(listing.priceAmount, listing.currencyCode)}</Text></View>
        </View></View>
        <View style={[s.card, phone && s.mobileCard]}><View style={styles.sectionTitle}><Ionicons name={listing.deliveryType === 'SHIPPING' ? 'cube-outline' : 'download-outline'} size={22} color={colors.primary} /><Text style={s.heading}>Delivery details</Text></View><Text style={s.value}>{deliveryLabel(listing.deliveryType)}</Text><Text style={s.body}>Access and delivery follow the listing details and marketplace policies. The latest price and availability are checked when you confirm.</Text></View>
      </View>
      <View style={[s.sidebar, compact && s.mobileSidebar]}><View style={[s.card, phone && s.mobileCard]} testID="checkout-summary"><Text style={s.heading}>Order summary</Text><SummaryRow label="Item (1)" value={commerceMoney(listing.priceAmount, listing.currencyCode)} /><SummaryRow label="Listed price" value={commerceMoney(listing.priceAmount, listing.currencyCode)} total /><Text style={s.small}>Currency: {listing.currencyCode}. Final charges are checked before your order is placed.</Text>
        {config?.mode === 'DEMO' && <View style={s.notice}><Text style={s.value}>Demo checkout</Text><Text style={s.small}>Payments are simulated. No real payment is collected.</Text></View>}
        <Pressable accessibilityRole="button" onPress={() => onNavigate('policies')} style={styles.policyLink}><Text style={s.link}>Read marketplace policies</Text><Ionicons name="arrow-forward" size={16} color={colors.primary} /></Pressable>
        <View style={styles.consent}><AppCheckbox checked={accepted} onPress={() => setAccepted(value => !value)} accessibilityLabel="Accept marketplace policies" /><Pressable accessibilityRole="button" accessibilityLabel="Toggle marketplace policy agreement" onPress={() => setAccepted(value => !value)} style={styles.consentText}><Text style={s.small}>I have reviewed the listing, price, delivery method and marketplace policies.</Text></Pressable></View>
        {unavailableListing ? <View style={s.warning}><Text style={s.warningText}>This listing is no longer available to purchase.</Text><AppButton variant="outline" onPress={() => onNavigate('marketplaces')}>Find another item</AppButton></View> : config?.enabled === true ? <>
          {!accepted && <Text accessibilityLiveRegion="polite" style={s.small}>Accept the marketplace policies to enable your order.</Text>}
          <AppButton disabled={!accepted || busy} loading={busy} onPress={confirm}>{config.mode === 'DEMO' ? 'Create demo order' : 'Confirm purchase'}</AppButton>
        </> : <View style={s.warning} testID="checkout-unavailable"><Text style={s.value}>{configError ? 'Unable to check checkout availability' : 'Checkout is temporarily unavailable'}</Text><Text style={s.warningText}>{configError || 'Purchases are currently disabled. You have not been charged.'}</Text><Text style={s.small}>Your item is saved for review. You can check again or contact support for help.</Text><AppButton disabled={busy} loading={busy} variant="outline" onPress={load}>Check availability again</AppButton><AppButton variant="ghost" onPress={() => onNavigate('support')}>Contact support</AppButton></View>}
        <AppButton variant="ghost" onPress={() => onNavigate('cart')}>Return to cart</AppButton>
      </View><View style={styles.assurance}><Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} /><Text style={[s.small, { flex: 1 }]}>An order confirmation does not mean payment is complete. Follow its status in My orders.</Text></View></View>
    </View> : !busy && !error ? <View style={[s.card, s.empty]}><Ionicons name="bag-handle-outline" size={42} color={colors.primary} /><Text style={s.heading}>Choose an item to get started</Text><Text style={[s.body, { textAlign: 'center' }]}>Review an item from your cart or select Buy Now in the marketplace.</Text><AppButton onPress={() => onNavigate('cart')}>View your cart</AppButton><AppButton variant="outline" onPress={() => onNavigate('marketplaces')}>Browse marketplace</AppButton></View> : null}
  </View></InteriorShell>;
}
const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  product: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  artwork: { width: 150, height: 150, aspectRatio: 1, borderRadius: 12 },
  mobileArtwork: { width: '100%', height: 190, aspectRatio: undefined, borderRadius: 12 },
  details: { flex: 1, minWidth: 0, gap: 8 },
  policyLink: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44, alignSelf: 'flex-start' },
  consent: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 8, borderRadius: 10, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.borderLight },
  consentText: { flex: 1, minHeight: 44, justifyContent: 'center', paddingVertical: 8 },
  assurance: { flexDirection: 'row', gap: 8, paddingHorizontal: 8 },
});

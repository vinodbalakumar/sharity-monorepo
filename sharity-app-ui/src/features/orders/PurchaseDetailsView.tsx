import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { commerceStyles as s, commerceMoney, SummaryRow, deliveryLabel } from '../../components/commerce/CommerceLayout';
import { ProductArtwork } from '../../components/marketplace/ProductArtwork';
import { AppButton } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { paymentConfirmed, paymentPending, paymentStatusLabel, fulfillmentStatusLabel, purchaseDate, usePurchaseDetails } from '../../services/purchaseDetails';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';

type Props = {
  orderId: string | null;
  onNavigate: (route: AppRoute) => void;
  variant?: 'details' | 'tracking' | 'receipt';
  onOpenReceipt?: (orderId: string, receiptId: string) => void;
  onOpenTracking?: (orderId: string) => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenIssue?: (orderId: string) => void;
};
export function PurchaseDetailsView({ orderId, onNavigate, variant = 'details', onOpenReceipt, onOpenTracking, onOpenOrder, onOpenIssue }: Props) {
  const { width } = useResponsiveLayout();
  const compact = width < 960;
  const phone = width < 600;
  const { order, listing, demo, loading, error, notice, reload } = usePurchaseDetails(orderId);
  const paid = order ? paymentConfirmed(order.paymentStatus) : false;
  const pending = order ? paymentPending(order.paymentStatus) : false;
  const otherPaymentLabel = order?.paymentStatus === 'REFUNDED' ? 'Payment refunded' : order?.paymentStatus === 'CANCELLED' ? 'Payment cancelled' : 'Payment needs attention';
  const digital = listing ? /DIGITAL|CODE|DOWNLOAD|INSTANT|LICENSE|ACCESS/.test(`${listing.productType} ${listing.deliveryType}`) : false;
  const delivered = order ? ['DELIVERED', 'COMPLETED', 'DELIVERY_COMPLETE'].includes(order.fulfillmentStatus) : false;
  const shipped = order ? ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(order.fulfillmentStatus) : false;
  const title = variant === 'receipt' ? 'Payment summary' : variant === 'tracking' ? 'Delivery & tracking' : 'Order details';
  const openIssue = () => order && (onOpenIssue ? onOpenIssue(order.publicId) : onNavigate('orders'));
  const steps = [
    { title: 'Order placed', detail: order ? purchaseDate(order.createdAt) : '', done: true },
    { title: 'Payment', detail: paid ? 'Confirmed' : pending ? 'Awaiting confirmation' : order?.paymentStatus.replace(/_/g, ' ').toLowerCase(), done: paid },
    { title: digital ? 'Digital delivery' : 'Delivery', detail: delivered ? 'Delivery confirmed' : shipped ? 'Shipment in progress' : 'Awaiting seller delivery', done: delivered },
  ];
  return <InteriorShell title={title} activeLabel="Orders" onNavigate={onNavigate}><View style={s.page} testID={`purchase-${variant}`}>
    <Pressable accessibilityRole="button" onPress={() => onNavigate('orders')} style={s.back}><Ionicons name="arrow-back" size={18} color={colors.primary} /><Text style={s.link}>Back to orders</Text></Pressable>
    <View style={[styles.header, phone && { flexDirection: 'column', alignItems: 'stretch' }]}><View style={{ flex: phone ? undefined : 1, minWidth: 0, gap: 8 }}><Text style={styles.eyebrow}>YOUR PURCHASE</Text><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.body}>{variant === 'receipt' ? 'A clear record of your order amount and payment status.' : variant === 'tracking' ? 'Follow the progress of your delivery.' : 'Everything you need to know about this order.'}</Text></View>{order && <AppButton variant="outline" loading={loading} onPress={reload}>Refresh status</AppButton>}</View>
    {error ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text><AppButton onPress={reload}>Retry</AppButton><AppButton variant="outline" onPress={() => onNavigate('orders')}>View my orders</AppButton></View> : null}
    {loading && !order && !error ? <View style={[s.card, s.empty]}><ActivityIndicator color={colors.primary} /><Text style={s.body}>Loading your order…</Text></View> : null}
    {order && <>
      {notice && <View style={s.warning}><Text accessibilityLiveRegion="polite" style={s.warningText}>{notice}</Text></View>}
      <View style={[s.layout, compact && s.mobileLayout]}>
        <View style={[s.main, compact && s.mobileMain]}>
          <View style={[s.card, phone && s.mobileCard]}>
            <View style={styles.statusRow}><View style={[styles.statusIcon, paid && styles.paidIcon]}><Ionicons name={paid ? 'checkmark-circle-outline' : 'time-outline'} size={28} color={paid ? '#166534' : colors.primary} /></View><View style={{ flex: 1, minWidth: 0, gap: 4 }}><Text style={s.heading}>{paid ? demo ? 'Demo payment confirmed' : 'Payment confirmed' : pending ? 'Payment confirmation pending' : otherPaymentLabel}</Text><Text style={s.body}>{paid ? demo ? 'This was a simulated payment. No real money was charged.' : 'The payment service has confirmed this payment.' : pending ? 'Your order is saved. We are checking its payment status. You do not need to place the order again.' : 'Review the recorded status below or request help with this order.'}</Text></View></View>
            <View style={styles.reference}><Text style={s.small}>Order reference</Text><Text selectable style={[s.value, styles.referenceText]}>{order.publicId}</Text><Text style={s.small}>Placed {purchaseDate(order.createdAt)}</Text></View>
            <View style={styles.badges}><Text style={styles.badge}>Payment: {paymentStatusLabel(order.paymentStatus)}</Text><Text style={styles.badge}>Delivery: {fulfillmentStatusLabel(order.fulfillmentStatus)}</Text></View>
          </View>
          <View style={[s.card, phone && s.mobileCard]}><Text style={s.heading}>{variant === 'receipt' ? 'Purchased item' : 'Your item'}</Text><View style={styles.product}>
            {listing ? <ProductArtwork item={listing} compact style={styles.artwork} /> : <View style={styles.fallback}><Ionicons name="bag-outline" size={30} color={colors.primary} /></View>}
            <View style={styles.productCopy}><Text style={s.heading}>{listing?.title || 'Marketplace purchase'}</Text>{listing && <><Text style={s.body}>Sold by {listing.sellerDisplayName}</Text><Text style={s.small}>{deliveryLabel(listing.deliveryType)}</Text></>}<Text style={s.small}>Quantity: 1</Text><Text style={s.value}>{commerceMoney(order.customerTotalAmount, order.currencyCode)}</Text></View>
          </View>{!listing && <Text style={s.small}>Item details are temporarily unavailable. Your recorded order amount and status are shown.</Text>}</View>
          {variant !== 'receipt' ? <View style={[s.card, phone && s.mobileCard]}><Text style={s.heading}>{digital ? 'Digital delivery progress' : 'Order progress'}</Text>
            {steps.map((step, i) => <View key={step.title} style={styles.timelineRow}><View style={[styles.timelineDot, step.done && styles.timelineDone]}><Ionicons name={step.done ? 'checkmark' : 'ellipse-outline'} size={17} color={step.done ? colors.white : colors.textSecondary} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.value}>{step.title}</Text><Text style={s.body}>{step.detail}</Text></View>{i === steps.length - 1 && delivered && <Ionicons name="checkmark-circle" size={20} color="#166534" />}</View>)}
            {variant === 'tracking' && <View style={s.notice}><Text style={s.value}>{digital ? 'No parcel tracking needed' : delivered ? 'Delivery recorded' : 'Carrier tracking is not available yet'}</Text><Text style={s.body}>{digital ? 'This is a digital item. Access is available through your Library after payment and fulfilment are confirmed.' : 'No carrier reference or estimated delivery date has been provided for this order. Check again after the seller updates delivery.'}</Text></View>}
          </View> : <View style={[s.card, phone && s.mobileCard]}><Text style={s.heading}>{pending ? 'Payment not confirmed yet' : 'Payment record'}</Text><SummaryRow label="Order amount" value={commerceMoney(order.customerTotalAmount, order.currencyCode)} /><SummaryRow label="Payment status" value={paymentStatusLabel(order.paymentStatus)} total /><Text style={s.body}>{demo ? 'Demo payment record. This is not a tax invoice and no real money was collected.' : 'This summary shows the payment status recorded by the marketplace. A separate tax and shipping breakdown is not supplied.'}</Text>{!paid && <Text style={s.small}>A paid receipt is available only after payment is confirmed. Use Refresh status to check again.</Text>}</View>}
        </View>
        <View style={[s.sidebar, compact && s.mobileSidebar]}>
          <View style={[s.card, phone && s.mobileCard]}><Text style={s.heading}>Order summary</Text><SummaryRow label="Item quantity" value="1" /><SummaryRow label="Order amount" value={commerceMoney(order.customerTotalAmount, order.currencyCode)} total /><Text style={s.small}>Currency: {order.currencyCode}</Text>{demo && <View style={s.notice}><Text style={s.value}>Demo order</Text><Text style={s.small}>Simulated payment · no real charges</Text></View>}
            {variant !== 'details' && onOpenOrder && <AppButton onPress={() => onOpenOrder(order.publicId)}>View order details</AppButton>}
            {variant !== 'tracking' && onOpenTracking && <AppButton variant="outline" onPress={() => onOpenTracking(order.publicId)}>View delivery status</AppButton>}
            {variant !== 'receipt' && onOpenReceipt && <AppButton variant="outline" onPress={() => onOpenReceipt(order.publicId, `RCPT-${order.publicId}`)}>{paid ? 'View payment summary' : 'View order amount'}</AppButton>}
            {digital && paid && delivered && <AppButton onPress={() => onNavigate('library')}>Open my library</AppButton>}
          </View>
          <View style={[s.card, phone && s.mobileCard]}><Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.primary} /><Text style={s.heading}>Need help with this order?</Text><Text style={s.body}>Tell us about a payment, item or delivery issue so it can be reviewed.</Text><AppButton variant="outline" onPress={openIssue}>Report an order issue</AppButton><AppButton variant="ghost" onPress={() => onNavigate('support')}>Visit help center</AppButton></View>
        </View>
      </View>
    </>}
  </View></InteriorShell>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  eyebrow: { ...s.small, color: colors.primary, fontWeight: '700', letterSpacing: 1.2 },
  statusRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  statusIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  paidIcon: { backgroundColor: '#eaf7ee' },
  reference: { gap: 6, paddingTop: 16, borderTopWidth: 1, borderColor: colors.borderLight },
  referenceText: { flexShrink: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { ...s.small, backgroundColor: colors.gray100, borderRadius: 6, padding: 8, flexShrink: 1 },
  product: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  artwork: { width: 96, height: 110, aspectRatio: undefined, borderRadius: 10 },
  fallback: { width: 64, height: 76, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  productCopy: { flex: 1, minWidth: 0, gap: 5 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68 },
  timelineDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  timelineDone: { backgroundColor: colors.primary },
});

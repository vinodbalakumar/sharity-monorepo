import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { CommerceHeader, commerceMoney, commerceStyles as s, SummaryRow } from '../../components/commerce/CommerceLayout';
import { AppButton, AppCheckbox } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { apiRequest } from '../../services/apiClient';
import { checkoutConfirmed, checkoutStopped, readCartCheckout, refreshCartCheckout, submitCartCheckout, type CartCheckoutAttempt } from '../../services/physicalCartCheckout';
import { paymentStatusLabel } from '../../services/purchaseDetails';
import type { AppRoute } from '../../types/navigation';

export function PhysicalCartCheckoutScreen({ onNavigate, onOpenOrder }: { onNavigate: (route: AppRoute) => void; onOpenOrder: (id: string) => void }) {
  const { width } = useResponsiveLayout();
  const compact = width < 960;
  const [attempt, setAttempt] = useState<CartCheckoutAttempt | null>(null);
  const [config, setConfig] = useState<{ enabled: boolean; mode: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const working = useRef(false);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const saved = await readCartCheckout();
      setAttempt(saved);
      if (saved?.checkout) {
        try { setAttempt(await refreshCartCheckout(saved)); }
        catch { setNotice('Your checkout is saved. Payment status could not be refreshed. Check again below.'); }
      } else {
        setConfig(await apiRequest('/api/marketplace-service/api/v1/commerce/config'));
      }
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to load checkout.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function confirm() {
    if (!attempt || attempt.rejected || !accepted || !config?.enabled || working.current) return;
    working.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const saved = await submitCartCheckout(attempt);
      setAttempt(saved);
      try { setAttempt(await refreshCartCheckout(saved)); }
      catch { setNotice('Checkout recorded. Payment is processed asynchronously; check its status again shortly.'); }
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Unable to submit checkout.');
      // Reload the durable submitted flag, not the current (possibly consumed) cart.
      try { setAttempt(await readCartCheckout()); } catch { /* Keep the reviewed snapshot visible. */ }
    } finally { working.current = false; setBusy(false); }
  }
  async function refresh() {
    if (!attempt?.checkout || working.current) return;
    working.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const saved = await refreshCartCheckout(attempt);
      setAttempt(saved);
      setNotice(checkoutConfirmed(saved.checkout!.status) ? 'Payment confirmation is up to date.' : 'The latest checkout status is shown. Do not place another checkout while payment is unresolved.');
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to refresh payment.'); }
    finally { working.current = false; setBusy(false); }
  }
  const checkout = attempt?.checkout;
  const confirmed = checkout && checkoutConfirmed(checkout.status);
  const stopped = checkout && checkoutStopped(checkout.status);
  const currency = checkout?.currencyCode ?? attempt?.cart.currencyCode;
  const subtotal = attempt?.body.items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0) ?? 0;
  return <InteriorShell title="Physical cart checkout" onNavigate={onNavigate}><View style={s.page} testID="physical-cart-checkout">
    <CommerceHeader stage={checkout ? 3 : 2} title={checkout ? 'Your cart checkout is recorded' : 'Review your physical cart'} subtitle="One buyer payment, with separate listing orders for delivery." onBack={() => onNavigate('cart')} />
    {error ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text>{!attempt?.rejected && <Text style={s.small}>A network error does not mean payment failed. Retry only this saved checkout; its key and reviewed items will not change.</Text>}<AppButton variant="outline" disabled={busy} onPress={load}>Reload saved checkout</AppButton></View> : null}
    {busy && !attempt ? <ActivityIndicator /> : !attempt ? <View style={s.card}><Text style={s.heading}>Choose your physical cart first</Text><AppButton onPress={() => onNavigate('cart')}>View your cart</AppButton></View> : <View style={[s.layout, compact && s.mobileLayout]}>
      <View style={[s.main, compact && s.mobileMain]}>
        {checkout ? <View style={s.card}>
          <Text style={s.heading}>{confirmed ? 'Payment confirmed' : stopped ? 'Payment needs attention' : 'Payment confirmation pending'}</Text>
          <Text selectable style={s.body}>Checkout {checkout.checkoutPublicId}</Text>
          <Text style={s.value}>Checkout status: {paymentStatusLabel(checkout.status)}</Text>
          <Text style={s.body}>{confirmed ? 'The marketplace has confirmed this one cart payment. Track each listing order below.' : stopped ? 'This checkout is failed, cancelled or on hold. Do not pay again. Contact support to resolve it before placing another checkout.' : 'Your checkout is saved. Payment commands are processed asynchronously. This is not a payment success confirmation; do not place it again.'}</Text>
          {notice ? <Text accessibilityLiveRegion="polite" style={s.body}>{notice}</Text> : null}
          <AppButton loading={busy} disabled={busy} onPress={refresh}>Check payment status</AppButton>
          <Text style={s.heading}>Listing orders</Text>
          {checkout.orders.map(order => <View style={s.notice} key={order.publicId}>
            <Text selectable style={s.value}>Order {order.publicId}</Text>
            <Text style={s.body}>Quantity: {order.quantity ?? 1}</Text>
            <Text style={s.body}>Payment: {paymentStatusLabel(order.paymentStatus)} · {commerceMoney(order.customerTotalAmount, order.currencyCode)}</Text>
            <AppButton variant="outline" onPress={() => onOpenOrder(order.publicId)}>View order {order.publicId}</AppButton>
          </View>)}
          <AppButton variant="outline" onPress={() => onNavigate('orders')}>View my orders</AppButton>
        </View> : <View style={s.card}><Text style={s.heading}>All physical cart items</Text>
          {attempt.cart.items.map(item => <View key={item.cartItemId} style={s.notice}>
            <Text style={s.value}>{item.listingTitle}</Text>
            <Text style={s.body}>Quantity: {item.quantity} × {commerceMoney(item.unitPrice, currency)}</Text>
            <Text style={s.value}>{commerceMoney(item.unitPrice * item.quantity, currency)}</Text>
          </View>)}
          {attempt.rejected ? <Text style={s.warningText}>No checkout was recorded. Return to cart and review the current items and prices before trying again.</Text> : attempt.submitted ? <Text style={s.warningText}>An earlier request may already have consumed this cart. Retry the original saved request to recover its checkout, even if you have changed or emptied the cart.</Text> : <Text style={s.small}>Every physical line and quantity is included. The server checks the entire cart, currency, latest prices and stock before recording checkout.</Text>}
        </View>}
      </View>
      <View style={[s.sidebar, compact && s.mobileSidebar]}><View style={s.card} testID="physical-checkout-summary">
        <Text style={s.heading}>One payment summary</Text>
        <SummaryRow label="Item subtotal" value={commerceMoney(checkout?.itemAmount ?? subtotal / 100, currency)} />
        <SummaryRow label="Buyer total" value={commerceMoney(checkout?.customerTotalAmount ?? subtotal / 100, currency)} total />
        <Text style={s.small}>The 5% platform fee is deducted from sellers’ item proceeds, not added to your total. Multi-seller allocations are ledger entries; live payouts are disabled.</Text>
        <Text style={s.small}>Partial refunds and cancellations, including individual listing orders in this checkout, are unavailable. Contact support; no partial refund or cancellation is promised.</Text>
        <AppButton variant="ghost" onPress={() => onNavigate('policies')}>Read marketplace policies</AppButton>
        {!checkout && !attempt.rejected ? <>
          {config?.mode === 'DEMO' && <Text style={s.body}>Demo checkout: no real money is charged.</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><AppCheckbox checked={accepted} onPress={() => setAccepted(value => !value)} accessibilityLabel="Accept physical cart policies" /><Text style={[s.small, { flex: 1 }]}>I reviewed all items, quantities, the buyer total and marketplace policies.</Text></View>
          {config?.enabled ? <AppButton loading={busy} disabled={busy || !accepted} onPress={confirm}>{attempt.submitted ? 'Retry saved checkout' : config.mode === 'DEMO' ? 'Create demo cart checkout' : 'Confirm one cart payment'}</AppButton> : <View style={s.warning}><Text style={s.warningText}>Checkout availability is not confirmed. No new payment will be requested.</Text><AppButton disabled={busy} onPress={load}>Check availability again</AppButton></View>}
        </> : null}
        <AppButton variant="outline" onPress={() => onNavigate('support')}>Contact support</AppButton>
        <AppButton variant="ghost" onPress={() => onNavigate('cart')}>Return to cart</AppButton>
      </View></View>
    </View>}
  </View></InteriorShell>;
}

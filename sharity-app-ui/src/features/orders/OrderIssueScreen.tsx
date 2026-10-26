import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { InteriorShell } from '../../components/appShell';
import { AppButton } from '../../components/ui';
import { apiRequest } from '../../services/apiClient';
import { getBuyerOrders, type BuyerOrderItem } from '../../services/ordersApi';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import type { AppRoute } from '../../types/navigation';

const reasons = [
  { code: 'DIGITAL_ITEM_NOT_RECEIVED', label: 'Item not received' },
  { code: 'DIGITAL_CODE_NOT_WORKING', label: 'Code or access problem' },
  { code: 'SHIPPING_ISSUE', label: 'Delivery or condition problem' },
  { code: 'OTHER_ISSUE', label: 'Another issue' },
];

export function OrderIssueScreen({ orderId, onNavigate }: { orderId: string | null; onNavigate: (route: AppRoute) => void }) {
  const [order, setOrder] = useState<BuyerOrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submitting = useRef(false);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setOrder(null);
    try {
      if (!orderId) throw new Error('Select an order from your purchase history first.');
      const found = (await getBuyerOrders()).find(item => item.id === orderId);
      if (!found) throw new Error('This order could not be found in your purchase history.');
      setOrder(found);
    } catch (ex) {
      const message = ex instanceof Error ? ex.message : '';
      setError(message.startsWith('Select an order') || message.startsWith('This order could not be found')
        ? message : 'Unable to load this order right now. Please retry.');
    }
    finally { setLoading(false); }
  }, [orderId]);
  useEffect(() => { setSubmitted(false); setReason(''); setDescription(''); void load(); }, [load]);

  async function submit() {
    if (!order || !reason || description.trim().length < 10 || submitting.current || submitted) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      await apiRequest(`/api/marketplace-service/api/v1/marketplace/orders/${encodeURIComponent(order.id)}/report-problem`, {
        method: 'POST', body: JSON.stringify({ disputeReasonCode: reason, description: description.trim() }),
      });
      setSubmitted(true);
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Unable to submit this report. Please try again.'); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <InteriorShell title="Order issue review" activeLabel="Orders" onNavigate={onNavigate}>
    <View style={styles.stack} testID="order-issue-review">
      <Text accessibilityRole="header" style={styles.title}>Request an order review</Text>
      <Text style={styles.body}>Tell us what went wrong with your order. This submits a report for review; it does not confirm a refund or move money.</Text>
      {error !== '' && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {loading ? <Text style={styles.body}>Loading your order...</Text> : !order ? <View style={styles.actions}>
        <AppButton onPress={load}>Retry</AppButton><AppButton variant="outline" onPress={() => onNavigate('orders')}>Back to orders</AppButton>
      </View> : <View style={styles.card}>
        <Text style={styles.heading}>{order.name}</Text>
        <Text style={styles.body}>Order reference: {order.id}</Text>
        <Text style={styles.body}>{new Intl.NumberFormat('en-US', { currency: order.currencyCode, style: 'currency' }).format(order.price)} · Payment: {order.payment}</Text>
        {submitted ? <>
          <Text accessibilityLiveRegion="polite" style={styles.heading}>Your issue report was received.</Text>
          <Text style={styles.body}>Review your order for updated status. A refund amount, decision and completion time have not been confirmed.</Text>
          <AppButton onPress={() => onNavigate('orders')}>View my orders</AppButton>
        </> : <>
          <Text style={styles.heading}>What is the issue?</Text>
          <View style={styles.actions}>{reasons.filter(item => order.type === 'digital' ? item.code !== 'SHIPPING_ISSUE' : item.code !== 'DIGITAL_CODE_NOT_WORKING').map(item =>
            <Chip key={item.code} selected={reason === item.code} onPress={() => setReason(item.code)}>{item.label}</Chip>)}</View>
          <TextInput accessibilityLabel="Describe the order issue" placeholder="Describe the issue without including passwords, payment details or digital codes."
            multiline maxLength={2000} value={description} onChangeText={setDescription} style={styles.input} />
          <Text style={styles.body}>Include at least 10 characters. Evidence uploads and automated refund approval are not available in this form.</Text>
          <AppButton disabled={busy || !reason || description.trim().length < 10} loading={busy} onPress={submit}>Submit issue report</AppButton>
          <AppButton variant="outline" onPress={() => onNavigate('orders')}>Back to orders</AppButton>
        </>}
      </View>}
    </View>
  </InteriorShell>;
}

const styles = StyleSheet.create({
  stack: { width: '100%', maxWidth: 800, alignSelf: 'center', gap: 18 },
  title: { fontFamily: systemFontFamily, fontSize: 28, lineHeight: 36, color: colors.textPrimary, fontWeight: '700' },
  heading: { fontFamily: systemFontFamily, fontSize: 18, lineHeight: 26, color: colors.textPrimary, fontWeight: '600' },
  body: { fontFamily: systemFontFamily, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  error: { fontFamily: systemFontFamily, fontSize: 14, lineHeight: 22, color: colors.error },
  card: { padding: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: { fontFamily: systemFontFamily, fontSize: 16, lineHeight: 24, color: colors.textPrimary, minHeight: 150,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
});

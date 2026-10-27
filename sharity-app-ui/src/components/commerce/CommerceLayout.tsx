import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';

export const commerceMoney = (amount: number, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
export const deliveryLabel = (type: string) => ({ SHIPPING: 'Ships to you', CODE: 'Digital code', DOWNLOAD: 'Digital download', DIGITAL: 'Digital delivery' }[type] ?? type.replace(/_/g, ' ').toLowerCase());

export function CommerceHeader({ stage, title, subtitle, onBack }: { stage: number; title: string; subtitle: string; onBack: () => void }) {
  return <View style={s.header}>
    <Pressable accessibilityRole="button" onPress={onBack} style={s.back}><Ionicons name="arrow-back" size={17} color={colors.primary} /><Text style={s.link}>{stage === 1 ? 'Continue shopping' : 'Back to cart'}</Text></Pressable>
    <View style={s.steps}>{['Cart', 'Review', 'Order status'].map((label, index) => <View key={label} style={s.step}>
      <View style={[s.stepNumber, index + 1 <= stage && s.stepActive]}><Text style={[s.stepDigit, index + 1 <= stage && { color: colors.white }]}>{index + 1 < stage ? '✓' : index + 1}</Text></View>
      <Text style={[s.stepLabel, index + 1 === stage && { color: colors.primary, fontWeight: '700' }]}>{label}</Text>
    </View>)}</View>
    <Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.body}>{subtitle}</Text>
  </View>;
}
export function SummaryRow({ label, value, total = false }: { label: string; value: string; total?: boolean }) {
  return <View style={[s.summaryRow, total && s.totalRow]}><Text style={total ? s.heading : s.body}>{label}</Text><Text style={total ? s.price : s.value}>{value}</Text></View>;
}
export const commerceStyles = StyleSheet.create({
  page: { width: '100%', maxWidth: 1160, alignSelf: 'center', gap: 24, paddingVertical: 8 },
  header: { gap: 10 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  link: { fontFamily: systemFontFamily, color: colors.primary, fontWeight: '600', fontSize: 14 },
  steps: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', paddingVertical: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: colors.primary },
  stepDigit: { fontFamily: systemFontFamily, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  stepLabel: { fontFamily: systemFontFamily, fontSize: 12, color: colors.textSecondary },
  title: { fontFamily: systemFontFamily, fontSize: 30, lineHeight: 38, letterSpacing: -0.7, fontWeight: '700', color: colors.textPrimary },
  heading: { fontFamily: systemFontFamily, fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.textPrimary },
  body: { fontFamily: systemFontFamily, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  small: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 19, color: colors.textSecondary },
  price: { fontFamily: systemFontFamily, fontSize: 22, lineHeight: 30, fontWeight: '700', color: colors.textPrimary },
  value: { fontFamily: systemFontFamily, fontSize: 14, lineHeight: 22, fontWeight: '600', color: colors.textPrimary },
  layout: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  mobileLayout: { flexDirection: 'column' },
  main: { flex: 1, minWidth: 0, gap: 16 },
  mobileMain: { flex: undefined, width: '100%' },
  sidebar: { width: 340, gap: 16 },
  mobileSidebar: { width: '100%' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 24, gap: 16, minWidth: 0 },
  mobileCard: { padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  totalRow: { borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: 16 },
  notice: { padding: 16, borderRadius: 10, backgroundColor: colors.primaryLight, gap: 6 },
  warning: { padding: 16, borderRadius: 10, backgroundColor: '#fff8e8', gap: 8, borderWidth: 1, borderColor: '#ecd6a1' },
  warningText: { fontFamily: systemFontFamily, color: '#76510f', fontSize: 14, lineHeight: 22 },
  errorBox: { borderColor: '#fecaca', borderWidth: 1, backgroundColor: '#fff5f5', padding: 16, borderRadius: 10, gap: 12 },
  error: { fontFamily: systemFontFamily, fontSize: 14, lineHeight: 23, color: colors.errorDark },
  empty: { alignItems: 'center', paddingVertical: 44, gap: 16 },
});
const s = commerceStyles;

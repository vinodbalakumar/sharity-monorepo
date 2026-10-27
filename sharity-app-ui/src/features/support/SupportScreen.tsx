import { Ionicons } from '@expo/vector-icons';
import { useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { commerceStyles as s } from '../../components/commerce/CommerceLayout';
import { SiteNavigationContext } from '../../components/publicSite/SiteNavigationContext';
import { AppButton } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors } from '../../theme';
import type { AppRoute } from '../../types/navigation';

const articles = [
  { id: 'payment', title: 'Why is my payment still pending?', category: 'Payments', answer: 'Open your order and select Refresh status. We check the payment service and update your order when payment is confirmed. Do not place another order while confirmation is pending. Demo checkout simulates payment and does not charge real money.', action: 'Find my order', route: 'orders' as AppRoute },
  { id: 'delivery', title: 'Where can I find my delivery updates?', category: 'Orders & delivery', answer: 'Open My orders, choose your purchase and select View delivery status. For physical items, carrier tracking appears only when the seller provides it. Digital items do not have parcel tracking.', action: 'Track an order', route: 'orders' as AppRoute },
  { id: 'digital', title: 'How do I access a digital purchase?', category: 'Digital purchases', answer: 'Digital codes and downloads are available in My library after payment and fulfilment are confirmed. If access is missing or a code does not work, report the issue from the relevant order. Keep the actual code out of your message.', action: 'Open my library', route: 'library' as AppRoute },
  { id: 'issue', title: 'How do I report an item or request a review?', category: 'Orders & delivery', answer: 'Choose the order from My orders and select Report an order issue. Pick the issue, describe what happened and submit the report. This sends the order for review; a refund decision and completion time are confirmed separately.', action: 'Get help with an order', route: 'orders' as AppRoute },
  { id: 'receipt', title: 'Where is my payment summary?', category: 'Payments', answer: 'Open your order and select View payment summary. It shows the recorded amount, currency and payment status. If payment is pending, refresh the order first. A demo payment summary is not a tax invoice.', action: 'View my orders', route: 'orders' as AppRoute },
  { id: 'account', title: 'How do I manage my account or sign-in details?', category: 'Account', answer: 'Use your account settings to review your profile and login security. If you cannot sign in, use the password recovery link on the sign-in page.', action: 'Login & security', route: 'loginSecurity' as AppRoute },
];
const categories = ['All topics', 'Orders & delivery', 'Payments', 'Digital purchases', 'Account'];
export function SupportScreen({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const { width } = useResponsiveLayout();
  const compact = width < 960;
  const navigation = useContext(SiteNavigationContext);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All topics');
  const [expanded, setExpanded] = useState<string | null>('payment');
  const filtered = useMemo(() => articles.filter(item => (category === 'All topics' || item.category === category) && `${item.title} ${item.answer}`.toLowerCase().includes(query.trim().toLowerCase())), [category, query]);
  return <InteriorShell title="Help center" onNavigate={onNavigate}><View style={s.page} testID="support-center">
    <View style={styles.hero}><Text style={styles.eyebrow}>SHARITY HELP CENTER</Text><Text accessibilityRole="header" style={s.title}>How can we help?</Text><Text style={s.body}>Find an answer, check an order, or get help with a purchase.</Text><View style={styles.search}><Ionicons name="search-outline" size={22} color={colors.primary} /><TextInput accessibilityLabel="Search help articles" placeholder="Search payments, delivery, digital items…" value={query} onChangeText={setQuery} style={styles.searchInput} /></View></View>
    <View style={[styles.quickActions, compact && { flexDirection: 'column' }]}>{[
      { title: 'Track an order', detail: 'Check payment and delivery updates', icon: 'cube-outline' as const, route: 'orders' as AppRoute },
      { title: 'Help with a purchase', detail: 'Report an item or payment issue', icon: 'chatbubble-ellipses-outline' as const, route: 'orders' as AppRoute },
      { title: 'My digital purchases', detail: 'Find your codes and downloads', icon: 'download-outline' as const, route: 'library' as AppRoute },
    ].map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => onNavigate(item.route)} style={[s.card, styles.quickCard]}><Ionicons name={item.icon} size={26} color={colors.primary} /><View style={{ flex: 1, minWidth: 0, gap: 5 }}><Text style={s.value}>{item.title}</Text><Text style={s.small}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.primary} /></Pressable>)}</View>
    <View style={[s.layout, compact && s.mobileLayout]}>
      <View style={[s.main, compact && s.mobileMain]}><Text style={s.heading}>Frequently asked questions</Text><View style={styles.categories}>{categories.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: category === item }} onPress={() => setCategory(item)} style={[styles.category, category === item && styles.selected]}><Text style={[s.small, category === item && { color: colors.white }]}>{item}</Text></Pressable>)}</View>
        {filtered.map(item => <View key={item.id} style={[s.card, width < 600 && s.mobileCard]}><Pressable accessibilityRole="button" accessibilityLabel={item.title} accessibilityState={{ expanded: expanded === item.id }} onPress={() => setExpanded(expanded === item.id ? null : item.id)} style={styles.question}><Text style={[s.value, { flex: 1 }]}>{item.title}</Text><Ionicons name={expanded === item.id ? 'remove' : 'add'} size={20} color={colors.primary} /></Pressable>{expanded === item.id && <View style={{ gap: 12 }}><Text style={s.body}>{item.answer}</Text><AppButton variant="outline" onPress={() => onNavigate(item.route)}>{item.action}</AppButton></View>}</View>)}
        {!filtered.length && <View style={[s.card, s.empty]}><Text style={s.heading}>No matching help articles</Text><Text style={s.body}>Try a different search or browse all topics.</Text><AppButton variant="outline" onPress={() => { setQuery(''); setCategory('All topics'); }}>Clear search</AppButton></View>}
      </View>
      <View style={[s.sidebar, compact && s.mobileSidebar]}><View style={s.card}><Ionicons name="help-buoy-outline" size={30} color={colors.primary} /><Text style={s.heading}>Need help with an order?</Text><Text style={s.body}>Choose your purchase, then select Report an order issue. Your order reference is included so the right purchase can be reviewed.</Text><AppButton onPress={() => onNavigate('orders')}>Choose an order</AppButton></View><View style={s.card}><Text style={s.heading}>More ways to get help</Text><Text style={s.body}>See our contact information or review the marketplace policies.</Text><AppButton variant="outline" onPress={() => navigation?.openPublicContent('contact-us')}>Contact information</AppButton><AppButton variant="ghost" onPress={() => onNavigate('policies')}>Marketplace policies</AppButton><Text style={s.small}>Please do not include passwords, card details or digital codes in an issue report.</Text></View></View>
    </View>
  </View></InteriorShell>;
}
const styles = StyleSheet.create({
  hero: { ...s.card, gap: 12, paddingVertical: 32, backgroundColor: '#f7f9ff' },
  eyebrow: { ...s.small, color: colors.primary, letterSpacing: 1.3, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, marginTop: 8 },
  searchInput: { ...s.body, flex: 1, minWidth: 0, minHeight: 52, fontSize: 16 },
  quickActions: { flexDirection: 'row', gap: 16 },
  quickCard: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { paddingHorizontal: 12, minHeight: 44, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  question: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 44 },
});

import { Ionicons } from '@expo/vector-icons';
import { ProductArtwork } from '../../components/marketplace/ProductArtwork';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InteriorShell } from '../../components/appShell';
import { AppButton } from '../../components/ui';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getMarketplaceListingsByVertical } from '../../services/marketplaceApi';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import type { MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

type Props = { onNavigate: (route: AppRoute) => void; onOpenListing: (id: string) => void };
function Catalog({ onNavigate, onOpenListing, title, vertical }: Props & { title: string; vertical: string }) {
  const { isMobile, isDesktop } = useResponsiveLayout();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setListings(await getMarketplaceListingsByVertical(vertical)); }
    catch { setError('We could not load the marketplace. Please try again shortly.'); }
    finally { setBusy(false); }
  }, [vertical]);
  useEffect(() => { void load(); }, [load]);
  const categories = [...new Set(listings.map(item => item.categoryCode).filter(Boolean))];
  const filtered = useMemo(() => listings.filter(item => (!category || item.categoryCode === category)
    && `${item.title} ${item.description ?? ''} ${item.sellerDisplayName ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sort === 1 ? a.priceAmount - b.priceAmount : sort === 2 ? b.priceAmount - a.priceAmount : Date.parse(b.createdAt) - Date.parse(a.createdAt)), [category, listings, query, sort]);
  return <InteriorShell activeLabel="Marketplace" onNavigate={onNavigate} title={title}><View style={styles.stack} testID="commerce-catalog">
    <View style={styles.intro}><Text style={styles.kicker}>THE SHARITY MARKETPLACE</Text><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.body}>Discover current listings. Review the seller, delivery method and policies before you buy.</Text></View>
    <View style={styles.toolbar}>
      <View style={styles.search}><Ionicons name="search-outline" color={colors.textSecondary} size={21} /><TextInput accessibilityLabel={`Search ${title}`} placeholder="Search current listings" value={query} onChangeText={setQuery} style={styles.input} /></View>
      <AppButton variant="outline" onPress={() => setSort(value => (value + 1) % 3)}>{['Newest first', 'Price: low to high', 'Price: high to low'][sort]}</AppButton>
    </View>
    <View style={styles.categories}>{['', ...categories].map(code => <Pressable accessibilityRole="button" accessibilityState={{ selected: category === code }} key={code} onPress={() => setCategory(code)} style={[styles.chip, category === code && styles.selected]}><Text style={[styles.chipText, category === code && { color: colors.white }]}>{code ? code.replace(/_/g, ' ') : 'All categories'}</Text></Pressable>)}</View>
    {busy ? <Text style={styles.body}>Loading current listings…</Text> : error ? <View style={styles.empty}><Text accessibilityRole="alert" style={styles.body}>{error}</Text><AppButton onPress={load}>Retry</AppButton></View> : <>
      <Text style={styles.body}>{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}</Text>
      <View style={styles.grid}>{filtered.map(item => <Pressable testID="catalog-product" accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={() => onOpenListing(item.publicId)} key={item.publicId} style={[styles.card, { width: isMobile ? '47.5%' : isDesktop ? '23.5%' : '31.5%' }]}>
        <ProductArtwork item={item} style={styles.image} />
        <View style={styles.copy}><Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.seller} numberOfLines={1}>{item.sellerDisplayName || 'Marketplace seller'}</Text><Text style={styles.price}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: item.displayCurrencyCode || item.currencyCode }).format(item.displayPriceAmount ?? item.priceAmount)}</Text><Text style={styles.seller}>{item.deliveryType.replace(/_/g, ' ')}</Text></View>
      </Pressable>)}</View>
      {filtered.length === 0 ? <View style={styles.empty}><Text style={styles.heading}>{query || category ? 'No matching listings' : 'No listings available yet'}</Text><Text style={styles.body}>Try another category or return to the marketplace later.</Text><AppButton variant="outline" onPress={() => { setQuery(''); setCategory(''); }}>Clear filters</AppButton></View> : null}
    </>}
  </View></InteriorShell>;
}
export function DigitalMarketplaceListingsScreen(props: Props) { return <Catalog {...props} title="Digital discoveries" vertical="MARKETPLACE" />; }
export function JewelryMarketplaceListingsScreen(props: Props) { return <Catalog {...props} title="Jewellery & accessories" vertical="JEWELLERY" />; }
export function ElectronicsMarketplaceHomeScreen({ onNavigate, onOpenProduct }: { onNavigate: Props['onNavigate']; onOpenProduct: Props['onOpenListing'] }) { return <Catalog onNavigate={onNavigate} onOpenListing={onOpenProduct} title="Electronics & gadgets" vertical="ELECTRONICS" />; }
const styles = StyleSheet.create({
  stack: { gap: 24, minWidth: 0 }, intro: { paddingVertical: 16, gap: 12 },
  kicker: { fontFamily: systemFontFamily, fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 1.6 },
  title: { fontFamily: systemFontFamily, fontSize: 32, lineHeight: 40, fontWeight: '700', color: colors.textPrimary },
  body: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 24, color: colors.textSecondary },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, search: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, flexGrow: 1, flexBasis: 240 },
  input: { fontFamily: systemFontFamily, fontSize: 16, lineHeight: 24, minHeight: 48, flex: 1, minWidth: 0, color: colors.textPrimary },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { justifyContent: 'center', paddingHorizontal: 16, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 24, backgroundColor: colors.surface }, selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: systemFontFamily, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface, minWidth: 0 },
  image: { width: '100%', aspectRatio: 1.3 }, fallback: { backgroundColor: '#e9eee5', alignItems: 'center', justifyContent: 'center' },
  copy: { padding: 12, gap: 8 }, productTitle: { fontFamily: systemFontFamily, fontSize: 15, lineHeight: 22, color: colors.textPrimary, fontWeight: '600' },
  seller: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  price: { fontFamily: systemFontFamily, fontSize: 20, lineHeight: 28, color: colors.textPrimary, fontWeight: '700' },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 24, gap: 16, borderRadius: 12 },
  heading: { fontFamily: systemFontFamily, fontSize: 20, color: colors.textPrimary, fontWeight: '600' },
});

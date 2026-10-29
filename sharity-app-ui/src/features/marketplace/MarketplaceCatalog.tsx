import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { AppButton } from '../../components/ui';
import { ListingCard } from '../../components/marketplace/ListingCard';
import { ScrollPagination, useScrollPagination } from '../../components/marketplace/ScrollPagination';
import { getMarketplaceListings, getMarketplaceListingsByVertical } from '../../services/marketplaceApi';
import { appState$ } from '../../state/appState';
import { colors } from '../../theme';
import { systemFontFamily } from '../../theme/typography';
import type { MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';
import { compareListingPrice, listingLabel } from '../../utils/listingPresentation';
import { getAverageRating, getListingDisplayCurrencyCode, getListingDisplayPriceAmount, hasDiscount } from '../../utils/marketplaceUtils';

const sortOptions = [
  { code: 'featured', label: 'Featured' },
  { code: 'price-asc', label: 'Price: low to high' },
  { code: 'price-desc', label: 'Price: high to low' },
  { code: 'newest', label: 'Newest first' },
  { code: 'rating', label: 'Top rated' },
] as const;
type Sort = typeof sortOptions[number]['code'];

function FilterOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: selected }}
    onPress={onPress} style={({ pressed }) => [styles.filterOption, pressed && styles.pressed]}>
    <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? colors.primary : colors.textMuted} />
    <Text style={[styles.optionText, selected && styles.selectedText]}>{label}</Text>
  </Pressable>;
}

export function MarketplaceCatalog({ title = 'All products', vertical, onNavigate, onOpenProduct }: {
  title?: string;
  vertical?: string;
  onNavigate: (route: AppRoute) => void;
  onOpenProduct: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;
  const query = useSelector(appState$.marketplace.searchQuery);
  const categoriesSelected = useSelector(appState$.marketplace.filters.categoryCodes);
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<Sort>('featured');
  const [delivery, setDelivery] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [available, setAvailable] = useState(false);
  const [deals, setDeals] = useState(false);
  const [rated, setRated] = useState(false);
  const [currency, setCurrency] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [gridWidth, setGridWidth] = useState(0);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = vertical ? await getMarketplaceListingsByVertical(vertical) : await getMarketplaceListings();
      if (!Array.isArray(data)) throw new Error('Invalid catalog response');
      setItems(data);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [vertical]);
  useEffect(() => { void load(); }, [load]);
  const categories = useMemo(() => [...new Set(items.map(item => item.categoryCode).filter(Boolean))].sort(), [items]);
  const deliveries = useMemo(() => [...new Set(items.map(item => item.deliveryType).filter(Boolean))].sort(), [items]);
  const currencies = useMemo(() => [...new Set(items.map(getListingDisplayCurrencyCode))].sort(), [items]);
  const priceCurrency = currencies.length === 1 ? currencies[0] : currency;
  const priceError = (minPrice.trim() && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0))
    || (maxPrice.trim() && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0))
    ? 'Enter a valid, non-negative price.'
    : minPrice.trim() && maxPrice.trim() && Number(minPrice) > Number(maxPrice)
      ? 'Minimum price must not exceed maximum price.' : '';
  const filtered = useMemo(() => items.filter(item =>
    (!categoriesSelected.length || categoriesSelected.includes(item.categoryCode))
    && `${item.title} ${item.description ?? ''} ${item.categoryCode} ${item.sellerDisplayName ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    && (!delivery.length || delivery.includes(item.deliveryType))
    && (!verified || item.verifiedSeller)
    && (!available || (item.listingStatus === 'ACTIVE' && (item.stockQuantity == null || item.stockQuantity > 0)))
    && (!deals || hasDiscount(item))
    && (!rated || getAverageRating(item) >= 4)
    && (!priceCurrency || getListingDisplayCurrencyCode(item) === priceCurrency)
    && (!priceCurrency || !!priceError || !minPrice.trim() || getListingDisplayPriceAmount(item) >= Number(minPrice))
    && (!priceCurrency || !!priceError || !maxPrice.trim() || getListingDisplayPriceAmount(item) <= Number(maxPrice))
  ).sort((a, b) => {
    if (sort === 'price-asc') return compareListingPrice(a, b);
    if (sort === 'price-desc') return compareListingPrice(b, a);
    if (sort === 'rating') return getAverageRating(b) - getAverageRating(a);
    if (sort === 'newest') return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    return 0;
  }  ), [items, categoriesSelected, query, delivery, verified, available, deals, rated, priceCurrency, priceError, minPrice, maxPrice, sort]);
  const { visible, hasMore, loadMore } = useScrollPagination(filtered);
  const columns = gridWidth >= 1200 ? 5 : gridWidth >= 840 ? 4 : gridWidth >= 580 ? 3 : 2;
  const cardWidth = gridWidth > 0
    ? Math.floor((gridWidth - 24 - (columns - 1) * 12) / columns) - 2
    : undefined;
  const activeFilters = [categoriesSelected.length > 0, delivery.length > 0, verified, available, deals, rated, !!currency, !!minPrice.trim(), !!maxPrice.trim()].filter(Boolean).length;
  const singleSelectedCategory = categoriesSelected[0];
  const selectedCategoryLabel = categoriesSelected.length === 1 && singleSelectedCategory
    ? listingLabel(singleSelectedCategory)
    : categoriesSelected.length > 1 ? `${categoriesSelected.length} categories` : '';
  const clearFilters = () => {
    appState$.marketplace.filters.categoryCodes.set([]);
    setDelivery([]); setVerified(false); setAvailable(false); setDeals(false); setRated(false);
    setCurrency(''); setMinPrice(''); setMaxPrice('');
  };
  const filters = <View testID="marketplace-filters" style={styles.filters}>
    <View style={styles.filterHeader}>
      <Text accessibilityRole="header" style={styles.heading}>Filters{activeFilters ? ` (${activeFilters})` : ''}</Text>
      <AppButton size="small" variant="ghost" onPress={clearFilters}>Clear filters</AppButton>
    </View>
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>Categories</Text>
      <FilterOption label="All categories" selected={!categoriesSelected.length} onPress={() => appState$.marketplace.filters.categoryCodes.set([])} />
      {categories.map(code => <FilterOption key={code} label={listingLabel(code)} selected={categoriesSelected.includes(code)}
        onPress={() => {
          appState$.marketplace.filters.categoryCodes.set(current =>
            current.includes(code) ? current.filter(selected => selected !== code) : [...current, code],
          );
        }} />)}
    </View>
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>Price{priceCurrency ? ` (${priceCurrency})` : ''}</Text>
      {currencies.length > 1 && <>
        <Text style={styles.body}>Choose a currency to filter prices.</Text>
        <FilterOption label="All currencies" selected={!currency} onPress={() => { setCurrency(''); setMinPrice(''); setMaxPrice(''); }} />
        {currencies.map(code => <FilterOption key={code} label={code} selected={currency === code} onPress={() => setCurrency(code)} />)}
      </>}
      <View style={styles.priceFields}>
        <TextInput accessibilityLabel="Minimum price" placeholder="Min" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
          editable={!!priceCurrency} accessibilityState={{ disabled: !priceCurrency }} value={minPrice} onChangeText={setMinPrice} style={[styles.input, !priceCurrency && styles.disabledInput]} />
        <Text style={styles.body}>to</Text>
        <TextInput accessibilityLabel="Maximum price" placeholder="Max" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad"
          editable={!!priceCurrency} accessibilityState={{ disabled: !priceCurrency }} value={maxPrice} onChangeText={setMaxPrice} style={[styles.input, !priceCurrency && styles.disabledInput]} />
      </View>
      {!!priceError && <Text accessibilityRole="alert" style={styles.errorText}>{priceError}</Text>}
    </View>
    <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>Shopping preferences</Text>
      <FilterOption label="In stock only" selected={available} onPress={() => setAvailable(value => !value)} />
      <FilterOption label="Verified sellers" selected={verified} onPress={() => setVerified(value => !value)} />
      <FilterOption label="Offers only" selected={deals} onPress={() => setDeals(value => !value)} />
      <FilterOption label="Rated 4 stars & up" selected={rated} onPress={() => setRated(value => !value)} />
    </View>
    {deliveries.length > 0 && <View style={styles.filterGroup}>
      <Text style={styles.filterTitle}>Delivery</Text>
      <FilterOption label="All delivery methods" selected={!delivery.length} onPress={() => setDelivery([])} />
      {deliveries.map(code => <FilterOption key={code} label={listingLabel(code)} selected={delivery.includes(code)}
        onPress={() => setDelivery(current => current.includes(code) ? current.filter(value => value !== code) : [...current, code])} />)}
    </View>}
    {!desktop && <AppButton onPress={() => setShowFilters(false)}>Show {filtered.length} products</AppButton>}
  </View>;

  return <View testID="marketplace-catalog" style={[styles.layout, !desktop && styles.mobileLayout]}>
    {desktop && <View style={styles.sidebar}>{filters}</View>}
    <View style={styles.results}>
      <View style={styles.resultsHeader}>
        <View style={styles.breadcrumbs}>
          <Pressable accessibilityRole="button" onPress={() => onNavigate('home')} style={styles.breadcrumbLink}><Text style={styles.body}>Home</Text></Pressable>
          <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          <Text style={styles.body}>Marketplace</Text>
          {(vertical || categoriesSelected.length > 0) && <><Ionicons name="chevron-forward" size={12} color={colors.textMuted} /><Text style={styles.body}>{selectedCategoryLabel || title}</Text></>}
        </View>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>{query.trim() ? 'Search results' : selectedCategoryLabel || title}</Text>
          {!loading && !error && <Text accessibilityLiveRegion="polite" style={styles.body}>
            {filtered.length ? `Showing 1-${visible.length} of ${filtered.length} products` : '0 products'}
          </Text>}
        </View>
        {!!query.trim() && <View style={styles.titleRow}><Text style={styles.body}>Results for &quot;{query.trim()}&quot;</Text><AppButton size="small" variant="ghost" onPress={() => appState$.marketplace.searchQuery.set('')}>Clear search</AppButton></View>}
        {!desktop && <Pressable accessibilityRole="button"
          accessibilityLabel={showFilters ? 'Hide filters' : `Filters${activeFilters ? ` (${activeFilters})` : ''}`}
          accessibilityState={{ expanded: showFilters }} onPress={() => setShowFilters(value => !value)}
          style={({ pressed }) => [styles.filterToggle, pressed && styles.pressed]}>
          <Ionicons accessible={false} name="options-outline" size={18} color={colors.primary} />
          <Text style={styles.optionText}>{showFilters ? 'Hide filters' : `Filters${activeFilters ? ` (${activeFilters})` : ''}`}</Text>
        </Pressable>}
        {!desktop && showFilters && filters}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions} testID="catalog-sort">
          <Text style={styles.sortLabel}>Sort by</Text>
          {sortOptions.map(option => <Pressable key={option.code} accessibilityRole="button" accessibilityState={{ selected: sort === option.code }}
            onPress={() => setSort(option.code)} style={[styles.sortOption, sort === option.code && styles.sortSelected]}>
            <Text style={[styles.optionText, sort === option.code && styles.selectedText]}>{option.label}</Text>
          </Pressable>)}
        </ScrollView>
        {currencies.length > 1 && (sort === 'price-asc' || sort === 'price-desc') && <Text style={styles.body}>Prices are sorted within each currency.</Text>}
      </View>
      {loading ? <View style={styles.empty}><ActivityIndicator color={colors.primary} /><Text style={styles.body}>Loading products...</Text></View>
        : error ? <View style={styles.empty}><Text accessibilityRole="alert" style={styles.heading}>Products are unavailable right now</Text><Text style={styles.body}>Please try again.</Text><AppButton onPress={load}>Retry</AppButton></View>
          : <><View testID="marketplace-grid" onLayout={event => setGridWidth(event.nativeEvent.layout.width)} style={styles.grid}>
            {visible.map(item => <ListingCard key={item.publicId} item={item} variant="catalog" testID={vertical ? 'catalog-product' : 'product-card'}
              onPress={() => onOpenProduct(item.publicId)} style={{ width: cardWidth ?? '50%' }} />)}
          </View>
          {!filtered.length && <View style={styles.empty}><Ionicons name="search-outline" size={32} color={colors.textMuted} />
            <Text style={styles.heading}>{items.length ? 'No matching products' : 'No products available yet'}</Text>
            <Text style={styles.body}>{items.length ? 'Try another search or adjust your filters.' : 'Check back soon for new listings.'}</Text>
            {!!(activeFilters || query.trim()) && <AppButton variant="outline" onPress={() => { clearFilters(); appState$.marketplace.searchQuery.set(''); }}>Clear search and filters</AppButton>}
          </View>}
          <ScrollPagination testID="catalog-pagination" count={visible.length} hasMore={hasMore} loadMore={loadMore} />
        </>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, minWidth: 0 },
  mobileLayout: { flexDirection: 'column', alignItems: 'stretch' },
  sidebar: { width: 248, flexShrink: 0 },
  filters: { backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingBottom: 12 },
  filterHeader: { paddingLeft: 16, paddingRight: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  filterGroup: { padding: 14, borderTopWidth: 1, borderColor: colors.borderLight, gap: 2 },
  filterTitle: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  filterOption: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36, paddingVertical: 4 },
  filterToggle: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 44, borderWidth: 1, borderColor: colors.borderDark, borderRadius: 6 },
  optionText: { fontFamily: systemFontFamily, fontSize: 13, lineHeight: 20, color: colors.textPrimary, flexShrink: 1 },
  selectedText: { color: colors.primaryDark, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  priceFields: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.borderDark, borderRadius: 6, fontFamily: systemFontFamily, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.surface },
  disabledInput: { backgroundColor: colors.disabledBg },
  errorText: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 18, color: colors.error },
  results: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' },
  resultsHeader: { paddingHorizontal: 16, paddingTop: 8, gap: 8, borderBottomWidth: 1, borderColor: colors.borderLight },
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  breadcrumbLink: { minHeight: 44, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  title: { fontFamily: systemFontFamily, fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.textPrimary },
  heading: { fontFamily: systemFontFamily, fontSize: 17, lineHeight: 24, fontWeight: '600', color: colors.textPrimary },
  body: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 19, color: colors.textSecondary, flexShrink: 1 },
  sortOptions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  sortLabel: { fontFamily: systemFontFamily, fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  sortOption: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  sortSelected: { borderColor: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: 12, padding: 12, minWidth: 0 },
  empty: { alignItems: 'center', padding: 24, gap: 16 },
});

import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "@legendapp/state/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ActivityIndicator, Chip } from "react-native-paper";
import { ListingCard } from "../../components/marketplace/ListingCard";
import { ScrollPagination, useScrollPagination } from "../../components/marketplace/ScrollPagination";
import { formatListingPrice, compareListingPrice, listingLabel } from "../../utils/listingPresentation";
import { StorefrontHero } from "./StorefrontHero";
import { AppButton } from "../../components/ui";
import {
  getStorefrontSections,
  getMarketplaceListing,
  getMarketplaceListings,
} from "../../services/marketplaceApi";
import { appState$ } from "../../state/appState";
import { colors } from "../../theme";
import { systemFontFamily } from "../../theme/typography";
import type { MarketplaceListing } from "../../types/marketplace";
import type { AppRoute } from "../../types/navigation";

import { getBrowserSessionSummary } from '../../services/sessionService';
import { clearRecentViews, recentViews, sectionProducts, type StorefrontSection } from '../../services/storefrontDiscovery';
const descriptions: Record<string, string> = {
  BEST_SELLING: 'Popular picks from confirmed orders.', TRENDING: 'What shoppers have been choosing this week.',
  RECENTLY_VIEWED: 'Pick up where you left off. Saved on this device for 30 days.',
  RECOMMENDED_DEALS: 'Offers based on your recently viewed categories.', FLASH_DEALS: 'Limited-time offers on selected products.',
};
const categories: {
  title: string;
  route: AppRoute;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { title: "All products", route: "marketplaces", icon: "grid-outline" },
  {
    title: "Gift cards & digital",
    route: "digitalMarketplace",
    icon: "gift-outline",
  },
  { title: "Jewellery", route: "jewelryMarketplace", icon: "diamond-outline" },
  { title: "Sharity AI", route: "chat", icon: "sparkles-outline" },
];
export const listingPrice = formatListingPrice;
function CollectionProducts({
  products,
  compact,
  onOpenProduct,
}: {
  products: MarketplaceListing[];
  compact: boolean;
  onOpenProduct: (id: string) => void;
}) {
  const scroll = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  const canScrollLeft = offset > 1;
  const canScrollRight = offset < maxOffset - 1;
  useEffect(() => {
    if (offset > maxOffset) {
      scroll.current?.scrollTo({ x: maxOffset, animated: false });
      setOffset(maxOffset);
    }
  }, [maxOffset, offset]);
  const scrollBy = (direction: -1 | 1) => {
    const nextOffset = Math.max(0, Math.min(maxOffset, offset + direction * Math.max(viewportWidth * 0.8, 200)));
    scroll.current?.scrollTo({ x: nextOffset, animated: true });
    setOffset(nextOffset);
  };
  const cardWidth = compact ? 200 : 230;

  return (
    <View style={styles.carousel} onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        onContentSizeChange={width => setContentWidth(width)}
        onScroll={event => setOffset(event.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
      >
        {products.map(item => (
          <ListingCard
            key={item.publicId}
            item={item}
            testID="discovery-product"
            onPress={() => onOpenProduct(item.publicId)}
            style={{ width: cardWidth }}
          />
        ))}
      </ScrollView>
      {maxOffset > 1 && <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scroll products left"
        accessibilityState={{ disabled: !canScrollLeft }}
        disabled={!canScrollLeft}
        onPress={() => scrollBy(-1)}
        style={({ pressed }) => [styles.carouselArrow, styles.carouselArrowLeft, !canScrollLeft && styles.carouselArrowDisabled, pressed && styles.carouselArrowPressed]}
      >
        <Ionicons name="chevron-back" size={22} color={canScrollLeft ? colors.primary : colors.textMuted} />
      </Pressable>}
      {maxOffset > 1 && <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scroll products right"
        accessibilityState={{ disabled: !canScrollRight }}
        disabled={!canScrollRight}
        onPress={() => scrollBy(1)}
        style={({ pressed }) => [styles.carouselArrow, styles.carouselArrowRight, !canScrollRight && styles.carouselArrowDisabled, pressed && styles.carouselArrowPressed]}
      >
        <Ionicons name="chevron-forward" size={22} color={canScrollRight ? colors.primary : colors.textMuted} />
      </Pressable>}
    </View>
  );
}
export function StorefrontContent({
  onNavigate,
  onOpenProduct,
  landing = false,
  notice = "",
  onCreateAccount,
  showHero = true,
}: {
  onNavigate: (route: AppRoute) => void;
  onOpenProduct: (id: string) => void;
  landing?: boolean;
  showHero?: boolean;
  notice?: string;
  onCreateAccount?: () => void;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 768;
  const query = useSelector(appState$.marketplace.searchQuery);
  const [sections, setSections] = useState<StorefrontSection[] | null>(null);
  const [scope, setScope] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [, setHistoryVersion] = useState(0);
  useEffect(() => {
    const refresh = () => {
      void getStorefrontSections().then(setSections).catch(() => setSections(previous => previous ?? []));
      void getBrowserSessionSummary().then(session => setScope(session ? session.authenticated ? session.publicId || null : 'guest' : null));
      setNow(Date.now());
    };
    refresh();
    if (typeof window !== 'undefined') window.addEventListener('focus', refresh);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => {
    const boundaries = (sections || []).filter(s => s.enabled && s.code === 'FLASH_DEALS')
      .flatMap(s => [s.startsAt, s.endsAt]).filter((date): date is string => !!date)
      .map(Date.parse).filter(time => Number.isFinite(time) && time > now);
    if (!boundaries.length) return;
    const timer = setTimeout(() => {
      setNow(Date.now());
      void getStorefrontSections().then(setSections).catch(() => {});
    }, Math.min(Math.max(1, Math.min(...boundaries) - Date.now() + 25), 2147483647));
    return () => clearTimeout(timer);
  }, [sections, now]);
  const [discoveryItems, setDiscoveryItems] = useState<MarketplaceListing[]>([]);
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const selectedCategories = useSelector(appState$.marketplace.filters.categoryCodes);
  const toggleCategory = (value: string) => {
    appState$.marketplace.filters.categoryCodes.set(current =>
      current.includes(value) ? current.filter(category => category !== value) : [...current, value],
    );
  };
  const [sort, setSort] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const current = await getMarketplaceListings();
      if (!Array.isArray(current)) throw new Error("Invalid catalog");
      setItems(current);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (loading || error || !sections) return;
    let active = true;
    const ids = new Set(sections.filter(s => s.enabled).flatMap(s => s.listingIds.slice(0, 8)));
    if (scope && sections.some(s => s.enabled && ['RECENTLY_VIEWED', 'RECOMMENDED_DEALS'].includes(s.code))) {
      recentViews(scope).slice(0, 8).forEach(view => ids.add(view.id));
    }
    const missing = [...ids].filter(id => !items.some(item => item.publicId === id)).slice(0, 32);
    setDiscoveryItems([]);
    void (async () => {
      const found: MarketplaceListing[] = [];
      for (let offset = 0; offset < missing.length && active; offset += 4) {
        const batch = await Promise.all(missing.slice(offset, offset + 4).map(id => getMarketplaceListing(id).catch(() => null)));
        found.push(...batch.filter((item): item is MarketplaceListing => !!item));
        if (active) setDiscoveryItems([...found]);
      }
    })();
    return () => { active = false; };
  }, [sections, items, scope, loading, error]);
  const visible = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (!selectedCategories.length || selectedCategories.includes(item.categoryCode)) &&
            `${item.title} ${item.description ?? ""} ${item.categoryCode} ${item.sellerDisplayName ?? ""}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .sort((a, b) =>
          sort === 1
            ? compareListingPrice(a, b)
            : sort === 2
              ? compareListingPrice(b, a)
              : 0,
        ),
    [items, query, selectedCategories, sort],
  );
  const collections = query.trim() || selectedCategories.length > 0 || loading || error ? [] : (sections || [])
    .filter(s => s.code !== 'ALL_PRODUCTS')
    .map(section => ({ section, products: sectionProducts(section, [...items, ...discoveryItems], scope || '__unavailable__', now) }))
    .filter(collection => collection.products.length > 0);
  const catalogEnabled = sections !== null && (sections.find(s => s.code === 'ALL_PRODUCTS')?.enabled ?? true);
  const { visible: paginatedItems, hasMore, loadMore } = useScrollPagination(visible);
  const renderCollection = ({ section, products }: { section: StorefrontSection; products: MarketplaceListing[] }) => (
    <View key={section.code} testID={`storefront-${section.code.toLowerCase()}`} style={styles.products}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.body}>{descriptions[section.code]}</Text>
          {section.code === 'FLASH_DEALS' && !!section.endsAt && <Text style={styles.body}>Ends {new Date(section.endsAt).toLocaleString()}</Text>}
        </View>
        {section.code === 'RECENTLY_VIEWED' && <AppButton variant="outline" size="small" onPress={() => { if (scope) clearRecentViews(scope); setHistoryVersion(v => v + 1); }}>Clear history</AppButton>}
      </View>
      {['TRENDING', 'BEST_SELLING', 'RECOMMENDED_DEALS', 'RECENTLY_VIEWED'].includes(section.code)
        ? <CollectionProducts products={products} compact={compact} onOpenProduct={onOpenProduct} />
        : <View style={styles.grid}>{products.map(item => <ListingCard key={item.publicId} item={item} testID="discovery-product" onPress={() => onOpenProduct(item.publicId)} style={{ width: compact ? '47%' : width < 1100 ? '31.5%' : '23.5%' }} />)}</View>}
    </View>
  );
  return (
    <View
      style={styles.stack}
      testID={landing ? "guest-storefront" : "member-storefront"}
    >
      {!!notice && (
        <View accessibilityRole="alert" style={styles.notice}>
          <Text style={styles.body}>{notice}</Text>
          <AppButton onPress={() => onNavigate("signIn")}>
            Sign in to continue
          </AppButton>
        </View>
      )}
      <View style={[styles.categoryStrip, compact && { paddingVertical: 8 }]}>
        {categories.map((item) => (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            onPress={() => {
              appState$.marketplace.searchQuery.set("");
              appState$.marketplace.filters.categoryCodes.set([]);
              onNavigate(item.route);
            }}
            style={[styles.categoryItem, compact && { minHeight: 68 }]}
          >
            <View style={[styles.categoryIcon, compact && { width: 38, height: 38 }]}>
              <Ionicons name={item.icon} size={27} color={colors.primary} />
            </View>
            <Text style={styles.categoryText}>{item.title}</Text>
          </Pressable>
        ))}
      </View>
      {showHero && !error && <StorefrontHero items={items} onNavigate={onNavigate} onOpenProduct={onOpenProduct} landing={landing} onCreateAccount={onCreateAccount}/>}
      {collections.filter(({ section }) => section.code !== 'RECENTLY_VIEWED').map(renderCollection)}
      {catalogEnabled && (loading || error || visible.length > 0 || !!query || selectedCategories.length > 0) && <View testID="storefront-all_products" style={styles.products}>
        <View style={[styles.sectionHeader,compact && {alignItems:"center"}]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, compact && { fontSize: 20, lineHeight: 26 }]}>
              {query ? "Search results" : "All products"}
            </Text>
            {!!query && <Text style={styles.body}>{visible.length} matching listings</Text>}
          </View>
          <AppButton
            size={compact ? "small" : "medium"}
            variant="outline"
            onPress={() => setSort((value) => (value + 1) % 3)}
          >
            {["Featured", "Price: low to high", "Price: high to low"][sort]}
          </AppButton>
        </View>
        <View testID="catalog-filters" style={styles.filters}>
          <Chip selected={!selectedCategories.length} style={!selectedCategories.length ? styles.filterSelected : styles.filter}
            textStyle={!selectedCategories.length ? styles.filterTextSelected : styles.filterText} onPress={() => appState$.marketplace.filters.categoryCodes.set([])}>
            All categories
          </Chip>
          {compact && <AppButton size="small" variant="outline" onPress={() => setShowFilters(value => !value)}>
            {showFilters ? "Hide categories" : selectedCategories.length ? `${selectedCategories.length} selected` : "Show categories"}
          </AppButton>}
          {(!compact || showFilters) && [...new Set(items.map((item) => item.categoryCode).filter(Boolean))]
            .map((code) => (
              <Chip
                key={code}
                selected={selectedCategories.includes(code)}
                style={selectedCategories.includes(code) ? styles.filterSelected : styles.filter}
                textStyle={selectedCategories.includes(code) ? styles.filterTextSelected : styles.filterText}
                onPress={() => toggleCategory(code)}
              >
                {listingLabel(code)}
              </Chip>
            ))}
        </View>
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.body}>Loading products...</Text>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text accessibilityRole="alert" style={styles.sectionTitle}>
              Products are unavailable right now
            </Text>
            <Text style={styles.body}>
              Please try again. You can still browse the rest of Sharity.
            </Text>
            <AppButton onPress={load}>Retry</AppButton>
          </View>
        ) : (
          <>
            <View testID="home-product-grid" style={styles.grid}>
              {paginatedItems.map((item) => (
                <ListingCard key={item.publicId} item={item} onPress={() => onOpenProduct(item.publicId)}
                  style={{ width: compact ? "47%" : width < 1100 ? "31.5%" : "23.5%" }} />
              ))}
            </View>
            <ScrollPagination testID="home-pagination" count={paginatedItems.length} hasMore={hasMore} loadMore={loadMore} />
            {!visible.length && (
              <View style={styles.empty}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text style={styles.sectionTitle}>
                  {query
                    ? "No matching listings. Try a different search."
                    : "No products available yet"}
                </Text>
                <Text style={styles.body}>
                  Check back soon or explore another category.
                </Text>
                {!!query && (
                  <AppButton
                    variant="outline"
                    onPress={() => {
                      appState$.marketplace.searchQuery.set("");
                      appState$.marketplace.filters.categoryCodes.set([]);
                    }}
                  >
                    Clear search
                  </AppButton>
                )}
              </View>
            )}
          </>
        )}
      </View>
      }
      {collections.filter(({ section }) => section.code === 'RECENTLY_VIEWED').map(renderCollection)}
      <View testID="storefront-help" style={styles.help}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sectionTitle}>A question before you choose?</Text>
          <Text style={styles.body}>
            Ask Sharity AI about the marketplace or review the listing details.
          </Text>
        </View>
        <AppButton variant="outline" onPress={() => onNavigate("chat")}>
          Ask Sharity AI
        </AppButton>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { gap: 20, minWidth: 0 },
  categoryStrip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  categoryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 8,
    padding: 4,
    minHeight: 80,
  },
  categoryIcon: {
    height: 48,
    width: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontFamily: systemFontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    width: "100%",
  },
  products: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionTitle: {
    fontFamily: systemFontFamily,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  body: {
    fontFamily: systemFontFamily,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { backgroundColor: colors.surfaceHover, borderWidth: 1, borderColor: colors.border },
  filterSelected: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  filterText: { color: colors.textSecondary },
  filterTextSelected: { color: colors.primaryDark, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 14,
  },
  carousel: { position: "relative", minWidth: 0 },
  carouselContent: { gap: 14, paddingHorizontal: 2, paddingVertical: 6 },
  carouselArrow: {
    position: "absolute",
    top: "45%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  carouselArrowLeft: { left: 8 },
  carouselArrowRight: { right: 8 },
  carouselArrowDisabled: { backgroundColor: colors.disabledBg },
  carouselArrowPressed: { backgroundColor: colors.primaryLight },
  productCard: {
    minWidth: 0,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  productCopy: { padding: 12, gap: 7 },
  productTitle: {
    fontFamily: systemFontFamily,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  seller: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  price: {
    fontFamily: systemFontFamily,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  delivery: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  empty: { padding: 24, gap: 14, alignItems: "flex-start" },
  notice: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  help: {
    padding: 22,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
});

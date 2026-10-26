import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "@legendapp/state/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ActivityIndicator, Chip } from "react-native-paper";
import { ListingCard } from "../../components/marketplace/ListingCard";
import { formatListingPrice, compareListingPrice, listingLabel } from "../../utils/listingPresentation";
import { ProductArtwork } from "../../components/marketplace/ProductArtwork";
import { AppButton } from "../../components/ui";
import {
  getMarketplaceHome,
  getMarketplaceListings,
} from "../../services/marketplaceApi";
import { appState$ } from "../../state/appState";
import { colors } from "../../theme";
import { systemFontFamily } from "../../theme/typography";
import type { MarketplaceListing } from "../../types/marketplace";
import type { AppRoute } from "../../types/navigation";

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
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const current = await getMarketplaceListings().catch(
        async () => (await getMarketplaceHome()).featuredListings,
      );
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
  const visible = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (!category || item.categoryCode === category) &&
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
    [items, query, category, sort],
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
      {showHero && !error && (
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>
              {landing ? "WELCOME TO SHARITY" : "YOUR MARKETPLACE"}
            </Text>
            <Text
              testID="home-hero-title"
              accessibilityRole="header"
              style={[
                styles.heroTitle,
                compact && { fontSize: 26, lineHeight: 32 },
              ]}
            >
              Good finds. Simple choices.
            </Text>
            <Text style={[styles.heroBody, compact && { fontSize: 14, lineHeight: 22 }]}>
              {compact ? 'Digital goods, gift cards and jewellery. Find your next favourite.' : 'Browse digital goods, gift cards and jewellery. Compare listings and find something that fits your day.'}
            </Text>
            <View style={styles.heroActions}>
              <AppButton size={compact ? "small" : "medium"} onPress={() => onNavigate("marketplaces")}>
                Shop all products
              </AppButton>
              {landing && (
                <AppButton size={compact ? "small" : "medium"} variant={compact ? "ghost" : "outline"} onPress={onCreateAccount}>
                  {compact ? "Join Sharity" : "Create an account"}
                </AppButton>
              )}
            </View>
            {!compact && <Text style={styles.note}>
              Browse freely. Sign in when you need your account or saved items.
            </Text>}
          </View>
          {width >= 1100 && items.length > 0 && (
            <View style={styles.heroArt} accessibilityLabel="A selection from the Sharity marketplace">
              {items.filter(item => Boolean(item.imageUrl)).slice(0, 3).map((item, index) => (
                <Pressable key={item.publicId} accessibilityRole="button" accessibilityLabel={`Explore ${item.title}`}
                  onPress={() => onOpenProduct(item.publicId)} style={[styles.showcase, { transform: [{ rotate: `${(index - 1) * 7}deg` }], marginTop: index === 1 ? -18 : 18 }]}>
                  <ProductArtwork item={item} style={{ aspectRatio: .85 }} />
                  <Text numberOfLines={1} style={styles.showcaseTitle}>{item.title}</Text>
                  <Text style={styles.showcasePrice}>{listingPrice(item)}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={styles.products}>
        <View style={[styles.sectionHeader,compact && {alignItems:"center"}]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, compact && { fontSize: 20, lineHeight: 26 }]}>
              {query ? "Search results" : "Explore the marketplace"}
            </Text>
            {(query || !compact) && <Text style={styles.body}>
              {query
                ? `${visible.length} matching listings`
                : "Current listings, clear prices and details before you decide."}
            </Text>}
          </View>
          <AppButton
            size={compact ? "small" : "medium"}
            variant="outline"
            onPress={() => setSort((value) => (value + 1) % 3)}
          >
            {["Featured", "Price: low to high", "Price: high to low"][sort]}
          </AppButton>
        </View>
        {items.some(item => item.demoSeed) && <Text style={styles.body}>{compact ? "Sample catalog ? Demo listings" : "Demo catalog: sample listings for browsing. Purchases depend on checkout availability."}</Text>}
        <View testID="catalog-filters" style={styles.filters}>
          <Chip selected={!category} onPress={() => setCategory("")}>
            All categories
          </Chip>
          {compact && <AppButton size="small" variant="outline" onPress={() => setShowFilters(value => !value)}>
            {showFilters ? "Hide categories" : category ? listingLabel(category) : "Show categories"}
          </AppButton>}
          {(!compact || showFilters) && [...new Set(items.map((item) => item.categoryCode).filter(Boolean))]
            .map((code) => (
              <Chip
                key={code}
                selected={category === code}
                onPress={() => setCategory(category === code ? "" : code)}
              >
                {listingLabel(code)}
              </Chip>
            ))}
        </View>
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.body}>Loading products…</Text>
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
            <View style={styles.grid}>
              {visible.map((item) => (
                <ListingCard key={item.publicId} item={item} onPress={() => onOpenProduct(item.publicId)}
                  style={{ width: compact ? "47%" : width < 1100 ? "31.5%" : "23.5%" }} />
              ))}
            </View>
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
                      setCategory("");
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
      <View style={styles.help}>
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
    borderRadius: 10,
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
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  hero: {
    backgroundColor: "#edf3ff",
    borderRadius: 12,
    padding: 36,
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
    minHeight: 286,
  },
  heroCompact: { padding: 20, minHeight: 0 },
  heroCopy: { flex: 1, gap: 13, minWidth: 0 },
  kicker: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.primary,
  },
  heroTitle: {
    fontFamily: systemFontFamily,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  heroBody: {
    fontFamily: systemFontFamily,
    fontSize: 16,
    lineHeight: 25,
    color: colors.textSecondary,
    maxWidth: 600,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 3,
  },
  note: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  heroArt: {
    width: 420,
    height: 240,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  showcase: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: 10, overflow: "hidden", paddingBottom: 12, borderWidth: 1, borderColor: colors.border },
  showcaseTitle: { fontFamily: systemFontFamily, fontSize: 12, fontWeight: "600", marginHorizontal: 10, marginTop: 8, color: colors.textPrimary },
  showcasePrice: { fontFamily: systemFontFamily, fontSize: 13, fontWeight: "700", marginHorizontal: 10, marginTop: 4, color: colors.primary },
  artCard: {
    width: 236,
    height: 158,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 10,
    transform: [{ rotate: "-6deg" }],
    borderWidth: 1,
    borderColor: "#d1def9",
  },
  artTitle: {
    fontFamily: systemFontFamily,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  artLine: {
    width: 74,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  artBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff8dc",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  products: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
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
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
});

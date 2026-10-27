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
import { StorefrontHero } from "./StorefrontHero";
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
  const category = useSelector(appState$.marketplace.filters.categoryCode);
  const setCategory = (value: string) => appState$.marketplace.filters.categoryCode.set(value);
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
              appState$.marketplace.filters.categoryCode.set("");
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
      <View style={styles.products}>
        <View style={[styles.sectionHeader,compact && {alignItems:"center"}]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text accessibilityRole="header" style={[styles.sectionTitle, compact && { fontSize: 20, lineHeight: 26 }]}>
              {query ? "Search results" : "All products"}
            </Text>
            {query && <Text style={styles.body}>{visible.length} matching listings</Text>}
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
    borderRadius: 8,
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

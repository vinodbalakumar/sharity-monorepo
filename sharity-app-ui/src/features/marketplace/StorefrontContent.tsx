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
export function listingPrice(item: MarketplaceListing) {
  const currency = item.displayCurrencyCode || item.currencyCode;
  const amount = item.displayPriceAmount ?? item.priceAmount;
  if (!Number.isFinite(amount) || !/^[A-Z]{3}$/.test(currency))
    return "Price unavailable";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return "Price unavailable";
  }
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
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState(0);
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
            ? a.priceAmount - b.priceAmount
            : sort === 2
              ? b.priceAmount - a.priceAmount
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
      <View style={styles.categoryStrip}>
        {categories.map((item) => (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            onPress={() => {
              appState$.marketplace.searchQuery.set("");
              onNavigate(item.route);
            }}
            style={styles.categoryItem}
          >
            <View style={styles.categoryIcon}>
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
                compact && { fontSize: 28, lineHeight: 35 },
              ]}
            >
              Good finds. Simple choices.
            </Text>
            <Text style={styles.heroBody}>
              Browse digital goods, gift cards and jewellery. Compare listings
              and find something that fits your day.
            </Text>
            <View style={styles.heroActions}>
              <AppButton onPress={() => onNavigate("marketplaces")}>
                Shop all products
              </AppButton>
              {landing && (
                <AppButton variant="outline" onPress={onCreateAccount}>
                  Create an account
                </AppButton>
              )}
            </View>
            <Text style={styles.note}>
              Browse freely. Sign in when you need your account or saved items.
            </Text>
          </View>
          {!compact && (
            <View
              style={styles.heroArt}
              accessibilityLabel="Gift card and jewellery illustration"
            >
              <View style={styles.artCard}>
                <Ionicons
                  name="gift-outline"
                  size={58}
                  color={colors.primary}
                />
                <Text style={styles.artTitle}>A little more possibility.</Text>
                <View style={styles.artLine} />
              </View>
              <View style={styles.artBadge}>
                <Ionicons
                  name="diamond-outline"
                  size={26}
                  color={colors.primaryDark}
                />
                <Text style={styles.categoryText}>Something for you</Text>
              </View>
            </View>
          )}
        </View>
      )}
      <View style={styles.products}>
        <View style={[styles.sectionHeader,compact && {flexDirection:"column",alignItems:"flex-start"}]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {query ? "Search results" : "Explore the marketplace"}
            </Text>
            <Text style={styles.body}>
              {query
                ? `${visible.length} matching listings`
                : "Current listings, clear prices and details before you decide."}
            </Text>
          </View>
          <AppButton
            variant="outline"
            onPress={() => setSort((value) => (value + 1) % 3)}
          >
            {["Featured", "Price: low to high", "Price: high to low"][sort]}
          </AppButton>
        </View>
        <View style={styles.filters}>
          <Chip selected={!category} onPress={() => setCategory("")}>
            All categories
          </Chip>
          {[...new Set(items.map((item) => item.categoryCode).filter(Boolean))]
            .slice(0, 8)
            .map((code) => (
              <Chip
                key={code}
                selected={category === code}
                onPress={() => setCategory(category === code ? "" : code)}
              >
                {code.replace(/_/g, " ")}
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
                <Pressable
                  testID="product-card"
                  key={item.publicId}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${item.title}`}
                  onPress={() => onOpenProduct(item.publicId)}
                  style={[
                    styles.productCard,
                    {
                      width: compact ? "47%" : width < 1100 ? "31.5%" : "23.5%",
                    },
                  ]}
                >
                  <ProductArtwork item={item} />
                  <View style={styles.productCopy}>
                    <Text numberOfLines={2} style={styles.productTitle}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.seller}>
                      {item.sellerDisplayName || "Marketplace seller"}
                    </Text>
                    <Text style={styles.price}>{listingPrice(item)}</Text>
                    <Text style={styles.delivery}>
                      {String(item.deliveryType || "See listing details")
                        .replace(/_/g, " ")
                        .toLowerCase()}
                    </Text>
                  </View>
                </Pressable>
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
    backgroundColor: "#eaf0ff",
    borderRadius: 12,
    padding: 36,
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
    minHeight: 286,
  },
  heroCompact: { padding: 22, minHeight: 0 },
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
    width: 290,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
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

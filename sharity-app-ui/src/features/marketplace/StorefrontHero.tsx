import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ProductArtwork } from "../../components/marketplace/ProductArtwork";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { systemFontFamily } from "../../theme/typography";
import { colors } from "../../theme";
import type { MarketplaceListing } from "../../types/marketplace";
import type { AppRoute } from "../../types/navigation";

export function StorefrontHero({
  items,
  onNavigate,
  onOpenProduct,
  landing,
  onCreateAccount,
}: {
  items: MarketplaceListing[];
  onNavigate: (route: AppRoute) => void;
  onOpenProduct: (id: string) => void;
  landing: boolean;
  onCreateAccount?: () => void;
}) {
  const { width, isMobile } = useResponsiveLayout();
  const featured = items.find((item) => Boolean(item.imageUrl));
  return (
    <View style={styles.banners}>
      <View style={[styles.primary, isMobile && styles.primaryMobile]}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{landing ? "WELCOME TO SHARITY" : "DISCOVER SOMETHING NEW"}</Text>
          <Text
            testID="home-hero-title"
            accessibilityRole="header"
            style={[styles.title, isMobile && styles.titleMobile]}
          >
            Find something{isMobile ? " " : "\n"}you'll love.
          </Text>
          <Text style={styles.body}>Digital goods, gift cards and jewellery. Explore the collection.</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shop all products"
              onPress={() => onNavigate("marketplaces")}
              style={({ pressed }) => [styles.primaryAction, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryActionText}>Shop all products</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
            </Pressable>
          {landing && !isMobile && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Join Sharity"
                onPress={onCreateAccount || (() => onNavigate("register"))}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Join Sharity</Text>
              </Pressable>
            )}
          </View>
        </View>
        {width >= 1100 && featured && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Explore ${featured.title}`}
            onPress={() => onOpenProduct(featured.publicId)}
            style={styles.featured}
          >
            <ProductArtwork item={featured} style={{ width: "100%", height: 190 }} />
            <Text numberOfLines={2} style={styles.featuredLabel}>
              {featured.title}
            </Text>
          </Pressable>
        )}
      </View>
      {width >= 992 && (
        <View style={styles.collections}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore digital goods"
            onPress={() => onNavigate("digitalMarketplace")}
            style={[styles.collection, { backgroundColor: colors.surfaceVariant }]}
          >
            <View style={styles.collectionCopy}>
              <Text style={styles.collectionEyebrow}>FOR EVERYDAY & EVERY OCCASION</Text>
              <Text style={styles.collectionTitle}>Digital goods & gift cards</Text>
              <Text style={styles.collectionCta}>
                Explore digital <Ionicons name="arrow-forward" size={15} />
              </Text>
            </View>
            <Ionicons name="gift-outline" size={44} color={colors.primaryDark} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore jewellery"
            onPress={() => onNavigate("jewelryMarketplace")}
            style={[styles.collection, { backgroundColor: colors.primaryLight }]}
          >
            <View style={styles.collectionCopy}>
              <Text style={styles.collectionEyebrow}>A LITTLE SOMETHING SPECIAL</Text>
              <Text style={styles.collectionTitle}>Find your next favourite</Text>
              <Text style={styles.collectionCta}>
                Shop jewellery <Ionicons name="arrow-forward" size={15} />
              </Text>
            </View>
            <Ionicons name="diamond-outline" size={44} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  banners: { flexDirection: "row", gap: 16, minWidth: 0 },
  primary: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    padding: 28,
    flex: 2,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 290,
    overflow: "hidden",
  },
  primaryMobile: { padding: 18, minHeight: 0 },
  copy: { flex: 1, minWidth: 0, gap: 12 },
  eyebrow: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    lineHeight: 17,
    color: colors.primaryLight,
  },
  title: {
    fontFamily: systemFontFamily,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: -0.7,
    color: colors.primaryContrast,
  },
  titleMobile: { fontSize: 26, lineHeight: 32 },
  body: { fontFamily: systemFontFamily, fontSize: 14, lineHeight: 22, color: colors.primaryLight, maxWidth: 380 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 4 },
  primaryAction: {
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 7,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryActionText: { fontFamily: systemFontFamily, fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  secondaryAction: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
  secondaryActionText: {
    fontFamily: systemFontFamily,
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryContrast,
    textDecorationLine: "underline",
  },
  featured: { width: 170, borderRadius: 12, backgroundColor: colors.surface, padding: 8, overflow: "hidden" },
  featuredLabel: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    padding: 4,
  },
  collections: { flex: 1, minWidth: 0, gap: 16 },
  collection: { flex: 1, borderRadius: 12, padding: 18, flexDirection: "row", alignItems: "center", gap: 12 },
  collectionCopy: { flex: 1, minWidth: 0, gap: 8 },
  collectionEyebrow: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
    letterSpacing: 0.7,
    color: colors.textSecondary,
  },
  collectionTitle: {
    fontFamily: systemFontFamily,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  collectionCta: {
    fontFamily: systemFontFamily,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.primary,
  },
});

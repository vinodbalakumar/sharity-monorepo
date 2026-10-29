import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { systemFontFamily } from "../../theme/typography";
import type { VisitorContextResponse } from "../../services/publicContentApi";
import {
  footerGroups,
  footerLinkPath,
  type FooterLink,
  type PublicSiteFooterLinkGroup,
} from "./footerContent";
import { SiteNavigationContext } from "./SiteNavigationContext";
import { appState$ } from '../../state/appState';
export type { PublicSiteFooterLinkGroup } from "./footerContent";
type Props = {
  groups?: PublicSiteFooterLinkGroup[];
  onBrandPress?: () => void;
  onLinkPress?: (slug: string) => void;
  visitorContext?: VisitorContextResponse | null;
};
export function PublicSiteFooter({ groups = footerGroups, onLinkPress, visitorContext }: Props) {
  const navigation = useContext(SiteNavigationContext);
  const { width } = useResponsiveLayout();
  const mobile = width < 600;
  const wide = width >= 1100;
  function follow(link: FooterLink) {
    if (link.slug) (onLinkPress || navigation?.openPublicContent)?.(link.slug);
    else if (link.route) {
      if (['marketplaces','digitalMarketplace','jewelryMarketplace'].includes(link.route)) {
        appState$.marketplace.searchQuery.set('');
        appState$.marketplace.filters.categoryCodes.set([]);
      }
      navigation?.navigate(link.route);
    }
  }
  const link = (item: FooterLink, icon?: React.ComponentProps<typeof Ionicons>["name"]) => (
    <Pressable
      key={item.slug || item.route}
      accessibilityRole="link"
      accessibilityLabel={item.label}
      {...(Platform.OS === "web" ? { href: footerLinkPath(item) } : {})}
      onPress={(event) => {
        event.preventDefault();
        follow(item);
      }}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      {icon && <Ionicons name={icon} size={19} color="#f7cc56" />}
      <Text style={styles.linkText}>{item.label}</Text>
    </Pressable>
  );
  return (
    <View testID="site-footer" accessibilityLabel="Sharity site footer" style={styles.footer}>
      <View style={[styles.inner, mobile && styles.innerMobile]}>
        <View style={styles.grid}>
          {groups.map((group) => (
            <View key={group.title} style={[styles.group, { width: mobile ? "47%" : wide ? "14%" : "22%" }]}>
              <Text accessibilityRole="header" style={styles.heading}>
                {group.title.toUpperCase()}
              </Text>
              {group.links.map((item) => link(item))}
            </View>
          ))}
          <View style={[styles.contact, wide ? styles.contactWide : styles.contactStacked]}>
            <Text style={styles.brand}>
              Sharity<Text style={styles.brandDot}>.</Text>
            </Text>
            <Text style={styles.description}>
              Digital goods, gift cards and jewellery. One place to explore.
            </Text>
            <Text style={styles.contactTitle}>Need a hand?</Text>
            <Text style={styles.description}>Find help with buying, selling and your account.</Text>
            {link({ label: "Visit the Help Center", slug: "help-center" }, "help-circle-outline")}
            {!!visitorContext?.countryName && (
              <Text style={styles.region}>Public information for {visitorContext.countryName}</Text>
            )}
          </View>
        </View>
        <View style={styles.bottom}>
          <View style={styles.quickLinks}>
            {link({ label: "Become a seller", route: "sellerVerification" }, "storefront-outline")}
            {link({ label: "Ask Sharity AI", route: "chat" }, "sparkles-outline")}
            {link({ label: "Shop all products", route: "marketplaces" }, "bag-handle-outline")}
          </View>
          <Text style={styles.copyright}>© {new Date().getFullYear()} Sharity. All rights reserved.</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  footer: { width: "100%", backgroundColor: "#172337", marginTop: 20 },
  inner: {
    width: "100%",
    maxWidth: 1328,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingTop: 42,
    paddingBottom: 20,
  },
  innerMobile: { paddingHorizontal: 20, paddingTop: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "space-between" },
  group: { minWidth: 0, gap: 2 },
  heading: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1.1,
    lineHeight: 20,
    color: "#aebbd0",
    marginBottom: 10,
  },
  link: {
    minHeight: 44,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    maxWidth: "100%",
    borderRadius: 4,
  },
  pressed: { backgroundColor: "#23344f" },
  linkText: {
    fontFamily: systemFontFamily,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    color: "#ffffff",
    flexShrink: 1,
  },
  contact: { gap: 8, minWidth: 0 },
  contactWide: { width: "29%", borderLeftWidth: 1, borderColor: "#3a465a", paddingLeft: 28 },
  contactStacked: { width: "100%", borderTopWidth: 1, borderColor: "#3a465a", paddingTop: 24, marginTop: 8 },
  brand: {
    fontFamily: systemFontFamily,
    fontSize: 27,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  brandDot: { color: "#f7cc56" },
  description: { fontFamily: systemFontFamily, fontSize: 13, lineHeight: 22, color: "#d3dceb" },
  contactTitle: {
    fontFamily: systemFontFamily,
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 8,
  },
  region: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 20, color: "#aebbd0" },
  bottom: {
    borderTopWidth: 1,
    borderColor: "#3a465a",
    paddingTop: 18,
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  quickLinks: { flexDirection: "row", flexWrap: "wrap", gap: 24, maxWidth:'100%', minWidth:0 },
  copyright: { fontFamily: systemFontFamily, fontSize: 12, lineHeight: 20, color: "#d3dceb" },
});

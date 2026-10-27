import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "@legendapp/state/react";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { MemberSessionContext } from "./MemberSessionContext";
import { SignOutButton } from "./SignOutButton";
import { PublicSiteFooter } from '../publicSite/PublicSiteFooter';
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Searchbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { getBrowserSessionSummary } from "../../services/sessionService";
import { refreshCartCount } from '../../services/commerceApi';
import { setCartOwner } from '../../state/cartBadge';
import { appState$ } from "../../state/appState";
import { colors } from "../../theme";
import { systemFontFamily } from "../../theme/typography";
import type { AppRoute } from "../../types/navigation";

type Destination = {
  label: string;
  route: AppRoute;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};
const memberDestinations: Destination[] = [
  { label: "Home", route: "home", icon: "home-outline" },
  { label: "Marketplace", route: "marketplaces", icon: "grid-outline" },
  { label: "Orders", route: "orders", icon: "receipt-outline" },
  { label: "Wallet", route: "wallet", icon: "wallet-outline" },
  { label: "Sell", route: "sellerVerification", icon: "add-circle-outline" },
];
const guestDestinations: Destination[] = [
  { label: "Home", route: "welcome", icon: "home-outline" },
  { label: "Marketplace", route: "marketplaces", icon: "grid-outline" },
  { label: "Sharity AI", route: "chat", icon: "sparkles-outline" },
  { label: "Sign in", route: "signIn", icon: "person-outline" },
];
type Props = {
  activeLabel?: string;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
  subtitle?: string;
  title: string;
  scrollable?: boolean;
  publicMode?: boolean;
};
export function InteriorShell({
  activeLabel,
  children,
  onNavigate,
  scrollable = true,
  subtitle,
  title,
}: Props) {
  const { isMobile, isCompactPhone } = useResponsiveLayout();
  const member = useContext(MemberSessionContext);
  const [sessionAuthenticated, setAuthenticated] = useState(false);
  const authenticated = member?.authenticated ?? sessionAuthenticated;
  const [isAdmin, setIsAdmin] = useState(false);
  const cartCount = useSelector(appState$.cart.count);
  const query = useSelector(appState$.marketplace.searchQuery);
  useEffect(() => {
    let active = true;
    const refresh = () => { void getBrowserSessionSummary().then((session) => {
      if (active) {
        setCartOwner(session?.authenticated && member?.authenticated !== false ? session.publicId || null : null);
        if (session?.authenticated && member?.authenticated !== false) void refreshCartCount();
        setAuthenticated(Boolean(session?.authenticated));
        setIsAdmin(
          Boolean(
            session?.authenticated &&
              session.roles?.some((role) =>
                [
                  "ADMIN",
                  "SUPER_ADMIN",
                  "ROLE_ADMIN",
                  "ROLE_SUPER_ADMIN",
                ].includes(role),
              ),
          ),
        );
      }
    }); };
    refresh();
    if (typeof window !== 'undefined') window.addEventListener('focus', refresh);
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('focus', refresh);
      active = false;
    };
  }, [member?.authenticated]);
  const destinations = authenticated ? memberDestinations : guestDestinations;
  const search = (
    <Searchbar
      accessibilityLabel="Search marketplace"
      placeholder="Search products, categories and more"
      value={query}
      onChangeText={(value) => appState$.marketplace.searchQuery.set(value)}
      onSubmitEditing={() => onNavigate("marketplaces")}
      style={styles.search}
      inputStyle={styles.searchInput}
      elevation={0}
    />
  );
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header} testID="app-header">
        <View style={[styles.headerInner, isMobile && styles.headerMobile]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sharity home"
            onPress={() => onNavigate(authenticated ? "home" : "welcome")}
            style={styles.brand}
          >
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            {!isCompactPhone && <Text style={styles.brandName}>Sharity</Text>}
          </Pressable>
          {!isMobile && <View style={styles.searchWrap}>{search}</View>}
          <View
            style={[
              styles.actions,
              isMobile && {
                flex: 1,
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: 4,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={authenticated ? "Profile" : "Sign in"}
              onPress={() =>
                onNavigate(authenticated ? "profilePrivacy" : "signIn")
              }
              style={styles.account}
            >
              <Ionicons
                name="person-outline"
                size={21}
                color={colors.primary}
              />
              {(!isMobile || !authenticated) && (
                <Text style={styles.actionText}>
                  {authenticated ? "Account" : "Sign in"}
                </Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={authenticated && cartCount != null && cartCount > 0 ? `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Cart'}
              onPress={() => onNavigate("cart")}
              style={styles.iconButton}
            >
              <View style={styles.cartIcon}>
                <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
                {authenticated && cartCount != null && cartCount > 0 && <View style={styles.cartBadge} testID="cart-count-badge"><Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text></View>}
              </View>
              {!isMobile && <Text style={styles.actionText}>Cart</Text>}
            </Pressable>
            {isAdmin && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Service operations"
                onPress={() => onNavigate("adminDiagnostics")}
                style={styles.iconButton}
              >
                <Ionicons
                  name="pulse-outline"
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            )}
            <SignOutButton />
          </View>
          {isMobile && <View style={styles.mobileSearch}>{search}</View>}
        </View>
        {!isMobile && (
          <View style={styles.desktopNav} testID="desktop-navigation">
            {destinations.map((item) => (
              <Pressable
                key={item.route}
                accessibilityRole="button"
                accessibilityState={{ selected: activeLabel === item.label }}
                onPress={() => onNavigate(item.route)}
                style={[
                  styles.navItem,
                  activeLabel === item.label && styles.navActive,
                ]}
              >
                <Text
                  style={[
                    styles.navText,
                    activeLabel === item.label && { color: colors.primary },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
            {authenticated && (
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate("chat")}
                style={styles.navItem}
              >
                <Text style={styles.navText}>Sharity AI</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
      <View style={styles.main}>
        {scrollable ? (
          <ScrollView
            testID="page-scroll"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.page, styles.pagePadding, isMobile && styles.pagePaddingMobile]} accessibilityLabel={subtitle ?? title}>
              {children}
            </View>
            <PublicSiteFooter />
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              styles.nonScroll,
              isMobile && styles.contentMobile,
            ]}
          >
            <View style={[styles.page, styles.nonScroll]}>{children}</View>
          </View>
        )}
      </View>
      {isMobile && (
        <View style={styles.bottomNav} testID="mobile-navigation">
          {destinations.map((item) => (
            <Pressable
              key={item.route}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: activeLabel === item.label }}
              onPress={() => onNavigate(item.route)}
              style={styles.bottomItem}
            >
              <Ionicons
                name={item.icon}
                size={21}
                color={
                  activeLabel === item.label
                    ? colors.primary
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.bottomText,
                  activeLabel === item.label && { color: colors.primary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, minWidth: 0, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerInner: {
    width: "100%",
    maxWidth: 1328,
    alignSelf: "center",
    paddingHorizontal: 24,
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
  },
  headerMobile: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    flexWrap: "wrap",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 44, minWidth:44 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLetter: {
    fontFamily: systemFontFamily,
    fontSize: 21,
    fontWeight: "700",
    color: colors.white,
  },
  brandName: {
    fontFamily: systemFontFamily,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.primary,
  },
  searchWrap: { flex: 1, minWidth: 150 },
  mobileSearch: { width: "100%" },
  search: { backgroundColor: '#f7f9ff', borderColor:'#8caaf2', borderWidth:1, borderRadius: 9, height: 50 },
  searchInput: { fontFamily: systemFontFamily, fontSize: 16, minHeight: 48 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto",
  },
  account: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  actionText: {
    fontFamily: systemFontFamily,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cartIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -7, right: -9, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontFamily: systemFontFamily, fontSize: 10, lineHeight: 14, fontWeight: '700', color: '#fff' },
  iconButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  desktopNav: {
    flexDirection: "row",
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  navItem: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  navActive: { borderColor: colors.primary },
  navText: {
    fontFamily: systemFontFamily,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  main: { flex: 1, minHeight: 0, minWidth: 0 },
  content: {
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    flexGrow: 1,
  },
  contentMobile: { padding: 12, paddingBottom: 24 },
  scrollContent:{alignItems:'center',flexGrow:1},
  pagePadding:{maxWidth:1328,padding:24},
  pagePaddingMobile:{padding:12},
  page: { width: "100%", maxWidth: 1280, minWidth: 0 },
  nonScroll: { flex: 1, minHeight: 0 },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
  },
  bottomItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bottomText: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    color: colors.textSecondary,
  },
});

import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLoadingIndicator } from '../../components/ui';
import { mobileTabItems, quickActions, sidebarItems } from './dashboardConfig';
import { buildDashboardDeals, buildDashboardServices, type DashboardDeal, type DashboardService } from './dashboardData';
import { getMarketplaceHome, getMarketplaceListings } from '../../services/marketplaceApi';
import { radii, spacing } from '../../theme';
import type { MarketplaceHomeResponse, MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

const surface = {
  accent: '#7C5CFF',
  accentSoft: '#F1EAFF',
  blue: '#2563EB',
  blueSoft: '#EAF1FF',
  border: '#DCE6F2',
  card: '#FFFFFF',
  cardAlt: '#FFFFFF',
  green: '#1FD39B',
  greenSoft: '#E7F8F1',
  hero: '#FFFFFF',
  heroAlt: '#FFFFFF',
  muted: '#64748B',
  navy: '#0F172A',
  page: '#F6F9FC',
  purple: '#7C5CFF',
  purpleSoft: '#F1EAFF',
  shadow: '#8EA4C2',
  white: '#FFFFFF'
};

type LoadState = {
  dealsError: boolean;
  home: MarketplaceHomeResponse | null;
  homeError: boolean;
  listings: MarketplaceListing[];
  loading: boolean;
};

type HomeScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (productId: string) => void;
};

export function HomeScreen({ onNavigate, onOpenDigitalProduct }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [state, setState] = useState<LoadState>({
    dealsError: false,
    home: null,
    homeError: false,
    listings: [],
    loading: true
  });

  const loadDashboard = useCallback(async () => {
    setState((current) => ({ ...current, dealsError: false, homeError: false, loading: true }));

    const [homeResult, listingsResult] = await Promise.allSettled([getMarketplaceHome(), getMarketplaceListings()]);

    setState({
      dealsError: listingsResult.status === 'rejected',
      home: homeResult.status === 'fulfilled' ? homeResult.value : null,
      homeError: homeResult.status === 'rejected',
      listings: listingsResult.status === 'fulfilled' ? listingsResult.value : [],
      loading: false
    });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const services = useMemo(() => buildDashboardServices(state.home), [state.home]);
  const deals = useMemo(() => buildDashboardDeals(state.listings), [state.listings]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        {isDesktop ? <DashboardSidebar onNavigate={onNavigate} /> : null}
        <View style={styles.main}>
          <DashboardHeader onNavigate={onNavigate} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <WelcomeHeroCard onNavigate={onNavigate} />
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (
                <QuickActionCard key={action.label} icon={action.icon} label={action.label} onNavigate={onNavigate} text={action.text} />
              ))}
            </View>
            <ExploreServicesSection
              error={state.homeError}
              loading={state.loading}
              onNavigate={onNavigate}
              onRetry={loadDashboard}
              services={services}
            />
            <DealsSection
              deals={deals}
              error={state.dealsError}
              loading={state.loading}
              onOpenDigitalProduct={onOpenDigitalProduct}
              onRetry={loadDashboard}
            />
          </ScrollView>
        </View>
      </View>
      {!isDesktop ? <BottomTabs onNavigate={onNavigate} /> : null}
    </SafeAreaView>
  );
}

function DashboardSidebar({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.sidebar}>
      <Pressable onPress={() => onNavigate('home')} style={styles.sidebarBrand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>S</Text>
        </View>
        <View>
          <Text style={styles.sidebarTitle}>Sharity</Text>
          <Text style={styles.sidebarSubcopy}>United States</Text>
        </View>
      </Pressable>
      <View style={styles.sidebarList}>
        {sidebarItems.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => onNavigate(routeForLabel(item.label))}
            style={[styles.sidebarItem, index === 0 && styles.sidebarItemActive]}
          >
            <Ionicons color={index === 0 ? surface.white : surface.navy} name={item.icon} size={19} />
            <Text style={[styles.sidebarItemText, index === 0 && styles.sidebarItemTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DashboardHeader({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => onNavigate('welcome')} style={styles.headerBrand}>
        <View style={styles.brandMarkSmall}>
          <Text style={styles.brandLetterSmall}>S</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>Sharity</Text>
          <Text style={styles.headerSubtitle}>Unified dashboard</Text>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Cart" onPress={() => onNavigate('cart')} style={styles.iconButton}>
          <Ionicons color={surface.navy} name="cart-outline" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Notifications" onPress={() => onNavigate('notifications')} style={styles.iconButton}>
          <Ionicons color={surface.navy} name="notifications-outline" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Profile" onPress={() => onNavigate('profilePrivacy')} style={styles.iconButton}>
          <Ionicons color={surface.navy} name="person-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function WelcomeHeroCard({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroKicker}>WELCOME BACK</Text>
      <Text style={styles.heroTitle}>Welcome to Sharity</Text>
      <Text style={styles.heroText}>Your account, orders, rewards, and marketplace activity in one clean place.</Text>
      <Pressable onPress={() => onNavigate('marketplaces')} style={styles.heroButton}>
        <Text style={styles.heroButtonText}>Explore Marketplace</Text>
      </Pressable>
    </View>
  );
}

function QuickActionCard({
  icon,
  label,
  onNavigate,
  text
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onNavigate: (route: AppRoute) => void;
  text: string;
}) {
  return (
    <Pressable onPress={() => onNavigate(routeForLabel(label))} style={styles.quickCard}>
      <View style={styles.cardIcon}>
        <Ionicons color={surface.blue} name={icon} size={22} />
      </View>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.cardText}>{text}</Text>
      <Text style={styles.cardCta}>Open</Text>
    </Pressable>
  );
}

function ExploreServicesSection({
  error,
  loading,
  onNavigate,
  onRetry,
  services
}: {
  error: boolean;
  loading: boolean;
  onNavigate: (route: AppRoute) => void;
  onRetry: () => void;
  services: DashboardService[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Explore Services</Text>
      {loading ? <LoadingRow label="Loading marketplaces..." /> : null}
      {!loading && error ? <ErrorState label="Unable to load services." onRetry={onRetry} /> : null}
      {!loading && !error && services.length === 0 ? (
        <EmptyState label="No marketplaces are currently available in your region." />
      ) : null}
      {!loading && !error && services.length > 0 ? (
        <View style={styles.serviceGrid}>
          {services.map((service) => (
            <ServiceCard key={service.code} onNavigate={onNavigate} service={service} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ServiceCard({ onNavigate, service }: { onNavigate: (route: AppRoute) => void; service: DashboardService }) {
  return (
    <Pressable onPress={() => onNavigate(routeForService(service.code))} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.cardIcon}>
          <Ionicons color={service.enabled ? surface.green : surface.purple} name={service.icon} size={22} />
        </View>
        {!service.enabled ? <Text style={styles.badge}>Coming Soon</Text> : <Text style={styles.activeBadge}>Active</Text>}
      </View>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.cardText}>{service.description}</Text>
      <Text style={styles.cardCta}>{service.enabled ? 'Browse' : service.ctaLabel}</Text>
    </Pressable>
  );
}

function DealsSection({
  deals,
  error,
  loading,
  onRetry
  , onOpenDigitalProduct
}: {
  deals: DashboardDeal[];
  error: boolean;
  loading: boolean;
  onOpenDigitalProduct: (productId: string) => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Best Deals Across Marketplaces</Text>
      {loading ? <LoadingRow label="Loading deals..." /> : null}
      {!loading && error ? <ErrorState label="Unable to load deals." onRetry={onRetry} /> : null}
      {!loading && !error && deals.length === 0 ? <EmptyState label="No deals available right now." /> : null}
      {!loading && !error && deals.length > 0 ? (
        <View style={styles.dealGrid}>
          {deals.map((deal) => (
            <DealCard deal={deal} key={deal.id} onOpenDigitalProduct={onOpenDigitalProduct} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DealCard({ deal, onOpenDigitalProduct }: { deal: DashboardDeal; onOpenDigitalProduct: (productId: string) => void }) {
  return (
    <Pressable onPress={() => onOpenDigitalProduct(deal.id)} style={styles.dealCard}>
      <View style={styles.dealImage}>
        <Ionicons color={surface.accent} name="pricetag-outline" size={26} />
      </View>
      <Text style={styles.badge}>{deal.badge}</Text>
      <Text style={styles.cardTitle}>{deal.title}</Text>
      <Text style={styles.cardText}>{deal.marketplaceName}</Text>
      <View style={styles.priceRow}>
        {deal.originalPrice ? <Text style={styles.originalPrice}>{formatMoney(deal.originalPrice, deal.currencyCode)}</Text> : null}
        <Text style={styles.dealPrice}>{formatMoney(deal.discountedPrice, deal.currencyCode)}</Text>
      </View>
      <Text style={styles.cardText}>
        {deal.rating ? `Seller rating ${deal.rating}` : 'Seller rating unavailable'} - {deal.productType}
      </Text>
      <Text style={styles.cardCta}>View Deal</Text>
    </Pressable>
  );
}

function BottomTabs({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.bottomTabs}>
      {mobileTabItems.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={() => onNavigate(routeForLabel(item.label))}
          style={styles.bottomTab}
        >
          <Ionicons color={index === 0 ? surface.blue : surface.muted} name={item.icon} size={19} />
          <Text style={[styles.bottomTabText, index === 0 && styles.bottomTabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function routeForLabel(label: string): AppRoute {
  switch (label) {
    case 'Marketplace':
      return 'marketplaces';
    case 'Orders':
    case 'My Orders':
      return 'orders';
    case 'Rewards':
      return 'rewards';
    case 'Cart':
      return 'cart';
    case 'Sell':
      return 'sellerVerification';
    case 'Wallet':
      return 'wallet';
    case 'Profile':
      return 'profilePrivacy';
    default:
      return 'home';
  }
}

function routeForService(code: string): AppRoute {
  if (code === 'ELECTRONICS') {
    return 'electronics';
  }
  return 'marketplaces';
}

function LoadingRow({ label }: { label: string }) {
  return (
    <View style={styles.stateRow}>
      <AppLoadingIndicator />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateText}>{label}</Text>
      <Pressable style={styles.smallButton} onPress={onRetry}>
        <Text style={styles.smallButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateText}>{label}</Text>
      <Text style={styles.cardCta}>Explore Marketplace</Text>
    </View>
  );
}

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencyCode, style: 'currency' }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: surface.page,
    flex: 1
  },
  shell: {
    backgroundColor: surface.page,
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    backgroundColor: surface.card,
    borderRightColor: surface.border,
    borderRightWidth: 1,
    padding: spacing.lg,
    width: 260
  },
  sidebarBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: surface.accent,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    shadowColor: surface.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    width: 48
  },
  brandMarkSmall: {
    alignItems: 'center',
    backgroundColor: surface.accent,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  brandLetter: {
    color: surface.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandLetterSmall: {
    color: surface.white,
    fontSize: 18,
    fontWeight: '900'
  },
  sidebarTitle: {
    color: surface.navy,
    fontSize: 21,
    fontWeight: '900'
  },
  sidebarSubcopy: {
    color: surface.muted,
    fontSize: 12,
    marginTop: 2
  },
  sidebarList: {
    gap: spacing.sm
  },
  sidebarItem: {
    alignItems: 'center',
    backgroundColor: surface.card,
    borderColor: surface.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14
  },
  sidebarItemActive: {
    backgroundColor: surface.accent,
    borderColor: surface.accent
  },
  sidebarItemText: {
    color: surface.navy,
    fontSize: 15,
    fontWeight: '800'
  },
  sidebarItemTextActive: {
    color: surface.white
  },
  main: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: surface.card,
    borderBottomColor: surface.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 70,
    paddingHorizontal: spacing.xl
  },
  headerBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  headerTitle: {
    color: surface.navy,
    fontSize: 22,
    fontWeight: '900'
  },
  headerSubtitle: {
    color: surface.muted,
    fontSize: 12,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: surface.card,
    borderColor: surface.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing['6xl']
  },
  hero: {
    backgroundColor: surface.hero,
    borderRadius: 22,
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing['2xl'],
    shadowColor: surface.shadow,
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 28
  },
  heroTitle: {
    color: surface.navy,
    fontSize: 36,
    fontWeight: '900'
  },
  heroKicker: {
    color: surface.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0
  },
  heroText: {
    color: surface.muted,
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.sm,
    maxWidth: 620
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: surface.accent,
    borderRadius: 14,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: surface.accent,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 16
  },
  heroButtonText: {
    color: surface.white,
    fontSize: 15,
    fontWeight: '900'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  quickCard: {
    backgroundColor: surface.card,
    borderColor: surface.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 210,
    flexGrow: 1,
    minHeight: 160,
    padding: spacing.lg,
    shadowColor: surface.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: surface.blueSoft,
    borderColor: surface.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  cardTitle: {
    color: surface.navy,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md
  },
  cardText: {
    color: surface.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: surface.navy,
    fontSize: 26,
    fontWeight: '900'
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  serviceCard: {
    backgroundColor: surface.card,
    borderColor: surface.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 250,
    flexGrow: 1,
    minHeight: 190,
    padding: spacing.lg,
    shadowColor: surface.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  serviceHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: surface.purpleSoft,
    borderRadius: radii.sm,
    color: surface.purple,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: surface.greenSoft,
    borderColor: '#BCEBD8',
    borderRadius: radii.sm,
    borderWidth: 1,
    color: surface.green,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cardCta: {
    color: surface.blue,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.md,
    textDecorationLine: 'none'
  },
  dealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  dealCard: {
    backgroundColor: surface.card,
    borderColor: surface.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    padding: spacing.lg,
    shadowColor: surface.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  dealImage: {
    alignItems: 'center',
    backgroundColor: surface.accentSoft,
    borderRadius: 16,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  originalPrice: {
    color: surface.muted,
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  dealPrice: {
    color: surface.navy,
    fontSize: 18,
    fontWeight: '900'
  },
  bottomTabs: {
    backgroundColor: surface.card,
    borderTopColor: surface.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm
  },
  bottomTab: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 58
  },
  bottomTabText: {
    color: surface.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  bottomTabTextActive: {
    color: surface.blue,
    fontWeight: '900'
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  stateBox: {
    backgroundColor: surface.card,
    borderColor: surface.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg
  },
  stateText: {
    color: surface.muted,
    fontSize: 14,
    lineHeight: 21
  },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: surface.blue,
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  smallButtonText: {
    color: surface.white,
    fontSize: 14,
    fontWeight: '900'
  }
});

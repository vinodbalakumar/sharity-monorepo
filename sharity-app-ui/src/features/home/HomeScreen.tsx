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
import { colors, radii, spacing } from '../../theme';
import type { MarketplaceHomeResponse, MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

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
          <DashboardHeader />
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
      <View style={styles.sidebarBrand}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.sidebarTitle}>Sharity</Text>
      </View>
      <View style={styles.sidebarList}>
        {sidebarItems.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => {
              if (item.label === 'Marketplace') {
                onNavigate('marketplaces');
              }
            }}
            style={[styles.sidebarItem, index === 0 && styles.sidebarItemActive]}
          >
            <Ionicons color={index === 0 ? colors.white : colors.black} name={item.icon} size={19} />
            <Text style={[styles.sidebarItemText, index === 0 && styles.sidebarItemTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DashboardHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Sharity</Text>
      <View style={styles.headerActions}>
        <Pressable accessibilityLabel="Notifications" style={styles.iconButton}>
          <Ionicons color={colors.black} name="notifications-outline" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Profile" style={styles.iconButton}>
          <Ionicons color={colors.black} name="person-outline" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function WelcomeHeroCard({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Welcome to Sharity</Text>
      <Text style={styles.heroText}>Your all-in-one platform for digital codes, electronics, trading, and more.</Text>
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
    <Pressable onPress={() => (label === 'Cart' ? onNavigate('cart') : undefined)} style={styles.quickCard}>
      <View style={styles.cardIcon}>
        <Ionicons color={colors.black} name={icon} size={22} />
      </View>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.cardText}>{text}</Text>
    </Pressable>
  );
}

function ExploreServicesSection({
  error,
  loading,
  onRetry,
  services
}: {
  error: boolean;
  loading: boolean;
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
            <ServiceCard key={service.code} service={service} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ServiceCard({ service }: { service: DashboardService }) {
  return (
    <Pressable style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.cardIcon}>
          <Ionicons color={colors.black} name={service.icon} size={22} />
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
        <Ionicons color={colors.black} name="pricetag-outline" size={26} />
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
          onPress={() => {
            if (item.label === 'Marketplace') {
              onNavigate('marketplaces');
            }
          }}
          style={styles.bottomTab}
        >
          <Ionicons color={colors.black} name={item.icon} size={19} />
          <Text style={[styles.bottomTabText, index === 0 && styles.bottomTabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
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
    backgroundColor: colors.white,
    flex: 1
  },
  shell: {
    backgroundColor: colors.white,
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
    padding: spacing.md,
    width: 236
  },
  sidebarBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: colors.black,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  logoText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900'
  },
  sidebarTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  sidebarList: {
    gap: spacing.sm
  },
  sidebarItem: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  sidebarItemActive: {
    backgroundColor: colors.black
  },
  sidebarItemText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '800'
  },
  sidebarItemTextActive: {
    color: colors.white
  },
  main: {
    flex: 1
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.xl
  },
  headerTitle: {
    color: colors.black,
    fontSize: 22,
    fontWeight: '900'
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  hero: {
    backgroundColor: colors.black,
    borderRadius: radii.md,
    padding: spacing.xxl
  },
  heroTitle: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900'
  },
  heroText: {
    color: colors.white,
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.sm,
    maxWidth: 620
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  heroButtonText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  quickCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 210,
    flexGrow: 1,
    padding: spacing.lg
  },
  cardIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  cardTitle: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md
  },
  cardText: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 26,
    fontWeight: '900'
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  serviceCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 250,
    flexGrow: 1,
    padding: spacing.lg
  },
  serviceHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.black,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeBadge: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cardCta: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
    marginTop: spacing.md,
    textDecorationLine: 'underline'
  },
  dealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  dealCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    padding: spacing.lg
  },
  dealImage: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
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
    color: colors.black,
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  dealPrice: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900'
  },
  bottomTabs: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
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
    color: colors.black,
    fontSize: 11,
    fontWeight: '700'
  },
  bottomTabTextActive: {
    fontWeight: '900'
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  stateBox: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  stateText: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 21
  },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.black,
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  smallButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900'
  }
});

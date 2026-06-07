import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppLoadingIndicator } from '../../components/ui';
import { InteriorShell } from '../../components/appShell';
import { quickActions } from './dashboardConfig';
import { buildDashboardDeals, buildDashboardServices, type DashboardDeal, type DashboardService } from './dashboardData';
import { getMarketplaceHome, getMarketplaceListings } from '../../services/marketplaceApi';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
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
    <InteriorShell onNavigate={onNavigate} title="Home" activeLabel="Home" scrollable={true}>
      <View>
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
      </View>
    </InteriorShell>
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
        <Ionicons color={colors.info} name={icon} size={22} />
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
          <Ionicons color={service.enabled ? colors.success : colors.primary} name={service.icon} size={22} />
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
        <Ionicons color={colors.tertiary} name="pricetag-outline" size={26} />
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
  hero: {
    backgroundColor: colors.infoLight,
    borderRadius: 22,
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing['2xl'],
    shadowColor: colors.gray900,
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 28
  },
  heroTitle: {
    color: colors.gray900,
    fontSize: 36,
    fontWeight: '900'
  },
  heroKicker: {
    color: colors.info,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0
  },
  heroText: {
    color: colors.gray600,
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.sm,
    maxWidth: 620
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.info,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.info,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 16
  },
  heroButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  quickCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 210,
    flexGrow: 1,
    minHeight: 160,
    padding: spacing.lg,
    shadowColor: colors.gray900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderColor: colors.gray200,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  cardTitle: {
    color: colors.gray900,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.md
  },
  cardText: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.gray900,
    fontSize: 26,
    fontWeight: '900'
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  serviceCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 250,
    flexGrow: 1,
    minHeight: 190,
    padding: spacing.lg,
    shadowColor: colors.gray900,
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
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    borderColor: '#BCEBD8',
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.success,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cardCta: {
    color: colors.info,
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
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    padding: spacing.lg,
    shadowColor: colors.gray900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  dealImage: {
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.lg,
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
    color: colors.gray600,
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  dealPrice: {
    color: colors.gray900,
    fontSize: 18,
    fontWeight: '900'
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  stateBox: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg
  },
  stateText: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 21
  },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.info,
    borderRadius: radius.md,
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

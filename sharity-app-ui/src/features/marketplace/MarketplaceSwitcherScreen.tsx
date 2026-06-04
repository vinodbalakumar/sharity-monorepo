import { Ionicons } from '@expo/vector-icons';
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
import { mobileTabItems, sidebarItems } from '../home/dashboardConfig';
import { buildDashboardDeals, buildDashboardServices, type DashboardDeal, type DashboardService } from '../home/dashboardData';
import { getMarketplaceHome, getMarketplaceListings } from '../../services/marketplaceApi';
import { colors, radii, spacing } from '../../theme';
import type { MarketplaceHomeResponse, MarketplaceListing } from '../../types/marketplace';
import type { AppRoute } from '../../types/navigation';

type MarketplaceSwitcherScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (productId: string) => void;
};

type LoadState = {
  dealsError: boolean;
  home: MarketplaceHomeResponse | null;
  homeError: boolean;
  listings: MarketplaceListing[];
  loading: boolean;
};

export function MarketplaceSwitcherScreen({ onNavigate, onOpenDigitalProduct }: MarketplaceSwitcherScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [notice, setNotice] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({
    dealsError: false,
    home: null,
    homeError: false,
    listings: [],
    loading: true
  });

  const loadMarketplaces = useCallback(async () => {
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
    loadMarketplaces();
  }, [loadMarketplaces]);

  const services = useMemo(() => buildDashboardServices(state.home), [state.home]);
  const activeServices = services.filter((service) => service.enabled);
  const comingSoonServices = services.filter((service) => !service.enabled);
  const deals = useMemo(() => buildDashboardDeals(state.listings), [state.listings]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        {isDesktop ? <SwitcherSidebar onNavigate={onNavigate} /> : null}
        <View style={styles.main}>
          <SwitcherHeader />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Choose Marketplace</Text>
              <Text style={styles.subtitle}>Select where you want to browse, buy, sell, or find deals.</Text>
            </View>

            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <MarketplaceSection
              emptyLabel="No marketplaces are currently available in your region."
              error={state.homeError}
              loading={state.loading}
              onBrowse={(service) => {
                if (service.code === 'ELECTRONICS') {
                  onNavigate('electronics');
                }
              }}
              onRetry={loadMarketplaces}
              services={activeServices}
              title="Active Marketplaces"
            />

            <MarketplaceSection
              emptyLabel="No coming soon marketplaces are configured."
              error={false}
              loading={state.loading}
              onNotify={() => setNotice("You're on the list. We'll notify you when this marketplace is available.")}
              onRetry={loadMarketplaces}
              services={comingSoonServices}
              title="Coming Soon"
            />

            <DealsSection
              deals={deals}
              error={state.dealsError}
              loading={state.loading}
              onOpenDigitalProduct={onOpenDigitalProduct}
              onRetry={loadMarketplaces}
            />
          </ScrollView>
        </View>
      </View>
      {!isDesktop ? <SwitcherBottomTabs onNavigate={onNavigate} /> : null}
    </SafeAreaView>
  );
}

function SwitcherSidebar({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarBrand}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.sidebarTitle}>Sharity</Text>
      </View>
      <View style={styles.sidebarList}>
        {sidebarItems.map((item) => {
          const active = item.label === 'Marketplace';
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                if (item.label === 'Home') {
                  onNavigate('home');
                }
              }}
              style={[styles.sidebarItem, active && styles.sidebarItemActive]}
            >
              <Ionicons color={active ? colors.white : colors.black} name={item.icon} size={19} />
              <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SwitcherHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Choose Marketplace</Text>
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

function MarketplaceSection({
  emptyLabel,
  error,
  loading,
  onNotify,
  onBrowse,
  onRetry,
  services,
  title
}: {
  emptyLabel: string;
  error: boolean;
  loading: boolean;
  onNotify?: () => void;
  onBrowse?: (service: DashboardService) => void;
  onRetry: () => void;
  services: DashboardService[];
  title: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading ? <LoadingRow label="Loading marketplaces..." /> : null}
      {!loading && error ? <ErrorState label="Unable to load marketplaces." onRetry={onRetry} /> : null}
      {!loading && !error && services.length === 0 ? <EmptyState label={emptyLabel} /> : null}
      {!loading && !error && services.length > 0 ? (
        <View style={styles.cardGrid}>
          {services.map((service) => (
            <MarketplaceCard key={service.code} onBrowse={onBrowse} onNotify={onNotify} service={service} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MarketplaceCard({
  onBrowse,
  onNotify,
  service
}: {
  onBrowse?: (service: DashboardService) => void;
  onNotify?: () => void;
  service: DashboardService;
}) {
  return (
    <View style={styles.marketplaceCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons color={colors.black} name={service.icon} size={24} />
        </View>
        <Text style={service.enabled ? styles.activeBadge : styles.badge}>{service.enabled ? 'Active' : 'Coming Soon'}</Text>
      </View>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.cardText}>{service.description}</Text>
      <Text style={styles.countryText}>{service.enabled ? 'Available in USA' : 'Coming soon in USA'}</Text>
      {service.code === 'DIGITAL' ? (
        <Text style={styles.rulesText}>Proof/source review may be required for codes, gift cards, keys, and subscriptions.</Text>
      ) : null}
      {service.code === 'ELECTRONICS' ? (
        <Text style={styles.rulesText}>Seller conditions: New, Used, Refurbished.</Text>
      ) : null}
      <View style={styles.actions}>
        {service.enabled ? (
          <>
            <Pressable onPress={() => onBrowse?.(service)}>
              <Text style={styles.actionButton}>Browse</Text>
            </Pressable>
            <Text style={styles.actionButton}>View Deals</Text>
            <Text style={styles.actionButton}>Sell</Text>
          </>
        ) : (
          <>
            <Pressable onPress={onNotify}>
              <Text style={styles.actionButton}>Notify Me</Text>
            </Pressable>
            <Text style={styles.actionButton}>Learn More</Text>
          </>
        )}
      </View>
    </View>
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
            <Pressable key={deal.id} onPress={() => onOpenDigitalProduct(deal.id)} style={styles.dealCard}>
              <View style={styles.dealImage}>
                <Ionicons color={colors.black} name="pricetag-outline" size={26} />
              </View>
              <Text style={styles.badge}>{deal.badge}</Text>
              <Text style={styles.cardTitle}>{deal.title}</Text>
              <Text style={styles.cardText}>{deal.marketplaceName}</Text>
              <Text style={styles.cardText}>
                {deal.originalPrice ? `${formatMoney(deal.originalPrice, deal.currencyCode)} -> ` : ''}
                {formatMoney(deal.discountedPrice, deal.currencyCode)}
              </Text>
              <Text style={styles.cardText}>
                {deal.rating ? `Seller rating ${deal.rating}` : 'Seller rating unavailable'} - {deal.productType}
              </Text>
              <Text style={styles.actionButton}>View Deal</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SwitcherBottomTabs({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.bottomTabs}>
      {mobileTabItems.map((item) => {
        const active = item.label === 'Marketplace';
        return (
          <Pressable
            key={item.label}
            onPress={() => {
              if (item.label === 'Home') {
                onNavigate('home');
              }
            }}
            style={styles.bottomTab}
          >
            <Ionicons color={colors.black} name={item.icon} size={19} />
            <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
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
      <Pressable onPress={onRetry} style={styles.smallButton}>
        <Text style={styles.smallButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateText}>{label}</Text>
      <Text style={styles.actionButton}>Explore Marketplace</Text>
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
  titleBlock: {
    gap: spacing.sm
  },
  title: {
    color: colors.black,
    fontSize: 36,
    fontWeight: '900'
  },
  subtitle: {
    color: colors.black,
    fontSize: 16,
    lineHeight: 24
  },
  notice: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.black,
    fontSize: 14,
    fontWeight: '800',
    padding: spacing.md
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 26,
    fontWeight: '900'
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  marketplaceCard: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 290,
    flexGrow: 1,
    padding: spacing.lg
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46
  },
  activeBadge: {
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
  badge: {
    backgroundColor: colors.black,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cardTitle: {
    color: colors.black,
    fontSize: 19,
    fontWeight: '900',
    marginTop: spacing.md
  },
  cardText: {
    color: colors.black,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  countryText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
    marginTop: spacing.md
  },
  rulesText: {
    color: colors.black,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  actionButton: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
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

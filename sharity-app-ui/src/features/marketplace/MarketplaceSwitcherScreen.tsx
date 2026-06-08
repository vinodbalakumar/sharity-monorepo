import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { InteriorShell } from '../../components/appShell/InteriorShell';
import { AppLoadingIndicator } from '../../components/ui';
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
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedMarketplaceCode, setSelectedMarketplaceCode] = useState<'ALL' | string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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
  const selectedService = selectedMarketplaceCode === 'ALL'
    ? null
    : services.find((service) => service.code === selectedMarketplaceCode) ?? null;
  const filteredActiveServices = selectedMarketplaceCode === 'ALL'
    ? activeServices
    : activeServices.filter((service) => service.code === selectedMarketplaceCode);
  const filteredComingSoonServices = selectedMarketplaceCode === 'ALL'
    ? comingSoonServices
    : comingSoonServices.filter((service) => service.code === selectedMarketplaceCode);
  const filteredDeals = selectedMarketplaceCode === 'ALL'
    ? deals
    : deals.filter((deal) => deal.marketplaceCode === selectedMarketplaceCode);
  const filteredDealsBySearch = filteredDeals.filter((deal) =>
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.marketplaceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <InteriorShell activeLabel="Marketplace" onNavigate={onNavigate} scrollable={false} subtitle="Discover trusted digital products" title="Marketplace">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Hero Section */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Discover Premium Digital Products</Text>
          <Text style={styles.heroSubtitle}>Secure, verified, and trusted marketplace for digital goods</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <Pressable style={styles.searchInput} onPress={() => {}}>
              <Text style={styles.searchPlaceholder}>Search products...</Text>
            </Pressable>
          </View>
        </View>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.trustText}>Buyer Protection • Secure Delivery • Verified Sellers</Text>
        </View>

        {/* Category Selector */}
        <MarketplaceSelector
          onSelectMarketplace={setSelectedMarketplaceCode}
          selectedMarketplaceCode={selectedMarketplaceCode}
          services={services}
        />

        {selectedService ? (
          <SelectedMarketplaceCard
            onBrowse={() => {
              setSelectedMarketplaceCode(selectedService.code);
              if (selectedService.code === 'ELECTRONICS') {
                onNavigate('electronics');
                return;
              }
              setNotice(`${selectedService.name} selected. Browse featured deals below.`);
            }}
            onNotify={() => setNotice(`You're on the list for ${selectedService.name}. We'll notify you when it is available.`)}
            service={selectedService}
          />
        ) : null}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <MarketplaceSection
          emptyLabel="No marketplaces are currently available in your region."
          error={state.homeError}
          loading={state.loading}
          onBrowse={(service) => {
            setSelectedMarketplaceCode(service.code);
            if (service.code === 'ELECTRONICS') {
              onNavigate('electronics');
              return;
            }
            setNotice(`${service.name} selected. Browse featured deals below.`);
          }}
          onNavigate={onNavigate}
          onRetry={loadMarketplaces}
          services={filteredActiveServices}
          title="Active Marketplaces"
        />

        <MarketplaceSection
          emptyLabel="No coming soon marketplaces are configured."
          error={false}
          loading={state.loading}
          onNavigate={onNavigate}
          onNotify={(serviceName) => setNotice(`You're on the list for ${serviceName}. We'll notify you when this marketplace is available.`)}
          onRetry={loadMarketplaces}
          services={filteredComingSoonServices}
          title="Coming Soon"
        />

        {/* Featured Listings Section */}
        <Text style={styles.sectionTitle}>Featured Listings</Text>
        <Text style={styles.sectionSubtitle}>Popular digital products from verified sellers</Text>
        <DealsSection
          deals={filteredDealsBySearch}
          error={state.dealsError}
          loading={state.loading}
          onOpenDigitalProduct={onOpenDigitalProduct}
          onRetry={loadMarketplaces}
        />
      </ScrollView>
    </InteriorShell>
  );
}

function MarketplaceSection({
  emptyLabel,
  error,
  loading,
  onNavigate,
  onNotify,
  onBrowse,
  onRetry,
  services,
  title
}: {
  emptyLabel: string;
  error: boolean;
  loading: boolean;
  onNavigate?: (route: AppRoute) => void;
  onNotify?: (serviceName: string) => void;
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
            <MarketplaceCard key={service.code} onBrowse={onBrowse} onNavigate={onNavigate} onNotify={onNotify} service={service} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MarketplaceCard({
  onBrowse,
  onNavigate,
  onNotify,
  service
}: {
  onBrowse?: (service: DashboardService) => void;
  onNavigate?: (route: AppRoute) => void;
  onNotify?: (serviceName: string) => void;
  service: DashboardService;
}) {
  return (
    <View style={styles.marketplaceCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <Ionicons color={service.enabled ? '#1FD39B' : '#9A7BFF'} name={service.icon} size={24} />
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
            <Pressable onPress={() => onNavigate?.('seller')}>
              <Text style={styles.actionButton}>Sell</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => onNotify?.(service.name)}>
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
  onOpenDigitalProduct,
  onRetry
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
                <Ionicons color="#7C5CFF" name="pricetag-outline" size={26} />
              </View>
              <Text style={styles.badge}>{deal.badge}</Text>
              <Text style={styles.cardTitle}>{deal.title}</Text>
              <Text style={styles.cardText}>{deal.marketplaceName}</Text>
              <Text style={styles.filterPill}>{deal.marketplaceCode === 'ELECTRONICS' ? 'Electronics' : 'Digital'}</Text>
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

function MarketplaceSelector({
  onSelectMarketplace,
  selectedMarketplaceCode,
  services
}: {
  onSelectMarketplace: (code: 'ALL' | string) => void;
  selectedMarketplaceCode: 'ALL' | string;
  services: DashboardService[];
}) {
  return (
    <View style={styles.selectorCard}>
      <View style={styles.selectorHeader}>
        <Text style={styles.sectionTitle}>Select Marketplace</Text>
        <Text style={styles.selectorHint}>Pick one marketplace to focus the cards and deals below.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.selectorRow}>
          <Pressable
            onPress={() => onSelectMarketplace('ALL')}
            style={[styles.selectorChip, selectedMarketplaceCode === 'ALL' && styles.selectorChipActive]}
          >
            <Text style={[styles.selectorChipText, selectedMarketplaceCode === 'ALL' && styles.selectorChipTextActive]}>All</Text>
          </Pressable>
          {services.map((service) => {
            const active = selectedMarketplaceCode === service.code;
            return (
              <Pressable
                key={service.code}
                onPress={() => onSelectMarketplace(service.code)}
                style={[styles.selectorChip, active && styles.selectorChipActive]}
              >
                <Ionicons color={active ? colors.white : colors.gray700} name={service.icon} size={16} />
                <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>{service.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SelectedMarketplaceCard({
  onBrowse,
  onNotify,
  service
}: {
  onBrowse: () => void;
  onNotify: () => void;
  service: DashboardService;
}) {
  return (
    <View style={styles.selectedCard}>
      <View style={styles.selectedCardTop}>
        <View style={styles.cardIcon}>
          <Ionicons color={service.enabled ? '#1FD39B' : '#9A7BFF'} name={service.icon} size={24} />
        </View>
        <Text style={service.enabled ? styles.activeBadge : styles.badge}>{service.enabled ? 'Active' : 'Coming Soon'}</Text>
      </View>
      <Text style={styles.cardTitle}>{service.name}</Text>
      <Text style={styles.cardText}>{service.description}</Text>
      <View style={styles.selectedActions}>
        {service.enabled ? (
          <>
            <Pressable onPress={onBrowse}>
              <Text style={styles.actionButton}>{service.code === 'ELECTRONICS' ? 'Open Electronics' : 'Browse Deals'}</Text>
            </Pressable>
            <Text style={styles.actionButton}>View More</Text>
          </>
        ) : (
          <Pressable onPress={onNotify}>
            <Text style={styles.actionButton}>Notify Me</Text>
          </Pressable>
        )}
      </View>
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
    backgroundColor: colors.background,
    flex: 1
  },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    marginBottom: spacing.xl,
    alignItems: 'center'
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  heroSubtitle: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.lg,
    textAlign: 'center'
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    gap: spacing.xs
  },
  trustText: {
    color: colors.successDark,
    fontSize: 12,
    fontWeight: '600'
  },
  shell: {
    backgroundColor: colors.white,
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    backgroundColor: colors.white,
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
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#7C5CFF',
    borderRadius: radii.md,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#02040A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    width: 44
  },
  brandLetter: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900'
  },
  sidebarTitle: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '900'
  },
  sidebarSubtitle: {
    color: colors.gray700,
    fontSize: 12,
    marginTop: 2
  },
  sidebarList: {
    gap: spacing.sm
  },
  sidebarItem: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md
  },
  sidebarItemActive: {
    backgroundColor: '#7C5CFF',
    borderColor: '#7C5CFF'
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
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.xl
  },
  headerTitle: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '900'
  },
  headerSubtitle: {
    color: colors.gray700,
    fontSize: 12,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing['6xl'],
    backgroundColor: colors.background
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.xs
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md
  },
  selectorCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  selectorHeader: {
    gap: 4
  },
  selectorHint: {
    color: colors.gray700,
    fontSize: 13
  },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  selectorChip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  selectorChipActive: {
    backgroundColor: '#7C5CFF',
    borderColor: '#7C5CFF'
  },
  selectorChipText: {
    color: colors.gray700,
    fontSize: 13,
    fontWeight: '800'
  },
  selectorChipTextActive: {
    color: colors.white
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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  marketplaceCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 290,
    flexGrow: 1,
    padding: spacing.lg
  },
  selectedCard: {
    backgroundColor: '#FBFAFF',
    borderColor: '#D8CFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  selectedCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  selectedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
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
    backgroundColor: '#111936',
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
    color: colors.gray700,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  filterPill: {
    color: colors.gray700,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs
  },
  countryText: {
    color: colors.gray700,
    fontSize: 13,
    fontWeight: '900',
    marginTop: spacing.md
  },
  rulesText: {
    color: colors.gray700,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    padding: spacing.md,
    marginRight: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3
  },
  dealImage: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.md,
    height: 100,
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
    color: colors.white,
    fontWeight: '900'
  },
  stateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  stateBox: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg
  },
  stateText: {
    color: colors.gray700,
    fontSize: 14,
    lineHeight: 21
  },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#7C5CFF',
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

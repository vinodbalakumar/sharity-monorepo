import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppLoadingIndicator } from '../../components/ui';
import { InteriorShell } from '../../components/appShell';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { getCurrentUser, type CurrentUser } from '../../services/userApi';
import type { VisitorContextResponse } from '../../services/publicContentApi';
import { appStorage } from '../../storage/storage';
import { buildDashboardQuickActions, buildDashboardServices, buildHeroOffers, type DashboardDeal, type DashboardQuickAction, type DashboardService, type HeroOffer } from './dashboardData';
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

type CategoryTile = {
  activeCount: number;
  code: string;
  imageUrl: string | null;
  soldCount: number;
  title: string;
};

type SellerTile = {
  completedOrders: number;
  id: string;
  listingCount: number;
  name: string;
  rating: number;
};

type MarketplaceModuleTile = {
  description: string;
  enabled: boolean;
  imageUrl: string | null;
  title: string;
};

const RECENTLY_VIEWED_STORAGE_KEY = 'sharity_recently_viewed_marketplace_products';

type HomeScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (productId: string) => void;
  visitorContext: VisitorContextResponse | null;
};

export function HomeScreen({ onNavigate, onOpenDigitalProduct, visitorContext }: HomeScreenProps) {
  const { isCompactPhone, isSingleColumn } = useResponsiveLayout();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [state, setState] = useState<LoadState>({
    dealsError: false,
    home: null,
    homeError: false,
    listings: [],
    loading: true
  });
  const [selectedCountryCode, setSelectedCountryCode] = useState(visitorContext?.countryCode ?? '');
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    let disposed = false;

    void getCurrentUser()
      .then((user) => {
        if (!disposed) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (!disposed) {
          setCurrentUser(null);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCountryCode && currentUser?.profile.countryCode) {
      setSelectedCountryCode(currentUser.profile.countryCode);
      return;
    }

    if (!selectedCountryCode && visitorContext?.countryCode) {
      setSelectedCountryCode(visitorContext.countryCode);
    }
  }, [currentUser?.profile.countryCode, selectedCountryCode, visitorContext?.countryCode]);

  useEffect(() => {
    try {
      const raw = appStorage.getString(RECENTLY_VIEWED_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentlyViewedIds(parsed.filter((value): value is string => typeof value === 'string'));
      }
    } catch {
      setRecentlyViewedIds([]);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setState((current) => ({ ...current, dealsError: false, homeError: false, loading: true }));

    const countryQuery = selectedCountryCode ? `?countryCode=${encodeURIComponent(selectedCountryCode)}` : '';
    const [homeResult, listingsResult] = await Promise.allSettled([
      getMarketplaceHome(countryQuery),
      getMarketplaceListings(selectedCountryCode || undefined)
    ]);

    setState({
      dealsError: listingsResult.status === 'rejected',
      home: homeResult.status === 'fulfilled' ? homeResult.value : null,
      homeError: homeResult.status === 'rejected',
      listings: listingsResult.status === 'fulfilled' ? listingsResult.value : [],
      loading: false
    });
  }, [selectedCountryCode]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const effectiveCountryCode = selectedCountryCode || currentUser?.profile.countryCode || visitorContext?.countryCode || undefined;
  const quickActions = useMemo(
    () => buildDashboardQuickActions(state.home, currentUser?.roles ?? [], effectiveCountryCode),
    [currentUser?.roles, effectiveCountryCode, state.home]
  );
  const services = useMemo(() => buildDashboardServices(state.home), [state.home]);
  const heroOffers = useMemo(
    () => buildHeroOffers(state.home, state.listings, effectiveCountryCode),
    [effectiveCountryCode, state.home, state.listings]
  );
  const marketplaceModules = useMemo(
    () => buildMarketplaceModules(state.home, state.listings),
    [state.home, state.listings]
  );
  const featuredCategories = useMemo(
    () => buildFeaturedCategories(state.home, state.listings),
    [state.home, state.listings]
  );
  const trendingCategories = useMemo(
    () => buildTrendingCategories(state.home, state.listings),
    [state.home, state.listings]
  );
  const topDiscounts = useMemo(
    () => buildTopDiscounts(state.listings, effectiveCountryCode),
    [effectiveCountryCode, state.listings]
  );
  const popularProducts = useMemo(
    () => buildPopularProducts(state.home, state.listings, effectiveCountryCode),
    [effectiveCountryCode, state.home, state.listings]
  );
  const topRatedSellers = useMemo(
    () => buildTopRatedSellers(state.home, state.listings),
    [state.home, state.listings]
  );
  const recommendedProducts = useMemo(
    () => buildRecommendedProducts(state.home, state.listings, effectiveCountryCode),
    [effectiveCountryCode, state.home, state.listings]
  );
  const recentlyViewedProducts = useMemo(
    () => buildRecentlyViewedProducts(state.home, state.listings, recentlyViewedIds),
    [recentlyViewedIds, state.home, state.listings]
  );
  const supportedCountries = useMemo(() => {
    const codes = new Set<string>();

    if (visitorContext?.countryCode) {
      codes.add(visitorContext.countryCode);
    }

    (state.home?.categories ?? []).forEach((category) => {
      if (category.countryCode) {
        codes.add(category.countryCode);
      }
    });

    state.listings.forEach((listing) => {
      if (listing.providerCountryCode) {
        codes.add(listing.providerCountryCode);
      }
    });

    return Array.from(codes)
      .sort((left, right) => countryLabel(left).localeCompare(countryLabel(right)))
      .map((countryCode) => ({
        countryCode,
        countryName: visitorContext?.countryCode === countryCode ? visitorContext.countryName : countryLabel(countryCode)
      }));
  }, [state.home?.categories, state.listings, visitorContext?.countryCode, visitorContext?.countryName]);
  useEffect(() => {
    const firstSupportedCountry = supportedCountries[0];
    if (!selectedCountryCode && firstSupportedCountry) {
      setSelectedCountryCode(firstSupportedCountry.countryCode);
    }
  }, [selectedCountryCode, supportedCountries]);

  const handleOpenDigitalProduct = useCallback(
    (productId: string) => {
      try {
        const nextIds = [productId, ...recentlyViewedIds.filter((value) => value !== productId)].slice(0, 12);
        appStorage.setString(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextIds));
        setRecentlyViewedIds(nextIds);
      } catch {
        // Ignore local cache failures.
      }

      onOpenDigitalProduct(productId);
    },
    [onOpenDigitalProduct, recentlyViewedIds]
  );

  const hasError = state.homeError || state.dealsError;

  if (state.loading) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Home" activeLabel="Home" scrollable={true}>
        <View style={styles.contentStack}>
          <MarketplaceHomeSkeleton />
        </View>
      </InteriorShell>
    );
  }

  if (hasError) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Home" activeLabel="Home" scrollable={true}>
        <View style={styles.contentStack}>
          <HomeErrorState onRetry={loadDashboard} />
        </View>
      </InteriorShell>
    );
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="Home" activeLabel="Home" scrollable={true}>
      <View style={styles.contentStack}>
        <WelcomeHeroCard
          heroOffers={heroOffers}
          isCompactPhone={isCompactPhone}
          onNavigate={onNavigate}
          onOpenDigitalProduct={handleOpenDigitalProduct}
          selectedCountryCode={selectedCountryCode}
          featuredCategories={featuredCategories}
        />

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Large marketplace entrances for digital, jewellery, electronics, and more."
          title="Browse Marketplaces"
        >
          <View style={styles.moduleGrid}>
            {marketplaceModules.map((module) => (
              <MarketplaceModuleCard key={module.title} module={module} onNavigate={onNavigate} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Fresh savings from product listings with the strongest discount signals."
          title="Today's Deals"
        >
          <HorizontalProductShelf>
            {topDiscounts.slice(0, 10).map((deal) => (
              <MarketplaceDealCard key={deal.id} layout="shelf" onOpenDigitalProduct={handleOpenDigitalProduct} product={deal} />
            ))}
          </HorizontalProductShelf>
        </SectionBlock>

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Fresh savings from product listings with the strongest discount signals."
          title="Top Categories"
        >
          <View style={styles.categoryGrid}>
            {trendingCategories.slice(0, 4).map((category) => (
              <CategoryCard key={category.code} category={category} onNavigate={onNavigate} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Products shoppers are choosing most often right now."
          title="Popular Products"
        >
          <View style={styles.marketplaceGrid}>
            {popularProducts.slice(0, 8).map((deal) => (
              <MarketplaceDealCard key={deal.id} onOpenDigitalProduct={handleOpenDigitalProduct} product={deal} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Verified sellers with storefront-style cards."
          title="Trusted Sellers"
        >
          <View style={styles.sellerGrid}>
            {topRatedSellers.slice(0, 8).map((seller) => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Listings selected from your country and marketplace activity."
          title="Recommended For You"
        >
          <View style={styles.marketplaceGrid}>
            {recommendedProducts.slice(0, 8).map((product) => (
              <MarketplaceDealCard key={product.id} onOpenDigitalProduct={handleOpenDigitalProduct} product={product} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock
          actionLabel="Show more"
          onAction={() => onNavigate('marketplaces')}
          subtitle="Items you opened before, ready when you return."
          title="Recently Viewed"
        >
          <View style={styles.marketplaceGrid}>
            {recentlyViewedProducts.slice(0, 8).map((product) => (
              <MarketplaceDealCard key={product.id} onOpenDigitalProduct={handleOpenDigitalProduct} product={product} />
            ))}
          </View>
        </SectionBlock>

        <SectionBlock
          subtitle="Quick shortcuts for your account, wallet, cart, selling, and rewards."
          title="Compact Quick Actions"
        >
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <QuickActionCard
                ctaLabel={action.ctaLabel}
                enabled={action.enabled}
                icon={action.icon}
                key={action.label}
                label={action.label}
                onNavigate={onNavigate}
                route={action.route}
                text={action.text}
              />
            ))}
          </View>
        </SectionBlock>

        <ExploreServicesSection
          error={state.homeError}
          loading={state.loading}
          onNavigate={onNavigate}
          onRetry={loadDashboard}
          services={services}
        />
      </View>
    </InteriorShell>
  );
}


function WelcomeHeroCard({
  featuredCategories,
  heroOffers,
  isCompactPhone,
  onNavigate,
  onOpenDigitalProduct,
  selectedCountryCode
}: {
  featuredCategories: CategoryTile[];
  heroOffers: HeroOffer[];
  isCompactPhone: boolean;
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (productId: string) => void;
  selectedCountryCode: string;
}) {
  const carouselRef = useRef<ScrollView | null>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    setActiveHeroIndex(0);
  }, [heroOffers.length, selectedCountryCode]);

  useEffect(() => {
    if (heroOffers.length < 2 || carouselWidth <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setActiveHeroIndex((current) => {
        const next = (current + 1) % heroOffers.length;
        carouselRef.current?.scrollTo({ animated: true, x: next * carouselWidth });
        return next;
      });
    }, 3500);

    return () => {
      clearInterval(intervalId);
    };
  }, [carouselWidth, heroOffers.length]);

  const handleMomentumScrollEnd = useCallback(
    (event: any) => {
      if (carouselWidth <= 0 || heroOffers.length === 0) {
        return;
      }

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth) % heroOffers.length;
      setActiveHeroIndex(nextIndex);
    },
    [carouselWidth, heroOffers.length]
  );

  return (
    <View style={[styles.hero, isCompactPhone && styles.heroCompact]}>
      <View style={[styles.heroSplit, isCompactPhone && styles.heroSplitCompact]}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>Marketplace first</Text>
          <Text style={[styles.heroTitle, isCompactPhone && styles.heroTitleCompact]}>Discover products, deals, and trusted sellers.</Text>
          <Text style={[styles.heroText, isCompactPhone && styles.heroTextCompact]}>
            A light, premium storefront for multi-vertical shopping across digital goods, jewellery, and more.
          </Text>
          <View style={[styles.heroActionRow, isCompactPhone && styles.heroActionRowCompact]}>
            <Pressable onPress={() => onNavigate('marketplaces')} style={[styles.heroButton, isCompactPhone && styles.heroButtonCompact]}>
              <Text style={styles.heroButtonText}>Browse Marketplace</Text>
            </Pressable>
            <Pressable onPress={() => onNavigate('seller')} style={[styles.heroSecondaryButton, isCompactPhone && styles.heroButtonCompact]}>
              <Text style={styles.heroSecondaryButtonText}>Start Selling</Text>
            </Pressable>
          </View>
          <View style={[styles.heroCategoryRow, isCompactPhone && styles.heroCategoryRowCompact]}>
            {featuredCategories.slice(0, 4).map((category) => (
              <Pressable key={category.code} onPress={() => onNavigate('marketplaces')} style={styles.heroCategoryChip}>
                <Text style={styles.heroCategoryText}>{category.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          onLayout={(event) => setCarouselWidth(event.nativeEvent.layout.width)}
          style={[styles.heroOfferPanel, isCompactPhone && styles.heroOfferPanelCompact]}
        >
          {heroOffers.length > 0 ? (
            <ScrollView
              ref={carouselRef}
              horizontal
              contentContainerStyle={styles.heroCarouselContent}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              pagingEnabled
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              style={styles.heroCarousel}
            >
              {heroOffers.map((offer) => (
                <Pressable
                  key={offer.id}
                  onPress={() => onOpenDigitalProduct(offer.id)}
                  style={[styles.heroSlide, { width: carouselWidth || '100%' }]}
                >
                  <Image resizeMode="contain" source={{ uri: offer.imageUrl ?? undefined }} style={styles.heroSlideImage} />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroFallback}>
              <Ionicons color={colors.info} name="pricetag-outline" size={30} />
              <Text style={styles.heroFallbackText}>Featured marketplace promotion</Text>
            </View>
          )}
          {heroOffers.length > 1 ? (
            <View style={styles.heroDotsOverlay}>
              {heroOffers.map((offer, index) => (
                <Pressable key={offer.id} onPress={() => carouselRef.current?.scrollTo({ animated: true, x: index * carouselWidth })} style={styles.heroDotButton}>
                  <View style={[styles.heroDot, index === activeHeroIndex && styles.heroDotActive]} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function QuickActionCard({
  ctaLabel,
  enabled,
  icon,
  label,
  onNavigate,
  route,
  text
}: {
  ctaLabel: string;
  enabled: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onNavigate: (route: AppRoute) => void;
  route: AppRoute;
  text: string;
}) {
  return (
    <Pressable disabled={!enabled} onPress={() => onNavigate(route)} style={[styles.quickCard, !enabled && styles.quickCardDisabled]}>
      <View style={[styles.cardIcon, !enabled && styles.cardIconDisabled]}>
        <Ionicons color={enabled ? colors.info : colors.gray500} name={icon} size={22} />
      </View>
      <Text style={styles.cardTitle}>{label}</Text>
      <Text style={styles.cardText}>{text}</Text>
      <Text style={[styles.cardCta, !enabled && styles.cardCtaDisabled]}>{ctaLabel}</Text>
    </Pressable>
  );
}

function SectionBlock({
  actionLabel,
  children,
  onAction,
  subtitle,
  title
}: {
  actionLabel?: string;
  children: ReactNode;
  onAction?: () => void;
  subtitle?: string;
  title: string;
}) {
  const { isCompactPhone, isSingleColumn } = useResponsiveLayout();

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeadingRow, (isCompactPhone || isSingleColumn) && styles.sectionHeadingRowCompact]}>
        <View style={styles.sectionHeadingCopy}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubcopy}>{subtitle}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={[styles.sectionAction, (isCompactPhone || isSingleColumn) && styles.sectionActionCompact]}>
            <Text style={styles.sectionActionText}>{actionLabel}</Text>
            <Ionicons color={colors.info} name="arrow-forward" size={18} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function MarketplaceDealCard({
  onOpenDigitalProduct,
  product,
  layout = 'grid'
}: {
  onOpenDigitalProduct: (productId: string) => void;
  product: DashboardDeal;
  layout?: 'grid' | 'shelf';
}) {
  return (
    <Pressable onPress={() => onOpenDigitalProduct(product.id)} style={[styles.marketplaceCard, layout === 'shelf' && styles.marketplaceCardShelf]}>
      {product.imageUrl ? (
        <Image resizeMode="cover" source={{ uri: product.imageUrl }} style={[styles.marketplaceImage, layout === 'shelf' && styles.marketplaceImageShelf]} />
      ) : (
        <View style={[styles.marketplaceImageFallback, layout === 'shelf' && styles.marketplaceImageFallbackShelf]}>
          <Ionicons color={colors.info} name={product.marketplaceCode === 'ELECTRONICS' ? 'desktop-outline' : 'pricetag-outline'} size={28} />
          <Text style={styles.marketplaceImageFallbackText}>{product.marketplaceName}</Text>
        </View>
      )}
      <View style={styles.marketplaceCardBody}>
        <View style={styles.marketplaceCardTop}>
          <View style={styles.dealBadgeRow}>
            <Text style={styles.badge}>{product.badge}</Text>
            <Text style={styles.dealCountry}>{countryLabel(product.providerCountryCode)}</Text>
          </View>
          <Text numberOfLines={2} style={styles.cardTitle}>{product.title}</Text>
          <Text style={styles.cardText}>{product.marketplaceName}</Text>
        </View>
        <View style={styles.marketplaceCardBottom}>
          <View style={styles.priceRow}>
            {product.originalPrice ? <Text style={styles.originalPrice}>{formatMoney(product.originalPrice, product.currencyCode)}</Text> : null}
            <Text style={styles.dealPrice}>{formatMoney(product.discountedPrice, product.currencyCode)}</Text>
          </View>
          <Text style={styles.cardText}>
            {product.rating ? `Seller rating ${product.rating}` : 'Seller rating unavailable'} - {product.sellerDisplayName}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function MarketplaceModuleCard({
  module,
  onNavigate
}: {
  module: MarketplaceModuleTile;
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <Pressable onPress={() => onNavigate('marketplaces')} style={styles.moduleCard}>
      {module.imageUrl ? <Image resizeMode="cover" source={{ uri: module.imageUrl }} style={styles.moduleImage} /> : <View style={styles.moduleImageFallback} />}
      <View style={styles.moduleOverlay} />
      <View style={styles.moduleBody}>
        <Text style={styles.moduleTitle}>{module.title}</Text>
        <Text style={styles.moduleText}>{module.description}</Text>
        <Text style={[styles.moduleBadge, module.enabled ? styles.moduleBadgeActive : styles.moduleBadgeDisabled]}>{module.enabled ? 'Browse' : 'Coming soon'}</Text>
      </View>
    </Pressable>
  );
}

function HorizontalProductShelf({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={styles.horizontalShelf}
      decelerationRate="fast"
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function CategoryCard({
  category,
  onNavigate
}: {
  category: CategoryTile;
  onNavigate: (route: AppRoute) => void;
}) {
  const { isCompactPhone, isSingleColumn } = useResponsiveLayout();
  const isCompact = isCompactPhone || isSingleColumn;

  return (
    <Pressable onPress={() => onNavigate('marketplaces')} style={[styles.categoryCard, isCompact && styles.categoryCardCompact]}>
      {category.imageUrl ? (
        <Image resizeMode="cover" source={{ uri: category.imageUrl }} style={[styles.categoryImage, isCompact && styles.categoryImageCompact]} />
      ) : (
        <View style={[styles.categoryImageFallback, isCompact && styles.categoryImageFallbackCompact]}>
          <Ionicons color={colors.info} name="grid-outline" size={28} />
        </View>
      )}
      <View style={[styles.categoryCardBody, isCompact && styles.categoryCardBodyCompact]}>
        <Text numberOfLines={1} style={[styles.cardTitle, isCompact && styles.cardTitleCompact]}>{category.title}</Text>
        <Text style={[styles.cardText, isCompact && styles.cardTextCompact]}>{category.soldCount > 0 ? `${category.soldCount} sold` : `${category.activeCount} active listings`}</Text>
      </View>
    </Pressable>
  );
}

function SellerCard({ seller }: { seller: SellerTile }) {
  return (
    <View style={styles.sellerCard}>
      <View style={styles.sellerCardHeader}>
        <View style={styles.sellerAvatar}>
          <Text style={styles.sellerAvatarText}>{seller.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.sellerStoreTag}>Storefront</Text>
      </View>
      <Text numberOfLines={1} style={styles.cardTitle}>{seller.name}</Text>
      <Text style={styles.cardText}>{seller.rating.toFixed(1)} rating · {seller.completedOrders} completed orders</Text>
      <Text style={styles.cardText}>{seller.listingCount} products available</Text>
      <Text style={styles.cardCta}>Visit Store</Text>
    </View>
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
    <SectionBlock actionLabel="Show more" onAction={() => onNavigate('marketplaces')} subtitle="Navigation modules for the broader marketplace ecosystem." title="Marketplace Services">
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
    </SectionBlock>
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
  onRetry,
  onOpenDigitalProduct
}: {
  deals: DashboardDeal[];
  error: boolean;
  loading: boolean;
  onOpenDigitalProduct: (productId: string) => void;
  onRetry: () => void;
}) {
  return (
    <SectionBlock subtitle="Fresh savings from marketplace listings." title="Today's Deals">
      {loading ? <LoadingRow label="Loading deals..." /> : null}
      {!loading && error ? <ErrorState label="Unable to load deals." onRetry={onRetry} /> : null}
      {!loading && !error && deals.length === 0 ? <EmptyState label="No deals available right now." /> : null}
      {!loading && !error && deals.length > 0 ? (
        <HorizontalProductShelf>
          {deals.map((deal) => (
            <MarketplaceDealCard key={deal.id} layout="shelf" onOpenDigitalProduct={onOpenDigitalProduct} product={deal} />
          ))}
        </HorizontalProductShelf>
      ) : null}
    </SectionBlock>
  );
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

function HomeErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.homeErrorState}>
      <View style={styles.homeErrorBadge}>
        <Ionicons color={colors.info} name="alert-circle-outline" size={22} />
      </View>
      <Text style={styles.homeErrorTitle}>We couldn&apos;t load the marketplace right now.</Text>
      <Text style={styles.homeErrorText}>Try again in a moment to see products, categories, sellers, and offers.</Text>
      <Pressable onPress={onRetry} style={styles.homeErrorButton}>
        <Text style={styles.homeErrorButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function MarketplaceHomeSkeleton() {
  const { isCompactPhone, isSingleColumn } = useResponsiveLayout();

  return (
    <View style={styles.skeletonStack}>
      <View style={[styles.skeletonHero, (isCompactPhone || isSingleColumn) && styles.skeletonHeroCompact]}>
        <View style={styles.skeletonHeroLeft}>
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineSmall} />
          <View style={styles.skeletonButtonRow}>
            <View style={styles.skeletonButton} />
            <View style={styles.skeletonButtonAlt} />
          </View>
        </View>
        <View style={styles.skeletonHeroRight}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonDotsRow}>
            <View style={styles.skeletonDotActive} />
            <View style={styles.skeletonDot} />
            <View style={styles.skeletonDot} />
          </View>
        </View>
      </View>

      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`skeleton-section-${index}`} style={styles.skeletonSection}>
          <View style={styles.skeletonSectionHeader}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonSectionAction} />
          </View>
          <View style={[styles.skeletonGrid, (isCompactPhone || isSingleColumn) && styles.skeletonGridCompact]}>
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <View key={`skeleton-card-${index}-${cardIndex}`} style={[styles.skeletonCard, (isCompactPhone || isSingleColumn) && styles.skeletonCardCompact]} />
            ))}
          </View>
        </View>
      ))}
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

function countryLabel(countryCode: string) {
  const labels: Record<string, string> = {
    AUS: 'Australia',
    CAN: 'Canada',
    DEU: 'Germany',
    GBR: 'United Kingdom',
    IND: 'India',
    USA: 'United States',
    US: 'United States'
  };

  if (!countryCode) {
    return 'Global';
  }

  return labels[countryCode] ?? countryCode;
}

function buildMarketplaceModules(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[]): MarketplaceModuleTile[] {
  const modules: MarketplaceModuleTile[] = [
    {
      description: 'Codes, subscriptions, downloads, and instant delivery offers.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesVertical(listing, ['MARKETPLACE', 'GIFT_CARDS']) || matchesKeyword(listing, ['digital', 'software', 'gift card', 'code'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesVertical(listing, ['MARKETPLACE', 'GIFT_CARDS']) || matchesKeyword(listing, ['digital', 'software', 'gift card', 'code'])),
      title: 'Digital Marketplace'
    },
    {
      description: 'Fashion jewellery and one-gram style collections.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesVertical(listing, ['JEWELLERY']) || matchesKeyword(listing, ['jewellery', 'jewelry', 'gold'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesVertical(listing, ['JEWELLERY']) || matchesKeyword(listing, ['jewellery', 'jewelry', 'gold'])),
      title: 'Imitation Jewellery'
    },
    {
      description: 'Trending phones, gadgets, accessories, and tech listings.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesKeyword(listing, ['electronics', 'phone', 'tech', 'gadget', 'device'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesKeyword(listing, ['electronics', 'phone', 'tech', 'gadget', 'device'])),
      title: 'Electronics'
    },
    {
      description: 'Style-forward listings, apparel, and accessories.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesKeyword(listing, ['fashion', 'apparel', 'style', 'clothing'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesKeyword(listing, ['fashion', 'apparel', 'style', 'clothing'])),
      title: 'Fashion'
    },
    {
      description: 'Cars, parts, accessories, and transport-related listings.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesKeyword(listing, ['auto', 'car', 'bike', 'vehicle'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesKeyword(listing, ['auto', 'car', 'bike', 'vehicle'])),
      title: 'Automotive'
    },
    {
      description: 'Groceries, food items, and essentials from nearby sellers.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesKeyword(listing, ['grocery', 'food', 'meal', 'basket'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesKeyword(listing, ['grocery', 'food', 'meal', 'basket'])),
      title: 'Grocery'
    },
    {
      description: 'Homes, spaces, vehicles, and rental-friendly listings.',
      enabled: hasAnyMatchingListing(listings, (listing) => matchesKeyword(listing, ['rent', 'rental', 'lease'])),
      imageUrl: bestMatchingImage(listings, (listing) => matchesKeyword(listing, ['rent', 'rental', 'lease'])),
      title: 'Rentals'
    }
  ];

  return modules.map((module) => {
    const keyword = module.title.toLowerCase().split(' ')[0] ?? module.title.toLowerCase();
    const homeMatch = home?.verticals?.find((vertical) => (vertical.moduleName ?? '').toLowerCase().includes(keyword) || (vertical.moduleCode ?? '').toLowerCase().includes(keyword));
    return {
      ...module,
      imageUrl: module.imageUrl ?? verticalImageUrl(homeMatch ?? null)
    };
  });
}

function buildTopDiscounts(listings: MarketplaceListing[], countryCode?: string): DashboardDeal[] {
  return listings
    .filter((listing) => matchesVertical(listing, ['MARKETPLACE', 'GIFT_CARDS', 'DIGITAL', 'JEWELLERY']) || matchesKeyword(listing, ['digital', 'software', 'gift card', 'jewellery', 'jewelry', 'gold']))
    .filter((listing) => (listing.displayPriceAmount ?? listing.priceAmount) > 0)
    .filter((listing) => !countryCode || listing.providerCountryCode === countryCode)
    .sort((left, right) => discountRatio(right) - discountRatio(left))
    .slice(0, 10)
    .map((listing) => mapListingToDeal(listing));
}

function buildShelfProducts(
  home: MarketplaceHomeResponse | null,
  listings: MarketplaceListing[],
  countryCode: string | undefined,
  predicate: (listing: MarketplaceListing) => boolean
): DashboardDeal[] {
  const source = home?.featuredListings?.length ? home.featuredListings : listings;
  return source
    .filter((listing) => !countryCode || listing.providerCountryCode === countryCode)
    .filter(predicate)
    .sort((left, right) => (discountRatio(right) + reviewScore(right)) - (discountRatio(left) + reviewScore(left)))
    .slice(0, 12)
    .map((listing) => mapListingToDeal(listing));
}

function buildNewArrivals(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[], countryCode?: string): DashboardDeal[] {
  const source = home?.featuredListings?.length ? home.featuredListings : listings;
  return source
    .filter((listing) => !countryCode || listing.providerCountryCode === countryCode)
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 12)
    .map((listing) => mapListingToDeal(listing));
}

function buildPopularProducts(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[], countryCode?: string): DashboardDeal[] {
  const source = home?.popularListings?.length ? home.popularListings : listings;
  return source
    .filter((listing) => !countryCode || listing.providerCountryCode === countryCode)
    .slice(0, 12)
    .map((listing) => mapListingToDeal(listing));
}

function buildRecommendedProducts(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[], countryCode?: string): DashboardDeal[] {
  const source = home?.featuredListings?.length ? home.featuredListings : listings;
  return source
    .filter((listing) => !countryCode || listing.providerCountryCode === countryCode)
    .slice()
    .sort((left, right) => (reviewScore(right) + discountRatio(right) * 2) - (reviewScore(left) + discountRatio(left) * 2))
    .slice(0, 12)
    .map((listing) => mapListingToDeal(listing));
}

function buildRecentlyViewedProducts(
  home: MarketplaceHomeResponse | null,
  listings: MarketplaceListing[],
  recentlyViewedIds: string[]
): DashboardDeal[] {
  const source = [...(home?.featuredListings ?? []), ...listings];
  const lookup = new Map<string, MarketplaceListing>();

  source.forEach((listing) => {
    lookup.set(listing.publicId, listing);
  });

  const matched = recentlyViewedIds
    .map((productId) => lookup.get(productId))
    .filter((listing): listing is MarketplaceListing => Boolean(listing));

  if (matched.length === 0) {
    return buildPopularProducts(home, listings).slice(0, 6);
  }

  return matched.map((listing) => mapListingToDeal(listing));
}

function buildFeaturedCategories(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[]): CategoryTile[] {
  if (home?.topCategories?.length) {
    return home.topCategories.slice(0, 8).map((category) => ({
      activeCount: category.activeCount,
      code: category.categoryCode,
      imageUrl: category.imageUrl,
      soldCount: category.soldCount,
      title: category.categoryName
    }));
  }

  return deriveCategoryTiles(home, listings).slice(0, 8);
}

function buildTrendingCategories(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[]): CategoryTile[] {
  return deriveCategoryTiles(home, listings)
    .sort((left, right) => right.soldCount - left.soldCount || right.activeCount - left.activeCount || left.title.localeCompare(right.title))
    .slice(0, 8);
}

function buildTopRatedSellers(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[]): SellerTile[] {
  if (home?.topRatedSellers?.length) {
    return home.topRatedSellers.map((seller) => ({
      completedOrders: seller.completedOrders,
      id: seller.sellerPublicId,
      listingCount: seller.listings.length,
      name: seller.sellerName,
      rating: seller.sellerRating
    }));
  }

  const grouped = new Map<string, SellerTile & { reviews: number[] }>();

  listings.forEach((listing) => {
    const key = listing.sellerDisplayName || 'Seller';
    const current = grouped.get(key) ?? {
      completedOrders: 0,
      id: key.toLowerCase().replace(/\s+/g, '-'),
      listingCount: 0,
      name: key,
      rating: 0,
      reviews: []
    };
    current.listingCount += 1;
    current.completedOrders += Math.max(1, listing.publicReviews.length);
    if (listing.publicReviews.length > 0) {
      current.reviews.push(...listing.publicReviews.map((review) => review.rating));
    }
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((seller) => ({
      completedOrders: seller.completedOrders,
      id: seller.id,
      listingCount: seller.listingCount,
      name: seller.name,
      rating: seller.reviews.length > 0 ? seller.reviews.reduce((sum, value) => sum + value, 0) / seller.reviews.length : 0
    }))
    .sort((left, right) => right.rating - left.rating || right.completedOrders - left.completedOrders)
    .slice(0, 8);
}

function deriveCategoryTiles(home: MarketplaceHomeResponse | null, listings: MarketplaceListing[]): CategoryTile[] {
  const byCode = new Map<string, CategoryTile>();
  const counts = new Map<string, { activeCount: number; soldCount: number }>();

  listings.forEach((listing) => {
    const current = counts.get(listing.categoryCode) ?? { activeCount: 0, soldCount: 0 };
    current.activeCount += 1;
    current.soldCount += Math.max(1, listing.publicReviews.length);
    counts.set(listing.categoryCode, current);
  });

  (home?.categories ?? []).forEach((category) => {
    const current = counts.get(category.code) ?? { activeCount: 0, soldCount: 0 };
    if (!byCode.has(category.code)) {
      byCode.set(category.code, {
        activeCount: current.activeCount,
        code: category.code,
        imageUrl: category.imageUrl ?? null,
        soldCount: current.soldCount,
        title: category.name
      });
    }
  });

  (home?.topCategories ?? []).forEach((category) => {
    byCode.set(category.categoryCode, {
      activeCount: category.activeCount,
      code: category.categoryCode,
      imageUrl: category.imageUrl,
      soldCount: category.soldCount,
      title: category.categoryName
    });
  });

  return Array.from(byCode.values());
}

function mapListingToDeal(listing: MarketplaceListing): DashboardDeal {
  const original = listing.originalPriceAmount && listing.originalPriceAmount > listing.priceAmount ? listing.originalPriceAmount : null;

  return {
    badge: original ? `${Math.round(((original - listing.priceAmount) / original) * 100)}% OFF` : 'Deal',
    currencyCode: listing.displayCurrencyCode || listing.currencyCode,
    discountedPrice: listing.displayPriceAmount ?? listing.priceAmount,
    id: listing.publicId,
    imageUrl: listing.imageUrl,
    marketplaceCode: listing.verticalCode === 'JEWELLERY' ? 'JEWELLERY' : 'DIGITAL',
    marketplaceName: listing.verticalCode === 'JEWELLERY' ? 'Imitation Jewellery' : 'Digital Marketplace',
    originalPrice: listing.displayOriginalPriceAmount ?? original,
    providerCountryCode: listing.providerCountryCode,
    productType: listing.productType,
    rating: averageRating(listing),
    sellerDisplayName: listing.sellerDisplayName,
    title: listing.title
  };
}

function averageRating(listing: MarketplaceListing) {
  if (!listing.publicReviews.length) {
    return null;
  }

  const total = listing.publicReviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / listing.publicReviews.length) * 10) / 10;
}

function discountRatio(listing: MarketplaceListing) {
  const original = listing.displayOriginalPriceAmount ?? listing.originalPriceAmount ?? 0;
  const price = listing.displayPriceAmount ?? listing.priceAmount;
  if (!original || original <= price) {
    return 0;
  }

  return (original - price) / original;
}

function reviewScore(listing: MarketplaceListing) {
  const rating = averageRating(listing);
  if (!rating) {
    return 0;
  }

  return rating / 5;
}

function matchesKeyword(listing: MarketplaceListing, keywords: string[]) {
  const haystack = `${listing.title} ${listing.description} ${listing.categoryCode} ${listing.verticalCode} ${listing.productType}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function matchesVertical(listing: MarketplaceListing, verticalCodes: string[]) {
  return verticalCodes.includes(listing.verticalCode) || verticalCodes.includes(listing.categoryCode);
}

function hasAnyMatchingListing(listings: MarketplaceListing[], predicate: (listing: MarketplaceListing) => boolean) {
  return listings.some(predicate);
}

function bestMatchingImage(listings: MarketplaceListing[], predicate: (listing: MarketplaceListing) => boolean) {
  const match = listings.find((listing) => predicate(listing) && listing.imageUrl);
  return match?.imageUrl ?? null;
}

function verticalImageUrl(vertical: MarketplaceHomeResponse['verticals'][number] | null) {
  if (!vertical) {
    return null;
  }

  return vertical.imageUrl ?? vertical.imageUrls?.[0] ?? null;
}

const styles = StyleSheet.create({
  contentStack: {
    gap: spacing.xl,
    paddingBottom: spacing['2xl']
  },
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
    shadowRadius: 28,
    position: 'relative'
  },
  heroBackgroundImage: {
    borderRadius: radius.xl,
    height: '100%',
    opacity: 1,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%'
  },
  heroBackgroundTint: {
    backgroundColor: 'rgba(255,255,255,0.68)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  heroCompact: {
    borderRadius: 18,
    padding: spacing.lg
  },
  heroSplit: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.lg
  },
  heroSplitCompact: {
    flexDirection: 'column'
  },
  heroCopy: {
    flexBasis: '42%',
    flexGrow: 1,
    justifyContent: 'center'
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  heroTopRowCompact: {
    alignItems: 'stretch'
  },
  countryCodeBox: {
    backgroundColor: colors.white,
    borderColor: 'rgba(11,82,194,0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.gray900,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12
  },
  countryCodeBoxCompact: {
    minWidth: 84
  },
  countryCodeLabel: {
    color: colors.gray600,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  countryCodeValue: {
    color: colors.info,
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.xs
  },

  countryChipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    minWidth: 220
  },
  countryChipRowCompact: {
    width: '100%'
  },
  countryChip: {
    backgroundColor: colors.white,
    borderColor: colors.gray300,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  countryChipCompact: {
    maxWidth: '100%'
  },
  countryChipActive: {
    backgroundColor: colors.info,
    borderColor: colors.info
  },
  countryChipText: {
    color: colors.gray700,
    fontSize: 13,
    fontWeight: '800'
  },
  countryChipTextActive: {
    color: colors.white
  },
  heroTitle: {
    color: colors.gray900,
    fontSize: 36,
    fontWeight: '900'
  },
  heroTitleCompact: {
    fontSize: 26,
    lineHeight: 32
  },
  heroKicker: {
    color: colors.info,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  heroText: {
    color: colors.gray600,
    fontSize: 17,
    lineHeight: 26,
    marginTop: spacing.sm,
    maxWidth: 620
  },
  heroTextCompact: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '100%'
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
  heroButtonCompact: {
    alignSelf: 'stretch'
  },
  heroButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900'
  },
  heroSecondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderColor: 'rgba(37,99,235,0.18)',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  heroSecondaryButtonText: {
    color: colors.info,
    fontSize: 15,
    fontWeight: '900'
  },
  heroActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg
  },
  heroActionRowCompact: {
    alignItems: 'stretch'
  },
  heroCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  heroCategoryRowCompact: {
    marginTop: spacing.sm
  },
  heroCategoryChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(37,99,235,0.16)',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  heroCategoryText: {
    color: colors.gray700,
    fontSize: 12,
    fontWeight: '900'
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  heroMetaRowCompact: {
    width: '100%'
  },
  heroMetaPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(37,99,235,0.12)',
    borderRadius: radius.full,
    borderWidth: 1,
    color: colors.gray700,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  heroOfferPanel: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderColor: 'rgba(37,99,235,0.14)',
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: '58%',
    flexGrow: 1,
    marginTop: 0,
    minHeight: 420,
    overflow: 'hidden',
    shadowColor: colors.gray900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    position: 'relative'
  },
  heroOfferPanelCompact: {
    marginTop: spacing.lg,
    minHeight: 340
  },
  heroCarousel: {
    flex: 1
  },
  heroCarouselContent: {
    alignItems: 'stretch',
    height: '100%'
  },
  heroSlide: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center'
  },
  heroSlideImage: {
    height: '100%',
    width: '100%'
  },
  heroDotsOverlay: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: radius.full,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    zIndex: 3
  },
  heroDotButton: {
    padding: 2
  },
  heroDotsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.md,
    position: 'relative',
    zIndex: 2
  },
  heroDot: {
    backgroundColor: colors.gray300,
    borderRadius: radius.full,
    height: 8,
    width: 8
  },
  heroDotActive: {
    backgroundColor: colors.info,
    width: 20
  },
  heroOfferOverlay: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...StyleSheet.absoluteFillObject
  },
  heroFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 340
  },
  heroFallbackText: {
    color: colors.gray700,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm
  },
  quickCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 210,
    flexGrow: 1,
    minHeight: 118,
    padding: spacing.md,
    shadowColor: colors.gray900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  quickCardDisabled: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
    opacity: 0.82
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  moduleCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 260,
    flexGrow: 1,
    minHeight: 250,
    overflow: 'hidden',
    shadowColor: colors.gray900,
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24
  },
  moduleImage: {
    backgroundColor: colors.gray100,
    height: 150,
    width: '100%'
  },
  moduleImageFallback: {
    backgroundColor: '#eef3f8',
    height: 150,
    width: '100%'
  },
  moduleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.08)'
  },
  moduleBody: {
    gap: spacing.xs,
    padding: spacing.lg
  },
  moduleTitle: {
    color: colors.gray900,
    fontSize: 20,
    fontWeight: '900'
  },
  moduleText: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 21
  },
  moduleBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.xs,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  moduleBadgeActive: {
    backgroundColor: 'rgba(37,99,235,0.1)',
    color: colors.info
  },
  moduleBadgeDisabled: {
    backgroundColor: 'rgba(100,116,139,0.12)',
    color: colors.gray600
  },
  horizontalShelf: {
    alignItems: 'stretch',
    gap: spacing.md,
    paddingBottom: spacing.xs,
    paddingRight: spacing.md
  },
  marketplaceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  marketplaceCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    minHeight: 360,
    overflow: 'hidden',
    shadowColor: colors.gray900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20
  },
  marketplaceCardShelf: {
    flexBasis: 280,
    flexGrow: 0,
    width: 280
  },
  marketplaceImage: {
    backgroundColor: colors.gray100,
    height: 190,
    width: '100%'
  },
  marketplaceImageShelf: {
    height: 160
  },
  marketplaceImageFallback: {
    alignItems: 'center',
    backgroundColor: '#eef3f8',
    gap: spacing.sm,
    height: 190,
    justifyContent: 'center'
  },
  marketplaceImageFallbackShelf: {
    height: 160
  },
  marketplaceImageFallbackText: {
    color: colors.gray600,
    fontSize: 13,
    fontWeight: '700'
  },
  marketplaceCardBody: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg
  },
  marketplaceCardTop: {
    gap: spacing.xs
  },
  marketplaceCardBottom: {
    gap: spacing.xs,
    marginTop: 'auto'
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderColor: colors.gray200,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  cardIconDisabled: {
    backgroundColor: colors.gray100
  },
  cardTitle: {
    color: colors.gray900,
    fontSize: 17,
    fontWeight: '900',
    marginTop: spacing.md
  },
  cardText: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  categoryCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '23%',
    flexGrow: 1,
    minHeight: 220,
    overflow: 'hidden',
    shadowColor: colors.gray900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14
  },
  categoryCardCompact: {
    flexBasis: '48%',
    minHeight: 206
  },
  categoryImage: {
    backgroundColor: colors.gray100,
    height: 150,
    width: '100%'
  },
  categoryImageCompact: {
    height: 150
  },
  categoryImageFallback: {
    alignItems: 'center',
    backgroundColor: '#eef3f8',
    height: 150,
    justifyContent: 'center'
  },
  categoryImageFallbackCompact: {
    height: 150
  },
  categoryCardBody: {
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  categoryCardBodyCompact: {
    minHeight: 56
  },
  cardTitleCompact: {
    fontSize: 14,
    marginTop: 0
  },
  cardTextCompact: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 0
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  whyCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    minHeight: 170,
    padding: spacing.lg,
    shadowColor: colors.gray900,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  sellerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  sellerCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 1,
    minHeight: 220,
    padding: spacing.lg,
    shadowColor: colors.gray900,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  sellerCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  sellerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderColor: colors.gray200,
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 52
  },
  sellerAvatarText: {
    color: colors.info,
    fontSize: 20,
    fontWeight: '900'
  },
  sellerStoreTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderRadius: radius.full,
    color: colors.info,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  section: {
    gap: spacing.md
  },
  sectionHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between'
  },
  sectionHeadingRowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column'
  },
  sectionTitle: {
    color: colors.gray900,
    fontSize: 22,
    fontWeight: '900'
  },
  sectionSubcopy: {
    color: colors.gray600,
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 720
  },
  sectionHeadingCopy: {
    flexShrink: 1,
    gap: spacing.xs
  },
  sectionAction: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.18)',
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.md
  },
  sectionActionCompact: {
    alignSelf: 'flex-start',
    marginTop: 12
  },
  sectionActionText: {
    color: colors.info,
    fontSize: 14,
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
  cardCtaDisabled: {
    color: colors.gray500
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
  dealCardCompact: {
    flexBasis: '100%'
  },
  dealImage: {
    borderRadius: radius.lg,
    height: 156,
    marginBottom: spacing.md
  },
  dealImageFallback: {
    alignItems: 'center',
    backgroundColor: '#eef3f8',
    borderColor: colors.gray200,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    height: 156,
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  dealImageFallbackText: {
    color: colors.gray600,
    fontSize: 13,
    fontWeight: '700'
  },
  dealBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between'
  },
  dealCountry: {
    color: colors.gray600,
    fontSize: 12,
    fontWeight: '700'
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
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'line-through'
  },
  dealPrice: {
    color: colors.gray900,
    fontSize: 22,
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
  },
  homeErrorState: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing['2xl'],
    shadowColor: colors.gray900,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20
  },
  homeErrorBadge: {
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  homeErrorTitle: {
    color: colors.gray900,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  homeErrorText: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 560,
    textAlign: 'center'
  },
  homeErrorButton: {
    alignItems: 'center',
    backgroundColor: colors.info,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  homeErrorButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900'
  },
  skeletonStack: {
    gap: spacing.xl
  },
  skeletonHero: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 420,
    padding: spacing['2xl']
  },
  skeletonHeroCompact: {
    flexDirection: 'column',
    minHeight: 0
  },
  skeletonHeroLeft: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center'
  },
  skeletonHeroRight: {
    flex: 1,
    justifyContent: 'center'
  },
  skeletonLineLarge: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 48,
    width: '88%'
  },
  skeletonLineMedium: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 24,
    width: '76%'
  },
  skeletonLineSmall: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 18,
    width: '64%'
  },
  skeletonButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  skeletonButton: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 44,
    width: 150
  },
  skeletonButtonAlt: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 44,
    width: 130
  },
  skeletonImage: {
    backgroundColor: colors.gray100,
    borderRadius: radius.xl,
    height: 320,
    width: '100%'
  },
  skeletonDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md
  },
  skeletonDot: {
    backgroundColor: colors.gray200,
    borderRadius: 999,
    height: 8,
    width: 8
  },
  skeletonDotActive: {
    backgroundColor: colors.info,
    borderRadius: 999,
    height: 8,
    width: 24
  },
  skeletonSection: {
    gap: spacing.md
  },
  skeletonSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  skeletonSectionTitle: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 28,
    width: 220
  },
  skeletonSectionAction: {
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    height: 38,
    width: 120
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  skeletonGridCompact: {
    flexDirection: 'column'
  },
  skeletonCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexBasis: 240,
    flexGrow: 1,
    height: 320
  },
  skeletonCardCompact: {
    flexBasis: '100%',
    height: 220
  }
});

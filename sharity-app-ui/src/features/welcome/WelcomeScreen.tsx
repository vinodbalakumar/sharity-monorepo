import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PublicSiteFooter } from '../../components/publicSite/PublicSiteFooter';
import { getMarketplaceHome } from '../../services/marketplaceApi';
import type { VisitorContextResponse } from '../../services/publicContentApi';
import { spacing } from '../../theme';
import type { MarketplaceCategory, MarketplaceHomeResponse, MarketplaceListing } from '../../types/marketplace';
import { featureCards, footerGroups } from './welcomeContent';

type WelcomeScreenProps = {
  onBrowse: () => void;
  onGetStarted: () => void;
  onOpenPublicContent: (slug: string) => void;
  onOpenMarketplace: (route: 'digitalMarketplace' | 'jewelryMarketplace') => void;
  onSearchMarketplace: (query: string) => void;
  onSignIn: () => void;
  visitorContext: VisitorContextResponse | null;
};

type TopCategoryCard = {
  activeCount: number;
  categoryCode: string;
  categoryName: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  imageUrl: string | null;
  maxDiscountPercent: number;
  soldCount: number;
  slug: string;
  verticalCode: string;
};

type DealCard = {
  categoryName: string;
  currencyCode: string;
  discountedPrice: number;
  discountPercentage: number;
  imageUrl: string | null;
  originalPrice: number;
  title: string;
  verticalCode: string;
};

type FeaturedProductCard = {
  categoryName: string;
  currencyCode: string;
  imageUrl: string | null;
  originalPrice: number;
  price: number;
  sellerName: string;
  title: string;
  verticalCode: string;
  verifiedSeller: boolean;
};

type SellerCard = {
  completedOrders: number;
  listings: MarketplaceListing[];
  name: string;
  rating: number;
};

type HeroSlide = {
  id: string;
  imageUrl: string;
  kicker: string;
  meta: string;
  sortOrder?: number;
  subtitle: string;
  title: string;
  verticalCode: string;
};

const heroPills = ['Protected checkout', 'Verified sellers', 'Secure delivery'];
const webHeroGradient = Platform.OS === 'web'
  ? ({ backgroundImage: 'linear-gradient(120deg, #fff8ee 0%, #f7fbff 38%, #eefcf2 72%, #edf3ff 100%)' } as never)
  : null;
const webHeroCardGradient = Platform.OS === 'web'
  ? ({
      backgroundImage:
        'radial-gradient(circle at 12% 10%, rgba(59,130,246,0.10), transparent 30%), radial-gradient(circle at 88% 8%, rgba(245,158,11,0.08), transparent 28%), linear-gradient(135deg, #ffffff 0%, #f8fbff 50%, #fff8ec 100%)'
    } as never)
  : null;
const webHeroContentGradient = Platform.OS === 'web'
  ? ({
      backgroundImage:
        'radial-gradient(circle at 12% 10%, rgba(59,130,246,0.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(245,158,11,0.10), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 50%, rgba(255,248,236,0.98) 100%)'
    } as never)
  : null;
const webGlassPanel = Platform.OS === 'web'
  ? ({
      backdropFilter: 'blur(18px)',
      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(248,251,255,0.76) 100%)'
    } as never)
  : null;
const webItemsSoldGradient = Platform.OS === 'web'
  ? ({
      backgroundImage:
        'radial-gradient(circle at 10% 20%, rgba(37,99,235,0.25), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.12), transparent 26%), linear-gradient(135deg, #0b1028 0%, #121a3a 52%, #0f172a 100%)'
    } as never)
  : null;

export function WelcomeScreen({
  onBrowse,
  onGetStarted,
  onOpenMarketplace,
  onOpenPublicContent,
  onSearchMarketplace,
  onSignIn,
  visitorContext
}: WelcomeScreenProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 992;
  const isMobile = width < 760;
  const isSmallPhone = width < 390;
  const isTablet = width >= 760 && width < 992;
  const isTinyPhone = width < 480;
  const isDesktop = width >= 992;
  const isWeb = Platform.OS === 'web';
  const contentPadding = isMobile ? 16 : width >= 1600 ? 64 : width >= 1400 ? 48 : 32;
  const heroCardHeight = isMobile ? 220 : width < 992 ? 440 : 520;
  const productImageHeight = isMobile ? 180 : width < 992 ? 200 : 260;
  const categoryVisibleCount = isDesktop ? 4 : isTablet ? 2 : 1;
  const productVisibleCount = isDesktop ? 4 : isTablet ? 2 : 1;
  const collectionVisibleCount = isDesktop ? 3 : isTablet ? 2 : 1;
  const collectionGridWebStyle =
    isWeb
      ? ({
          display: 'grid',
          gridTemplateColumns: width >= 1200 ? 'repeat(3, minmax(0, 1fr))' : width >= 768 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          gap: 24,
          width: '100%'
        } as never)
      : null;
  const categoryGridWebStyle =
    isWeb
      ? ({
          display: 'grid',
          gridTemplateColumns:
            width >= 1400
              ? 'repeat(6, minmax(0, 1fr))'
              : width >= 1200
                ? 'repeat(4, minmax(0, 1fr))'
                : width >= 768
                  ? 'repeat(3, minmax(0, 1fr))'
                  : 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          justifyContent: 'center',
          width: '100%'
        } as never)
      : null;
  const productGridWebStyle =
    isWeb
      ? ({
          display: 'grid',
          gridTemplateColumns:
            width >= 1600
              ? 'repeat(5, minmax(0, 1fr))'
              : width >= 1200
                ? 'repeat(4, minmax(0, 1fr))'
                : width >= 992
                  ? 'repeat(2, minmax(0, 1fr))'
                  : width >= 768
                    ? 'repeat(2, minmax(0, 1fr))'
                    : 'repeat(2, minmax(0, 1fr))',
          gap: 24,
          width: '100%'
        } as never)
      : null;
  const featureGridWebStyle =
    isWeb
      ? ({
          display: 'grid',
          gridTemplateColumns: width >= 992 ? 'repeat(4, minmax(0, 1fr))' : width >= 768 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          gap: 24,
          width: '100%'
        } as never)
      : null;
  const metricGridWebStyle =
    isWeb
      ? ({
          display: 'grid',
          gridTemplateColumns: width >= 992 ? 'repeat(4, minmax(0, 1fr))' : width >= 768 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          gap: 24,
          width: '100%'
        } as never)
      : null;
  const heroGridWebStyle =
    isWeb
      ? ({
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 42fr) minmax(0, 58fr)',
          gap: 32,
          alignItems: 'stretch',
          width: '100%'
        } as never)
      : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [home, setHome] = useState<MarketplaceHomeResponse | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [heroViewportWidth, setHeroViewportWidth] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const heroScrollRef = useRef<ScrollView | null>(null);
  const heroResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeRequestIdRef = useRef(0);

  const loadHome = useCallback(async () => {
    const requestId = homeRequestIdRef.current + 1;
    homeRequestIdRef.current = requestId;
    setHomeLoading(true);
    setHomeError(false);

    try {
      const countryQuery = visitorContext?.countryCode ? `?countryCode=${encodeURIComponent(visitorContext.countryCode)}` : '';
      const response = await getMarketplaceHome(countryQuery);
      if (homeRequestIdRef.current === requestId) {
        setHome(response);
        setHomeError(false);
      }
    } catch {
      if (homeRequestIdRef.current === requestId) {
        setHomeError(true);
      }
    } finally {
      if (homeRequestIdRef.current === requestId) {
        setHomeLoading(false);
      }
    }
  }, [visitorContext?.countryCode]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const normalizedCategories = useMemo(() => buildTopCategories(home), [home]);
  const topCategories = normalizedCategories;
  const mobileCategoryPages = useMemo(() => (isMobile ? chunkArray(topCategories, 4) : [topCategories]), [isMobile, topCategories]);
  const discountedItems = useMemo(() => buildDiscountedItems(home), [home]);
  const rollbackOffers = useMemo(() => buildListingDealCards(home?.rollbackOffers ?? [], home), [home]);
  const clearanceItems = useMemo(() => buildListingDealCards(home?.clearanceListings ?? [], home), [home]);
  const featuredProducts = useMemo(() => buildFeaturedProducts(home), [home]);
  const popularProducts = useMemo(() => home?.popularListings ?? [], [home]);
  const sellerCards = useMemo(() => buildSellerCards(home), [home]);
  const metrics = useMemo(() => buildMetrics(home, sellerCards.length), [home, sellerCards.length]);
  const heroVerticalSource = useMemo(() => extractHeroVerticalSource(home), [home]);
  const heroSlides = useMemo(() => normalizeHeroSlides(home), [home]);
  const topDiscounts = discountedItems;
  const rollbackDeals = rollbackOffers;
  const clearanceDeals = clearanceItems;
  const trustedSellers = sellerCards;
  const sellerCarouselRef = useRef<ScrollView | null>(null);
  const sellerScrollOffsetRef = useRef(0);
  const sellerCardWidth = isMobile ? 260 : 300;
  const sellerCarouselStep = sellerCardWidth + 24;
  const isHomeInitialLoading = homeLoading && !home;
  const isHomeErrorState = homeError && !home;
  const activeHeroSlide = heroSlides[activeHeroIndex] ?? heroSlides[0] ?? null;

  const scrollHeroToIndex = useCallback(
    (index: number) => {
      if (heroViewportWidth <= 0 || heroSlides.length === 0) {
        return;
      }

      heroScrollRef.current?.scrollTo({ animated: true, x: index * heroViewportWidth, y: 0 });
    },
    [heroSlides.length, heroViewportWidth]
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('Marketplace home response:', home);
      console.log('Marketplace home category data:', normalizedCategories);
      console.log('Hero vertical source:', heroVerticalSource);
      console.log('Normalized hero slides:', heroSlides);
      console.log('Top discounts count:', topDiscounts.length);
      console.log('Rollback offers count:', rollbackDeals.length);
      console.log('Clearance items count:', clearanceDeals.length);
      console.log('Featured products count:', featuredProducts.length);
      console.log('Popular products count:', popularProducts.length);
      console.log('Trusted sellers count:', trustedSellers.length);
      console.log('Hero slides count:', heroSlides.length, 'activeIndex:', activeHeroIndex);
    }
  }, [activeHeroIndex, clearanceDeals.length, featuredProducts.length, heroSlides, heroVerticalSource, normalizedCategories, popularProducts.length, rollbackDeals.length, topDiscounts.length, trustedSellers.length, home]);

  useEffect(() => {
    if (heroSlides.length <= 1 || isHeroPaused) {
      return;
    }

    const timer = setInterval(() => {
      setActiveHeroIndex((current) => {
        return (current + 1) % heroSlides.length;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [heroSlides.length, isHeroPaused]);

  useEffect(() => {
    scrollHeroToIndex(activeHeroIndex);
  }, [activeHeroIndex, scrollHeroToIndex]);

  useEffect(() => {
    if (heroSlides.length > 0 && activeHeroIndex >= heroSlides.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroSlides.length]);

  useEffect(() => {
    return () => {
      if (heroResumeTimeoutRef.current) {
        clearTimeout(heroResumeTimeoutRef.current);
      }
    };
  }, []);

  const pauseHeroAutoplay = useCallback(() => {
    setIsHeroPaused(true);
    if (heroResumeTimeoutRef.current) {
      clearTimeout(heroResumeTimeoutRef.current);
    }

    heroResumeTimeoutRef.current = setTimeout(() => {
      setIsHeroPaused(false);
    }, 2500);
  }, []);

  const handleHeroSlidePress = useCallback(
    (index: number) => {
      pauseHeroAutoplay();
      setActiveHeroIndex(index);
      scrollHeroToIndex(index);
    },
    [pauseHeroAutoplay, scrollHeroToIndex]
  );

  const scrollTrustedSellers = useCallback(
    (direction: 'previous' | 'next') => {
      const delta = direction === 'next' ? sellerCarouselStep : -sellerCarouselStep;
      const nextOffset = Math.max(0, sellerScrollOffsetRef.current + delta);
      sellerScrollOffsetRef.current = nextOffset;
      sellerCarouselRef.current?.scrollTo({ animated: true, x: nextOffset, y: 0 });
    },
    [sellerCarouselStep]
  );

  const handleHeroMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (heroViewportWidth <= 0 || heroSlides.length === 0) {
        return;
      }

      const nextIndex = Math.max(0, Math.min(heroSlides.length - 1, Math.round(event.nativeEvent.contentOffset.x / heroViewportWidth)));
      setActiveHeroIndex(nextIndex);
      pauseHeroAutoplay();
    },
    [heroSlides.length, heroViewportWidth, pauseHeroAutoplay]
  );

  if (isHomeInitialLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.homeStateShell, webGlassPanel, isMobile && styles.homeStateShellMobile]}>
            <View style={styles.homeStateHeader}>
              <View style={styles.skeletonBrandRow}>
                <View style={styles.skeletonBrandMark} />
                <View style={styles.skeletonHeaderTextBlock}>
                  <View style={styles.skeletonLineLarge} />
                  <View style={styles.skeletonLineSmall} />
                </View>
              </View>
            </View>

            <View style={[styles.homeStateHeroRow, isCompact && styles.homeStateHeroRowStacked]}>
              <View style={styles.skeletonHeroCard}>
                <View style={styles.skeletonEyebrow} />
                <View style={styles.skeletonHeroTitle} />
                <View style={styles.skeletonHeroTitleShort} />
                <View style={styles.skeletonBodyLine} />
                <View style={styles.skeletonBodyLineShort} />
                <View style={styles.skeletonButtonRow}>
                  <View style={styles.skeletonButton} />
                  <View style={styles.skeletonButtonSecondary} />
                </View>
                <View style={styles.skeletonPillRow}>
                  <View style={styles.skeletonPill} />
                  <View style={styles.skeletonPill} />
                  <View style={styles.skeletonPill} />
                </View>
              </View>
              <View style={styles.skeletonVisualCard} />
            </View>

            <View style={styles.homeStateSection}>
              <View style={styles.skeletonSectionHeader}>
                <View style={styles.skeletonEyebrow} />
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.skeletonBodyLineShort} />
              </View>
              <View style={[styles.skeletonGrid, categoryGridWebStyle]}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={`category-skeleton-${index}`} style={styles.skeletonCard}>
                    <View style={styles.skeletonMedia} />
                    <View style={styles.skeletonCardBody}>
                      <View style={styles.skeletonLineLarge} />
                      <View style={styles.skeletonLineSmall} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.homeStateSection}>
              <View style={styles.skeletonSectionHeader}>
                <View style={styles.skeletonEyebrow} />
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.skeletonBodyLineShort} />
              </View>
              <View style={[styles.skeletonGrid, productGridWebStyle]}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={`product-skeleton-${index}`} style={styles.skeletonCard}>
                    <View style={styles.skeletonMediaTall} />
                    <View style={styles.skeletonCardBody}>
                      <View style={styles.skeletonLineLarge} />
                      <View style={styles.skeletonLineMedium} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isHomeErrorState) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.homeErrorShell, webGlassPanel, isMobile && styles.homeErrorShellMobile]}>
            <Ionicons color={palette.blue} name="cloud-offline-outline" size={38} />
            <Text style={styles.homeErrorTitle}>We couldn&apos;t load the marketplace right now.</Text>
            <Text style={styles.homeErrorText}>Please check your connection and try again.</Text>
            <Pressable onPress={loadHome} style={styles.homeRetryButton}>
              <Text style={styles.homeRetryButtonText}>Retry</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  function submitSearch() {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    onSearchMarketplace(trimmed);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={isWeb}
        style={[styles.pageScroll, isWeb && styles.pageScrollWeb]}
      >
        <View style={styles.pageWrapper}>
          <View style={[styles.contentContainer, { paddingHorizontal: contentPadding }]}>
          <View style={[styles.header, isMobile && styles.headerMobile]}>
            <View style={styles.brandWrap}>
              <View style={[styles.brandMark, isMobile && styles.brandMarkMobile]}>
                <Text style={styles.brandLetter}>S</Text>
              </View>
              <Text style={[styles.brandName, isMobile && styles.brandNameMobile]}>Sharity</Text>
            </View>

            {!isMobile ? (
              <View style={styles.searchBar}>
                <Ionicons color={palette.body} name="search-outline" size={18} />
                <TextInput
                  onChangeText={setSearchQuery}
                  onSubmitEditing={submitSearch}
                  placeholder="Search for products, categories"
                  placeholderTextColor={palette.body}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>
            ) : null}

            <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
              <Pressable onPress={onSignIn} style={[styles.signInButton, isMobile && styles.signInButtonMobile]}>
                <Text numberOfLines={1} style={[styles.signInText, isMobile && styles.signInTextMobile]}>
                  Sign In
                </Text>
              </Pressable>
              {!isSmallPhone ? (
                <Pressable onPress={onGetStarted} style={[styles.headerCta, isMobile && styles.headerCtaMobile]}>
                  <Text numberOfLines={1} style={[styles.headerCtaText, isMobile && styles.headerCtaTextMobile]}>
                    Get Started
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {isMobile ? (
            <View style={styles.mobileSearchWrap}>
              <View style={styles.searchBarMobile}>
                <Ionicons color={palette.body} name="search-outline" size={18} />
                <TextInput
                  onChangeText={setSearchQuery}
                  onSubmitEditing={submitSearch}
                  placeholder="Search for products, categories"
                  placeholderTextColor={palette.body}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.heroGrid,
              isMobile && styles.heroGridStacked,
              webHeroGradient,
              !isCompact && styles.heroGridSplit,
              heroGridWebStyle,
              { minHeight: isMobile ? 0 : heroCardHeight }
            ]}
          >
            <View
              style={[
                styles.heroCopyCard,
                webHeroContentGradient,
                isDesktop && styles.heroCopyCardDesktop,
                isMobile && styles.heroCopyCardMobile,
                !isCompact && styles.heroCopyCardSplit,
                { minHeight: isMobile ? 0 : heroCardHeight }
              ]}
            >
              <View style={styles.heroCopyInner}>
                <View style={styles.heroEyebrow}>
                  <Ionicons color={palette.blue} name="shield-checkmark-outline" size={14} />
                  <Text style={styles.heroEyebrowText}>Safe marketplace</Text>
                </View>
                <Text
                  style={[
                    styles.heroTitle,
                    isMobile && styles.heroTitleMobile,
                    isTinyPhone && styles.heroTitleTiny,
                    isWeb &&
                      ({
                        hyphens: 'none',
                        overflowWrap: 'normal',
                        wordBreak: 'normal'
                      } as any)
                  ]}
                >
                  Buy and sell with confidence.
                </Text>
                <Text style={[styles.heroBody, isMobile && styles.heroBodyMobile]}>
                  Digital goods, gift cards, software, and jewellery in one place.
                </Text>

                <View style={[styles.heroActions, isCompact && styles.heroActionsStacked]}>
                  <Pressable onPress={onGetStarted} style={[styles.heroPrimary, isCompact && styles.heroPrimaryStacked]}>
                    <Text numberOfLines={1} style={styles.heroPrimaryText}>
                      Get Started Free
                    </Text>
                  </Pressable>
                  <Pressable onPress={onSignIn} style={[styles.heroSecondary, isCompact && styles.heroSecondaryStacked]}>
                    <Text numberOfLines={1} style={styles.heroSecondaryText}>
                      Sign In
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.heroPills}>
                  {heroPills.map((pill) => (
                    <View key={pill} style={styles.heroPill}>
                      <Text style={styles.heroPillText}>{pill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View
              style={[
                styles.heroVisualCard,
                webHeroCardGradient,
                isDesktop && styles.heroVisualCardDesktop,
                isMobile && styles.heroVisualCardMobile,
                !isCompact && styles.heroVisualCardSplit,
                { minHeight: isMobile ? 200 : heroCardHeight }
              ]}
            >
              {heroSlides.length > 0 ? (
                <>
                  <Pressable
                    onPress={() => handleHeroSlidePress(activeHeroIndex)}
                    style={[styles.heroCarouselViewport, styles.heroCarouselSimple]}
                  >
                    <LazyImage
                      alt={activeHeroSlide?.title ?? 'Hero banner'}
                      containerStyle={styles.heroVisualImage}
                      imageStyle={styles.heroVisualImage}
                      priority="high"
                      source={activeHeroSlide?.imageUrl ?? ''}
                    />
                  </Pressable>
                  {heroSlides.length > 1 ? (
                    <View style={styles.heroDots}>
                      {heroSlides.map((item, index) => (
                        <Pressable
                          key={item.id}
                          onPress={() => handleHeroSlidePress(index)}
                          style={[styles.heroDot, index === activeHeroIndex && styles.heroDotActive]}
                        />
                      ))}
                    </View>
                  ) : null}
                </>
              ) : homeLoading ? (
                <View style={[styles.heroVisualState, { minHeight: heroCardHeight - 40 }]}>
                  <Ionicons color={palette.blue} name="sync-outline" size={28} />
                  <Text style={styles.heroVisualStateText}>Loading marketplace...</Text>
                </View>
              ) : (
                <View style={[styles.heroVisualState, { minHeight: heroCardHeight - 40 }]}>
                  <Ionicons color={palette.blue} name="images-outline" size={28} />
                  <Text style={styles.heroVisualStateText}>No hero banners configured</Text>
                </View>
              )}

            </View>
          </View>

          <View style={[styles.sectionBlock, styles.sectionBlockTopCategories, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
              <SectionHeader
              actionLabel="Show more"
              eyebrow="Collections"
              onAction={onBrowse}
              subtitle="Browse the main categories in one quick view."
              title="Top Categories"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isMobile ? (
              <>
                {homeLoading ? (
                  <View style={styles.apiState}>
                    <Ionicons color={palette.blue} name="sync-outline" size={22} />
                    <Text style={styles.apiStateText}>Loading marketplace categories...</Text>
                  </View>
                ) : null}
                {homeError ? (
                  <View style={styles.apiState}>
                    <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                    <Text style={styles.apiStateText}>Marketplace categories are unavailable from the backend right now.</Text>
                  </View>
                ) : null}
                {!homeLoading && !homeError && topCategories.length === 0 ? (
                  <View style={styles.apiState}>
                    <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                    <Text style={styles.apiStateText}>No active public categories are enabled for this region.</Text>
                  </View>
                ) : null}

                {!homeLoading && !homeError && topCategories.length > 0 ? (
                  <ScrollView
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    snapToAlignment="start"
                    style={styles.categoryPager}
                    contentContainerStyle={styles.categoryPagerContent}
                  >
                    {mobileCategoryPages.map((page, pageIndex) => (
                      <View
                        key={`category-page-${pageIndex}`}
                        style={[styles.categoryPage, { width: Math.max(0, width - contentPadding * 2) }]}
                      >
                        <View style={styles.categoryPageGrid}>
                          {page.map((category, index) => (
                            <Pressable
                              key={`${category.categoryCode}-${pageIndex}-${index}`}
                              onPress={() => onOpenMarketplace(getMarketplaceRoute(category.verticalCode, home?.verticals ?? []))}
                              style={[styles.categoryCard, styles.categoryCardMobile]}
                            >
                              {category.imageUrl ? (
                                <>
                                  <LazyImage
                                    alt={category.categoryName}
                                    containerStyle={styles.categoryMediaWrapMobile}
                                    fitMode="cover"
                                    imageStyle={styles.categoryImageMobile}
                                    priority={pageIndex === 0 && index < 2 ? 'high' : 'lazy'}
                                    source={category.imageUrl}
                                    style={styles.categoryMediaMobile}
                                  />
                                  <View style={styles.categoryCopyMobile}>
                                    <View style={styles.categoryIconPill}>
                                      <Ionicons color={palette.blue} name={category.icon} size={16} />
                                    </View>
                                    <Text style={styles.categoryNameMobile} numberOfLines={2}>
                                      {category.categoryName}
                                    </Text>
                                    <Text style={styles.categoryCountMobile} numberOfLines={1}>
                                      {category.soldCount > 0 ? `${category.soldCount} sold` : 'Curated collection'}
                                    </Text>
                                  </View>
                                </>
                              ) : (
                                <View style={styles.categoryPlaceholderMobile}>
                                  <View style={styles.categoryPlaceholderIcon}>
                                    <Ionicons color={palette.blue} name={category.icon} size={20} />
                                  </View>
                                  <Text style={styles.categoryNameMobile} numberOfLines={2}>
                                    {category.categoryName}
                                  </Text>
                                  <Text style={styles.categoryCountMobile} numberOfLines={1}>
                                    {category.soldCount > 0 ? `${category.soldCount} sold` : 'Curated collection'}
                                  </Text>
                                </View>
                              )}
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : null}
              </>
            ) : (
              <View style={[styles.categoryGrid, isMobile && styles.categoryGridMobile, categoryGridWebStyle]}>
                {homeLoading ? (
                  <View style={styles.apiState}>
                    <Ionicons color={palette.blue} name="sync-outline" size={22} />
                    <Text style={styles.apiStateText}>Loading marketplace categories...</Text>
                  </View>
                ) : null}
                {homeError ? (
                  <View style={styles.apiState}>
                    <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                    <Text style={styles.apiStateText}>Marketplace categories are unavailable from the backend right now.</Text>
                  </View>
                ) : null}
                {!homeLoading && !homeError && topCategories.length === 0 ? (
                  <View style={styles.apiState}>
                    <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                    <Text style={styles.apiStateText}>No active public categories are enabled for this region.</Text>
                  </View>
                ) : null}

                {topCategories.map((category, index) => (
                  <Pressable
                    key={`${category.categoryCode}-${index}`}
                    onPress={() => onOpenMarketplace(getMarketplaceRoute(category.verticalCode, home?.verticals ?? []))}
                    style={[
                      styles.categoryCard,
                      isMobile && styles.categoryCardMobile,
                      isWeb && !isMobile && styles.gridCardFullWidth
                    ]}
                  >
                    {category.imageUrl ? (
                      <>
                        <LazyImage
                          alt={category.categoryName}
                          containerStyle={[styles.categoryMediaWrap, isMobile && styles.categoryMediaWrapMobile]}
                          fitMode="cover"
                          imageStyle={[styles.categoryImage, isMobile && styles.categoryImageMobile]}
                          priority={index < categoryVisibleCount ? 'high' : 'lazy'}
                          source={category.imageUrl}
                          style={[styles.categoryMedia, isMobile && styles.categoryMediaMobile]}
                        />
                        <View style={[styles.categoryCopy, isMobile && styles.categoryCopyMobile]}>
                          <View style={styles.categoryIconPill}>
                            <Ionicons color={palette.blue} name={category.icon} size={16} />
                          </View>
                          <Text style={[styles.categoryName, isMobile && styles.categoryNameMobile]}>{category.categoryName}</Text>
                          <Text style={[styles.categoryCount, isMobile && styles.categoryCountMobile]}>{category.soldCount > 0 ? `${category.soldCount} sold` : 'Curated collection'}</Text>
                        </View>
                      </>
                    ) : (
                      <View style={[styles.categoryPlaceholder, isMobile && styles.categoryPlaceholderMobile]}>
                        <View style={styles.categoryPlaceholderIcon}>
                          <Ionicons color={palette.blue} name={category.icon} size={20} />
                        </View>
                        <Text style={[styles.categoryName, isMobile && styles.categoryNameMobile]}>{category.categoryName}</Text>
                        <Text style={[styles.categoryCount, isMobile && styles.categoryCountMobile]}>{category.soldCount > 0 ? `${category.soldCount} sold` : 'Curated collection'}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.sectionBlock, styles.sectionBlockDiscounts, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Today&apos;s Deals"
              onAction={onBrowse}
              subtitle="Save on popular listings from trusted sellers."
              title="Top Discounts"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isMobile ? (
              <ScrollView
                horizontal
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                style={styles.productRail}
                contentContainerStyle={styles.productRailContent}
              >
                {topDiscounts.map((item, index) => (
                  <Pressable
                    key={`${item.verticalCode}-${item.title}-${index}`}
                    onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                    style={({ pressed }) => [
                      styles.productCard,
                      styles.productCardRailMobile,
                      isWeb && pressed && styles.productCardPressed
                    ]}
                  >
                    {item.imageUrl ? (
                      <LazyImage
                        alt={item.title}
                        containerStyle={[styles.productMedia, { height: 190 }]}
                        fitMode="contain"
                        imageStyle={styles.productImage}
                        priority={index < productVisibleCount ? 'high' : 'lazy'}
                        source={item.imageUrl}
                      >
                        <View style={styles.productImageOverlay} />
                        <View style={[styles.productBadge, productDiscountBadgeStyle(item.discountPercentage)]}>
                          <Text style={styles.productBadgeText}>{`${Math.round(item.discountPercentage)}% OFF`}</Text>
                        </View>
                      </LazyImage>
                    ) : (
                      <View style={[styles.productPlaceholder, { minHeight: 190 }]}>
                        <Ionicons color={palette.blue} name="pricetag-outline" size={26} />
                        <Text style={styles.productPlaceholderText}>Discounted item</Text>
                      </View>
                    )}
                    <View style={[styles.productBody, styles.productBodyMobile]}>
                      <Text style={styles.productCategory} numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.productPriceStack}>
                        <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                        <View style={styles.productSavingsRow}>
                          <Text style={styles.productSavingsLabel}>
                            Save {formatMoney(Math.max(0, item.originalPrice - item.discountedPrice), item.currencyCode)}
                          </Text>
                          <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                        </View>
                        <Text style={styles.productTrustIndicator}>✔ Protected Checkout</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={[styles.productGrid, productGridWebStyle, isMobile && styles.hiddenOnMobile]}>
              {topDiscounts.map((item, index) => (
                <Pressable
                  key={`${item.verticalCode}-${item.title}-${index}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={({ pressed }) => [
                    styles.productCard,
                    isMobile && styles.productCardMobile,
                    isWeb && styles.gridCardFullWidth,
                    isWeb && pressed && styles.productCardPressed
                  ]}
                >
                  {item.imageUrl ? (
                    <LazyImage
                      alt={item.title}
                      containerStyle={[styles.productMedia, { height: productImageHeight }]}
                      imageStyle={styles.productImage}
                      priority={index < productVisibleCount ? 'high' : 'lazy'}
                      source={item.imageUrl}
                    >
                      <View style={styles.productImageOverlay} />
                      <View style={[styles.productBadge, productDiscountBadgeStyle(item.discountPercentage)]}>
                        <Text style={styles.productBadgeText}>
                          {`${Math.round(item.discountPercentage)}% OFF`}
                        </Text>
                      </View>
                    </LazyImage>
                  ) : (
                    <View style={[styles.productPlaceholder, { minHeight: productImageHeight }]}>
                      <Ionicons color={palette.blue} name="pricetag-outline" size={26} />
                      <Text style={styles.productPlaceholderText}>Discounted item</Text>
                    </View>
                  )}
                  <View style={[styles.productBody, isMobile && styles.productBodyMobile]}>
                    <Text style={styles.productCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text style={[styles.productTitle, isMobile && styles.productTitleMobile]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.productPriceStack}>
                      <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                      <View style={styles.productSavingsRow}>
                        <Text style={styles.productSavingsLabel}>
                          Save {formatMoney(Math.max(0, item.originalPrice - item.discountedPrice), item.currencyCode)}
                        </Text>
                        <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                      </View>
                      <Text style={styles.productTrustIndicator}>✔ Protected Checkout</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {rollbackDeals.length > 0 ? (
          <View style={[styles.sectionBlock, styles.sectionBlockRollback, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Limited Time"
              onAction={onBrowse}
              subtitle="Rollback offers that still have time left."
              title="Rollback Offers"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isMobile ? (
              <ScrollView
                horizontal
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                style={styles.productRail}
                contentContainerStyle={styles.productRailContent}
              >
                {rollbackDeals.map((item, index) => (
                  <Pressable
                    key={`${item.verticalCode}-${item.title}-${index}`}
                    onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                    style={({ pressed }) => [
                      styles.productCard,
                      styles.productCardRailMobile,
                      isWeb && pressed && styles.productCardPressed
                    ]}
                  >
                    {item.imageUrl ? (
                      <LazyImage
                        alt={item.title}
                        containerStyle={[styles.productMedia, { height: 190 }]}
                        fitMode="contain"
                        imageStyle={styles.productImage}
                        priority={index < productVisibleCount ? 'high' : 'lazy'}
                        source={item.imageUrl}
                      >
                        <View style={styles.productImageOverlay} />
                        <View style={[styles.productBadge, styles.productBadgeRollback]}>
                          <Text style={styles.productBadgeText}>Rollback</Text>
                        </View>
                      </LazyImage>
                    ) : (
                      <View style={[styles.productPlaceholder, { minHeight: 190 }]}>
                        <Ionicons color={palette.blue} name="time-outline" size={26} />
                        <Text style={styles.productPlaceholderText}>Rollback offer</Text>
                      </View>
                    )}
                    <View style={[styles.productBody, styles.productBodyMobile]}>
                      <Text style={styles.productCategory} numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.productPriceStack}>
                        <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                        <View style={styles.productSavingsRow}>
                          <Text style={styles.productSavingsLabel}>
                            Save {formatMoney(Math.max(0, item.originalPrice - item.discountedPrice), item.currencyCode)}
                          </Text>
                          <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                        </View>
                        <Text style={styles.productTrustIndicator}>âœ” Protected Checkout</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={[styles.productGrid, productGridWebStyle, isMobile && styles.hiddenOnMobile]}>
              {rollbackDeals.map((item, index) => (
                <Pressable
                  key={`${item.verticalCode}-${item.title}-${index}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={({ pressed }) => [
                    styles.productCard,
                    isMobile && styles.productCardMobile,
                    isWeb && styles.gridCardFullWidth,
                    isWeb && pressed && styles.productCardPressed
                  ]}
                >
                  {item.imageUrl ? (
                    <LazyImage
                      alt={item.title}
                      containerStyle={[styles.productMedia, { height: productImageHeight }]}
                      imageStyle={styles.productImage}
                      priority={index < productVisibleCount ? 'high' : 'lazy'}
                      source={item.imageUrl}
                    >
                      <View style={styles.productImageOverlay} />
                      <View style={[styles.productBadge, styles.productBadgeRollback]}>
                        <Text style={styles.productBadgeText}>Rollback</Text>
                      </View>
                    </LazyImage>
                  ) : (
                    <View style={[styles.productPlaceholder, { minHeight: productImageHeight }]}>
                      <Ionicons color={palette.blue} name="time-outline" size={26} />
                      <Text style={styles.productPlaceholderText}>Rollback offer</Text>
                    </View>
                  )}
                  <View style={[styles.productBody, isMobile && styles.productBodyMobile]}>
                    <Text style={styles.productCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text style={[styles.productTitle, isMobile && styles.productTitleMobile]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.productPriceStack}>
                      <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                      <View style={styles.productSavingsRow}>
                        <Text style={styles.productSavingsLabel}>
                          Save {formatMoney(Math.max(0, item.originalPrice - item.discountedPrice), item.currencyCode)}
                        </Text>
                        <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                      </View>
                      <Text style={styles.productTrustIndicator}>âœ” Protected Checkout</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
          ) : null}

          {clearanceDeals.length > 0 ? (
          <View style={[styles.sectionBlock, styles.sectionBlockClearance, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Clearance"
              onAction={onBrowse}
              subtitle="Older picks with 50%+ discounts."
              title="Clearance Items"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isMobile ? (
              <ScrollView
                horizontal
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                style={styles.productRail}
                contentContainerStyle={styles.productRailContent}
              >
                {clearanceDeals.map((item, index) => (
                  <Pressable
                    key={`${item.verticalCode}-${item.title}-${index}`}
                    onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                    style={({ pressed }) => [
                      styles.productCard,
                      styles.productCardRailMobile,
                      isWeb && pressed && styles.productCardPressed
                    ]}
                  >
                    {item.imageUrl ? (
                      <LazyImage
                        alt={item.title}
                        containerStyle={[styles.productMedia, { height: 190 }]}
                        fitMode="contain"
                        imageStyle={styles.productImage}
                        priority={index < productVisibleCount ? 'high' : 'lazy'}
                        source={item.imageUrl}
                      >
                        <View style={styles.productImageOverlay} />
                        <View style={[styles.productBadge, styles.productBadgeClearance]}>
                          <Text style={styles.productBadgeText}>Clearance</Text>
                        </View>
                      </LazyImage>
                    ) : (
                      <View style={[styles.productPlaceholder, { minHeight: 190 }]}>
                        <Ionicons color={palette.blue} name="trash-bin-outline" size={26} />
                        <Text style={styles.productPlaceholderText}>Clearance item</Text>
                      </View>
                    )}
                    <View style={[styles.productBody, styles.productBodyMobile]}>
                      <Text style={styles.productCategory} numberOfLines={1}>
                        {item.categoryName}
                      </Text>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.productPriceStack}>
                        <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                        <View style={styles.productSavingsRow}>
                          <Text style={styles.productSavingsLabel}>
                            Save {formatMoney(Math.max(0, item.originalPrice - item.discountedPrice), item.currencyCode)}
                          </Text>
                          <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                        </View>
                        <Text style={styles.productTrustIndicator}>âœ” Protected Checkout</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={[styles.productGrid, productGridWebStyle, isMobile && styles.hiddenOnMobile]}>
              {clearanceDeals.map((item, index) => (
                <Pressable
                  key={`${item.verticalCode}-${item.title}-${index}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={({ pressed }) => [
                    styles.productCard,
                    isMobile && styles.productCardMobile,
                    isWeb && styles.gridCardFullWidth,
                    isWeb && pressed && styles.productCardPressed
                  ]}
                >
                  {item.imageUrl ? (
                    <LazyImage
                      alt={item.title}
                      containerStyle={[styles.productMedia, { height: productImageHeight }]}
                      imageStyle={styles.productImage}
                      priority={index < productVisibleCount ? 'high' : 'lazy'}
                      source={item.imageUrl}
                    >
                      <View style={styles.productImageOverlay} />
                      <View style={[styles.productBadge, styles.productBadgeClearance]}>
                        <Text style={styles.productBadgeText}>Clearance</Text>
                      </View>
                    </LazyImage>
                  ) : (
                    <View style={[styles.productPlaceholder, { minHeight: productImageHeight }]}>
                      <Ionicons color={palette.blue} name="trash-bin-outline" size={26} />
                      <Text style={styles.productPlaceholderText}>Clearance item</Text>
                    </View>
                  )}
                  <View style={[styles.productBody, isMobile && styles.productBodyMobile]}>
                    <Text style={styles.productCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text style={[styles.productTitle, isMobile && styles.productTitleMobile]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.productPriceStack}>
                      <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                      <View style={styles.productSavingsRow}>
                        <Text style={styles.productSavingsLabel}>
                          Save {formatMoney(Math.max(0, item.originalPrice - item.discountedPrice), item.currencyCode)}
                        </Text>
                        <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                      </View>
                      <Text style={styles.productTrustIndicator}>âœ” Protected Checkout</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
          ) : null}

          <View style={[styles.sectionBlock, styles.sectionBlockPopular, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Popular Picks"
              onAction={onBrowse}
              subtitle="Products shoppers are choosing most often across Sharity."
              title="Most Selected Products"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isMobile ? (
              <ScrollView
                horizontal
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                style={styles.productRail}
                contentContainerStyle={styles.productRailContent}
              >
                {popularProducts.slice(0, 10).map((item, index) => (
                  <Pressable
                    key={`${item.publicId}-${item.title}-${index}`}
                    onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                    style={({ pressed }) => [
                      styles.productCard,
                      styles.productCardRailMobile,
                      isWeb && pressed && styles.productCardPressed
                    ]}
                  >
                    {item.imageUrl ? (
                      <LazyImage
                        alt={item.title}
                        containerStyle={[styles.productMedia, { height: 190 }]}
                        fitMode="contain"
                        imageStyle={styles.productImage}
                        priority={index < productVisibleCount ? 'high' : 'lazy'}
                        source={item.imageUrl}
                      >
                        <View style={styles.productImageOverlay} />
                        <View style={[styles.productBadge, styles.productBadgeBlue]}>
                          <Text style={styles.productBadgeText}>Popular</Text>
                        </View>
                      </LazyImage>
                    ) : (
                      <View style={[styles.productPlaceholder, { minHeight: 190 }]}>
                        <Ionicons color={palette.blue} name="sparkles-outline" size={26} />
                        <Text style={styles.productPlaceholderText}>Most selected product</Text>
                      </View>
                    )}
                    <View style={[styles.productBody, styles.productBodyMobile]}>
                      <Text style={styles.productCategory} numberOfLines={1}>
                        {categoryNameFor(item.categoryCode, home)}
                      </Text>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.productPriceStack}>
                        <Text style={styles.productPrice}>
                          {formatMoney(item.displayPriceAmount ?? item.priceAmount, item.displayCurrencyCode ?? item.currencyCode)}
                        </Text>
                        <Text style={styles.productTrustIndicator}>{item.verifiedSeller ? '✔ Verified Seller' : '🛵 Instant Delivery'}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={[styles.productGrid, productGridWebStyle, isMobile && styles.hiddenOnMobile]}>
              {popularProducts.slice(0, 10).map((item, index) => (
                <Pressable
                  key={`${item.publicId}-${item.title}-${index}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={({ pressed }) => [
                    styles.productCard,
                    isWeb && styles.gridCardFullWidth,
                    isWeb && pressed && styles.productCardPressed
                  ]}
                >
                  {item.imageUrl ? (
                    <LazyImage
                      alt={item.title}
                      containerStyle={[styles.productMedia, { height: productImageHeight }]}
                      imageStyle={styles.productImage}
                      priority={index < productVisibleCount ? 'high' : 'lazy'}
                      source={item.imageUrl}
                    >
                      <View style={styles.productImageOverlay} />
                      <View style={[styles.productBadge, styles.productBadgeBlue]}>
                        <Text style={styles.productBadgeText}>Popular</Text>
                      </View>
                    </LazyImage>
                  ) : (
                    <View style={[styles.productPlaceholder, { minHeight: productImageHeight }]}>
                      <Ionicons color={palette.blue} name="sparkles-outline" size={26} />
                      <Text style={styles.productPlaceholderText}>Most selected product</Text>
                    </View>
                  )}
                  <View style={[styles.productBody, isMobile && styles.productBodyMobile]}>
                    <Text style={styles.productCategory} numberOfLines={1}>
                      {categoryNameFor(item.categoryCode, home)}
                    </Text>
                    <Text style={[styles.productTitle, isMobile && styles.productTitleMobile]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.productPriceStack}>
                      <Text style={styles.productPrice}>
                        {formatMoney(item.displayPriceAmount ?? item.priceAmount, item.displayCurrencyCode ?? item.currencyCode)}
                      </Text>
                      <Text style={styles.productTrustIndicator}>
                        {item.verifiedSeller ? '✔ Verified Seller' : '🚚 Instant Delivery'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.sectionBlock, styles.sectionBlockFeatured, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Featured"
              onAction={onBrowse}
              subtitle="Quality listings selected for demand, value, and buyer interest."
              title="Featured Products"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            {isMobile ? (
              <ScrollView
                horizontal
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                style={styles.productRail}
                contentContainerStyle={styles.productRailContent}
              >
                {featuredProducts.map((item, index) => (
                  <Pressable
                    key={`${item.verticalCode}-${item.title}-${item.sellerName}-${index}`}
                    onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                    style={[styles.collectionCard, styles.collectionCardMobile]}
                  >
                    <View style={styles.collectionMediaWrap}>
                      {item.imageUrl ? (
                        <LazyImage
                          alt={item.title}
                          containerStyle={styles.collectionMedia}
                          imageStyle={styles.collectionImage}
                          priority={index < collectionVisibleCount ? 'high' : 'lazy'}
                          source={item.imageUrl}
                        />
                      ) : (
                        <View style={styles.collectionPlaceholder}>
                          <Ionicons color={palette.blue} name="images-outline" size={28} />
                          <Text style={styles.collectionPlaceholderText}>Featured product</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.collectionCopy, styles.collectionCopyMobile]}>
                      <Text style={styles.collectionEyebrow}>Featured</Text>
                      <Text style={styles.collectionMeta}>{item.sellerName}</Text>
                      <Text style={styles.collectionTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.productMetaRow}>
                        <Text style={styles.productPrice}>{formatMoney(item.price, item.currencyCode)}</Text>
                        <Text style={styles.productSubMeta}>{item.verifiedSeller ? 'Verified seller' : item.categoryName}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={[styles.collectionGrid, collectionGridWebStyle, isMobile && styles.hiddenOnMobile]}>
              {featuredProducts.map((item, index) => (
                <Pressable
                  key={`${item.verticalCode}-${item.title}-${item.sellerName}-${index}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={[styles.collectionCard, isWeb && styles.gridCardFullWidth]}
                >
                  <View style={styles.collectionMediaWrap}>
                    {item.imageUrl ? (
                      <LazyImage
                        alt={item.title}
                        containerStyle={styles.collectionMedia}
                        imageStyle={styles.collectionImage}
                        priority={index < collectionVisibleCount ? 'high' : 'lazy'}
                        source={item.imageUrl}
                      />
                    ) : (
                      <View style={styles.collectionPlaceholder}>
                        <Ionicons color={palette.blue} name="images-outline" size={28} />
                        <Text style={styles.collectionPlaceholderText}>Featured product</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.collectionCopy}>
                    <Text style={styles.collectionEyebrow}>Featured</Text>
                    <Text style={styles.collectionMeta}>{item.sellerName}</Text>
                    <Text style={styles.collectionTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.productMetaRow}>
                      <Text style={styles.productPrice}>{formatMoney(item.price, item.currencyCode)}</Text>
                      <Text style={styles.productSubMeta}>{item.verifiedSeller ? 'Verified seller' : item.categoryName}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.sectionBlock, styles.sectionBlockSellersDark, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Verified Sellers"
              onAction={onBrowse}
              subtitle="Shop from sellers with strong ratings and reliable delivery."
              title="Trusted Sellers"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
              tone="dark"
              trailingAction={
                !isMobile ? (
                  <View style={styles.carouselControls}>
                    <Pressable onPress={() => scrollTrustedSellers('previous')} style={styles.carouselControlButton}>
                      <Ionicons color={palette.blue} name="chevron-back" size={18} />
                    </Pressable>
                    <Pressable onPress={() => scrollTrustedSellers('next')} style={styles.carouselControlButton}>
                      <Ionicons color={palette.blue} name="chevron-forward" size={18} />
                    </Pressable>
                  </View>
                ) : null
              }
            />

            <ScrollView
              contentContainerStyle={styles.sellerCarouselContent}
              horizontal
              decelerationRate="fast"
              keyboardShouldPersistTaps="handled"
              onScroll={(event) => {
                sellerScrollOffsetRef.current = event.nativeEvent.contentOffset.x;
              }}
              scrollEventThrottle={16}
              ref={sellerCarouselRef}
              snapToAlignment="start"
              snapToInterval={sellerCarouselStep}
              showsHorizontalScrollIndicator={false}
            >
              {trustedSellers.map((seller, index) => (
                <Pressable
                  key={`${seller.name}-${index}`}
                  onPress={onBrowse}
                  style={[
                    styles.sellerCard,
                    isMobile && styles.sellerCardMobile,
                    isWeb && styles.gridCardFullWidth,
                    {
                      backgroundColor: isMobile ? ['#f8fbff', '#fff8f0', '#f0fdf4', '#f5f3ff'][index % 4] : palette.surface,
                      width: isMobile ? 250 : sellerCardWidth
                    }
                  ]}
                >
                  <View style={[styles.sellerHeader, isMobile && styles.sellerHeaderMobile]}>
                    <View style={[styles.sellerAvatar, isMobile && styles.sellerAvatarMobile]}>
                      <Ionicons color={palette.blue} name="person-circle-outline" size={28} />
                    </View>
                    <View style={styles.sellerHeaderCopy}>
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {seller.name}
                      </Text>
                      <View style={styles.sellerBadgeRow}>
                        <View style={styles.sellerBadge}>
                          <Ionicons color={palette.blue} name="shield-checkmark-outline" size={12} />
                          <Text style={styles.sellerBadgeText}>Verified seller</Text>
                        </View>
                      </View>
                      <Text style={styles.sellerStars}>⭐ {seller.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  <View style={[styles.sellerStatsRow, isMobile && styles.sellerStatsRowMobile]}>
                    <View style={[styles.sellerStat, isMobile && styles.sellerStatMobile]}>
                      <Text style={styles.sellerStatValue}>{seller.rating.toFixed(1)}</Text>
                      <Text style={styles.sellerStatLabel}>Review score</Text>
                    </View>
                    <View style={[styles.sellerStat, isMobile && styles.sellerStatMobile]}>
                      <Text style={styles.sellerStatValue}>{seller.completedOrders}</Text>
                      <Text style={styles.sellerStatLabel}>Completed orders</Text>
                    </View>
                  </View>

                  <Text style={[styles.sellerFooterText, isMobile && styles.sellerFooterTextMobile]}>
                    {seller.listings[0]?.title ?? 'Curated storefront'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.sectionBlock, styles.sectionBlockWhy, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <SectionHeader
              actionLabel="Show more"
              eyebrow="Why Choose Sharity"
              onAction={onBrowse}
              subtitle="Trust, simple checkout, and clear rules."
              title="Why Sharity"
              isCompact={isCompact}
              isMobile={isMobile}
              isTablet={isTablet}
            />

            <View style={[styles.featureGrid, isMobile && styles.featureGridMobile, featureGridWebStyle]}>
              {featureCards.map((feature) => (
                <View
                  key={feature.title}
                  style={[
                    styles.featureCard,
                    isMobile && styles.featureCardMobile,
                    isWeb && styles.gridCardFullWidth
                  ]}
                >
                  <View style={styles.featureIcon}>
                    <Ionicons color={palette.blue} name={feature.icon} size={28} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.metricSection, styles.metricSectionDark, isMobile && styles.metricSectionDarkMobile]}>
            <View style={[styles.itemsSoldBanner, webItemsSoldGradient, isMobile && styles.itemsSoldBannerMobile]}>
              <Text style={styles.itemsSoldKicker}>Items sold</Text>
              <Text style={[styles.itemsSoldValue, isMobile && styles.itemsSoldValueMobile]}>
                {new Intl.NumberFormat('en-US').format(home?.itemsSoldCount ?? 0)}
              </Text>
              <Text style={[styles.itemsSoldLabel, isMobile && styles.itemsSoldLabelMobile]}>
                Across all active marketplace categories
              </Text>
            </View>
            <View style={[styles.metricGrid, isMobile && styles.metricGridMobile, metricGridWebStyle]}>
              {metrics.map((metric) => (
                <View
                  key={metric.label}
                  style={[
                    styles.metricCard,
                    isMobile && styles.metricCardMobile,
                    isWeb && styles.gridCardFullWidth
                  ]}
                >
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.ctaSection, styles.ctaSectionDark, isMobile && styles.ctaSectionMobile]}>
            <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>Get started today</Text>
            <Text style={styles.ctaText}>Join Sharity and start buying or selling in minutes.</Text>
            <Pressable onPress={onGetStarted} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Create Free Account</Text>
              <Ionicons color={palette.white} name="arrow-forward" size={18} />
            </Pressable>
          </View>

          <PublicSiteFooter groups={footerGroups} onLinkPress={onOpenPublicContent} visitorContext={visitorContext} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionHeaderProps = {
  actionLabel?: string;
  eyebrow: string;
  isCompact: boolean;
  isMobile: boolean;
  isTablet: boolean;
  onAction?: () => void;
  subtitle: string;
  title: string;
  tone?: 'dark' | 'light';
  trailingAction?: ReactNode;
};

function SectionHeader({
  actionLabel = 'Show more',
  eyebrow,
  isCompact,
  isMobile,
  isTablet,
  onAction,
  subtitle,
  title,
  tone = 'light',
  trailingAction
}: SectionHeaderProps) {
  const [hovered, setHovered] = useState(false);
  const stackActions = isCompact && !isMobile;
  const isDark = tone === 'dark';

  return (
    <View style={[styles.sectionHeaderRow, stackActions && styles.sectionHeaderRowStacked]}>
      <View style={[styles.sectionHeading, isMobile && styles.sectionHeadingMobile, !isMobile && styles.sectionHeadingDesktop]}>
        <Text style={[styles.sectionKicker, isDark && styles.sectionKickerDark]}>{eyebrow}</Text>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark, isTablet && styles.sectionTitleTablet, isMobile && styles.sectionTitleMobile]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, isDark && styles.sectionSubtitleDark, isMobile && styles.sectionSubtitleMobile]}>{subtitle}</Text>
      </View>
      {(onAction || trailingAction) && !stackActions ? (
        <View style={styles.sectionHeaderActions}>
          {trailingAction}
          {onAction ? (
            <Pressable
              onHoverIn={() => setHovered(true)}
              onHoverOut={() => setHovered(false)}
              onPress={onAction}
              style={({ pressed }) => [
                styles.sectionShowMoreButton,
                isDark && styles.sectionShowMoreButtonDark,
                (pressed || hovered) && styles.sectionShowMoreButtonActive
              ]}
            >
              <Text style={[styles.sectionShowMoreText, isDark && styles.sectionShowMoreTextDark, hovered && styles.sectionShowMoreTextActive]}>{actionLabel}</Text>
              <Ionicons color={hovered || isDark ? palette.white : palette.blue} name="arrow-forward" size={18} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {(onAction || trailingAction) && stackActions ? (
        <View style={styles.sectionHeaderMobileActions}>
          {trailingAction}
          {onAction ? (
            <Pressable
              onHoverIn={() => setHovered(true)}
              onHoverOut={() => setHovered(false)}
              onPress={onAction}
              style={({ pressed }) => [
                styles.sectionShowMoreButton,
                styles.sectionShowMoreButtonMobile,
                isDark && styles.sectionShowMoreButtonDark,
                (pressed || hovered) && styles.sectionShowMoreButtonActive
              ]}
            >
              <Text style={[styles.sectionShowMoreText, isDark && styles.sectionShowMoreTextDark, hovered && styles.sectionShowMoreTextActive]}>{actionLabel}</Text>
              <Ionicons color={hovered || isDark ? palette.white : palette.blue} name="arrow-forward" size={18} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type LazyImageProps = {
  alt: string;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  fitMode?: 'cover' | 'contain';
  imageStyle?: StyleProp<ImageStyle>;
  priority?: 'high' | 'lazy';
  source: string;
  style?: StyleProp<ViewStyle>;
};

function LazyImage({ alt, children, containerStyle, fitMode = 'contain', imageStyle, priority = 'lazy', source, style }: LazyImageProps) {
  const isWeb = Platform.OS === 'web';
  const shouldLoadImmediately = priority === 'high' || !isWeb;
  const [shouldLoad, setShouldLoad] = useState(shouldLoadImmediately);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<View | null>(null);

  useEffect(() => {
    if (!isWeb || shouldLoadImmediately || shouldLoad) {
      return;
    }

    const node = containerRef.current as unknown as Element | null;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isWeb, shouldLoad, shouldLoadImmediately]);

  const flattenedImageStyle = (StyleSheet.flatten(imageStyle) ?? {}) as Record<string, unknown>;
  const webImageStyle = {
    ...flattenedImageStyle,
    height: '100%',
    opacity: hasError ? 0 : hasLoaded ? 1 : 0.01,
    objectFit: fitMode,
    width: '100%'
  } as any;

  return (
    <View ref={containerRef} style={[styles.lazyImageRoot, containerStyle, style]}>
      {!shouldLoad || (!hasLoaded && !hasError) ? (
        <View style={styles.lazyImagePlaceholder}>
          {hasError ? (
            <View style={styles.lazyImageFallback}>
              <Ionicons color={palette.blue} name="image-outline" size={24} />
              <Text style={styles.lazyImageFallbackText}>{alt}</Text>
            </View>
          ) : (
            <View style={styles.lazyImageSkeleton} />
          )}
        </View>
      ) : null}

      {shouldLoad ? (
        isWeb ? (
          <img
            alt={alt}
            decoding="async"
            loading={priority === 'high' ? 'eager' : 'lazy'}
            onError={() => setHasError(true)}
            onLoad={() => setHasLoaded(true)}
            src={source}
            style={webImageStyle}
          />
        ) : (
          <Image
            onError={() => setHasError(true)}
            onLoadEnd={() => setHasLoaded(true)}
            resizeMode={fitMode}
            source={{ uri: source }}
            style={[styles.lazyImageNative, imageStyle as StyleProp<ImageStyle>]}
          />
        )
      ) : null}

      {children ? <View pointerEvents="box-none" style={styles.lazyImageChildren}>{children}</View> : null}
    </View>
  );
}

function buildTopCategories(home: MarketplaceHomeResponse | null): TopCategoryCard[] {
  if (!home) {
    return [];
  }

  const seen = new Set<string>();
  const countsByCategory = new Map<string, number>();
  home.featuredListings.forEach((listing) => {
    countsByCategory.set(listing.categoryCode, (countsByCategory.get(listing.categoryCode) ?? 0) + 1);
  });

  const rawHome = home as MarketplaceHomeResponse & Record<string, unknown>;
  const categoryBuckets = collectCategoryBuckets(rawHome);

  return categoryBuckets
    .filter((category) => {
      const key = category.categoryName.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const countDelta = (countsByCategory.get(right.code) ?? 0) - (countsByCategory.get(left.code) ?? 0);
      if (countDelta !== 0) {
        return countDelta;
      }
      return left.categoryName.localeCompare(right.categoryName);
    })
    .slice(0, 6)
    .map((category) => ({
      activeCount: countsByCategory.get(category.code) ?? 0,
      categoryCode: category.code,
      categoryName: category.categoryName,
      icon: iconForCategory(category),
      imageUrl: category.imageUrl ?? imageForCategory(category, home),
      maxDiscountPercent: maxDiscountForCategory(category.code, home),
      soldCount: countsByCategory.get(category.code) ?? 0,
      slug: category.slug,
      verticalCode: category.verticalCode
    }));
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [items];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildDiscountedItems(home: MarketplaceHomeResponse | null): DealCard[] {
  if (!home) {
    return [];
  }

  const source = home.discountedSubcategories ?? [];
  if (source.length > 0) {
    return source.map((item) => {
      const record = item as Record<string, unknown>;
      const discountedPrice = firstNumber(record, ['discountedPrice', 'discounted_price', 'salePrice', 'sale_price', 'price']) ?? 0;
      const originalPrice = firstNumber(record, ['originalPrice', 'original_price', 'listPrice', 'list_price']) ?? discountedPrice;
      const discountPercentage =
        firstNumber(record, ['discountPercentage', 'discount_percentage', 'discountPercent']) ??
        (originalPrice > discountedPrice && originalPrice > 0 ? ((originalPrice - discountedPrice) / originalPrice) * 100 : 0);

      return {
        categoryName: firstString(record, ['categoryName', 'category_name']) ?? 'Discounted item',
        currencyCode: firstString(record, ['currencyCode', 'currency_code']) ?? 'USD',
        discountedPrice,
        discountPercentage,
        imageUrl: firstString(record, ['listingImageUrl', 'listing_image_url', 'imageUrl', 'image_url']),
        originalPrice,
        title: firstString(record, ['listingTitle', 'listing_title', 'title', 'name']) ?? 'Discounted item',
        verticalCode: firstString(record, ['verticalCode', 'vertical_code']) ?? 'digital'
      };
    });
  }

  return home.featuredListings.map((listing) => {
    const original = listing.originalPriceAmount ?? listing.priceAmount;
    const discountPercentage = original > listing.priceAmount && original > 0 ? ((original - listing.priceAmount) / original) * 100 : 0;
    return {
      categoryName: categoryNameFor(listing.categoryCode, home),
      currencyCode: listing.displayCurrencyCode ?? listing.currencyCode,
      discountedPrice: listing.displayPriceAmount ?? listing.priceAmount,
      discountPercentage,
      imageUrl: listing.imageUrl,
      originalPrice: listing.displayOriginalPriceAmount ?? original,
      title: listing.title,
      verticalCode: listing.verticalCode
    };
  });
}

function buildListingDealCards(listings: MarketplaceListing[] | undefined, home: MarketplaceHomeResponse | null): DealCard[] {
  if (!listings || listings.length === 0) {
    return [];
  }

  return listings
    .map((listing) => {
      const original = listing.originalPriceAmount ?? listing.displayOriginalPriceAmount ?? listing.priceAmount;
      const price = listing.displayPriceAmount ?? listing.priceAmount;
      const discountPercentage = original > price && original > 0 ? ((original - price) / original) * 100 : 0;
      return {
        categoryName: categoryNameFor(listing.categoryCode, home),
        currencyCode: listing.displayCurrencyCode ?? listing.currencyCode,
        discountedPrice: price,
        discountPercentage,
        imageUrl: listing.imageUrl,
        originalPrice: original,
        title: listing.title,
        verticalCode: listing.verticalCode
      };
    })
    .filter((item) => item.discountPercentage > 0)
    .sort((left, right) => right.discountPercentage - left.discountPercentage || left.title.localeCompare(right.title));
}

function buildSellerCards(home: MarketplaceHomeResponse | null): SellerCard[] {
  if (!home) {
    return [];
  }

  const source = home.topRatedSellers ?? [];
  if (source.length > 0) {
    return source.map((seller) => ({
      completedOrders: seller.completedOrders,
      listings: seller.listings,
      name: seller.sellerName,
      rating: seller.sellerRating
    }));
  }

  const sellers = new Map<string, SellerCard>();
  home.featuredListings.forEach((listing) => {
    const existing = sellers.get(listing.sellerDisplayName);
    if (existing) {
      existing.completedOrders += listing.publicReviews.length;
      existing.listings.push(listing);
      existing.rating = averageRating(existing.listings);
      return;
    }

    sellers.set(listing.sellerDisplayName, {
      completedOrders: listing.publicReviews.length,
      listings: [listing],
      name: listing.sellerDisplayName,
      rating: listing.publicReviews.length > 0 ? listing.publicReviews.reduce((sum, review) => sum + review.rating, 0) / listing.publicReviews.length : 0
    });
  });

  return [...sellers.values()]
    .map((seller) => ({
      ...seller,
      rating: seller.rating || averageRating(seller.listings)
    }))
    .sort((left, right) => right.rating - left.rating);
}

function buildFeaturedProducts(home: MarketplaceHomeResponse | null): FeaturedProductCard[] {
  if (!home) {
    return [];
  }

  return home.featuredListings.map((listing) => ({
    categoryName: categoryNameFor(listing.categoryCode, home),
    currencyCode: listing.displayCurrencyCode ?? listing.currencyCode,
    imageUrl: listing.imageUrl,
    originalPrice: listing.displayOriginalPriceAmount ?? listing.originalPriceAmount ?? listing.priceAmount,
    price: listing.displayPriceAmount ?? listing.priceAmount,
    sellerName: listing.sellerDisplayName,
    title: listing.title,
    verticalCode: listing.verticalCode,
    verifiedSeller: listing.verifiedSeller
  }));
}

function normalizeHeroSlides(home: MarketplaceHomeResponse | null): HeroSlide[] {
  if (!home) {
    return [];
  }

  const slides: HeroSlide[] = [];
  const seenImages = new Set<string>();

  const addSlide = (slide: HeroSlide | null) => {
    if (!slide || !slide.imageUrl) {
      return;
    }

    const key = slide.imageUrl;
    if (seenImages.has(key)) {
      return;
    }

    seenImages.add(key);
    slides.push(slide);
  };

  home.verticals
    .filter((vertical) => vertical.availableToCustomer)
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .forEach((vertical) => {
      const imageUrls = resolveHeroImageUrls({
        imageUrl: vertical.imageUrl,
        imageUrls: vertical.imageUrls,
        imageKeys: vertical.imageKeys
      });

      if (imageUrls.length === 0) {
        return;
      }

      imageUrls.forEach((imageUrl, imageIndex) => {
        addSlide({
          id: `${vertical.moduleCode}-${imageIndex}-${imageUrl}`,
          imageUrl,
          kicker: 'Vertical spotlight',
          meta: `${home.categories.filter((category) => category.verticalCode === vertical.moduleCode && category.active).length.toLocaleString()} collections`,
          subtitle: `${vertical.moduleName} collections`,
          title: vertical.moduleName,
          verticalCode: vertical.moduleCode,
          sortOrder: vertical.displayOrder
        });
      });
    });

  return slides.sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

function buildMetrics(home: MarketplaceHomeResponse | null, sellerCount: number) {
  const activeVerticals = home?.verticals.filter((vertical) => vertical.status === 'ACTIVE' && vertical.availableToCustomer).length ?? 0;
  const activeCategories = home?.categories.filter((category) => category.active).length ?? 0;
  const featuredListings = home?.featuredListings.length ?? 0;

  return [
    { label: 'Active marketplaces', value: String(activeVerticals) },
    { label: 'Live categories', value: String(activeCategories) },
    { label: 'Featured listings', value: String(featuredListings) },
    { label: 'Verified sellers', value: String(sellerCount) }
  ];
}

function categoryNameFor(categoryCode: string, home: MarketplaceHomeResponse | null) {
  return home?.categories.find((category) => category.code === categoryCode)?.name ?? categoryCode;
}

function firstString(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function firstUpperString(candidate: Record<string, unknown>, keys: string[]) {
  const value = firstString(candidate, keys);
  return value ? value.toUpperCase() : null;
}

function firstNumber(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function firstArray(candidate: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = candidate[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }
  return [];
}

function resolveHeroImageUrls(source: string | Record<string, unknown> | null | undefined) {
  if (!source) {
    return [];
  }

  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')
      ? [trimmed]
      : [];
  }

  const imageUrls = firstArray(source, ['imageUrls', 'image_urls', 'urls', 'publicUrls', 'public_urls', 'mediaUrls', 'media_urls']);
  if (imageUrls.length > 0) {
    return imageUrls.filter((url) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'));
  }

  const directImage = firstString(source, [
    'imageUrl',
    'image_url',
    'url',
    'publicUrl',
    'public_url',
    'assetUrl',
    'asset_url',
    'mediaUrl',
    'media_url',
    'verticalImageUrl',
    'vertical_image_url'
  ]);
  if (directImage) {
    return directImage.startsWith('http://') || directImage.startsWith('https://') || directImage.startsWith('data:')
      ? [directImage]
      : [];
  }

  const imageKeys = firstString(source, ['imageKeys', 'image_keys', 'imageKey', 'image_key']);
  if (imageKeys) {
    return [];
  }

  return [];
}

function isValidHeroVerticalPlacement(placement: string | null, type: string | null, orientation: string | null) {
  const placementValue = placement?.toUpperCase() ?? '';
  const typeValue = type?.toUpperCase() ?? '';
  const orientationValue = orientation?.toUpperCase() ?? '';

  const validPlacements = new Set(['HERO', 'HOME_HERO', 'HERO_VERTICAL', 'PUBLIC_HOME_HERO']);
  const validTypes = new Set(['VERTICAL', 'HERO', 'BANNER', 'HERO_BANNER']);
  const validOrientations = new Set(['VERTICAL', 'PORTRAIT']);

  const placementOk = !placementValue || validPlacements.has(placementValue);
  const typeOk = !typeValue || validTypes.has(typeValue);
  const orientationOk = !orientationValue || validOrientations.has(orientationValue);
  return placementOk && typeOk && orientationOk;
}

function extractHeroVerticalSource(home: MarketplaceHomeResponse | null) {
  if (!home) {
    return [];
  }

  const rawHome = home as MarketplaceHomeResponse & Record<string, unknown>;
  const preferredSources = [
    rawHome.heroBanners,
    rawHome.hero_banners,
    rawHome.verticalImages,
    rawHome.vertical_images,
    rawHome.verticalBanners,
    rawHome.vertical_banners,
    rawHome.banners,
    rawHome.heroSlides,
    rawHome.hero_slides,
    rawHome.media,
    rawHome.images
  ];

  for (const source of preferredSources) {
    if (Array.isArray(source) && source.length > 0) {
      return source;
    }
  }

  return home.verticals
    .filter((vertical) => vertical.availableToCustomer && (vertical.imageUrl || (vertical.imageUrls?.length ?? 0) > 0 || vertical.imageKeys))
    .map((vertical) => ({
      id: vertical.moduleCode,
      imageUrl: vertical.imageUrl,
      imageUrls: vertical.imageUrls,
      title: vertical.moduleName,
      subtitle: `${vertical.moduleName} collections`,
      sortOrder: vertical.displayOrder,
      type: 'VERTICAL',
      placement: 'HERO_VERTICAL',
      orientation: 'VERTICAL',
      verticalCode: vertical.moduleCode
    }));
}

function maxDiscountForCategory(categoryCode: string, home: MarketplaceHomeResponse) {
  return (
    home.discountedSubcategories?.find((item) => item.categoryName && categoryCode.toLowerCase().includes(item.categoryName.toLowerCase()))?.discountPercentage ??
    0
  );
}

function averageRating(listings: MarketplaceListing[]) {
  const reviews = listings.flatMap((listing) => listing.publicReviews);
  if (reviews.length === 0) {
    return 0;
  }
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

type CategoryDescriptor = {
  code: string;
  iconRef?: string | null;
  verticalCode: string;
};

function iconForCategory(category: CategoryDescriptor): ComponentProps<typeof Ionicons>['name'] {
  const value = `${category.code} ${category.verticalCode} ${category.iconRef ?? ''}`.toLowerCase();
  if (value.includes('gift')) return 'gift-outline';
  if (value.includes('auto') || value.includes('car')) return 'car-outline';
  if (value.includes('grocery') || value.includes('food')) return 'basket-outline';
  if (value.includes('meat') || value.includes('seafood')) return 'restaurant-outline';
  if (value.includes('pharmacy') || value.includes('wellness') || value.includes('care')) return 'medkit-outline';
  if (value.includes('game')) return 'game-controller-outline';
  if (value.includes('electronic') || value.includes('devices')) return 'phone-portrait-outline';
  if (value.includes('fashion') || value.includes('jewellery')) return 'diamond-outline';
  return 'grid-outline';
}

function imageForCategory(category: CategoryDescriptor, home: MarketplaceHomeResponse) {
  const directMatch = home.featuredListings.find((listing) => listing.categoryCode === category.code && listing.imageUrl);
  if (directMatch?.imageUrl) {
    return directMatch.imageUrl;
  }

  const topCategoryMatch = home.topCategories?.find((item) => item.categoryCode === category.code && item.imageUrl);
  if (topCategoryMatch?.imageUrl) {
    return topCategoryMatch.imageUrl;
  }

  return null;
}

type CategoryBucket = {
  code: string;
  categoryName: string;
  imageUrl: string | null;
  slug: string;
  verticalCode: string;
  iconRef: string | null;
};

function collectCategoryBuckets(home: MarketplaceHomeResponse & Record<string, unknown>): CategoryBucket[] {
  const buckets: CategoryBucket[] = [];
  const seenCodes = new Set<string>();
  const homeRecord = home as Record<string, unknown>;

  const pushCategory = (candidate: Record<string, unknown> | null | undefined, fallbackVerticalCode = '') => {
    if (!candidate) {
      return;
    }

    const code = String(candidate.categoryCode ?? candidate.code ?? candidate.slug ?? candidate.categoryName ?? candidate.name ?? '').trim();
    if (!code || seenCodes.has(code)) {
      return;
    }

    const categoryName = String(candidate.categoryName ?? candidate.name ?? candidate.title ?? code);
    const verticalCode = String(candidate.verticalCode ?? fallbackVerticalCode ?? '').trim();
    const slug = String(candidate.slug ?? code.toLowerCase().replace(/\s+/g, '-'));
    const imageUrl = typeof candidate.imageUrl === 'string' ? candidate.imageUrl : null;
    const iconRef = typeof candidate.iconRef === 'string' ? candidate.iconRef : null;

    seenCodes.add(code);
    buckets.push({
      code,
      categoryName,
      imageUrl,
      iconRef,
      slug,
      verticalCode
    });
  };

  const topCategories = Array.isArray(homeRecord.topCategories) ? (homeRecord.topCategories as Record<string, unknown>[]) : [];
  topCategories.forEach((item) => pushCategory(item as Record<string, unknown>));

  const publicCategories = Array.isArray(homeRecord.publicCategories) ? (homeRecord.publicCategories as Record<string, unknown>[]) : [];
  publicCategories.forEach((item) => pushCategory(item as Record<string, unknown>));

  const featuredCategories = Array.isArray(homeRecord.featuredCategories) ? (homeRecord.featuredCategories as Record<string, unknown>[]) : [];
  featuredCategories.forEach((item) => pushCategory(item as Record<string, unknown>));

  const categoryTiles = Array.isArray(homeRecord.categoryTiles) ? (homeRecord.categoryTiles as Record<string, unknown>[]) : [];
  categoryTiles.forEach((item) => pushCategory(item as Record<string, unknown>));

  const verticals = Array.isArray(homeRecord.verticals) ? (homeRecord.verticals as Array<Record<string, unknown>>) : [];
  verticals.forEach((vertical) => {
      const nestedCategories = (vertical as Record<string, unknown>).categories;
      if (Array.isArray(nestedCategories)) {
        (nestedCategories as Record<string, unknown>[]).forEach((item) => pushCategory(item as Record<string, unknown>, String(vertical.moduleCode ?? '')));
      }
    });

  if (Array.isArray(homeRecord.categories)) {
    (homeRecord.categories as MarketplaceCategory[])
      .filter((category) => category.active)
      .forEach((category) =>
        pushCategory(
          {
            categoryCode: category.code,
            categoryName: category.name,
            code: category.code,
            iconRef: category.iconRef,
            imageUrl: category.imageUrl,
            slug: category.slug,
            verticalCode: category.verticalCode
          },
          category.verticalCode
        )
      );
  }

  return buckets;
}

function getMarketplaceRoute(verticalCode: string, verticals: MarketplaceHomeResponse['verticals']): 'digitalMarketplace' | 'jewelryMarketplace' {
  const normalized = verticalCode.toUpperCase();
  const vertical = verticals.find(
    (item) =>
      item.moduleCode.toUpperCase() === normalized ||
      item.frontendRoute?.toLowerCase() === verticalCode.toLowerCase() ||
      item.moduleName.toUpperCase().replace(/\s+/g, '_') === normalized
  );
  const route = vertical?.frontendRoute;
  if (route === 'jewelryMarketplace' || route === 'digitalMarketplace') {
    return route;
  }

  if (normalized.includes('JEWELL')) {
    return 'jewelryMarketplace';
  }

  return 'digitalMarketplace';
}

function formatMoney(amount: number, currencyCode: string) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(safeAmount);
  } catch {
    return `${currencyCode} ${Math.round(safeAmount)}`;
  }
}

function productDiscountBadgeStyle(percent: number): any | undefined {
  if (percent >= 80) {
    return Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(135deg, #FF6B35 0%, #FF3D00 100%)',
          boxShadow: '0 10px 22px rgba(255, 61, 0, 0.28)'
        } as any)
      : ({
          backgroundColor: '#FF4D1A',
          shadowColor: '#FF4D1A',
          shadowOpacity: 0.28,
          shadowRadius: 10,
          shadowOffset: { height: 4, width: 0 }
        } as any);
  }

  if (percent >= 50) {
    return Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
          boxShadow: '0 10px 22px rgba(91, 33, 182, 0.24)'
        } as any)
      : ({
          backgroundColor: '#6D28D9',
          shadowColor: '#6D28D9',
          shadowOpacity: 0.24,
          shadowRadius: 10,
          shadowOffset: { height: 4, width: 0 }
        } as any);
  }

  if (percent >= 20) {
    return Platform.OS === 'web'
      ? ({
          backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          boxShadow: '0 10px 22px rgba(37, 99, 235, 0.24)'
        } as any)
      : ({
          backgroundColor: '#2563EB',
          shadowColor: '#2563EB',
          shadowOpacity: 0.24,
          shadowRadius: 10,
          shadowOffset: { height: 4, width: 0 }
        } as any);
  }

  return Platform.OS === 'web'
    ? ({
        backgroundImage: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
        boxShadow: '0 10px 22px rgba(100, 116, 139, 0.20)'
      } as any)
    : ({
        backgroundColor: '#64748B',
        shadowColor: '#64748B',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { height: 4, width: 0 }
      } as any);
}

const palette = {
  blue: '#2563eb',
  border: 'rgba(15, 23, 42, 0.10)',
  body: '#475569',
  page: '#f5f7fb',
  pageAlt: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  white: '#ffffff'
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.page,
    flex: 1
  },
  pageScroll: {
    flex: 1
  },
  pageScrollWeb: Platform.OS === 'web'
    ? ({
        overflowY: 'auto',
        overscrollBehaviorY: 'auto',
        WebkitOverflowScrolling: 'touch'
      } as never)
    : ({} as never),
  scrollContent: {
    backgroundColor: palette.page,
    minHeight: '100%',
    paddingBottom: 56
  },
  pageWrapper: {
    width: '100%'
  },
  contentContainer: {
    width: '100%'
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    borderRadius: 24,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  headerMobile: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.sm,
    minWidth: 0
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  brandMarkMobile: {
    height: 36,
    width: 36
  },
  brandLetter: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandName: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
    flexShrink: 1
  },
  brandNameMobile: {
    fontSize: 18,
    lineHeight: 22
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 48,
    maxWidth: 480,
    minWidth: 280,
    paddingHorizontal: 16,
    width: '38%'
  },
  searchBarMobile: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: 16,
    width: '100%'
  },
  mobileSearchWrap: {
    marginTop: 14
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    minHeight: 24,
    outlineStyle: 'none' as never
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 12,
    marginLeft: 'auto'
  },
  headerActionsMobile: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    minWidth: 0
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.06)',
    borderColor: 'rgba(37,99,235,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: 16
  },
  signInButtonMobile: {
    height: 44,
    minWidth: 96,
    paddingHorizontal: 10
  },
  signInText: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '700'
  },
  signInTextMobile: {
    fontSize: 15,
    fontWeight: '700'
  },
  headerCta: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    minWidth: 136,
    paddingHorizontal: 18
  },
  headerCtaMobile: {
    height: 44,
    minWidth: 128,
    paddingHorizontal: 12
  },
  headerCtaText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800'
  },
  headerCtaTextMobile: {
    fontSize: 15,
    fontWeight: '700'
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'stretch',
    minHeight: 460,
    width: '100%',
    marginTop: 24
  },
  heroGridStacked: {
    flexDirection: 'column',
    gap: 18
  },
  heroGridSplit: {
    flexDirection: 'row'
  },
  heroCopyCard: {
    backgroundColor: '#f8fbff',
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    minHeight: 460,
    overflow: 'hidden',
    padding: 32,
    position: 'relative'
  },
  heroCopyCardSplit: {
    flex: 1
  },
  heroCopyCardMobile: {
    flexBasis: '100%',
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
    padding: 20,
    width: '100%'
  },
  heroCopyCardDesktop: {
    flexBasis: '36%',
    flexGrow: 0,
    flexShrink: 0
  },
  heroCopyInner: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 16,
    position: 'relative',
    zIndex: 1
  },
  heroEyebrow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.pageAlt,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  heroEyebrowText: {
    color: palette.blue,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: palette.text,
    fontSize: 50,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 58,
    marginTop: 14
  },
  heroTitleMobile: {
    fontSize: 38,
    lineHeight: 44,
    marginTop: 10,
    maxWidth: '100%'
  },
  heroTitleTiny: {
    fontSize: 34,
    lineHeight: 40
  },
  heroBody: {
    color: palette.body,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8
  },
  heroBodyMobile: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '100%'
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20
  },
  heroActionsStacked: {
    flexDirection: 'column'
  },
  heroPrimary: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    minWidth: 170,
    paddingHorizontal: 22
  },
  heroPrimaryStacked: {
    minWidth: 0,
    width: '100%'
  },
  heroPrimaryText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800'
  },
  heroSecondary: {
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.06)',
    borderColor: 'rgba(37,99,235,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    minWidth: 132,
    paddingHorizontal: 22
  },
  heroSecondaryStacked: {
    minWidth: 0,
    width: '100%'
  },
  heroSecondaryText: {
    color: palette.blue,
    fontSize: 16,
    fontWeight: '800'
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18
  },
  heroPill: {
    backgroundColor: palette.pageAlt,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  heroPillText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  heroVisualCard: {
    backgroundColor: '#f8fbff',
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    minHeight: 460,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
    position: 'relative'
  },
  heroVisualCardMobile: {
    flexBasis: '100%',
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 240,
    width: '100%'
  },
  heroVisualCardSplit: {
    flex: 1
  },
  heroVisualCardDesktop: {
    flexBasis: '64%',
    flexGrow: 0,
    flexShrink: 0
  },
  heroCarouselViewport: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    width: '100%'
  },
  heroCarouselSimple: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%'
  },
  heroVisualImage: {
    backgroundColor: '#f8fbff',
    height: '100%',
    alignSelf: 'center',
    minHeight: 0,
    margin: 0,
    width: '100%'
  },
  lazyImageRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative'
  },
  lazyImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  lazyImageSkeleton: {
    backgroundColor: 'rgba(148,163,184,0.16)',
    borderRadius: 18,
    height: '72%',
    width: '72%'
  },
  lazyImageFallback: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    padding: 16
  },
  lazyImageFallbackText: {
    color: palette.body,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  homeStateShell: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 28,
    borderWidth: 1,
    gap: 28,
    margin: 32,
    padding: 32
  },
  homeStateShellMobile: {
    margin: 16,
    padding: 20
  },
  homeStateHeader: {
    width: '100%'
  },
  skeletonBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
  },
  skeletonBrandMark: {
    backgroundColor: 'rgba(148,163,184,0.22)',
    borderRadius: 14,
    height: 44,
    width: 44
  },
  skeletonHeaderTextBlock: {
    gap: 8
  },
  skeletonLineLarge: {
    backgroundColor: 'rgba(148,163,184,0.22)',
    borderRadius: 999,
    height: 18,
    width: 180
  },
  skeletonLineMedium: {
    backgroundColor: 'rgba(148,163,184,0.18)',
    borderRadius: 999,
    height: 14,
    width: 140
  },
  skeletonLineSmall: {
    backgroundColor: 'rgba(148,163,184,0.18)',
    borderRadius: 999,
    height: 12,
    width: 110
  },
  skeletonEyebrow: {
    backgroundColor: 'rgba(37,99,235,0.16)',
    borderRadius: 999,
    height: 12,
    width: 92
  },
  homeStateHeroRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 24,
    width: '100%'
  },
  homeStateHeroRowStacked: {
    flexDirection: 'column'
  },
  skeletonHeroCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    gap: 14,
    minHeight: 380,
    padding: 24
  },
  skeletonHeroTitle: {
    backgroundColor: 'rgba(15,23,42,0.12)',
    borderRadius: 16,
    height: 32,
    width: '88%'
  },
  skeletonHeroTitleShort: {
    backgroundColor: 'rgba(15,23,42,0.10)',
    borderRadius: 16,
    height: 32,
    width: '72%'
  },
  skeletonBodyLine: {
    backgroundColor: 'rgba(148,163,184,0.16)',
    borderRadius: 999,
    height: 16,
    width: '92%'
  },
  skeletonBodyLineShort: {
    backgroundColor: 'rgba(148,163,184,0.14)',
    borderRadius: 999,
    height: 14,
    width: '65%'
  },
  skeletonButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8
  },
  skeletonButton: {
    backgroundColor: 'rgba(37,99,235,0.18)',
    borderRadius: 14,
    height: 48,
    width: 170
  },
  skeletonButtonSecondary: {
    backgroundColor: 'rgba(148,163,184,0.14)',
    borderRadius: 14,
    height: 48,
    width: 130
  },
  skeletonPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8
  },
  skeletonPill: {
    backgroundColor: 'rgba(37,99,235,0.10)',
    borderRadius: 999,
    height: 32,
    width: 110
  },
  skeletonVisualCard: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    minHeight: 380
  },
  homeStateSection: {
    gap: 20,
    width: '100%'
  },
  skeletonSectionHeader: {
    gap: 10,
    maxWidth: 580
  },
  skeletonSectionTitle: {
    backgroundColor: 'rgba(15,23,42,0.12)',
    borderRadius: 16,
    height: 30,
    width: '60%'
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    width: '100%'
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 22,
    borderWidth: 1,
    flexGrow: 1,
    flexBasis: 220,
    overflow: 'hidden'
  },
  skeletonMedia: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    height: 180,
    width: '100%'
  },
  skeletonMediaTall: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    height: 260,
    width: '100%'
  },
  skeletonCardBody: {
    gap: 10,
    padding: 18
  },
  homeErrorShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    margin: 32,
    padding: 32
  },
  homeErrorShellMobile: {
    margin: 16,
    padding: 24
  },
  homeErrorTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  homeErrorText: {
    color: palette.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  homeRetryButton: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 999,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  homeRetryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800'
  },
  lazyImageNative: {
    height: '100%',
    width: '100%'
  },
  lazyImageChildren: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none'
  },
  heroVisualState: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: palette.border,
    borderRadius: 26,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 460,
    padding: 24
  },
  heroVisualStateText: {
    color: palette.body,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center'
  },
  heroDots: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    right: 0,
    zIndex: 5,
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(10px)' } as never)
      : {})
  },
  heroDot: {
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    borderRadius: 999,
    height: 8,
    width: 8
  },
  heroDotActive: {
    backgroundColor: palette.blue,
    width: 24
  },
  sectionBlock: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 56,
    overflow: 'hidden',
    padding: 32,
    shadowColor: '#0f172a',
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 70
  },
  sectionBlockTopCategories: {
    backgroundColor: 'rgba(244,247,255,0.92)'
  },
  sectionBlockDiscounts: {
    backgroundColor: 'rgba(255,249,242,0.94)'
  },
  sectionBlockPopular: {
    backgroundColor: 'rgba(255,255,255,0.92)'
  },
  sectionBlockFeatured: {
    backgroundColor: 'rgba(245,243,255,0.92)'
  },
  sectionBlockRollback: {
    backgroundColor: 'rgba(255,244,235,0.96)',
    borderColor: 'rgba(251,146,60,0.18)'
  },
  sectionBlockClearance: {
    backgroundColor: 'rgba(240,253,244,0.95)',
    borderColor: 'rgba(34,197,94,0.18)'
  },
  sectionBlockSellersDark: {
    backgroundColor: '#101936',
    borderColor: 'rgba(148,163,184,0.16)'
  },
  sectionBlockWhy: {
    backgroundColor: 'rgba(248,250,252,0.92)'
  },
  sectionBlockMobile: {
    marginTop: 28,
    padding: 16
  },
  sectionHeading: {
    flex: 1,
    maxWidth: 720,
    minWidth: 0
  },
  sectionHeadingDesktop: {
    flex: 1
  },
  sectionHeadingMobile: {
    maxWidth: '100%'
  },
  sectionHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32
  },
  sectionHeaderRowStacked: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
    width: '100%'
  },
  sectionHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  sectionHeaderMobileActions: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    gap: 8,
    marginTop: 0,
    width: '100%'
  },
  sectionKicker: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  sectionKickerDark: {
    color: '#93c5fd'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 40,
    marginTop: 0,
    textAlign: 'left'
  },
  sectionTitleDark: {
    color: palette.white
  },
  sectionTitleTablet: {
    fontSize: 30,
    lineHeight: 34
  },
  sectionTitleMobile: {
    fontSize: 26,
    lineHeight: 29
  },
  sectionSubtitle: {
    color: palette.body,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 640,
    textAlign: 'left'
  },
  sectionSubtitleDark: {
    color: 'rgba(255,255,255,0.78)'
  },
  sectionSubtitleMobile: {
    fontSize: 15,
    lineHeight: 22
  },
  sectionShowMoreButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexShrink: 0,
    height: 48,
    paddingHorizontal: 18
  },
  sectionShowMoreButtonDark: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.20)'
  },
  sectionShowMoreButtonMobile: {
    alignSelf: 'flex-end',
    height: 42,
    marginTop: 0,
    maxWidth: '100%',
    paddingHorizontal: 14
  },
  sectionShowMoreButtonActive: {
    backgroundColor: palette.blue,
    transform: [{ translateY: -1 }]
  },
  sectionShowMoreText: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  sectionShowMoreTextDark: {
    color: palette.white
  },
  sectionShowMoreTextActive: {
    color: palette.white
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start'
  },
  gridCardFullWidth: {
    minWidth: 0,
    width: '100%'
  },
  collectionCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    alignSelf: 'stretch',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  collectionCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    width: 240
  },
  collectionMediaWrap: {
    backgroundColor: '#f8fbff'
  },
  collectionMedia: {
    height: 300,
    width: '100%'
  },
  collectionImage: {
    borderRadius: 24
  },
  collectionPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    gap: 8,
    height: 300,
    justifyContent: 'center',
    padding: 18,
    width: '100%'
  },
  collectionPlaceholderText: {
    color: palette.body,
    fontSize: 13,
    fontWeight: '600'
  },
  collectionCopy: {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    padding: 22,
    position: 'relative'
  },
  collectionCopyMobile: {
    padding: 14
  },
  collectionEyebrow: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  collectionTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
    marginTop: 8
  },
  collectionMeta: {
    color: palette.body,
    fontSize: 15,
    marginTop: 8
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start'
  },
  categoryGridMobile: {
    gap: 12,
    marginTop: 12
  },
  categoryPager: {
    marginTop: 12,
    width: '100%'
  },
  categoryPagerContent: {
    gap: 12,
    paddingBottom: 2,
    paddingRight: 2
  },
  categoryPage: {
    flexShrink: 0
  },
  categoryPageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%'
  },
  categoryCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    alignSelf: 'stretch',
    maxWidth: 240,
    minHeight: 312,
    width: '100%',
    overflow: 'hidden'
  },
  categoryCardMobile: {
    flexBasis: '47%',
    flexGrow: 0,
    alignSelf: 'flex-start',
    height: 176,
    minHeight: 176,
    maxWidth: '47%',
    overflow: 'hidden',
    width: '47%'
  },
  categoryMediaWrap: {
    backgroundColor: '#f8fbff',
    aspectRatio: 4 / 5,
    width: '100%'
  },
  categoryMediaWrapMobile: {
    aspectRatio: 4 / 3
  },
  categoryMedia: {
    height: '100%',
    width: '100%'
  },
  categoryMediaMobile: {
    height: '100%'
  },
  categoryImage: {
    borderRadius: 0
  },
  categoryImageMobile: {
    borderRadius: 0
  },
  categoryCopy: {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative'
  },
  categoryCopyMobile: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  categoryIconPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginBottom: 8,
    width: 30
  },
  categoryCount: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  categoryCountMobile: {
    fontSize: 10,
    lineHeight: 12
  },
  categoryName: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 6
  },
  categoryNameMobile: {
    fontSize: 13,
    lineHeight: 16,
    marginTop: 4
  },
  categoryPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    aspectRatio: 4 / 5,
    justifyContent: 'center',
    minHeight: 0,
    padding: 14,
    width: '100%'
  },
  categoryPlaceholderMobile: {
    minHeight: 0,
    padding: 12
  },
  categoryPlaceholderIcon: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  hiddenOnMobile: {
    display: 'none'
  },
  productRail: {
    width: '100%'
  },
  productRailContent: {
    gap: 14,
    paddingBottom: 2,
    paddingRight: 2
  },
  productCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'stretch',
    height: '100%',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 20
  },
  productCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    height: 'auto',
    minHeight: 0,
    width: '47%'
  },
  productCardRailMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    height: 'auto',
    minHeight: 0,
    width: 240
  },
  productCardHovered: {
    shadowOpacity: 0.12,
    shadowRadius: 28,
    transform: [{ translateY: -2 }, { scale: 1.01 }]
  },
  productCardPressed: {
    shadowOpacity: 0.08,
    transform: [{ translateY: 0 }, { scale: 0.995 }]
  },
  productMedia: {
    width: '100%',
    justifyContent: 'space-between'
  },
  productImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.08)'
  },
  productImage: {
    borderRadius: 24
  },
  productPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    gap: 8,
    justifyContent: 'center',
    padding: 18,
    width: '100%'
  },
  productPlaceholderText: {
    color: palette.body,
    fontSize: 13,
    fontWeight: '600'
  },
  productBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 2
  },
  productBadgeBlue: {
    backgroundColor: 'rgba(37,99,235,0.95)'
  },
  productBadgeRollback: {
    backgroundColor: 'rgba(249,115,22,0.96)'
  },
  productBadgeClearance: {
    backgroundColor: 'rgba(22,163,74,0.96)'
  },
  productBadgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  productBody: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 18
  },
  productBodyMobile: {
    flex: 0,
    padding: 16
  },
  productBodyRailMobile: {
    flex: 0,
    padding: 16
  },
  productCategory: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase'
  },
  productTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    minHeight: 48,
    marginTop: 8
  },
  productTitleMobile: {
    fontSize: 17,
    lineHeight: 23
  },
  productMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 14
  },
  productPriceStack: {
    marginTop: 'auto',
    paddingTop: 14
  },
  productPrice: {
    color: '#16A34A',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24
  },
  productOriginalPrice: {
    color: '#64748B',
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  productSavingsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  productSavingsLabel: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700'
  },
  productTrustIndicator: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8
  },
  productSubMeta: {
    color: palette.body,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right'
  },
  sellerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start'
  },
  sellerCarouselContent: {
    alignItems: 'stretch',
    gap: 24,
    paddingBottom: 4,
    paddingTop: 4
  },
  carouselControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginLeft: 16
  },
  carouselControlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  sellerCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'stretch',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    padding: 20
  },
  sellerCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    height: 'auto',
    minHeight: 0,
    width: 250
  },
  sellerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
  },
  sellerHeaderMobile: {
    gap: 10
  },
  sellerAvatar: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56
  },
  sellerAvatarMobile: {
    height: 48,
    width: 48
  },
  sellerHeaderCopy: {
    flex: 1
  },
  sellerName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24
  },
  sellerBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  sellerBadge: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  sellerBadgeText: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800'
  },
  sellerStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18
  },
  sellerStatsRowMobile: {
    gap: 8,
    marginTop: 14
  },
  sellerStat: {
    backgroundColor: palette.pageAlt,
    borderRadius: 18,
    flex: 1,
    padding: 14
  },
  sellerStatMobile: {
    padding: 12
  },
  sellerStatValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800'
  },
  sellerStatLabel: {
    color: palette.body,
    fontSize: 12,
    marginTop: 6
  },
  sellerFooterText: {
    color: palette.body,
    fontSize: 13,
    marginTop: 14
  },
  sellerFooterTextMobile: {
    fontSize: 12,
    marginTop: 12
  },
  sellerStars: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start'
  },
  featureGridMobile: {
    gap: 14,
    justifyContent: 'space-between'
  },
  featureCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'stretch',
    height: '100%',
    width: '100%',
    padding: 22
  },
  featureCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    height: 'auto',
    minHeight: 160,
    padding: 16,
    width: '48%'
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    width: 62
  },
  featureTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 16,
    textAlign: 'center'
  },
  featureText: {
    color: palette.body,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    textAlign: 'center'
  },
  metricSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    marginTop: 24
  },
  metricSectionDark: {
    backgroundColor: '#101936',
    borderColor: 'rgba(148,163,184,0.16)',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24
  },
  metricSectionDarkMobile: {
    padding: 18
  },
  itemsSoldBanner: {
    alignItems: 'flex-start',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingVertical: 32,
    shadowColor: '#0f172a',
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 50
  },
  itemsSoldBannerMobile: {
    paddingHorizontal: 20,
    paddingVertical: 22
  },
  itemsSoldKicker: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase'
  },
  itemsSoldValue: {
    color: palette.white,
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 72,
    marginTop: 10
  },
  itemsSoldValueMobile: {
    fontSize: 44,
    lineHeight: 48
  },
  itemsSoldLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 6
  },
  itemsSoldLabelMobile: {
    fontSize: 14,
    lineHeight: 20
  },
  metricGrid: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start',
    width: '100%',
    padding: 20
  },
  metricGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between'
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    borderRadius: 22,
    flex: 1,
    height: '100%',
    minWidth: 150,
    paddingVertical: 22
  },
  metricCardMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    height: 'auto',
    minHeight: 88,
    minWidth: 0,
    paddingVertical: 18,
    width: '48%'
  },
  metricValue: {
    color: palette.blue,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34
  },
  metricLabel: {
    color: palette.body,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center'
  },
  ctaSection: {
    alignItems: 'center',
    backgroundColor: '#101936',
    borderColor: 'rgba(148,163,184,0.16)',
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 56,
    paddingHorizontal: 24,
    paddingVertical: 44
  },
  ctaSectionDark: {
    backgroundColor: '#101936',
    borderColor: 'rgba(148,163,184,0.16)'
  },
  ctaSectionMobile: {
    paddingHorizontal: 20,
    paddingVertical: 32
  },
  ctaTitle: {
    color: palette.white,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center'
  },
  ctaTitleMobile: {
    fontSize: 32,
    lineHeight: 38
  },
  ctaText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 17,
    lineHeight: 26,
    marginTop: 12,
    textAlign: 'center'
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    height: 52,
    justifyContent: 'center',
    marginTop: 24,
    minWidth: 220,
    paddingHorizontal: 22
  },
  ctaButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800'
  },
  apiState: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 88,
    paddingHorizontal: 18,
    width: '100%'
  },
  apiStateText: {
    color: palette.body,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21
  }
});

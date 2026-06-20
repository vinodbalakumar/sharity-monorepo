import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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
  const isTinyPhone = width < 480;
  const isDesktop = width >= 992;
  const isWeb = Platform.OS === 'web';
  const contentPadding = isMobile ? 16 : width >= 1600 ? 64 : width >= 1400 ? 48 : 32;
  const heroCardHeight = isMobile ? 380 : width < 992 ? 440 : 520;
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
          gridTemplateColumns: width >= 1200 ? 'repeat(4, minmax(0, 1fr))' : width >= 768 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
          gap: 24,
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
                  ? 'repeat(3, minmax(0, 1fr))'
                  : width >= 768
                    ? 'repeat(2, minmax(0, 1fr))'
                    : '1fr',
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

  useEffect(() => {
    let mounted = true;

    async function loadHome() {
      try {
        const countryQuery = visitorContext?.countryCode ? `?countryCode=${encodeURIComponent(visitorContext.countryCode)}` : '';
        const response = await getMarketplaceHome(countryQuery);
        if (mounted) {
          setHome(response);
          setHomeError(false);
        }
      } catch {
        if (mounted) {
          setHome(null);
          setHomeError(true);
        }
      } finally {
        if (mounted) {
          setHomeLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      mounted = false;
    };
  }, [visitorContext?.countryCode]);

  const normalizedCategories = useMemo(() => buildTopCategories(home), [home]);
  const topCategories = normalizedCategories;
  const discountedItems = useMemo(() => buildDiscountedItems(home), [home]);
  const featuredProducts = useMemo(() => buildFeaturedProducts(home), [home]);
  const sellerCards = useMemo(() => buildSellerCards(home), [home]);
  const metrics = useMemo(() => buildMetrics(home, sellerCards.length), [home, sellerCards.length]);
  const heroVerticalSource = useMemo(() => extractHeroVerticalSource(home), [home]);
  const heroSlides = useMemo(() => normalizeHeroSlides(home), [home]);
  const topDiscounts = discountedItems;
  const trustedSellers = sellerCards;
  const sellerCarouselRef = useRef<ScrollView | null>(null);
  const sellerScrollOffsetRef = useRef(0);
  const sellerCardWidth = isMobile ? 260 : 300;
  const sellerCarouselStep = sellerCardWidth + 24;

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
      console.log('Featured products count:', featuredProducts.length);
      console.log('Trusted sellers count:', trustedSellers.length);
      console.log('Hero slides count:', heroSlides.length, 'activeIndex:', activeHeroIndex);
    }
  }, [activeHeroIndex, featuredProducts.length, heroSlides, heroVerticalSource, normalizedCategories, topDiscounts.length, trustedSellers.length, home]);

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

  function submitSearch() {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    onSearchMarketplace(trimmed);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageWrapper}>
          <View style={[styles.contentContainer, { paddingHorizontal: contentPadding }]}>
          <View style={[styles.header, isMobile && styles.headerMobile]}>
            <View style={styles.brandWrap}>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>S</Text>
              </View>
              <View>
                <Text style={styles.brandName}>Sharity</Text>
              </View>
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

            <View style={styles.headerActions}>
              <Pressable onPress={onSignIn} style={styles.signInButton}>
                <Text numberOfLines={1} style={styles.signInText}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable onPress={onGetStarted} style={styles.headerCta}>
                <Text numberOfLines={1} style={styles.headerCtaText}>
                  Get Started
                </Text>
              </Pressable>
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

          <View style={[styles.heroGrid, !isCompact && styles.heroGridSplit, heroGridWebStyle, { minHeight: heroCardHeight }]}>
            <View
              style={[
                styles.heroCopyCard,
                webHeroContentGradient,
                isDesktop && styles.heroCopyCardDesktop,
                !isCompact && styles.heroCopyCardSplit,
                { minHeight: heroCardHeight }
              ]}
            >
              <View style={styles.heroCopyInner}>
                <View style={styles.heroEyebrow}>
                  <Ionicons color={palette.blue} name="shield-checkmark-outline" size={14} />
                  <Text style={styles.heroEyebrowText}>Safe marketplace</Text>
                </View>
                <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile, isTinyPhone && styles.heroTitleTiny]}>
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

            <View style={[styles.heroVisualCard, webHeroCardGradient, isDesktop && styles.heroVisualCardDesktop, !isCompact && styles.heroVisualCardSplit, { minHeight: heroCardHeight }]}>
              {heroSlides.length > 0 ? (
                <>
                  <Pressable
                    onPress={() => handleHeroSlidePress(activeHeroIndex)}
                    style={[styles.heroCarouselViewport, styles.heroCarouselSimple]}
                  >
                    <Image
                      onError={() => {
                        if (__DEV__) {
                          console.warn('Hero image failed to load:', heroSlides[activeHeroIndex]?.imageUrl);
                        }
                      }}
                      resizeMode="contain"
                      source={{ uri: heroSlides[activeHeroIndex].imageUrl }}
                      style={styles.heroVisualImage}
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

          <View style={[styles.sectionBlock, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionKicker}>Featured Collections</Text>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>
                Top Categories
              </Text>
              <Text style={styles.sectionSubtitle}>
                Browse the main categories in one quick view.
              </Text>
            </View>

            <View style={[styles.categoryGrid, categoryGridWebStyle]}>
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

              {topCategories.map((category) => (
                <Pressable
                  key={category.categoryCode}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(category.verticalCode, home?.verticals ?? []))}
                  style={[styles.categoryCard, isWeb && styles.gridCardFullWidth]}
                >
                  {category.imageUrl ? (
                    <>
                      <View style={styles.categoryMediaWrap}>
                        <ImageBackground
                          imageStyle={styles.categoryImage}
                          resizeMode="contain"
                          source={{ uri: category.imageUrl }}
                          style={styles.categoryMedia}
                        />
                      </View>
                      <View style={styles.categoryCopy}>
                        <View style={styles.categoryIconPill}>
                          <Ionicons color={palette.blue} name={category.icon} size={16} />
                        </View>
                        <Text style={styles.categoryName}>{category.categoryName}</Text>
                        <Text style={styles.categoryCount}>{category.soldCount > 0 ? `${category.soldCount} sold` : 'Curated collection'}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.categoryPlaceholder}>
                      <View style={styles.categoryPlaceholderIcon}>
                        <Ionicons color={palette.blue} name={category.icon} size={20} />
                      </View>
                      <Text style={styles.categoryName}>{category.categoryName}</Text>
                      <Text style={styles.categoryCount}>{category.soldCount > 0 ? `${category.soldCount} sold` : 'Curated collection'}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.sectionBlock, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionKicker}>Today&apos;s Best Deals</Text>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Best deals today</Text>
              <Text style={styles.sectionSubtitle}>Simple discounts from trusted sellers.</Text>
            </View>

            <View style={[styles.productGrid, productGridWebStyle]}>
              {topDiscounts.map((item) => (
                <Pressable
                  key={`${item.verticalCode}-${item.title}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={[styles.productCard, isWeb && styles.gridCardFullWidth]}
                >
                  {item.imageUrl ? (
                    <ImageBackground imageStyle={styles.productImage} source={{ uri: item.imageUrl }} style={styles.productMedia}>
                      <View style={styles.cardScrim} />
                      <View style={styles.productBadge}>
                        <Text style={styles.productBadgeText}>{Math.round(item.discountPercentage)}% off</Text>
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={styles.productPlaceholder}>
                      <Ionicons color={palette.blue} name="pricetag-outline" size={26} />
                      <Text style={styles.productPlaceholderText}>Discounted item</Text>
                    </View>
                  )}
                  <View style={styles.productBody}>
                    <Text style={styles.productCategory} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text style={[styles.productTitle, isMobile && styles.productTitleMobile]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.productMetaRow}>
                      <Text style={styles.productPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                      <Text style={styles.productOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.sectionBlock, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionKicker}>Featured Products</Text>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Popular products</Text>
              <Text style={styles.sectionSubtitle}>A quick look at what shoppers are buying now.</Text>
            </View>

            <View style={[styles.collectionGrid, collectionGridWebStyle]}>
              {featuredProducts.map((item) => (
                <Pressable
                  key={`${item.verticalCode}-${item.title}-${item.sellerName}`}
                  onPress={() => onOpenMarketplace(getMarketplaceRoute(item.verticalCode, home?.verticals ?? []))}
                  style={[styles.collectionCard, isWeb && styles.gridCardFullWidth]}
                >
                  <View style={styles.collectionMediaWrap}>
                    {item.imageUrl ? (
                      <ImageBackground imageStyle={styles.collectionImage} resizeMode="contain" source={{ uri: item.imageUrl }} style={styles.collectionMedia} />
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

          <View style={[styles.sectionBlock, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionKicker}>Trusted Sellers</Text>
                <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Trusted sellers</Text>
                <Text style={styles.sectionSubtitle}>Verified sellers with solid ratings.</Text>
              </View>
              {!isMobile ? (
                <View style={styles.carouselControls}>
                  <Pressable onPress={() => scrollTrustedSellers('previous')} style={styles.carouselControlButton}>
                    <Ionicons color={palette.text} name="chevron-back" size={18} />
                  </Pressable>
                  <Pressable onPress={() => scrollTrustedSellers('next')} style={styles.carouselControlButton}>
                    <Ionicons color={palette.text} name="chevron-forward" size={18} />
                  </Pressable>
                </View>
              ) : null}
            </View>

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
              {trustedSellers.map((seller) => (
                <Pressable
                  key={seller.name}
                  onPress={onBrowse}
                  style={[styles.sellerCard, isWeb && styles.gridCardFullWidth, { width: sellerCardWidth }]}
                >
                  <View style={styles.sellerHeader}>
                    <View style={styles.sellerAvatar}>
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
                    </View>
                  </View>

                  <View style={styles.sellerStatsRow}>
                    <View style={styles.sellerStat}>
                      <Text style={styles.sellerStatValue}>{seller.rating.toFixed(1)}</Text>
                      <Text style={styles.sellerStatLabel}>Review score</Text>
                    </View>
                    <View style={styles.sellerStat}>
                      <Text style={styles.sellerStatValue}>{seller.completedOrders}</Text>
                      <Text style={styles.sellerStatLabel}>Completed orders</Text>
                    </View>
                  </View>

                  <Text style={styles.sellerFooterText}>
                    {seller.listings[0]?.title ?? 'Curated storefront'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.sectionBlock, webGlassPanel, isMobile && styles.sectionBlockMobile]}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionKicker}>Why Choose Sharity</Text>
              <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>Why Sharity</Text>
              <Text style={styles.sectionSubtitle}>Trust, simple checkout, and clear rules.</Text>
            </View>

            <View style={[styles.featureGrid, featureGridWebStyle]}>
              {featureCards.map((feature) => (
                <View key={feature.title} style={[styles.featureCard, isWeb && styles.gridCardFullWidth]}>
                  <View style={styles.featureIcon}>
                    <Ionicons color={palette.blue} name={feature.icon} size={28} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.metricSection}>
            <View style={[styles.metricGrid, metricGridWebStyle]}>
              {metrics.map((metric) => (
                <View key={metric.label} style={[styles.metricCard, isWeb && styles.gridCardFullWidth]}>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.ctaSection, webGlassPanel, isMobile && styles.ctaSectionMobile]}>
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

function buildDiscountedItems(home: MarketplaceHomeResponse | null): DealCard[] {
  if (!home) {
    return [];
  }

  const source = home.discountedSubcategories ?? [];
  if (source.length > 0) {
    return source.map((item) => ({
      categoryName: item.categoryName,
      currencyCode: item.currencyCode,
      discountedPrice: item.discountedPrice,
      discountPercentage: item.discountPercentage,
      imageUrl: item.listingImageUrl,
      originalPrice: item.originalPrice,
      title: item.listingTitle,
      verticalCode: item.verticalCode
    }));
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

function categoryNameFor(categoryCode: string, home: MarketplaceHomeResponse) {
  return home.categories.find((category) => category.code === categoryCode)?.name ?? categoryCode;
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
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currencyCode} ${Math.round(amount)}`;
  }
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
  scrollContent: {
    backgroundColor: palette.page,
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
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44
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
    lineHeight: 28
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
  signInButton: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: 16
  },
  signInText: {
    color: palette.text,
    fontSize: 14,
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
  headerCtaText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800'
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'stretch',
    minHeight: 460,
    width: '100%',
    marginTop: 24
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
    fontSize: 40,
    lineHeight: 46
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
    lineHeight: 24
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
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
    color: palette.text,
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
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10
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
  sectionBlockMobile: {
    padding: 20
  },
  sectionHeading: {
    alignItems: 'center',
    marginBottom: 24
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  sectionKicker: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 46,
    marginTop: 10,
    textAlign: 'center'
  },
  sectionTitleMobile: {
    fontSize: 30,
    lineHeight: 36
  },
  sectionSubtitle: {
    color: palette.body,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 12,
    textAlign: 'center'
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
    gap: 24,
    justifyContent: 'flex-start'
  },
  categoryCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'stretch',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  categoryMediaWrap: {
    backgroundColor: '#f8fbff'
  },
  categoryMedia: {
    height: 218,
    width: '100%'
  },
  categoryImage: {
    borderRadius: 20
  },
  categoryCopy: {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    padding: 18,
    position: 'relative'
  },
  categoryIconPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginBottom: 10,
    width: 30
  },
  categoryCount: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  categoryName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 8
  },
  categoryPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    justifyContent: 'center',
    minHeight: 218,
    padding: 18
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
    justifyContent: 'flex-start'
  },
  productCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'stretch',
    height: '100%',
    width: '100%',
    overflow: 'hidden'
  },
  productMedia: {
    height: 228,
    width: '100%',
    justifyContent: 'space-between'
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.01)'
  },
  productImage: {
    borderRadius: 24
  },
  productPlaceholder: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    gap: 8,
    height: 228,
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
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'relative',
    zIndex: 1
  },
  productBadgeText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '800'
  },
  productBody: {
    padding: 18
  },
  productCategory: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  productTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
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
    marginTop: 14
  },
  productPrice: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800'
  },
  productOriginalPrice: {
    color: palette.body,
    fontSize: 13,
    textDecorationLine: 'line-through'
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: palette.border,
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
  sellerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
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
  sellerStat: {
    backgroundColor: palette.pageAlt,
    borderRadius: 18,
    flex: 1,
    padding: 14
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
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start'
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
    marginTop: 24
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
  metricCard: {
    alignItems: 'center',
    backgroundColor: palette.pageAlt,
    borderRadius: 22,
    flex: 1,
    height: '100%',
    minWidth: 150,
    paddingVertical: 22
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
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 56,
    paddingHorizontal: 24,
    paddingVertical: 44
  },
  ctaSectionMobile: {
    paddingHorizontal: 20,
    paddingVertical: 32
  },
  ctaTitle: {
    color: palette.text,
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
    color: palette.body,
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

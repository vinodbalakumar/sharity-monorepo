import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
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

import { getMarketplaceHome, getMarketplaceListings } from '../../services/marketplaceApi';
import type { VisitorContextResponse } from '../../services/publicContentApi';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { PublicSiteFooter } from '../../components/publicSite/PublicSiteFooter';
import { appState$ } from '../../state/appState';
import { marketingColors, spacing } from '../../theme';
import type { MarketplaceCategory, MarketplaceHomeResponse, MarketplaceListing } from '../../types/marketplace';
import { resolveMockImageUrl } from '../../utils/mockImages';
import { placeholderImageUrl } from '../../utils/mockImages';
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

const stats = [
  ['10M+', 'Active Users'],
  ['50K+', 'Sellers'],
  ['100M+', 'Products'],
  ['4.8/5', 'User Rating']
];

const webHeroGradient = Platform.OS === 'web'
  ? ({ backgroundImage: 'linear-gradient(120deg, #fff0df 0%, #eef7ff 36%, #e8fff4 68%, #e5edff 100%)' } as never)
  : null;
const webFrostedCard = Platform.OS === 'web'
  ? ({
      backdropFilter: 'blur(18px)',
      boxShadow: '0 24px 80px rgba(30,64,175,0.12)',
      WebkitBackdropFilter: 'blur(18px)'
    } as never)
  : null;
const ratingStat = ['4.8/5', 'User Rating'];
const trustChips = ['Protected Checkout', 'Verified Sellers', 'Secure Delivery', 'Imitation Jewellery'];

export function WelcomeScreen({ onBrowse, onGetStarted, onOpenMarketplace, onOpenPublicContent, onSearchMarketplace, onSignIn, visitorContext }: WelcomeScreenProps) {
  const { isMobile } = useResponsiveLayout();
  const { width: viewportWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isPhone = viewportWidth < 560;
  const isCompactHero = viewportWidth < 900;
  const isTabletHero = viewportWidth >= 900 && viewportWidth < 1180;
  const [searchQuery, setSearchQuery] = useState('');
  const [heroCarouselIndex, setHeroCarouselIndex] = useState(0);
  const [home, setHome] = useState<MarketplaceHomeResponse | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(false);
  const [publicListings, setPublicListings] = useState<MarketplaceListing[]>([]);
  const [publicListingsLoading, setPublicListingsLoading] = useState(true);
  const [publicListingsError, setPublicListingsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPublicMarketplaceHome() {
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

    loadPublicMarketplaceHome();

    return () => {
      mounted = false;
    };
  }, [visitorContext?.countryCode]);

  useEffect(() => {
    let mounted = true;

    async function loadPublicListings() {
      try {
        const countryCode = visitorContext?.countryCode;
        const listings = await getMarketplaceListings(countryCode);
        if (mounted) {
          setPublicListings(listings);
          setPublicListingsError(false);
        }
      } catch {
        if (mounted) {
          setPublicListings([]);
          setPublicListingsError(true);
        }
      } finally {
        if (mounted) {
          setPublicListingsLoading(false);
        }
      }
    }

    loadPublicListings();

    return () => {
      mounted = false;
    };
  }, [visitorContext?.countryCode]);

  const topCategories = useMemo(() => buildTopCategories(home), [home]);
  const activeVerticals = useMemo(
    () => (home?.verticals ?? []).filter((vertical) => vertical.status === 'ACTIVE' && vertical.availableToCustomer),
    [home]
  );
  const digitalVertical = useMemo(
    () => activeVerticals.find((vertical) => vertical.moduleCode === 'MARKETPLACE') ?? activeVerticals[0] ?? null,
    [activeVerticals]
  );
  const heroCategoryChips = useMemo(() => buildHeroCategoryChips(home), [home]);
  const heroCarouselImages = useMemo(() => buildHeroCarouselImages(activeVerticals, viewportWidth), [activeVerticals, viewportWidth]);
  const currentHeroImage = heroCarouselImages[heroCarouselIndex] ?? heroCarouselImages[0] ?? null;

  useEffect(() => {
    if (heroCarouselImages.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      setHeroCarouselIndex((current) => (current + 1) % heroCarouselImages.length);
    }, 4200);

    return () => clearInterval(interval);
  }, [heroCarouselImages.length]);

  useEffect(() => {
    if (heroCarouselImages.length > 0 && heroCarouselIndex >= heroCarouselImages.length) {
      setHeroCarouselIndex(0);
    }
  }, [heroCarouselImages.length, heroCarouselIndex]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, isCompactHero && styles.headerMobile, isPhone && styles.headerPhone]}>
          <View style={[styles.brandWrap, isPhone && styles.brandWrapPhone]}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <Text style={styles.brandName}>Sharity</Text>
          </View>

          <View style={[styles.searchBar, isCompactHero && styles.searchBarMobile, isPhone && styles.searchBarPhone]}>
            <Ionicons color={palette.textMuted} name="search-outline" size={18} />
            <TextInput
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                const trimmedQuery = searchQuery.trim();
                if (!trimmedQuery) {
                  return;
                }
                appState$.marketplace.searchQuery.set(trimmedQuery);
                onSearchMarketplace(trimmedQuery);
              }}
              placeholder="Search for products, categories"
              placeholderTextColor={palette.textMuted}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>

          <View style={[styles.headerActions, isPhone && styles.headerActionsPhone]}>
            <Pressable onPress={onSignIn} style={[styles.signInButton, isPhone && styles.headerButtonPhone]}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
            <Pressable onPress={onGetStarted} style={[styles.headerCta, isPhone && styles.headerButtonPhone]}>
              <Text style={styles.headerCtaText}>Get Started</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.hero, webHeroGradient, isTabletHero && styles.heroTablet, isCompactHero && styles.heroMobile, isPhone && styles.heroPhone]}>
          <View style={styles.heroDecorOne} />
          <View style={styles.heroDecorTwo} />

          <View style={[styles.heroCopy, isTabletHero && styles.heroCopyTablet, isCompactHero && styles.heroCopyMobile, isPhone && styles.heroCopyPhone]}>
            <Text style={styles.heroBadge}>Trusted Marketplace</Text>
            <Text style={[styles.heroTitle, isTabletHero && styles.heroTitleTablet, isCompactHero && styles.heroTitleMobile, isPhone && styles.heroTitlePhone]}>
              Buy & Sell Digital Goods and Imitation Jewellery
            </Text>
            <Text style={[styles.heroSubtitle, isPhone && styles.heroSubtitlePhone]}>
              Sharity helps buyers and sellers trade gift cards, subscriptions, game codes, software licenses, and imitation jewellery through verified sellers, protected checkout, and clear delivery rules.
            </Text>
            <View style={[styles.heroActions, isPhone && styles.heroActionsPhone]}>
              <Pressable onPress={onGetStarted} style={[styles.heroPrimary, isPhone && styles.heroActionPhone]}>
                <Text style={styles.heroPrimaryText}>Get Started Free</Text>
              </Pressable>
              <Pressable onPress={onSignIn} style={[styles.heroSecondary, isPhone && styles.heroActionPhone]}>
                <Text style={styles.heroSecondaryText}>Sign In</Text>
              </Pressable>
            </View>

            <View style={styles.heroSpotlightPanel}>
              <Text style={styles.heroSpotlightBadge}>Market</Text>
              <View style={styles.heroSpotlightCopy}>
                <Text style={styles.heroSpotlightTitle} numberOfLines={1}>
                  Sharity Marketplace
                </Text>
                <Text style={styles.heroSpotlightDescription} numberOfLines={1}>
                  Digital products • Imitation jewellery • Verified sellers
                </Text>
              </View>
            </View>

            <View style={[styles.heroChipGrid, isPhone && styles.heroChipGridPhone]}>
              {[...trustChips, ...heroCategoryChips].slice(0, isPhone ? 4 : 8).map((item) => (
                <Text key={item} style={styles.heroChip}>
                  {item}
                </Text>
              ))}
            </View>
          </View>

          <View style={[styles.heroImagePane, !isTabletHero && !isCompactHero && styles.heroImagePaneDesktop, isTabletHero && styles.heroImagePaneTablet, isCompactHero && styles.heroImagePaneMobile, isPhone && styles.heroImagePanePhone]}>
            {currentHeroImage ? (
              <ImageBackground
                imageStyle={styles.heroBannerImage}
                resizeMode={isPhone ? 'contain' : 'cover'}
                source={{ uri: currentHeroImage }}
                style={styles.heroBannerImageWrap}
              />
            ) : (
              <View style={styles.heroVisualFallback}>
                <View style={styles.heroVisualIconCircle}>
                  <Ionicons color={palette.white} name="shield-checkmark-outline" size={30} />
                </View>
                <Text style={styles.heroVisualKicker}>Protected checkout</Text>
                <Text style={styles.heroVisualTitle}>Instant digital delivery</Text>
                <Text style={styles.heroVisualText}>Codes, subscriptions, and licenses stay organized in one trusted marketplace.</Text>
              </View>
            )}
          </View>

          <View style={styles.heroCarouselDots}>
            {heroCarouselImages.map((imageUrl, index) => (
              <Pressable
                key={`${imageUrl}-${index}`}
                accessibilityLabel={`Go to marketplace image ${index + 1}`}
                onPress={() => setHeroCarouselIndex(index)}
                style={[styles.heroCarouselDot, index === heroCarouselIndex && styles.heroCarouselDotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Top categories</Text>
            <Text style={styles.sectionTitle}>Browse the live catalog</Text>
          </View>
          <Text style={styles.sectionNote}>Explore live categories and featured listings.</Text>
        </View>

        {isMobile ? (
          <ScrollView
            contentContainerStyle={styles.horizontalShelfContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalShelf}
          >
            {homeLoading ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="sync-outline" size={22} />
                <Text style={styles.apiStateText}>Loading marketplace categories...</Text>
              </View>
            ) : null}
            {homeError ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Marketplace categories are unavailable right now.</Text>
              </View>
            ) : null}
            {!homeLoading && !homeError && topCategories.length === 0 ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No active public categories are available for this region.</Text>
              </View>
            ) : null}
            {topCategories.map((category, index) => (
              <Pressable
                key={category.code}
                onPress={() => onOpenMarketplace(category.verticalCode === 'JEWELLERY' ? 'jewelryMarketplace' : 'digitalMarketplace')}
                style={[
                  styles.categoryCard,
                  styles.categoryCardShelf,
                  index === 0 && styles.categoryCardFeatured
                ]}
              >
                {category.imageUrl ? (
                  <ImageBackground
                    imageStyle={styles.categoryImage}
                    resizeMode="cover"
                    source={{ uri: category.imageUrl }}
                    style={styles.categoryImageWrap}
                  >
                    <View style={styles.categoryOverlay} />
                    <View style={styles.categoryCopy}>
                      <View style={styles.categoryIconPill}>
                        <Ionicons color={palette.white} name={category.icon} size={16} />
                      </View>
                      <Text style={styles.categoryCount}>{category.countLabel}</Text>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={[styles.categoryImageWrap, styles.categoryNoImage]}>
                    <View style={styles.categoryCopy}>
                      <View style={styles.categoryIconPill}>
                        <Ionicons color={palette.white} name={category.icon} size={16} />
                      </View>
                      <Text style={styles.categoryCount}>Live marketplace image</Text>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.categoryGrid}>
            {homeLoading ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="sync-outline" size={22} />
                <Text style={styles.apiStateText}>Loading marketplace categories...</Text>
              </View>
            ) : null}
            {homeError ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Marketplace categories are unavailable right now.</Text>
              </View>
            ) : null}
            {!homeLoading && !homeError && topCategories.length === 0 ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No active public categories are available for this region.</Text>
              </View>
            ) : null}
            {topCategories.map((category, index) => (
              <Pressable
                key={category.code}
                onPress={() => onOpenMarketplace(category.verticalCode === 'JEWELLERY' ? 'jewelryMarketplace' : 'digitalMarketplace')}
                style={[styles.categoryCard, isMobile && styles.categoryCardCompact, index === 0 && styles.categoryCardFeatured]}
              >
                {category.imageUrl ? (
                  <ImageBackground
                    imageStyle={styles.categoryImage}
                    resizeMode="cover"
                    source={{ uri: category.imageUrl }}
                    style={styles.categoryImageWrap}
                  >
                    <View style={styles.categoryOverlay} />
                    <View style={styles.categoryCopy}>
                      <View style={styles.categoryIconPill}>
                        <Ionicons color={palette.white} name={category.icon} size={16} />
                      </View>
                      <Text style={styles.categoryCount}>{category.countLabel}</Text>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={[styles.categoryImageWrap, styles.categoryNoImage]}>
                    <View style={styles.categoryCopy}>
                      <View style={styles.categoryIconPill}>
                        <Ionicons color={palette.white} name={category.icon} size={16} />
                      </View>
                      <Text style={styles.categoryCount}>Live marketplace image</Text>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Public listings</Text>
            <Text style={styles.sectionTitle}>Browse before you sign in</Text>
          </View>
          <Text style={styles.sectionNote}>Real listings are visible to everyone. Checkout stays protected.</Text>
        </View>

        {isMobile ? (
          <ScrollView
            contentContainerStyle={styles.horizontalShelfContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalShelf}
          >
            {publicListingsLoading ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="sync-outline" size={22} />
                <Text style={styles.apiStateText}>Loading public listings...</Text>
              </View>
            ) : null}
            {publicListingsError ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Public listings are unavailable right now.</Text>
              </View>
            ) : null}
            {!publicListingsLoading && !publicListingsError && publicListings.length === 0 ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No public listings found for this region.</Text>
              </View>
            ) : null}
            {publicListings.slice(0, 8).map((listing) => {
              const marketplaceRoute = listing.verticalCode === 'JEWELLERY' ? 'jewelryMarketplace' : 'digitalMarketplace';
              const price = formatMoney(listing.displayPriceAmount ?? listing.priceAmount, listing.displayCurrencyCode ?? listing.currencyCode);
              const original = listing.displayOriginalPriceAmount ?? listing.originalPriceAmount;
              const discount = original && original > (listing.displayPriceAmount ?? listing.priceAmount)
                ? Math.round(((original - (listing.displayPriceAmount ?? listing.priceAmount)) / original) * 100)
                : 0;

              return (
                <Pressable
                  key={listing.publicId}
                  onPress={() => onOpenMarketplace(marketplaceRoute)}
                  style={[styles.publicListingCard, styles.publicListingCardShelf]}
                >
                  <ImageBackground
                    imageStyle={styles.publicListingImage}
                    resizeMode="cover"
                    source={{ uri: listing.imageUrl ?? placeholderImageUrl(listing.title, 900) }}
                    style={styles.publicListingImageWrap}
                  >
                    <View style={styles.publicListingScrim} />
                    <View style={styles.publicListingBadgeRow}>
                      <Text style={styles.publicListingBadge}>{listing.productType}</Text>
                      {discount > 0 ? <Text style={styles.publicListingBadge}>{discount}% off</Text> : null}
                    </View>
                  </ImageBackground>
                  <View style={styles.publicListingCopy}>
                    <Text style={styles.publicListingMarketplace}>{listing.verticalCode === 'JEWELLERY' ? 'Imitation Jewellery' : 'Digital Marketplace'}</Text>
                    <Text style={styles.publicListingTitle} numberOfLines={2}>{listing.title}</Text>
                    <Text style={styles.publicListingSeller} numberOfLines={1}>{listing.sellerDisplayName}</Text>
                    <View style={styles.publicListingPriceRow}>
                      <Text style={styles.publicListingPrice}>{price}</Text>
                      <Text style={styles.publicListingCta}>{listing.productType === 'DIGITAL' ? 'Buy now' : 'View listing'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.publicListingGrid}>
            {publicListingsLoading ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="sync-outline" size={22} />
                <Text style={styles.apiStateText}>Loading public listings...</Text>
              </View>
            ) : null}
            {publicListingsError ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Public listings are unavailable right now.</Text>
              </View>
            ) : null}
            {!publicListingsLoading && !publicListingsError && publicListings.length === 0 ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No public listings found for this region.</Text>
              </View>
            ) : null}
            {publicListings.slice(0, 8).map((listing) => {
              const marketplaceRoute = listing.verticalCode === 'JEWELLERY' ? 'jewelryMarketplace' : 'digitalMarketplace';
              const price = formatMoney(listing.displayPriceAmount ?? listing.priceAmount, listing.displayCurrencyCode ?? listing.currencyCode);
              const original = listing.displayOriginalPriceAmount ?? listing.originalPriceAmount;
              const discount = original && original > (listing.displayPriceAmount ?? listing.priceAmount)
                ? Math.round(((original - (listing.displayPriceAmount ?? listing.priceAmount)) / original) * 100)
                : 0;

              return (
                <Pressable
                  key={listing.publicId}
                  onPress={() => onOpenMarketplace(marketplaceRoute)}
                  style={[styles.publicListingCard, isMobile && styles.publicListingCardCompact]}
                >
                  <ImageBackground
                    imageStyle={styles.publicListingImage}
                    resizeMode="cover"
                    source={{ uri: listing.imageUrl ?? placeholderImageUrl(listing.title, 900) }}
                    style={styles.publicListingImageWrap}
                  >
                    <View style={styles.publicListingScrim} />
                    <View style={styles.publicListingBadgeRow}>
                      <Text style={styles.publicListingBadge}>{listing.productType}</Text>
                      {discount > 0 ? <Text style={styles.publicListingBadge}>{discount}% off</Text> : null}
                    </View>
                  </ImageBackground>
                  <View style={styles.publicListingCopy}>
                    <Text style={styles.publicListingMarketplace}>{listing.verticalCode === 'JEWELLERY' ? 'Imitation Jewellery' : 'Digital Marketplace'}</Text>
                    <Text style={styles.publicListingTitle} numberOfLines={2}>{listing.title}</Text>
                    <Text style={styles.publicListingSeller} numberOfLines={1}>{listing.sellerDisplayName}</Text>
                    <View style={styles.publicListingPriceRow}>
                      <Text style={styles.publicListingPrice}>{price}</Text>
                      <Text style={styles.publicListingCta}>{listing.productType === 'DIGITAL' ? 'Buy now' : 'View listing'}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>Why Choose Sharity?</Text>
          <Text style={styles.whySubtitle}>The safest marketplace for buyers and sellers</Text>
          <View style={styles.featureGrid}>
            {featureCards.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons color={palette.blue} name={feature.icon} size={30} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsBand}>
          {(activeVerticals.length > 0
            ? [
                [`${activeVerticals.length}`, 'Active Marketplaces'],
                [`${home?.categories.filter((category) => category.active).length ?? 0}`, 'Live Categories'],
                [`${home?.featuredListings.length ?? 0}`, 'Featured Listings'],
                ratingStat
              ]
            : stats
          ).map(([value, label]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, isMobile && styles.ctaTitleMobile]}>Ready to Start Shopping?</Text>
          <Text style={styles.ctaText}>Join millions of users and experience the future of online shopping</Text>
          <Pressable onPress={onGetStarted} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Create Free Account</Text>
            <Ionicons color={palette.white} name="arrow-forward" size={18} />
          </Pressable>
        </View>

        {isWeb ? <PublicSiteFooter groups={footerGroups} onLinkPress={onOpenPublicContent} visitorContext={visitorContext} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type LandingCategory = {
  code: string;
  countLabel: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  imageUrl: string | null;
  name: string;
  verticalCode: string;
};

function buildTopCategories(home: MarketplaceHomeResponse | null): LandingCategory[] {
  if (!home) {
    return [];
  }

  if ((home.topCategories ?? []).length > 0) {
    return (home.topCategories ?? []).slice(0, 6).map((category) => ({
      code: category.categoryCode,
      countLabel: countLabelFor(category.soldCount, category.activeCount, category.maxDiscountPercent),
      icon: iconForCategory({
        code: category.categoryCode,
        countryCode: null,
        active: true,
        iconRef: category.iconRef,
        imageUrl: category.imageUrl,
        id: 0,
        name: category.categoryName,
        slug: category.slug,
        verticalCode: category.verticalCode
        }), 
        imageUrl: category.imageUrl ? resolveMockImageUrl(category.imageUrl, 720) : placeholderImageUrl(category.categoryName, 720),
        name: category.categoryName,
        verticalCode: category.verticalCode
      }));
  }

  const seenNames = new Set<string>();
  const featuredCountByCategory = new Map<string, number>();

  home.featuredListings.forEach((listing) => {
    featuredCountByCategory.set(listing.categoryCode, (featuredCountByCategory.get(listing.categoryCode) ?? 0) + 1);
  });

  return home.categories
    .filter((category) => category.active)
    .filter((category) => {
      const key = category.name.toLowerCase();
      if (seenNames.has(key)) {
        return false;
      }
      seenNames.add(key);
      return true;
    })
    .slice(0, 6)
    .map((category) => ({
      code: category.code,
      countLabel: countLabelFor(featuredCountByCategory.get(category.code) ?? 0, 0, 0),
      icon: iconForCategory(category),
      imageUrl: imageForCategory(category, home),
      name: category.name,
      verticalCode: category.verticalCode
    }));
}

function buildHeroCategoryChips(home: MarketplaceHomeResponse | null) {
  if (!home) {
    return [];
  }

  const seen = new Set<string>();
  return home.categories
    .filter((category) => category.active && category.verticalCode === 'MARKETPLACE')
    .map((category) => category.name.trim())
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function buildHeroCarouselImages(verticals: MarketplaceHomeResponse['verticals'], viewportWidth: number) {
  let imageWidth = 1200;
  if (viewportWidth < 560) {
    imageWidth = 480;
  } else if (viewportWidth < 900) {
    imageWidth = 768;
  } else if (viewportWidth < 1180) {
    imageWidth = 1000;
  }

  const images = verticals
    .flatMap((vertical) => splitAssetSources(vertical.imageKeys ?? vertical.imageUrl))
    .map((imageSource) => resolveMockImageUrl(imageSource, imageWidth))
    .filter(Boolean);

  return Array.from(new Set(images)).slice(0, 8);
}

function splitAssetSources(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function countLabelFor(soldCount: number, activeCount: number, discountPercent: number) {
  const labels = [];
  if (soldCount > 0) {
    labels.push(soldCount === 1 ? '1 sold' : `${soldCount} sold`);
  }
  if (discountPercent > 0) {
    labels.push(`${discountPercent}% off`);
  }
  if (labels.length === 0) {
    labels.push(activeCount > 0 ? `${activeCount} live` : 'Live now');
  }
  return labels.join(' â€¢ ');
}

function iconForCategory(category: MarketplaceCategory): ComponentProps<typeof Ionicons>['name'] {
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

function imageForCategory(category: MarketplaceCategory, home: MarketplaceHomeResponse) {
  if (category.imageUrl) {
    return resolveMockImageUrl(category.imageUrl, 720);
  }

  const directMatch = home.featuredListings.find((listing) => listing.categoryCode === category.code && listing.imageUrl);
  if (directMatch?.imageUrl) {
    return resolveMockImageUrl(directMatch.imageUrl, 720);
  }

  const verticalMatch = home.featuredListings.find((listing) => listing.verticalCode === category.verticalCode && listing.imageUrl);
  if (verticalMatch?.imageUrl) {
    return resolveMockImageUrl(verticalMatch.imageUrl, 720);
  }

  return placeholderImageUrl(category.name, 720);
}

function formatMoney(amount: number | null | undefined, currencyCode: string | null | undefined) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '';
  }

  const currency = currencyCode ?? 'USD';
  const fractionDigits = amount % 1 === 0 ? 0 : 2;

  try {
    return new Intl.NumberFormat('en-US', {
      currency,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
      style: 'currency'
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(fractionDigits)}`;
  }
}

const palette = marketingColors;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: palette.page,
    flex: 1
  },
  page: {
    backgroundColor: palette.page,
    paddingBottom: 0
  },
  header: {
    alignItems: 'center',
    backgroundColor: palette.header,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 74,
    paddingHorizontal: 32
  },
  headerInnerMobile: {
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  headerMobile: {
    gap: spacing.sm,
    flexWrap: 'wrap',
    minHeight: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerPhone: {
    gap: spacing.sm,
    paddingHorizontal: 12
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 130
  },
  brandWrapMobile: {
    minWidth: 0,
    width: '100%'
  },
  brandWrapPhone: {
    minWidth: 0
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  brandLetter: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '900'
  },
  brandName: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '900'
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 42,
    maxWidth: 310,
    paddingHorizontal: spacing.md,
    width: '28%'
  },
  searchBarMobile: {
    flexBasis: '100%',
    marginLeft: 0,
    marginTop: spacing.sm,
    order: 3,
    width: '100%'
  },
  searchBarPhone: {
    maxWidth: '100%',
    minWidth: 0
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontSize: 14,
    outlineStyle: 'none' as never
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 'auto'
  },
  headerActionsMobile: {
    justifyContent: 'space-between',
    marginLeft: 0,
    width: '100%'
  },
  headerActionsPhone: {
    flexShrink: 0,
    gap: 6,
    marginLeft: 'auto'
  },
  headerButtonCompact: {
    flex: 1,
    justifyContent: 'center'
  },
  headerButtonPhone: {
    minHeight: 38,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  signInButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  signInText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '900'
  },
  headerCta: {
    backgroundColor: palette.blue,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12
  },
  headerCtaText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900'
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#EEF6FF',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 32,
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'space-between',
    marginHorizontal: 26,
    marginVertical: 26,
    minHeight: 520,
    overflow: 'hidden',
    paddingHorizontal: 28,
    paddingVertical: 34,
    position: 'relative'
  },
  heroTablet: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: spacing.xl,
    minHeight: 0,
    paddingHorizontal: 30,
    paddingVertical: 34
  },
  heroMobile: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: spacing.md,
    margin: spacing.md,
    minHeight: 0,
    padding: spacing.lg,
    paddingBottom: 54
  },
  heroPhone: {
    borderRadius: 24,
    marginHorizontal: 12,
    marginVertical: 18,
    paddingHorizontal: 16,
    paddingVertical: 18
  },
  heroCompactPhone: {
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  heroCopy: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 0.58,
    maxWidth: 540,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10,
    zIndex: 2
  },
  heroCopyTablet: {
    alignSelf: 'center',
    maxWidth: 780,
    width: '100%'
  },
  heroCopyMobile: {
    alignSelf: 'stretch',
    minWidth: 0,
    maxWidth: '100%',
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
    width: '100%'
  },
  heroCopyPhone: {
    paddingVertical: spacing.md
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    borderRadius: 999,
    borderWidth: 2,
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    overflow: 'visible',
    paddingHorizontal: 16,
    paddingVertical: 10,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: '#0F172A',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 52,
    marginTop: 18,
    maxWidth: 560
  },
  heroTitleTablet: {
    fontSize: 44,
    lineHeight: 50,
    maxWidth: 760
  },
  heroTitleMobile: {
    fontSize: 31,
    lineHeight: 37,
    maxWidth: '100%'
  },
  heroTitlePhone: {
    fontSize: 24,
    lineHeight: 29,
    marginTop: 12
  },
  heroSubtitle: {
    color: '#475569',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 27,
    marginTop: 16,
    maxWidth: 540
  },
  heroSubtitlePhone: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: '100%'
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 28
  },
  heroActionsPhone: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  heroActionsCompact: {
    gap: spacing.sm
  },
  heroPrimary: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 176,
    paddingHorizontal: spacing.lg
  },
  heroActionPhone: {
    flexGrow: 1,
    minHeight: 48,
    minWidth: 130,
    paddingHorizontal: spacing.md
  },
  heroPrimaryText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  heroSecondary: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(148,163,184,0.34)',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    minWidth: 110,
    paddingHorizontal: spacing.lg
  },
  heroSecondaryText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800'
  },
  heroBackgroundShell: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    height: '100%',
    minHeight: 450,
    overflow: 'hidden',
    position: 'absolute'
  },
  heroBackgroundShellMobile: {
    minHeight: 360
  },
  heroBackgroundCarouselContent: {
    alignItems: 'stretch'
  },
  heroBackgroundCarousel: {
    ...StyleSheet.absoluteFillObject,
    height: '100%'
  },
  heroBackgroundSlide: {
    height: '100%',
    width: '100%'
  },
  heroBackgroundSlideImageWrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.cardAlt,
    height: '100%',
    width: '100%'
  },
  heroBackgroundSlideImage: {
    borderRadius: 0
  },
  heroBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,18,32,0.02)'
  },
  heroBannerBackground: {
    ...StyleSheet.absoluteFillObject
  },
  heroBannerImageWrap: {
    flex: 1,
    height: '100%',
    width: '100%'
  },
  heroBannerImage: {
    borderRadius: 26
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.06)'
  },
  heroBannerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  heroImagePane: {
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.62)',
    borderRadius: 28,
    borderWidth: 1,
    flex: 1.95,
    maxHeight: 540,
    maxWidth: 1220,
    minHeight: 300,
    minWidth: 400,
    overflow: 'hidden',
    zIndex: 2
  },
  heroImagePaneDesktop: {
    marginLeft: -18
  },
  heroImagePaneTablet: {
    alignSelf: 'stretch',
    flex: 0,
    height: 360,
    maxHeight: 420,
    maxWidth: '100%',
    minHeight: 200,
    minWidth: 200,
    width: '100%'
  },
  heroImagePaneMobile: {
    alignSelf: 'stretch',
    flex: 0,
    height: 300,
    maxWidth: '100%',
    minHeight: 200,
    minWidth: 200,
    width: '100%'
  },
  heroImagePanePhone: {
    borderRadius: 20,
    height: 230,
    minHeight: 180,
    minWidth: 150
  },
  heroSpotlightPanel: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderColor: 'rgba(226,232,240,0.86)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  heroSpotlightBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 999,
    color: palette.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase'
  },
  heroSpotlightCopy: {
    flex: 1,
    minWidth: 0
  },
  heroSpotlightTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 17
  },
  heroSpotlightDescription: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 15,
    marginTop: 1
  },
  heroChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12
  },
  heroChipGridPhone: {
    gap: 8
  },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: 'rgba(37,99,235,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  heroVisual: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 400,
    minWidth: 420,
    position: 'relative',
    zIndex: 1
  },
  heroVisualMobile: {
    minHeight: 320,
    minWidth: 0
  },
  heroDecorOne: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 999,
    height: 260,
    position: 'absolute',
    right: -60,
    top: -70,
    width: 260
  },
  heroDecorTwo: {
    backgroundColor: 'rgba(37,99,235,0.1)',
    borderRadius: 999,
    bottom: -90,
    height: 320,
    position: 'absolute',
    right: 270,
    width: 320
  },
  heroVisualHalo: {
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderRadius: 999,
    height: 330,
    position: 'absolute',
    width: 330
  },
  heroVisualFrame: {
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    borderWidth: 1,
    height: 330,
    maxWidth: 520,
    overflow: 'hidden',
    shadowColor: '#1e40af',
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 54,
    width: '88%'
  },
  heroVisualImageWrap: {
    flex: 1,
    height: '100%',
    width: '100%'
  },
  heroVisualImage: {
    borderRadius: 28
  },
  heroVisualImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.06)'
  },
  heroVisualFallback: {
    backgroundColor: 'rgba(15,23,42,0.92)',
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    width: '100%'
  },
  heroVisualIconCircle: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    width: 56
  },
  heroVisualKicker: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 24,
    textTransform: 'uppercase'
  },
  heroVisualTitle: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    marginTop: 8
  },
  heroVisualText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
    marginTop: 12
  },
  heroVisualStack: {
    bottom: 28,
    flexDirection: 'row',
    gap: 12,
    position: 'absolute'
  },
  heroMiniTile: {
    alignItems: 'center',
    borderRadius: 18,
    gap: 8,
    justifyContent: 'center',
    minHeight: 92,
    paddingHorizontal: 16,
    width: 116
  },
  heroMiniTileBlue: {
    backgroundColor: '#2563EB'
  },
  heroMiniTilePurple: {
    backgroundColor: '#7C3AED'
  },
  heroMiniTileGreen: {
    backgroundColor: '#1D9E75'
  },
  heroMiniTileText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center'
  },
  heroCarouselDots: {
    bottom: 22,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0
  },
  heroCarouselDot: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 999,
    height: 9,
    width: 9
  },
  heroCarouselDotActive: {
    backgroundColor: '#2563EB',
    width: 26
  },
  heroShowcaseBadge: {
    color: palette.blue,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  heroShowcaseTitle: {
    color: palette.text,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: 2
  },
  heroShowcaseTitleMini: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: 2
  },
  heroShowcaseMeta: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6
  },
  heroShowcasePrice: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6
  },
  heroShowcasePriceMini: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4
  },
  featuredRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 26,
    paddingTop: 18,
    borderTopColor: 'rgba(22,49,79,0.08)',
    borderTopWidth: 1
  },
  featuredText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  featuredMuted: {
    color: palette.blue
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 36
  },
  sectionKicker: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  sectionHeaderMobile: {
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '900'
  },
  sectionNote: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  viewAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  viewAllText: {
    color: palette.blue,
    fontSize: 14,
    fontWeight: '900'
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    padding: 32
  },
  horizontalShelf: {
    paddingHorizontal: 32
  },
  horizontalShelfContent: {
    gap: 16,
    paddingBottom: 8,
    paddingRight: 32
  },
  horizontalState: {
    minWidth: 280
  },
  publicListingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    paddingHorizontal: 32,
    paddingBottom: 16
  },
  categoryCard: {
    borderRadius: 18,
    flexBasis: '31%',
    flexGrow: 1,
    maxWidth: '31%',
    minWidth: 280,
    overflow: 'hidden'
  },
  categoryCardFeatured: {
    flexBasis: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  },
  categoryCardCompact: {
    maxWidth: '100%',
    minWidth: '100%'
  },
  categoryCardShelf: {
    flexBasis: 'auto',
    flexGrow: 0,
    maxWidth: 280,
    minWidth: 280,
    width: 280
  },
  categoryImageWrap: {
    borderColor: palette.border,
    borderWidth: 1,
    height: 330,
    justifyContent: 'flex-end'
  },
  categoryImage: {
    borderRadius: 18
  },
  categoryNoImage: {
    backgroundColor: palette.cardAlt
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,38,58,0.32)'
  },
  categoryCopy: {
    padding: spacing.lg
  },
  categoryCopyNoImage: {
    padding: spacing.md
  },
  categoryIconPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(63,136,197,0.9)',
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 30
  },
  categoryCount: {
    color: '#eef8ff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  categoryName: {
    color: palette.white,
    fontSize: 17,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  categoryIconPillNoImage: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 999,
    height: 30,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 30
  },
  categoryCountNoImage: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '900'
  },
  categoryNameNoImage: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  publicListingCard: {
    backgroundColor: palette.white,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '23%',
    flexGrow: 1,
    minWidth: 240,
    overflow: 'hidden'
  },
  publicListingCardCompact: {
    flexBasis: '100%',
    minWidth: '100%'
  },
  publicListingCardShelf: {
    flexBasis: 'auto',
    flexGrow: 0,
    maxWidth: 260,
    minWidth: 260,
    width: 260
  },
  publicListingImageWrap: {
    height: 180
  },
  publicListingImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },
  publicListingScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,20,35,0.12)'
  },
  publicListingBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    padding: spacing.md
  },
  publicListingBadge: {
    backgroundColor: 'rgba(10,20,35,0.72)',
    borderRadius: 999,
    color: palette.white,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'uppercase'
  },
  publicListingCopy: {
    gap: 4,
    padding: spacing.lg
  },
  publicListingMarketplace: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  publicListingTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22
  },
  publicListingSeller: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  publicListingPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs
  },
  publicListingPrice: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900'
  },
  publicListingCta: {
    color: palette.blue,
    fontSize: 13,
    fontWeight: '900'
  },
  whySection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 72
  },
  whyTitle: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center'
  },
  whySubtitle: {
    color: palette.textMuted,
    fontSize: 16,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 38,
    justifyContent: 'space-between',
    marginTop: 48,
    width: '100%'
  },
  featureCard: {
    alignItems: 'center',
    flexBasis: 220,
    flexGrow: 1,
    paddingHorizontal: spacing.md
  },
  featureCardCompact: {
    flexBasis: '100%',
    paddingHorizontal: 0
  },
  featureIcon: {
    alignItems: 'center',
    backgroundColor: palette.purpleSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  featureTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  featureText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
    maxWidth: 250,
    textAlign: 'center'
  },
  statsBand: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 46
  },
  statItem: {
    alignItems: 'center',
    flexBasis: 190,
    flexGrow: 1,
    maxWidth: 260
  },
  statItemCompact: {
    flexBasis: '48%',
    maxWidth: '50%',
    paddingVertical: spacing.sm
  },
  statValue: {
    color: palette.blue,
    fontSize: 32,
    fontWeight: '900'
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: spacing.xs
  },
  ctaSection: {
    alignItems: 'center',
    backgroundColor: '#11183A',
    paddingHorizontal: 32,
    paddingVertical: 90
  },
  ctaTitle: {
    color: palette.text,
    fontSize: 42,
    fontWeight: '900',
    textAlign: 'center'
  },
  ctaTitleMobile: {
    fontSize: 32
  },
  ctaText: {
    color: palette.textMuted,
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: palette.blue,
    borderRadius: 10,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: 42,
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  ctaButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  footer: {
    padding: 32
  },
  footerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    justifyContent: 'space-between'
  },
  footerGroup: {
    gap: spacing.md,
    minWidth: 180
  },
  footerTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '900'
  },
  footerLink: {
    color: palette.textMuted,
    fontSize: 14
  },
  apiState: {
    alignItems: 'center',
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 88,
    paddingHorizontal: spacing.lg,
    width: '100%'
  },
  apiStateText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  footerNotice: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  footerNoticeText: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19
  },
  copyright: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    color: palette.textMuted,
    fontSize: 13,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    textAlign: 'center'
  }
});


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
const ratingStat = ['4.8/5', 'User Rating'];

export function WelcomeScreen({ onBrowse, onGetStarted, onOpenMarketplace, onOpenPublicContent, onSearchMarketplace, onSignIn, visitorContext }: WelcomeScreenProps) {
  const { isMobile } = useResponsiveLayout();
  const { width: viewportWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompact = viewportWidth < 992;
  const isCompactMarketplaceGrid = viewportWidth < 992;
  const categoryColumns = viewportWidth < 360 ? 1 : viewportWidth < 992 ? 2 : 4;
  const categoryGutter = viewportWidth < 560 ? 8 : 6;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
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

  useEffect(() => {
    if (activeHeroIndex >= activeVerticals.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, activeVerticals.length]);

  useEffect(() => {
    if (activeVerticals.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % activeVerticals.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeVerticals.length]);

  const activeHeroVertical = activeVerticals[activeHeroIndex] ?? null;
  const activeHeroImageUrl = activeHeroVertical && home ? imageForVertical(activeHeroVertical, home) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>S</Text>
            </View>
            <Text style={styles.brandName}>Sharity</Text>
          </View>
          {!isCompact ? (
            <View style={styles.searchBar}>
              <Ionicons color={palette.textMuted} name="search-outline" size={18} />
              <TextInput
                onChangeText={setSearchQuery}
                onSubmitEditing={() => submitSearch(searchQuery, onSearchMarketplace)}
                placeholder="Search for products, categories"
                placeholderTextColor={palette.textMuted}
                returnKeyType="search"
                style={[styles.searchInput, isWeb && styles.searchInputWeb]}
                value={searchQuery}
              />
            </View>
          ) : null}
          <View style={styles.headerActions}>
            <Pressable onPress={onSignIn} style={styles.signInButton}>
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
            <Pressable onPress={onGetStarted} style={styles.headerCta}>
              <Text style={styles.headerCtaText}>{isCompact ? 'Start' : 'Get Started'}</Text>
            </Pressable>
          </View>
        </View>

        {isCompact ? (
          <View style={styles.compactSearchSection}>
            <View style={styles.searchBarCompact}>
              <Ionicons color={palette.textMuted} name="search-outline" size={18} />
              <TextInput
                onChangeText={setSearchQuery}
                onSubmitEditing={() => submitSearch(searchQuery, onSearchMarketplace)}
                placeholder="Search for products, categories"
                placeholderTextColor={palette.textMuted}
                returnKeyType="search"
                style={[styles.searchInput, styles.searchInputCompact, isWeb && styles.searchInputWeb]}
                value={searchQuery}
              />
            </View>
          </View>
        ) : null}

        <View style={[styles.heroSection, webHeroGradient, isCompact && styles.heroSectionCompact]}>
          <View style={[styles.heroContentCard, isCompact && styles.heroContentCardCompact]}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>TRUSTED MARKETPLACE</Text>
            </View>
            <Text style={[styles.heroTitle, isCompact && styles.heroTitleMobile]}>
              Buy & Sell Digital Goods and Imitation Jewellery
            </Text>
            <Text style={styles.heroDescription}>
              Sharity helps buyers and sellers trade gift cards, subscriptions, game codes, software licenses, and imitation jewellery through verified sellers, protected checkout, and clear delivery rules.
            </Text>
            <View style={[styles.heroActions, isCompact && styles.heroActionsMobile]}>
              <Pressable onPress={onGetStarted} style={styles.heroPrimary}>
                <Text numberOfLines={1} style={styles.heroPrimaryText}>Get Started Free</Text>
              </Pressable>
              <Pressable onPress={onSignIn} style={styles.heroSecondary}>
                <Text numberOfLines={1} style={styles.heroSecondaryText}>Sign In</Text>
              </Pressable>
            </View>
            <View style={styles.heroChips}>
              {['Protected Checkout', 'Verified Sellers', 'Secure Delivery', 'Imitation Jewellery'].map((item) => (
                <View key={item} style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.heroCarouselWrapper, isCompact && styles.heroCarouselWrapperCompact]}>
            {activeHeroImageUrl ? (
              <ImageBackground
                imageStyle={styles.heroCarouselImage}
                resizeMode="contain"
                source={{ uri: activeHeroImageUrl }}
                style={styles.heroCarouselMedia}
              >
                <View style={styles.heroCarouselImageFallbackBackground} />
              </ImageBackground>
            ) : homeLoading ? (
              <View style={styles.heroCarouselState}>
                <Ionicons color={palette.blue} name="sync-outline" size={28} />
                <Text style={styles.heroCarouselStateText}>Loading marketplace...</Text>
              </View>
            ) : (
              <View style={styles.heroCarouselState}>
                <Ionicons color={palette.blue} name="images-outline" size={28} />
                <Text style={styles.heroCarouselStateText}>No hero image configured</Text>
              </View>
            )}
            {activeVerticals.length > 1 ? (
              <View style={styles.heroDots}>
                {activeVerticals.map((vertical, index) => (
                  <Pressable
                    key={vertical.moduleCode}
                    onPress={() => setActiveHeroIndex(index)}
                    style={[styles.heroDot, index === activeHeroIndex && styles.heroDotActive]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Browse By Category</Text>
          </View>
        </View>

        <View style={styles.categoryGridGameflip}>
          {homeLoading ? (
            <View style={styles.apiState}>
              <Ionicons color={palette.blue} name="sync-outline" size={22} />
              <Text style={styles.apiStateText}>Loading categories...</Text>
            </View>
          ) : null}
          {homeError ? (
            <View style={styles.apiState}>
              <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
              <Text style={styles.apiStateText}>Categories unavailable</Text>
            </View>
          ) : null}
          {!homeLoading && !homeError && topCategories.length === 0 ? (
            <View style={styles.apiState}>
              <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
              <Text style={styles.apiStateText}>No categories available for this region.</Text>
            </View>
          ) : null}
          {topCategories.map((category, index) => {
            const cardSize = Math.floor((viewportWidth - 16 - (categoryColumns - 1) * categoryGutter) / categoryColumns);
            return (
            <View key={category.code} style={{ width: cardSize, height: cardSize, marginBottom: 8 }}>
              <Pressable
                onPress={() => {
                  const route = getMarketplaceRoute(category.verticalCode, home?.verticals ?? []);
                  onOpenMarketplace(route);
                }}
                style={styles.categoryCardGameflipInnerWrapper}
              >
                {category.imageUrl ? (
                  <ImageBackground
                    imageStyle={styles.categoryImageGameflip}
                    resizeMode="cover"
                    source={{ uri: category.imageUrl }}
                    style={styles.categoryImageWrapGameflip}
                  >
                    <View style={styles.categoryOverlayGameflip} />
                    <View style={styles.categoryLabelGameflip}>
                      <Text style={styles.categoryNameGameflip}>{category.name}</Text>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={[styles.categoryImageWrapGameflip, styles.categoryNoImageGameflip]}>
                    <Ionicons color={palette.brandPrimary} name="grid-outline" size={32} />
                    <View style={styles.categoryLabelGameflip}>
                      <Text style={styles.categoryNameGameflip}>{category.name}</Text>
                    </View>
                  </View>
                )}
              </Pressable>
            </View>
          );
          })}
        </View>

        {/* Discounted Subcategories Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Best deals</Text>
            <Text style={styles.sectionTitle}>Top discounted items</Text>
          </View>
          <Text style={styles.sectionNote}>Best discounts across top categories.</Text>
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
                <Text style={styles.apiStateText}>Loading deals...</Text>
              </View>
            ) : null}
            {homeError ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Deals unavailable right now.</Text>
              </View>
            ) : null}
            {!homeLoading && !homeError && (!home?.discountedSubcategories || home.discountedSubcategories.length === 0) ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No discounted items found.</Text>
              </View>
            ) : null}
            {(home?.discountedSubcategories ?? []).slice(0, 20).map((item) => (
              <Pressable
                key={`${item.subcategoryCode}-${item.listingTitle}`}
                onPress={() => {
                  const route = getMarketplaceRoute(item.verticalCode, home?.verticals ?? []);
                  onOpenMarketplace(route);
                }}
                style={[styles.publicListingCard, styles.publicListingCardShelf]}
              >
                <ImageBackground
                  imageStyle={styles.publicListingImage}
                  resizeMode="cover"
                  source={{ uri: item.listingImageUrl ?? placeholderImageUrl(item.listingTitle, 900) }}
                  style={styles.publicListingImageWrap}
                >
                  <View style={styles.publicListingScrim} />
                  <View style={styles.publicListingBadgeRow}>
                    <Text style={styles.publicListingBadge}>{Math.round(item.discountPercentage)}% off</Text>
                  </View>
                </ImageBackground>
                <View style={styles.publicListingCopy}>
                  <Text style={styles.publicListingMarketplace}>{item.categoryName}</Text>
                  <Text style={styles.publicListingTitle} numberOfLines={2}>{item.listingTitle}</Text>
                  <View style={styles.publicListingPriceRow}>
                    <Text style={styles.publicListingPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                    <Text style={styles.publicListingOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.publicListingGrid}>
            {homeLoading ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="sync-outline" size={22} />
                <Text style={styles.apiStateText}>Loading deals...</Text>
              </View>
            ) : null}
            {homeError ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Deals unavailable right now.</Text>
              </View>
            ) : null}
            {!homeLoading && !homeError && (!home?.discountedSubcategories || home.discountedSubcategories.length === 0) ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No discounted items found.</Text>
              </View>
            ) : null}
            {(home?.discountedSubcategories ?? []).slice(0, 20).map((item) => (
              <Pressable
                key={`${item.subcategoryCode}-${item.listingTitle}`}
                onPress={() => {
                  const route = getMarketplaceRoute(item.verticalCode, home?.verticals ?? []);
                  onOpenMarketplace(route);
                }}
                style={[styles.publicListingCard, isCompactMarketplaceGrid && styles.publicListingCardCompactGrid]}
              >
                <ImageBackground
                  imageStyle={styles.publicListingImage}
                  resizeMode="cover"
                  source={{ uri: item.listingImageUrl ?? placeholderImageUrl(item.listingTitle, 900) }}
                  style={styles.publicListingImageWrap}
                >
                  <View style={styles.publicListingScrim} />
                  <View style={styles.publicListingBadgeRow}>
                    <Text style={styles.publicListingBadge}>{Math.round(item.discountPercentage)}% off</Text>
                  </View>
                </ImageBackground>
                <View style={styles.publicListingCopy}>
                  <Text style={styles.publicListingMarketplace}>{item.categoryName}</Text>
                  <Text style={styles.publicListingTitle} numberOfLines={2}>{item.listingTitle}</Text>
                  <View style={styles.publicListingPriceRow}>
                    <Text style={styles.publicListingPrice}>{formatMoney(item.discountedPrice, item.currencyCode)}</Text>
                    <Text style={styles.publicListingOriginalPrice}>{formatMoney(item.originalPrice, item.currencyCode)}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Top Rated Sellers Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionKicker}>Top sellers</Text>
            <Text style={styles.sectionTitle}>Shop from trusted sellers</Text>
          </View>
          <Text style={styles.sectionNote}>Browse products from our highest-rated sellers.</Text>
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
                <Text style={styles.apiStateText}>Loading top sellers...</Text>
              </View>
            ) : null}
            {homeError ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Top sellers unavailable right now.</Text>
              </View>
            ) : null}
            {!homeLoading && !homeError && (!home?.topRatedSellers || home.topRatedSellers.length === 0) ? (
              <View style={[styles.apiState, styles.horizontalState]}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No top sellers found.</Text>
              </View>
            ) : null}
            {(home?.topRatedSellers ?? []).slice(0, 20).map((seller) => (
              <View key={seller.sellerPublicId} style={[styles.publicListingCard, styles.publicListingCardShelf]}>
                <View style={styles.sellerHeaderSection}>
                  <Text style={styles.sellerName} numberOfLines={1}>{seller.sellerName}</Text>
                  <View style={styles.sellerRatingRow}>
                    <Ionicons color="#FFC107" name="star" size={14} />
                    <Text style={styles.sellerRating}>{seller.sellerRating.toFixed(1)}</Text>
                    <Text style={styles.sellerOrdersCount}>({seller.completedOrders})</Text>
                  </View>
                </View>
                <ScrollView
                  contentContainerStyle={styles.sellerListingsContent}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sellerListingsScroll}
                >
                  {seller.listings.slice(0, 3).map((listing) => (
                    <Pressable
                      key={listing.publicId}
                      onPress={() => {
                        const route = getMarketplaceRoute(listing.verticalCode, home?.verticals ?? []);
                        onOpenMarketplace(route);
                      }}
                      style={styles.sellerListingThumb}
                    >
                      <ImageBackground
                        imageStyle={styles.sellerListingImage}
                        resizeMode="cover"
                        source={{ uri: listing.imageUrl ?? placeholderImageUrl(listing.title, 300) }}
                        style={styles.sellerListingImageWrap}
                      >
                        <View style={styles.publicListingScrim} />
                      </ImageBackground>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.sellerGrid}>
            {homeLoading ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="sync-outline" size={22} />
                <Text style={styles.apiStateText}>Loading top sellers...</Text>
              </View>
            ) : null}
            {homeError ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="alert-circle-outline" size={22} />
                <Text style={styles.apiStateText}>Top sellers unavailable right now.</Text>
              </View>
            ) : null}
            {!homeLoading && !homeError && (!home?.topRatedSellers || home.topRatedSellers.length === 0) ? (
              <View style={styles.apiState}>
                <Ionicons color={palette.blue} name="file-tray-outline" size={22} />
                <Text style={styles.apiStateText}>No top sellers found.</Text>
              </View>
            ) : null}
            {(home?.topRatedSellers ?? []).slice(0, 20).map((seller) => (
              <View key={seller.sellerPublicId} style={[styles.sellerCard, isCompactMarketplaceGrid && styles.sellerCardCompactGrid]}>
                <View style={styles.sellerHeaderSection}>
                  <Text style={styles.sellerName} numberOfLines={1}>{seller.sellerName}</Text>
                  <View style={styles.sellerRatingRow}>
                    <Ionicons color="#FFC107" name="star" size={14} />
                    <Text style={styles.sellerRating}>{seller.sellerRating.toFixed(1)}</Text>
                    <Text style={styles.sellerOrdersCount}>({seller.completedOrders})</Text>
                  </View>
                </View>
                <View style={styles.sellerListingsGrid}>
                  {seller.listings.slice(0, 3).map((listing) => (
                    <Pressable
                      key={listing.publicId}
                      onPress={() => {
                        const route = getMarketplaceRoute(listing.verticalCode, home?.verticals ?? []);
                        onOpenMarketplace(route);
                      }}
                      style={styles.sellerListingThumb}
                    >
                      <ImageBackground
                        imageStyle={styles.sellerListingImage}
                        resizeMode="cover"
                        source={{ uri: listing.imageUrl ?? placeholderImageUrl(listing.title, 300) }}
                        style={styles.sellerListingImageWrap}
                      >
                        <View style={styles.publicListingScrim} />
                      </ImageBackground>
                    </Pressable>
                  ))}
                </View>
              </View>
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
              const marketplaceRoute = getMarketplaceRoute(listing.verticalCode, home?.verticals ?? []);
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
              const marketplaceRoute = getMarketplaceRoute(listing.verticalCode, home?.verticals ?? []);
              const price = formatMoney(listing.displayPriceAmount ?? listing.priceAmount, listing.displayCurrencyCode ?? listing.currencyCode);
              const original = listing.displayOriginalPriceAmount ?? listing.originalPriceAmount;
              const discount = original && original > (listing.displayPriceAmount ?? listing.priceAmount)
                ? Math.round(((original - (listing.displayPriceAmount ?? listing.priceAmount)) / original) * 100)
                : 0;

              return (
                <Pressable
                  key={listing.publicId}
                  onPress={() => onOpenMarketplace(marketplaceRoute)}
                  style={[styles.publicListingCard, isCompactMarketplaceGrid && styles.publicListingCardCompactGrid]}
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
                [`${(home?.categories ?? []).filter((category) => category.active).length || topCategories.length}`, 'Live Categories'],
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

  return (home.topCategories ?? []).slice(0, 4).map((category) => ({
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

function submitSearch(query: string, onSearchMarketplace: (value: string) => void) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return;
  }

  appState$.marketplace.searchQuery.set(trimmedQuery);
  onSearchMarketplace(trimmedQuery);
}

function getMarketplaceRoute(verticalCode: string, verticals: MarketplaceHomeResponse['verticals']): 'digitalMarketplace' | 'jewelryMarketplace' {
  const vertical = verticals.find(v => v.moduleCode === verticalCode);
  const route = vertical?.frontendRoute;
  if (route === 'jewelryMarketplace' || route === 'digitalMarketplace') {
    return route;
  }
  // Fallback to code-based mapping if frontendRoute not available
  return verticalCode === 'JEWELLERY' ? 'jewelryMarketplace' : 'digitalMarketplace';
}

function imageForVertical(
  vertical: MarketplaceHomeResponse['verticals'][number],
  home: MarketplaceHomeResponse
): string | null {
  if (vertical.imageUrl) {
    return resolveMockImageUrl(vertical.imageUrl, 1200);
  }

  const directKeyImage = splitAssetSources(vertical.imageKeys)
    .map((imageSource) => resolveMockImageUrl(imageSource, 1200))
    .find(Boolean);

  if (directKeyImage) {
    return directKeyImage;
  }

  const categoryImage = home.categories.find(
    (category) =>
      category.verticalCode === vertical.moduleCode &&
      category.active &&
      Boolean(category.imageUrl)
  )?.imageUrl;

  if (categoryImage) {
    return resolveMockImageUrl(categoryImage, 1200);
  }

  const listingImage = home.featuredListings.find(
    (listing) =>
      listing.verticalCode === vertical.moduleCode &&
      Boolean(listing.imageUrl)
  )?.imageUrl;

  return listingImage ? resolveMockImageUrl(listingImage, 1200) : null;
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
    backgroundColor: '#fafafa',
    flex: 1
  },
  page: {
    backgroundColor: '#fafafa',
    paddingBottom: 0
  },
  header: {
    alignItems: 'center',
    backgroundColor: palette.header,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
    minHeight: 74,
    paddingHorizontal: 32
  },
  headerInnerMobile: {
    alignItems: 'flex-start',
    flexWrap: 'wrap'
  },
  headerMobile: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 0,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0
  },
  headerPhone: {
    gap: spacing.xs,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0
  },
  mobileSearchSection: {
    paddingHorizontal: 16,
    paddingTop: 14
  },
  mobileSearchSectionTiny: {
    paddingHorizontal: 12,
    paddingTop: 12
  },
  mobileHeroSection: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    backgroundColor: '#EEF6FF',
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 24,
    borderWidth: 1,
    margin: 0,
    marginHorizontal: 16,
    overflow: 'visible',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    width: '100%'
  },
  mobileHeroSectionTiny: {
    gap: 14,
    marginHorizontal: 12,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14
  },
  mobileHeroCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 0,
    margin: 0,
    overflow: 'visible',
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%'
  },
  mobileHeroCardTiny: {
    paddingHorizontal: 18,
    paddingVertical: 20
  },
  mobileHeroCarousel: {
    alignSelf: 'stretch',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(148,163,184,0.18)',
    borderRadius: 24,
    borderWidth: 1,
    flex: 0,
    margin: 0,
    marginTop: 2,
    overflow: 'hidden',
    padding: 10,
    width: '100%'
  },
  mobileHeroCarouselTiny: {
    aspectRatio: 16 / 9,
    borderRadius: 22,
    padding: 8
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    width: '100%'
  },
  headerTopRowPhone: {
    gap: spacing.sm
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 130
  },
  brandWrapMobile: {
    minWidth: 0,
    flexShrink: 1,
    width: 'auto'
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
    alignSelf: 'stretch',
    flexBasis: '100%',
    height: 56,
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 18,
    maxWidth: '100%',
    borderRadius: 24,
    paddingHorizontal: 16,
    width: '100%'
  },
  searchBarPhone: {
    flexBasis: '100%',
    height: 56,
    maxWidth: '100%',
    minWidth: 0,
    marginTop: 0,
    marginBottom: 18,
    paddingHorizontal: 16,
    width: '100%'
  },
  searchBarTiny: {
    height: 52,
    marginBottom: 14,
    paddingHorizontal: 14
  },
  searchInput: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    margin: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    outlineStyle: 'none' as never
  },
  searchInputWeb: {
    fontSize: 16,
    lineHeight: 20,
    minHeight: 48
  },
  searchInputCompact: {
    minHeight: 48
  },
  compactSearchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    width: '100%'
  },
  searchBarCompact: {
    alignItems: 'center',
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 54,
    minHeight: 48,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    width: '100%'
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 'auto'
  },
  headerActionsMobile: {
    justifyContent: 'space-between',
    gap: 10,
    marginLeft: 0,
    width: 'auto'
  },
  headerActionsPhone: {
    flexShrink: 0,
    justifyContent: 'space-between',
    gap: 6,
    marginLeft: 0,
    width: 'auto'
  },
  headerButtonCompact: {
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: 'center',
    width: 'auto'
  },
  headerButtonPhone: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 34,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  headerButtonTextPhone: {
    fontSize: 13,
    lineHeight: 15
  },
  signInButton: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderColor: 'rgba(59,130,246,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  signInText: {
    color: palette.blue,
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
    borderRadius: '2%',
    flexDirection: 'row',
    gap: '2%',
    justifyContent: 'space-between',
    marginHorizontal: '1.5%',
    marginVertical: '1.5%',
    minHeight: 280,
    overflow: 'hidden',
    paddingHorizontal: '2%',
    paddingVertical: '2%',
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
    gap: 16,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    minHeight: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    overflow: 'visible',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20
  },
  heroPhone: {
    alignItems: 'stretch',
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 0
  },
  heroCompactPhone: {
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  heroCopy: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 0.32,
    maxWidth: '100%',
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    zIndex: 2
  },
  heroCopyTablet: {
    alignSelf: 'center',
    maxWidth: 780,
    width: '100%'
  },
  heroCopyMobile: {
    alignSelf: 'stretch',
    flex: 0,
    minWidth: 0,
    maxWidth: '100%',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%'
  },
  heroCopyPhone: {
    paddingVertical: 24
  },
  heroCopyTiny: {
    paddingHorizontal: 18,
    paddingVertical: 20
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.cardAlt,
    borderColor: palette.blue,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  heroBadgeText: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  heroTitle: {
    color: '#0F172A',
    fontSize: 50,
    fontWeight: '900',
    letterSpacing: -1.8,
    lineHeight: 55,
    marginTop: 18,
    maxWidth: 520
  },
  heroTitleMobile: {
    fontSize: 30,
    lineHeight: 35,
    maxWidth: '100%'
  },
  heroDescription: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 16
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 22
  },
  heroActionsMobile: {
    width: '100%'
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
    minWidth: 0,
    paddingHorizontal: spacing.md
  },
  heroActionTiny: {
    minHeight: 44,
    paddingHorizontal: 12
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
  heroSection: {
    backgroundColor: palette.heroEnd,
    borderRadius: 30,
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
    marginHorizontal: 24,
    marginTop: 0,
    overflow: 'hidden',
    padding: 24,
    width: 'auto'
  },
  heroSectionCompact: {
    flexDirection: 'column',
    gap: 16,
    marginHorizontal: 12,
    padding: 12
  },
  heroContentCard: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(255,255,255,0.94)',
    borderRadius: 24,
    borderWidth: 1,
    flexBasis: '34%',
    flexGrow: 0,
    flexShrink: 1,
    justifyContent: 'center',
    minHeight: 0,
    minWidth: 0,
    padding: 28
  },
  heroContentCardCompact: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 0,
    padding: 20,
    width: '100%'
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14
  },
  heroCarouselWrapper: {
    backgroundColor: palette.cardAlt,
    borderRadius: 24,
    alignSelf: 'flex-start',
    flexBasis: '66%',
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    width: '100%'
  },
  heroCarouselWrapperCompact: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
    width: '100%'
  },
  heroCarouselMedia: {
    aspectRatio: 16 / 9,
    backgroundColor: palette.cardAlt,
    width: '100%'
  },
  heroCarouselImage: {
    borderRadius: 24
  },
  heroCarouselImageFallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  heroCarouselState: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: palette.cardAlt,
    justifyContent: 'center',
    width: '100%'
  },
  heroCarouselStateText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10
  },
  heroDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 10,
    paddingTop: 8
  },
  heroDot: {
    backgroundColor: '#CBD5E1',
    borderRadius: 999,
    height: 8,
    width: 8
  },
  heroDotActive: {
    backgroundColor: palette.blue,
    width: 24
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
    borderRadius: '2%',
    borderWidth: 1,
    flex: 0.68,
    maxHeight: '100%',
    maxWidth: '100%',
    minHeight: 'auto',
    minWidth: 'auto',
    overflow: 'hidden',
    zIndex: 2
  },
  heroImagePaneDesktop: {
    marginLeft: 0
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
    height: 320,
    maxWidth: '100%',
    marginTop: 16,
    minHeight: 240,
    minWidth: 0,
    width: '100%'
  },
  heroImagePanePhone: {
    borderRadius: 24,
    flex: 0,
    height: 300,
    maxHeight: '100%',
    maxWidth: '100%',
    marginTop: 16,
    minHeight: 220,
    minWidth: 0,
    width: '100%'
  },
  mobileHeroImagePane: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 24,
    flex: 0,
    marginTop: 0,
    overflow: 'hidden',
    padding: 0,
    width: '100%'
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
    marginTop: 10,
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
    gap: 8,
    marginTop: 8
  },
  heroChip: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  heroChipText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800'
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
  heroCarouselDotsMobile: {
    alignSelf: 'center',
    marginTop: 12,
    position: 'relative'
  },
  heroCarouselDotsTiny: {
    marginTop: 10
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
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 4,
    borderBottomWidth: 0
  },
  sectionKicker: {
    color: palette.brandPrimary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  },
  sectionHeaderMobile: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    flexDirection: 'column'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 2
  },
  sectionNote: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18
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
    gap: 24,
    padding: 32,
    justifyContent: 'space-between'
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
    gap: 24,
    paddingHorizontal: 32,
    paddingBottom: 16,
    justifyContent: 'space-between'
  },
  categoryCard: {
    borderRadius: 24,
    flexBasis: '32%',
    flexGrow: 0,
    maxWidth: 'calc(33.333% - 16px)',
    minWidth: 'calc(33.333% - 16px)',
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
    maxWidth: 380,
    minWidth: 380,
    width: 380
  },
  categoryImageWrap: {
    aspectRatio: 1,
    borderColor: palette.border,
    borderWidth: 1,
    height: 'auto',
    minHeight: 380,
    justifyContent: 'flex-end'
  },
  categoryImage: {
    borderRadius: 24
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
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 40
  },
  categoryCount: {
    color: '#eef8ff',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  categoryName: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.xs,
    letterSpacing: 0.5
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
    borderRadius: 24,
    borderWidth: 1,
    flexBasis: '23%',
    flexGrow: 0,
    maxWidth: 'calc(25% - 18px)',
    minWidth: 'calc(25% - 18px)',
    overflow: 'hidden'
  },
  publicListingCardCompact: {
    flexBasis: '100%',
    minWidth: '100%'
  },
  publicListingCardCompactGrid: {
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
    minWidth: 0
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
  },
  publicListingOriginalPrice: {
    color: palette.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through'
  },
  sellerCard: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 200,
    padding: spacing.md
  },
  sellerCardCompactGrid: {
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
    minWidth: 0
  },
  sellerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start'
  },
  sellerHeaderSection: {
    marginBottom: spacing.md
  },
  sellerName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4
  },
  sellerRatingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  sellerRating: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: '700'
  },
  sellerOrdersCount: {
    color: palette.textMuted,
    fontSize: 11
  },
  sellerListingsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between'
  },
  sellerListingsScroll: {
    width: '100%'
  },
  sellerListingsContent: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  sellerListingThumb: {
    aspectRatio: 1,
    borderRadius: 8,
    minWidth: 80,
    overflow: 'hidden',
    width: 80
  },
  sellerListingImageWrap: {
    flex: 1,
    width: '100%'
  },
  sellerListingImage: {
    borderRadius: 8
  },
  // Gameflip-style category cards - 4 column responsive grid
  categoryGridGameflip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'flex-start',
    gap: 6
  },
  categoryCardGameflipInnerWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    height: '100%'
  },
  categoryImageWrapGameflip: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    position: 'relative',
    backgroundColor: '#f8f8f8'
  },
  categoryImageGameflip: {
    borderRadius: 16
  },
  categoryNoImageGameflip: {
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  categoryOverlayGameflip: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  categoryLabelGameflip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  categoryNameGameflip: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: '95%'
  },
  sectionTitleSmall: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4
  }
});

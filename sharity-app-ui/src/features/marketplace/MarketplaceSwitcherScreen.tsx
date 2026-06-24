import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mobileTabItems } from '../home/dashboardConfig';
import { getMarketplaceHome, getMarketplaceListings } from '../../services/marketplaceApi';
import { colors, radii, spacing } from '../../theme';
import type { AppRoute } from '../../types/navigation';
import type { MarketplaceCategory, MarketplaceHomeResponse, MarketplaceListing, MarketplaceVertical } from '../../types/marketplace';

type MarketplaceSwitcherScreenProps = {
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (productId: string) => void;
};

type LoadState = {
  error: boolean;
  home: MarketplaceHomeResponse | null;
  listings: MarketplaceListing[];
  loading: boolean;
};

type SortOption = 'discount' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
type AvailabilityFilter = 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK';
type DeliveryFilter = 'ALL' | 'INSTANT' | 'MANUAL' | 'SHIPPING_REQUIRED';
type VerticalItem = {
  active: boolean;
  code: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
};

const defaultState: LoadState = {
  error: false,
  home: null,
  listings: [],
  loading: true
};

export function MarketplaceSwitcherScreen({ onNavigate, onOpenDigitalProduct }: MarketplaceSwitcherScreenProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const isWide = width >= 1500;
  const productCardWidth = isMobile ? '48%' : isTablet ? '31%' : isWide ? '18.5%' : '23%';
  const comingSoonWidth = isMobile ? '100%' : isTablet ? '48%' : '32%';

  const [state, setState] = useState<LoadState>(defaultState);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedVerticalCode, setSelectedVerticalCode] = useState('ALL');
  const [selectedCategoryCode, setSelectedCategoryCode] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('discount');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadMarketplace = useCallback(async () => {
    setState((current) => ({ ...current, error: false, loading: true }));

    const [homeResult, listingsResult] = await Promise.allSettled([getMarketplaceHome(), getMarketplaceListings()]);

    setState({
      error: homeResult.status === 'rejected' || listingsResult.status === 'rejected',
      home: homeResult.status === 'fulfilled' ? homeResult.value : null,
      listings: listingsResult.status === 'fulfilled' ? listingsResult.value : [],
      loading: false
    });
  }, []);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  useEffect(() => {
    setSelectedCategoryCode('ALL');
  }, [selectedVerticalCode]);

  const verticalItems = useMemo(() => buildVerticalItems(state.home), [state.home]);
  const selectedVertical = useMemo(
    () => verticalItems.find((item) => item.code === selectedVerticalCode) ?? null,
    [selectedVerticalCode, verticalItems]
  );
  const comingSoonVerticals = useMemo(() => verticalItems.filter((item) => !item.active && item.code !== 'ALL'), [verticalItems]);
  const verticalListings = useMemo(
    () => state.listings.filter((listing) => matchesVertical(listing.verticalCode, selectedVerticalCode)),
    [selectedVerticalCode, state.listings]
  );
  const visibleCategories = useMemo(
    () => buildVisibleCategories(state.home?.categories ?? [], state.listings, selectedVerticalCode, searchQuery),
    [searchQuery, selectedVerticalCode, state.home?.categories, state.listings]
  );

  const filteredListings = useMemo(() => {
    const minPriceValue = minPrice ? Number(minPrice) : null;
    const maxPriceValue = maxPrice ? Number(maxPrice) : null;
    const minRatingValue = minRating ? Number(minRating) : null;
    const minDiscountValue = minDiscount ? Number(minDiscount) : null;

    let results = verticalListings;

    if (selectedCategoryCode !== 'ALL') {
      results = results.filter((listing) => listing.categoryCode === selectedCategoryCode);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      results = results.filter((listing) =>
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.sellerDisplayName.toLowerCase().includes(query) ||
        listing.categoryCode.toLowerCase().includes(query)
      );
    }

    if (minPriceValue !== null) {
      results = results.filter((listing) => listing.priceAmount >= minPriceValue);
    }

    if (maxPriceValue !== null) {
      results = results.filter((listing) => listing.priceAmount <= maxPriceValue);
    }

    if (minRatingValue !== null) {
      results = results.filter((listing) => getAverageRating(listing) >= minRatingValue);
    }

    if (minDiscountValue !== null) {
      results = results.filter((listing) => getDiscountPercentage(listing) >= minDiscountValue);
    }

    if (deliveryFilter !== 'ALL') {
      results = results.filter((listing) => listing.deliveryType === deliveryFilter);
    }

    if (availabilityFilter !== 'ALL') {
      results = results.filter((listing) =>
        availabilityFilter === 'IN_STOCK' ? isAvailable(listing) : !isAvailable(listing)
      );
    }

    return sortListings(results, sortBy);
  }, [availabilityFilter, deliveryFilter, maxPrice, minDiscount, minRating, selectedCategoryCode, searchQuery, sortBy, verticalListings]);

  const activeListings = useMemo(() => filteredListings.filter((listing) => isAvailable(listing)), [filteredListings]);
  const selectedVerticalLabel = selectedVertical?.label ?? 'All';
  const noListingsForVertical = !state.loading && verticalListings.filter((listing) => isAvailable(listing)).length === 0;
  const noResultsAfterFilters = !state.loading && !noListingsForVertical && activeListings.length === 0;

  if (state.loading && state.home === null && state.listings.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <MarketplaceLoadingState />
      </SafeAreaView>
    );
  }

  if (state.error && state.home === null && state.listings.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <MarketplaceErrorState onRetry={loadMarketplace} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
            <View style={styles.brandWrap}>
              <View style={styles.brandMark}>
                <Text style={styles.brandLetter}>S</Text>
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandTitle}>Marketplace</Text>
                <Text style={styles.brandSubtitle}>Shop across Sharity verticals</Text>
              </View>
            </View>

            <View style={[styles.headerActions, isMobile && styles.headerActionsMobile]}>
              <View style={[styles.searchWrap, isMobile && styles.searchWrapMobile]}>
                <Ionicons color={colors.textMuted} name="search-outline" size={18} />
                <TextInput
                  placeholder="Search products, sellers, categories"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <Pressable
                onPress={() => (isMobile ? setFiltersOpen((current) => !current) : setSortBy(nextSort(sortBy)))}
                style={styles.headerIconButton}
              >
                <Ionicons color={colors.textPrimary} name={isMobile ? 'options-outline' : 'swap-vertical-outline'} size={18} />
                <Text style={styles.headerIconLabel}>{isMobile ? 'Filters' : sortLabel(sortBy)}</Text>
              </Pressable>
              <Pressable accessibilityLabel="Cart" onPress={() => onNavigate('cart')} style={styles.headerIconButton}>
                <Ionicons color={colors.textPrimary} name="cart-outline" size={18} />
              </Pressable>
              <Pressable accessibilityLabel="Account" onPress={() => onNavigate('profilePrivacy')} style={styles.headerIconButton}>
                <Ionicons color={colors.textPrimary} name="person-outline" size={18} />
              </Pressable>
            </View>
          </View>
        </View>

        {notice ? (
          <View style={styles.noticeCard}>
            <Ionicons color={colors.info} name="information-circle-outline" size={18} />
            <Text style={styles.noticeText}>{notice}</Text>
            <Pressable onPress={() => setNotice(null)}>
              <Ionicons color={colors.textSecondary} name="close" size={18} />
            </Pressable>
          </View>
        ) : null}

        <SectionHeader
          eyebrow="Verticals"
          title="Browse by Marketplace"
          subtitle="Move between digital, jewellery, grocery, automotive, rentals, and more."
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
          <Pressable
            onPress={() => setSelectedVerticalCode('ALL')}
            style={[styles.verticalChip, selectedVerticalCode === 'ALL' && styles.verticalChipActive]}
          >
            <Text style={[styles.verticalChipLabel, selectedVerticalCode === 'ALL' && styles.verticalChipLabelActive]}>All</Text>
          </Pressable>
          {verticalItems.filter((item) => item.code !== 'ALL').map((item) => {
            const active = selectedVerticalCode === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => setSelectedVerticalCode(item.code)}
                style={[styles.verticalChip, active && styles.verticalChipActive]}
              >
                <Ionicons color={active ? colors.white : colors.info} name={item.icon} size={16} />
                <View style={styles.verticalChipCopy}>
                  <Text style={[styles.verticalChipLabel, active && styles.verticalChipLabelActive]}>{item.label}</Text>
                  <Text style={[styles.verticalChipSub, active && styles.verticalChipSubActive]}>
                    {item.active ? 'Open' : 'Coming soon'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <SectionHeader
          eyebrow="Categories"
          title={selectedVerticalCode === 'ALL' ? 'Top Categories' : `${selectedVerticalLabel} Categories`}
          subtitle="Compact image-first cards, filtered by the selected vertical."
          action={(
            <Pressable
              onPress={() => {
                setSelectedVerticalCode('ALL');
                setSelectedCategoryCode('ALL');
              }}
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreText}>Show more</Text>
              <Ionicons color={colors.info} name="arrow-forward" size={16} />
            </Pressable>
          )}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
          {visibleCategories.map((category) => {
            const selected = selectedCategoryCode === category.code;
            return (
              <Pressable
                key={category.code}
                onPress={() => setSelectedCategoryCode((current) => (current === category.code ? 'ALL' : category.code))}
                style={[styles.categoryCard, selected && styles.categoryCardActive]}
              >
                <View style={styles.categoryImageWrap}>
                  {category.imageUrl ? (
                    <Image contentFit="cover" source={category.imageUrl} style={styles.categoryImage} transition={180} />
                  ) : (
                    <View style={styles.categoryFallback}>
                      <Ionicons color={colors.info} name={category.icon} size={28} />
                    </View>
                  )}
                </View>
                <View style={styles.categoryCopyCard}>
                  <Text numberOfLines={2} style={styles.categoryTitle}>{category.name}</Text>
                  <Text numberOfLines={1} style={styles.categorySubtitle}>{category.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.mainArea}>
          {!isMobile ? (
            <View style={styles.filtersSidebar}>
              <MarketplaceFilters
                deliveryFilter={deliveryFilter}
                availabilityFilter={availabilityFilter}
                maxPrice={maxPrice}
                minDiscount={minDiscount}
                minPrice={minPrice}
                minRating={minRating}
                onAvailabilityChange={setAvailabilityFilter}
                onDeliveryChange={setDeliveryFilter}
                onMaxPriceChange={setMaxPrice}
                onMinDiscountChange={setMinDiscount}
                onMinPriceChange={setMinPrice}
                onMinRatingChange={setMinRating}
                onReset={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setMinRating('');
                  setMinDiscount('');
                  setDeliveryFilter('ALL');
                  setAvailabilityFilter('ALL');
                  setSortBy('discount');
                }}
                onSortChange={setSortBy}
                sortBy={sortBy}
              />
            </View>
          ) : null}

          <View style={styles.resultsArea}>
            <View style={styles.resultsTopBar}>
              <View style={styles.resultsCopy}>
                <Text style={styles.resultsTitle}>Listings</Text>
                <Text style={styles.resultsSubtitle}>
                  {activeListings.length > 0
                    ? `${activeListings.length} items available in ${selectedVerticalLabel === 'All' ? 'all verticals' : selectedVerticalLabel}`
                    : 'Filtering by selected vertical and category.'}
                </Text>
              </View>
              {isMobile ? (
                <View style={styles.mobileSortRow}>
                  <Pressable onPress={() => setSortBy(nextSort(sortBy))} style={styles.compactChip}>
                    <Ionicons color={colors.info} name="swap-vertical-outline" size={16} />
                    <Text style={styles.compactChipText}>{sortLabel(sortBy)}</Text>
                  </Pressable>
                  <Pressable onPress={() => setFiltersOpen((current) => !current)} style={styles.compactChip}>
                    <Ionicons color={colors.info} name="options-outline" size={16} />
                    <Text style={styles.compactChipText}>{filtersOpen ? 'Hide' : 'Filters'}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            {isMobile && filtersOpen ? (
              <View style={styles.mobileFilterPanel}>
                <MarketplaceFilters
                  deliveryFilter={deliveryFilter}
                  availabilityFilter={availabilityFilter}
                  maxPrice={maxPrice}
                  minDiscount={minDiscount}
                  minPrice={minPrice}
                  minRating={minRating}
                  onAvailabilityChange={setAvailabilityFilter}
                  onDeliveryChange={setDeliveryFilter}
                  onMaxPriceChange={setMaxPrice}
                  onMinDiscountChange={setMinDiscount}
                  onMinPriceChange={setMinPrice}
                  onMinRatingChange={setMinRating}
                  onReset={() => {
                    setMinPrice('');
                    setMaxPrice('');
                    setMinRating('');
                    setMinDiscount('');
                    setDeliveryFilter('ALL');
                    setAvailabilityFilter('ALL');
                    setSortBy('discount');
                  }}
                  onSortChange={setSortBy}
                  sortBy={sortBy}
                  compact
                />
              </View>
            ) : null}

            {noListingsForVertical ? (
              <EmptyMarketplaceState
                onExploreAll={() => {
                  setSelectedVerticalCode('ALL');
                  setSelectedCategoryCode('ALL');
                  setNotice('Showing all marketplaces again.');
                }}
                onNotify={() => setNotice('We will notify you when listings are available for this marketplace.')}
              />
            ) : noResultsAfterFilters ? (
              <NoResultsState
                onClearFilters={() => {
                  setSelectedCategoryCode('ALL');
                  setMinPrice('');
                  setMaxPrice('');
                  setMinRating('');
                  setMinDiscount('');
                  setDeliveryFilter('ALL');
                  setAvailabilityFilter('ALL');
                  setSortBy('discount');
                }}
                onExploreAll={() => {
                  setSelectedVerticalCode('ALL');
                  setSelectedCategoryCode('ALL');
                }}
              />
            ) : state.loading ? (
              <MarketplaceGridSkeleton widthStyle={{ width: productCardWidth }} />
            ) : (
              <View style={styles.productGrid}>
                {filteredListings.map((listing) => (
                  <MarketplaceProductCard
                    key={listing.publicId}
                    listing={listing}
                    widthStyle={{ width: productCardWidth }}
                    onPress={() => {
                      if (isDigitalListing(listing)) {
                        onOpenDigitalProduct(listing.publicId);
                        return;
                      }
                      if (isElectronicsListing(listing)) {
                        onNavigate('electronics');
                        return;
                      }
                      onOpenDigitalProduct(listing.publicId);
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <SectionHeader
          eyebrow="Availability"
          title="Coming Soon"
          subtitle="Upcoming marketplaces stay visible, but they no longer block the listings above."
        />
        {comingSoonVerticals.length > 0 ? (
          <View style={styles.comingSoonGrid}>
            {comingSoonVerticals.map((item) => (
              <View key={item.code} style={[styles.comingSoonCard, { flexBasis: comingSoonWidth }]}>
                <View style={styles.comingSoonTop}>
                  <View style={styles.comingSoonIcon}>
                    <Ionicons color={colors.primary} name={item.icon} size={20} />
                  </View>
                  <Text style={styles.comingSoonBadge}>Coming soon</Text>
                </View>
                <Text style={styles.comingSoonTitle}>{item.label}</Text>
                <Text style={styles.comingSoonText}>{item.description}</Text>
                <View style={styles.comingSoonActions}>
                  <Pressable onPress={() => setNotice(`${item.label} is coming soon.`)} style={styles.primaryAction}>
                    <Text style={styles.primaryActionText}>Notify Me</Text>
                  </Pressable>
                  <Pressable onPress={() => setSelectedVerticalCode('ALL')} style={styles.secondaryAction}>
                    <Text style={styles.secondaryActionText}>Explore All Marketplace</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.comingSoonEmpty}>
            <Text style={styles.comingSoonText}>All configured verticals currently have customer access enabled.</Text>
          </View>
        )}
      </ScrollView>

      {!isMobile ? null : (
        <View style={styles.bottomTabs}>
          {mobileTabItems.map((item) => (
            <Pressable key={item.label} onPress={() => onNavigate(routeForLabel(item.label))} style={styles.bottomTab}>
              <Ionicons color={item.label === 'Marketplace' ? colors.primary : colors.textSecondary} name={item.icon} size={18} />
              <Text style={[styles.bottomTabText, item.label === 'Marketplace' && styles.bottomTabTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function MarketplaceFilters({
  availabilityFilter,
  compact = false,
  deliveryFilter,
  maxPrice,
  minDiscount,
  minPrice,
  minRating,
  onAvailabilityChange,
  onDeliveryChange,
  onMaxPriceChange,
  onMinDiscountChange,
  onMinPriceChange,
  onMinRatingChange,
  onReset,
  onSortChange,
  sortBy
}: {
  availabilityFilter: AvailabilityFilter;
  compact?: boolean;
  deliveryFilter: DeliveryFilter;
  maxPrice: string;
  minDiscount: string;
  minPrice: string;
  minRating: string;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onDeliveryChange: (value: DeliveryFilter) => void;
  onMaxPriceChange: (value: string) => void;
  onMinDiscountChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMinRatingChange: (value: string) => void;
  onReset: () => void;
  onSortChange: (value: SortOption) => void;
  sortBy: SortOption;
}) {
  return (
    <View style={[styles.filtersCard, compact && styles.filtersCardCompact]}>
      <Text style={styles.filtersTitle}>Filters</Text>
      <Text style={styles.filtersHint}>Tune the listings without leaving the page.</Text>

      <Text style={styles.filterLabel}>Price range</Text>
      <View style={styles.filterRow}>
        <TextInput value={minPrice} onChangeText={onMinPriceChange} placeholder="Min" placeholderTextColor={colors.textMuted} style={styles.filterInput} keyboardType="numeric" />
        <TextInput value={maxPrice} onChangeText={onMaxPriceChange} placeholder="Max" placeholderTextColor={colors.textMuted} style={styles.filterInput} keyboardType="numeric" />
      </View>

      <Text style={styles.filterLabel}>Sort</Text>
      <View style={styles.pillWrap}>
        {(['discount', 'price-asc', 'price-desc', 'rating', 'newest'] as SortOption[]).map((option) => {
          const active = sortBy === option;
          return (
            <Pressable key={option} onPress={() => onSortChange(option)} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{sortLabel(option)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>Minimum discount</Text>
      <View style={styles.pillWrap}>
        {['', '10', '25', '50'].map((value) => {
          const label = value ? `${value}%+` : 'Any';
          const active = minDiscount === value;
          return (
            <Pressable key={label} onPress={() => onMinDiscountChange(value)} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>Seller rating</Text>
      <View style={styles.pillWrap}>
        {['', '4', '4.5'].map((value) => {
          const label = value ? `${value}+` : 'Any';
          const active = minRating === value;
          return (
            <Pressable key={label} onPress={() => onMinRatingChange(value)} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>Delivery</Text>
      <View style={styles.pillWrap}>
        {(['ALL', 'INSTANT', 'MANUAL', 'SHIPPING_REQUIRED'] as DeliveryFilter[]).map((value) => {
          const label = value === 'ALL' ? 'Any' : value.replaceAll('_', ' ');
          const active = deliveryFilter === value;
          return (
            <Pressable key={value} onPress={() => onDeliveryChange(value)} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.filterLabel}>Availability</Text>
      <View style={styles.pillWrap}>
        {(['ALL', 'IN_STOCK', 'OUT_OF_STOCK'] as AvailabilityFilter[]).map((value) => {
          const label = value === 'ALL' ? 'Any' : value.replaceAll('_', ' ');
          const active = availabilityFilter === value;
          return (
            <Pressable key={value} onPress={() => onAvailabilityChange(value)} style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.filterActions}>
        <Pressable onPress={onReset} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MarketplaceProductCard({
  listing,
  onPress,
  widthStyle
}: {
  listing: MarketplaceListing;
  onPress: () => void;
  widthStyle: { width: string };
}) {
  const discount = getDiscountPercentage(listing);
  const rating = getAverageRating(listing);
  const isDigital = isDigitalListing(listing);
  const trustLabel = listing.verifiedSeller ? 'Verified Seller' : listing.deliveryType === 'INSTANT' ? 'Instant Delivery' : 'Protected Checkout';

  return (
    <Pressable onPress={onPress} style={[styles.productCard, widthStyle]}>
      <View style={styles.productImageWrap}>
        {listing.imageUrl ? (
          <Image contentFit="cover" source={listing.imageUrl} style={styles.productImage} transition={150} />
        ) : (
          <View style={styles.productFallback}>
            <Ionicons color={colors.info} name="image-outline" size={30} />
            <Text style={styles.productFallbackText}>Image loading soon</Text>
          </View>
        )}
        {discount > 0 ? <View style={[styles.discountBadge, discountToneStyle(discount)]}><Text style={styles.discountBadgeText}>{discount}% OFF</Text></View> : null}
        <View style={styles.imageShade} />
      </View>
      <View style={styles.productContent}>
        <Text style={styles.categoryPill}>{categoryLabel(listing.categoryCode)}</Text>
        <Text numberOfLines={2} style={styles.productTitle}>{listing.title}</Text>
        <Text numberOfLines={1} style={styles.productSeller}>{listing.sellerDisplayName}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>{formatMoney(listing.priceAmount, listing.currencyCode)}</Text>
          {listing.originalPriceAmount && listing.originalPriceAmount > listing.priceAmount ? (
            <Text style={styles.originalPrice}>{formatMoney(listing.originalPriceAmount, listing.currencyCode)}</Text>
          ) : null}
        </View>

        {discount > 0 ? <Text style={styles.savingsText}>Save {formatMoney(Math.max((listing.originalPriceAmount ?? listing.priceAmount) - listing.priceAmount, 0), listing.currencyCode)}</Text> : null}

        {rating > 0 ? (
          <View style={styles.metaRow}>
            <Ionicons color={colors.warningDark} name="star" size={14} />
            <Text style={styles.metaText}>{rating.toFixed(1)} rating</Text>
          </View>
        ) : null}

        <View style={styles.trustRow}>
          <Ionicons color={colors.success} name="shield-checkmark-outline" size={14} />
          <Text style={styles.trustText}>{trustLabel}</Text>
        </View>

        <View style={styles.cardCta}>
          <Text style={styles.cardCtaText}>{isDigital ? 'Buy Now' : 'View Deal'}</Text>
          <Ionicons color={colors.white} name="arrow-forward" size={16} />
        </View>
      </View>
    </Pressable>
  );
}

function MarketplaceLoadingState() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const isWide = width >= 1500;
  const cardWidth = isMobile ? '48%' : isTablet ? '31%' : isWide ? '18.5%' : '23%';

  return (
    <View style={styles.loadingPage}>
      <View style={styles.loadingHero} />
      <View style={styles.loadingRail}>
        {Array.from({ length: 6 }).map((_, index) => <View key={index} style={styles.loadingChip} />)}
      </View>
      <View style={styles.loadingGrid}>
        {Array.from({ length: 8 }).map((_, index) => <View key={index} style={[styles.loadingCard, { width: cardWidth }]} />)}
      </View>
    </View>
  );
}

function MarketplaceErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.errorPage}>
      <View style={styles.errorCard}>
        <Ionicons color={colors.info} name="cloud-offline-outline" size={28} />
        <Text style={styles.errorTitle}>We could not load the marketplace right now.</Text>
        <Text style={styles.errorText}>Please try again in a moment.</Text>
        <Pressable onPress={onRetry} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyMarketplaceState({ onExploreAll, onNotify }: { onExploreAll: () => void; onNotify: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons color={colors.info} name="cube-outline" size={30} />
      <Text style={styles.emptyTitle}>Listings are coming soon for this marketplace.</Text>
      <Text style={styles.emptyText}>Try another vertical or keep browsing all marketplaces.</Text>
      <View style={styles.emptyActions}>
        <Pressable onPress={onExploreAll} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>Explore All Marketplace</Text>
        </Pressable>
        <Pressable onPress={onNotify} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Notify Me</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NoResultsState({ onClearFilters, onExploreAll }: { onClearFilters: () => void; onExploreAll: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons color={colors.info} name="search-outline" size={30} />
      <Text style={styles.emptyTitle}>No listings match your current filters.</Text>
      <Text style={styles.emptyText}>Try a different price range, rating, delivery type, or category.</Text>
      <View style={styles.emptyActions}>
        <Pressable onPress={onClearFilters} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>Clear Filters</Text>
        </Pressable>
        <Pressable onPress={onExploreAll} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Explore All Marketplace</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MarketplaceGridSkeleton({ widthStyle }: { widthStyle: { width: string } }) {
  return (
    <View style={styles.productGrid}>
      {Array.from({ length: 8 }).map((_, index) => <View key={index} style={[styles.skeletonProductCard, widthStyle]} />)}
    </View>
  );
}

function SectionHeader({ action, eyebrow, subtitle, title }: { action?: React.ReactNode; eyebrow: string; subtitle: string; title: string }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, isMobile && styles.sectionSubtitleMobile]}>{subtitle}</Text>
      </View>
      {action ? <View style={[styles.sectionActionWrap, isMobile && styles.sectionActionWrapMobile]}>{action}</View> : null}
    </View>
  );
}

function BottomTabs({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  return (
    <View style={styles.bottomTabs}>
      {mobileTabItems.map((item) => (
        <Pressable key={item.label} onPress={() => onNavigate(routeForLabel(item.label))} style={styles.bottomTab}>
          <Ionicons color={item.label === 'Marketplace' ? colors.primary : colors.textSecondary} name={item.icon} size={18} />
          <Text style={[styles.bottomTabText, item.label === 'Marketplace' && styles.bottomTabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function buildVerticalItems(home: MarketplaceHomeResponse | null): VerticalItem[] {
  const fromApi = (home?.verticals ?? [])
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((vertical) => ({
      active: vertical.status === 'ACTIVE' && vertical.availableToCustomer && vertical.customerAccessEnabled,
      code: canonicalVerticalCode(vertical.moduleCode),
      description: vertical.description,
      icon: verticalIconFor(vertical),
      label: vertical.moduleName
    }));

  const deduped = new Map<string, VerticalItem>();
  for (const item of fromApi) {
    if (!deduped.has(item.code)) {
      deduped.set(item.code, item);
    }
  }

  const ordered: VerticalItem[] = [
    { active: true, code: 'ALL', description: 'Browse every active marketplace.', icon: 'apps-outline', label: 'All' },
    ...Array.from(deduped.values())
  ];

  return ordered;
}

function buildVisibleCategories(
  categories: MarketplaceCategory[],
  listings: MarketplaceListing[],
  selectedVerticalCode: string,
  searchQuery: string
) {
  const query = searchQuery.trim().toLowerCase();
  const categoryCounts = new Map<string, number>();
  const representativeImages = new Map<string, string | null>();

  for (const listing of listings) {
    if (selectedVerticalCode !== 'ALL' && !matchesVertical(listing.verticalCode, selectedVerticalCode)) {
      continue;
    }
    categoryCounts.set(listing.categoryCode, (categoryCounts.get(listing.categoryCode) ?? 0) + 1);
    if (!representativeImages.has(listing.categoryCode) && listing.imageUrl) {
      representativeImages.set(listing.categoryCode, listing.imageUrl);
    }
  }

  return categories
    .filter((category) => category.active)
    .filter((category) => selectedVerticalCode === 'ALL' || matchesVertical(category.verticalCode, selectedVerticalCode))
    .filter((category) => !query || category.name.toLowerCase().includes(query) || category.code.toLowerCase().includes(query))
    .sort((left, right) => (categoryCounts.get(right.code) ?? 0) - (categoryCounts.get(left.code) ?? 0))
    .slice(0, 8)
    .map((category) => ({
      code: category.code,
      icon: categoryIconFor(category),
      imageUrl: representativeImages.get(category.code) ?? null,
      name: category.name,
      subtitle: categoryCounts.get(category.code) ? `${categoryCounts.get(category.code)} items` : 'Curated collection'
    }));
}

function sortListings(listings: MarketplaceListing[], sortBy: SortOption) {
  const results = [...listings];
  switch (sortBy) {
    case 'price-asc':
      return results.sort((left, right) => left.priceAmount - right.priceAmount);
    case 'price-desc':
      return results.sort((left, right) => right.priceAmount - left.priceAmount);
    case 'rating':
      return results.sort((left, right) => getAverageRating(right) - getAverageRating(left));
    case 'newest':
      return results.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    case 'discount':
    default:
      return results.sort((left, right) => getDiscountPercentage(right) - getDiscountPercentage(left));
  }
}

function getDiscountPercentage(listing: MarketplaceListing) {
  if (!listing.originalPriceAmount || listing.originalPriceAmount <= listing.priceAmount) {
    return 0;
  }
  return Math.round(((listing.originalPriceAmount - listing.priceAmount) / listing.originalPriceAmount) * 100);
}

function getAverageRating(listing: MarketplaceListing) {
  if (!listing.publicReviews.length) {
    return 0;
  }
  const total = listing.publicReviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / listing.publicReviews.length) * 10) / 10;
}

function isAvailable(listing: MarketplaceListing) {
  const status = listing.listingStatus.toUpperCase();
  if (status.includes('OUT') || status.includes('INACTIVE') || status.includes('DISABLED') || status.includes('ARCHIVED')) {
    return false;
  }
  return listing.stockQuantity === null || listing.stockQuantity > 0;
}

function isDigitalListing(listing: MarketplaceListing) {
  const code = canonicalVerticalCode(listing.verticalCode);
  return code === 'DIGITAL' || listing.productType === 'DIGITAL' || ['INSTANT', 'MANUAL'].includes(listing.deliveryType);
}

function isElectronicsListing(listing: MarketplaceListing) {
  return canonicalVerticalCode(listing.verticalCode) === 'ELECTRONICS' || listing.productType === 'ELECTRONICS';
}

function categoryLabel(code: string) {
  return code.replaceAll('_', ' ');
}

function categoryIconFor(category: MarketplaceCategory): ComponentProps<typeof Ionicons>['name'] {
  const value = `${category.code} ${category.name} ${category.verticalCode}`.toUpperCase();
  if (value.includes('GIFT')) return 'gift-outline';
  if (value.includes('GAME')) return 'game-controller-outline';
  if (value.includes('SOFT')) return 'desktop-outline';
  if (value.includes('JEWEL') || value.includes('RING') || value.includes('BANGLE') || value.includes('NECKLACE')) return 'diamond-outline';
  if (value.includes('AUTO') || value.includes('CAR')) return 'car-outline';
  if (value.includes('GROCERY') || value.includes('FOOD')) return 'basket-outline';
  if (value.includes('RENT')) return 'home-outline';
  return 'grid-outline';
}

function verticalIconFor(vertical: MarketplaceVertical): ComponentProps<typeof Ionicons>['name'] {
  const value = `${vertical.moduleCode} ${vertical.moduleName}`.toUpperCase();
  if (value.includes('GIFT') || value.includes('DIGITAL')) return 'keypad-outline';
  if (value.includes('JEWEL')) return 'diamond-outline';
  if (value.includes('AUTO') || value.includes('CAR')) return 'car-outline';
  if (value.includes('GROCERY')) return 'basket-outline';
  if (value.includes('MEAT') || value.includes('FRESH')) return 'restaurant-outline';
  if (value.includes('RENT')) return 'home-outline';
  if (value.includes('ELECTRON')) return 'phone-portrait-outline';
  return 'storefront-outline';
}

function canonicalVerticalCode(code: string) {
  const value = code.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (value.includes('MARKETPLACE') || value.includes('DIGITAL') || value.includes('GIFT') || value.includes('GAMING') || value.includes('SOFTWARE') || value.includes('COURSE') || value.includes('SUBSCRIPTION')) {
    return 'DIGITAL';
  }
  if (value.includes('JEWEL')) return 'JEWELLERY';
  if (value.includes('ELECTRON')) return 'ELECTRONICS';
  if (value.includes('AUTO') || value.includes('CAR')) return 'AUTOMOTIVE';
  if (value.includes('GROCERY') || value.includes('FOOD')) return 'GROCERY';
  if (value.includes('MEAT') || value.includes('FRESH')) return 'FRESH_CUTS';
  if (value.includes('RENT')) return 'RENTALS';
  return value;
}

function matchesVertical(value: string, selected: string) {
  if (selected === 'ALL') {
    return true;
  }
  return canonicalVerticalCode(value) === canonicalVerticalCode(selected);
}

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat('en-US', { currency: currencyCode, style: 'currency' }).format(value);
  } catch {
    return `${currencyCode} ${value.toFixed(2)}`;
  }
}

function discountToneStyle(discount: number) {
  if (discount >= 80) return styles.discountOrange;
  if (discount >= 50) return styles.discountPurple;
  if (discount >= 20) return styles.discountBlue;
  return styles.discountGray;
}

function sortLabel(sortBy: SortOption) {
  switch (sortBy) {
    case 'price-asc':
      return 'Price ↑';
    case 'price-desc':
      return 'Price ↓';
    case 'rating':
      return 'Rating';
    case 'newest':
      return 'Newest';
    case 'discount':
    default:
      return 'Deals';
  }
}

function nextSort(current: SortOption): SortOption {
  const order: SortOption[] = ['discount', 'price-asc', 'price-desc', 'rating', 'newest'];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

function routeForLabel(label: string): AppRoute {
  switch (label) {
    case 'Marketplace':
      return 'marketplaces';
    case 'Orders':
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
    case 'Home':
      return 'home';
    default:
      return 'marketplaces';
  }
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  page: {
    backgroundColor: colors.background,
    paddingBottom: 110
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  headerRowMobile: {
    alignItems: 'stretch',
    flexDirection: 'column'
  },
  brandWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  brandLetter: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900'
  },
  brandCopy: {
    minWidth: 0
  },
  brandTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900'
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: spacing.sm
  },
  headerActionsMobile: {
    alignItems: 'stretch',
    flexWrap: 'wrap'
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    width: 400
  },
  searchWrapMobile: {
    width: '100%'
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    minHeight: 20
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 46,
    justifyContent: 'center',
    minWidth: 46,
    paddingHorizontal: spacing.md
  },
  headerIconLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  noticeCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  noticeText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 13
  },
  horizontalRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  verticalChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  verticalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  verticalChipCopy: {
    minWidth: 0
  },
  verticalChipLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  verticalChipLabelActive: {
    color: colors.white
  },
  verticalChipSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1
  },
  verticalChipSubActive: {
    color: 'rgba(255,255,255,0.8)'
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md
  },
  sectionHeaderMobile: {
    flexDirection: 'column',
    gap: 16
  },
  sectionCopy: {
    flex: 1,
    minWidth: 0
  },
  sectionActionWrap: {
    alignSelf: 'flex-start'
  },
  sectionActionWrapMobile: {
    alignSelf: 'flex-start'
  },
  sectionEyebrow: {
    color: colors.info,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34
  },
  sectionTitleMobile: {
    fontSize: 24,
    lineHeight: 28
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 640
  },
  sectionSubtitleMobile: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10
  },
  showMoreButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(37, 99, 235, 0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    paddingHorizontal: 18
  },
  showMoreText: {
    color: colors.info,
    fontSize: 15,
    fontWeight: '700'
  },
  categoryRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    width: 210
  },
  categoryCardActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 12
  },
  categoryImageWrap: {
    backgroundColor: colors.surfaceVariant,
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    width: '100%'
  },
  categoryImage: {
    height: '100%',
    width: '100%'
  },
  categoryFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  categoryCopyCard: {
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  categoryTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19
  },
  categorySubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6
  },
  mainArea: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl
  },
  filtersSidebar: {
    width: 260
  },
  resultsArea: {
    flex: 1,
    minWidth: 0
  },
  resultsTopBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  resultsCopy: {
    flex: 1
  },
  resultsTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800'
  },
  resultsSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4
  },
  mobileSortRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  compactChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 40,
    paddingHorizontal: 14
  },
  compactChipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  mobileFilterPanel: {
    marginBottom: spacing.md
  },
  filtersCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  filtersCardCompact: {
    marginBottom: 0
  },
  filtersTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  filtersHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm
  },
  filterLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.sm,
    textTransform: 'uppercase'
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  filterInput: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  filterPill: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800'
  },
  filterPillTextActive: {
    color: colors.white
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  productCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    width: '23%'
  },
  productImageWrap: {
    backgroundColor: colors.surfaceVariant,
    height: 240,
    overflow: 'hidden',
    position: 'relative'
  },
  productImage: {
    height: '100%',
    width: '100%'
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.04)'
  },
  discountBadge: {
    borderRadius: radii.pill,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
    zIndex: 2
  },
  discountOrange: {
    backgroundColor: '#ff4d2d'
  },
  discountPurple: {
    backgroundColor: '#7c3aed'
  },
  discountBlue: {
    backgroundColor: '#2563eb'
  },
  discountGray: {
    backgroundColor: '#64748b'
  },
  discountBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800'
  },
  productContent: {
    gap: 8,
    minHeight: 248,
    padding: 14
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(37, 99, 235, 0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.info,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase'
  },
  productTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 40,
    lineHeight: 20
  },
  productSeller: {
    color: colors.textSecondary,
    fontSize: 12
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2
  },
  salePrice: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '800'
  },
  originalPrice: {
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  savingsText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  metaText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  trustRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  trustText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  cardCta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    minHeight: 40,
    paddingHorizontal: 14
  },
  cardCtaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800'
  },
  comingSoonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  comingSoonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexBasis: '32%',
    gap: 10,
    padding: spacing.md
  },
  comingSoonTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between'
  },
  comingSoonIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  comingSoonBadge: {
    color: colors.comingSoon,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  comingSoonTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  comingSoonText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20
  },
  comingSoonActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16
  },
  secondaryActionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  comingSoonEmpty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center'
  },
  emptyActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: 8
  },
  bottomTabs: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingVertical: 8,
    position: 'absolute',
    right: 0
  },
  bottomTab: {
    alignItems: 'center',
    gap: 3
  },
  bottomTabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  bottomTabTextActive: {
    color: colors.primary
  },
  loadingPage: {
    gap: spacing.md,
    padding: spacing.md
  },
  loadingHero: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 24,
    height: 180
  },
  loadingRail: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  loadingChip: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.pill,
    height: 42,
    width: 140
  },
  loadingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  loadingCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    height: 360,
    width: '23%'
  },
  errorPage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    maxWidth: 460,
    padding: spacing.lg,
    width: '100%'
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center'
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center'
  },
  skeletonProductCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    height: 420,
    width: '23%'
  },
  productFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  productFallbackText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8
  }
});

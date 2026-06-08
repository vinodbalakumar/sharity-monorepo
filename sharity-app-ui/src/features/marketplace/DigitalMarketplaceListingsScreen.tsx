import { Ionicons } from '@expo/vector-icons';
import { useSelector } from '@legendapp/state/react';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Button, Card, Input, Paragraph, Text, XStack, YStack } from 'tamagui';

import { InteriorShell } from '../../components/appShell';
import { appState$ } from '../../state/appState';
import type { AppRoute } from '../../types/navigation';
import { getMarketplaceListings } from '../../services/marketplaceApi';
import type { MarketplaceListing } from '../../types/marketplace';
import { searchListings, filterListingsByPrice, filterListingsByVerifiedSellers, sortListingsByPrice, sortListingsByRating, sortListingsByNewest, getDiscountPercentage, getAverageRating, isAvailable } from '../../utils/marketplaceUtils';

type Props = {
  onNavigate: (route: AppRoute) => void;
  onOpenListing: (listingId: string) => void;
};

const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const ListingList = FlashList as unknown as (props: {
  data: MarketplaceListing[];
  estimatedItemSize: number;
  keyExtractor: (item: MarketplaceListing) => string;
  renderItem: (info: { item: MarketplaceListing; index: number }) => ReactElement;
}) => ReactElement;

export function DigitalMarketplaceListingsScreen({ onNavigate, onOpenListing }: Props) {
  const searchQuery = useSelector(appState$.marketplace.searchQuery);
  const filtersState = useSelector(appState$.marketplace.filters);
  const sortBy = useSelector(appState$.marketplace.sortBy);

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketplaceListings();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filteredAndSorted = useMemo(() => {
    let results = listings;

    if (searchQuery) {
      results = searchListings(results, searchQuery);
    }

    if (filtersState.minPrice || filtersState.maxPrice) {
      results = filterListingsByPrice(results, filtersState.minPrice, filtersState.maxPrice);
    }

    if (filtersState.verifiedSellersOnly) {
      results = filterListingsByVerifiedSellers(results, true);
    }

    if (sortBy === 'price-asc') {
      results = sortListingsByPrice(results, true);
    } else if (sortBy === 'price-desc') {
      results = sortListingsByPrice(results, false);
    } else if (sortBy === 'rating') {
      results = sortListingsByRating(results, false);
    } else if (sortBy === 'newest') {
      results = sortListingsByNewest(results);
    }

    return results;
  }, [listings, searchQuery, filtersState, sortBy]);

  if (loading) {
    return (
      <InteriorShell onNavigate={onNavigate} title="Digital Marketplace" scrollable={true}>
        <CenteredState title="Loading digital products..." />
      </InteriorShell>
    );
  }

  return (
    <InteriorShell onNavigate={onNavigate} title="Digital Marketplace" subtitle="Games, software, ebooks, music, and more" scrollable={true}>
      <YStack gap="$5" maxWidth={1220} mx="auto" width="100%">
        <SearchAndFilters searchQuery={searchQuery} filtersState={filtersState} sortBy={sortBy} />

        {filteredAndSorted.length === 0 ? (
          <CenteredState
            title="No products found"
            action="Clear Filters"
            onAction={() => {
              appState$.marketplace.searchQuery.set('');
              appState$.marketplace.filters.set({ minPrice: 0, maxPrice: 999, verifiedSellersOnly: false, categoryCode: '', verticalCode: '', deliveryType: '' });
            }}
          />
        ) : (
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="900">
              {filteredAndSorted.length} products available
            </Text>
            <ListingList
              data={filteredAndSorted}
              estimatedItemSize={320}
              keyExtractor={(listing) => listing.publicId}
              renderItem={({ item, index }) => (
                <ListingCard listing={item} index={index} onOpenListing={onOpenListing} />
              )}
            />
          </YStack>
        )}
      </YStack>
    </InteriorShell>
  );
}

function SearchAndFilters({
  searchQuery,
  filtersState,
  sortBy
}: {
  searchQuery: string;
  filtersState: { minPrice: number; maxPrice: number; verifiedSellersOnly: boolean; categoryCode: string; verticalCode: string; deliveryType: string };
  sortBy: string;
}) {
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('999');

  const handlePriceFilter = () => {
    appState$.marketplace.filters.set({
      ...filtersState,
      minPrice: parseInt(minPrice) || 0,
      maxPrice: parseInt(maxPrice) || 999
    });
  };

  return (
    <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" p="$5">
      <YStack gap="$4">
        <Input
          bg="$background"
          borderColor="$borderColor"
          onChangeText={(value) => appState$.marketplace.searchQuery.set(value)}
          placeholder="Search digital products..."
          value={searchQuery}
        />

        <XStack $md={{ flexDirection: 'column' }} gap="$3">
          <Input
            bg="$background"
            borderColor="$borderColor"
            flex={1}
            onChangeText={setMinPrice}
            placeholder="Min price"
            value={minPrice}
            keyboardType="numeric"
          />
          <Input
            bg="$background"
            borderColor="$borderColor"
            flex={1}
            onChangeText={setMaxPrice}
            placeholder="Max price"
            value={maxPrice}
            keyboardType="numeric"
          />
          <Button theme="purple" onPress={handlePriceFilter}>
            Filter Price
          </Button>
        </XStack>

        <XStack gap="$3" flexWrap="wrap">
          <Button
            size="$3"
            theme={filtersState.verifiedSellersOnly ? 'purple' : undefined}
            onPress={() =>
              appState$.marketplace.filters.set({
                ...filtersState,
                verifiedSellersOnly: !filtersState.verifiedSellersOnly
              })
            }
          >
            {filtersState.verifiedSellersOnly ? '✓ Verified Sellers' : 'Verified Sellers'}
          </Button>

          <Button
            size="$3"
            theme={sortBy === 'price-asc' ? 'purple' : undefined}
            onPress={() => appState$.marketplace.sortBy.set('price-asc')}
          >
            Price: Low to High
          </Button>
          <Button
            size="$3"
            theme={sortBy === 'price-desc' ? 'purple' : undefined}
            onPress={() => appState$.marketplace.sortBy.set('price-desc')}
          >
            Price: High to Low
          </Button>
          <Button
            size="$3"
            theme={sortBy === 'rating' ? 'purple' : undefined}
            onPress={() => appState$.marketplace.sortBy.set('rating')}
          >
            Top Rated
          </Button>
          <Button
            size="$3"
            theme={sortBy === 'newest' ? 'purple' : undefined}
            onPress={() => appState$.marketplace.sortBy.set('newest')}
          >
            Newest
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}

function ListingCard({ listing, index, onOpenListing }: { listing: MarketplaceListing; index: number; onOpenListing: (id: string) => void }) {
  const style = useEntrance(index);
  const rating = getAverageRating(listing);
  const discount = getDiscountPercentage(listing);

  return (
    <Animated.View style={style}>
      <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" mb="$3" onPress={() => onOpenListing(listing.publicId)} p="$4">
        <XStack $md={{ flexDirection: 'column' }} gap="$4">
          {listing.imageUrl ? <Image source={listing.imageUrl} placeholder={blurhash} style={{ width: 120, height: 120, borderRadius: 12 }} /> : <YStack width={120} height={120} borderRadius="$3" bg="$gray3" ai="center" jc="center"><Ionicons name="image-outline" size={40} color="gray" /></YStack>}
          <YStack flex={1} gap="$2">
            <XStack jc="space-between" ai="flex-start">
              <YStack flex={1} gap="$1">
                <Text fontSize="$5" fontWeight="900" numberOfLines={2}>
                  {listing.title}
                </Text>
                <Paragraph color="$gray10" numberOfLines={1}>
                  {listing.sellerDisplayName}
                </Paragraph>
              </YStack>
              {listing.verifiedSeller ? (
                <Ionicons name="checkmark-circle" size={20} color="green" />
              ) : null}
            </XStack>

            <Paragraph color="$gray10" numberOfLines={2}>
              {listing.description}
            </Paragraph>

            <XStack gap="$2" alignItems="center">
              <Text fontSize="$4" fontWeight="900">
                ${listing.priceAmount.toFixed(2)}
              </Text>
              {discount > 0 ? (
                <>
                  <Text
                    color="$gray10"
                    fontSize="$3"
                    textDecorationLine="line-through"
                  >
                    ${listing.originalPriceAmount?.toFixed(2) ?? listing.priceAmount.toFixed(2)}
                  </Text>
                  <Text color="$green10" fontSize="$3" fontWeight="900">
                    {discount}% OFF
                  </Text>
                </>
              ) : null}
            </XStack>

            {rating > 0 ? (
              <XStack gap="$2" alignItems="center">
                <Ionicons name="star" size={16} color="gold" />
                <Text fontSize="$2" fontWeight="900">
                  {rating.toFixed(1)} ({listing.publicReviews.length} reviews)
                </Text>
              </XStack>
            ) : null}

            {!isAvailable(listing) ? (
              <Text color="$red10" fontSize="$3" fontWeight="900">
                Out of Stock
              </Text>
            ) : null}
          </YStack>
        </XStack>
      </Card>
    </Animated.View>
  );
}

function CenteredState({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <Card bg="$backgroundHover" borderColor="$borderColor" borderWidth={1} br="$6" p="$6">
      <YStack ai="center" gap="$3">
        <Text fontSize="$6" fontWeight="900" ta="center">
          {title}
        </Text>
        {action ? (
          <Button theme="purple" onPress={onAction}>
            {action}
          </Button>
        ) : null}
      </YStack>
    </Card>
  );
}

function useEntrance(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(index * 45, withSpring(0, { damping: 18, stiffness: 150 }));
  }, [index, opacity, translateY]);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}

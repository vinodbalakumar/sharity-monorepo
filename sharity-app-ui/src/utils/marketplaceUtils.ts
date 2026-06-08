import type { MarketplaceListing } from '../types/marketplace';

export function filterListingsByPrice(listings: MarketplaceListing[], minPrice: number, maxPrice: number): MarketplaceListing[] {
  return listings.filter((listing) => listing.priceAmount >= minPrice && listing.priceAmount <= maxPrice);
}

export function filterListingsByVerifiedSellers(listings: MarketplaceListing[], verifiedOnly: boolean): MarketplaceListing[] {
  return verifiedOnly ? listings.filter((listing) => listing.verifiedSeller) : listings;
}

export function filterListingsByCategory(listings: MarketplaceListing[], categoryCode: string): MarketplaceListing[] {
  return listings.filter((listing) => listing.categoryCode === categoryCode);
}

export function filterListingsByVertical(listings: MarketplaceListing[], verticalCode: string): MarketplaceListing[] {
  return listings.filter((listing) => listing.verticalCode === verticalCode);
}

export function filterListingsByDeliveryType(listings: MarketplaceListing[], deliveryType: string): MarketplaceListing[] {
  return listings.filter((listing) => listing.deliveryType === deliveryType);
}

export function searchListings(listings: MarketplaceListing[], query: string): MarketplaceListing[] {
  const lowerQuery = query.toLowerCase();
  return listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(lowerQuery) ||
      listing.description.toLowerCase().includes(lowerQuery) ||
      listing.sellerDisplayName.toLowerCase().includes(lowerQuery)
  );
}

export function sortListingsByPrice(listings: MarketplaceListing[], ascending = true): MarketplaceListing[] {
  return [...listings].sort((a, b) => (ascending ? a.priceAmount - b.priceAmount : b.priceAmount - a.priceAmount));
}

export function sortListingsByRating(listings: MarketplaceListing[], ascending = false): MarketplaceListing[] {
  const avgRating = (listing: MarketplaceListing) =>
    listing.publicReviews.length > 0
      ? listing.publicReviews.reduce((sum, review) => sum + review.rating, 0) / listing.publicReviews.length
      : 0;
  return [...listings].sort((a, b) => (ascending ? avgRating(a) - avgRating(b) : avgRating(b) - avgRating(a)));
}

export function sortListingsByNewest(listings: MarketplaceListing[]): MarketplaceListing[] {
  return [...listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDiscountPercentage(listing: MarketplaceListing): number {
  if (!listing.originalPriceAmount) return 0;
  return Math.round(((listing.originalPriceAmount - listing.priceAmount) / listing.originalPriceAmount) * 100);
}

export function getAverageRating(listing: MarketplaceListing): number {
  if (listing.publicReviews.length === 0) return 0;
  return listing.publicReviews.reduce((sum, review) => sum + review.rating, 0) / listing.publicReviews.length;
}

export function hasDiscount(listing: MarketplaceListing): boolean {
  return listing.originalPriceAmount !== null && listing.originalPriceAmount > listing.priceAmount;
}

export function isAvailable(listing: MarketplaceListing): boolean {
  return listing.listingStatus === 'ACTIVE' && (listing.stockQuantity === null || listing.stockQuantity > 0);
}

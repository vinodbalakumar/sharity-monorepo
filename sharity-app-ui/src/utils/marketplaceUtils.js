export function filterListingsByPrice(listings, minPrice, maxPrice) {
    return listings.filter((listing) => listing.priceAmount >= minPrice && listing.priceAmount <= maxPrice);
}
export function filterListingsByVerifiedSellers(listings, verifiedOnly) {
    return verifiedOnly ? listings.filter((listing) => listing.verifiedSeller) : listings;
}
export function filterListingsByCategory(listings, categoryCode) {
    return listings.filter((listing) => listing.categoryCode === categoryCode);
}
export function filterListingsByVertical(listings, verticalCode) {
    return listings.filter((listing) => listing.verticalCode === verticalCode);
}
export function filterListingsByDeliveryType(listings, deliveryType) {
    return listings.filter((listing) => listing.deliveryType === deliveryType);
}
export function searchListings(listings, query) {
    const lowerQuery = query.toLowerCase();
    return listings.filter((listing) => listing.title.toLowerCase().includes(lowerQuery) ||
        listing.description.toLowerCase().includes(lowerQuery) ||
        listing.sellerDisplayName.toLowerCase().includes(lowerQuery));
}
export function sortListingsByPrice(listings, ascending = true) {
    return [...listings].sort((a, b) => (ascending ? a.priceAmount - b.priceAmount : b.priceAmount - a.priceAmount));
}
export function sortListingsByRating(listings, ascending = false) {
    const avgRating = (listing) => listing.publicReviews.length > 0
        ? listing.publicReviews.reduce((sum, review) => sum + review.rating, 0) / listing.publicReviews.length
        : 0;
    return [...listings].sort((a, b) => (ascending ? avgRating(a) - avgRating(b) : avgRating(b) - avgRating(a)));
}
export function sortListingsByNewest(listings) {
    return [...listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function getDiscountPercentage(listing) {
    if (!listing.originalPriceAmount)
        return 0;
    return Math.round(((listing.originalPriceAmount - listing.priceAmount) / listing.originalPriceAmount) * 100);
}
export function getAverageRating(listing) {
    if (listing.publicReviews.length === 0)
        return 0;
    return listing.publicReviews.reduce((sum, review) => sum + review.rating, 0) / listing.publicReviews.length;
}
export function hasDiscount(listing) {
    return listing.originalPriceAmount !== null && listing.originalPriceAmount > listing.priceAmount;
}
export function isAvailable(listing) {
    return listing.listingStatus === 'ACTIVE' && (listing.stockQuantity === null || listing.stockQuantity > 0);
}

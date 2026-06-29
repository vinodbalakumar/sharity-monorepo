const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const bffPublicBaseUrl = process.env.EXPO_PUBLIC_BFF_PUBLIC_BASE_URL ?? '';
const marketplaceBaseUrl = process.env.EXPO_PUBLIC_MARKETPLACE_BASE_URL
    ?? `${bffPublicBaseUrl || bffBaseUrl}/public/marketplace-service/api/v1/marketplace`;
// Marketplace home can be slow on a cold QA load, so keep the client alive
// long enough for the origin to respond instead of failing the whole screen.
const requestTimeoutMs = 20000;
async function getJson(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, requestTimeoutMs);
    try {
        const response = await fetch(`${marketplaceBaseUrl}${path}`, {
            credentials: 'include',
            signal: controller.signal
        });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return (await response.json());
    }
    finally {
        clearTimeout(timeout);
    }
}
export async function getMarketplaceHome(query = '') {
    return getJson(`/home${query}`);
}
export async function getMarketplaceListings() {
    return getJson('/listings?sort=discount');
}
export async function getMarketplaceListing(publicId) {
    return getJson(`/listings/${publicId}`);
}
export async function searchMarketplaceListings(query) {
    return getJson(`/listings/search?q=${encodeURIComponent(query)}`);
}
export async function getMarketplaceListingsByCategory(categoryCode) {
    return getJson(`/listings?category=${categoryCode}`);
}
export async function getMarketplaceListingsByVertical(verticalCode) {
    return getJson(`/listings?vertical=${verticalCode}`);
}
export async function getMarketplaceListingsSorted(sortBy) {
    return getJson(`/listings?sort=${sortBy}`);
}

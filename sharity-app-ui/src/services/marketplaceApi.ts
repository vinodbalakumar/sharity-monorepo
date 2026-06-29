import type { MarketplaceHomeResponse, MarketplaceListing } from '../types/marketplace';
import { resolvePublicBaseUrl } from './publicUrl';

const bffBaseUrl = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_BFF_BASE_URL, '/bff');
const bffPublicBaseUrl = resolvePublicBaseUrl(process.env.EXPO_PUBLIC_BFF_PUBLIC_BASE_URL, '');
const marketplaceBaseUrl = resolveMarketplaceBaseUrl(
  resolvePublicBaseUrl(process.env.EXPO_PUBLIC_MARKETPLACE_BASE_URL, '/marketplace-service/api/v1/marketplace')
);
// Marketplace home can be slow on a cold QA load, so keep the client alive
// long enough for the origin to respond instead of failing the whole screen.
const requestTimeoutMs = 20000;

function resolveMarketplaceBaseUrl(baseUrl: string) {
  const proxyBaseUrl = `${(bffBaseUrl || bffPublicBaseUrl || '/bff').replace(/\/$/, '')}/public/marketplace-service/api/v1/marketplace`;

  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    if (baseUrl.includes('/marketplace-service/api/v1/marketplace') && !baseUrl.includes('/bff/public/marketplace-service/api/v1/marketplace')) {
      return proxyBaseUrl;
    }
    return baseUrl;
  }

  return proxyBaseUrl;
}

async function getJson<T>(path: string): Promise<T> {
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

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getMarketplaceHome(query = ''): Promise<MarketplaceHomeResponse> {
  const response = await getJson<MarketplaceHomeResponse>(`/home${query}`);
  return {
    ...response,
    verticals: response.verticals ?? [],
    categories: response.categories ?? [],
    featuredListings: response.featuredListings ?? [],
    topCategories: response.topCategories ?? [],
    discountedSubcategories: response.discountedSubcategories ?? [],
    rollbackOffers: response.rollbackOffers ?? [],
    clearanceListings: response.clearanceListings ?? [],
    topRatedSellers: response.topRatedSellers ?? [],
    popularListings: response.popularListings ?? []
  };
}

export async function getMarketplaceListings(countryCode?: string): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams();
  params.set('sort', 'discount');
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  return getJson<MarketplaceListing[]>(`/listings?${params.toString()}`);
}

export async function getMarketplaceListing(publicId: string, countryCode?: string): Promise<MarketplaceListing> {
  const params = new URLSearchParams();
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return getJson<MarketplaceListing>(`/listings/${publicId}${suffix}`);
}

export async function searchMarketplaceListings(query: string, countryCode?: string): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams();
  params.set('query', query);
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  return getJson<MarketplaceListing[]>(`/listings/search?${params.toString()}`);
}

export async function getMarketplaceListingsByCategory(categoryCode: string, countryCode?: string): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams();
  params.set('categoryCode', categoryCode);
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  return getJson<MarketplaceListing[]>(`/listings/by-category?${params.toString()}`);
}

export async function getMarketplaceListingsByVertical(verticalCode: string, countryCode?: string): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams();
  params.set('verticalCode', verticalCode);
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  return getJson<MarketplaceListing[]>(`/listings?${params.toString()}`);
}

export async function getMarketplaceListingsSorted(sortBy: 'price' | 'rating' | 'newest' | 'discount', countryCode?: string): Promise<MarketplaceListing[]> {
  const params = new URLSearchParams();
  params.set('sort', sortBy);
  if (countryCode) {
    params.set('countryCode', countryCode);
  }
  return getJson<MarketplaceListing[]>(`/listings?${params.toString()}`);
}

import type { MarketplaceHomeResponse, MarketplaceListing } from '../types/marketplace';

const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const bffPublicBaseUrl = process.env.EXPO_PUBLIC_BFF_PUBLIC_BASE_URL ?? '';
const marketplaceBaseUrl = process.env.EXPO_PUBLIC_MARKETPLACE_BASE_URL
  ?? (bffPublicBaseUrl
    ? `${bffPublicBaseUrl}/public/marketplace-service/api/v1/marketplace`
    : '/marketplace-service/api/v1/marketplace');
const requestTimeoutMs = 6000;

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

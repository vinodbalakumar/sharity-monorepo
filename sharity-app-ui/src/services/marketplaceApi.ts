import type { MarketplaceHomeResponse, MarketplaceListing } from '../types/marketplace';

const marketplaceBaseUrl = process.env.EXPO_PUBLIC_MARKETPLACE_BASE_URL ?? '/marketplace-service/api/v1/marketplace';
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
  return getJson<MarketplaceHomeResponse>(`/home${query}`);
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  return getJson<MarketplaceListing[]>('/listings?sort=discount');
}

export async function getMarketplaceListing(publicId: string): Promise<MarketplaceListing> {
  return getJson<MarketplaceListing>(`/listings/${publicId}`);
}

export async function searchMarketplaceListings(query: string): Promise<MarketplaceListing[]> {
  return getJson<MarketplaceListing[]>(`/listings/search?q=${encodeURIComponent(query)}`);
}

export async function getMarketplaceListingsByCategory(categoryCode: string): Promise<MarketplaceListing[]> {
  return getJson<MarketplaceListing[]>(`/listings?category=${categoryCode}`);
}

export async function getMarketplaceListingsByVertical(verticalCode: string): Promise<MarketplaceListing[]> {
  return getJson<MarketplaceListing[]>(`/listings?vertical=${verticalCode}`);
}

export async function getMarketplaceListingsSorted(sortBy: 'price' | 'rating' | 'newest' | 'discount'): Promise<MarketplaceListing[]> {
  return getJson<MarketplaceListing[]>(`/listings?sort=${sortBy}`);
}

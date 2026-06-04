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

export async function getMarketplaceHome(): Promise<MarketplaceHomeResponse> {
  return getJson<MarketplaceHomeResponse>('/home');
}

export async function getMarketplaceListings(): Promise<MarketplaceListing[]> {
  return getJson<MarketplaceListing[]>('/listings?sort=discount');
}

export async function getMarketplaceListing(publicId: string): Promise<MarketplaceListing> {
  return getJson<MarketplaceListing>(`/listings/${publicId}`);
}

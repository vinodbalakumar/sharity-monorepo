import { serviceConfigs } from './dashboardConfig';
import type { MarketplaceHomeResponse, MarketplaceListing, MarketplaceVertical } from '../../types/marketplace';

export type DashboardService = {
  code: string;
  ctaLabel: string;
  description: string;
  enabled: boolean;
  icon: (typeof serviceConfigs)[number]['icon'];
  name: string;
};

export type DashboardDeal = {
  badge: string;
  currencyCode: string;
  discountedPrice: number;
  id: string;
  marketplaceName: string;
  originalPrice: number | null;
  productType: string;
  rating: number | null;
  title: string;
};

export function buildDashboardServices(home: MarketplaceHomeResponse | null): DashboardService[] {
  const activeCodes = new Set(
    (home?.verticals ?? [])
      .filter((vertical) => isActiveVertical(vertical))
      .map((vertical) => vertical.moduleCode)
  );
  const activeCategoryCodes = new Set((home?.categories ?? []).filter((category) => category.active).map((category) => category.code));

  return serviceConfigs.map((config) => {
    const enabledFromApi =
      config.sourceVerticalCodes.some((code) => activeCodes.has(code)) ||
      (config.activeCategoryCodes ?? []).some((code) => activeCategoryCodes.has(code));
    const enabled = enabledFromApi && !config.forceComingSoon;

    return {
      code: config.code,
      ctaLabel: enabled ? 'Browse' : 'Notify Me',
      description: config.description,
      enabled,
      icon: config.icon,
      name: config.name
    };
  });
}

export function buildDashboardDeals(listings: MarketplaceListing[]): DashboardDeal[] {
  return listings
    .filter((listing) => isActiveMarketplaceDeal(listing))
    .filter((listing) => listing.priceAmount > 0)
    .sort((left, right) => discountValue(right) - discountValue(left))
    .slice(0, 6)
    .map((listing) => {
      const original = listing.originalPriceAmount && listing.originalPriceAmount > listing.priceAmount
        ? listing.originalPriceAmount
        : null;

      return {
        badge: original ? `${Math.round(((original - listing.priceAmount) / original) * 100)}% OFF` : 'Deal',
        currencyCode: listing.currencyCode,
        discountedPrice: listing.priceAmount,
        id: listing.publicId,
        marketplaceName: marketplaceNameFor(listing.verticalCode),
        originalPrice: original,
        productType: listing.productType,
        rating: averageRating(listing),
        title: listing.title
      };
    });
}

function isActiveVertical(vertical: MarketplaceVertical) {
  return vertical.status === 'ACTIVE' && vertical.availableToCustomer && vertical.customerAccessEnabled;
}

function isActiveMarketplaceDeal(listing: MarketplaceListing) {
  return isDigitalDeal(listing) || isElectronicsDeal(listing);
}

function isDigitalDeal(listing: MarketplaceListing) {
  return listing.productType === 'DIGITAL' || listing.deliveryType === 'INSTANT' || listing.deliveryType === 'MANUAL';
}

function isElectronicsDeal(listing: MarketplaceListing) {
  return listing.categoryCode === 'ELECTRONICS' || listing.categoryCode === 'MARKETPLACE_ELECTRONICS';
}

function marketplaceNameFor(verticalCode: string) {
  if (verticalCode === 'GIFT_CARDS') {
    return 'Digital Marketplace';
  }
  return verticalCode === 'MARKETPLACE' ? 'Digital Marketplace' : verticalCode.replaceAll('_', ' ');
}

function discountValue(listing: MarketplaceListing) {
  if (!listing.originalPriceAmount || listing.originalPriceAmount <= listing.priceAmount) {
    return 0;
  }
  return (listing.originalPriceAmount - listing.priceAmount) / listing.originalPriceAmount;
}

function averageRating(listing: MarketplaceListing) {
  if (!listing.publicReviews.length) {
    return null;
  }

  const total = listing.publicReviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / listing.publicReviews.length) * 10) / 10;
}

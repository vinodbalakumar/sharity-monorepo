import { quickActionConfigs, serviceConfigs } from './dashboardConfig';
const HERO_IMAGE_HOST_HINTS = ['r2.dev', 'cloudflare'];
export function buildDashboardServices(home) {
    const activeCodes = new Set((home?.verticals ?? [])
        .filter((vertical) => isActiveVertical(vertical))
        .map((vertical) => vertical.moduleCode));
    const activeCategoryCodes = new Set((home?.categories ?? []).filter((category) => category.active).map((category) => category.code));
    return serviceConfigs.map((config) => {
        const enabledFromApi = config.sourceVerticalCodes.some((code) => activeCodes.has(code)) ||
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
export function buildDashboardQuickActions(home, userRoles = [], countryCode) {
    const roles = new Set(userRoles.map((role) => role.toUpperCase()));
    const activeVerticals = (home?.verticals ?? []).filter((vertical) => isActiveVertical(vertical));
    const activeCategories = (home?.categories ?? []).filter((category) => category.active && (!countryCode || !category.countryCode || category.countryCode === countryCode));
    const hasMarketplaceAccess = activeVerticals.length > 0 || activeCategories.length > 0;
    const hasSellerAccess = activeVerticals.some((vertical) => vertical.providerAccessEnabled || vertical.providerAccessActive);
    return quickActionConfigs.map((config) => {
        const audienceAllowed = audienceEnabled(config.audience, roles);
        const countryAllowed = !config.requiresMarketplaceAccess || hasMarketplaceAccess;
        const sellerAllowed = !config.requiresSellerAccess || hasSellerAccess;
        const enabled = audienceAllowed && countryAllowed && sellerAllowed;
        return {
            ctaLabel: enabled ? 'Open' : 'Unavailable',
            enabled,
            icon: config.icon,
            label: config.label,
            route: config.route,
            text: enabled ? config.text : config.fallbackText ?? config.text
        };
    });
}
export function buildDashboardDeals(listings, countryCode) {
    return listings
        .filter((listing) => isActiveMarketplaceDeal(listing))
        .filter((listing) => listing.priceAmount > 0)
        .filter((listing) => !countryCode || listing.providerCountryCode === countryCode)
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
            imageUrl: listing.imageUrl,
            marketplaceCode: marketplaceCodeFor(listing),
            marketplaceName: marketplaceNameFor(listing.verticalCode),
            originalPrice: original,
            providerCountryCode: listing.providerCountryCode,
            productType: listing.productType,
            rating: averageRating(listing),
            sellerDisplayName: listing.sellerDisplayName,
            title: listing.title
        };
    });
}
export function buildHeroOffers(listings, countryCode) {
    const scopedListings = listings.filter((listing) => !countryCode || listing.providerCountryCode === countryCode);
    const rankedListings = scopedListings.length > 0 ? scopedListings : listings;
    const withPreferredImages = rankedListings.filter((listing) => hasPreferredHeroImage(listing.imageUrl));
    const heroCandidates = (withPreferredImages.length > 0 ? withPreferredImages : rankedListings)
        .filter((listing) => isActiveMarketplaceDeal(listing))
        .sort((left, right) => discountValue(right) - discountValue(left))
        .slice(0, 5);
    return heroCandidates.map((listing) => ({
        badge: badgeForHero(listing),
        countryCode: listing.providerCountryCode,
        currencyCode: listing.currencyCode,
        id: listing.publicId,
        imageUrl: listing.imageUrl,
        marketplaceName: marketplaceNameFor(listing.verticalCode),
        priceLabel: formatCompactMoney(listing.priceAmount, listing.currencyCode),
        sellerDisplayName: listing.sellerDisplayName,
        title: listing.title
    }));
}
function isActiveVertical(vertical) {
    return vertical.status === 'ACTIVE' && vertical.availableToCustomer && vertical.customerAccessEnabled;
}
function audienceEnabled(audience, roles) {
    if (audience === 'seller') {
        return hasAnyRole(roles, ['SELLER', 'PROVIDER', 'ADMIN']);
    }
    if (audience === 'buyer') {
        return roles.size === 0 || hasAnyRole(roles, ['BUYER', 'CUSTOMER', 'SELLER', 'ADMIN']);
    }
    return true;
}
function isActiveMarketplaceDeal(listing) {
    return isDigitalDeal(listing) || isElectronicsDeal(listing);
}
function badgeForHero(listing) {
    const discount = discountValue(listing);
    if (discount > 0) {
        return `${Math.round(discount * 100)}% OFF`;
    }
    return listing.productType === 'DIGITAL' ? 'Instant Delivery' : 'Featured Offer';
}
function formatCompactMoney(value, currencyCode) {
    try {
        return new Intl.NumberFormat('en-US', {
            currency: currencyCode,
            maximumFractionDigits: 0,
            notation: value >= 1000 ? 'compact' : 'standard',
            style: 'currency'
        }).format(value);
    }
    catch {
        return `${currencyCode} ${Math.round(value)}`;
    }
}
function hasAnyRole(roles, candidates) {
    return candidates.some((candidate) => roles.has(candidate));
}
function hasPreferredHeroImage(imageUrl) {
    if (!imageUrl) {
        return false;
    }
    const normalized = imageUrl.toLowerCase();
    if (normalized.includes('unsplash.com') || normalized.includes('picsum.photos') || normalized.includes('placeholders')) {
        return false;
    }
    return HERO_IMAGE_HOST_HINTS.some((hint) => normalized.includes(hint)) || normalized.startsWith('https://');
}
function isDigitalDeal(listing) {
    return listing.productType === 'DIGITAL' || listing.deliveryType === 'INSTANT' || listing.deliveryType === 'MANUAL';
}
function isElectronicsDeal(listing) {
    return listing.categoryCode === 'ELECTRONICS' || listing.categoryCode === 'MARKETPLACE_ELECTRONICS';
}
function marketplaceNameFor(verticalCode) {
    if (verticalCode === 'GIFT_CARDS') {
        return 'Digital Marketplace';
    }
    return verticalCode === 'MARKETPLACE' ? 'Digital Marketplace' : verticalCode.replaceAll('_', ' ');
}
function marketplaceCodeFor(listing) {
    return isElectronicsDeal(listing) ? 'ELECTRONICS' : 'DIGITAL';
}
function discountValue(listing) {
    if (!listing.originalPriceAmount || listing.originalPriceAmount <= listing.priceAmount) {
        return 0;
    }
    return (listing.originalPriceAmount - listing.priceAmount) / listing.originalPriceAmount;
}
function averageRating(listing) {
    if (!listing.publicReviews.length) {
        return null;
    }
    const total = listing.publicReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / listing.publicReviews.length) * 10) / 10;
}

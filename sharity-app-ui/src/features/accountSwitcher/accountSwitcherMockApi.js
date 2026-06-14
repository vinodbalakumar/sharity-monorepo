import { placeholderImageUrl } from '../../utils/mockImages';
const modules = [
    marketplace('DIGITAL', 'Digital Marketplace', 'ENABLED', true, true),
    marketplace('ELECTRONICS', 'Electronics Marketplace', 'ENABLED', true, true),
    marketplace('JEWELLERY', 'Imitation Jewellery', 'COMING_SOON', false, false, 'Coming soon'),
    marketplace('AUTOMOTIVE', 'Automotive', 'DISABLED_BY_ADMIN', false, false, 'Disabled by admin configuration'),
    marketplace('GROCERY', 'Grocery', 'NOT_AVAILABLE_IN_COUNTRY', false, false, 'Not available in your country'),
    marketplace('FRESH_MEAT', 'Fresh Meat', 'COMING_SOON', false, false, 'Coming soon'),
    marketplace('RENTALS', 'Rentals', 'REQUIRES_APPROVAL', true, false, 'Admin approval required'),
    marketplace('FUTURE', 'Future Marketplace', 'COMING_SOON', false, false, 'Future marketplace placeholder')
];
export async function getAccountSwitcherSummary(currentMode = 'BUYER', currentMarketplace = 'DIGITAL') {
    const sellerEligible = true;
    return {
        currentMode,
        currentMarketplace,
        buyerIdentity: {
            userId: 'user-1000',
            buyerAlias: 'V***D',
            displayName: 'Vinod',
            avatarUrl: placeholderImageUrl('avatar'),
            country: 'USA',
            buyerStatus: 'ACTIVE',
            privacyModeEnabled: true
        },
        sellerIdentity: {
            sellerId: 'seller-1000',
            sellerAlias: 'TechDealsPhoenix',
            storeName: 'Tech Deals Phoenix',
            storeLogoUrl: placeholderImageUrl('store'),
            sellerStatus: 'ACTIVE',
            onboardingStatus: sellerEligible ? 'COMPLETE' : 'REQUIRED',
            verificationStatus: 'VERIFIED',
            payoutSetupStatus: 'PAYPAL_CONNECTED',
            activeSellerMarketplace: 'DIGITAL'
        },
        availableModes: [
            { mode: 'BUYER', available: true, active: currentMode === 'BUYER', status: 'AVAILABLE', route: '/home' },
            { mode: 'SELLER', available: sellerEligible, active: currentMode === 'SELLER', status: sellerEligible ? 'AVAILABLE' : 'SELLER_ONBOARDING_REQUIRED', reasonCode: sellerEligible ? undefined : 'SELLER_ONBOARDING_REQUIRED', reasonMessage: sellerEligible ? undefined : 'Complete your seller profile before switching to Seller Mode.', requiredAction: sellerEligible ? undefined : 'Start Seller Onboarding', route: '/seller' }
        ],
        marketplaceModules: modules,
        sellerModeEligibility: {
            eligible: sellerEligible,
            sellerProfileComplete: true,
            sellerAliasConfigured: true,
            storeNameConfigured: true,
            countryEligible: true,
            policyAccepted: true,
            verificationRequired: true,
            verificationComplete: true,
            payoutSetupRequired: true,
            payoutSetupComplete: true,
            requiredActions: sellerEligible ? [] : ['Start Seller Onboarding']
        }
    };
}
export async function switchAccountMode(targetMode, targetMarketplace) {
    if (targetMode === 'SELLER' && targetMarketplace === 'GROCERY') {
        return { currentMode: 'BUYER', currentMarketplace: 'DIGITAL', switched: false, message: 'Seller mode is not available for Grocery in your country.', fallbackApplied: true, fallbackReason: 'MARKETPLACE_NOT_AVAILABLE_IN_COUNTRY' };
    }
    return { currentMode: targetMode, currentMarketplace: targetMarketplace, switched: true, message: `Switched to ${targetMode.toLowerCase()} mode.`, fallbackApplied: false };
}
function marketplace(marketplaceCode, marketplaceName, status, buyerAvailable, sellerAvailable, reasonMessage) {
    return {
        marketplaceCode,
        marketplaceName,
        iconUrl: placeholderImageUrl('gift_cards'),
        buyerAvailable,
        sellerAvailable,
        buyerEnabledByUser: buyerAvailable,
        sellerEnabledByUser: sellerAvailable,
        countryAllowed: status !== 'NOT_AVAILABLE_IN_COUNTRY',
        adminAllowed: status !== 'DISABLED_BY_ADMIN',
        status,
        reasonCode: status === 'ENABLED' ? undefined : status,
        reasonMessage,
        requiredAction: status === 'REQUIRES_APPROVAL' ? 'Request Approval' : status === 'NOT_AVAILABLE_IN_COUNTRY' ? 'View Availability' : undefined,
        comingSoon: status === 'COMING_SOON'
    };
}

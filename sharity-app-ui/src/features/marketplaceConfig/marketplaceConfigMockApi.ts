import type { MarketplaceConfigDashboard, MarketplaceConfigDetail } from './marketplaceConfigTypes';

const now = new Date().toISOString();

export async function getMarketplaceConfigDashboard(): Promise<MarketplaceConfigDashboard> {
  const configs = [
    config('config-usa-digital', 'USA', 'DIGITAL', 'Digital Marketplace', 'ENABLED', true, true, 1),
    config('config-usa-electronics', 'USA', 'ELECTRONICS', 'Electronics Marketplace', 'ENABLED', true, true, 2),
    config('config-usa-grocery', 'USA', 'GROCERY', 'Grocery', 'DISABLED', false, false, 5),
    config('config-ind-digital', 'IND', 'DIGITAL', 'Digital Marketplace', 'ENABLED', true, true, 1),
    config('config-ind-jewellery', 'IND', 'IMITATION_JEWELLERY', 'Imitation Jewellery', 'COMING_SOON', true, false, 2),
    config('config-usa-fresh-meat', 'USA', 'FRESH_MEAT', 'Fresh Meat', 'REQUIRES_ADMIN_APPROVAL', true, false, 6),
    config('config-usa-rentals', 'USA', 'RENTALS', 'Rentals', 'PILOT_BETA', true, false, 7)
  ];

  return {
    countries: [
      { countryCode: 'USA', countryName: 'United States', registrationAllowed: true, countryChangeAllowed: true, countryChangeReviewRequired: false, defaultCurrency: 'USD', defaultMarketplaceCode: 'DIGITAL', enabledMarketplaceCount: 2, disabledMarketplaceCount: 1, comingSoonMarketplaceCount: 2, version: 12, status: 'PUBLISHED', updatedAt: now },
      { countryCode: 'IND', countryName: 'India', registrationAllowed: true, countryChangeAllowed: true, countryChangeReviewRequired: true, defaultCurrency: 'INR', defaultMarketplaceCode: 'DIGITAL', enabledMarketplaceCount: 1, disabledMarketplaceCount: 2, comingSoonMarketplaceCount: 1, version: 5, status: 'DRAFT', updatedAt: now }
    ],
    configs,
    simulation: {
      allowed: false,
      buyerAvailable: true,
      sellerAvailable: false,
      missingRequirements: ['PayPal setup', 'Seller policy acceptance'],
      userSafeMessage: 'Complete seller setup to start selling digital products.',
      internalRuleIds: ['SELLER_PAYOUT_SETUP_REQUIRED', 'SELLER_POLICY_REQUIRED'],
      featureFlagsEnabled: ['enableBuying', 'enableCart', 'enableCheckout', 'enableDigitalDelivery'],
      marketplaceDisplayResult: 'Visible in seller setup with required actions',
      effectiveRuleVersion: 12,
      suggestedRequiredAction: 'Connect PayPal and accept seller policies',
      warnings: ['Existing orders keep original snapshots.']
    },
    auditLog: [
      { auditId: 'audit-market-1', actorId: 'admin-1', actorName: 'Country Ops Admin', action: 'Marketplace enabled', entityType: 'MARKETPLACE_CONFIG', countryCode: 'USA', marketplaceCode: 'ELECTRONICS', beforeSummary: 'COMING_SOON', afterSummary: 'ENABLED', reason: 'MVP expansion', version: 12, createdAt: now }
    ]
  };
}

export async function simulateMarketplaceAvailability() {
  return (await getMarketplaceConfigDashboard()).simulation;
}

export async function saveMarketplaceConfig() {
  return { status: 'SAVED', message: 'Marketplace configuration saved as a versioned draft. Existing orders are unchanged.' };
}

function config(configId: string, countryCode: string, marketplaceCode: string, marketplaceName: string, status: string, buyerAllowed: boolean, sellerAllowed: boolean, displayOrder: number): MarketplaceConfigDetail {
  return {
    configId,
    countryCode,
    marketplaceCode,
    marketplaceName,
    marketplaceIconUrl: placeholderImageUrl('gift_cards'),
    buyerAvailability: { buyerAllowed, sellerAllowed: false, buyerStatus: buyerAllowed ? 'ALLOWED' : 'BLOCKED', sellerStatus: 'N/A', buyerUserSafeMessage: buyerAllowed ? 'Marketplace enabled' : 'Not available in your country', sellerUserSafeMessage: 'Seller preferences are handled separately' },
    sellerAvailability: { buyerAllowed: false, sellerAllowed, buyerStatus: 'N/A', sellerStatus: sellerAllowed ? 'ALLOWED' : 'REQUIRES_SETUP', buyerUserSafeMessage: 'Buyer-safe only', sellerUserSafeMessage: sellerAllowed ? 'Seller access enabled' : 'Complete seller setup or wait for admin approval' },
    status,
    visibility: status === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE',
    displayOrder,
    phase: status === 'ENABLED' ? 'MVP' : 'LATER_PHASE',
    featureFlags: { enableBuying: buyerAllowed, enableSelling: sellerAllowed, enableCart: buyerAllowed, enableCheckout: buyerAllowed, enableCoupons: buyerAllowed, enableSharityCreditRewards: buyerAllowed, enableRefunds: buyerAllowed, enableDisputes: buyerAllowed, enableSellerAcceptanceBeforeCapture: true, enableDigitalDelivery: marketplaceCode === 'DIGITAL', enablePhysicalShippingLater: marketplaceCode !== 'DIGITAL', enablePrePurchaseMessagingLater: false },
    sellerEligibility: { sellerOnboardingRequired: true, sellerVerificationRequired: marketplaceCode !== 'DIGITAL', payoutSetupRequired: true, policyAcceptanceRequired: true, categoryApprovalRequired: marketplaceCode !== 'DIGITAL', businessLicenseRequired: ['FRESH_MEAT', 'AUTOMOTIVE', 'RENTALS'].includes(marketplaceCode), maxOrderValueForNewSellers: 100, reserveHoldRuleRequired: marketplaceCode !== 'DIGITAL', adminApprovalRequired: ['FRESH_MEAT', 'RENTALS'].includes(marketplaceCode), userSafeMessage: 'Complete seller setup to unlock this marketplace.' },
    buyerEligibility: { countryEligibilityRequired: true, emailVerifiedRequired: true, phoneVerifiedRequired: false, minAccountAgeDays: 0, paymentMethodRequired: false, maxFreeGiveawayClaims: 1, purchaseLimit: 500, ageComplianceRequirementLater: false, userSafeMessage: 'Verify your account to use this marketplace.' },
    userSafeReasonMapping: [{ internalReasonCode: 'SELLER_PAYOUT_SETUP_REQUIRED', userSafeMessage: 'Connect PayPal to start selling in this marketplace.', requiredAction: 'Connect PayPal', route: '/seller/verification', severity: 'WARNING', visibleToBuyer: false, visibleToSeller: true }],
    effectiveStart: now,
    version: 12,
    draft: status !== 'ENABLED',
    published: status === 'ENABLED',
    createdBy: 'Marketplace Admin',
    updatedBy: 'Country Ops Admin',
    publishedBy: 'Marketplace Admin',
    changeReason: 'Country marketplace readiness',
    updatedAt: now
  };
}
import { placeholderImageUrl } from '../../utils/mockImages';

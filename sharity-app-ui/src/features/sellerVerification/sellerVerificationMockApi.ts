import type { SellerVerificationDashboardResponse } from './sellerVerificationTypes';

const now = new Date().toISOString();

export async function getSellerVerificationDashboard(): Promise<SellerVerificationDashboardResponse> {
  const timeline = [
    { eventId: 'ver-timeline-1', eventType: 'PROFILE_CREATED', title: 'Seller profile created', userSafeMessage: 'Store profile started.', marketplaceCode: 'DIGITAL', status: 'COMPLETE', timestamp: now },
    { eventId: 'ver-timeline-2', eventType: 'PAYPAL_PENDING', title: 'PayPal setup required', userSafeMessage: 'Connect PayPal to receive payouts.', marketplaceCode: 'DIGITAL', status: 'ACTION_REQUIRED', timestamp: now }
  ];
  return {
    sellerId: 'seller-gamecodehub',
    storeName: 'Game Code Hub',
    sellerAlias: 'GameCodeHub',
    overallReadiness: { setupProgressPercent: 70, verificationLevel: 'BASIC_SELLER_PROFILE', payoutEligibilityStatus: 'PAYPAL_SETUP_REQUIRED', enabledMarketplaceCount: 1, requiredActionCount: 3, lastUpdatedAt: now },
    payoutEligibility: {
      status: 'PAYPAL_SETUP_REQUIRED',
      eligible: false,
      userSafeMessage: 'Complete PayPal setup and accept seller policies to receive payouts.',
      payoutProviderStatus: 'PAYPAL_NOT_CONNECTED',
      reserveHoldStatus: '10% new seller reserve placeholder',
      refundDisputeHoldStatus: 'No active refund/dispute hold',
      countrySupportStatus: 'Supported',
      updatedAt: now,
      requiredActions: ['Connect PayPal', 'Accept seller policies'],
      blockingReasons: [
        { reasonCode: 'PAYPAL_NOT_CONNECTED', title: 'PayPal not connected', userSafeMessage: 'Connect PayPal to receive payouts.', relatedMarketplaceCode: 'DIGITAL', relatedCategoryCode: 'ALL', requiredAction: 'Connect PayPal', route: '/seller/verification', severity: 'CRITICAL', blocking: true },
        { reasonCode: 'SELLER_POLICY_NOT_ACCEPTED', title: 'Seller policy not accepted', userSafeMessage: 'Accept seller policies to finish setup.', relatedMarketplaceCode: 'DIGITAL', relatedCategoryCode: 'ALL', requiredAction: 'Accept Policies', route: '/seller/policies', severity: 'WARNING', blocking: true }
      ]
    },
    verificationChecklist: [
      checklist('EMAIL_VERIFIED', 'Email verified', 'COMPLETE', true, 'Verified'),
      checklist('PHONE_VERIFIED', 'Phone verified', 'INCOMPLETE', false, 'Add phone verification for higher limits'),
      checklist('SELLER_PROFILE_COMPLETE', 'Seller profile complete', 'COMPLETE', true, 'Store profile is ready'),
      checklist('POLICY_ACCEPTED', 'Policy accepted', 'REQUIRED', true, 'Accept seller policies'),
      checklist('PAYPAL_CONNECTED', 'PayPal connected', 'REQUIRED', true, 'Connect PayPal for payouts'),
      checklist('IDENTITY_VERIFICATION', 'Identity verification', 'PENDING_REVIEW', false, 'Required for electronics and higher limits'),
      checklist('BUSINESS_LICENSE_LATER', 'Business/license later', 'COMING_LATER', false, 'Future regulated marketplace requirement')
    ],
    marketplaceEligibility: [
      market('DIGITAL', 'Digital Marketplace', 'ENABLED', true, 'You can sell digital products.'),
      market('ELECTRONICS', 'Electronics Marketplace', 'REQUIRES_VERIFICATION', false, 'Complete identity verification to list electronics.'),
      market('FRESH_MEAT', 'Fresh Meat', 'BUSINESS_LICENSE_REQUIRED_LATER', false, 'Business/license requirement later.'),
      market('RENTALS', 'Rentals', 'ADMIN_APPROVAL_REQUIRED', false, 'Admin approval required.')
    ],
    accountLimits: [
      { limitType: 'MAX_ORDER_VALUE', label: 'New seller max order value', currentValue: '100', currency: 'USD', userSafeReason: 'Limit may increase after successful order history.', relatedMarketplaceCode: 'DIGITAL', relatedCategoryCode: 'ALL', unlockGuidance: 'Complete verification and maintain good standing.', effectiveDate: now },
      { limitType: 'PAYOUT_RESERVE', label: 'Payout reserve', currentValue: '10% hold', userSafeReason: 'Temporary reserve may apply to reduce refund/dispute risk.', relatedMarketplaceCode: 'DIGITAL', relatedCategoryCode: 'ALL', unlockGuidance: 'Good order history may reduce reserve.', effectiveDate: now }
    ],
    documentRequirements: [
      { requirementId: 'doc-identity', documentType: 'IDENTITY_DOCUMENT', required: true, reason: 'Required for electronics and higher seller limits.', marketplaceCode: 'ELECTRONICS', categoryCode: 'ALL', uploadStatus: 'NOT_UPLOADED', reviewStatus: 'NOT_SUBMITTED', availableActions: ['UPLOAD_DOCUMENT'] }
    ],
    adminReview: { required: true, status: 'REQUIRED', userSafeReason: 'Admin review is required for electronics access.', estimatedReviewTime: '1-2 business days', requiredActions: ['Upload identity document'], resubmissionAllowed: true, timeline },
    sellerBadges: [
      { badgeType: 'NEW_SELLER', label: 'New seller', status: 'ACTIVE', publicVisible: true, sellerSafeOnly: false, description: 'Shown while store builds order history.' },
      { badgeType: 'PAYPAL_CONNECTED', label: 'PayPal connected', status: 'LOCKED', publicVisible: false, sellerSafeOnly: true, description: 'Unlocked after PayPal setup.' },
      { badgeType: 'GOOD_STANDING', label: 'Good seller standing', status: 'ACTIVE', publicVisible: true, sellerSafeOnly: false, description: 'Seller-safe positive trust badge.' }
    ],
    timeline,
    availableActions: { canVerifyEmail: false, canVerifyPhone: true, canCompleteSellerProfile: false, canAcceptPolicies: true, canConnectPayPal: true, canAddTaxBusinessInfo: false, canUploadDocuments: true, canRequestAdminReview: true, canViewPayoutEligibility: true, canBackToSellerCenter: true }
  };
}

export async function connectPayPal() {
  return { status: 'STARTED', message: 'PayPal payout setup started. Provider tokens are never stored locally.' };
}

export async function uploadSellerDocument() {
  return { documentId: 'seller-doc-001', documentType: 'IDENTITY_DOCUMENT', uploadStatus: 'UPLOADED', reviewStatus: 'PENDING_REVIEW', message: 'Document uploaded securely for admin review.' };
}

export async function requestAdminReview() {
  return { status: 'SUBMITTED', message: 'Admin review requested with seller-safe timeline.' };
}

function checklist(type: string, label: string, status: string, required: boolean, message: string) {
  return { verificationType: type, label, status, required, requiredForMarketplaceCodes: ['DIGITAL', 'ELECTRONICS'], requiredForCategoryCodes: ['ALL'], userSafeMessage: message, ctaLabel: status === 'COMPLETE' ? 'Done' : 'Resolve', route: '/seller/verification', lastUpdatedAt: now };
}

function market(code: string, name: string, status: string, eligible: boolean, reason: string) {
  return { marketplaceCode: code, marketplaceName: name, marketplaceIconUrl: placeholderImageUrl('gift_cards'), status, sellerEligible: eligible, requiredVerification: eligible ? 'Basic profile' : 'Identity/business verification', requiredPolicy: 'Seller Terms', payoutSetupRequired: true, businessLicenseRequired: status.includes('BUSINESS'), maxOrderValue: eligible ? 100 : 0, categoryRestrictions: eligible ? 'None for MVP digital' : 'Restricted until requirements complete', adminApprovalStatus: status.includes('ADMIN') ? 'REQUIRED' : 'NOT_REQUIRED', userSafeReason: reason, availableActions: eligible ? ['CREATE_LISTING'] : ['COMPLETE_REQUIREMENTS'] };
}
import { placeholderImageUrl } from '../../utils/mockImages';

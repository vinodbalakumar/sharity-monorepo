export type SellerVerificationDashboardResponse = {
  sellerId: string;
  storeName: string;
  sellerAlias: string;
  overallReadiness: SellerVerificationReadiness;
  payoutEligibility: SellerPayoutEligibilityStatus;
  verificationChecklist: SellerVerificationChecklistItem[];
  marketplaceEligibility: SellerMarketplaceEligibilityItem[];
  accountLimits: SellerAccountLimitItem[];
  documentRequirements: SellerDocumentRequirement[];
  adminReview: SellerAdminReviewStatus;
  sellerBadges: SellerBadgePreviewItem[];
  timeline: SellerVerificationTimelineEvent[];
  availableActions: SellerVerificationAvailableActions;
};

export type SellerVerificationReadiness = {
  setupProgressPercent: number;
  verificationLevel: string;
  payoutEligibilityStatus: string;
  enabledMarketplaceCount: number;
  requiredActionCount: number;
  lastUpdatedAt: string;
};

export type SellerVerificationChecklistItem = {
  verificationType: string;
  label: string;
  status: string;
  required: boolean;
  requiredForMarketplaceCodes: string[];
  requiredForCategoryCodes: string[];
  userSafeMessage: string;
  ctaLabel: string;
  route: string;
  lastUpdatedAt: string;
};

export type SellerPayoutEligibilityStatus = {
  status: string;
  eligible: boolean;
  userSafeMessage: string;
  blockingReasons: SellerPayoutBlockingReason[];
  payoutProviderStatus: string;
  reserveHoldStatus: string;
  refundDisputeHoldStatus: string;
  countrySupportStatus: string;
  requiredActions: string[];
  updatedAt: string;
};

export type SellerPayoutBlockingReason = {
  reasonCode: string;
  title: string;
  userSafeMessage: string;
  relatedMarketplaceCode: string;
  relatedCategoryCode: string;
  requiredAction: string;
  route: string;
  severity: string;
  blocking: boolean;
};

export type SellerMarketplaceEligibilityItem = {
  marketplaceCode: string;
  marketplaceName: string;
  marketplaceIconUrl: string;
  status: string;
  sellerEligible: boolean;
  requiredVerification: string;
  requiredPolicy: string;
  payoutSetupRequired: boolean;
  businessLicenseRequired: boolean;
  maxOrderValue: number;
  categoryRestrictions: string;
  adminApprovalStatus: string;
  userSafeReason: string;
  availableActions: string[];
};

export type SellerAccountLimitItem = {
  limitType: string;
  label: string;
  currentValue: string;
  currency?: string;
  userSafeReason: string;
  relatedMarketplaceCode: string;
  relatedCategoryCode: string;
  unlockGuidance: string;
  effectiveDate: string;
};

export type SellerDocumentRequirement = {
  requirementId: string;
  documentType: string;
  required: boolean;
  reason: string;
  marketplaceCode: string;
  categoryCode: string;
  uploadStatus: string;
  reviewStatus: string;
  expiryDate?: string;
  availableActions: string[];
};

export type SellerDocumentUploadResponse = {
  documentId: string;
  documentType: string;
  uploadStatus: string;
  reviewStatus: string;
  message: string;
};

export type SellerAdminReviewStatus = {
  required: boolean;
  status: string;
  userSafeReason: string;
  submittedAt?: string;
  estimatedReviewTime: string;
  requiredActions: string[];
  resubmissionAllowed: boolean;
  timeline: SellerVerificationTimelineEvent[];
};

export type SellerBadgePreviewItem = {
  badgeType: string;
  label: string;
  status: string;
  publicVisible: boolean;
  sellerSafeOnly: boolean;
  description: string;
};

export type SellerVerificationTimelineEvent = {
  eventId: string;
  eventType: string;
  title: string;
  userSafeMessage: string;
  marketplaceCode?: string;
  categoryCode?: string;
  status: string;
  timestamp: string;
};

export type SellerVerificationAvailableActions = {
  canVerifyEmail: boolean;
  canVerifyPhone: boolean;
  canCompleteSellerProfile: boolean;
  canAcceptPolicies: boolean;
  canConnectPayPal: boolean;
  canAddTaxBusinessInfo: boolean;
  canUploadDocuments: boolean;
  canRequestAdminReview: boolean;
  canViewPayoutEligibility: boolean;
  canBackToSellerCenter: boolean;
};

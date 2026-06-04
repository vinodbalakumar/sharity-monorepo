export type CountryMarketplaceConfigSummary = {
  countryCode: string;
  countryName: string;
  registrationAllowed: boolean;
  countryChangeAllowed: boolean;
  countryChangeReviewRequired: boolean;
  defaultCurrency: string;
  defaultMarketplaceCode: string;
  enabledMarketplaceCount: number;
  disabledMarketplaceCount: number;
  comingSoonMarketplaceCount: number;
  version: number;
  status: string;
  updatedAt: string;
};

export type MarketplaceAvailabilityConfig = {
  buyerAllowed: boolean;
  sellerAllowed: boolean;
  buyerStatus: string;
  sellerStatus: string;
  buyerUserSafeMessage: string;
  sellerUserSafeMessage: string;
};

export type MarketplaceFeatureFlags = {
  enableBuying: boolean;
  enableSelling: boolean;
  enableCart: boolean;
  enableCheckout: boolean;
  enableCoupons: boolean;
  enableSharityCreditRewards: boolean;
  enableRefunds: boolean;
  enableDisputes: boolean;
  enableSellerAcceptanceBeforeCapture: boolean;
  enableDigitalDelivery: boolean;
  enablePhysicalShippingLater: boolean;
  enablePrePurchaseMessagingLater: boolean;
};

export type SellerEligibilityConfig = {
  sellerOnboardingRequired: boolean;
  sellerVerificationRequired: boolean;
  payoutSetupRequired: boolean;
  policyAcceptanceRequired: boolean;
  categoryApprovalRequired: boolean;
  businessLicenseRequired: boolean;
  maxOrderValueForNewSellers: number;
  reserveHoldRuleRequired: boolean;
  adminApprovalRequired: boolean;
  userSafeMessage: string;
};

export type BuyerEligibilityConfig = {
  countryEligibilityRequired: boolean;
  emailVerifiedRequired: boolean;
  phoneVerifiedRequired: boolean;
  minAccountAgeDays: number;
  paymentMethodRequired: boolean;
  maxFreeGiveawayClaims: number;
  purchaseLimit: number;
  ageComplianceRequirementLater: boolean;
  userSafeMessage: string;
};

export type UserSafeReasonMapping = {
  internalReasonCode: string;
  userSafeMessage: string;
  requiredAction: string;
  route: string;
  severity: string;
  visibleToBuyer: boolean;
  visibleToSeller: boolean;
};

export type MarketplaceConfigDetail = {
  configId: string;
  countryCode: string;
  marketplaceCode: string;
  marketplaceName: string;
  marketplaceIconUrl: string;
  buyerAvailability: MarketplaceAvailabilityConfig;
  sellerAvailability: MarketplaceAvailabilityConfig;
  status: string;
  visibility: string;
  displayOrder: number;
  phase: string;
  featureFlags: MarketplaceFeatureFlags;
  sellerEligibility: SellerEligibilityConfig;
  buyerEligibility: BuyerEligibilityConfig;
  userSafeReasonMapping: UserSafeReasonMapping[];
  effectiveStart: string;
  effectiveEnd?: string;
  version: number;
  draft: boolean;
  published: boolean;
  createdBy: string;
  updatedBy: string;
  publishedBy: string;
  changeReason: string;
  updatedAt: string;
};

export type MarketplaceDisplayOrderItem = {
  marketplaceCode: string;
  displayOrder: number;
  visible: boolean;
  showComingSoon: boolean;
};

export type MarketplaceAvailabilitySimulationRequest = {
  countryCode: string;
  role: string;
  marketplaceCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  sellerOnboardingComplete: boolean;
  sellerVerificationComplete: boolean;
  payoutSetupComplete: boolean;
  policyAccepted: boolean;
  categoryApprovalComplete: boolean;
  accountAgeDays: number;
  paymentMethodAvailable: boolean;
  productCategoryCode: string;
  freeGiveawayClaimCount: number;
  orderValue: number;
  testDateTime: string;
};

export type MarketplaceAvailabilitySimulationResponse = {
  allowed: boolean;
  buyerAvailable: boolean;
  sellerAvailable: boolean;
  missingRequirements: string[];
  userSafeMessage: string;
  internalRuleIds: string[];
  featureFlagsEnabled: string[];
  marketplaceDisplayResult: string;
  effectiveRuleVersion: number;
  suggestedRequiredAction: string;
  warnings: string[];
};

export type MarketplaceConfigAuditLogItem = {
  auditId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  countryCode: string;
  marketplaceCode: string;
  beforeSummary: string;
  afterSummary: string;
  reason: string;
  version: number;
  createdAt: string;
};

export type UserMarketplaceAvailabilityResponse = {
  userCountry: string;
  buyerMarketplaces: UserMarketplaceAvailabilityItem[];
  sellerMarketplaces: UserMarketplaceAvailabilityItem[];
  defaultMarketplaceCode: string;
  displayOrder: MarketplaceDisplayOrderItem[];
  userSafeMessages: string[];
  availableActions: string[];
};

export type UserMarketplaceAvailabilityItem = {
  marketplaceCode: string;
  marketplaceName: string;
  marketplaceIconUrl: string;
  buyerAvailable: boolean;
  sellerAvailable: boolean;
  visible: boolean;
  status: string;
  userEnabled: boolean;
  comingSoon: boolean;
  userSafeMessage: string;
  requiredAction: string;
  route: string;
};

export type MarketplaceConfigDashboard = {
  countries: CountryMarketplaceConfigSummary[];
  configs: MarketplaceConfigDetail[];
  simulation: MarketplaceAvailabilitySimulationResponse;
  auditLog: MarketplaceConfigAuditLogItem[];
};

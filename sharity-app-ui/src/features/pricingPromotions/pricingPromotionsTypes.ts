export type PricingRule = {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  scope: string;
  marketplaceCode: string;
  categoryCode: string;
  countryCode: string;
  sellerId?: string;
  feeModel: string;
  fixedAmount: number;
  percentage: number;
  minAmount: number;
  maxAmount: number;
  currency: string;
  priority: number;
  effectiveStart: string;
  effectiveEnd?: string;
  version: number;
  status: string;
};

export type CouponRule = {
  couponId: string;
  couponCode: string;
  couponType: string;
  fundingSource: string;
  discountModel: string;
  fixedAmount: number;
  percentage: number;
  maxDiscount: number;
  minOrderValue: number;
  marketplaceCode: string;
  categoryCode: string;
  countryCode: string;
  sellerId?: string;
  firstOrderOnly: boolean;
  stackable: boolean;
  status: string;
};

export type FeeWaiverSellerRule = {
  feeWaiverId: string;
  sellerId: string;
  sellerAlias: string;
  storeName: string;
  marketplaceCode: string;
  waiverType: string;
  waiverPercentage: number;
  fullWaiver: boolean;
  reason: string;
  status: string;
};

export type FreeProductRule = {
  ruleId: string;
  marketplaceCode: string;
  categoryCode: string;
  countryCode: string;
  productType: string;
  sellerEligibility: string;
  buyerEligibility: string;
  accountVerificationRequired: boolean;
  maxClaimsPerBuyer: number;
  antiAbuseLevel: string;
  secureDeliveryRequired: boolean;
  orderAccessRecordRequired: boolean;
  status: string;
};

export type PricingSimulationResponse = {
  buyerDisplay: BuyerPricingDisplay;
  sellerDisplay: SellerPricingDisplay;
  adminBreakdown: {
    buyerServiceFeeRule: string;
    sellerCommissionRule: string;
    couponFundingAllocation: string;
    feeWaiverApplied: boolean;
    platformFundedDiscount: number;
    sellerFundedDiscount: number;
    internalRulePriority: string;
    ruleVersions: string[];
  };
  winningRules: string[];
  conflictWarnings: string[];
};

export type BuyerPricingDisplay = {
  itemPrice: number;
  sellerDiscount: number;
  platformDiscount: number;
  buyerServiceFee: number;
  sharityCreditApplied: number;
  total: number;
  couponAppliedMessage: string;
  freePromoMessage: string;
  currency: string;
};

export type SellerPricingDisplay = {
  sellerCouponImpact: number;
  sellerSafeCommissionSummary: string;
  estimatedSellerReceives: number;
  feeWaiverStatus: string;
  platformCouponImpactOnSellerPayout: string;
  payoutHoldReserveImpact: string;
  currency: string;
};

export type PricingAuditLogItem = {
  auditId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSummary: string;
  afterSummary: string;
  reason: string;
  version: number;
  createdAt: string;
};

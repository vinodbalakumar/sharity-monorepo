export type CreditType =
  | 'PLATFORM_CREDIT'
  | 'REFUND_CREDIT'
  | 'PROMOTIONAL_CREDIT'
  | 'REFERRAL_REWARD_CREDIT_LATER'
  | 'GIVEAWAY_REWARD'
  | 'FIRST_ORDER_REWARD'
  | 'SELLER_FUNDED_REWARD_LATER'
  | 'ADMIN_MANUAL_CREDIT'
  | 'GOODWILL_SUPPORT_CREDIT'
  | 'LOYALTY_REWARD_LATER';

export type CreditTypeBalance = {
  creditType: CreditType;
  amount: number;
  refundBehavior: string;
  expiryBehavior: string;
  affectsSellerPayout: boolean;
};

export type SharityCreditBalance = {
  availableBalance: number;
  expiringSoonAmount: number;
  currency: string;
  expiryDate: string;
  typeBreakdown: CreditTypeBalance[];
};

export type CreditHistoryItem = {
  historyId: string;
  type: CreditType;
  amount: number;
  currency: string;
  status: string;
  date: string;
  expiryDate?: string;
  relatedOrderId?: string;
  relatedCampaignId?: string;
  termsSummary: string;
};

export type RewardCampaignSummary = {
  campaignId: string;
  campaignName: string;
  creditRewardType: CreditType;
  fundingSource: string;
  amount: number;
  percentage: number;
  maxDiscount: number;
  marketplaceScope: string;
  categoryScope: string;
  countryScope: string;
  status: string;
  sellerPayoutImpact: string;
  refundBehavior: string;
  antiAbuseSummary: string;
  imageUrl: string;
  claimStatus: string;
};

export type GiveawayClaimRequest = {
  buyerAcceptedDigitalTerms: boolean;
};

export type GiveawayClaimResponse = {
  campaignId: string;
  status: string;
  parentOrderId?: string;
  accessRecordId?: string;
  message: string;
};

export type ApplyCreditRequest = {
  requestedAmount: number;
};

export type ApplyCreditResponse = {
  creditApplied: number;
  remainingCredit: number;
  totalAfterCredit: number;
  currency: string;
  allocation: CreditAllocationSummary;
  message: string;
};

export type CreditAllocationSummary = {
  checkoutSessionId: string;
  parentOrderId: string;
  totalCreditApplied: number;
  currency: string;
  items: CreditAllocationItem[];
};

export type CreditAllocationItem = {
  sellerOrderId: string;
  sellerId: string;
  allocatedCreditAmount: number;
  fundingSource: string;
  sellerPayoutAffected: boolean;
  sellerPayoutImpactAmount: number;
  refundBehavior: string;
};

export type SellerPromotionImpactResponse = {
  sellerOrderId: string;
  campaignName: string;
  campaignVisibleToSeller: boolean;
  sellerPayoutAffected: boolean;
  sellerSafePromoImpact: string;
  estimatedSellerReceives: number;
  currency: string;
  platformFundedNote: string;
  payoutHoldReserveImpact: string;
};

export type AntiAbuseSettings = {
  maxClaimsPerBuyer: number;
  maxClaimsPerDeviceLater: number;
  maxClaimsPerCampaign: number;
  countryEligibilityRequired: boolean;
  marketplaceCategoryEligibilityRequired: boolean;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  paymentMethodRequiredForHighRiskFreebies: boolean;
  backendRiskReviewEnabled: boolean;
  adminApprovalForSuspiciousClaims: boolean;
  cooldownPeriod: string;
};

export type RewardCampaignConfig = {
  campaignId: string;
  campaignName: string;
  creditRewardType: CreditType;
  fundingSource: string;
  amount: number;
  percentage: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  marketplaceScope: string;
  categoryScope: string;
  countryScope: string;
  buyerEligibility: string;
  sellerEligibility: string;
  usageLimit: string;
  refundBehavior: string;
  sellerPayoutImpact: string;
  antiAbuseSettings: AntiAbuseSettings;
  status: string;
};

export type ManualCreditIssueRequest = {
  userId: string;
  creditType: CreditType;
  amount: number;
  currency: string;
  reason: string;
  expiryDate: string;
  refundBehavior: string;
  marketplaceScope: string;
  categoryScope: string;
  countryScope: string;
  internalNote: string;
  userVisibleMessage: string;
};

export type RewardSimulationRequest = {
  buyerId: string;
  buyerCountry: string;
  sellerId: string;
  sellerCountry: string;
  marketplaceCode: string;
  categoryCode: string;
  productPrice: number;
  quantity: number;
  campaignId: string;
  creditType: CreditType;
  availableCreditBalance: number;
  couponCombination: string;
  freeProduct: boolean;
  refundScenario: string;
  checkoutDateTime: string;
};

export type RewardSimulationResponse = {
  eligible: boolean;
  buyerCreditApplied: number;
  buyerTotalAfterCredit: number;
  sellerPayoutImpact: string;
  platformFundedAmount: number;
  sellerFundedAmount: number;
  creditAllocation: CreditAllocationItem[];
  refundBehavior: string;
  antiAbuseResult: string;
  winningCampaignRules: string[];
  conflictWarnings: string[];
};

export type RewardsAuditLogItem = {
  auditId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSummary: string;
  afterSummary: string;
  reason: string;
  createdAt: string;
};

export type RewardAbuseReviewItem = {
  reviewId: string;
  campaignName: string;
  reviewReason: string;
  adminSafeExplanation: string;
  status: string;
};

export type RewardsDashboardResponse = {
  creditBalance: SharityCreditBalance;
  creditHistory: CreditHistoryItem[];
  availableRewards: RewardCampaignSummary[];
  creditAllocation: CreditAllocationSummary;
  sellerPromotionImpact: SellerPromotionImpactResponse;
  campaigns: RewardCampaignConfig[];
  creditIssuance: CreditHistoryItem[];
  creditRedemption: CreditHistoryItem[];
  giveawayClaims: RewardCampaignSummary[];
  auditLog: RewardsAuditLogItem[];
  abuseQueue: RewardAbuseReviewItem[];
  simulation: RewardSimulationResponse;
};

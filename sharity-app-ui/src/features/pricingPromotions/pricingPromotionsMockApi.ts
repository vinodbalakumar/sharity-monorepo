import type { CouponRule, FeeWaiverSellerRule, FreeProductRule, PricingAuditLogItem, PricingRule, PricingSimulationResponse } from './pricingPromotionsTypes';

const now = new Date().toISOString();

export async function getPricingRules(): Promise<PricingRule[]> {
  return [
    rule('rule-buyer-service', 'Buyer service fee fixed + percentage', 'BUYER_SERVICE_FEE', 'MARKETPLACE', 'DIGITAL', 'ALL', 'USA', 'FIXED_PLUS_PERCENTAGE', 1.5, 1.25, 1, 8, 10, 'ACTIVE'),
    rule('rule-seller-commission', 'Digital seller commission percentage', 'SELLER_COMMISSION', 'CATEGORY', 'DIGITAL', 'GIFT_CARDS', 'USA', 'PERCENTAGE', 0, 8.5, 0, 50, 20, 'ACTIVE'),
    rule('rule-new-seller-max', 'New seller max order value', 'NEW_SELLER_MAX_ORDER_VALUE', 'SELLER_SEGMENT', 'ALL', 'ALL', 'USA', 'MAX_ORDER_VALUE', 100, 0, 0, 100, 30, 'ACTIVE'),
    rule('rule-risk-hold', 'High-risk product hold', 'HIGH_RISK_PRODUCT_FEE_HOLD', 'CATEGORY', 'DIGITAL', 'GAMING_CODE', 'USA', 'PERCENTAGE_HOLD', 0, 15, 0, 200, 40, 'DRAFT')
  ];
}

export async function getCoupons(): Promise<CouponRule[]> {
  return [
    coupon('coupon-seller5', 'SELLER5', 'SELLER_COUPON', 'SELLER_FUNDED', 5, 0, true),
    coupon('coupon-sharity10', 'SHARITY10', 'PLATFORM_COUPON', 'PLATFORM_FUNDED', 10, 0, true),
    coupon('coupon-first', 'FIRSTORDER', 'FIRST_ORDER_COUPON', 'PLATFORM_FUNDED', 0, 10, false)
  ];
}

export async function getFeeWaivers(): Promise<FeeWaiverSellerRule[]> {
  return [
    { feeWaiverId: 'waiver-001', sellerId: 'seller-gamecodehub', sellerAlias: 'GameCodeHub', storeName: 'Game Code Hub', marketplaceCode: 'DIGITAL', waiverType: 'PARTIAL_COMMISSION_WAIVER', waiverPercentage: 50, fullWaiver: false, reason: 'Launch promotion', status: 'ACTIVE' }
  ];
}

export async function getFreeProductRules(): Promise<FreeProductRule[]> {
  return [
    { ruleId: 'free-001', marketplaceCode: 'DIGITAL', categoryCode: 'DOWNLOADS', countryCode: 'USA', productType: 'FREE_DIGITAL_DOWNLOAD', sellerEligibility: 'VERIFIED_SELLERS', buyerEligibility: 'VERIFIED_ACCOUNT', accountVerificationRequired: true, maxClaimsPerBuyer: 1, antiAbuseLevel: 'STRICT', secureDeliveryRequired: true, orderAccessRecordRequired: true, status: 'ACTIVE' }
  ];
}

export async function runSimulation(): Promise<PricingSimulationResponse> {
  return {
    buyerDisplay: { itemPrice: 100, sellerDiscount: 5, platformDiscount: 10, buyerServiceFee: 3, sharityCreditApplied: 0, total: 88, couponAppliedMessage: 'Seller + platform coupon stack allowed.', freePromoMessage: 'Free promo not applied.', currency: 'USD' },
    sellerDisplay: { sellerCouponImpact: 5, sellerSafeCommissionSummary: '8.5% digital category commission before fee waiver.', estimatedSellerReceives: 86.93, feeWaiverStatus: 'Partial launch waiver active.', platformCouponImpactOnSellerPayout: 'No seller payout impact.', payoutHoldReserveImpact: 'No reserve for this simulation.', currency: 'USD' },
    adminBreakdown: { buyerServiceFeeRule: 'rule-buyer-service v10', sellerCommissionRule: 'rule-seller-commission v20', couponFundingAllocation: 'Platform funds SHARITY10, seller funds SELLER5.', feeWaiverApplied: true, platformFundedDiscount: 10, sellerFundedDiscount: 5, internalRulePriority: 'Country > marketplace > category > seller override.', ruleVersions: ['rule-buyer-service:v10', 'rule-seller-commission:v20'] },
    winningRules: ['Buyer service fee fixed + percentage', 'Digital seller commission percentage', 'Seller fee waiver active'],
    conflictWarnings: ['Fee waiver and promotional commission overlap: fee waiver wins by priority.']
  };
}

export async function getAuditLog(): Promise<PricingAuditLogItem[]> {
  return [
    { auditId: 'audit-001', actorName: 'Pricing Admin', action: 'Pricing rule edited', entityType: 'PRICING_RULE', entityId: 'rule-buyer-service', beforeSummary: '1.0% + $1', afterSummary: '1.25% + $1.50', reason: 'Marketplace safety funding', version: 10, createdAt: now },
    { auditId: 'audit-002', actorName: 'Promo Admin', action: 'Coupon created', entityType: 'COUPON_RULE', entityId: 'coupon-sharity10', beforeSummary: 'None', afterSummary: 'SHARITY10 platform-funded', reason: 'Launch promotion', version: 1, createdAt: now }
  ];
}

function rule(ruleId: string, ruleName: string, ruleType: string, scope: string, marketplaceCode: string, categoryCode: string, countryCode: string, feeModel: string, fixedAmount: number, percentage: number, minAmount: number, maxAmount: number, priority: number, status: string): PricingRule {
  return { ruleId, ruleName, ruleType, scope, marketplaceCode, categoryCode, countryCode, feeModel, fixedAmount, percentage, minAmount, maxAmount, currency: 'USD', priority, effectiveStart: now, version: priority, status };
}

function coupon(couponId: string, couponCode: string, couponType: string, fundingSource: string, fixedAmount: number, percentage: number, stackable: boolean): CouponRule {
  return { couponId, couponCode, couponType, fundingSource, discountModel: fixedAmount > 0 ? 'FIXED' : 'PERCENTAGE', fixedAmount, percentage, maxDiscount: fixedAmount || 20, minOrderValue: 10, marketplaceCode: 'DIGITAL', categoryCode: 'ALL', countryCode: 'USA', firstOrderOnly: couponType === 'FIRST_ORDER_COUPON', stackable, status: 'ACTIVE' };
}

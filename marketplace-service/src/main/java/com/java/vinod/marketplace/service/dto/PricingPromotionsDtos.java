package com.java.vinod.marketplace.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Pricing, Fees & Promotions contracts for STORY-037.
 */
public final class PricingPromotionsDtos {
    private PricingPromotionsDtos() {
    }

    public record PricingRule(String ruleId, String ruleName, String ruleType, String scope,
                              String marketplaceCode, String categoryCode, String countryCode,
                              String sellerId, String feeModel, BigDecimal fixedAmount,
                              BigDecimal percentage, BigDecimal minAmount, BigDecimal maxAmount,
                              String currency, int priority, LocalDateTime effectiveStart,
                              LocalDateTime effectiveEnd, int version, String status,
                              String createdBy, String updatedBy, LocalDateTime createdAt,
                              LocalDateTime updatedAt) {
    }

    public record CouponRule(String couponId, String couponCode, String couponType, String fundingSource,
                             String discountModel, BigDecimal fixedAmount, BigDecimal percentage,
                             BigDecimal maxDiscount, BigDecimal minOrderValue, String marketplaceCode,
                             String categoryCode, String countryCode, String sellerId,
                             boolean firstOrderOnly, int usageLimitPerBuyer, int totalUsageLimit,
                             boolean stackable, LocalDateTime startDate, LocalDateTime endDate,
                             String status) {
    }

    public record FeeWaiverSellerRule(String feeWaiverId, String sellerId, String sellerAlias,
                                      String storeName, String marketplaceCode, String categoryCode,
                                      String countryCode, String waiverType, BigDecimal waiverPercentage,
                                      BigDecimal waiverFixedAmount, boolean fullWaiver, String reason,
                                      String approvedBy, LocalDateTime effectiveStart,
                                      LocalDateTime effectiveEnd, String status) {
    }

    public record FreeProductRule(String ruleId, String marketplaceCode, String categoryCode,
                                  String countryCode, String productType, String sellerEligibility,
                                  String buyerEligibility, boolean accountVerificationRequired,
                                  int maxClaimsPerBuyer, int maxClaimsGlobal,
                                  LocalDateTime startDate, LocalDateTime endDate,
                                  String antiAbuseLevel, boolean secureDeliveryRequired,
                                  boolean orderAccessRecordRequired, String status) {
    }

    public record PricingSimulationRequest(String buyerCountry, String sellerCountry, String marketplaceCode,
                                           String categoryCode, String sellerId, BigDecimal productPrice,
                                           int quantity, String productType, String sellerCouponCode,
                                           String platformCouponCode, boolean freeProduct,
                                           boolean newSeller, boolean highRisk,
                                           boolean feeWaiverCandidate,
                                           BigDecimal sharityCreditPlaceholderAmount,
                                           LocalDateTime checkoutDateTime) {
    }

    public record PricingSimulationResponse(BuyerPricingDisplay buyerDisplay,
                                            SellerPricingDisplay sellerDisplay,
                                            AdminPricingBreakdown adminBreakdown,
                                            List<String> winningRules,
                                            List<String> conflictWarnings,
                                            PricingSnapshot pricingSnapshotPreview) {
    }

    public record BuyerPricingDisplay(BigDecimal itemPrice, BigDecimal sellerDiscount,
                                      BigDecimal platformDiscount, BigDecimal buyerServiceFee,
                                      BigDecimal sharityCreditApplied, BigDecimal total,
                                      String couponAppliedMessage, String freePromoMessage,
                                      String currency) {
    }

    public record SellerPricingDisplay(BigDecimal sellerCouponImpact,
                                       String sellerSafeCommissionSummary,
                                       BigDecimal estimatedSellerReceives,
                                       String feeWaiverStatus,
                                       String platformCouponImpactOnSellerPayout,
                                       String payoutHoldReserveImpact, String currency) {
    }

    public record AdminPricingBreakdown(String buyerServiceFeeRule, String sellerCommissionRule,
                                        String couponFundingAllocation, boolean feeWaiverApplied,
                                        String freeProductEligibility, String riskHoldPricingRule,
                                        BigDecimal platformFundedDiscount, BigDecimal sellerFundedDiscount,
                                        String internalRulePriority, List<String> ruleVersions) {
    }

    public record PricingSnapshot(String snapshotId, String checkoutSessionId, String parentOrderId,
                                  String sellerOrderId, List<String> ruleVersions,
                                  BigDecimal buyerServiceFee, BigDecimal sellerCommission,
                                  String sellerCoupon, String platformCoupon,
                                  String couponFundingAllocation, boolean feeWaiverApplied,
                                  String freePromoEligibility, BigDecimal sellerReceivesEstimate,
                                  BigDecimal buyerTotal, String currency, LocalDateTime timestamp) {
    }

    public record PricingAuditLogItem(String auditId, String actorId, String actorName, String action,
                                      String entityType, String entityId, String beforeSummary,
                                      String afterSummary, String reason, int version,
                                      LocalDateTime createdAt) {
    }

    public static List<PricingRule> rules() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(rule("rule-buyer-service", "Buyer service fee fixed + percentage", "BUYER_SERVICE_FEE", 10, "ACTIVE", now),
                rule("rule-seller-commission", "Digital seller commission percentage", "SELLER_COMMISSION", 20, "ACTIVE", now),
                rule("rule-risk-hold", "High-risk product hold", "HIGH_RISK_PRODUCT_FEE_HOLD", 40, "DRAFT", now));
    }

    public static List<CouponRule> coupons() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(new CouponRule("coupon-seller5", "SELLER5", "SELLER_COUPON", "SELLER_FUNDED",
                        "FIXED", money("5"), money("0"), money("5"), money("10"), "DIGITAL", "ALL", "USA",
                        "seller-gamecodehub", false, 1, 1000, true, now.minusDays(1), now.plusDays(60), "ACTIVE"),
                new CouponRule("coupon-sharity10", "SHARITY10", "PLATFORM_COUPON", "PLATFORM_FUNDED",
                        "FIXED", money("10"), money("0"), money("10"), money("10"), "DIGITAL", "ALL", "USA",
                        null, false, 1, 5000, true, now.minusDays(1), now.plusDays(60), "ACTIVE"));
    }

    public static List<FeeWaiverSellerRule> waivers() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(new FeeWaiverSellerRule("waiver-001", "seller-gamecodehub", "GameCodeHub",
                "Game Code Hub", "DIGITAL", "ALL", "USA", "PARTIAL_COMMISSION_WAIVER",
                money("50"), money("0"), false, "Launch promotion", "Pricing Admin",
                now.minusDays(1), now.plusDays(90), "ACTIVE"));
    }

    public static List<FreeProductRule> freeRules() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(new FreeProductRule("free-001", "DIGITAL", "DOWNLOADS", "USA",
                "FREE_DIGITAL_DOWNLOAD", "VERIFIED_SELLERS", "VERIFIED_ACCOUNT", true,
                1, 1000, now.minusDays(1), now.plusDays(30), "STRICT", true, true, "ACTIVE"));
    }

    public static PricingSimulationResponse simulation() {
        BuyerPricingDisplay buyer = new BuyerPricingDisplay(money("100"), money("5"), money("10"),
                money("3"), money("0"), money("88"), "Seller + platform coupon stack allowed.",
                "Free promo not applied.", "USD");
        SellerPricingDisplay seller = new SellerPricingDisplay(money("5"),
                "8.5% digital category commission before fee waiver.", money("86.93"),
                "Partial launch waiver active.", "No seller payout impact.", "No reserve.", "USD");
        AdminPricingBreakdown admin = new AdminPricingBreakdown("rule-buyer-service v10",
                "rule-seller-commission v20", "Platform funds SHARITY10, seller funds SELLER5.",
                true, "Not eligible", "No hold", money("10"), money("5"),
                "Country > marketplace > category > seller", List.of("rule-buyer-service:v10"));
        PricingSnapshot snapshot = new PricingSnapshot("snapshot-preview", "checkout-session-1000",
                "parent-order-1000", "seller-order-a", List.of("rule-buyer-service:v10"),
                money("3"), money("8.07"), "SELLER5", "SHARITY10", "PLATFORM_FUNDED",
                true, "NONE", money("86.93"), money("88"), "USD", LocalDateTime.now());
        return new PricingSimulationResponse(buyer, seller, admin, List.of("Buyer service fee", "Seller commission"),
                List.of("Fee waiver and promotional commission overlap: fee waiver wins."), snapshot);
    }

    public static List<PricingAuditLogItem> audit() {
        return List.of(new PricingAuditLogItem("audit-001", "admin-1", "Pricing Admin",
                "Pricing rule edited", "PRICING_RULE", "rule-buyer-service", "1.0% + $1",
                "1.25% + $1.50", "Marketplace safety funding", 10, LocalDateTime.now()));
    }

    private static PricingRule rule(String id, String name, String type, int version, String status, LocalDateTime now) {
        return new PricingRule(id, name, type, "MARKETPLACE", "DIGITAL", "ALL", "USA", null,
                "FIXED_PLUS_PERCENTAGE", money("1.50"), money("1.25"), money("1"), money("8"),
                "USD", version, now.minusDays(1), now.plusDays(365), version, status,
                "Pricing Admin", "Pricing Admin", now.minusDays(1), now);
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}

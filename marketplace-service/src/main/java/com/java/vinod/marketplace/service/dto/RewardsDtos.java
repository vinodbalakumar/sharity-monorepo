package com.java.vinod.marketplace.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Sharity Credit, Rewards & Giveaway contracts for STORY-038.
 */
public final class RewardsDtos {
    private RewardsDtos() {
    }

    public record RewardsDashboardResponse(SharityCreditBalance creditBalance, List<CreditHistoryItem> creditHistory,
                                           List<RewardCampaignSummary> availableRewards,
                                           CreditAllocationSummary creditAllocation,
                                           SellerPromotionImpactResponse sellerPromotionImpact,
                                           List<RewardCampaignConfig> campaigns,
                                           List<CreditHistoryItem> creditIssuance,
                                           List<CreditHistoryItem> creditRedemption,
                                           List<RewardCampaignSummary> giveawayClaims,
                                           List<RewardAbuseReviewItem> abuseQueue,
                                           RewardSimulationResponse simulation,
                                           List<RewardsAuditLogItem> auditLog) {
    }

    public record SharityCreditBalance(BigDecimal availableBalance, BigDecimal expiringSoonAmount, String currency,
                                       LocalDateTime expiryDate, List<CreditTypeBalance> typeBreakdown) {
    }

    public record CreditTypeBalance(String creditType, BigDecimal amount, String refundBehavior,
                                    String expiryBehavior, boolean affectsSellerPayout) {
    }

    public record CreditHistoryItem(String historyId, String type, BigDecimal amount, String currency, String status,
                                    LocalDateTime date, LocalDateTime expiryDate, String relatedOrderId,
                                    String relatedCampaignId, String termsSummary) {
    }

    public record RewardCampaignSummary(String campaignId, String campaignName, String creditRewardType,
                                        String fundingSource, BigDecimal amount, BigDecimal percentage,
                                        BigDecimal maxDiscount, String marketplaceScope, String categoryScope,
                                        String countryScope, String status, String sellerPayoutImpact,
                                        String refundBehavior, String antiAbuseSummary, String claimStatus) {
    }

    public record GiveawayClaimRequest(boolean buyerAcceptedDigitalTerms) {
    }

    public record GiveawayClaimResponse(String campaignId, String status, String parentOrderId,
                                        String accessRecordId, String message) {
    }

    public record ApplyCreditRequest(BigDecimal requestedAmount) {
    }

    public record ApplyCreditResponse(BigDecimal creditApplied, BigDecimal remainingCredit,
                                      BigDecimal totalAfterCredit, String currency,
                                      CreditAllocationSummary allocation, String message) {
    }

    public record CreditAllocationSummary(String checkoutSessionId, String parentOrderId,
                                          BigDecimal totalCreditApplied, String currency,
                                          List<CreditAllocationItem> items) {
    }

    public record CreditAllocationItem(String sellerOrderId, String sellerId, BigDecimal allocatedCreditAmount,
                                       String fundingSource, boolean sellerPayoutAffected,
                                       BigDecimal sellerPayoutImpactAmount, String refundBehavior) {
    }

    public record SellerPromotionImpactResponse(String sellerOrderId, String campaignName,
                                                boolean campaignVisibleToSeller, boolean sellerPayoutAffected,
                                                String sellerSafePromoImpact, BigDecimal estimatedSellerReceives,
                                                String currency, String platformFundedNote,
                                                String payoutHoldReserveImpact) {
    }

    public record RewardCampaignConfig(String campaignId, String campaignName, String creditRewardType,
                                       String fundingSource, BigDecimal amount, BigDecimal percentage,
                                       BigDecimal maxDiscount, LocalDateTime startDate, LocalDateTime endDate,
                                       String marketplaceScope, String categoryScope, String countryScope,
                                       String buyerEligibility, String sellerEligibility, String usageLimit,
                                       String refundBehavior, String sellerPayoutImpact,
                                       AntiAbuseSettings antiAbuseSettings, String status) {
    }

    public record AntiAbuseSettings(int maxClaimsPerBuyer, int maxClaimsPerDeviceLater,
                                    int maxClaimsPerCampaign, boolean countryEligibilityRequired,
                                    boolean marketplaceCategoryEligibilityRequired,
                                    boolean emailVerificationRequired, boolean phoneVerificationRequired,
                                    boolean paymentMethodRequiredForHighRiskFreebies,
                                    boolean backendRiskReviewEnabled,
                                    boolean adminApprovalForSuspiciousClaims, String cooldownPeriod) {
    }

    public record ManualCreditIssueRequest(String userId, String creditType, BigDecimal amount, String currency,
                                           String reason, LocalDateTime expiryDate, String refundBehavior,
                                           String marketplaceScope, String categoryScope, String countryScope,
                                           String internalNote, String userVisibleMessage) {
    }

    public record RewardSimulationRequest(String buyerId, String buyerCountry, String sellerId,
                                          String sellerCountry, String marketplaceCode, String categoryCode,
                                          BigDecimal productPrice, int quantity, String campaignId,
                                          String creditType, BigDecimal availableCreditBalance,
                                          String couponCombination, boolean freeProduct, String refundScenario,
                                          LocalDateTime checkoutDateTime) {
    }

    public record RewardSimulationResponse(boolean eligible, BigDecimal buyerCreditApplied,
                                           BigDecimal buyerTotalAfterCredit, String sellerPayoutImpact,
                                           BigDecimal platformFundedAmount, BigDecimal sellerFundedAmount,
                                           List<CreditAllocationItem> creditAllocation, String refundBehavior,
                                           String antiAbuseResult, List<String> winningCampaignRules,
                                           List<String> conflictWarnings) {
    }

    public record RewardsAuditLogItem(String auditId, String actorId, String actorName, String action,
                                      String entityType, String entityId, String beforeSummary,
                                      String afterSummary, String reason, LocalDateTime createdAt) {
    }

    public record RewardAbuseReviewItem(String reviewId, String campaignName, String reviewReason,
                                        String adminSafeExplanation, String status) {
    }

    public static RewardsDashboardResponse dashboard() {
        List<CreditAllocationItem> allocationItems = allocationItems();
        CreditAllocationSummary allocation = new CreditAllocationSummary("checkout-session-1000", "parent-order-1000",
                money("10"), "USD", allocationItems);
        List<RewardCampaignSummary> campaigns = campaigns();
        return new RewardsDashboardResponse(balance(), history(), campaigns, allocation, sellerImpact(),
                campaigns.stream().map(RewardsDtos::config).toList(), history(), history(), campaigns,
                List.of(new RewardAbuseReviewItem("review-1", "Free Digital Starter Pack",
                        "Verification required for repeated giveaway claim",
                        "Raw IP/device risk payload remains backend-only.", "PENDING_REVIEW")),
                simulation(), List.of(new RewardsAuditLogItem("audit-rewards-1", "admin-1", "Promotion Admin",
                        "Reward campaign simulated", "REWARD_CAMPAIGN", "camp-first-order", "Draft",
                        "Eligible", "Launch readiness", LocalDateTime.now())));
    }

    public static SharityCreditBalance balance() {
        return new SharityCreditBalance(money("10"), money("3"), "USD", LocalDateTime.now().plusDays(40),
                List.of(new CreditTypeBalance("PLATFORM_CREDIT", money("5"),
                                "May return based on campaign policy", "Expires with campaign", false),
                        new CreditTypeBalance("REFUND_CREDIT", money("3"),
                                "Returns to credit balance when eligible", "Keeps refund-credit expiry", false),
                        new CreditTypeBalance("PROMOTIONAL_CREDIT", money("2"),
                                "May expire and not return", "Expires on campaign date", false)));
    }

    public static List<CreditHistoryItem> history() {
        return List.of(new CreditHistoryItem("hist-1", "PLATFORM_CREDIT", money("5"), "USD",
                        "Issued", LocalDateTime.now().minusDays(5), LocalDateTime.now().plusDays(40),
                        "parent-order-1000", "camp-first-order", "Backend-controlled rules."),
                new CreditHistoryItem("hist-2", "PROMOTIONAL_CREDIT", money("-2"), "USD",
                        "Applied to checkout", LocalDateTime.now().minusDays(2), LocalDateTime.now().plusDays(40),
                        "parent-order-1000", "camp-first-order", "Traceable multi-seller allocation."));
    }

    public static List<RewardCampaignSummary> campaigns() {
        return List.of(campaign("camp-first-order", "First Order Reward", "FIRST_ORDER_REWARD", money("5"), "Claimed"),
                campaign("camp-giveaway", "Free Digital Starter Pack", "GIVEAWAY_REWARD", money("0"), "Available"),
                campaign("camp-goodwill", "Support Goodwill Credit", "GOODWILL_SUPPORT_CREDIT", money("10"), "Eligible"));
    }

    public static CreditAllocationSummary allocation() {
        return new CreditAllocationSummary("checkout-session-1000", "parent-order-1000",
                money("10"), "USD", allocationItems());
    }

    public static SellerPromotionImpactResponse sellerImpact() {
        return new SellerPromotionImpactResponse("seller-order-a", "First Order Reward", true,
                false, "Buyer used platform-funded Sharity Credit.", money("86.93"), "USD",
                "Platform-funded credit does not reduce seller payout by default.",
                "No payout hold or reserve impact for this promotion.");
    }

    public static RewardSimulationResponse simulation() {
        return new RewardSimulationResponse(true, money("10"), money("37"),
                "Seller payout unchanged because campaign is platform funded.", money("10"), money("0"),
                allocationItems(), "Refund credit can return; promotional credit may not return.",
                "Verified account, country eligible, claim limit available.",
                List.of("PLATFORM_CREDIT", "FIRST_ORDER_REWARD"),
                List.of("Seller-funded rewards are later-phase placeholders."));
    }

    private static List<CreditAllocationItem> allocationItems() {
        return List.of(new CreditAllocationItem("seller-order-a", "seller-gamecodehub", money("6"),
                        "PLATFORM_FUNDED", false, money("0"), "Promotional credit may not return after refund"),
                new CreditAllocationItem("seller-order-b", "seller-softvault", money("4"),
                        "PLATFORM_FUNDED", false, money("0"), "Refund credit returns to credit balance when eligible"));
    }

    private static RewardCampaignSummary campaign(String id, String name, String type, BigDecimal amount, String claimStatus) {
        return new RewardCampaignSummary(id, name, type, "PLATFORM_FUNDED", amount, money("0"), amount,
                "DIGITAL", "ALL", "USA", "ACTIVE", "Seller payout unchanged by default",
                "Campaign-controlled refundability", "Verified account, country eligibility, claim limits, cooldown",
                claimStatus);
    }

    private static RewardCampaignConfig config(RewardCampaignSummary summary) {
        return new RewardCampaignConfig(summary.campaignId(), summary.campaignName(), summary.creditRewardType(),
                summary.fundingSource(), summary.amount(), summary.percentage(), summary.maxDiscount(),
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(60), summary.marketplaceScope(),
                summary.categoryScope(), summary.countryScope(), "Verified account", "Verified sellers",
                "1 per buyer, 1000 max", summary.refundBehavior(), summary.sellerPayoutImpact(),
                new AntiAbuseSettings(1, 1, 1000, true, true, true, false,
                        true, true, true, "24 hours"), summary.status());
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}

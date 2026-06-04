package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.RewardsDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RewardsMockController {
    @GetMapping("/api/rewards/dashboard")
    public RewardsDtos.RewardsDashboardResponse dashboard() { return RewardsDtos.dashboard(); }
    @GetMapping("/api/rewards/credit-balance")
    public RewardsDtos.SharityCreditBalance balance() { return RewardsDtos.balance(); }
    @GetMapping("/api/rewards/credit-history")
    public List<RewardsDtos.CreditHistoryItem> history() { return RewardsDtos.history(); }
    @GetMapping("/api/rewards/available")
    public List<RewardsDtos.RewardCampaignSummary> available() { return RewardsDtos.campaigns(); }
    @PostMapping("/api/rewards/giveaways/{campaignId}/claim")
    public RewardsDtos.GiveawayClaimResponse claim(@PathVariable String campaignId, @RequestBody(required = false) RewardsDtos.GiveawayClaimRequest request) {
        return new RewardsDtos.GiveawayClaimResponse(campaignId, "CLAIMED", "parent-order-free-001", "access-free-001",
                "Giveaway claimed. Free digital order/access record created.");
    }
    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/credit/apply")
    public RewardsDtos.ApplyCreditResponse apply(@PathVariable String checkoutSessionId, @RequestBody(required = false) RewardsDtos.ApplyCreditRequest request) {
        return new RewardsDtos.ApplyCreditResponse(new java.math.BigDecimal("10"), java.math.BigDecimal.ZERO,
                new java.math.BigDecimal("37"), "USD", RewardsDtos.allocation(),
                "Sharity Credit applied to checkout mock allocation.");
    }
    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/credit/remove")
    public RewardsDtos.ApplyCreditResponse remove(@PathVariable String checkoutSessionId) {
        return new RewardsDtos.ApplyCreditResponse(java.math.BigDecimal.ZERO, new java.math.BigDecimal("10"),
                new java.math.BigDecimal("47"), "USD", RewardsDtos.allocation(),
                "Sharity Credit removed and checkout repriced.");
    }
    @GetMapping("/api/checkout/sessions/{checkoutSessionId}/credit/allocation")
    public RewardsDtos.CreditAllocationSummary allocation(@PathVariable String checkoutSessionId) { return RewardsDtos.allocation(); }
    @GetMapping("/api/seller/orders/{sellerOrderId}/promotion-impact")
    public RewardsDtos.SellerPromotionImpactResponse sellerImpact(@PathVariable String sellerOrderId) { return RewardsDtos.sellerImpact(); }
    @GetMapping("/api/seller/promotions/summary")
    public RewardsDtos.SellerPromotionImpactResponse sellerSummary() { return RewardsDtos.sellerImpact(); }
    @GetMapping("/api/admin/rewards/campaigns")
    public List<RewardsDtos.RewardCampaignConfig> campaigns() { return RewardsDtos.dashboard().campaigns(); }
    @PostMapping("/api/admin/rewards/campaigns")
    public RewardsDtos.RewardCampaignConfig createCampaign(@RequestBody(required = false) Object request) { return RewardsDtos.dashboard().campaigns().get(0); }
    @PatchMapping("/api/admin/rewards/campaigns/{campaignId}")
    public RewardsDtos.RewardCampaignConfig updateCampaign(@PathVariable String campaignId, @RequestBody(required = false) Object request) { return RewardsDtos.dashboard().campaigns().get(0); }
    @PostMapping("/api/admin/rewards/campaigns/{campaignId}/disable")
    public RewardsDtos.RewardCampaignConfig disableCampaign(@PathVariable String campaignId) { return RewardsDtos.dashboard().campaigns().get(0); }
    @PostMapping("/api/admin/rewards/manual-credit")
    public RewardsDtos.CreditHistoryItem manualCredit(@RequestBody(required = false) RewardsDtos.ManualCreditIssueRequest request) { return RewardsDtos.history().get(0); }
    @GetMapping("/api/admin/rewards/credit-issuance")
    public List<RewardsDtos.CreditHistoryItem> issuance() { return RewardsDtos.history(); }
    @GetMapping("/api/admin/rewards/credit-redemption")
    public List<RewardsDtos.CreditHistoryItem> redemption() { return RewardsDtos.history(); }
    @GetMapping("/api/admin/rewards/giveaway-claims")
    public List<RewardsDtos.RewardCampaignSummary> claims() { return RewardsDtos.campaigns(); }
    @GetMapping("/api/admin/rewards/abuse-review")
    public List<RewardsDtos.RewardAbuseReviewItem> abuseReview() { return RewardsDtos.dashboard().abuseQueue(); }
    @PostMapping("/api/admin/rewards/abuse-review/{reviewId}/resolve")
    public RewardsDtos.RewardAbuseReviewItem resolve(@PathVariable String reviewId, @RequestBody(required = false) Object request) {
        return new RewardsDtos.RewardAbuseReviewItem(reviewId, "Free Digital Starter Pack", "Resolved", "Admin decision recorded.", "RESOLVED");
    }
    @PostMapping("/api/admin/rewards/simulate")
    public RewardsDtos.RewardSimulationResponse simulate(@RequestBody(required = false) RewardsDtos.RewardSimulationRequest request) { return RewardsDtos.simulation(); }
    @GetMapping("/api/admin/rewards/audit-log")
    public List<RewardsDtos.RewardsAuditLogItem> audit() { return RewardsDtos.dashboard().auditLog(); }
}

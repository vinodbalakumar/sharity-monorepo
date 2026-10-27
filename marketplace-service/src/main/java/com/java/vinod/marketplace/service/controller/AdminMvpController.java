package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.AdminMvpDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AdminMvpController {
    @GetMapping("/admin/access")
    public AdminMvpDtos.AdminAccessStatus adminAccess() {
        return AdminMvpDtos.accessGranted();
    }

    @GetMapping("/admin/access-denied")
    public AdminMvpDtos.AdminAccessStatus adminAccessDenied() {
        return AdminMvpDtos.accessDenied();
    }

    @GetMapping({"/admin/config", "/admin/config/summary"})
    public AdminMvpDtos.AdminConfigDashboardResponse adminConfig() {
        return AdminMvpDtos.configDashboard("marketplaces");
    }

    @GetMapping("/admin/config/{configArea}")
    public AdminMvpDtos.AdminConfigDetail adminConfigArea(@PathVariable String configArea) {
        return AdminMvpDtos.configDetail(configArea);
    }

    @GetMapping("/admin/config/{configArea}/actions")
    public AdminMvpDtos.AdminConfigActionEligibility adminConfigActions(@PathVariable String configArea) {
        return AdminMvpDtos.configActions();
    }

    @PostMapping("/admin/config/{configArea}/refresh")
    public AdminMvpDtos.AdminConfigActionResponse refreshAdminConfig(@PathVariable String configArea) {
        return AdminMvpDtos.adminAction("/admin/config/" + configArea);
    }

    @GetMapping("/admin/review/summary")
    public AdminMvpDtos.AdminReviewSummary adminReviewSummary() {
        return AdminMvpDtos.reviewDashboard().summary();
    }

    @GetMapping("/admin/review/queue")
    public List<AdminMvpDtos.AdminReviewQueueItem> adminReviewQueue() {
        return AdminMvpDtos.reviewQueue();
    }

    @GetMapping("/admin/review/items/{reviewItemId}")
    public AdminMvpDtos.AdminReviewItemDetail adminReviewItem(@PathVariable String reviewItemId) {
        return AdminMvpDtos.reviewDetail(reviewItemId);
    }

    @GetMapping("/admin/orders/{orderId}/review")
    public AdminMvpDtos.AdminReviewItemDetail adminOrderReview(@PathVariable String orderId) {
        return AdminMvpDtos.reviewDetail("review-order-" + orderId);
    }

    @GetMapping("/admin/refunds/{refundRequestId}/review")
    public AdminMvpDtos.AdminReviewItemDetail adminRefundReview(@PathVariable String refundRequestId) {
        return AdminMvpDtos.reviewDetail("review-refund-" + refundRequestId);
    }

    @GetMapping("/admin/disputes/{disputeId}/review")
    public AdminMvpDtos.AdminReviewItemDetail adminDisputeReview(@PathVariable String disputeId) {
        return AdminMvpDtos.reviewDetail("review-dispute-" + disputeId);
    }

    @GetMapping("/admin/digital-delivery-issues/{issueId}/review")
    public AdminMvpDtos.AdminReviewItemDetail adminDigitalIssueReview(@PathVariable String issueId) {
        return AdminMvpDtos.reviewDetail("review-delivery-" + issueId);
    }

    @GetMapping("/admin/payment-issues")
    public List<AdminMvpDtos.AdminReviewQueueItem> adminPaymentIssues() {
        return AdminMvpDtos.reviewQueue().stream()
                .filter(item -> "PAYMENT_ISSUE".equals(item.reviewType()))
                .toList();
    }

    @PostMapping("/admin/review/items/{reviewItemId}/refresh")
    public AdminMvpDtos.AdminReviewActionResponse refreshReviewItem(@PathVariable String reviewItemId) {
        return AdminMvpDtos.reviewAction("/admin/review/items/" + reviewItemId);
    }

    @GetMapping("/admin/review/items/{reviewItemId}/actions")
    public AdminMvpDtos.AdminReviewActionEligibility reviewActions(@PathVariable String reviewItemId) {
        return AdminMvpDtos.reviewActions();
    }

    @GetMapping("/admin/config/countries")
    public List<AdminMvpDtos.AdminCountryConfig> adminCountries() {
        return AdminMvpDtos.countries();
    }

    @GetMapping("/admin/config/countries/{countryCode}")
    public AdminMvpDtos.AdminCountryConfig adminCountry(@PathVariable String countryCode) {
        return AdminMvpDtos.countries().stream()
                .filter(country -> country.countryCode().equalsIgnoreCase(countryCode))
                .findFirst()
                .orElse(AdminMvpDtos.countries().get(0));
    }

    @GetMapping("/admin/config/marketplaces")
    public List<AdminMvpDtos.AdminMarketplaceConfig> adminMarketplaces() {
        return AdminMvpDtos.marketplaces();
    }

    @GetMapping("/admin/config/marketplaces/{marketplaceCode}")
    public AdminMvpDtos.AdminMarketplaceConfig adminMarketplace(@PathVariable String marketplaceCode) {
        return AdminMvpDtos.marketplaces().stream()
                .filter(marketplace -> marketplace.marketplaceCode().equalsIgnoreCase(marketplaceCode))
                .findFirst()
                .orElse(AdminMvpDtos.marketplaces().get(0));
    }

    @GetMapping("/admin/config/marketplace-country-rules")
    public AdminMvpDtos.AdminMarketplaceCountryConfigResponse marketplaceCountryRules() {
        return AdminMvpDtos.marketplaceCountryConfig();
    }

    @GetMapping("/admin/config/marketplace-country-rules/{countryCode}/{marketplaceCode}")
    public AdminMvpDtos.AdminMarketplaceCountryRule marketplaceCountryRule(@PathVariable String countryCode,
                                                                           @PathVariable String marketplaceCode) {
        return AdminMvpDtos.marketplaceRules().stream()
                .filter(rule -> rule.countryCode().equalsIgnoreCase(countryCode)
                        && rule.marketplaceCode().equalsIgnoreCase(marketplaceCode))
                .findFirst()
                .orElse(AdminMvpDtos.marketplaceRules().get(0));
    }

    @PostMapping("/admin/config/marketplace-country-rules/refresh")
    public AdminMvpDtos.AdminMarketplaceCountryActionResponse refreshMarketplaceCountryRules() {
        return AdminMvpDtos.marketplaceAction();
    }

    @GetMapping("/admin/config/marketplace-country-rules/actions")
    public AdminMvpDtos.AdminMarketplaceCountryActionEligibility marketplaceCountryActions() {
        return AdminMvpDtos.marketplaceActions();
    }

    @GetMapping({"/admin/config/fees-coupons", "/admin/config/platform-coupons",
            "/admin/config/buyer-service-fees", "/admin/config/seller-commissions",
            "/admin/config/seller-waivers", "/admin/config/seller-holds",
            "/admin/config/refund-rules", "/admin/config/risk-rules"})
    public AdminMvpDtos.AdminFeeCouponConfigResponse feeCouponConfig() {
        return AdminMvpDtos.feeCouponConfig(null);
    }

    @GetMapping("/admin/config/fees-coupons/{ruleId}")
    public AdminMvpDtos.AdminConfigRuleDetail feeCouponRule(@PathVariable String ruleId) {
        return AdminMvpDtos.ruleDetail(ruleId);
    }

    @PostMapping("/admin/config/fees-coupons/refresh")
    public AdminMvpDtos.AdminFeeCouponActionResponse refreshFeeCouponConfig() {
        return AdminMvpDtos.feeCouponAction();
    }

    @GetMapping("/admin/config/fees-coupons/actions")
    public AdminMvpDtos.AdminFeeCouponActionEligibility feeCouponActions() {
        return AdminMvpDtos.feeCouponActions();
    }

    @GetMapping("/mvp/final-qa")
    public AdminMvpDtos.FinalMvpQaResponse finalMvpQa() {
        return AdminMvpDtos.finalQa();
    }

    @GetMapping("/mvp/mock-users")
    public List<AdminMvpDtos.MvpMockUser> mockUsers() {
        return AdminMvpDtos.mockUsers();
    }

    @GetMapping("/mvp/route-guards")
    public List<AdminMvpDtos.MvpRouteGuardRule> routeGuards() {
        return AdminMvpDtos.routeGuards();
    }

    @GetMapping("/mvp/mock-data-bundles")
    public List<AdminMvpDtos.MvpMockDataBundle> mockDataBundles() {
        return AdminMvpDtos.mockDataBundles();
    }

    @GetMapping("/mvp/security-checks")
    public List<AdminMvpDtos.MvpQaCheck> securityChecks() {
        return AdminMvpDtos.qaChecks();
    }
}

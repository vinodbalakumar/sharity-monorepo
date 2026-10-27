package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class AdminOperationsDtos {
    private AdminOperationsDtos() {
    }

    public record AdminAccessResponse(boolean admin, List<String> roles, boolean accessGranted,
                                      String accessDeniedReason, String userSafeMessage) {}
    public record AdminDashboardResponse(AdminAccessResponse access, List<AdminModuleSummary> modules,
                                         List<String> highRiskActionTypes, String userSafeMessage,
                                         LocalDateTime updatedAt) {}
    public record AdminModuleSummary(String moduleCode, String title, int pendingCount, String severity,
                                     String route, String userSafeMessage) {}
    public record AdminActionEligibility(String actionCode, boolean allowed, boolean confirmationRequired,
                                         boolean twoStepApprovalRequired, List<String> disabledReasons) {}
    public record AdminActionResponse(boolean success, String status, String message, String nextRoute,
                                      boolean auditLogged, String approvalId, LocalDateTime updatedAt) {}
    public record AdminMarketplaceCountryRule(String ruleId, String countryCode, String marketplaceCode,
                                              boolean buyerEnabled, boolean sellerEnabled,
                                              boolean listingCreationEnabled, boolean checkoutEnabled,
                                              boolean digitalDeliveryEnabled, String defaultCurrency,
                                              String paymentProviderStatus, String policyVersionRequired,
                                              boolean highRiskChange, String adminSafeSummary,
                                              LocalDateTime updatedAt) {}
    public record AdminPlatformCouponRule(String couponId, String couponCode, String status,
                                          String marketplaceCode, String countryCode, String discountSummary,
                                          boolean approvalRequired, String adminSafeSummary) {}
    public record AdminBuyerServiceFeeRule(String ruleId, String marketplaceCode, String countryCode,
                                           String buyerVisibleFeeSummary, boolean active,
                                           boolean approvalRequired, String adminSafeSummary) {}
    public record AdminSellerCommissionRule(String ruleId, String marketplaceCode, String countryCode,
                                            String adminOnlyCommissionSummary, boolean active,
                                            boolean approvalRequired, String adminSafeSummary) {}
    public record AdminSellerWaiverRule(String waiverId, String sellerId, String sellerDisplayName,
                                        String waiverType, String status, String adminSafeReason) {}
    public record AdminOrderReview(String orderId, String orderReference, String marketplaceCode, String status,
                                   String paymentStatus, String refundDisputeStatus, String buyerSafeSummary,
                                   String sellerSafeSummary, List<String> maskedPaymentRows,
                                   List<String> timeline, String route) {}
    public record AdminRefundReview(String refundRequestId, String orderId, String status, String reason,
                                    String estimatedRefund, boolean twoStepApprovalRequired,
                                    String buyerSafeSummary, String sellerSafeSummary, String route) {}
    public record AdminDisputeReview(String disputeId, String orderId, String status, String reason,
                                     String sharityReviewStage, boolean highRisk,
                                     String buyerSafeSummary, String sellerSafeSummary, String route) {}
    public record AdminSellerReview(String sellerId, String sellerDisplayName, String approvalStatus,
                                    String suspensionStatus, String payoutEligibilitySummary,
                                    String refundDisputeSummary, List<String> maskedVerificationRows,
                                    String route) {}
    public record AdminDigitalDeliveryIssueReview(String issueId, String orderId, String sellerId,
                                                  String status, String reason, String severity,
                                                  List<String> safeAccessMetadata,
                                                  String adminSafeSummary, String route) {}
    public record AdminPolicyVersion(String policyId, String policyName, String version, String status,
                                     List<String> requiredContexts, boolean publishRequiresApproval,
                                     String route) {}
    public record AdminNotificationTemplate(String templateId, String notificationType, String status,
                                            List<String> channels, List<String> allowedVariables,
                                            String previewText, String route) {}
    public record AdminApprovalRequest(String approvalId, String actionType, String entityType,
                                       String entityId, String status, String initiatedBy,
                                       String reason, String approvalChainSummary, LocalDateTime createdAt) {}
    public record AdminApprovalStatus(String approvalId, String status, boolean secondAdminRequired,
                                      boolean executable, String userSafeMessage) {}
    public record AdminAuditLogItem(String auditLogId, String adminUser, String actionType, String entityType,
                                    String entityId, String severity, String beforeAfterSafeSummary,
                                    String approvalId, LocalDateTime createdAt, String route) {}
    public record AdminListResponse<T>(List<T> items, List<String> filters, List<AdminActionEligibility> actions,
                                       String userSafeMessage, LocalDateTime updatedAt) {}
    public record AdminDetailResponse<T>(T detail, List<String> adminOnlyNotes, List<String> maskedSensitiveFields,
                                         List<AdminActionEligibility> actions, String userSafeMessage,
                                         LocalDateTime updatedAt) {}
    public record AdminConfigResponse(List<AdminMarketplaceCountryRule> marketplaceCountryRules,
                                      List<AdminPlatformCouponRule> platformCoupons,
                                      List<AdminBuyerServiceFeeRule> buyerServiceFees,
                                      List<AdminSellerCommissionRule> sellerCommissions,
                                      List<AdminSellerWaiverRule> sellerWaivers,
                                      List<AdminActionEligibility> actions,
                                      String userSafeMessage, LocalDateTime updatedAt) {}

    public static AdminAccessResponse accessGranted() {
        return new AdminAccessResponse(true, List.of("USER", "ADMIN"), true, null,
                "Admin access granted. Backend role checks remain the source of truth.");
    }

    public static AdminDashboardResponse dashboard() {
        return new AdminDashboardResponse(accessGranted(), List.of(
                module("ORDERS", "Orders needing review", 8, "WARNING", "/admin/orders"),
                module("REFUNDS", "Refunds pending review", 5, "WARNING", "/admin/refunds"),
                module("DISPUTES", "Sharity Reviews active", 3, "CRITICAL", "/admin/disputes"),
                module("DIGITAL_ISSUES", "Digital delivery issues", 4, "WARNING", "/admin/digital-delivery-issues"),
                module("SELLER_APPROVALS", "Seller approvals pending", 6, "INFO", "/admin/sellers"),
                module("CONFIG_WARNINGS", "Marketplace config warnings", 2, "WARNING", "/admin/config/marketplace-country-rules"),
                module("POLICIES", "Policy versions requiring review", 1, "INFO", "/admin/policies"),
                module("AUDIT", "Admin audit activity", 18, "INFO", "/admin/audit-logs")),
                highRiskActions(),
                "Full admin operations mock dashboard uses masked, admin-safe data only.",
                LocalDateTime.now());
    }

    public static List<AdminActionEligibility> actions() {
        return List.of(
                action("VIEW", true, false, false),
                action("CREATE_CONFIG", true, true, false),
                action("EDIT_CONFIG", true, true, false),
                action("APPROVE_REFUND_AFTER_REVEAL", true, true, true),
                action("RESOLVE_DISPUTE", true, true, false),
                action("SUSPEND_SELLER", true, true, true),
                action("RELEASE_HOLD", true, true, true),
                action("EXPORT_REPORT_PLACEHOLDER", true, true, false));
    }

    public static AdminConfigResponse config() {
        return new AdminConfigResponse(marketplaceCountryRules(), platformCoupons(), buyerServiceFees(),
                sellerCommissions(), sellerWaivers(), actions(),
                "Admin config includes coupons, fees, seller waivers, and country-marketplace rules. Buyer/seller apps receive safe summaries only.",
                LocalDateTime.now());
    }

    public static List<AdminMarketplaceCountryRule> marketplaceCountryRules() {
        return List.of(
                new AdminMarketplaceCountryRule("rule-usa-digital", "USA", "DIGITAL", true, true,
                        true, true, true, "USD", "PAYPAL_AVAILABLE", "POLICY-2026-06",
                        false, "Digital marketplace enabled in USA.", LocalDateTime.now()),
                new AdminMarketplaceCountryRule("rule-can-digital", "CAN", "DIGITAL", true, false,
                        false, true, true, "CAD", "PAYPAL_AVAILABLE", "POLICY-2026-06",
                        false, "Buyer digital access enabled; seller listing disabled.", LocalDateTime.now()),
                new AdminMarketplaceCountryRule("rule-gbr-digital", "GBR", "DIGITAL", false, false,
                        false, false, false, "GBP", "PROVIDER_UNAVAILABLE", "POLICY_REQUIRED_LATER",
                        true, "Checkout disabled; high-risk changes require approval.", LocalDateTime.now()));
    }

    public static List<AdminPlatformCouponRule> platformCoupons() {
        return List.of(
                new AdminPlatformCouponRule("coupon-launch-10", "LAUNCH10", "ACTIVE", "DIGITAL", "USA",
                        "10 percent platform-funded discount capped by backend.", true,
                        "Coupon variables are backend validated."),
                new AdminPlatformCouponRule("coupon-paused-test", "TESTPAUSE", "PAUSED", "DIGITAL", "USA",
                        "Paused test coupon.", false, "No provider secrets or payment payloads."));
    }

    public static List<AdminBuyerServiceFeeRule> buyerServiceFees() {
        return List.of(new AdminBuyerServiceFeeRule("fee-buyer-digital-usa", "DIGITAL", "USA",
                "Buyer service fee shown only as buyer-visible marketplace fee.", true, true,
                "Internal fee split is hidden."));
    }

    public static List<AdminSellerCommissionRule> sellerCommissions() {
        return List.of(new AdminSellerCommissionRule("commission-digital-usa", "DIGITAL", "USA",
                "Admin-only seller commission rule placeholder.", true, true,
                "Never expose seller commission to buyer UI."));
    }

    public static List<AdminSellerWaiverRule> sellerWaivers() {
        return List.of(new AdminSellerWaiverRule("waiver-code-vault", "seller-code-vault", "Code Vault",
                "LAUNCH_FEE_WAIVER", "ACTIVE", "Launch seller waiver; admin-only."));
    }

    public static List<AdminOrderReview> orders() {
        return List.of(
                new AdminOrderReview("order-060", "SH-100245", "DIGITAL", "ACCESS_READY", "PAID",
                        "NONE", "Buyer purchased a digital code.", "Seller delivered digital access.",
                        List.of("Payment provider: PayPal", "Provider reference: masked", "Raw payload: hidden"),
                        List.of("Order created", "Payment authorized", "Access ready"), "/admin/orders/order-060"),
                new AdminOrderReview("order-062", "SH-100246", "ELECTRONICS", "SHIPPED", "PAID",
                        "REFUND_REQUESTED", "Buyer requested return review.", "Seller shipped item.",
                        List.of("Payment provider: PayPal", "Capture status: safe summary"),
                        List.of("Order created", "Seller accepted", "Shipment started"), "/admin/orders/order-062"));
    }

    public static List<AdminRefundReview> refunds() {
        return List.of(
                new AdminRefundReview("refund-067", "order-060", "UNDER_REVIEW", "Invalid digital code",
                        "$49.99 estimated", true, "Buyer reports invalid code.",
                        "Seller response requested.", "/admin/refunds/refund-067"),
                new AdminRefundReview("refund-physical-001", "order-062", "PENDING_SELLER",
                        "Item damaged", "$89.50 estimated", false, "Buyer uploaded package photo.",
                        "Seller return response pending.", "/admin/refunds/refund-physical-001"));
    }

    public static List<AdminDisputeReview> disputes() {
        return List.of(
                new AdminDisputeReview("dispute-069", "order-060", "WAITING_FOR_SELLER_RESPONSE",
                        "Digital code invalid", "SHARITY_REVIEW", true,
                        "Buyer opened Sharity Review.", "Seller response required.",
                        "/admin/disputes/dispute-069"));
    }

    public static List<AdminSellerReview> sellers() {
        return List.of(
                new AdminSellerReview("seller-code-vault", "Code Vault", "APPROVED", "ACTIVE",
                        "Eligible after refund/dispute holds.", "1 refund under review",
                        List.of("Email verified", "Payout provider: masked", "KYC payload: hidden"),
                        "/admin/sellers/seller-code-vault"),
                new AdminSellerReview("seller-new-001", "New Digital Seller", "PENDING_APPROVAL", "NONE",
                        "Payout setup incomplete.", "No completed orders",
                        List.of("Profile complete", "Tax info pending", "Provider payload: hidden"),
                        "/admin/sellers/seller-new-001"));
    }

    public static List<AdminDigitalDeliveryIssueReview> digitalIssues() {
        return List.of(new AdminDigitalDeliveryIssueReview("issue-065", "order-060", "seller-code-vault",
                "NEW", "Buyer reports invalid code", "WARNING",
                List.of("Code assigned: yes", "Buyer revealed: yes", "Reveal timestamp: safe metadata",
                        "Raw code: hidden", "Raw access URL: hidden"),
                "Digital payload remains masked. Break-glass is not implemented in this story.",
                "/admin/digital-delivery-issues/issue-065"));
    }

    public static List<AdminPolicyVersion> policies() {
        return List.of(
                new AdminPolicyVersion("policy-digital-terms", "Digital Product Policy", "2026.06",
                        "PUBLISHED", List.of("CHECKOUT", "DIGITAL_REVEAL", "REFUND_REQUEST"),
                        true, "/admin/policies/policy-digital-terms"),
                new AdminPolicyVersion("policy-payout-draft", "Seller Payout Policy", "2026.07-DRAFT",
                        "DRAFT", List.of("SELLER_PAYOUT_SETUP"), false,
                        "/admin/policies/policy-payout-draft"));
    }

    public static List<AdminNotificationTemplate> notificationTemplates() {
        return List.of(
                new AdminNotificationTemplate("tpl-refund-update", "REFUND_UPDATE", "ENABLED",
                        List.of("IN_APP", "EMAIL_LATER"), List.of("orderReference", "refundStatus"),
                        "Your refund status changed.", "/admin/notifications/templates/tpl-refund-update"),
                new AdminNotificationTemplate("tpl-dispute-update", "DISPUTE_UPDATE", "DISABLED",
                        List.of("IN_APP"), List.of("disputeReference", "nextStep"),
                        "Sharity Review has an update.", "/admin/notifications/templates/tpl-dispute-update"));
    }

    public static List<AdminApprovalRequest> approvals() {
        return List.of(
                new AdminApprovalRequest("approval-refund-067", "APPROVE_REFUND_AFTER_REVEAL",
                        "REFUND", "refund-067", "PENDING_SECOND_ADMIN", "admin-reviewer",
                        "Digital reveal occurred before refund approval.", "Second admin required.",
                        LocalDateTime.now().minusHours(2)),
                new AdminApprovalRequest("approval-seller-suspend", "SUSPEND_SELLER", "SELLER",
                        "seller-code-vault", "APPROVED", "admin-lead",
                        "Repeated unresolved disputes.", "Approved by super-admin.",
                        LocalDateTime.now().minusDays(1)));
    }

    public static List<AdminAuditLogItem> auditLogs() {
        return List.of(
                new AdminAuditLogItem("audit-001", "admin-reviewer", "VIEW_REFUND", "REFUND",
                        "refund-067", "INFO", "Viewed masked refund review summary.", null,
                        LocalDateTime.now().minusMinutes(30), "/admin/audit-logs/audit-001"),
                new AdminAuditLogItem("audit-002", "admin-lead", "REQUEST_SELLER_SUSPENSION", "SELLER",
                        "seller-code-vault", "CRITICAL", "Created two-step approval request.",
                        "approval-seller-suspend", LocalDateTime.now().minusDays(1),
                        "/admin/audit-logs/audit-002"));
    }

    public static AdminActionResponse action(String entityRoute, boolean highRisk) {
        return new AdminActionResponse(true, highRisk ? "APPROVAL_REQUIRED" : "ACTION_RECORDED",
                highRisk ? "High-risk admin action created a pending approval request." :
                        "Mock admin action completed and audit log was recorded.",
                entityRoute, true, highRisk ? "approval-mock-001" : null, LocalDateTime.now());
    }

    public static AdminApprovalStatus approvalStatus(String approvalId, String status) {
        return new AdminApprovalStatus(approvalId, status, "PENDING".equals(status),
                "APPROVED".equals(status), "Approval state is backend-controlled and audit logged.");
    }

    public static List<String> highRiskActions() {
        return List.of("SELLER_SUSPENSION", "SELLER_REINSTATEMENT", "REFUND_AFTER_DIGITAL_REVEAL",
                "PAYOUT_HOLD_RELEASE", "SELLER_COMMISSION_RULE_CHANGE", "BUYER_SERVICE_FEE_RULE_CHANGE",
                "MARKETPLACE_CHECKOUT_DISABLEMENT", "PAYMENT_PROVIDER_COUNTRY_DISABLEMENT",
                "PUBLISHED_POLICY_VERSION_CHANGE");
    }

    private static AdminModuleSummary module(String code, String title, int count, String severity, String route) {
        return new AdminModuleSummary(code, title, count, severity, route,
                "Open admin-safe module. Sensitive payloads remain masked.");
    }

    private static AdminActionEligibility action(String code, boolean allowed, boolean confirmation, boolean approval) {
        return new AdminActionEligibility(code, allowed, confirmation, approval,
                allowed ? List.of() : List.of("Backend permission denied."));
    }
}

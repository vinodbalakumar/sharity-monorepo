package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.AdminOperationsDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminOperationsController {
    @GetMapping("/dashboard")
    public AdminOperationsDtos.AdminDashboardResponse dashboard() {
        return AdminOperationsDtos.dashboard();
    }

    @GetMapping("/actions")
    public List<AdminOperationsDtos.AdminActionEligibility> actions() {
        return AdminOperationsDtos.actions();
    }

    @PostMapping("/config/marketplace-country-rules")
    public AdminOperationsDtos.AdminActionResponse createMarketplaceCountryRule() {
        return AdminOperationsDtos.action("/admin/config/marketplace-country-rules", false);
    }

    @PutMapping("/config/marketplace-country-rules/{ruleId}")
    public AdminOperationsDtos.AdminActionResponse updateMarketplaceCountryRule(@PathVariable String ruleId) {
        return AdminOperationsDtos.action("/admin/config/marketplace-country-rules/" + ruleId, true);
    }

    @PostMapping("/config/marketplace-country-rules/{ruleId}/enable")
    public AdminOperationsDtos.AdminActionResponse enableMarketplaceCountryRule(@PathVariable String ruleId) {
        return AdminOperationsDtos.action("/admin/config/marketplace-country-rules/" + ruleId, true);
    }

    @PostMapping("/config/marketplace-country-rules/{ruleId}/disable")
    public AdminOperationsDtos.AdminActionResponse disableMarketplaceCountryRule(@PathVariable String ruleId) {
        return AdminOperationsDtos.action("/admin/config/marketplace-country-rules/" + ruleId, true);
    }

    @GetMapping("/config/fees-coupons/full")
    public AdminOperationsDtos.AdminConfigResponse feesCouponsFull() {
        return AdminOperationsDtos.config();
    }

    @PostMapping("/config/platform-coupons")
    public AdminOperationsDtos.AdminActionResponse createPlatformCoupon() {
        return AdminOperationsDtos.action("/admin/config/coupons", false);
    }

    @PutMapping("/config/platform-coupons/{couponId}")
    public AdminOperationsDtos.AdminActionResponse updatePlatformCoupon(@PathVariable String couponId) {
        return AdminOperationsDtos.action("/admin/config/coupons/" + couponId, false);
    }

    @PostMapping("/config/platform-coupons/{couponId}/pause")
    public AdminOperationsDtos.AdminActionResponse pausePlatformCoupon(@PathVariable String couponId) {
        return AdminOperationsDtos.action("/admin/config/coupons/" + couponId, false);
    }

    @PostMapping("/config/platform-coupons/{couponId}/resume")
    public AdminOperationsDtos.AdminActionResponse resumePlatformCoupon(@PathVariable String couponId) {
        return AdminOperationsDtos.action("/admin/config/coupons/" + couponId, false);
    }

    @PostMapping("/config/buyer-service-fees")
    public AdminOperationsDtos.AdminActionResponse createBuyerServiceFee() {
        return AdminOperationsDtos.action("/admin/config/fees", true);
    }

    @PutMapping("/config/buyer-service-fees/{ruleId}")
    public AdminOperationsDtos.AdminActionResponse updateBuyerServiceFee(@PathVariable String ruleId) {
        return AdminOperationsDtos.action("/admin/config/fees/" + ruleId, true);
    }

    @PostMapping("/config/seller-commissions")
    public AdminOperationsDtos.AdminActionResponse createSellerCommission() {
        return AdminOperationsDtos.action("/admin/config/fees", true);
    }

    @PutMapping("/config/seller-commissions/{ruleId}")
    public AdminOperationsDtos.AdminActionResponse updateSellerCommission(@PathVariable String ruleId) {
        return AdminOperationsDtos.action("/admin/config/fees/" + ruleId, true);
    }

    @PostMapping("/config/seller-waivers")
    public AdminOperationsDtos.AdminActionResponse createSellerWaiver() {
        return AdminOperationsDtos.action("/admin/config/seller-waivers", false);
    }

    @PutMapping("/config/seller-waivers/{waiverId}")
    public AdminOperationsDtos.AdminActionResponse updateSellerWaiver(@PathVariable String waiverId) {
        return AdminOperationsDtos.action("/admin/config/seller-waivers/" + waiverId, false);
    }

    @GetMapping("/orders")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminOrderReview> orders() {
        return list(AdminOperationsDtos.orders(), "Orders are masked and admin-safe.");
    }

    @GetMapping("/orders/{orderId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminOrderReview> order(@PathVariable String orderId) {
        return detail(AdminOperationsDtos.orders().stream()
                .filter(item -> item.orderId().equals(orderId))
                .findFirst()
                .orElse(AdminOperationsDtos.orders().get(0)));
    }

    @GetMapping("/refunds")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminRefundReview> refunds() {
        return list(AdminOperationsDtos.refunds(), "Refund review queue with safe payment summaries only.");
    }

    @GetMapping("/refunds/{refundRequestId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminRefundReview> refund(@PathVariable String refundRequestId) {
        return detail(AdminOperationsDtos.refunds().stream()
                .filter(item -> item.refundRequestId().equals(refundRequestId))
                .findFirst()
                .orElse(AdminOperationsDtos.refunds().get(0)));
    }

    @PostMapping("/refunds/{refundRequestId}/approve")
    public AdminOperationsDtos.AdminActionResponse approveRefund(@PathVariable String refundRequestId) {
        return AdminOperationsDtos.action("/admin/refunds/" + refundRequestId, true);
    }

    @PostMapping("/refunds/{refundRequestId}/reject")
    public AdminOperationsDtos.AdminActionResponse rejectRefund(@PathVariable String refundRequestId) {
        return AdminOperationsDtos.action("/admin/refunds/" + refundRequestId, false);
    }

    @GetMapping("/disputes")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminDisputeReview> disputes() {
        return list(AdminOperationsDtos.disputes(), "Dispute review queue excludes private notes and raw payloads.");
    }

    @GetMapping("/disputes/{disputeId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminDisputeReview> dispute(@PathVariable String disputeId) {
        return detail(AdminOperationsDtos.disputes().stream()
                .filter(item -> item.disputeId().equals(disputeId))
                .findFirst()
                .orElse(AdminOperationsDtos.disputes().get(0)));
    }

    @PostMapping("/disputes/{disputeId}/resolve")
    public AdminOperationsDtos.AdminActionResponse resolveDispute(@PathVariable String disputeId) {
        return AdminOperationsDtos.action("/admin/disputes/" + disputeId, false);
    }

    @PostMapping("/disputes/{disputeId}/escalate")
    public AdminOperationsDtos.AdminActionResponse escalateDispute(@PathVariable String disputeId) {
        return AdminOperationsDtos.action("/admin/disputes/" + disputeId, false);
    }

    @GetMapping("/sellers")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminSellerReview> sellers() {
        return list(AdminOperationsDtos.sellers(), "Seller list shows masked verification and payout summaries.");
    }

    @GetMapping("/sellers/{sellerId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminSellerReview> seller(@PathVariable String sellerId) {
        return detail(AdminOperationsDtos.sellers().stream()
                .filter(item -> item.sellerId().equals(sellerId))
                .findFirst()
                .orElse(AdminOperationsDtos.sellers().get(0)));
    }

    @PostMapping("/sellers/{sellerId}/approve")
    public AdminOperationsDtos.AdminActionResponse approveSeller(@PathVariable String sellerId) {
        return AdminOperationsDtos.action("/admin/sellers/" + sellerId + "/approval", false);
    }

    @PostMapping("/sellers/{sellerId}/reject")
    public AdminOperationsDtos.AdminActionResponse rejectSeller(@PathVariable String sellerId) {
        return AdminOperationsDtos.action("/admin/sellers/" + sellerId + "/approval", false);
    }

    @PostMapping("/sellers/{sellerId}/suspend")
    public AdminOperationsDtos.AdminActionResponse suspendSeller(@PathVariable String sellerId) {
        return AdminOperationsDtos.action("/admin/sellers/" + sellerId + "/suspension", true);
    }

    @PostMapping("/sellers/{sellerId}/reinstate")
    public AdminOperationsDtos.AdminActionResponse reinstateSeller(@PathVariable String sellerId) {
        return AdminOperationsDtos.action("/admin/sellers/" + sellerId + "/suspension", true);
    }

    @PostMapping("/sellers/{sellerId}/holds")
    public AdminOperationsDtos.AdminActionResponse addSellerHold(@PathVariable String sellerId) {
        return AdminOperationsDtos.action("/admin/sellers/" + sellerId, true);
    }

    @PostMapping("/sellers/{sellerId}/holds/{holdId}/release")
    public AdminOperationsDtos.AdminActionResponse releaseSellerHold(@PathVariable String sellerId,
                                                                     @PathVariable String holdId) {
        return AdminOperationsDtos.action("/admin/sellers/" + sellerId + "/holds/" + holdId, true);
    }

    @GetMapping("/digital-delivery-issues")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminDigitalDeliveryIssueReview> digitalIssues() {
        return list(AdminOperationsDtos.digitalIssues(), "Digital issue queue never exposes raw codes or URLs.");
    }

    @GetMapping("/digital-delivery-issues/{issueId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminDigitalDeliveryIssueReview> digitalIssue(@PathVariable String issueId) {
        return detail(AdminOperationsDtos.digitalIssues().stream()
                .filter(item -> item.issueId().equals(issueId))
                .findFirst()
                .orElse(AdminOperationsDtos.digitalIssues().get(0)));
    }

    @PostMapping("/digital-delivery-issues/{issueId}/resolve")
    public AdminOperationsDtos.AdminActionResponse resolveDigitalIssue(@PathVariable String issueId) {
        return AdminOperationsDtos.action("/admin/digital-delivery-issues/" + issueId, false);
    }

    @PostMapping("/digital-delivery-issues/{issueId}/escalate")
    public AdminOperationsDtos.AdminActionResponse escalateDigitalIssue(@PathVariable String issueId) {
        return AdminOperationsDtos.action("/admin/digital-delivery-issues/" + issueId, false);
    }

    @GetMapping("/policies")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminPolicyVersion> policies() {
        return list(AdminOperationsDtos.policies(), "Policy versions are backend source of truth.");
    }

    @GetMapping("/policies/{policyId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminPolicyVersion> policy(@PathVariable String policyId) {
        return detail(AdminOperationsDtos.policies().stream()
                .filter(item -> item.policyId().equals(policyId))
                .findFirst()
                .orElse(AdminOperationsDtos.policies().get(0)));
    }

    @PostMapping("/policies")
    public AdminOperationsDtos.AdminActionResponse createPolicy() {
        return AdminOperationsDtos.action("/admin/policies", false);
    }

    @PutMapping("/policies/{policyId}")
    public AdminOperationsDtos.AdminActionResponse updatePolicy(@PathVariable String policyId) {
        return AdminOperationsDtos.action("/admin/policies/" + policyId, false);
    }

    @PostMapping("/policies/{policyId}/publish")
    public AdminOperationsDtos.AdminActionResponse publishPolicy(@PathVariable String policyId) {
        return AdminOperationsDtos.action("/admin/policies/" + policyId, true);
    }

    @PostMapping("/policies/{policyId}/retire")
    public AdminOperationsDtos.AdminActionResponse retirePolicy(@PathVariable String policyId) {
        return AdminOperationsDtos.action("/admin/policies/" + policyId, true);
    }

    @GetMapping("/notification-templates")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminNotificationTemplate> notificationTemplates() {
        return list(AdminOperationsDtos.notificationTemplates(), "Notification templates expose validated variable names only.");
    }

    @GetMapping("/notification-templates/{templateId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminNotificationTemplate> notificationTemplate(@PathVariable String templateId) {
        return detail(AdminOperationsDtos.notificationTemplates().stream()
                .filter(item -> item.templateId().equals(templateId))
                .findFirst()
                .orElse(AdminOperationsDtos.notificationTemplates().get(0)));
    }

    @PostMapping("/notification-templates")
    public AdminOperationsDtos.AdminActionResponse createNotificationTemplate() {
        return AdminOperationsDtos.action("/admin/notifications/templates", false);
    }

    @PutMapping("/notification-templates/{templateId}")
    public AdminOperationsDtos.AdminActionResponse updateNotificationTemplate(@PathVariable String templateId) {
        return AdminOperationsDtos.action("/admin/notifications/templates/" + templateId, false);
    }

    @PostMapping("/notification-templates/{templateId}/enable")
    public AdminOperationsDtos.AdminActionResponse enableNotificationTemplate(@PathVariable String templateId) {
        return AdminOperationsDtos.action("/admin/notifications/templates/" + templateId, false);
    }

    @PostMapping("/notification-templates/{templateId}/disable")
    public AdminOperationsDtos.AdminActionResponse disableNotificationTemplate(@PathVariable String templateId) {
        return AdminOperationsDtos.action("/admin/notifications/templates/" + templateId, false);
    }

    @PostMapping("/notification-templates/{templateId}/preview")
    public AdminOperationsDtos.AdminActionResponse previewNotificationTemplate(@PathVariable String templateId) {
        return AdminOperationsDtos.action("/admin/notifications/templates/" + templateId, false);
    }

    @PostMapping("/approvals")
    public AdminOperationsDtos.AdminActionResponse createApproval() {
        return AdminOperationsDtos.action("/admin/approvals", true);
    }

    @GetMapping("/approvals")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminApprovalRequest> approvals() {
        return list(AdminOperationsDtos.approvals(), "Approval queue shows high-risk action chains.");
    }

    @GetMapping("/approvals/{approvalId}")
    public AdminOperationsDtos.AdminApprovalStatus approval(@PathVariable String approvalId) {
        return AdminOperationsDtos.approvalStatus(approvalId, "PENDING");
    }

    @PostMapping("/approvals/{approvalId}/approve")
    public AdminOperationsDtos.AdminApprovalStatus approveApproval(@PathVariable String approvalId) {
        return AdminOperationsDtos.approvalStatus(approvalId, "APPROVED");
    }

    @PostMapping("/approvals/{approvalId}/reject")
    public AdminOperationsDtos.AdminApprovalStatus rejectApproval(@PathVariable String approvalId) {
        return AdminOperationsDtos.approvalStatus(approvalId, "REJECTED");
    }

    @GetMapping("/audit-logs")
    public AdminOperationsDtos.AdminListResponse<AdminOperationsDtos.AdminAuditLogItem> auditLogs() {
        return list(AdminOperationsDtos.auditLogs(), "Audit logs are read-only and masked.");
    }

    @GetMapping("/audit-logs/{auditLogId}")
    public AdminOperationsDtos.AdminDetailResponse<AdminOperationsDtos.AdminAuditLogItem> auditLog(@PathVariable String auditLogId) {
        return detail(AdminOperationsDtos.auditLogs().stream()
                .filter(item -> item.auditLogId().equals(auditLogId))
                .findFirst()
                .orElse(AdminOperationsDtos.auditLogs().get(0)));
    }

    @PostMapping("/audit-logs/export-placeholder")
    public AdminOperationsDtos.AdminActionResponse exportAuditLogs() {
        return AdminOperationsDtos.action("/admin/audit-logs", false);
    }

    private static <T> AdminOperationsDtos.AdminListResponse<T> list(List<T> items, String message) {
        return new AdminOperationsDtos.AdminListResponse<>(items, List.of("ALL", "PENDING", "CRITICAL"),
                AdminOperationsDtos.actions(), message, java.time.LocalDateTime.now());
    }

    private static <T> AdminOperationsDtos.AdminDetailResponse<T> detail(T detail) {
        return new AdminOperationsDtos.AdminDetailResponse<>(detail,
                List.of("Admin-only notes remain admin-only and must not be sent to buyer/seller apps."),
                List.of("providerPayload", "rawDigitalCode", "rawAccessUrl", "privateCredentials", "riskScore"),
                AdminOperationsDtos.actions(), "Detail response is masked and audit-safe.",
                java.time.LocalDateTime.now());
    }
}

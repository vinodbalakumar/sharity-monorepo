package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class PolicyDtos {
    private PolicyDtos() {}
    public record PoliciesDashboardResponse(List<PolicyGroup> policyGroups, List<PolicySummaryItem> requiredPolicies,
                                            List<PolicySummaryItem> acceptedPolicies,
                                            PolicyBlockingSummary blockingSummary,
                                            List<PolicyAcceptanceHistoryItem> acceptanceHistorySummary,
                                            List<AdminPolicyVersionPreview> adminPreviewVersions,
                                            List<String> availableActions) {}
    public record PolicyGroup(String groupCode, String groupName, int acceptedCount, int requiredCount,
                              int reacceptRequiredCount, boolean blocking, List<String> policyIds) {}
    public record PolicySummaryItem(String policyId, String policyName, String policyType, String currentVersion,
                                    String acceptedVersion, String acceptanceStatus, boolean reacceptanceRequired,
                                    boolean required, List<String> requiredForRoles, List<String> requiredContexts,
                                    String marketplaceCode, String countryCode, LocalDateTime lastAcceptedAt,
                                    boolean whatChangedAvailable, List<String> availableActions) {}
    public record PolicyDetailResponse(String policyId, String policyName, String policyType, String currentVersion,
                                       LocalDateTime publishedAt, LocalDateTime effectiveAt,
                                       List<String> appliesToRoles, List<String> appliesToContexts,
                                       String marketplaceCode, String countryCode, String summary, String content,
                                       String whatChangedSummary, String acceptanceStatus,
                                       List<String> availableActions) {}
    public record PolicyChangesResponse(String policyId, String fromVersion, String toVersion, boolean majorUpdate,
                                        boolean reacceptanceRequired, LocalDateTime effectiveAt,
                                        List<String> affectedActions,
                                        List<PolicyChangeSummaryItem> changeSummaryItems) {}
    public record PolicyChangeSummaryItem(String title, String description, String severity, String affectedContext) {}
    public record PolicyAcceptanceRequest(String policyId, String policyVersion, String role, String context,
                                          String marketplaceCode, String countryCode, String checkoutSessionId,
                                          String parentOrderId, String sellerId, boolean userAcknowledged) {}
    public record PolicyAcceptanceResponse(String policyId, String policyVersion, boolean accepted,
                                           LocalDateTime acceptedAt, String acceptanceStatus,
                                           boolean blockingStatusUpdated, String message) {}
    public record AcceptAllRequiredPoliciesRequest(String context, String role, String marketplaceCode,
                                                   String countryCode, String checkoutSessionId, String sellerId,
                                                   boolean userAcknowledgedAll, List<String> policyIds) {}
    public record AcceptAllRequiredPoliciesResponse(List<PolicyAcceptanceResponse> acceptedPolicies,
                                                    List<String> failedPolicies,
                                                    boolean blockingStatusUpdated, String message) {}
    public record PolicyAcceptanceHistoryItem(String acceptanceId, String policyId, String policyName,
                                              String acceptedVersion, String currentVersion,
                                              LocalDateTime acceptedAt, String role, String context,
                                              String marketplaceCode, String countryCode,
                                              boolean reacceptanceNeeded) {}
    public record PolicyBlockingSummary(boolean blocked, List<PolicyBlockedAction> blockedActions,
                                        int missingPolicyCount, int reacceptRequiredCount,
                                        String userSafeMessage) {}
    public record PolicyBlockedAction(String actionCode, String actionLabel, boolean blocked,
                                      List<String> requiredPolicyIds, String userSafeMessage, String route) {}
    public record DigitalCheckoutTermsAcceptanceRequest(String checkoutSessionId, String digitalTermsPolicyId,
                                                        String digitalTermsVersion, String refundPolicyId,
                                                        String refundPolicyVersion, String marketplaceCode,
                                                        String countryCode, boolean buyerAcknowledgedDigitalRules,
                                                        boolean buyerAcknowledgedRefundRules) {}
    public record DigitalCheckoutTermsAcceptanceResponse(String checkoutSessionId, boolean accepted,
                                                         LocalDateTime acceptedAt, String termsSnapshotId,
                                                         boolean checkoutReady, String message) {}
    public record AdminPolicyVersionPreview(String policyId, String policyName, String policyType, String version,
                                            String status, boolean published, boolean reacceptanceRequired,
                                            List<String> appliesToRoles, List<String> appliesToContexts,
                                            String marketplaceCode, String countryCode,
                                            LocalDateTime effectiveAt, LocalDateTime publishedAt) {}

    public static PoliciesDashboardResponse dashboard() {
        List<PolicySummaryItem> policies = policies();
        return new PoliciesDashboardResponse(List.of(new PolicyGroup("SELLER", "Seller policies", 1, 3, 1, true, List.of("policy-seller-terms"))),
                policies.stream().filter(PolicySummaryItem::required).toList(),
                policies.stream().filter(item -> "ACCEPTED".equals(item.acceptanceStatus())).toList(),
                blocking(), history(),
                policies.stream().map(item -> new AdminPolicyVersionPreview(item.policyId(), item.policyName(), item.policyType(), item.currentVersion(), "PUBLISHED", true, item.reacceptanceRequired(), item.requiredForRoles(), item.requiredContexts(), item.marketplaceCode(), item.countryCode(), LocalDateTime.now(), LocalDateTime.now())).toList(),
                List.of("VIEW_POLICY", "ACCEPT_POLICY", "ACCEPT_ALL_REQUIRED"));
    }
    public static List<PolicySummaryItem> policies() {
        return List.of(policy("policy-seller-terms", "Seller Terms", "SELLER_TERMS", "v3.0", "v2.0", "REACCEPT_REQUIRED", true),
                policy("policy-digital", "Digital Product Policy", "DIGITAL_PRODUCT_POLICY", "v2.0", "v1.0", "REACCEPT_REQUIRED", true),
                policy("policy-refund", "Refund/Return Policy", "REFUND_RETURN_POLICY", "v1.5", "v1.5", "ACCEPTED", false));
    }
    public static PolicyDetailResponse detail(String policyId) {
        PolicySummaryItem item = policies().get(0);
        return new PolicyDetailResponse(policyId, item.policyName(), item.policyType(), item.currentVersion(), LocalDateTime.now(), LocalDateTime.now(), item.requiredForRoles(), item.requiredContexts(), "DIGITAL", "USA", "User-facing policy summary.", "Published policy content placeholder.", "Updated seller payout and digital refund language.", item.acceptanceStatus(), item.availableActions());
    }
    public static PolicyChangesResponse changes(String policyId) {
        return new PolicyChangesResponse(policyId, "v1.0", "v2.0", true, true, LocalDateTime.now(), List.of("DIGITAL_CHECKOUT"), List.of(new PolicyChangeSummaryItem("Digital refund after reveal", "Refunds after code reveal may require Sharity Review.", "IMPORTANT", "DIGITAL_CHECKOUT")));
    }
    public static PolicyAcceptanceResponse accepted(String policyId, String version) {
        return new PolicyAcceptanceResponse(policyId, version, true, LocalDateTime.now(), "ACCEPTED", true, "Policy acceptance recorded with version and context.");
    }
    public static PolicyBlockingSummary blocking() {
        return new PolicyBlockingSummary(true, List.of(new PolicyBlockedAction("CREATE_LISTING", "Create listing blocked", true, List.of("policy-seller-terms"), "Accept Seller Terms v3.0 to continue.", "/seller/policies")), 2, 1, "Required policies need acceptance.");
    }
    public static List<PolicyAcceptanceHistoryItem> history() {
        return List.of(new PolicyAcceptanceHistoryItem("accept-1", "policy-refund", "Refund/Return Policy", "v1.5", "v1.5", LocalDateTime.now(), "BUYER", "REFUND", "DIGITAL", "USA", false));
    }
    private static PolicySummaryItem policy(String id, String name, String type, String current, String accepted, String status, boolean required) {
        return new PolicySummaryItem(id, name, type, current, accepted, status, status.contains("REACCEPT"), required, List.of("BUYER", "SELLER"), List.of("CHECKOUT", "PAYOUT"), "DIGITAL", "USA", accepted == null ? null : LocalDateTime.now(), status.contains("REACCEPT"), List.of("VIEW_POLICY", "ACCEPT_POLICY"));
    }
}

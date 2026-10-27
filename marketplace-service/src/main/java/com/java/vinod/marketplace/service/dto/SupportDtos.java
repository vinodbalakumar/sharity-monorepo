package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class SupportDtos {
    private SupportDtos() {}

    public record SupportDashboardResponse(String searchPlaceholder, List<SelfServiceSuggestionItem> commonActions,
                                           List<SupportCategoryItem> supportCategories, int openTicketCount,
                                           int actionRequiredCount, int unreadCount,
                                           List<SupportTicketSummary> recentTickets,
                                           List<String> availableActions) {}
    public record SupportHomeResponse(List<SupportCategoryItem> categories, List<SupportTopic> popularTopics,
                                      List<ContextualSupportLink> contextualLinks,
                                      List<SupportTicketSummary> tickets,
                                      SupportActionEligibility actionEligibility,
                                      String userSafeMessage, LocalDateTime updatedAt) {}
    public record SupportCategoryItem(String categoryCode, String label, String description,
                                      List<String> suggestedRelatedEntityTypes,
                                      List<String> evidenceRecommendations,
                                      List<String> selfServiceSuggestionTypes,
                                      String defaultPriorityHint, boolean unsafeContentWarningRequired) {}
    public record HelpSearchResultItem(String resultId, String resultType, String title, String summary,
                                       String categoryCode, String route, String actionLabel) {}
    public record SupportTopic(String topicId, String title, String shortDescription, String categoryCode,
                               String relatedRoute, boolean articlePlaceholder,
                               boolean contactSupportEligible, String userSafeMessage) {}
    public record GuidedHelpFlowResponse(String flowId, String categoryCode, String title,
                                         List<GuidedHelpStep> steps,
                                         List<SelfServiceSuggestionItem> suggestedActions,
                                         boolean createTicketRecommended) {}
    public record GuidedHelpStep(String stepId, String question, List<String> options, String explanation,
                                 java.util.Map<String, String> nextStepMap) {}
    public record SelfServiceSuggestionItem(String suggestionId, String title, String description,
                                            String actionLabel, String route, String relatedEntityType,
                                            String relatedEntityId) {}
    public record CreateSupportTicketRequest(String categoryCode, String relatedEntityType, String relatedEntityId,
                                             String subject, String description, String priorityHint,
                                             List<String> attachmentIds,
                                             boolean userAcknowledgedSafeSupportRules) {}
    public record SupportTicketCreateRequest(String categoryCode, String relatedOrderId,
                                             String relatedSellerOrderId, String relatedRefundOrDisputeId,
                                             String subject, String message,
                                             boolean evidenceUploadPlaceholder) {}
    public record CreateSupportTicketResponse(String ticketId, String ticketReference, String status,
                                              String priority, String nextRoute, String message) {}
    public record SupportTicketCreateResponse(String ticketId, String ticketReference, String status,
                                              String nextRoute, String userSafeMessage) {}
    public record SupportTicketSummary(String ticketId, String ticketReference, String categoryCode, String subject,
                                       String relatedEntityType, String relatedEntityReference, String status,
                                       String priority, String severity, LocalDateTime lastUpdatedAt,
                                       int unreadCount, boolean actionRequired, boolean escalated) {}
    public record SupportTicketDetail(String ticketId, String ticketReference, String categoryCode, String subject,
                                      String description, String status, String priority, String severity,
                                      SupportRelatedEntity relatedEntity, List<SupportTicketMessage> messages,
                                      List<SupportAttachmentItem> attachments,
                                      List<SupportTicketTimelineEvent> timeline,
                                      List<String> availableActions, LocalDateTime createdAt,
                                      LocalDateTime updatedAt) {}
    public record SupportRelatedEntity(String relatedEntityType, String relatedEntityId,
                                       String relatedEntityReference, String status, String summary,
                                       String route, boolean accessAllowed) {}
    public record ContextualSupportLink(String contextType, String contextId, String title,
                                        String route, String userSafeMessage) {}
    public record SupportTicketMessage(String messageId, String senderType, String senderDisplayName,
                                       String body, List<SupportAttachmentItem> attachments,
                                       LocalDateTime createdAt, boolean read, String moderationStatus,
                                       boolean systemMessage) {}
    public record SupportAttachmentItem(String attachmentId, String fileName, String fileType, long fileSize,
                                        String previewUrl, String uploadStatus, String scanStatus,
                                        String visibilityPolicy, LocalDateTime createdAt) {}
    public record SupportTicketTimelineEvent(String eventId, String eventType, String title, String message,
                                             String actorType, String status, LocalDateTime timestamp) {}
    public record ReplySupportTicketRequest(String body, List<String> attachmentIds,
                                            boolean userAcknowledgedSafeSupportRules) {}
    public record EscalateSupportTicketRequest(String escalationType, String reason, String message,
                                               List<String> additionalAttachmentIds,
                                               boolean userAcknowledgedEscalationRules) {}
    public record SupportTicketActionResponse(String ticketId, String status, String message,
                                              LocalDateTime updatedAt) {}
    public record AdminSupportQueueItem(String ticketId, String ticketReference, String categoryCode,
                                        String status, String priority, String severity,
                                        String relatedEntityType, LocalDateTime createdAt,
                                        LocalDateTime updatedAt, String assignedTo,
                                        String escalationStatus) {}
    public record SupportActionEligibility(boolean searchHelp, boolean openHelpTopic,
                                           boolean createSupportTicketPlaceholder,
                                           boolean viewMyTicketsPlaceholder,
                                           boolean viewRelatedOrder, boolean viewRefundStatus,
                                           boolean viewDispute, boolean viewDigitalDelivery,
                                           boolean contactSupportPlaceholder,
                                           List<String> disabledReasons) {}

    public static SupportDashboardResponse dashboard() {
        return new SupportDashboardResponse("Search orders, refunds, payouts, verification, policies, and app help",
                suggestions(), categories(), 2, 1, 2, tickets(),
                List.of("SEARCH_HELP", "START_GUIDED_HELP", "CREATE_SUPPORT_TICKET"));
    }

    public static SupportHomeResponse home() {
        return new SupportHomeResponse(categories(), topics(), contextualLinks(), tickets(),
                new SupportActionEligibility(true, true, true, true, true, true, true,
                        true, true, List.of()),
                "Support content is user-facing. Internal support/admin notes are hidden.", LocalDateTime.now());
    }

    public static List<SupportCategoryItem> categories() {
        return List.of(category("ORDER_ISSUE", "Order issue", "MEDIUM"),
                category("DIGITAL_CODE_ACCESS_ISSUE", "Digital code/access issue", "HIGH"),
                category("REFUND_ISSUE", "Refund issue", "HIGH"),
                category("PAYOUT_ISSUE", "Payout issue", "HIGH"),
                category("SELLER_VERIFICATION_ISSUE", "Seller verification issue", "MEDIUM"),
                category("ACCOUNT_LOGIN_SECURITY_ISSUE", "Account/login/security issue", "SAFETY_CRITICAL"),
                category("POLICY_TERMS_QUESTION", "Policy/terms question", "LOW"),
                category("OTHER", "Other", "LOW"));
    }

    public static List<HelpSearchResultItem> search() {
        return List.of(new HelpSearchResultItem("result-payout", "SELF_SERVICE_ROUTE", "View Payout Eligibility",
                "Check PayPal setup, payout blockers, and holds.", "PAYOUT_ISSUE", "/seller/payout-eligibility",
                "Open payout eligibility"));
    }

    public static List<SupportTopic> topics() {
        return List.of(new SupportTopic("topic-digital-delivery", "Digital delivery help",
                        "Reveal, access, and report digital delivery issues.", "DIGITAL_CODE_ACCESS_ISSUE",
                        "/support/digital-delivery", true, true,
                        "Routes to Digital Delivery and Sharity Review when needed."),
                new SupportTopic("topic-refunds", "Refund help",
                        "Understand refund eligibility and status.", "REFUND_ISSUE",
                        "/support/refunds", true, true, "Links to refund request/status flows."),
                new SupportTopic("topic-seller-payouts", "Seller payout help",
                        "Review payout method, holds, and payout eligibility.", "PAYOUT_ISSUE",
                        "/support/seller", true, true, "Seller-safe payout help only."));
    }

    public static SupportTopic topic(String topicId) {
        return topics().stream().filter(topic -> topic.topicId().equals(topicId)).findFirst().orElse(topics().get(0));
    }

    public static List<ContextualSupportLink> contextualLinks() {
        return List.of(new ContextualSupportLink("ORDER", "order-085", "View related order",
                        "/orders/order-085", "Order access is backend-checked."),
                new ContextualSupportLink("REFUND", "refund-067", "View refund status",
                        "/refunds/refund-067", "Refund access is backend-checked."),
                new ContextualSupportLink("DIGITAL_DELIVERY", "order-065", "View digital delivery",
                        "/orders/order-065/digital-delivery", "Digital delivery ownership is backend-checked."));
    }

    public static GuidedHelpFlowResponse guidedHelp() {
        return new GuidedHelpFlowResponse("guided-digital-code", "DIGITAL_CODE_ACCESS_ISSUE",
                "Digital code issue", List.of(new GuidedHelpStep("step-revealed", "Was the code revealed?",
                List.of("Yes", "No"), "Reveal status changes refund routing.", java.util.Map.of("Yes", "create-ticket"))),
                suggestions(), true);
    }

    public static List<SelfServiceSuggestionItem> suggestions() {
        return List.of(new SelfServiceSuggestionItem("suggest-refund", "Request Refund",
                "Start a seller-order scoped refund.", "Request refund", "/orders/parent-order-1000/refund",
                "ORDER", "parent-order-1000"));
    }

    public static List<SupportTicketSummary> tickets() {
        return List.of(new SupportTicketSummary("ticket-001", "SUP-1001", "DIGITAL_CODE_ACCESS_ISSUE",
                "Code says already used", "SELLER_ORDER_ITEM", "SH-1000-A item 1",
                "WAITING_FOR_SUPPORT", "HIGH", "HIGH", LocalDateTime.now(), 1, false, false));
    }

    public static SupportTicketDetail detail(String ticketId) {
        SupportAttachmentItem attachment = attachment("attach-001");
        List<SupportTicketTimelineEvent> timeline = timeline(ticketId);
        return new SupportTicketDetail(ticketId, "SUP-1001", "DIGITAL_CODE_ACCESS_ISSUE",
                "Code says already used", "Buyer reported redemption error without sharing the actual code.",
                "WAITING_FOR_SUPPORT", "HIGH", "HIGH", relatedEntities().get(0),
                List.of(new SupportTicketMessage("msg-1", "USER", "Buyer",
                        "I attached the error screenshot.", List.of(attachment), LocalDateTime.now(), true,
                        "SAFE", false)), List.of(attachment), timeline,
                List.of("REPLY", "ATTACH_EVIDENCE", "ESCALATE", "CLOSE"),
                LocalDateTime.now(), LocalDateTime.now());
    }

    public static List<SupportRelatedEntity> relatedEntities() {
        return List.of(new SupportRelatedEntity("SELLER_ORDER_ITEM", "item-a-1", "SH-1000-A item 1",
                "DIGITAL_ACCESS_READY", "Digital item with reveal history.", "/orders/parent-order-1000/refund", true));
    }

    public static List<SupportTicketTimelineEvent> timeline(String ticketId) {
        return List.of(new SupportTicketTimelineEvent("support-time-1", "TICKET_CREATED", "Ticket created",
                "Support ticket created with related seller order item.", "USER", "COMPLETED", LocalDateTime.now()));
    }

    public static SupportAttachmentItem attachment(String id) {
        return new SupportAttachmentItem(id, "support-screenshot.png", "image/png", 240000,
                "marketplace/placeholders/gift_cards.png", "UPLOADED", "SCAN_PASSED",
                "Visible to support and relevant reviewers only", LocalDateTime.now());
    }

    public static SupportTicketActionResponse action(String ticketId, String status, String message) {
        return new SupportTicketActionResponse(ticketId, status, message, LocalDateTime.now());
    }

    private static SupportCategoryItem category(String code, String label, String priority) {
        return new SupportCategoryItem(code, label, label + " support with guided troubleshooting.",
                List.of("ORDER", "REFUND_REQUEST"), List.of("Screenshot", "Error proof"),
                List.of("VIEW_RELATED_STATUS", "GUIDED_HELP", "CREATE_TICKET"), priority,
                code.contains("DIGITAL") || code.contains("SECURITY"));
    }
}

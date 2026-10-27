package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Safe Messaging API contracts for STORY-049.
 */
public final class SafeMessagingDtos {
    private SafeMessagingDtos() {
    }

    public record MessageThreadsResponse(List<MessageThreadSummary> threads, int unreadCount,
                                         List<String> availableActions, LocalDateTime updatedAt) {
    }

    public record MessageThreadSummary(String threadId, String threadReference, String threadType,
                                       MessageParticipantDisplay participant, MessageRelatedEntity relatedEntity,
                                       String lastMessagePreview, LocalDateTime lastUpdatedAt, int unreadCount,
                                       boolean muted, boolean escalated, boolean reported, boolean actionRequired,
                                       List<String> availableActions) {
    }

    public record MessageParticipantDisplay(String userId, String participantRole, String displayName,
                                            String avatarUrl, String storeName, boolean realNameHidden,
                                            boolean privacySafe, boolean verifiedBadgeVisible) {
    }

    public record MessageRelatedEntity(String relatedEntityType, String relatedEntityId,
                                       String relatedEntityReference, String status, String summary,
                                       String route, boolean accessAllowed) {
    }

    public record MessageContext(String contextType, String contextId, String reference,
                                 String route, String userSafeMessage) {
    }

    public record MessagePolicyWarning(boolean noDirectContactInfo, boolean noDigitalCodeSharing,
                                       boolean noOffPlatformPayment, boolean attachmentsPlaceholder,
                                       String userSafeMessage) {
    }

    public record MessageThreadDetail(String threadId, String threadReference,
                                      List<MessageParticipantDisplay> participants,
                                      MessageRelatedEntity relatedEntity, List<ChatMessageItem> messages,
                                      MessagingAttachmentPolicy attachmentPolicy, MessagingSafetyRules safetyRules,
                                      String threadStatus, boolean muted, boolean blocked, boolean escalated,
                                      List<String> availableActions) {
    }

    public record ChatMessageItem(String messageId, String threadId, MessageParticipantDisplay sender,
                                  String messageText, List<MessageAttachmentItem> attachments,
                                  LocalDateTime createdAt, String deliveryStatus, String readStatus,
                                  String moderationStatus, String userSafeModerationMessage,
                                  boolean systemMessage, List<String> availableActions) {
    }

    public record MessageAttachmentItem(String attachmentId, String fileName, String fileType, long fileSize,
                                        String previewUrl, String uploadStatus, String scanStatus,
                                        String visibilityPolicy, LocalDateTime createdAt) {
    }

    public record SendMessageRequest(String messageText, List<String> attachmentIds,
                                     boolean userAcknowledgedSafeMessagingRules) {
    }

    public record SendMessageResponse(String messageId, String status, String deliveryStatus,
                                      String moderationStatus, String message, String blockedReasonCode,
                                      String userSafeBlockedReason) {
    }

    public record MessageDraftValidationRequest(String threadId, String messageText, List<String> attachmentIds) {
    }

    public record MessageDraftValidationResponse(boolean allowed, List<String> warnings, boolean blocked,
                                                 List<String> blockedReasonCodes, String userSafeMessage,
                                                 String suggestedFix) {
    }

    public record MessagingAttachmentPolicy(boolean attachmentsAllowed, List<String> allowedFileTypes,
                                            long maxFileSize, int maxAttachments, boolean scanRequired,
                                            String visibilityPolicy, String userSafeMessage) {
    }

    public record MessagingSafetyRules(boolean contactSharingBlocked, boolean digitalCodeSharingBlocked,
                                       boolean externalPaymentBlocked, boolean rawDownloadUrlBlocked,
                                       boolean passwordOtpBlocked, boolean harassmentDetectionEnabled,
                                       boolean personalAddressBlockedUnlessShipping, String userSafeWarning) {
    }

    public record ReportMessageRequest(String reasonCode, String message, List<String> attachmentIds,
                                       boolean userAcknowledgedReportRules) {
    }

    public record ReportUserRequest(String reasonCode, String message, List<String> relatedMessageIds,
                                    List<String> attachmentIds) {
    }

    public record EscalateThreadRequest(String escalationType, String reason, String message,
                                        List<String> attachmentIds, String relatedEntityId,
                                        boolean userAcknowledgedEscalationRules) {
    }

    public record MessagingActionResponse(boolean success, String status, String message, LocalDateTime updatedAt) {
    }

    public record MessageActionEligibility(boolean openThread, boolean sendMessage, boolean reportMessage,
                                           boolean viewOrder, boolean viewListing, boolean viewSellerStore,
                                           boolean markRead, boolean archiveThreadPlaceholder,
                                           List<String> disabledReasons) {
    }

    public record MessageSearchResultItem(String messageId, String threadId, String matchingSnippet,
                                          String senderDisplayName, MessageRelatedEntity relatedEntity,
                                          LocalDateTime createdAt, String route) {
    }

    public record AdminMessageModerationQueueItem(String reportId, String threadId, String messageId,
                                                 String reportType, String severity, String status,
                                                 LocalDateTime createdAt, boolean placeholder) {
    }

    public static List<MessageThreadSummary> threads() {
        MessageParticipantDisplay seller = seller();
        return List.of(
                new MessageThreadSummary("thread-1001", "MSG-1001", "ORDER", seller, orderEntity(),
                        "Please check the secure delivery status in Sharity.", LocalDateTime.now().minusMinutes(12),
                        2, false, false, false, true,
                        List.of("OPEN_THREAD", "MUTE", "REPORT_USER", "ESCALATE")),
                new MessageThreadSummary("thread-1002", "MSG-1002", "DISPUTE", seller, disputeEntity(),
                        "A support teammate has joined this dispute thread.", LocalDateTime.now().minusHours(3),
                        0, true, true, false, false,
                        List.of("OPEN_THREAD", "UNMUTE", "VIEW_DISPUTE")));
    }

    public static MessageThreadsResponse response() {
        List<MessageThreadSummary> items = threads();
        int unread = items.stream().mapToInt(MessageThreadSummary::unreadCount).sum();
        return new MessageThreadsResponse(items, unread, List.of("OPEN_THREAD", "SEARCH", "MARK_READ"),
                LocalDateTime.now());
    }

    public static MessageThreadDetail thread(String threadId) {
        return new MessageThreadDetail(threadId, "MSG-1001", List.of(buyer(), seller()), orderEntity(),
                messages(threadId), attachmentPolicy(), safetyRules(), "ACTIVE", false, false, false,
                List.of("SEND_MESSAGE", "ATTACH_EVIDENCE", "REPORT_MESSAGE", "REPORT_USER",
                        "BLOCK_USER", "MUTE_CONVERSATION", "ESCALATE_TO_SUPPORT", "BACK"));
    }

    public static List<ChatMessageItem> messages(String threadId) {
        return List.of(
                new ChatMessageItem("msg-1", threadId, buyer(),
                        "Hi, the order page says digital delivery is ready but I cannot see the reveal button.",
                        List.of(), LocalDateTime.now().minusHours(1), "DELIVERED", "READ", "APPROVED",
                        null, false, List.of("REPORT_MESSAGE")),
                new ChatMessageItem("msg-2", threadId, seller(),
                        "Please use the secure delivery screen. Codes cannot be shared in chat.",
                        List.of(), LocalDateTime.now().minusMinutes(42), "DELIVERED", "READ", "APPROVED",
                        null, false, List.of("REPORT_MESSAGE")));
    }

    public static SendMessageResponse send(SendMessageRequest request) {
        MessageDraftValidationResponse validation = validateText(request == null ? "" : request.messageText());
        if (validation.blocked()) {
            return new SendMessageResponse(null, "BLOCKED", "NOT_SENT", "BLOCKED",
                    "Message blocked by safety rules.", validation.blockedReasonCodes().get(0),
                    validation.userSafeMessage());
        }
        return new SendMessageResponse("msg-" + System.currentTimeMillis(), "SENT", "DELIVERED",
                "APPROVED", "Message sent safely.", null, null);
    }

    public static MessageDraftValidationResponse validateText(String text) {
        String value = text == null ? "" : text.toLowerCase();
        if (value.matches(".*\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b.*")) {
            return blocked("MESSAGE_DIGITAL_CODE_BLOCKED",
                    "Digital codes must be delivered through Sharity secure delivery.");
        }
        if (value.contains("@") || value.matches(".*\\b\\d{3}[- .]?\\d{3}[- .]?\\d{4}\\b.*")
                || value.contains("whatsapp") || value.contains("telegram")) {
            return blocked("MESSAGE_CONTACT_SHARING_BLOCKED",
                    "Keep communication inside Sharity. Phone, email, or social handles are not allowed.");
        }
        if (value.contains("paypal.me") || value.contains("cashapp") || value.contains("venmo")) {
            return blocked("MESSAGE_EXTERNAL_PAYMENT_BLOCKED",
                    "External payment links are not allowed.");
        }
        return new MessageDraftValidationResponse(true, List.of(), false, List.of(),
                "Message looks safe to send.", null);
    }

    public static MessagingActionResponse action(String message) {
        return new MessagingActionResponse(true, "OK", message, LocalDateTime.now());
    }

    public static List<MessageSearchResultItem> searchResults() {
        return List.of(new MessageSearchResultItem("msg-2", "thread-1001",
                "secure delivery screen", "Sharity Digital Deals", orderEntity(),
                LocalDateTime.now().minusMinutes(42), "/messages/thread/thread-1001"));
    }

    public static List<AdminMessageModerationQueueItem> adminQueue() {
        return List.of(new AdminMessageModerationQueueItem("message-report-1", "thread-1001",
                "msg-unsafe-1", "DIGITAL_CODE", "HIGH", "PENDING", LocalDateTime.now().minusHours(2), true));
    }

    public static MessagingAttachmentPolicy attachmentPolicy() {
        return new MessagingAttachmentPolicy(true, List.of("image/png", "image/jpeg", "application/pdf"),
                5_000_000L, 3, true, "REFUND_DISPUTE_EVIDENCE_ONLY",
                "Evidence attachments are scanned and access-controlled.");
    }

    public static MessagingSafetyRules safetyRules() {
        return new MessagingSafetyRules(true, true, true, true, true, true, true,
                "Do not share phone numbers, email, payment links, passwords, digital codes, card details, or private contact information.");
    }

    public static MessagePolicyWarning policyWarning() {
        return new MessagePolicyWarning(true, true, true, true,
                "Safe Messaging blocks private contact info, off-platform payment, and digital code sharing.");
    }

    public static MessageActionEligibility actions() {
        return new MessageActionEligibility(true, true, true, true, true, true,
                true, true, List.of());
    }

    private static MessageParticipantDisplay buyer() {
        return new MessageParticipantDisplay("user-1000", "BUYER", "Phoenix Buyer",
                "marketplace/placeholders/avatar.png", null, true, true, false);
    }

    private static MessageParticipantDisplay seller() {
        return new MessageParticipantDisplay("seller-1000", "SELLER", "Sharity Digital Deals",
                "marketplace/placeholders/store.png", "Sharity Digital Deals", true, true, true);
    }

    private static MessageRelatedEntity orderEntity() {
        return new MessageRelatedEntity("ORDER", "order-1001", "SH-1001",
                "DIGITAL_DELIVERY_READY", "Digital delivery ready. Use secure reveal flow.",
                "/orders/order-1001", true);
    }

    private static MessageRelatedEntity disputeEntity() {
        return new MessageRelatedEntity("DISPUTE", "dispute-2001", "DSP-2001",
                "SUPPORT_REVIEW", "Sharity Review is in progress.", "/disputes/dispute-2001", true);
    }

    private static MessageDraftValidationResponse blocked(String code, String message) {
        return new MessageDraftValidationResponse(false, List.of(), true, List.of(code), message,
                "Edit the message to remove unsafe content.");
    }
}

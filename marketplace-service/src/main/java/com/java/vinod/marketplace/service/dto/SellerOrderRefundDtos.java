package com.java.vinod.marketplace.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Buyer Refund Per Seller Order contracts for STORY-039.
 */
public final class SellerOrderRefundDtos {
    private SellerOrderRefundDtos() {
    }

    public record ParentOrderRefundSummaryResponse(String parentOrderId, String parentOrderReference,
                                                   LocalDateTime orderDate, int totalSellerOrders, int totalItems,
                                                   String orderStatus, String paymentStatus, String currency,
                                                   List<SellerOrderRefundSummary> sellerOrderRefundSummaries,
                                                   List<String> availableActions) {
    }

    public record SellerOrderRefundSummary(String sellerOrderId, String sellerOrderReference, String sellerId,
                                           String storeName, String sellerAlias, List<String> productThumbnails,
                                           int itemCount, String sellerOrderStatus, String paymentStatus,
                                           String captureStatus, String digitalDeliveryStatus,
                                           String refundEligibilityStatus, String existingRefundStatus,
                                           BigDecimal estimatedRefundableAmount, String currency,
                                           List<String> availableActions,
                                           List<SellerOrderItemRefundEligibility> items) {
    }

    public record SellerOrderItemRefundEligibility(String sellerOrderItemId, String productId, String listingId,
                                                   String productTitle, String productImageUrl, String productType,
                                                   String deliveryType, int quantity, BigDecimal price,
                                                   String currency, String refundRuleSummary,
                                                   DigitalRefundAccessContext digitalAccessContext,
                                                   String eligibilityStatus, String eligibilityMessage,
                                                   BigDecimal maxRefundAmount, BigDecimal minRefundAmount,
                                                   boolean adminReviewRequired, List<String> availableReasons) {
    }

    public record DigitalRefundAccessContext(boolean codeAssigned, boolean codeRevealed,
                                             LocalDateTime revealTimestamp, boolean fileDownloaded,
                                             LocalDateTime downloadTimestamp, String manualDeliveryStatus,
                                             String accessGrantedStatus, String refundPolicyTemplate,
                                             boolean adminReviewRequired, String buyerSafeMessage) {
    }

    public record RefundReasonOption(String reasonCode, String label, String description,
                                     List<String> productTypes, String evidenceRecommended,
                                     boolean evidenceRequired, boolean adminReviewMayBeRequired,
                                     boolean customAmountAllowed) {
    }

    public record RefundEstimateRequest(String parentOrderId, String sellerOrderId, List<String> sellerOrderItemIds,
                                        String reasonCode, BigDecimal requestedAmount, List<String> evidenceIds,
                                        boolean buyerAcknowledgedDigitalPolicy) {
    }

    public record RefundEstimateResponse(BigDecimal suggestedRefundAmount, BigDecimal maxRefundAmount,
                                         BigDecimal minRefundAmount, RefundBreakdown refundBreakdown,
                                         boolean adminReviewRequired, boolean sellerResponseRequired,
                                         LocalDateTime sellerResponseDeadlinePreview, String currency,
                                         List<String> messages) {
    }

    public record RefundBreakdown(BigDecimal itemRefund, BigDecimal sellerCouponImpact,
                                  BigDecimal platformCouponImpact, boolean buyerServiceFeeRefundable,
                                  BigDecimal buyerServiceFeeRefundAmount, String sharityCreditReturnBehavior,
                                  BigDecimal taxRefundAmount, BigDecimal shippingRefundAmount,
                                  BigDecimal totalEstimatedRefund, String refundMethodEstimate,
                                  String currency) {
    }

    public record RefundEvidenceItem(String evidenceId, String fileName, String fileType, long fileSize,
                                     String previewUrl, String uploadStatus, String visibilityPolicy,
                                     LocalDateTime uploadedAt) {
    }

    public record SubmitRefundRequest(String parentOrderId, String sellerOrderId, List<String> sellerOrderItemIds,
                                      String reasonCode, BigDecimal requestedAmount, List<String> evidenceIds,
                                      String buyerMessage, boolean buyerAcknowledgedDigitalPolicy,
                                      boolean buyerAcknowledgedRefundEstimateMayChange) {
    }

    public record SubmitRefundResponse(String refundRequestId, String status, boolean sellerResponseRequired,
                                       LocalDateTime sellerResponseDeadline, boolean adminReviewRequired,
                                       boolean payoutHoldCreated, String nextRoute, String message) {
    }

    public record RefundTimelineEvent(String eventId, String refundRequestId, String eventType, String actorType,
                                      String title, String message, LocalDateTime timestamp, String status,
                                      boolean buyerSafe) {
    }

    public record CancelRefundRequest(String reason, boolean buyerAcknowledgedCancelImpact) {
    }

    public record EscalateRefundRequest(String escalationReason, String message,
                                        List<String> additionalEvidenceIds,
                                        boolean buyerAcknowledgedReviewRules) {
    }

    public static ParentOrderRefundSummaryResponse summary() {
        return new ParentOrderRefundSummaryResponse("parent-order-1000", "SH-1000", LocalDateTime.now().minusDays(2),
                3, 5, "PARTIALLY_DELIVERED", "AUTHORIZED_CAPTURED_BY_SELLER_ORDER", "USD",
                List.of(sellerOrder("seller-order-a", "SH-1000-A", "Game Code Hub",
                                "Digital access delivered", "ADMIN_REVIEW_MAY_BE_REQUIRED", money("18")),
                        sellerOrder("seller-order-b", "SH-1000-B", "SoftVault",
                                "Manual delivery pending", "ELIGIBLE", money("12")),
                        sellerOrder("seller-order-c", "SH-1000-C", "Device Depot",
                                "Physical return placeholder", "PHYSICAL_RETURN_LATER", money("42"))),
                List.of("SELECT_SELLER_ORDER", "VIEW_TIMELINE", "MESSAGE_SELLER_SAFELY"));
    }

    public static List<RefundReasonOption> reasons() {
        return List.of(reason("DIGITAL_CODE_NOT_WORKING", "Digital code not working", true, true),
                reason("DIGITAL_CODE_ALREADY_USED", "Digital code already used", true, true),
                reason("DIGITAL_ITEM_NOT_RECEIVED", "Digital item not received", false, false),
                reason("SECURE_DOWNLOAD_ISSUE", "Secure download issue", false, true),
                reason("MANUAL_DELIVERY_ISSUE", "Manual delivery issue", false, false),
                reason("WRONG_ITEM_ACCESS", "Wrong item/access", true, true),
                reason("SELLER_DID_NOT_ACCEPT_ORDER", "Seller did not accept order", false, false),
                reason("SELLER_REJECTED_ORDER", "Seller rejected order", false, false),
                reason("PHYSICAL_ELECTRONICS_RETURN_LATER", "Physical/electronics return later", false, true),
                reason("OTHER_ISSUE", "Other issue", false, true));
    }

    public static RefundEstimateResponse estimate() {
        return new RefundEstimateResponse(money("18"), money("20"), money("0"), breakdown(),
                true, true, LocalDateTime.now().plusDays(1), "USD",
                List.of("Digital code was revealed, so Sharity Review may be required.",
                        "Refund affects only selected seller order by default."));
    }

    public static RefundBreakdown breakdown() {
        return new RefundBreakdown(money("20"), money("-2"), money("0"), false,
                money("0"), "Later-phase placeholder: refund credit may return based on credit type.",
                money("0"), money("0"), money("18"), "Original payment method after review", "USD");
    }

    public static RefundEvidenceItem evidence() {
        return new RefundEvidenceItem("evidence-001", "code-error-screenshot.png", "image/png",
                240000, "marketplace/placeholders/gift_cards.png", "UPLOADED",
                "May be shared with seller/admin based on policy", LocalDateTime.now());
    }

    public static SubmitRefundResponse submit() {
        return new SubmitRefundResponse("refund-seller-order-001", "SELLER_RESPONSE_PENDING",
                true, LocalDateTime.now().plusDays(1), true, true,
                "/refunds/refund-seller-order-001/timeline",
                "Refund request submitted and payout hold created for the selected seller order.");
    }

    public static List<RefundTimelineEvent> timeline() {
        return List.of(new RefundTimelineEvent("timeline-1", "refund-seller-order-001", "REFUND_REQUESTED",
                        "BUYER", "Refund requested", "Buyer submitted seller-order evidence.",
                        LocalDateTime.now().minusHours(2), "COMPLETED", true),
                new RefundTimelineEvent("timeline-2", "refund-seller-order-001", "SELLER_RESPONSE_PENDING",
                        "SELLER", "Seller response pending", "Seller has 24 hours to respond.",
                        LocalDateTime.now().minusHours(1), "PENDING", true),
                new RefundTimelineEvent("timeline-3", "refund-seller-order-001", "SHARITY_REVIEW_AVAILABLE",
                        "SHARITY", "Sharity Review available", "Escalation can open if eligible.",
                        LocalDateTime.now(), "AVAILABLE", true));
    }

    private static SellerOrderRefundSummary sellerOrder(String id, String reference, String storeName,
                                                        String deliveryStatus, String eligibility, BigDecimal amount) {
        return new SellerOrderRefundSummary(id, reference, id.replace("seller-order", "seller"), storeName,
                storeName.replace(" ", ""), List.of("marketplace/placeholders/gift_cards.png"), 1,
                deliveryStatus.contains("Physical") ? "DELIVERED_PLACEHOLDER" : "DIGITAL_ACCESS_READY",
                "AUTHORIZED", "CAPTURED_FOR_ACCEPTED_SELLER_ORDER", deliveryStatus, eligibility,
                "NONE", amount, "USD", List.of("SELECT_SELLER_ORDER", "MESSAGE_SELLER_SAFELY"),
                List.of(item(id + "-item-1", storeName, deliveryStatus, amount)));
    }

    private static SellerOrderItemRefundEligibility item(String id, String storeName, String deliveryStatus, BigDecimal amount) {
        boolean codeRevealed = deliveryStatus.contains("delivered");
        DigitalRefundAccessContext context = new DigitalRefundAccessContext(!deliveryStatus.contains("Physical"),
                codeRevealed, codeRevealed ? LocalDateTime.now().minusDays(2) : null, false, null,
                deliveryStatus.contains("Manual") ? "PENDING" : "NOT_REQUIRED", deliveryStatus,
                "DIGITAL_REVIEW_POLICY", codeRevealed,
                codeRevealed ? "Code was already revealed. Refund may require Sharity Review." : "Access has not been revealed or completed.");
        return new SellerOrderItemRefundEligibility(id, "product-" + id, "listing-" + id,
                storeName + " digital item", "marketplace/placeholders/gift_cards.png",
                deliveryStatus.contains("Physical") ? "ELECTRONICS_PLACEHOLDER" : "DIGITAL_CODE",
                deliveryStatus.contains("Physical") ? "PHYSICAL_RETURN_LATER" : "SECURE_DIGITAL_ACCESS",
                1, amount, "USD", codeRevealed ? "After reveal, refund may require Sharity Review." : "Refund is usually simpler before reveal.",
                context, deliveryStatus.contains("Physical") ? "PLACEHOLDER" : "ELIGIBLE_WITH_REVIEW",
                "Refund is scoped to this seller order item.", amount, money("0"), codeRevealed,
                List.of("DIGITAL_CODE_NOT_WORKING", "DIGITAL_ITEM_NOT_RECEIVED", "OTHER_ISSUE"));
    }

    private static RefundReasonOption reason(String code, String label, boolean evidenceRequired, boolean review) {
        return new RefundReasonOption(code, label, label + " buyer-safe explanation.",
                List.of("DIGITAL", "ELECTRONICS_LATER"), "Screenshot or seller message proof",
                evidenceRequired, review, true);
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}

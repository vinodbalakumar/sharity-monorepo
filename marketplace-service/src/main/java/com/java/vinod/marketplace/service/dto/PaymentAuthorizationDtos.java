package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Payment Authorization contracts for STORY-036.
 */
public final class PaymentAuthorizationDtos {
    private PaymentAuthorizationDtos() {
    }

    public record PaymentAuthorizationScreenResponse(String checkoutSessionId, Object parentOrderPreview,
                                                     List<PaymentProviderOption> paymentProviderOptions,
                                                     PaymentAuthorizationPricingSummary pricingSummary,
                                                     String authorizationNotice,
                                                     SellerAcceptanceSummary sellerAcceptanceSummary,
                                                     List<SellerOrderAuthorizationStatus> sellerOrderAuthorizationStatuses,
                                                     DigitalDeliveryEligibilitySummary digitalDeliveryEligibility,
                                                     List<PaymentTimelineEvent> paymentTimeline,
                                                     List<String> availableActions) {
    }

    public record PaymentProviderOption(String providerCode, String providerName, boolean enabled,
                                        boolean primary, boolean comingSoon, String status,
                                        String message, List<String> availableActions) {
    }

    public record PaymentAuthorizationPricingSummary(BigDecimal itemsTotal, BigDecimal sellerDiscounts,
                                                     BigDecimal platformDiscounts, BigDecimal buyerServiceFee,
                                                     BigDecimal sharityCreditApplied, BigDecimal taxAmount,
                                                     BigDecimal shippingAmount, BigDecimal totalAuthorizationAmount,
                                                     BigDecimal totalCapturedAmount, BigDecimal totalReleasedAmount,
                                                     String currency) {
    }

    public record SellerAcceptanceSummary(int sellerOrderCount, int acceptanceRequiredCount, int acceptedCount,
                                          int pendingCount, int rejectedCount, int expiredCount,
                                          boolean allAccepted, boolean partiallyAccepted, String message) {
    }

    public record SellerOrderAuthorizationStatus(String sellerOrderId, String sellerOrderReference, String sellerId,
                                                 String storeName, String sellerAlias, int itemCount,
                                                 String productTypeSummary, BigDecimal amountAuthorized,
                                                 BigDecimal amountCaptured, BigDecimal amountReleased,
                                                 String currency, boolean sellerAcceptanceRequired,
                                                 String acceptanceStatus, LocalDateTime acceptanceDeadline,
                                                 String paymentAuthorizationStatus, String captureStatus,
                                                 String releaseStatus, String digitalDeliveryStatus,
                                                 String nextStep, List<String> availableActions) {
    }

    public record DigitalDeliveryEligibilitySummary(boolean eligible, String status, String message,
                                                    List<String> eligibleSellerOrderIds,
                                                    List<String> blockedSellerOrderIds,
                                                    List<String> blockedReasons) {
    }

    public record PaymentTimelineEvent(String eventId, String eventType, String sellerOrderId,
                                       String sellerOrderReference, String title, String description,
                                       LocalDateTime timestamp, String status, boolean buyerSafe) {
    }

    public record StartPayPalAuthorizationResponse(String checkoutSessionId, String provider,
                                                   String redirectUrl, String status, String message) {
    }

    public record ConfirmPayPalAuthorizationRequest(String providerReturnToken, String providerPayerId,
                                                    String checkoutSessionId) {
    }

    public record ConfirmPayPalAuthorizationResponse(String checkoutSessionId, String authorizationStatus,
                                                     String parentOrderId, String parentOrderReference,
                                                     List<SellerOrderAuthorizationStatus> sellerOrderStatuses,
                                                     String nextRoute, String message) {
    }

    public record SellerOrderAcceptanceRequest(@NotBlank String sellerOrderId, @NotBlank String action,
                                               String reason, boolean sellerAcknowledgedCaptureRules) {
    }

    public record SellerOrderAcceptanceResponse(String sellerOrderId, String acceptanceStatus,
                                                String captureStatus, String releaseStatus,
                                                String message, LocalDateTime updatedAt) {
    }

    public static PaymentAuthorizationScreenResponse mock(String checkoutSessionId) {
        LocalDateTime now = LocalDateTime.now();
        List<SellerOrderAuthorizationStatus> sellerOrders = List.of(
                order("seller-order-a", "SH-1000-A", "Game Code Hub", "GameCodeHub", false,
                        "ACCEPTED", "CAPTURED", "DIGITAL_DELIVERY_READY", "39.98", "39.98", "0.00", now),
                order("seller-order-b", "SH-1000-B", "Tech Deals Phoenix", "TechDealsPhoenix", true,
                        "PENDING", "CAPTURE_PENDING", "WAITING_FOR_SELLER_ACCEPTANCE", "217.51", "0.00", "0.00", now),
                order("seller-order-c", "SH-1000-C", "Template Studio", "TemplateStudio", true,
                        "REJECTED", "RELEASED", "DIGITAL_DELIVERY_BLOCKED", "24.99", "0.00", "24.99", now));
        return new PaymentAuthorizationScreenResponse(checkoutSessionId,
                java.util.Map.of("parentOrderReferencePreview", "SH-1000", "sellerOrderCount", 3),
                List.of(new PaymentProviderOption("PAYPAL", "PayPal", true, true, false,
                                "AVAILABLE", "PayPal is primary for MVP.", List.of("AUTHORIZE")),
                        new PaymentProviderOption("STRIPE", "Stripe", false, false, true,
                                "COMING_SOON", "Stripe authorization is coming later.", List.of())),
                new PaymentAuthorizationPricingSummary(money("293.98"), money("5.00"), money("10.00"),
                        money("3.50"), money("0.00"), money("0.00"), money("0.00"),
                        money("282.48"), money("39.98"), money("24.99"), "USD"),
                "Authorization confirms your payment method. Final capture may happen only for seller orders that are accepted and eligible.",
                new SellerAcceptanceSummary(3, 2, 1, 1, 1, 0, false, true,
                        "Partial acceptance: one seller accepted, one pending, one rejected."),
                sellerOrders,
                new DigitalDeliveryEligibilitySummary(false, "PARTIAL",
                        "Digital delivery is available only for captured seller orders.",
                        List.of("seller-order-a"), List.of("seller-order-b", "seller-order-c"),
                        List.of("Waiting for seller acceptance", "Seller rejected")),
                List.of(event("created", "Checkout session created", now.minusMinutes(60), "INFO"),
                        event("authorized", "Payment authorized", now.minusMinutes(30), "SUCCESS"),
                        event("pending", "Seller acceptance pending", now.minusMinutes(12), "WARNING"),
                        event("rejected", "Seller rejected", now.minusMinutes(6), "CRITICAL")),
                List.of("AUTHORIZE_PAYPAL", "RETRY", "RETURN_TO_CART", "CONTACT_SUPPORT"));
    }

    private static SellerOrderAuthorizationStatus order(String id, String ref, String store, String alias,
                                                        boolean required, String acceptance, String capture,
                                                        String delivery, String authorized, String captured,
                                                        String released, LocalDateTime now) {
        return new SellerOrderAuthorizationStatus(id, ref, id.replace("seller-order", "seller"),
                store, alias, 1, required ? "Electronics / manual digital delivery" : "Instant digital code",
                money(authorized), money(captured), money(released), "USD", required, acceptance,
                now.plusHours(22), "AUTHORIZED", capture, money(released).signum() > 0 ? "RELEASED" : "NONE",
                delivery, "PENDING".equals(acceptance) ? "Seller must accept within 24 hours." : "Buyer-safe status updated.",
                List.of("VIEW_ORDER_DETAILS", "CONTACT_SUPPORT"));
    }

    private static PaymentTimelineEvent event(String id, String title, LocalDateTime at, String status) {
        return new PaymentTimelineEvent(id, id.toUpperCase(), null, null, title,
                "Buyer-safe payment event.", at, status, true);
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}

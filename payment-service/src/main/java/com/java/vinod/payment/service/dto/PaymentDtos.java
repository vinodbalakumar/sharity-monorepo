package com.java.vinod.payment.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Carries payment order, payout, and refund payloads between the marketplace,
 * payment, and wallet flows.
 *
 * <p>These DTOs are intentionally small and descriptive so the held-funds and
 * payout lifecycle is easy to follow without exposing payment provider secrets
 * or business logic in the transport layer.</p>
 */
public final class PaymentDtos {
    private PaymentDtos() {
    }

    /**
     * Represents the customer checkout request that starts the held-funds flow.
     */
    public record CheckoutRequest(@NotBlank String marketplaceOrderPublicId,
                                  @NotNull @Positive BigDecimal amount,
                                  @NotBlank String currencyCode,
                                  String providerAccountPublicId,
                                  String customerUserPublicId,
                                  String providerCountryCode) {
    }

    /**
     * Summarizes a stored payment order for customer, provider, and admin views.
     */
    public record PaymentOrderResponse(String publicId, String marketplaceOrderPublicId,
                                       String paymentStatus, String payoutEligibilityStatus,
                                       BigDecimal customerChargeAmount, BigDecimal platformFeeAmount,
                                       BigDecimal providerPayableAmount, LocalDateTime createdAt) {
    }

    /**
     * Summarizes a provider payout record without exposing gateway secrets.
     */
    public record PayoutResponse(String publicId, String marketplaceOrderPublicId, String providerAccountPublicId,
                                 BigDecimal amount, String currencyCode, String payoutStatus, LocalDateTime paidAt) {
    }

    /**
     * Carries refund intent from the marketplace dispute flow into the payment service.
     */
    public record RefundRequest(String reason) {
    }

    /**
     * Carries cancellation or dispute context into the payment lifecycle API.
     */
    public record LifecycleRequest(String reason) {
    }

    /**
     * Summarizes the current refund, cancellation, and dispute lifecycle state for one order.
     */
    public record PaymentLifecycleResponse(String marketplaceOrderPublicId, String paymentStatus,
                                           String payoutEligibilityStatus, String payoutStatus,
                                           String refundStatus, String payoutHoldReason,
                                           String refundReason, LocalDateTime updatedAt) {
    }

    /**
     * Returns a human-readable success or status message for payment operations.
     */
    public record MessageResponse(String message) {
    }

    /**
     * Describes the payment gateway policy chosen for a country.
     *
     * <p>The super admin surface uses this response to show which gateway is
     * selected for each country and why that choice exists.</p>
     */
    public record PaymentGatewayPolicyResponse(String publicId, String countryCode, String gatewayMode,
                                               boolean active, String recommendationNote,
                                               LocalDateTime createdAt, LocalDateTime updatedAt) {
    }

    /**
     * Carries an admin decision for a country-level gateway preference.
     *
    * <p>The request stays intentionally small so super admins can switch a
    * country between sandbox, Stripe test mode, or the PayPal sandbox adapter without
    * changing buyer or provider flows.</p>
     */
    public record PaymentGatewayPolicyRequest(@NotBlank String countryCode,
                                              @NotBlank String gatewayMode,
                                              boolean active,
                                              String recommendationNote) {
    }

    /**
     * Summarizes the payment gateway options available to payment-service.
     */
    public record PaymentGatewayCatalogResponse(String gatewayMode, String displayName,
                                                String description, boolean active) {
    }

    public record StatusResponse(String statusCode, String displayLabel, String description,
                                 boolean customerVisible, boolean active, int sortOrder) {
    }

    public record PaymentMethodResponse(String methodCode, String displayLabel, String description,
                                        boolean active, int sortOrder) {
    }

    public record ReasonResponse(String reasonCode, String displayLabel, String description,
                                 boolean active, int sortOrder) {
    }

    /**
     * Summarizes the selected gateway strategy for a country.
     *
     * <p>This is safe for admin visibility because it exposes only the routing
     * decision and not any provider secrets.</p>
     */
    public record PaymentGatewayRecommendationResponse(String countryCode, String gatewayMode,
                                                       String recommendationNote,
                                                       boolean policyConfigured,
                                                       List<PaymentGatewayCatalogResponse> supportedGateways) {
    }

    /**
     * Builds a deterministic mock order used by tests and preview flows.
     */
    public static PaymentOrderResponse mockOrder(String marketplaceOrderPublicId, BigDecimal amount, String currencyCode) {
        BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.05));
        return new PaymentOrderResponse(UUID.randomUUID().toString(), marketplaceOrderPublicId, "CAPTURED",
                "ON_HOLD", amount, fee, amount.subtract(fee), LocalDateTime.now());
    }

    /**
     * Returns an empty order list for callers that need a stable no-data response.
     */
    public static List<PaymentOrderResponse> emptyOrders() {
        return List.of();
    }
}

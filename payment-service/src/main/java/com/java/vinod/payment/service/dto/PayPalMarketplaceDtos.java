package com.java.vinod.payment.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class PayPalMarketplaceDtos {
    private PayPalMarketplaceDtos() {
    }

    public record PayPalProviderAvailabilityResponse(boolean paypalEnabled, boolean buyerCheckoutEnabled,
                                                     boolean sellerOnboardingEnabled, boolean payoutVisibilityEnabled,
                                                     boolean sandboxMode, boolean countrySupported,
                                                     boolean marketplaceSupported, String unavailableReason,
                                                     String userSafeMessage) {}
    public record PayPalProviderConfigResponse(String providerCode, String mode, List<String> supportedCountries,
                                               List<String> enabledMarketplaces, boolean webhooksConfigured,
                                               boolean partnerReferralsEnabled, boolean ordersEnabled,
                                               String userSafeMessage) {}
    public record SellerPayPalAccountStatusResponse(String sellerId, boolean paypalAccountConnected,
                                                    String merchantIdMasked, boolean onboardingRequired,
                                                    boolean onboardingCompleted, boolean paymentsReceivable,
                                                    boolean primaryEmailConfirmed, boolean payoutsEnabled,
                                                    List<String> permissionsGranted, List<String> requirementsDue,
                                                    String country, String nextAction, String onboardingRoute,
                                                    String userSafeMessage, LocalDateTime updatedAt) {}
    public record SellerPayPalOnboardingLinkResponse(boolean success, String onboardingUrl,
                                                     LocalDateTime expiresAt, String returnUrl,
                                                     String refreshUrl, String userSafeMessage) {}
    public record SellerPayPalReturnRequest(String sellerId, String partnerReferralId, String merchantId,
                                            String returnStatus) {}
    public record SellerPayPalRefreshResponse(boolean success, SellerPayPalAccountStatusResponse status,
                                              String userSafeMessage) {}
    public record PayPalOrderCreateRequest(String checkoutId, boolean buyerAcknowledgedFinalAmount,
                                           boolean buyerAcknowledgedSellerAcceptance,
                                           boolean buyerAcknowledgedDigitalDelivery,
                                           String returnUrl, String cancelUrl) {}
    public record PayPalOrderCreateResponse(boolean success, String checkoutId, String paymentAuthorizationId,
                                            String paypalOrderIdSafeReference, String approveUrl,
                                            String status, boolean buyerRedirectRequired,
                                            String userSafeMessage) {}
    public record PayPalAuthorizeRequest(String paymentAuthorizationId, String checkoutId,
                                         String paypalOrderIdSafeReference) {}
    public record PayPalAuthorizeResponse(boolean success, String paymentAuthorizationId, String provider,
                                          String paypalOrderIdSafeReference, String authorizationIdSafeReference,
                                          String status, BigDecimal authorizedAmount, String currency,
                                          String nextRoute, String userSafeMessage) {}
    public record PayPalCaptureRequest(String paymentAuthorizationId, BigDecimal amountToCapture,
                                       String idempotencyKey) {}
    public record PayPalVoidRequest(String paymentAuthorizationId, String idempotencyKey) {}
    public record PayPalRefundRequest(String paymentAuthorizationId, BigDecimal refundAmount,
                                      String reason, String idempotencyKey) {}
    public record PayPalPaymentStatusResponse(String paymentAuthorizationId, String checkoutId,
                                              String provider, String status, boolean orderCreated,
                                              boolean authorized, boolean captured, boolean voided,
                                              boolean failed, boolean cancelled, boolean pending,
                                              String refundStatus, String disputeStatus,
                                              String orderReference, String nextRoute,
                                              String userSafeMessage, LocalDateTime updatedAt) {}
    public record PayPalActionResponse(boolean success, String status, String message,
                                       String nextRoute, boolean idempotent, LocalDateTime updatedAt) {}
    public record AdminPayPalConfigResponse(boolean paypalEnabled, String mode,
                                            List<String> supportedCountries,
                                            boolean partnerReferralsEnabled,
                                            boolean ordersApiEnabled,
                                            boolean webhooksConfigured,
                                            boolean secretsMasked, String adminSafeMessage,
                                            LocalDateTime updatedAt) {}
    public record AdminPayPalSellerAccountSummary(String sellerId, String sellerStoreDisplayName,
                                                  String merchantIdMasked, String onboardingStatus,
                                                  boolean paymentsReceivable,
                                                  boolean primaryEmailConfirmed,
                                                  boolean payoutsEnabled,
                                                  int requirementsDueCount, String country,
                                                  LocalDateTime lastRefreshedAt, String route,
                                                  String adminSafeMessage) {}
    public record AdminPayPalEventSummary(String eventId, String providerEventId, String eventType,
                                          String relatedEntityType, String relatedEntityId,
                                          boolean processed, String processingStatus,
                                          LocalDateTime receivedAt, String adminSafeSummary,
                                          String route) {}
    public record AdminPayPalWebhookHealth(boolean merchantOnboardingEndpointConfigured,
                                           boolean checkoutEndpointConfigured,
                                           LocalDateTime lastEventReceivedAt,
                                           int failedEventCount, int duplicateEventBlockedCount,
                                           boolean signatureVerificationHealthy,
                                           String adminSafeMessage) {}
    public record AdminPayPalDisputeSummary(String disputeId, String paymentAuthorizationId,
                                            String status, String reason, BigDecimal amount,
                                            String currency, String adminSafeMessage, String route) {}
    public record AdminPayPalSettlementSummary(String settlementId, String sellerId,
                                               String merchantIdMasked, String status,
                                               BigDecimal grossAmount, BigDecimal sellerReceivableAmount,
                                               String currency, LocalDateTime expectedSettlementAt,
                                               String adminSafeMessage) {}

    public static PayPalProviderAvailabilityResponse availability() {
        return new PayPalProviderAvailabilityResponse(true, true, true, true,
                true, true, true, null,
                "PayPal marketplace checkout is available in sandbox mock. Backend remains source of truth.");
    }

    public static PayPalProviderConfigResponse config() {
        return new PayPalProviderConfigResponse("PAYPAL_MARKETPLACE", "SANDBOX_MOCK",
                List.of("USA", "CAN", "GBR"), List.of("DIGITAL", "ELECTRONICS"),
                true, true, true,
                "PayPal credentials, partner referral payloads, webhook bodies, and provider tokens are backend-only.");
    }

    public static SellerPayPalAccountStatusResponse sellerStatus(String sellerId) {
        return new SellerPayPalAccountStatusResponse(sellerId, true, "merchant_***_7KQ",
                false, true, true, true, true,
                List.of("PAYMENT", "REFUND", "PARTNER_FEE"), List.of(),
                "USA", "READY_TO_SELL", "/seller/payments/paypal/onboarding",
                "Seller status is seller-safe and excludes KYC, credentials, and raw provider payloads.",
                LocalDateTime.now());
    }

    public static SellerPayPalOnboardingLinkResponse onboardingLink() {
        return new SellerPayPalOnboardingLinkResponse(true,
                "https://www.sandbox.paypal.com/bizsignup/partner/entry?referralToken=mock-token",
                LocalDateTime.now().plusMinutes(45), "/payment/paypal/return",
                "/payment/paypal/refresh",
                "Use PayPal-hosted partner onboarding in a browser; do not expose referral payloads to the app.");
    }

    public static SellerPayPalRefreshResponse refresh(String sellerId) {
        return new SellerPayPalRefreshResponse(true, sellerStatus(sellerId),
                "PayPal seller merchant integration status refreshed from mock provider state.");
    }

    public static PayPalOrderCreateResponse order(String checkoutId) {
        return new PayPalOrderCreateResponse(true, checkoutId, "paypal-auth-094",
                "PAYPAL-ORDER-***-SAFE",
                "https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-SAFE",
                "CREATED", true,
                "Order approval URL is a sandbox placeholder; real Orders API responses stay backend-owned.");
    }

    public static PayPalAuthorizeResponse authorize(String paymentAuthorizationId) {
        return new PayPalAuthorizeResponse(true, paymentAuthorizationId, "PAYPAL_MARKETPLACE",
                "PAYPAL-ORDER-***-SAFE", "PAYPAL-AUTH-***-SAFE",
                "AUTHORIZED_PENDING_SELLER_ACCEPTANCE",
                new BigDecimal("54.49"), "USD", "/orders/order-060",
                "Authorization status is verified by backend mock and hides seller commission and payout values.");
    }

    public static PayPalPaymentStatusResponse status(String paymentAuthorizationId) {
        return new PayPalPaymentStatusResponse(paymentAuthorizationId, "checkout-058",
                "PAYPAL_MARKETPLACE", "AUTHORIZED_PENDING_SELLER_ACCEPTANCE",
                true, true, false, false, false, false, false,
                "NONE", "NONE", "SH-100245", "/orders/order-060",
                "Buyer-safe PayPal status hides platform fee, seller receivable, merchant details, and provider payloads.",
                LocalDateTime.now());
    }

    public static PayPalActionResponse action(String status, String route) {
        return new PayPalActionResponse(true, status,
                "Mock PayPal action accepted with idempotency and audit expectations.", route,
                true, LocalDateTime.now());
    }

    public static AdminPayPalConfigResponse adminConfig() {
        return new AdminPayPalConfigResponse(true, "SANDBOX_MOCK",
                List.of("USA", "CAN", "GBR"), true, true, true, true,
                "Admin config masks PayPal client secrets, webhook IDs, merchant IDs, and partner credentials.",
                LocalDateTime.now());
    }

    public static List<AdminPayPalSellerAccountSummary> sellers() {
        return List.of(new AdminPayPalSellerAccountSummary("seller-code-vault", "Code Vault",
                "merchant_***_7KQ", "ONBOARDING_COMPLETE", true, true, true,
                0, "USA", LocalDateTime.now().minusMinutes(12),
                "/admin/payments/paypal/sellers/seller-code-vault",
                "Seller merchant data is masked and admin-safe."));
    }

    public static List<AdminPayPalEventSummary> events() {
        return List.of(new AdminPayPalEventSummary("paypal-event-local-094",
                "WH-***-SAFE", "CHECKOUT.ORDER.APPROVED",
                "PAYMENT_AUTHORIZATION", "paypal-auth-094", true,
                "PROCESSED", LocalDateTime.now().minusMinutes(3),
                "PayPal order approval mapped to internal authorization status.",
                "/admin/payments/paypal/events/paypal-event-local-094"));
    }

    public static AdminPayPalWebhookHealth webhookHealth() {
        return new AdminPayPalWebhookHealth(true, true, LocalDateTime.now().minusMinutes(3),
                0, 1, true,
                "Webhook placeholders require PayPal signature verification before production processing.");
    }

    public static List<AdminPayPalDisputeSummary> disputes() {
        return List.of(new AdminPayPalDisputeSummary("paypal-dispute-001", "paypal-auth-094",
                "INQUIRY_OPEN", "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
                new BigDecimal("54.49"), "USD",
                "Dispute payload is summarized without raw PayPal case data.",
                "/admin/payments/paypal/disputes/paypal-dispute-001"));
    }

    public static List<AdminPayPalSettlementSummary> settlements() {
        return List.of(new AdminPayPalSettlementSummary("paypal-settlement-001", "seller-code-vault",
                "merchant_***_7KQ", "PENDING_SETTLEMENT", new BigDecimal("54.49"),
                new BigDecimal("47.12"), "USD", LocalDateTime.now().plusDays(2),
                "Admin settlement summary is masked; buyer APIs never expose seller receivable or platform fee."));
    }
}

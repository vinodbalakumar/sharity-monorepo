package com.java.vinod.payment.service.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class StripeConnectDtos {
    private StripeConnectDtos() {
    }

    public record StripeProviderAvailabilityResponse(boolean stripeEnabled, boolean buyerCheckoutEnabled,
                                                     boolean sellerOnboardingEnabled, boolean payoutVisibilityEnabled,
                                                     boolean testMode, boolean countrySupported,
                                                     boolean marketplaceSupported, String unavailableReason,
                                                     String userSafeMessage) {}
    public record StripeProviderConfigResponse(String providerCode, String mode, List<String> supportedCountries,
                                               List<String> enabledMarketplaces, boolean webhooksConfigured,
                                               boolean connectEnabled, String userSafeMessage) {}
    public record SellerStripeAccountStatusResponse(String sellerId, boolean stripeAccountConnected,
                                                    String connectedAccountIdMasked, boolean onboardingRequired,
                                                    boolean onboardingCompleted, boolean chargesEnabled,
                                                    boolean payoutsEnabled, List<String> requirementsDue,
                                                    String country, String nextAction, String onboardingRoute,
                                                    String userSafeMessage, LocalDateTime updatedAt) {}
    public record SellerStripeOnboardingLinkResponse(boolean success, String onboardingUrl,
                                                     LocalDateTime expiresAt, String returnUrl,
                                                     String refreshUrl, String userSafeMessage) {}
    public record SellerStripeReturnRequest(String sellerId, String state, String returnStatus) {}
    public record SellerStripeRefreshResponse(boolean success, SellerStripeAccountStatusResponse status,
                                              String userSafeMessage) {}
    public record StripePaymentIntentCreateRequest(String checkoutId, String selectedPaymentMethodId,
                                                   boolean buyerAcknowledgedFinalAmount,
                                                   boolean buyerAcknowledgedSellerAcceptance,
                                                   boolean buyerAcknowledgedDigitalDelivery,
                                                   String returnUrl, String cancelUrl) {}
    public record StripePaymentIntentCreateResponse(boolean success, String checkoutId,
                                                    String paymentAuthorizationId,
                                                    String paymentIntentIdSafeReference,
                                                    String clientSecretPlaceholder,
                                                    boolean paymentSheetRequired, String status,
                                                    String userSafeMessage) {}
    public record StripeConfirmRequest(String paymentAuthorizationId, String checkoutId) {}
    public record StripeAuthorizeResponse(boolean success, String paymentAuthorizationId, String provider,
                                          String paymentIntentIdSafeReference, String status,
                                          BigDecimal authorizedAmount, String currency, String nextRoute,
                                          String userSafeMessage) {}
    public record StripeCaptureRequest(String paymentAuthorizationId, BigDecimal amountToCapture,
                                       String idempotencyKey) {}
    public record StripeVoidRequest(String paymentAuthorizationId, String idempotencyKey) {}
    public record StripeRefundRequest(String paymentAuthorizationId, BigDecimal refundAmount,
                                      String reason, String idempotencyKey) {}
    public record StripePaymentStatusResponse(String paymentAuthorizationId, String checkoutId,
                                              String provider, String status, boolean authorized,
                                              boolean captured, boolean voided, boolean failed,
                                              boolean cancelled, boolean pending,
                                              String refundStatus, String disputeStatus,
                                              String orderReference, String nextRoute,
                                              String userSafeMessage, LocalDateTime updatedAt) {}
    public record StripeActionResponse(boolean success, String status, String message,
                                       String nextRoute, boolean idempotent, LocalDateTime updatedAt) {}
    public record AdminStripeConfigResponse(boolean stripeEnabled, String mode,
                                            List<String> supportedCountries,
                                            boolean connectEnabled, boolean webhooksConfigured,
                                            boolean secretsMasked, String adminSafeMessage,
                                            LocalDateTime updatedAt) {}
    public record AdminStripeSellerAccountSummary(String sellerId, String sellerStoreDisplayName,
                                                  String connectedAccountIdMasked, String onboardingStatus,
                                                  boolean chargesEnabled, boolean payoutsEnabled,
                                                  int requirementsDueCount, String country,
                                                  LocalDateTime lastRefreshedAt, String route,
                                                  String adminSafeMessage) {}
    public record AdminStripeEventSummary(String eventId, String providerEventId, String eventType,
                                          String relatedEntityType, String relatedEntityId,
                                          boolean processed, String processingStatus,
                                          LocalDateTime receivedAt, String adminSafeSummary,
                                          String route) {}
    public record AdminStripeWebhookHealth(boolean accountEndpointConfigured,
                                           boolean connectEndpointConfigured,
                                           LocalDateTime lastEventReceivedAt,
                                           int failedEventCount, int duplicateEventBlockedCount,
                                           boolean signatureVerificationHealthy,
                                           String adminSafeMessage) {}
    public record AdminStripeDisputeSummary(String disputeId, String paymentAuthorizationId,
                                            String status, String reason, BigDecimal amount,
                                            String currency, String adminSafeMessage, String route) {}
    public record AdminStripePayoutSummary(String payoutId, String sellerId,
                                           String connectedAccountIdMasked, String status,
                                           BigDecimal amount, String currency,
                                           LocalDateTime expectedArrivalAt, String adminSafeMessage) {}

    public static StripeProviderAvailabilityResponse availability() {
        return new StripeProviderAvailabilityResponse(true, true, true, true,
                true, true, true, null,
                "Stripe Connect is available in test-mode mock. Backend remains source of truth.");
    }

    public static StripeProviderConfigResponse config() {
        return new StripeProviderConfigResponse("STRIPE_CONNECT", "TEST_MODE",
                List.of("USA", "CAN", "GBR"), List.of("DIGITAL", "ELECTRONICS"),
                true, true, "Stripe secrets, client secrets, and provider payloads are backend-only.");
    }

    public static SellerStripeAccountStatusResponse sellerStatus(String sellerId) {
        return new SellerStripeAccountStatusResponse(sellerId, true, "acct_***_9Y2",
                false, true, true, false, List.of("external_account"),
                "USA", "COMPLETE_PAYOUT_SETUP", "/seller/payments/stripe/onboarding",
                "Seller status is seller-safe and excludes KYC/provider payloads.", LocalDateTime.now());
    }

    public static SellerStripeOnboardingLinkResponse onboardingLink() {
        return new SellerStripeOnboardingLinkResponse(true,
                "https://connect.stripe.com/setup/s/mock-account-link",
                LocalDateTime.now().plusMinutes(30), "/payment/stripe/return",
                "/payment/stripe/refresh",
                "Use Stripe-hosted onboarding in a browser; do not open inside an embedded webview.");
    }

    public static SellerStripeRefreshResponse refresh(String sellerId) {
        return new SellerStripeRefreshResponse(true, sellerStatus(sellerId),
                "Stripe account status refreshed from mock provider state.");
    }

    public static StripePaymentIntentCreateResponse paymentIntent(String checkoutId) {
        return new StripePaymentIntentCreateResponse(true, checkoutId, "stripe-auth-093",
                "pi_***_safe", "client_secret_placeholder_not_real", true,
                "REQUIRES_CONFIRMATION",
                "Client secret is placeholder only; real client secrets must be ephemeral and backend-created.");
    }

    public static StripeAuthorizeResponse authorize(String paymentAuthorizationId) {
        return new StripeAuthorizeResponse(true, paymentAuthorizationId, "STRIPE_CONNECT",
                "pi_***_safe", "AUTHORIZED_PENDING_SELLER_ACCEPTANCE",
                new BigDecimal("54.49"), "USD", "/orders/order-060",
                "PaymentIntent status verified by backend mock status.");
    }

    public static StripePaymentStatusResponse status(String paymentAuthorizationId) {
        return new StripePaymentStatusResponse(paymentAuthorizationId, "checkout-058",
                "STRIPE_CONNECT", "AUTHORIZED_PENDING_SELLER_ACCEPTANCE",
                true, false, false, false, false, false,
                "NONE", "NONE", "SH-100245", "/orders/order-060",
                "Buyer-safe status hides seller commission, payout, and provider payloads.",
                LocalDateTime.now());
    }

    public static StripeActionResponse action(String status, String route) {
        return new StripeActionResponse(true, status,
                "Mock Stripe action accepted with idempotency and audit expectations.", route,
                true, LocalDateTime.now());
    }

    public static AdminStripeConfigResponse adminConfig() {
        return new AdminStripeConfigResponse(true, "TEST_MODE", List.of("USA", "CAN", "GBR"),
                true, true, true,
                "Admin config masks all Stripe secrets and webhook signing secrets.", LocalDateTime.now());
    }

    public static List<AdminStripeSellerAccountSummary> sellers() {
        return List.of(new AdminStripeSellerAccountSummary("seller-code-vault", "Code Vault",
                "acct_***_9Y2", "ONBOARDING_COMPLETE", true, false, 1, "USA",
                LocalDateTime.now().minusMinutes(15), "/admin/payments/stripe/sellers/seller-code-vault",
                "Connected account details are masked."));
    }

    public static List<AdminStripeEventSummary> events() {
        return List.of(new AdminStripeEventSummary("evt-local-093", "evt_***_safe",
                "payment_intent.succeeded", "PAYMENT_AUTHORIZATION", "stripe-auth-093",
                true, "PROCESSED", LocalDateTime.now().minusMinutes(4),
                "PaymentIntent succeeded and mapped to internal payment status.",
                "/admin/payments/stripe/events/evt-local-093"));
    }

    public static AdminStripeWebhookHealth webhookHealth() {
        return new AdminStripeWebhookHealth(true, true, LocalDateTime.now().minusMinutes(4),
                0, 2, true,
                "Account and Connect webhook placeholders require signature verification in production.");
    }

    public static List<AdminStripeDisputeSummary> disputes() {
        return List.of(new AdminStripeDisputeSummary("stripe-dispute-001", "stripe-auth-093",
                "NEEDS_RESPONSE", "product_not_received", new BigDecimal("54.49"),
                "USD", "Dispute payload is summarized without raw provider data.",
                "/admin/payments/stripe/disputes/stripe-dispute-001"));
    }

    public static List<AdminStripePayoutSummary> payouts() {
        return List.of(new AdminStripePayoutSummary("stripe-payout-001", "seller-code-vault",
                "acct_***_9Y2", "PENDING", new BigDecimal("47.12"), "USD",
                LocalDateTime.now().plusDays(2), "Seller payout summary is admin-safe."));
    }
}

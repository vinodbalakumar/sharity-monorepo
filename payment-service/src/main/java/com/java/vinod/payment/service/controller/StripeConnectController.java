package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.StripeConnectDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class StripeConnectController {
    @GetMapping("/api/payments/providers/stripe/availability")
    public StripeConnectDtos.StripeProviderAvailabilityResponse availability() {
        return StripeConnectDtos.availability();
    }

    @GetMapping("/api/payments/providers/stripe/config")
    public StripeConnectDtos.StripeProviderConfigResponse config() {
        return StripeConnectDtos.config();
    }

    @GetMapping("/api/seller/payments/stripe/status")
    public StripeConnectDtos.SellerStripeAccountStatusResponse sellerStatus() {
        return StripeConnectDtos.sellerStatus("seller-code-vault");
    }

    @PostMapping("/api/seller/payments/stripe/onboarding-link")
    public StripeConnectDtos.SellerStripeOnboardingLinkResponse onboardingLink() {
        return StripeConnectDtos.onboardingLink();
    }

    @PostMapping("/api/seller/payments/stripe/refresh")
    public StripeConnectDtos.SellerStripeRefreshResponse refreshSellerStripe() {
        return StripeConnectDtos.refresh("seller-code-vault");
    }

    @PostMapping("/api/seller/payments/stripe/return")
    public StripeConnectDtos.SellerStripeRefreshResponse sellerStripeReturn(
            @RequestBody(required = false) StripeConnectDtos.SellerStripeReturnRequest request) {
        String sellerId = request == null || request.sellerId() == null ? "seller-code-vault" : request.sellerId();
        return StripeConnectDtos.refresh(sellerId);
    }

    @GetMapping("/api/seller/payouts/stripe/status")
    public StripeConnectDtos.SellerStripeAccountStatusResponse sellerPayoutStatus() {
        return StripeConnectDtos.sellerStatus("seller-code-vault");
    }

    @PostMapping("/api/payments/stripe/payment-intent")
    public StripeConnectDtos.StripePaymentIntentCreateResponse createPaymentIntent(
            @RequestBody(required = false) StripeConnectDtos.StripePaymentIntentCreateRequest request) {
        String checkoutId = request == null || request.checkoutId() == null ? "checkout-058" : request.checkoutId();
        return StripeConnectDtos.paymentIntent(checkoutId);
    }

    @PostMapping("/api/payments/stripe/authorize")
    public StripeConnectDtos.StripeAuthorizeResponse authorize(
            @RequestBody(required = false) StripeConnectDtos.StripeConfirmRequest request) {
        String paymentAuthorizationId = request == null || request.paymentAuthorizationId() == null
                ? "stripe-auth-093" : request.paymentAuthorizationId();
        return StripeConnectDtos.authorize(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/stripe/capture")
    public StripeConnectDtos.StripeActionResponse capture(
            @RequestBody(required = false) StripeConnectDtos.StripeCaptureRequest request) {
        return StripeConnectDtos.action("CAPTURE_REQUESTED", "/payments/stripe/status/stripe-auth-093");
    }

    @PostMapping("/api/payments/stripe/void")
    public StripeConnectDtos.StripeActionResponse voidAuthorization(
            @RequestBody(required = false) StripeConnectDtos.StripeVoidRequest request) {
        return StripeConnectDtos.action("AUTHORIZATION_VOID_REQUESTED", "/payments/stripe/status/stripe-auth-093");
    }

    @PostMapping("/api/payments/stripe/refund")
    public StripeConnectDtos.StripeActionResponse refund(
            @RequestBody(required = false) StripeConnectDtos.StripeRefundRequest request) {
        return StripeConnectDtos.action("REFUND_REQUESTED", "/payments/stripe/status/stripe-auth-093");
    }

    @GetMapping("/api/payments/stripe/status/{paymentAuthorizationId}")
    public StripeConnectDtos.StripePaymentStatusResponse status(@PathVariable String paymentAuthorizationId) {
        return StripeConnectDtos.status(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/stripe/retry")
    public StripeConnectDtos.StripePaymentIntentCreateResponse retry(
            @RequestBody(required = false) StripeConnectDtos.StripePaymentIntentCreateRequest request) {
        String checkoutId = request == null || request.checkoutId() == null ? "checkout-058" : request.checkoutId();
        return StripeConnectDtos.paymentIntent(checkoutId);
    }

    @PostMapping("/api/payments/stripe/return")
    public StripeConnectDtos.StripePaymentStatusResponse stripeReturn(
            @RequestBody(required = false) StripeConnectDtos.StripeConfirmRequest request) {
        String paymentAuthorizationId = request == null || request.paymentAuthorizationId() == null
                ? "stripe-auth-093" : request.paymentAuthorizationId();
        return StripeConnectDtos.status(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/stripe/cancel-return")
    public StripeConnectDtos.StripeActionResponse cancelReturn() {
        return StripeConnectDtos.action("STRIPE_PAYMENT_CANCELLED", "/checkout/checkout-058");
    }

    @PostMapping("/api/webhooks/stripe")
    public StripeConnectDtos.StripeActionResponse stripeWebhook(
            @RequestHeader(name = "Stripe-Signature", required = false) String signature,
            @RequestHeader(name = "X-Provider-Event-Id", required = false) String providerEventId,
            @RequestBody(required = false) String payload) {
        return StripeConnectDtos.action(signature == null ? "WEBHOOK_SIGNATURE_MISSING_PLACEHOLDER" : "WEBHOOK_VERIFIED_PLACEHOLDER",
                "/admin/payments/stripe/webhook-health");
    }

    @GetMapping("/api/admin/payments/stripe/config")
    public StripeConnectDtos.AdminStripeConfigResponse adminConfig() {
        return StripeConnectDtos.adminConfig();
    }

    @PutMapping("/api/admin/payments/stripe/config")
    public StripeConnectDtos.StripeActionResponse updateAdminConfig(@RequestBody(required = false) Object request) {
        return StripeConnectDtos.action("STRIPE_CONFIG_UPDATE_REQUIRES_APPROVAL", "/admin/payments/stripe/config");
    }

    @GetMapping("/api/admin/payments/stripe/sellers")
    public List<StripeConnectDtos.AdminStripeSellerAccountSummary> sellers() {
        return StripeConnectDtos.sellers();
    }

    @GetMapping("/api/admin/payments/stripe/sellers/{sellerId}")
    public StripeConnectDtos.AdminStripeSellerAccountSummary seller(@PathVariable String sellerId) {
        return StripeConnectDtos.sellers().stream()
                .filter(item -> item.sellerId().equals(sellerId))
                .findFirst()
                .orElse(StripeConnectDtos.sellers().get(0));
    }

    @GetMapping("/api/admin/payments/stripe/events")
    public List<StripeConnectDtos.AdminStripeEventSummary> events() {
        return StripeConnectDtos.events();
    }

    @GetMapping("/api/admin/payments/stripe/events/{eventId}")
    public StripeConnectDtos.AdminStripeEventSummary event(@PathVariable String eventId) {
        return StripeConnectDtos.events().stream()
                .filter(item -> item.eventId().equals(eventId))
                .findFirst()
                .orElse(StripeConnectDtos.events().get(0));
    }

    @GetMapping("/api/admin/payments/stripe/webhook-health")
    public StripeConnectDtos.AdminStripeWebhookHealth webhookHealth() {
        return StripeConnectDtos.webhookHealth();
    }

    @GetMapping("/api/admin/payments/stripe/disputes")
    public List<StripeConnectDtos.AdminStripeDisputeSummary> disputes() {
        return StripeConnectDtos.disputes();
    }

    @GetMapping("/api/admin/payments/stripe/payouts")
    public List<StripeConnectDtos.AdminStripePayoutSummary> payouts() {
        return StripeConnectDtos.payouts();
    }

    @PostMapping("/api/admin/payments/stripe/refresh-seller/{sellerId}")
    public StripeConnectDtos.SellerStripeRefreshResponse adminRefreshSeller(@PathVariable String sellerId) {
        return StripeConnectDtos.refresh(sellerId);
    }
}

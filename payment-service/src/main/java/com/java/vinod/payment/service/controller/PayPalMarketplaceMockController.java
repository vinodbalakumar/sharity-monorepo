package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.PayPalMarketplaceDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PayPalMarketplaceMockController {
    @GetMapping("/api/payments/providers/paypal/availability")
    public PayPalMarketplaceDtos.PayPalProviderAvailabilityResponse availability() {
        return PayPalMarketplaceDtos.availability();
    }

    @GetMapping("/api/payments/providers/paypal/config")
    public PayPalMarketplaceDtos.PayPalProviderConfigResponse config() {
        return PayPalMarketplaceDtos.config();
    }

    @GetMapping("/api/seller/payments/paypal/status")
    public PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse sellerStatus() {
        return PayPalMarketplaceDtos.sellerStatus("seller-code-vault");
    }

    @PostMapping("/api/seller/payments/paypal/onboarding-link")
    public PayPalMarketplaceDtos.SellerPayPalOnboardingLinkResponse onboardingLink() {
        return PayPalMarketplaceDtos.onboardingLink();
    }

    @PostMapping("/api/seller/payments/paypal/refresh")
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse refreshSellerPayPal() {
        return PayPalMarketplaceDtos.refresh("seller-code-vault");
    }

    @PostMapping("/api/seller/payments/paypal/return")
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse sellerPayPalReturn(
            @RequestBody(required = false) PayPalMarketplaceDtos.SellerPayPalReturnRequest request) {
        String sellerId = request == null || request.sellerId() == null ? "seller-code-vault" : request.sellerId();
        return PayPalMarketplaceDtos.refresh(sellerId);
    }

    @GetMapping("/api/seller/payouts/paypal/status")
    public PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse sellerPayoutStatus() {
        return PayPalMarketplaceDtos.sellerStatus("seller-code-vault");
    }

    @PostMapping("/api/payments/paypal/order")
    public PayPalMarketplaceDtos.PayPalOrderCreateResponse createOrder(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalOrderCreateRequest request) {
        String checkoutId = request == null || request.checkoutId() == null ? "checkout-058" : request.checkoutId();
        return PayPalMarketplaceDtos.order(checkoutId);
    }

    @PostMapping("/api/payments/paypal/authorize")
    public PayPalMarketplaceDtos.PayPalAuthorizeResponse authorize(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalAuthorizeRequest request) {
        String paymentAuthorizationId = request == null || request.paymentAuthorizationId() == null
                ? "paypal-auth-094" : request.paymentAuthorizationId();
        return PayPalMarketplaceDtos.authorize(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/paypal/capture")
    public PayPalMarketplaceDtos.PayPalActionResponse capture(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalCaptureRequest request) {
        return PayPalMarketplaceDtos.action("CAPTURE_REQUESTED", "/payments/paypal/status/paypal-auth-094");
    }

    @PostMapping("/api/payments/paypal/void")
    public PayPalMarketplaceDtos.PayPalActionResponse voidAuthorization(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalVoidRequest request) {
        return PayPalMarketplaceDtos.action("AUTHORIZATION_VOID_REQUESTED", "/payments/paypal/status/paypal-auth-094");
    }

    @PostMapping("/api/payments/paypal/refund")
    public PayPalMarketplaceDtos.PayPalActionResponse refund(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalRefundRequest request) {
        return PayPalMarketplaceDtos.action("REFUND_REQUESTED", "/payments/paypal/status/paypal-auth-094");
    }

    @GetMapping("/api/payments/paypal/status/{paymentAuthorizationId}")
    public PayPalMarketplaceDtos.PayPalPaymentStatusResponse status(@PathVariable String paymentAuthorizationId) {
        return PayPalMarketplaceDtos.status(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/paypal/retry")
    public PayPalMarketplaceDtos.PayPalOrderCreateResponse retry(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalOrderCreateRequest request) {
        String checkoutId = request == null || request.checkoutId() == null ? "checkout-058" : request.checkoutId();
        return PayPalMarketplaceDtos.order(checkoutId);
    }

    @PostMapping("/api/payments/paypal/return")
    public PayPalMarketplaceDtos.PayPalPaymentStatusResponse paypalReturn(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalAuthorizeRequest request) {
        String paymentAuthorizationId = request == null || request.paymentAuthorizationId() == null
                ? "paypal-auth-094" : request.paymentAuthorizationId();
        return PayPalMarketplaceDtos.status(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/paypal/cancel-return")
    public PayPalMarketplaceDtos.PayPalActionResponse cancelReturn() {
        return PayPalMarketplaceDtos.action("PAYPAL_PAYMENT_CANCELLED", "/checkout/checkout-058");
    }

    @PostMapping("/api/webhooks/paypal")
    public PayPalMarketplaceDtos.PayPalActionResponse paypalWebhook(
            @RequestHeader(name = "PAYPAL-TRANSMISSION-ID", required = false) String transmissionId,
            @RequestHeader(name = "PAYPAL-TRANSMISSION-SIG", required = false) String transmissionSignature,
            @RequestHeader(name = "X-Provider-Event-Id", required = false) String providerEventId,
            @RequestBody(required = false) String payload) {
        String status = transmissionId == null || transmissionSignature == null
                ? "WEBHOOK_SIGNATURE_MISSING_PLACEHOLDER"
                : "WEBHOOK_VERIFIED_PLACEHOLDER";
        return PayPalMarketplaceDtos.action(status, "/admin/payments/paypal/webhook-health");
    }

    @GetMapping("/api/admin/payments/paypal/config")
    public PayPalMarketplaceDtos.AdminPayPalConfigResponse adminConfig() {
        return PayPalMarketplaceDtos.adminConfig();
    }

    @PutMapping("/api/admin/payments/paypal/config")
    public PayPalMarketplaceDtos.PayPalActionResponse updateAdminConfig(@RequestBody(required = false) Object request) {
        return PayPalMarketplaceDtos.action("PAYPAL_CONFIG_UPDATE_REQUIRES_APPROVAL", "/admin/payments/paypal/config");
    }

    @GetMapping("/api/admin/payments/paypal/sellers")
    public List<PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary> sellers() {
        return PayPalMarketplaceDtos.sellers();
    }

    @GetMapping("/api/admin/payments/paypal/sellers/{sellerId}")
    public PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary seller(@PathVariable String sellerId) {
        return PayPalMarketplaceDtos.sellers().stream()
                .filter(item -> item.sellerId().equals(sellerId))
                .findFirst()
                .orElse(PayPalMarketplaceDtos.sellers().get(0));
    }

    @GetMapping("/api/admin/payments/paypal/events")
    public List<PayPalMarketplaceDtos.AdminPayPalEventSummary> events() {
        return PayPalMarketplaceDtos.events();
    }

    @GetMapping("/api/admin/payments/paypal/events/{eventId}")
    public PayPalMarketplaceDtos.AdminPayPalEventSummary event(@PathVariable String eventId) {
        return PayPalMarketplaceDtos.events().stream()
                .filter(item -> item.eventId().equals(eventId))
                .findFirst()
                .orElse(PayPalMarketplaceDtos.events().get(0));
    }

    @GetMapping("/api/admin/payments/paypal/webhook-health")
    public PayPalMarketplaceDtos.AdminPayPalWebhookHealth webhookHealth() {
        return PayPalMarketplaceDtos.webhookHealth();
    }

    @GetMapping("/api/admin/payments/paypal/disputes")
    public List<PayPalMarketplaceDtos.AdminPayPalDisputeSummary> disputes() {
        return PayPalMarketplaceDtos.disputes();
    }

    @GetMapping("/api/admin/payments/paypal/settlements")
    public List<PayPalMarketplaceDtos.AdminPayPalSettlementSummary> settlements() {
        return PayPalMarketplaceDtos.settlements();
    }

    @PostMapping("/api/admin/payments/paypal/refresh-seller/{sellerId}")
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse adminRefreshSeller(@PathVariable String sellerId) {
        return PayPalMarketplaceDtos.refresh(sellerId);
    }
}

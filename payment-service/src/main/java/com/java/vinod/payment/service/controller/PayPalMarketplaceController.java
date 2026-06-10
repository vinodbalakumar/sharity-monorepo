package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.PayPalMarketplaceDtos;
import com.java.vinod.payment.service.service.PayPalMarketplaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PayPalMarketplaceController {
    private final PayPalMarketplaceService payPalMarketplaceService;

    @GetMapping("/api/payments/providers/paypal/availability")
    public PayPalMarketplaceDtos.PayPalProviderAvailabilityResponse availability() {
        return payPalMarketplaceService.availability();
    }

    @GetMapping("/api/payments/providers/paypal/config")
    public PayPalMarketplaceDtos.PayPalProviderConfigResponse config() {
        return payPalMarketplaceService.config();
    }

    @GetMapping("/api/seller/payments/paypal/status")
    public PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse sellerStatus(@AuthenticationPrincipal Jwt jwt) {
        return payPalMarketplaceService.sellerStatus(jwt);
    }

    @PostMapping("/api/seller/payments/paypal/onboarding-link")
    public PayPalMarketplaceDtos.SellerPayPalOnboardingLinkResponse onboardingLink(@AuthenticationPrincipal Jwt jwt) {
        return payPalMarketplaceService.onboardingLink(jwt);
    }

    @PostMapping("/api/seller/payments/paypal/refresh")
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse refreshSellerPayPal(@AuthenticationPrincipal Jwt jwt) {
        return payPalMarketplaceService.refreshSeller(jwt);
    }

    @PostMapping("/api/seller/payments/paypal/return")
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse sellerPayPalReturn(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody(required = false) PayPalMarketplaceDtos.SellerPayPalReturnRequest request) {
        return payPalMarketplaceService.sellerReturn(jwt, request);
    }

    @GetMapping("/api/seller/payouts/paypal/status")
    public PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse sellerPayoutStatus(@AuthenticationPrincipal Jwt jwt) {
        return payPalMarketplaceService.sellerPayoutStatus(jwt);
    }

    @PostMapping("/api/payments/paypal/order")
    public PayPalMarketplaceDtos.PayPalOrderCreateResponse createOrder(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalOrderCreateRequest request) {
        return payPalMarketplaceService.createOrder(request);
    }

    @PostMapping("/api/payments/paypal/authorize")
    public PayPalMarketplaceDtos.PayPalAuthorizeResponse authorize(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalAuthorizeRequest request) {
        return payPalMarketplaceService.authorize(request);
    }

    @PostMapping("/api/payments/paypal/capture")
    public PayPalMarketplaceDtos.PayPalActionResponse capture(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalCaptureRequest request) {
        return payPalMarketplaceService.capture(request);
    }

    @PostMapping("/api/payments/paypal/void")
    public PayPalMarketplaceDtos.PayPalActionResponse voidAuthorization(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalVoidRequest request) {
        return payPalMarketplaceService.voidAuthorization(request);
    }

    @PostMapping("/api/payments/paypal/refund")
    public PayPalMarketplaceDtos.PayPalActionResponse refund(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalRefundRequest request) {
        return payPalMarketplaceService.refund(request);
    }

    @GetMapping("/api/payments/paypal/status/{paymentAuthorizationId}")
    public PayPalMarketplaceDtos.PayPalPaymentStatusResponse status(@PathVariable String paymentAuthorizationId) {
        return payPalMarketplaceService.status(paymentAuthorizationId);
    }

    @PostMapping("/api/payments/paypal/retry")
    public PayPalMarketplaceDtos.PayPalOrderCreateResponse retry(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalOrderCreateRequest request) {
        return payPalMarketplaceService.retry(request);
    }

    @PostMapping("/api/payments/paypal/return")
    public PayPalMarketplaceDtos.PayPalPaymentStatusResponse paypalReturn(
            @RequestBody(required = false) PayPalMarketplaceDtos.PayPalAuthorizeRequest request) {
        return payPalMarketplaceService.paypalReturn(request);
    }

    @PostMapping("/api/payments/paypal/cancel-return")
    public PayPalMarketplaceDtos.PayPalActionResponse cancelReturn() {
        return payPalMarketplaceService.cancelReturn();
    }

    @PostMapping("/api/webhooks/paypal")
    public PayPalMarketplaceDtos.PayPalActionResponse paypalWebhook(
            @RequestHeader(name = "PAYPAL-TRANSMISSION-ID", required = false) String transmissionId,
            @RequestHeader(name = "PAYPAL-TRANSMISSION-TIME", required = false) String transmissionTime,
            @RequestHeader(name = "PAYPAL-CERT-URL", required = false) String certUrl,
            @RequestHeader(name = "PAYPAL-AUTH-ALGO", required = false) String authAlgo,
            @RequestHeader(name = "PAYPAL-TRANSMISSION-SIG", required = false) String transmissionSignature,
            @RequestHeader(name = "X-Provider-Event-Id", required = false) String providerEventId,
            @RequestBody(required = false) String payload) {
        return payPalMarketplaceService.paypalWebhook(
                transmissionId,
                transmissionTime,
                certUrl,
                authAlgo,
                transmissionSignature,
                providerEventId,
                payload);
    }

    @GetMapping("/api/admin/payments/paypal/config")
    public PayPalMarketplaceDtos.AdminPayPalConfigResponse adminConfig() {
        return payPalMarketplaceService.adminConfig();
    }

    @PutMapping("/api/admin/payments/paypal/config")
    public PayPalMarketplaceDtos.PayPalActionResponse updateAdminConfig(@RequestBody(required = false) Object request) {
        return payPalMarketplaceService.updateAdminConfig();
    }

    @GetMapping("/api/admin/payments/paypal/sellers")
    public List<PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary> sellers() {
        return payPalMarketplaceService.sellers();
    }

    @GetMapping("/api/admin/payments/paypal/sellers/{sellerId}")
    public PayPalMarketplaceDtos.AdminPayPalSellerAccountSummary seller(@PathVariable String sellerId) {
        return payPalMarketplaceService.seller(sellerId);
    }

    @GetMapping("/api/admin/payments/paypal/events")
    public List<PayPalMarketplaceDtos.AdminPayPalEventSummary> events() {
        return payPalMarketplaceService.events();
    }

    @GetMapping("/api/admin/payments/paypal/events/{eventId}")
    public PayPalMarketplaceDtos.AdminPayPalEventSummary event(@PathVariable String eventId) {
        return payPalMarketplaceService.event(eventId);
    }

    @GetMapping("/api/admin/payments/paypal/webhook-health")
    public PayPalMarketplaceDtos.AdminPayPalWebhookHealth webhookHealth() {
        return payPalMarketplaceService.webhookHealth();
    }

    @GetMapping("/api/admin/payments/paypal/disputes")
    public List<PayPalMarketplaceDtos.AdminPayPalDisputeSummary> disputes() {
        return payPalMarketplaceService.disputes();
    }

    @GetMapping("/api/admin/payments/paypal/settlements")
    public List<PayPalMarketplaceDtos.AdminPayPalSettlementSummary> settlements() {
        return payPalMarketplaceService.settlements();
    }

    @PostMapping("/api/admin/payments/paypal/refresh-seller/{sellerId}")
    public PayPalMarketplaceDtos.SellerPayPalRefreshResponse adminRefreshSeller(@PathVariable String sellerId) {
        return payPalMarketplaceService.adminRefreshSeller(sellerId);
    }
}

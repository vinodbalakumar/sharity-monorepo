package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes payment, payout, refund, webhook, and internal orchestration APIs.
 */
@RestController
public class PaymentController {
    private final PaymentService paymentService;

    /**
     * Creates the controller with the payment workflow service.
     */
    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Creates or returns a persisted mock payment order for customer checkout.
     */
    @PostMapping("/api/v1/payments/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentDtos.PaymentOrderResponse checkout(@Valid @RequestBody PaymentDtos.CheckoutRequest request,
                                                    @AuthenticationPrincipal Jwt jwt) {
        return paymentService.checkout(request, jwt);
    }

    /**
     * Returns payment transactions for the authenticated customer.
     */
    @GetMapping("/api/v1/payments/my-transactions")
    public List<PaymentDtos.PaymentOrderResponse> myTransactions(@AuthenticationPrincipal Jwt jwt) {
        return paymentService.myTransactions(jwt);
    }

    /**
     * Returns payout records for a provider account.
     */
    @GetMapping("/api/v1/payments/provider/payouts")
    public List<PaymentDtos.PayoutResponse> providerPayouts(@RequestParam String providerPublicId) {
        return paymentService.providerPayouts(providerPublicId);
    }

    /**
     * Returns one payout by public id.
     */
    @GetMapping("/api/v1/payments/provider/payouts/{payoutPublicId}")
    public PaymentDtos.PayoutResponse payout(@PathVariable String payoutPublicId) {
        return paymentService.payout(payoutPublicId);
    }

    /**
     * Records a Stripe webhook event idempotently for test-mode integration.
     */
    @PostMapping("/api/v1/payments/webhooks/stripe")
    public PaymentDtos.MessageResponse stripeWebhook(@RequestHeader(name = "Stripe-Signature", required = false) String signature,
                                                     @RequestHeader(name = "X-Provider-Event-Id", required = false) String providerEventId,
                                                     @RequestHeader(name = "X-Provider-Event-Type", required = false) String eventType,
                                                     @RequestBody String payload) {
        return paymentService.stripeWebhook(signature,
                providerEventId == null ? String.valueOf(payload.hashCode()) : providerEventId,
                eventType,
                payload);
    }

    /**
     * Internal endpoint used by marketplace-service to create a payment order.
     */
    @PostMapping("/internal/api/v1/payments/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentDtos.PaymentOrderResponse createInternalOrder(@Valid @RequestBody PaymentDtos.CheckoutRequest request) {
        return paymentService.createPaymentOrder(request, request.customerUserPublicId());
    }

    /**
     * Internal endpoint for retrieving payment state by marketplace order id.
     */
    @GetMapping("/internal/api/v1/payments/orders/{marketplaceOrderPublicId}")
    public PaymentDtos.PaymentOrderResponse internalOrder(@PathVariable String marketplaceOrderPublicId) {
        return paymentService.order(marketplaceOrderPublicId);
    }

    /**
     * Internal endpoint used after customer acceptance to mark payout eligible.
     */
    @PostMapping("/internal/api/v1/payments/orders/{marketplaceOrderPublicId}/mark-payout-eligible")
    public PaymentDtos.MessageResponse markPayoutEligible(@PathVariable String marketplaceOrderPublicId) {
        return paymentService.markPayoutEligible(marketplaceOrderPublicId);
    }

    /**
     * Marks a marketplace order as cancelled in the payment lifecycle and reverses captured funds.
     */
    @PostMapping("/internal/api/v1/payments/orders/{marketplaceOrderPublicId}/cancel-request")
    public PaymentDtos.MessageResponse cancel(@PathVariable String marketplaceOrderPublicId,
                                              @RequestBody(required = false) PaymentDtos.LifecycleRequest request) {
        return paymentService.cancel(marketplaceOrderPublicId, request, null);
    }

    /**
     * Marks a marketplace order as disputed so payout eligibility stays blocked while the case is reviewed.
     */
    @PostMapping("/internal/api/v1/payments/orders/{marketplaceOrderPublicId}/dispute-request")
    public PaymentDtos.MessageResponse dispute(@PathVariable String marketplaceOrderPublicId,
                                               @RequestBody(required = false) PaymentDtos.LifecycleRequest request) {
        return paymentService.dispute(marketplaceOrderPublicId, request, null);
    }

    /**
     * Internal endpoint for requesting a refund against a marketplace order.
     */
    @PostMapping("/internal/api/v1/payments/orders/{marketplaceOrderPublicId}/refund-request")
    public PaymentDtos.MessageResponse refund(@PathVariable String marketplaceOrderPublicId,
                                             @RequestBody(required = false) PaymentDtos.RefundRequest request) {
        return paymentService.refund(marketplaceOrderPublicId, request, null);
    }

    /**
     * Returns the current payment, payout, and refund lifecycle state for a marketplace order.
     */
    @GetMapping("/internal/api/v1/payments/orders/{marketplaceOrderPublicId}/lifecycle")
    public PaymentDtos.PaymentLifecycleResponse lifecycle(@PathVariable String marketplaceOrderPublicId) {
        return paymentService.lifecycle(marketplaceOrderPublicId);
    }

    /**
     * Returns payment orders for admin transaction visibility.
     */
    @GetMapping("/api/v1/payments/admin/transactions")
    public List<PaymentDtos.PaymentOrderResponse> adminTransactions() {
        return paymentService.adminTransactions();
    }

    /**
     * Returns all provider payouts for admin visibility.
     */
    @GetMapping("/api/v1/payments/admin/payouts")
    public List<PaymentDtos.PayoutResponse> adminPayouts() {
        return paymentService.adminPayouts();
    }

    /**
     * Returns blocked payout records for finance/admin review.
     */
    @GetMapping("/api/v1/payments/admin/payouts/blocked")
    public List<PaymentDtos.PayoutResponse> blockedPayouts() {
        return paymentService.blockedPayouts();
    }

    /**
     * Returns refund public ids for admin visibility.
     */
    @GetMapping("/api/v1/payments/admin/refunds")
    public List<String> adminRefunds() {
        return paymentService.adminRefunds();
    }
}

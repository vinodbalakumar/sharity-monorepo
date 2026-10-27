package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.PaymentAuthorizationDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
public class PaymentAuthorizationController {
    @GetMapping("/api/checkout/sessions/{checkoutSessionId}/payment-authorization")
    public PaymentAuthorizationDtos.PaymentAuthorizationScreenResponse screen(@PathVariable String checkoutSessionId) {
        return PaymentAuthorizationDtos.mock(checkoutSessionId);
    }

    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/paypal/authorize")
    public PaymentAuthorizationDtos.StartPayPalAuthorizationResponse paypal(@PathVariable String checkoutSessionId) {
        return new PaymentAuthorizationDtos.StartPayPalAuthorizationResponse(checkoutSessionId, "PAYPAL",
                "/paypal/mock-authorize", "REDIRECTING", "Redirecting to PayPal...");
    }

    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/paypal/confirm")
    public PaymentAuthorizationDtos.ConfirmPayPalAuthorizationResponse confirm(@PathVariable String checkoutSessionId,
                                                                               @RequestBody(required = false) PaymentAuthorizationDtos.ConfirmPayPalAuthorizationRequest request) {
        return new PaymentAuthorizationDtos.ConfirmPayPalAuthorizationResponse(checkoutSessionId, "AUTHORIZED",
                "parent-order-1000", "SH-1000", PaymentAuthorizationDtos.mock(checkoutSessionId).sellerOrderAuthorizationStatuses(),
                "/orders/parent-order-1000/authorization-status", "PayPal authorization confirmed.");
    }

    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/stripe/authorize")
    public PaymentAuthorizationDtos.StartPayPalAuthorizationResponse stripe(@PathVariable String checkoutSessionId) {
        return new PaymentAuthorizationDtos.StartPayPalAuthorizationResponse(checkoutSessionId, "STRIPE",
                null, "STRIPE_AUTHORIZATION_NOT_ENABLED", "Stripe authorization is coming later.");
    }

    @GetMapping("/api/checkout/sessions/{checkoutSessionId}/authorization-status")
    public PaymentAuthorizationDtos.PaymentAuthorizationScreenResponse status(@PathVariable String checkoutSessionId) {
        return PaymentAuthorizationDtos.mock(checkoutSessionId);
    }

    @GetMapping("/api/checkout/sessions/{checkoutSessionId}/timeline")
    public java.util.List<PaymentAuthorizationDtos.PaymentTimelineEvent> timeline(@PathVariable String checkoutSessionId) {
        return PaymentAuthorizationDtos.mock(checkoutSessionId).paymentTimeline();
    }

    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/authorization/retry")
    public PaymentAuthorizationDtos.StartPayPalAuthorizationResponse retry(@PathVariable String checkoutSessionId) {
        return new PaymentAuthorizationDtos.StartPayPalAuthorizationResponse(checkoutSessionId, "PAYPAL",
                "/paypal/mock-authorize", "AUTHORIZED", "Retry authorization succeeded.");
    }

    @PostMapping("/api/checkout/sessions/{checkoutSessionId}/authorization/cancel")
    public PaymentAuthorizationDtos.StartPayPalAuthorizationResponse cancel(@PathVariable String checkoutSessionId) {
        return new PaymentAuthorizationDtos.StartPayPalAuthorizationResponse(checkoutSessionId, "PAYPAL",
                null, "CANCELLED", "Checkout authorization cancelled.");
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/accept")
    public PaymentAuthorizationDtos.SellerOrderAcceptanceResponse accept(@PathVariable String sellerOrderId) {
        return new PaymentAuthorizationDtos.SellerOrderAcceptanceResponse(sellerOrderId, "ACCEPTED",
                "CAPTURED", "NONE", "Seller order accepted.", LocalDateTime.now());
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/reject")
    public PaymentAuthorizationDtos.SellerOrderAcceptanceResponse reject(@PathVariable String sellerOrderId) {
        return new PaymentAuthorizationDtos.SellerOrderAcceptanceResponse(sellerOrderId, "REJECTED",
                "NONE", "RELEASED", "Seller order rejected; authorization released.", LocalDateTime.now());
    }

    @PostMapping("/api/seller/orders/{sellerOrderId}/request-more-time")
    public PaymentAuthorizationDtos.SellerOrderAcceptanceResponse moreTime(@PathVariable String sellerOrderId) {
        return new PaymentAuthorizationDtos.SellerOrderAcceptanceResponse(sellerOrderId, "MORE_TIME_REQUESTED",
                "PENDING", "NONE", "More time requested.", LocalDateTime.now());
    }

    @GetMapping("/api/seller/orders/{sellerOrderId}/authorization-status")
    public PaymentAuthorizationDtos.SellerOrderAuthorizationStatus sellerStatus(@PathVariable String sellerOrderId) {
        return PaymentAuthorizationDtos.mock("checkout-session-1000").sellerOrderAuthorizationStatuses().get(0);
    }
}

package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.CartCheckoutDtos;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Stateless mocked multi-seller Cart & Checkout API for STORY-035.
 */
@RestController
public class CartCheckoutMockController {
    @GetMapping("/api/cart")
    public CartCheckoutDtos.CartResponse cart(@RequestParam(defaultValue = "false") boolean termsAccepted) {
        return CartCheckoutDtos.mockCart(termsAccepted);
    }

    @PostMapping("/api/cart/items")
    public CartCheckoutDtos.CartResponse addItem(@RequestBody(required = false) Object request) {
        return CartCheckoutDtos.mockCart(false);
    }

    @PatchMapping("/api/cart/items/{cartItemId}")
    public CartCheckoutDtos.CartResponse updateItem(@PathVariable String cartItemId,
                                                    @RequestBody(required = false) Object request) {
        return CartCheckoutDtos.mockCart(false);
    }

    @DeleteMapping("/api/cart/items/{cartItemId}")
    public CartCheckoutDtos.CartResponse removeItem(@PathVariable String cartItemId) {
        return CartCheckoutDtos.mockCart(false);
    }

    @PostMapping("/api/cart/items/{cartItemId}/save-for-later")
    public CartCheckoutDtos.CartResponse saveForLater(@PathVariable String cartItemId) {
        return CartCheckoutDtos.mockCart(false);
    }

    @PostMapping("/api/cart/items/{cartItemId}/move-to-cart")
    public CartCheckoutDtos.CartResponse moveToCart(@PathVariable String cartItemId) {
        return CartCheckoutDtos.mockCart(false);
    }

    @PostMapping("/api/cart/coupons/apply")
    public CartCheckoutDtos.CartCoupon applyCoupon(@RequestBody(required = false) Object request) {
        return new CartCheckoutDtos.CartCoupon("SHARITY10", "PLATFORM", true,
                new java.math.BigDecimal("10.00"), "CART", null, true, "Coupon applied.");
    }

    @PostMapping("/api/cart/coupons/remove")
    public CartCheckoutDtos.CartCoupon removeCoupon(@RequestBody(required = false) Object request) {
        return new CartCheckoutDtos.CartCoupon("SHARITY10", "PLATFORM", false,
                java.math.BigDecimal.ZERO, "CART", null, true, "Coupon removed.");
    }

    @PostMapping("/api/cart/validate")
    public CartCheckoutDtos.CartValidationSummary validateCart() {
        return CartCheckoutDtos.mockCart(false).validationSummary();
    }

    @PostMapping("/api/cart/pricing/refresh")
    public CartCheckoutDtos.CartPricingSummary refreshPricing() {
        return CartCheckoutDtos.mockCart(false).pricingSummary();
    }

    @PostMapping("/api/cart/digital-terms/accept")
    public CartCheckoutDtos.CartDigitalTerms acceptDigitalTerms() {
        return CartCheckoutDtos.mockCart(true).digitalTerms();
    }

    @GetMapping("/api/checkout/preview")
    public CartCheckoutDtos.CheckoutPreviewResponse checkoutPreview(
            @RequestParam(defaultValue = "false") boolean termsAccepted) {
        return CartCheckoutDtos.mockPreview(termsAccepted);
    }

    @PostMapping("/api/checkout/session")
    public CartCheckoutDtos.CreateCheckoutSessionResponse createCheckoutSession(
            @RequestBody CartCheckoutDtos.CreateCheckoutSessionRequest request) {
        return new CartCheckoutDtos.CreateCheckoutSessionResponse("checkout-session-1000",
                request.acceptedDigitalTerms(), request.acceptedDigitalTerms(),
                "PROVIDER_DECIDED_GROUPED_MARKETPLACE_AUTHORIZATION", new java.math.BigDecimal("282.48"),
                "USD", "/checkout/payment-authorization/start",
                request.acceptedDigitalTerms() ? "Checkout session created." : "Digital terms required.");
    }

    @PostMapping("/api/checkout/payment-authorization/start")
    public CartCheckoutDtos.CreateCheckoutSessionResponse startPaymentAuthorization(
            @RequestBody(required = false) Object request) {
        return new CartCheckoutDtos.CreateCheckoutSessionResponse("checkout-session-1000",
                true, true, "PROVIDER_DECIDED_GROUPED_MARKETPLACE_AUTHORIZATION",
                new java.math.BigDecimal("282.48"), "USD", "/payments/authorize",
                "Payment authorization ready.");
    }
}

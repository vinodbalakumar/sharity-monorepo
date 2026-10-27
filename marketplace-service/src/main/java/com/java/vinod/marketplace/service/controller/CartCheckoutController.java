package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.CartCheckoutDtos;
import com.java.vinod.marketplace.service.dto.BuyerCommerceFlowDtos;
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
public class CartCheckoutController {
    @GetMapping("/api/cart")
    public BuyerCommerceFlowDtos.CartResponse cart(@RequestParam(defaultValue = "false") boolean termsAccepted) {
        return BuyerCommerceFlowDtos.mockCart();
    }

    @PostMapping("/api/cart/items")
    public BuyerCommerceFlowDtos.CartActionResponse addItem(@RequestBody(required = false) Object request) {
        return BuyerCommerceFlowDtos.cartAction("CART_ITEM_ADDED", "Item added to cart.");
    }

    @PatchMapping("/api/cart/items/{cartItemId}")
    public BuyerCommerceFlowDtos.CartActionResponse updateItem(@PathVariable String cartItemId,
                                                               @RequestBody(required = false) Object request) {
        return BuyerCommerceFlowDtos.cartAction("CART_ITEM_UPDATED", "Cart item updated.");
    }

    @PatchMapping("/api/cart/items/{cartItemId}/quantity")
    public BuyerCommerceFlowDtos.CartActionResponse updateQuantity(
            @PathVariable String cartItemId,
            @RequestBody(required = false) BuyerCommerceFlowDtos.UpdateCartQuantityRequest request) {
        return BuyerCommerceFlowDtos.cartAction("CART_QUANTITY_UPDATED", "Quantity updated and cart repriced.");
    }

    @DeleteMapping("/api/cart/items/{cartItemId}")
    public BuyerCommerceFlowDtos.CartActionResponse removeItem(@PathVariable String cartItemId) {
        return BuyerCommerceFlowDtos.cartAction("CART_ITEM_REMOVED", "Item removed from cart.");
    }

    @DeleteMapping("/api/cart")
    public BuyerCommerceFlowDtos.CartActionResponse clearCart() {
        return BuyerCommerceFlowDtos.cartAction("CART_CLEARED", "Cart cleared.");
    }

    @PostMapping("/api/cart/items/{cartItemId}/save-for-later")
    public BuyerCommerceFlowDtos.CartActionResponse saveForLater(@PathVariable String cartItemId) {
        return BuyerCommerceFlowDtos.cartAction("CART_ITEM_MOVED_TO_SAVED", "Item moved to Saved & Followed.");
    }

    @PostMapping("/api/cart/items/{cartItemId}/move-to-saved")
    public BuyerCommerceFlowDtos.CartActionResponse moveToSaved(@PathVariable String cartItemId) {
        return BuyerCommerceFlowDtos.cartAction("CART_ITEM_MOVED_TO_SAVED", "Item moved to Saved & Followed.");
    }

    @PostMapping("/api/cart/items/{cartItemId}/move-to-cart")
    public BuyerCommerceFlowDtos.CartActionResponse moveToCart(@PathVariable String cartItemId) {
        return BuyerCommerceFlowDtos.cartAction("CART_ITEM_MOVED_TO_CART", "Item moved back to cart.");
    }

    @GetMapping("/api/cart/coupons")
    public java.util.List<BuyerCommerceFlowDtos.CartCoupon> cartCoupons() {
        return BuyerCommerceFlowDtos.mockCart().availableCoupons();
    }

    @PostMapping("/api/cart/coupons/apply")
    public BuyerCommerceFlowDtos.CartActionResponse applyCoupon(
            @RequestBody(required = false) BuyerCommerceFlowDtos.ApplyCartCouponRequest request) {
        return BuyerCommerceFlowDtos.cartAction("CART_COUPON_APPLIED", "Coupon applied.");
    }

    @PostMapping("/api/cart/coupons/remove")
    public BuyerCommerceFlowDtos.CartActionResponse removeCoupon(
            @RequestBody(required = false) BuyerCommerceFlowDtos.RemoveCartCouponRequest request) {
        return BuyerCommerceFlowDtos.cartAction("CART_COUPON_REMOVED", "Coupon removed.");
    }

    @PostMapping("/api/cart/coupons/{couponId}/save")
    public BuyerCommerceFlowDtos.CartActionResponse saveCoupon(@PathVariable String couponId) {
        return BuyerCommerceFlowDtos.cartAction("CART_COUPON_SAVED", "Coupon saved.");
    }

    @PostMapping("/api/cart/refresh")
    public BuyerCommerceFlowDtos.CartActionResponse refreshCart() {
        return BuyerCommerceFlowDtos.cartAction("CART_REFRESHED", "Cart repriced and eligibility refreshed.");
    }

    @GetMapping("/api/cart/fee-preview")
    public BuyerCommerceFlowDtos.CartFeePreview feePreview() {
        return BuyerCommerceFlowDtos.mockCart().feePreview();
    }

    @GetMapping("/api/cart/checkout-eligibility")
    public BuyerCommerceFlowDtos.CartCheckoutEligibility checkoutEligibility() {
        return BuyerCommerceFlowDtos.mockCart().checkoutEligibility();
    }

    @PostMapping("/api/cart/checkout")
    public BuyerCommerceFlowDtos.StartCheckoutResponse checkoutAllEligible() {
        return new BuyerCommerceFlowDtos.StartCheckoutResponse(true, "checkout-058",
                "/checkout/review", java.util.List.of("cart-item-057-a", "cart-item-057-b"),
                java.util.List.of("store-digital-hub", "store-tech-deals"),
                "Checkout started for eligible cart items.");
    }

    @PostMapping("/api/cart/seller-groups/{sellerStoreId}/checkout")
    public BuyerCommerceFlowDtos.StartCheckoutResponse checkoutSellerGroup(@PathVariable String sellerStoreId) {
        return new BuyerCommerceFlowDtos.StartCheckoutResponse(true, "checkout-058-" + sellerStoreId,
                "/checkout/review", java.util.List.of("cart-item-057-a"), java.util.List.of(sellerStoreId),
                "Checkout started for seller group.");
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

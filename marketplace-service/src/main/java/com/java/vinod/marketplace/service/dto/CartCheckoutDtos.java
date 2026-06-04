package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock multi-seller cart and checkout contracts for STORY-035.
 */
public final class CartCheckoutDtos {
    private CartCheckoutDtos() {
    }

    public record CartResponse(String cartId, String buyerId, String currency,
                               List<CartSellerGroup> sellerGroups, List<CartItem> savedForLaterItems,
                               CartPricingSummary pricingSummary, CartValidationSummary validationSummary,
                               CartDigitalTerms digitalTerms, List<String> availableActions) {
    }

    public record CartSellerGroup(String sellerId, String sellerAlias, String storeName, String storeLogoUrl,
                                  String sellerVerificationBadge, String marketplaceCode, List<CartItem> items,
                                  BigDecimal groupSubtotal, BigDecimal sellerCouponDiscount,
                                  BigDecimal platformCouponAllocation, String refundRuleSummary,
                                  boolean sellerAcceptanceRequired, String digitalInventoryStatus,
                                  String validationStatus, List<String> availableActions) {
    }

    public record CartItem(String cartItemId, String listingId, String productId, String sellerId,
                           String productImageUrl, String productTitle, String productType,
                           String marketplaceCode, String deliveryType, BigDecimal price,
                           BigDecimal originalPrice, BigDecimal discountAmount, int quantity,
                           String currency, String digitalDeliveryNote, String regionRestriction,
                           String refundRuleSummary, String validationStatus, List<String> availableActions) {
    }

    public record CartPricingSummary(BigDecimal itemsTotal, BigDecimal sellerCouponDiscountTotal,
                                     BigDecimal platformCouponDiscountTotal, BigDecimal buyerServiceFee,
                                     BigDecimal taxAmount, BigDecimal shippingAmount,
                                     BigDecimal sharityCreditApplied, BigDecimal freePromotionApplied,
                                     BigDecimal totalAuthorizationAmount, BigDecimal totalDueNow,
                                     String currency) {
    }

    public record CartCoupon(String couponCode, String couponType, boolean applied, BigDecimal discountAmount,
                             String appliedScope, String sellerId, boolean platformFunded, String message) {
    }

    public record CartValidationSummary(boolean valid, boolean checkoutReady, List<CartValidationIssue> issues,
                                        List<CartValidationIssue> sellerGroupIssues,
                                        List<CartValidationIssue> itemIssues,
                                        boolean digitalTermsRequired, boolean pricingRefreshRequired) {
    }

    public record CartValidationIssue(String issueId, String severity, String issueCode, String message,
                                      String relatedEntityType, String relatedEntityId,
                                      String requiredAction, String route) {
    }

    public record CartDigitalTerms(boolean required, boolean accepted, String termsVersion, String summary,
                                   LocalDateTime acceptedAt, List<String> requiredForItemIds) {
    }

    public record CheckoutPreviewResponse(String checkoutSessionId, ParentOrderPreview parentOrderPreview,
                                          List<SellerOrderPreview> sellerOrderPreviews,
                                          CartPricingSummary pricingSummary,
                                          String paymentAuthorizationModel,
                                          String sellerAcceptanceSummary,
                                          CartDigitalTerms digitalTerms,
                                          List<String> availableActions) {
    }

    public record ParentOrderPreview(String parentOrderReferencePreview, int sellerOrderCount,
                                     String buyerId, BigDecimal totalAuthorizationAmount, String currency) {
    }

    public record SellerOrderPreview(String sellerOrderReferencePreview, String sellerId, String storeName,
                                     int itemCount, BigDecimal subtotal, BigDecimal sellerCouponDiscount,
                                     BigDecimal platformCouponAllocation, BigDecimal buyerServiceFeeAllocation,
                                     boolean sellerAcceptanceRequired, String fulfillmentType, String currency) {
    }

    public record CreateCheckoutSessionRequest(@NotBlank String cartId, boolean acceptedDigitalTerms,
                                               List<String> appliedCouponCodes,
                                               boolean buyerAcknowledgedAuthorizationNotice,
                                               boolean buyerAcknowledgedSellerAcceptanceNotice) {
    }

    public record CreateCheckoutSessionResponse(String checkoutSessionId, boolean checkoutReady,
                                                boolean paymentAuthorizationReady,
                                                String paymentAuthorizationModel,
                                                BigDecimal totalAuthorizationAmount, String currency,
                                                String nextRoute, String message) {
    }

    public static CartResponse mockCart(boolean termsAccepted) {
        CartSellerGroup digital = new CartSellerGroup("seller-gamecodehub", "GameCodeHub", "Game Code Hub",
                "marketplace/placeholders/gift_cards.png", "Verified Seller", "DIGITAL",
                List.of(item("cart-item-001", "Xbox Game Pass Digital Code", "GAMING_CODE", "INSTANT_CODE_REVEAL",
                                "14.99", "19.99", "seller-gamecodehub"),
                        item("cart-item-002", "Premium Downloadable Template Pack", "DOWNLOADABLE_FILE",
                                "SECURE_DOWNLOAD", "29.99", "39.99", "seller-gamecodehub")),
                money("44.98"), money("5.00"), money("3.00"),
                "Refund before reveal or download unless Sharity review approves.", false,
                "Available code inventory", "VALID", List.of("VIEW_SELLER"));
        CartSellerGroup electronics = new CartSellerGroup("seller-techdeals", "TechDealsPhoenix",
                "Tech Deals Phoenix", "marketplace/placeholders/electronics.png", "Verified Seller",
                "ELECTRONICS",
                List.of(item("cart-item-003", "Open Box Sony WH-1000XM5 Headphones", "ELECTRONICS",
                        "SHIPPING_REQUIRED", "249.00", "319.00", "seller-techdeals")),
                money("249.00"), money("0.00"), money("7.00"),
                "7-day return eligible after delivery.", true, "Physical item",
                "SELLER_ACCEPTANCE_REQUIRED", List.of("VIEW_SELLER"));
        CartPricingSummary pricing = new CartPricingSummary(money("293.98"), money("5.00"),
                money("10.00"), money("3.50"), money("0.00"), money("0.00"),
                money("0.00"), money("0.00"), money("282.48"), money("282.48"), "USD");
        CartValidationIssue issue = termsAccepted
                ? new CartValidationIssue("seller-acceptance", "INFO", "SELLER_ACCEPTANCE_REQUIRED",
                "One seller order may require seller acceptance before final capture.",
                "SELLER_GROUP", "seller-techdeals", "Review after authorization", "/orders")
                : new CartValidationIssue("digital-terms", "WARNING", "DIGITAL_TERMS_REQUIRED",
                "Digital terms must be accepted before payment authorization.",
                "CART", "cart-001", "Accept Digital Terms", "/cart");
        CartDigitalTerms terms = new CartDigitalTerms(true, termsAccepted, "DIGITAL_TERMS_2026_06",
                "Digital products may become non-refundable after reveal/download unless invalid or approved by Sharity review.",
                termsAccepted ? LocalDateTime.now() : null, List.of("cart-item-001", "cart-item-002"));
        return new CartResponse("cart-001", "buyer-1000", "USD", List.of(digital, electronics),
                List.of(item("saved-001", "Free Starter Icon Pack", "FREE_DIGITAL_DOWNLOAD",
                        "SECURE_DOWNLOAD", "0.00", "9.99", "seller-gamecodehub")),
                pricing, new CartValidationSummary(termsAccepted, termsAccepted, List.of(issue),
                List.of(), List.of(), !termsAccepted, false), terms,
                List.of("APPLY_COUPON", "ACCEPT_DIGITAL_TERMS", "START_AUTHORIZATION"));
    }

    public static CheckoutPreviewResponse mockPreview(boolean termsAccepted) {
        CartResponse cart = mockCart(termsAccepted);
        return new CheckoutPreviewResponse("checkout-session-1000",
                new ParentOrderPreview("SH-1000", 2, cart.buyerId(), cart.pricingSummary().totalAuthorizationAmount(), "USD"),
                List.of(
                        new SellerOrderPreview("SH-1000-A", "seller-gamecodehub", "Game Code Hub",
                                2, money("44.98"), money("5.00"), money("3.00"),
                                money("1.75"), false, "DIGITAL_ACCESS", "USD"),
                        new SellerOrderPreview("SH-1000-B", "seller-techdeals", "Tech Deals Phoenix",
                                1, money("249.00"), money("0.00"), money("7.00"),
                                money("1.75"), true, "SHIPPING", "USD")),
                cart.pricingSummary(), "PROVIDER_DECIDED_GROUPED_MARKETPLACE_AUTHORIZATION",
                "Some seller orders may require acceptance before final capture.", cart.digitalTerms(),
                List.of("CREATE_CHECKOUT_SESSION", "START_PAYMENT_AUTHORIZATION"));
    }

    private static CartItem item(String id, String title, String type, String delivery,
                                 String price, String original, String sellerId) {
        return new CartItem(id, id.replace("cart-item", "listing"), id.replace("cart-item", "product"),
                sellerId, "ELECTRONICS".equals(type) ? "marketplace/placeholders/electronics.png" : "marketplace/placeholders/gift_cards.png",
                title, type, "ELECTRONICS".equals(type) ? "ELECTRONICS" : "DIGITAL", delivery,
                money(price), money(original), money(new BigDecimal(original).subtract(new BigDecimal(price)).toPlainString()),
                1, "USD", "SHIPPING_REQUIRED".equals(delivery) ? "Shipping required after seller acceptance" : "Secure digital delivery after payment capture",
                "Works in USA", "SHIPPING_REQUIRED".equals(delivery) ? "Return eligible after delivery" : "Refund limited after reveal/download",
                "VALID", List.of("REMOVE_ITEM", "SAVE_FOR_LATER", "VIEW_SELLER"));
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value);
    }
}

package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Product & Listing Detail API contracts for STORY-056.
 */
public final class ProductListingDetailDtos {
    private ProductListingDetailDtos() {
    }

    public record ListingDetailResponse(String listingId, String productId, String listingSlug, String title,
                                        String description, String price, String currency,
                                        List<ListingMediaItem> media, ListingMarketplaceInfo marketplaceInfo,
                                        ListingAvailability availability,
                                        ListingSellerStoreSummary sellerStore,
                                        ListingCouponSummary couponSummary,
                                        ListingDigitalDeliverySummary digitalDeliverySummary,
                                        ListingPolicySummary policySummary,
                                        ListingPaymentAuthorizationSummary paymentAuthorizationSummary,
                                        ListingReviewsSummary reviewsSummary,
                                        List<ListingSimilarItem> similarItems,
                                        ListingSafeMessagingAvailability safeMessagingAvailability,
                                        ListingOwnerContext ownerContext,
                                        List<String> detailRows,
                                        List<String> availableActions) {
    }

    public record ListingMediaItem(String mediaId, String mediaType, String publicUrl, String thumbnailUrl,
                                   String altText, int displayOrder, String moderationStatus) {
    }

    public record ListingMarketplaceInfo(String marketplaceCode, String marketplaceName, String categoryCode,
                                         String categoryName, String subcategoryCode, String subcategoryName,
                                         String productType, String conditionCode, String breadcrumbRoute) {
    }

    public record ListingAvailability(String status, int availableQuantity, boolean checkoutAvailable,
                                      String userSafeReason, boolean countryRestricted,
                                      boolean marketplaceAvailable, boolean sellerAvailable) {
    }

    public record ListingSellerStoreSummary(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                            boolean sellerVerifiedBadgeVisible, boolean payoutVerifiedSellerSafeBadge,
                                            String memberSince, String approximateLocation, String route) {
    }

    public record ListingCouponSummary(boolean sellerCouponAvailable, boolean platformCouponAvailable,
                                       String eligibilityMessage, List<ListingCouponItem> coupons) {
    }

    public record ListingCouponItem(String couponId, String couponType, String title, String discountSummary,
                                    LocalDateTime expiryDate, String eligibilityStatus, String userSafeMessage,
                                    String route) {
    }

    public record ListingDigitalDeliverySummary(boolean digitalProduct, boolean secureDeliveryAvailable,
                                                boolean revealFlowEnabled, boolean chatCodeSharingBlocked,
                                                boolean refundRulesChangeAfterReveal,
                                                boolean digitalDeliveryIssuePathAvailable,
                                                String userSafeMessage) {
    }

    public record ListingPolicySummary(String refundReturnPolicySummary, String digitalRevealRefundSummary,
                                       String sellerPolicySummary, String marketplacePolicyRoute,
                                       String prohibitedOffPlatformWarning) {
    }

    public record ListingPaymentAuthorizationSummary(boolean sellerAcceptanceRequired,
                                                     boolean authorizeFirstPayment,
                                                     boolean captureAfterSellerAccepts,
                                                     String sellerAcceptanceDeadline,
                                                     String userSafeMessage) {
    }

    public record ListingReviewsSummary(boolean enabled, double averageRatingLater, int reviewCountLater,
                                        String userSafeMessage, String route) {
    }

    public record ListingSimilarItem(String listingId, String title, String imageUrl, String price,
                                     String currency, String marketplaceCode, String route) {
    }

    public record ListingSafeMessagingAvailability(boolean available, boolean prePurchaseEnabled,
                                                   String route, String disabledReason,
                                                   String userSafeMessage) {
    }

    public record ListingOwnerContext(boolean ownerViewing, String listingStatus, boolean canEdit,
                                      boolean canPause, boolean canMarkUnavailable, boolean analyticsPlaceholder,
                                      List<String> ownerActions) {
    }

    public record AddListingToCartResponse(boolean success, String cartId, String listingId, boolean added,
                                           boolean alreadyInCart, String currentPrice, boolean priceChanged,
                                           String userSafeMessage, String route) {
    }

    public record ListingShareLinkResponse(String shareUrl, String copyText, LocalDateTime expiresAt,
                                           boolean publicSafe, String message) {
    }

    public record ReportListingRequest(String reasonCode, String message, boolean userAcknowledgedReportRules) {
    }

    public record ListingActionResponse(boolean success, String status, String message, String route,
                                        LocalDateTime updatedAt) {
    }

    public record SellerListingAnalyticsPlaceholder(String listingId, boolean enabledLater,
                                                    String userSafeMessage, List<String> placeholderMetrics) {
    }

    public record AdminListingReportItem(String reportId, String listingId, String reasonCode, String status,
                                         String severity, LocalDateTime createdAt, boolean placeholder) {
    }

    public static ListingDetailResponse detail(String listingId, boolean owner) {
        String id = listingId == null ? "listing-1001" : listingId;
        return new ListingDetailResponse(id, "product-1001", "secure-digital-game-card",
                "Secure Digital Game Card",
                "A digital product listing delivered only through Sharity secure reveal.",
                "19.99", "USD", media(), marketplaceInfo(), availability(), sellerStore(),
                couponSummary(), digitalDelivery(), policy(), paymentAuthorization(), reviews(), similar(),
                safeMessaging(), ownerContext(owner),
                List.of("Product type: Digital", "Condition: New digital access", "Region compatibility: US account"),
                List.of("VIEW_LISTING", "BUY_NOW", "SAVE_LISTING", "SHARE_LISTING",
                        "VIEW_SELLER_STORE", "CONTACT_SELLER", "VIEW_COUPONS", "VIEW_REVIEWS",
                        "REPORT_LISTING", "SELLER_EDIT_LISTING", "SELLER_PAUSE_LISTING", "BACK"));
    }

    public static List<ListingCouponItem> coupons() {
        return couponSummary().coupons();
    }

    public static ListingDigitalDeliverySummary digitalDelivery() {
        return new ListingDigitalDeliverySummary(true, true, true, true, true, true,
                "Secure digital delivery is required. Codes are never shown on PDP or sent through chat.");
    }

    public static ListingPolicySummary policy() {
        return new ListingPolicySummary("Refund eligibility follows marketplace policy.",
                "Refund eligibility may change after reveal/access.",
                "Store-specific policy cannot override Sharity policy.",
                "/marketplace/DIGITAL/policy", "Keep all communication and payments inside Sharity.");
    }

    public static ListingReviewsSummary reviews() {
        return new ListingReviewsSummary(true, 4.8, 24, "Reviews summary is backend-calculated.",
                "/reviews/listing/listing-1001");
    }

    public static List<ListingSimilarItem> similar() {
        return List.of(new ListingSimilarItem("listing-1002", "Similar Digital Gift Card",
                "marketplace/placeholders/digital-card.png", "21.99", "USD", "DIGITAL", "/listing/listing-1002"));
    }

    public static ListingSafeMessagingAvailability safeMessaging() {
        return new ListingSafeMessagingAvailability(true, false, "/messages/listing/listing-1001",
                null, "Pre-purchase contact is feature-flagged and Safe Messaging only.");
    }

    public static AddListingToCartResponse addToCart(String listingId) {
        return new AddListingToCartResponse(false, null, listingId, false, false,
                null, false, "Digital products use direct buy only.", "/listing/" + listingId + "/buy");
    }

    public static ListingShareLinkResponse share(String listingId) {
        String url = "https://sharity.example/l/" + listingId;
        return new ListingShareLinkResponse(url, url, LocalDateTime.now().plusDays(7), true,
                "Public-safe listing share link generated.");
    }

    public static ListingActionResponse action(String message, String route) {
        return new ListingActionResponse(true, "OK", message, route, LocalDateTime.now());
    }

    public static SellerListingAnalyticsPlaceholder analytics(String listingId) {
        return new SellerListingAnalyticsPlaceholder(listingId, false,
                "Listing analytics are placeholder only for this story.",
                List.of("Views later", "Saves later", "Conversion later"));
    }

    public static List<AdminListingReportItem> reports() {
        return List.of(new AdminListingReportItem("listing-report-1", "listing-1001",
                "UNSAFE_LISTING", "PENDING", "MEDIUM", LocalDateTime.now().minusHours(4), true));
    }

    private static List<ListingMediaItem> media() {
        return List.of(new ListingMediaItem("media-1", "IMAGE",
                "marketplace/placeholders/digital-card.png", "marketplace/placeholders/digital-card-thumb.png",
                "Digital product card artwork", 1, "APPROVED"));
    }

    private static ListingMarketplaceInfo marketplaceInfo() {
        return new ListingMarketplaceInfo("DIGITAL", "Digital Marketplace", "GIFT_CARDS",
                "Gift cards", "GAME_CODES", "Game codes", "DIGITAL", "NEW",
                "/marketplace/DIGITAL/category/GIFT_CARDS");
    }

    private static ListingAvailability availability() {
        return new ListingAvailability("ACTIVE", 10, true, null, false, true, true);
    }

    private static ListingSellerStoreSummary sellerStore() {
        return new ListingSellerStoreSummary("store-1000", "Sharity Digital Deals",
                "marketplace/placeholders/store.png", true, true, "2025", "Phoenix, AZ", "/store/store-1000");
    }

    private static ListingCouponSummary couponSummary() {
        return new ListingCouponSummary(true, true, "Coupons can be saved here and applied in cart/checkout.",
                List.of(new ListingCouponItem("coupon-1001", "PLATFORM", "Digital welcome coupon",
                        "10% off eligible digital listings", LocalDateTime.now().plusDays(5),
                        "ELIGIBLE", "Final discount is calculated in checkout.", "/coupons/coupon-1001"),
                        new ListingCouponItem("coupon-1002", "SELLER", "Store launch coupon",
                                "5% seller coupon", LocalDateTime.now().plusDays(2), "ELIGIBLE",
                                "Seller coupon is checkout-controlled.", "/coupons/coupon-1002")));
    }

    private static ListingPaymentAuthorizationSummary paymentAuthorization() {
        return new ListingPaymentAuthorizationSummary(true, true, true, "24 hours",
                "Your payment may be authorized first and captured only after seller acceptance.");
    }

    private static ListingOwnerContext ownerContext(boolean owner) {
        return new ListingOwnerContext(owner, "ACTIVE", owner, owner, owner, true,
                owner ? List.of("PREVIEW_PUBLIC_LISTING", "EDIT_LISTING", "PAUSE_LISTING",
                        "MARK_SOLD_UNAVAILABLE", "VIEW_ORDERS", "MANAGE_COUPONS", "ARCHIVE_LISTING") : List.of());
    }
}

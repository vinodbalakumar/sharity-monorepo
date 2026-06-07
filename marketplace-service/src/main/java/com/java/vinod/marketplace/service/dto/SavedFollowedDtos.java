package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Saved & Followed API contracts for STORY-052.
 */
public final class SavedFollowedDtos {
    private SavedFollowedDtos() {
    }

    public record SavedDashboardResponse(String userId, SavedSummary savedSummary, List<SavedGroup> groups,
                                         List<SavedItem> recentSavedItems,
                                         List<SavedAvailabilityChange> availabilityChanges,
                                         int priceChangeCount, List<String> availableActions) {
    }

    public record SavedSummary(int totalSaved, int digitalProductCount, int physicalProductCountLater,
                               int storeCount, int couponPromotionCount, int savedSearchCount,
                               int unavailableExpiredCount, int priceChangeCount) {
    }

    public record SavedGroup(String groupCode, String label, int count, int unreadChangeCount, boolean active) {
    }

    public record SavedItem(String savedItemId, String savedType, SavedListingInfo listing,
                            SavedStoreInfo store, SavedCouponInfo coupon, SavedSearchInfo savedSearch,
                            String availabilityStatus, String availabilityReason, SavedPriceChange priceChange,
                            LocalDateTime savedAt, LocalDateTime lastUpdatedAt, List<String> availableActions) {
    }

    public record SavedListingInfo(String listingId, String productId, String title, String imageUrl,
                                   String marketplaceCode, String categoryCode, String productType,
                                   String currentPrice, String savedPrice, String currency,
                                   String availabilityStatus, SavedSellerStoreSummary sellerStore, String route) {
    }

    public record SavedStoreInfo(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                 boolean sellerVerifiedBadgeVisible, List<String> marketplaceBadges,
                                 String approximateLocation, String storeStatus, int activeListingCount,
                                 String route) {
    }

    public record SavedSellerStoreSummary(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                          boolean privacySafe, List<String> trustBadges) {
    }

    public record SavedCouponInfo(String couponId, String couponType, String title, String discountSummary,
                                  String marketplaceCode, String categoryCode, LocalDateTime expiryDate,
                                  String eligibilityStatus, boolean expired, String route) {
    }

    public record SavedSearchInfo(String savedSearchId, String name, String keywords, String marketplaceCode,
                                  String categoryCode, String priceFilter, String availabilityFilter,
                                  int resultCount, int newResultCountLater, LocalDateTime lastCheckedAt,
                                  String route) {
    }

    public record SavedAvailabilityChange(String savedItemId, String changeType, String title,
                                          String userSafeMessage, String oldValue, String newValue,
                                          LocalDateTime changedAt, String actionLabel, String route) {
    }

    public record SavedPriceChange(boolean changed, String direction, String savedPrice, String currentPrice,
                                   String currency, double percentageChange, String userSafeMessage) {
    }

    public record SaveSearchRequest(String name, String keywords, String marketplaceCode, String categoryCode,
                                    String minPrice, String maxPrice, String availability,
                                    String sellerStoreId, String productType) {
    }

    public record MoveSavedToCartResponse(boolean success, String cartId, String listingId, boolean added,
                                          boolean alreadyInCart, String currentPrice, boolean priceChanged,
                                          String userSafeMessage, String route) {
    }

    public record SavedActionResponse(boolean success, String status, String message, LocalDateTime updatedAt) {
    }

    public static SavedDashboardResponse dashboard() {
        return new SavedDashboardResponse("user-1000", summary(), groups(), items(), changes(), 2,
                List.of("SAVE_LISTING", "REMOVE_SAVED_LISTING", "SAVE_FOLLOW_STORE", "UNFOLLOW_STORE",
                        "MOVE_TO_CART", "VIEW_LISTING", "VIEW_STORE", "SAVE_SEARCH",
                        "MANAGE_SAVED_SEARCH", "FILTER_SAVED_ITEMS", "BACK"));
    }

    public static List<SavedItem> items() {
        LocalDateTime now = LocalDateTime.now();
        SavedSellerStoreSummary seller = new SavedSellerStoreSummary("store-1000", "Sharity Digital Deals",
                "marketplace/placeholders/store.png", true, List.of("Seller verified"));
        return List.of(
                new SavedItem("saved-1", "DIGITAL_PRODUCT",
                        new SavedListingInfo("listing-1001", "product-1001", "Secure Digital Game Card",
                                "marketplace/placeholders/digital-card.png", "DIGITAL", "GIFT_CARDS",
                                "DIGITAL", "19.99", "24.99", "USD", "ACTIVE", seller,
                                "/listings/listing-1001"), null, null, null, "ACTIVE", null,
                        new SavedPriceChange(true, "DROPPED", "24.99", "19.99", "USD", 20.0,
                                "The price dropped since you saved this item."),
                        now.minusDays(7), now.minusHours(2), List.of("MOVE_TO_CART", "VIEW_LISTING", "REMOVE")),
                new SavedItem("saved-2", "STORE", null,
                        new SavedStoreInfo("store-1000", "Sharity Digital Deals",
                                "marketplace/placeholders/store.png", true, List.of("DIGITAL"),
                                "Phoenix, AZ", "ACTIVE", 12, "/store/store-1000"),
                        null, null, "ACTIVE", null, new SavedPriceChange(false, null, null, null, null, 0, null),
                        now.minusDays(10), now.minusDays(1), List.of("VIEW_STORE", "REMOVE")),
                new SavedItem("saved-3", "COUPON", null, null,
                        new SavedCouponInfo("coupon-1001", "PLATFORM", "Digital welcome coupon",
                                "10% off eligible digital items", "DIGITAL", "ALL",
                                now.plusDays(5), "ELIGIBLE", false, "/coupons/coupon-1001"),
                        null, "ACTIVE", null, new SavedPriceChange(false, null, null, null, null, 0, null),
                        now.minusDays(2), now.minusHours(4), List.of("VIEW_COUPON", "REMOVE")),
                new SavedItem("saved-4", "SEARCH", null, null, null,
                        new SavedSearchInfo("search-1001", "Digital gift cards", "gift card",
                                "DIGITAL", "GIFT_CARDS", "0-50", "ACTIVE", 23, 3,
                                now.minusHours(1), "/search?q=gift%20card"),
                        "ACTIVE", null, new SavedPriceChange(false, null, null, null, null, 0, null),
                        now.minusDays(1), now.minusHours(1), List.of("OPEN_SEARCH", "MANAGE", "REMOVE")));
    }

    public static List<SavedAvailabilityChange> changes() {
        return List.of(new SavedAvailabilityChange("saved-1", "PRICE_DROPPED",
                "Secure Digital Game Card", "The price changed since you saved this item.",
                "24.99", "19.99", LocalDateTime.now().minusHours(2), "View item", "/listings/listing-1001"));
    }

    public static MoveSavedToCartResponse moveToCart(String listingId) {
        return new MoveSavedToCartResponse(true, "cart-1000", listingId, true, false,
                "19.99", true, "Moved to cart using current backend price.", "/cart");
    }

    public static SavedActionResponse action(String message) {
        return new SavedActionResponse(true, "OK", message, LocalDateTime.now());
    }

    private static SavedSummary summary() {
        return new SavedSummary(4, 1, 0, 1, 1, 1, 0, 2);
    }

    private static List<SavedGroup> groups() {
        return List.of(new SavedGroup("ALL", "All saved", 4, 2, true),
                new SavedGroup("DIGITAL", "Digital products", 1, 1, false),
                new SavedGroup("STORES", "Stores", 1, 0, false),
                new SavedGroup("COUPONS", "Coupons", 1, 0, false),
                new SavedGroup("SEARCHES", "Saved searches", 1, 1, false),
                new SavedGroup("UNAVAILABLE", "Unavailable/expired", 0, 0, false));
    }
}

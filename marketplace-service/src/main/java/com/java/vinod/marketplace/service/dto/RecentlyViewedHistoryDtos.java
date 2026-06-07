package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Recently Viewed & History API contracts for STORY-053.
 */
public final class RecentlyViewedHistoryDtos {
    private RecentlyViewedHistoryDtos() {
    }

    public record HistoryDashboardResponse(String userId, boolean guestMode, HistoryTrackingStatus trackingStatus,
                                           HistorySummary historySummary, List<HistoryGroup> groups,
                                           List<HistoryItem> recentItems, int unavailableCount,
                                           List<String> availableActions) {
    }

    public record HistoryTrackingStatus(boolean trackingEnabled, boolean paused, LocalDateTime pausedAt,
                                        int autoExpireDays, String userSafeMessage) {
    }

    public record HistorySummary(int totalCount, int listingCount, int digitalProductCount, int storeCount,
                                 int categoryCount, int searchCount, int couponPromotionCount,
                                 int publicProfileCount, int unavailableCount) {
    }

    public record HistoryGroup(String groupCode, String label, int count, boolean active) {
    }

    public record HistoryItem(String historyItemId, String historyType, HistoryListingInfo listing,
                              HistoryStoreInfo store, HistoryCategoryInfo category, HistorySearchInfo search,
                              HistoryCouponInfo coupon, HistoryPublicProfileInfo publicProfile,
                              String availabilityStatus, String availabilityReason, LocalDateTime lastViewedAt,
                              int viewCount, List<String> availableActions) {
    }

    public record HistoryListingInfo(String listingId, String productId, String title, String imageUrl,
                                     String marketplaceCode, String categoryCode, String productType,
                                     String currentPrice, String currency, String availabilityStatus,
                                     HistorySellerStoreSummary sellerStore, String route) {
    }

    public record HistoryStoreInfo(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                   boolean sellerVerifiedBadgeVisible, List<String> marketplaceBadges,
                                   String approximateLocation, String storeStatus, int activeListingCount,
                                   String route) {
    }

    public record HistoryCategoryInfo(String marketplaceCode, String categoryCode, String categoryName,
                                      String iconUrl, String availabilityStatus, String route) {
    }

    public record HistorySearchInfo(String query, String marketplaceCode, String categoryCode,
                                    String filtersSummary, int resultCount, String route) {
    }

    public record HistoryCouponInfo(String couponId, String couponType, String title, String discountSummary,
                                    String marketplaceCode, String categoryCode, LocalDateTime expiryDate,
                                    String eligibilityStatus, boolean expired, String route) {
    }

    public record HistoryPublicProfileInfo(String profileType, String profileId, String displayName,
                                           String avatarUrl, boolean genericAvatar, List<String> publicSafeBadges,
                                           String approximateLocation, String route) {
    }

    public record HistorySellerStoreSummary(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                            boolean privacySafe, List<String> trustBadges) {
    }

    public record RecordHistoryItemRequest(String historyType, String relatedEntityId, String marketplaceCode,
                                           String categoryCode, String sourceRoute, LocalDateTime viewedAt) {
    }

    public record HistoryActionResponse(boolean success, String status, String message, LocalDateTime updatedAt) {
    }

    public record MoveHistoryToCartResponse(boolean success, String cartId, String listingId, boolean added,
                                            boolean alreadyInCart, String currentPrice, boolean priceChanged,
                                            String userSafeMessage, String route) {
    }

    public record SimilarItemsPlaceholderResponse(boolean enabled, String sourceHistoryItemId,
                                                  List<HistoryItem> items, String userSafeMessage,
                                                  boolean personalizationUsed) {
    }

    public static HistoryDashboardResponse dashboard(boolean guestMode, boolean paused) {
        return new HistoryDashboardResponse(guestMode ? "guest-local" : "user-1000", guestMode,
                new HistoryTrackingStatus(!paused, paused, paused ? LocalDateTime.now().minusHours(6) : null,
                        90, paused ? "Browsing history is paused." : "Browsing history tracking is active."),
                new HistorySummary(6, 1, 1, 1, 1, 1, 1, 1, 0), groups(), items(), 0,
                List.of("VIEW_RECENTLY_VIEWED", "OPEN_LISTING", "OPEN_STORE", "OPEN_CATEGORY_SEARCH",
                        "SAVE_ITEM", "MOVE_TO_CART", "REMOVE_HISTORY_ITEM", "CLEAR_HISTORY",
                        "PAUSE_HISTORY_TRACKING", "RESUME_HISTORY_TRACKING", "BACK"));
    }

    public static List<HistoryItem> items() {
        LocalDateTime now = LocalDateTime.now();
        HistorySellerStoreSummary seller = new HistorySellerStoreSummary("store-1000", "Sharity Digital Deals",
                "marketplace/placeholders/store.png", true, List.of("Seller verified"));
        return List.of(
                new HistoryItem("history-1", "DIGITAL_PRODUCT",
                        new HistoryListingInfo("listing-1001", "product-1001", "Secure Digital Game Card",
                                "marketplace/placeholders/digital-card.png", "DIGITAL", "GIFT_CARDS",
                                "DIGITAL", "19.99", "USD", "ACTIVE", seller, "/listings/listing-1001"),
                        null, null, null, null, null, "ACTIVE", null, now.minusMinutes(20), 3,
                        List.of("OPEN_LISTING", "SAVE_ITEM", "MOVE_TO_CART", "REMOVE")),
                new HistoryItem("history-2", "STORE", null,
                        new HistoryStoreInfo("store-1000", "Sharity Digital Deals",
                                "marketplace/placeholders/store.png", true, List.of("DIGITAL"),
                                "Phoenix, AZ", "ACTIVE", 12, "/store/store-1000"),
                        null, null, null, null, "ACTIVE", null, now.minusHours(1), 2,
                        List.of("OPEN_STORE", "SAVE_ITEM", "REMOVE")),
                new HistoryItem("history-3", "CATEGORY", null, null,
                        new HistoryCategoryInfo("DIGITAL", "GIFT_CARDS", "Gift cards",
                                "marketplace/icons/gift-card.png", "ACTIVE", "/categories/gift-cards"),
                        null, null, null, "ACTIVE", null, now.minusHours(3), 1,
                        List.of("OPEN_CATEGORY", "REMOVE")),
                new HistoryItem("history-4", "SEARCH", null, null, null,
                        new HistorySearchInfo("gift card", "DIGITAL", "GIFT_CARDS",
                                "Active digital products under 50 USD", 23, "/search?q=gift%20card"),
                        null, null, "ACTIVE", null, now.minusDays(1), 4,
                        List.of("OPEN_SEARCH", "SAVE_SEARCH", "REMOVE")),
                new HistoryItem("history-5", "COUPON", null, null, null, null,
                        new HistoryCouponInfo("coupon-1001", "PLATFORM", "Digital welcome coupon",
                                "10% off eligible digital items", "DIGITAL", "ALL", now.plusDays(5),
                                "ELIGIBLE", false, "/coupons/coupon-1001"),
                        null, "ACTIVE", null, now.minusDays(2), 1, List.of("OPEN_COUPON", "SAVE_ITEM", "REMOVE")),
                new HistoryItem("history-6", "PUBLIC_PROFILE", null, null, null, null, null,
                        new HistoryPublicProfileInfo("BUYER", "buyer-alias-1000", "Phoenix Buyer",
                                "marketplace/placeholders/avatar.png", false, List.of("Privacy-safe"),
                                "Hidden", "/public/buyer/buyer-alias-1000"),
                        "ACTIVE", null, now.minusDays(3), 1, List.of("OPEN_PROFILE", "REMOVE")));
    }

    public static HistoryActionResponse action(String message) {
        return new HistoryActionResponse(true, "OK", message, LocalDateTime.now());
    }

    public static MoveHistoryToCartResponse moveToCart(String historyItemId) {
        return new MoveHistoryToCartResponse(true, "cart-1000", "listing-1001", true, false,
                "19.99", false, "Moved from history to cart using current backend price.", "/cart");
    }

    public static SimilarItemsPlaceholderResponse similar(String historyItemId) {
        return new SimilarItemsPlaceholderResponse(true, historyItemId, items().subList(0, 1),
                "Similar items placeholder uses category/store mock data only.", false);
    }

    private static List<HistoryGroup> groups() {
        return List.of(new HistoryGroup("ALL", "All", 6, true),
                new HistoryGroup("LISTINGS", "Listings", 1, false),
                new HistoryGroup("DIGITAL", "Digital", 1, false),
                new HistoryGroup("STORES", "Stores", 1, false),
                new HistoryGroup("CATEGORIES", "Categories", 1, false),
                new HistoryGroup("SEARCHES", "Searches", 1, false),
                new HistoryGroup("COUPONS", "Coupons", 1, false),
                new HistoryGroup("PROFILES", "Profiles", 1, false),
                new HistoryGroup("UNAVAILABLE", "Unavailable", 0, false));
    }
}

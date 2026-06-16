package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Search & Explore API contracts for STORY-054.
 */
public final class SearchExploreDtos {
    private SearchExploreDtos() {
    }

    public record SearchDashboardResponse(List<SearchMarketplaceResult> digitalFirstDiscovery,
                                          List<RecentSearchItem> recentSearches,
                                          List<PopularSearchItem> popularSearches,
                                          List<SearchMarketplaceResult> marketplaceHighlights,
                                          List<SearchCategoryResult> categoryHighlights,
                                          List<SavedSearchItem> savedSearches,
                                          String searchHistoryPrivacyRoute,
                                          List<String> availableActions) {
    }

    public record SearchSuggestionItem(String suggestionId, String suggestionType, String label,
                                       String marketplaceCode, String categoryCode, String iconUrl,
                                       String availabilityStatus, String userSafeReason, String route) {
    }

    public record SearchResultsResponse(String query, SearchFilterState appliedFilters, String sort,
                                        long totalResults, List<String> resultGroups,
                                        List<SearchResultItem> results, String disabledResultSummary,
                                        List<EmptyStateAlternative> emptyStateAlternatives, int page, int size) {
    }

    public record SearchResultItem(String resultId, String resultType, SearchListingResult listing,
                                   SearchStoreResult store, SearchCategoryResult category,
                                   SearchMarketplaceResult marketplace, SearchCouponResult coupon,
                                   String publicProfileLater, String sponsoredPlaceholder,
                                   String relevanceLabel, List<String> availableActions) {
    }

    public record SearchListingResult(String listingId, String productId, String title, String imageUrl,
                                      String marketplaceCode, String categoryCode, String subcategoryCode,
                                      String productType, String price, String currency, String availabilityStatus,
                                      SearchStoreResult sellerStore, boolean sellerVerifiedBadgeVisible,
                                      boolean couponEligible, String ratingSummaryLater, String route) {
    }

    public record SearchStoreResult(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                    boolean sellerVerifiedBadgeVisible, List<String> marketplaceBadges,
                                    List<String> categoryBadges, String approximateLocation,
                                    int activeListingCount, String ratingSummaryLater,
                                    boolean safeMessagingAvailable, String route) {
    }

    public record SearchCategoryResult(String marketplaceCode, String categoryCode, String categoryName,
                                       String iconUrl, int listingCount, String availabilityStatus,
                                       String userSafeReason, String route) {
    }

    public record SearchMarketplaceResult(String marketplaceCode, String marketplaceName, String iconUrl,
                                          String status, boolean availableInUserCountry,
                                          boolean userPreferenceEnabled, int listingCount,
                                          String userSafeReason, String route) {
    }

    public record SearchCouponResult(String couponId, String couponType, String title, String discountSummary,
                                     String marketplaceCode, String categoryCode, LocalDateTime expiryDate,
                                     String eligibilityStatus, String route) {
    }

    public record SearchFilterState(String marketplaceCode, String categoryCode, String subcategoryCode,
                                    String minPrice, String maxPrice, String productType, String availability,
                                    String sellerStoreId, Boolean sellerVerified,
                                    String countryRegionAvailability, Boolean couponEligible,
                                    String deliveryType, String productCondition, String ratingLater) {
    }

    public record SearchSortOption(String sortCode, String label, boolean active, boolean available,
                                   String userSafeDisabledReason) {
    }

    public record RecentSearchItem(String recentSearchId, String query, String marketplaceCode,
                                   String categoryCode, String filtersSummary, LocalDateTime searchedAt,
                                   String route) {
    }

    public record PopularSearchItem(String searchId, String query, String marketplaceCode,
                                    String categoryCode, String popularityLabel, String route) {
    }

    public record SaveSearchRequest(String name, String query, SearchFilterState filters, String sort) {
    }

    public record SavedSearchItem(String savedSearchId, String name, String query, String filtersSummary,
                                  String sort, LocalDateTime createdAt, String route) {
    }

    public record EmptyStateAlternative(String alternativeCode, String title, String description,
                                        String actionLabel, String route, SearchFilterState adjustedFilters) {
    }

    public record MoveSearchResultToCartResponse(boolean success, String cartId, String listingId,
                                                 boolean added, boolean alreadyInCart, String currentPrice,
                                                 boolean priceChanged, String userSafeMessage, String route) {
    }

    public record SearchActionResponse(boolean success, String status, String message, LocalDateTime updatedAt) {
    }

    public static SearchDashboardResponse dashboard() {
        return new SearchDashboardResponse(List.of(marketplace("DIGITAL", "Digital Marketplace", "ACTIVE", 42)),
                recent(), popular(), marketplaces(), categories(), saved(), "/history",
                List.of("SEARCH", "APPLY_FILTERS", "CLEAR_FILTERS", "SORT_RESULTS", "OPEN_LISTING",
                        "OPEN_STORE", "SAVE_SEARCH", "CLEAR_RECENT_SEARCH", "VIEW_CATEGORY",
                        "VIEW_MARKETPLACE", "MOVE_ELIGIBLE_ITEM_TO_CART", "BACK"));
    }

    public static List<SearchSuggestionItem> suggestions() {
        return List.of(new SearchSuggestionItem("suggestion-1", "LISTING", "Secure Digital Game Card",
                        "DIGITAL", "GIFT_CARDS", "marketplace/icons/gift-card.png", "AVAILABLE",
                        null, "/listing/listing-1001"),
                new SearchSuggestionItem("suggestion-2", "STORE", "Sharity Digital Deals",
                        "DIGITAL", null, "marketplace/placeholders/store.png", "AVAILABLE",
                        null, "/store/store-1000"));
    }

    public static SearchResultsResponse results(String query) {
        SearchFilterState filters = filters();
        return new SearchResultsResponse(query == null ? "digital" : query, filters, "DIGITAL_FIRST", 4,
                List.of("DIGITAL_PRODUCTS", "STORES", "COUPONS", "SPONSORED_PLACEHOLDER"),
                List.of(new SearchResultItem("result-listing-1", "LISTING", listing(), null, null, null,
                                null, null, null, "Digital-first match", List.of("OPEN_LISTING", "SAVE", "BUY_NOW")),
                        new SearchResultItem("result-store-1", "STORE", null, store(), null, null,
                                null, null, null, "Verified seller store", List.of("OPEN_STORE", "SAVE_STORE")),
                        new SearchResultItem("result-coupon-1", "COUPON", null, null, null, null,
                                coupon(), null, null, "Coupon eligible", List.of("SAVE_COUPON")),
                        new SearchResultItem("result-sponsored-placeholder", "SPONSORED_PLACEHOLDER", null, null,
                                null, null, null, null, "Sponsored listings require future ad rules.",
                                "Placeholder only", List.of())),
                "1 result hidden because restricted inventory must not leak.", alternatives(), 0, 20);
    }

    public static List<SearchStoreResult> stores() {
        return List.of(store());
    }

    public static List<SearchCategoryResult> categories() {
        return List.of(new SearchCategoryResult("DIGITAL", "GIFT_CARDS", "Gift cards",
                "marketplace/icons/gift-card.png", 24, "AVAILABLE", null, "/search/category/GIFT_CARDS"));
    }

    public static List<SearchMarketplaceResult> marketplaces() {
        return List.of(marketplace("DIGITAL", "Digital Marketplace", "ACTIVE", 42),
                marketplace("ELECTRONICS", "Electronics later", "COMING_SOON", 0),
                marketplace("JEWELLERY", "Imitation Jewellery", "AVAILABLE", 8));
    }

    public static List<SearchCouponResult> coupons() {
        return List.of(coupon());
    }

    public static List<RecentSearchItem> recent() {
        return List.of(new RecentSearchItem("recent-1", "gift card", "DIGITAL", "GIFT_CARDS",
                "Digital, available, under 50 USD", LocalDateTime.now().minusHours(1), "/search/results?q=gift%20card"));
    }

    public static List<PopularSearchItem> popular() {
        return List.of(new PopularSearchItem("popular-1", "digital games", "DIGITAL", null,
                "Popular in your country", "/search/results?q=digital%20games"));
    }

    public static List<SavedSearchItem> saved() {
        return List.of(new SavedSearchItem("saved-search-1", "Digital deals", "digital",
                "Digital Marketplace, coupon eligible", "DIGITAL_FIRST", LocalDateTime.now().minusDays(2),
                "/search/saved/saved-search-1"));
    }

    public static List<EmptyStateAlternative> alternatives() {
        return List.of(new EmptyStateAlternative("REMOVE_FILTERS", "Remove filters",
                "Try a broader search with fewer filters.", "Clear filters", "/search/results",
                new SearchFilterState("DIGITAL", null, null, null, null, "DIGITAL", "AVAILABLE",
                        null, null, "US", null, null, null, null)));
    }

    public static MoveSearchResultToCartResponse moveToCart(String listingId) {
        return new MoveSearchResultToCartResponse(false, null, listingId, false, false,
                null, false, "Digital products use direct buy only.", "/listing/" + listingId + "/buy");
    }

    public static SearchActionResponse action(String message) {
        return new SearchActionResponse(true, "OK", message, LocalDateTime.now());
    }

    private static SearchListingResult listing() {
        return new SearchListingResult("listing-1001", "product-1001", "Secure Digital Game Card",
                "marketplace/placeholders/digital-card.png", "DIGITAL", "GIFT_CARDS", "GAME_CODES",
                "DIGITAL", "19.99", "USD", "ACTIVE", store(), true, true, "Reviews later",
                "/listing/listing-1001");
    }

    private static SearchStoreResult store() {
        return new SearchStoreResult("store-1000", "Sharity Digital Deals",
                "marketplace/placeholders/store.png", true, List.of("DIGITAL"), List.of("GIFT_CARDS"),
                "Phoenix, AZ", 12, "Reviews later", true, "/store/store-1000");
    }

    private static SearchCouponResult coupon() {
        return new SearchCouponResult("coupon-1001", "PLATFORM", "Digital welcome coupon",
                "10% off eligible digital listings", "DIGITAL", "GIFT_CARDS", LocalDateTime.now().plusDays(5),
                "ELIGIBLE", "/coupons/coupon-1001");
    }

    private static SearchMarketplaceResult marketplace(String code, String name, String status, int count) {
        boolean available = "ACTIVE".equals(status) || "AVAILABLE".equals(status);
        return new SearchMarketplaceResult(code, name, "marketplace/icons/" + code.toLowerCase() + ".png",
                status, available, true, count, available ? null : "Coming soon in your country.",
                "/search/marketplace/" + code);
    }

    private static SearchFilterState filters() {
        return new SearchFilterState("DIGITAL", null, null, "0", "50", "DIGITAL", "AVAILABLE",
                null, true, "US", true, "SECURE_REVEAL", null, "LATER");
    }
}

package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Category & Marketplace API contracts for STORY-055.
 */
public final class CategoryMarketplaceDtos {
    private CategoryMarketplaceDtos() {
    }

    public record MarketplaceDashboardResponse(List<MarketplaceCardItem> marketplaces,
                                               MarketplaceShortcut recentlyViewedShortcut,
                                               MarketplaceShortcut savedShortcut,
                                               List<MarketplaceEmptyStateAlternative> emptyStateAlternatives,
                                               List<String> availableActions) {
    }

    public record MarketplaceCardItem(String marketplaceCode, String marketplaceName, String description,
                                      String status, boolean digitalFirstPriority, String iconUrl,
                                      String bannerUrl, MarketplaceAvailabilityStatus availability,
                                      int featuredCategoryCount, int listingCount, String route) {
    }

    public record MarketplaceLandingResponse(MarketplaceHero hero, MarketplaceAvailabilityStatus availability,
                                             DigitalMarketplaceInfo digitalMarketplaceInfo,
                                             List<MarketplaceCategoryItem> featuredCategories,
                                             List<MarketplaceSubcategoryItem> subcategories,
                                             MarketplaceFilterConfigResponse filters,
                                             List<MarketplaceListingSection> listingSections,
                                             List<MarketplaceSellerStoreItem> sellerStores,
                                             List<MarketplaceCouponItem> coupons,
                                             MarketplaceShortcut recentlyViewedShortcut,
                                             MarketplaceShortcut savedShortcut,
                                             MarketplacePolicySummary policySummary,
                                             SellerMarketplaceEligibilityResponse sellerEligibility,
                                             List<MarketplaceEmptyStateAlternative> emptyStateAlternatives,
                                             List<String> availableActions) {
    }

    public record MarketplaceHero(String marketplaceCode, String title, String description, String iconUrl,
                                  String bannerUrl, String primaryCtaLabel, String primaryCtaRoute,
                                  String secondaryCtaLabel, String secondaryCtaRoute,
                                  String sellerCtaLabel, String sellerCtaRoute) {
    }

    public record MarketplaceAvailabilityStatus(String status, boolean availableInUserCountry,
                                                boolean userPreferenceEnabled, String countryCode,
                                                String userSafeReason) {
    }

    public record DigitalMarketplaceInfo(boolean secureDeliveryRequired, boolean chatCodeSharingBlocked,
                                         boolean revealFlowEnabled, boolean refundRulesAfterReveal,
                                         boolean sellerAcceptanceBeforeCapture, boolean authorizeFirstPayment,
                                         String userSafeMessage) {
    }

    public record MarketplaceCategoryItem(String marketplaceCode, String categoryCode, String categoryName,
                                          String description, String iconUrl, String bannerUrl,
                                          int listingCount, int couponEligibleCount,
                                          MarketplaceAvailabilityStatus availability, String route) {
    }

    public record MarketplaceSubcategoryItem(String marketplaceCode, String categoryCode, String subcategoryCode,
                                             String subcategoryName, String iconUrl, int listingCount,
                                             MarketplaceAvailabilityStatus availability, String route) {
    }

    public record MarketplaceFilterConfigResponse(String marketplaceCode, String categoryCode,
                                                  String subcategoryCode,
                                                  List<MarketplaceFilterDefinition> filters,
                                                  List<String> sortOptions) {
    }

    public record MarketplaceFilterDefinition(String filterCode, String label, String filterType,
                                              List<String> options, boolean enabled,
                                              String userSafeDisabledReason) {
    }

    public record MarketplaceListingSection(String sectionCode, String title, List<MarketplaceListingItem> listings,
                                            String route) {
    }

    public record MarketplaceListingItem(String listingId, String productId, String title, String imageUrl,
                                         String price, String currency, String marketplaceCode,
                                         String categoryCode, String productType, String availabilityStatus,
                                         String storeDisplayName, boolean sellerVerifiedBadgeVisible,
                                         boolean couponEligible, String route, List<String> availableActions) {
    }

    public record MarketplaceSellerStoreItem(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                             boolean sellerVerifiedBadgeVisible, List<String> marketplaceBadges,
                                             List<String> categoryBadges, String approximateLocation,
                                             int activeListingCount, boolean safeMessagingAvailable, String route) {
    }

    public record MarketplaceCouponItem(String couponId, String couponType, String title, String discountSummary,
                                        String marketplaceCode, String categoryCode, LocalDateTime expiryDate,
                                        String eligibilityStatus, String route) {
    }

    public record MarketplacePolicySummary(String marketplaceCode, String policyVersion,
                                           String listingRulesSummary, String buyerRulesSummary,
                                           String sellerRulesSummary, String refundReturnRulesSummary,
                                           String digitalDeliveryRulesSummary,
                                           String prohibitedOffPlatformWarning, String fullPolicyRoute,
                                           boolean sellerAcceptanceRequired, boolean sellerAccepted) {
    }

    public record SellerMarketplaceEligibilityResponse(String marketplaceCode, boolean sellerEligible,
                                                       boolean canStartOnboarding,
                                                       List<SellerMarketplaceRequirement> requirements,
                                                       String startSellingRoute, String userSafeMessage) {
    }

    public record SellerMarketplaceRequirement(String requirementCode, String label, boolean complete,
                                               boolean required, String route, String userSafeMessage) {
    }

    public record MarketplaceShortcut(boolean enabled, int count, String route, String userSafeMessage) {
    }

    public record MarketplaceEmptyStateAlternative(String alternativeCode, String title, String description,
                                                   String actionLabel, String route, Object adjustedFilters) {
    }

    public record SaveMarketplaceRequest(String saveType, String marketplaceCode, String categoryCode,
                                         String subcategoryCode, String searchQuery, Object filters, String sort) {
    }

    public record MarketplaceActionResponse(boolean success, String status, String message, String route,
                                            LocalDateTime updatedAt) {
    }

    public static MarketplaceDashboardResponse dashboard() {
        return new MarketplaceDashboardResponse(marketplaces(),
                new MarketplaceShortcut(true, 3, "/recently-viewed", "Continue browsing recent marketplace items."),
                new MarketplaceShortcut(true, 4, "/saved", "Open saved marketplace items."),
                alternatives("DIGITAL"), List.of("VIEW_MARKETPLACE", "VIEW_CATEGORY", "FILTER_LISTINGS",
                "SORT_LISTINGS", "OPEN_LISTING", "OPEN_STORE", "SAVE_MARKETPLACE_CATEGORY_SEARCH",
                "VIEW_COUPONS", "START_SELLING", "VIEW_MARKETPLACE_POLICY", "BACK"));
    }

    public static MarketplaceLandingResponse landing(String marketplaceCode) {
        String code = marketplaceCode == null ? "DIGITAL" : marketplaceCode.toUpperCase();
        return new MarketplaceLandingResponse(hero(code), availability(code), digitalInfo(code),
                categories(code), subcategories(code, "GIFT_CARDS"), filters(code, null, null),
                listingSections(code), stores(code), coupons(code),
                new MarketplaceShortcut(true, 2, "/history/listings", "Recently viewed in this marketplace."),
                new MarketplaceShortcut(true, 1, "/saved/items", "Saved items from this marketplace."),
                policy(code), sellerEligibility(code), alternatives(code),
                List.of("BROWSE_LISTINGS", "VIEW_POLICY", "START_SELLING", "SAVE_MARKETPLACE", "BACK"));
    }

    public static List<MarketplaceCardItem> marketplaces() {
        return List.of(card("DIGITAL", "Digital Marketplace", "ACTIVE", true, 42),
                card("ELECTRONICS", "Electronics later", "COMING_SOON", false, 0),
                card("JEWELLERY", "Imitation Jewellery", "ACTIVE", false, 8),
                card("AUTOMOTIVE", "Automotive later", "COMING_SOON", false, 0),
                card("GROCERY", "Fresh Grocery later", "COMING_SOON", false, 0),
                card("MEAT", "Fresh Meat later", "COMING_SOON", false, 0),
                card("RENTALS", "Rentals later", "COMING_SOON", false, 0));
    }

    public static List<MarketplaceCategoryItem> categories(String marketplaceCode) {
        return List.of(new MarketplaceCategoryItem(marketplaceCode, "GIFT_CARDS", "Gift cards",
                "Secure digital gift cards.", "marketplace/icons/gift-card.png",
                "marketplace/banners/gift-card.png", 24, 6, availability(marketplaceCode),
                "/marketplace/" + marketplaceCode + "/category/GIFT_CARDS"));
    }

    public static List<MarketplaceSubcategoryItem> subcategories(String marketplaceCode, String categoryCode) {
        return List.of(new MarketplaceSubcategoryItem(marketplaceCode, categoryCode, "GAME_CODES",
                "Game codes", "marketplace/icons/game.png", 12, availability(marketplaceCode),
                "/marketplace/" + marketplaceCode + "/category/" + categoryCode + "/subcategory/GAME_CODES"));
    }

    public static MarketplaceFilterConfigResponse filters(String marketplaceCode, String categoryCode, String subcategoryCode) {
        return new MarketplaceFilterConfigResponse(marketplaceCode, categoryCode, subcategoryCode,
                List.of(new MarketplaceFilterDefinition("PRICE", "Price range", "RANGE", List.of("0-25", "25-50"), true, null),
                        new MarketplaceFilterDefinition("SECURE_REVEAL", "Secure reveal available", "BOOLEAN", List.of("YES"), true, null),
                        new MarketplaceFilterDefinition("RATING_LATER", "Best rated later", "SELECT", List.of(), false, "Reviews are later.")),
                List.of("RELEVANCE", "DIGITAL_FIRST", "NEWEST", "PRICE_LOW_HIGH"));
    }

    public static List<MarketplaceListingSection> listingSections(String marketplaceCode) {
        MarketplaceListingItem item = listing(marketplaceCode);
        return List.of(new MarketplaceListingSection("TRENDING", "Trending listings", List.of(item), "/marketplace/" + marketplaceCode + "/listings?section=trending"),
                new MarketplaceListingSection("NEW", "New listings", List.of(item), "/marketplace/" + marketplaceCode + "/listings?section=new"),
                new MarketplaceListingSection("COUPON_ELIGIBLE", "Coupon eligible", List.of(item), "/marketplace/" + marketplaceCode + "/coupons"));
    }

    public static List<MarketplaceSellerStoreItem> stores(String marketplaceCode) {
        return List.of(new MarketplaceSellerStoreItem("store-1000", "Sharity Digital Deals",
                "marketplace/placeholders/store.png", true, List.of(marketplaceCode), List.of("GIFT_CARDS"),
                "Phoenix, AZ", 12, true, "/store/store-1000"));
    }

    public static List<MarketplaceCouponItem> coupons(String marketplaceCode) {
        return List.of(new MarketplaceCouponItem("coupon-1001", "PLATFORM", "Digital welcome coupon",
                "10% off eligible digital items", marketplaceCode, "GIFT_CARDS", LocalDateTime.now().plusDays(5),
                "ELIGIBLE", "/marketplace/" + marketplaceCode + "/coupons"));
    }

    public static MarketplacePolicySummary policy(String marketplaceCode) {
        return new MarketplacePolicySummary(marketplaceCode, "2026.06", "Listings must be accurate and public-safe.",
                "Buyers use secure delivery and checkout rules.", "Sellers must complete verification and payout setup.",
                "Digital refund eligibility may change after reveal.", "Digital codes are delivered only through Sharity secure delivery.",
                "Keep all communication and payments inside Sharity.", "/marketplace/" + marketplaceCode + "/policy", true, false);
    }

    public static SellerMarketplaceEligibilityResponse sellerEligibility(String marketplaceCode) {
        return new SellerMarketplaceEligibilityResponse(marketplaceCode, false, true,
                List.of(new SellerMarketplaceRequirement("SELLER_VERIFICATION", "Seller verification", true, true,
                                "/seller/verification", "Verification complete."),
                        new SellerMarketplaceRequirement("PAYOUT_SETUP", "Payout setup", false, true,
                                "/seller/payout", "Payout setup is required before selling."),
                        new SellerMarketplaceRequirement("POLICY_ACCEPTANCE", "Marketplace policy", false, true,
                                "/marketplace/" + marketplaceCode + "/policy", "Accept current marketplace policy.")),
                "/marketplace/" + marketplaceCode + "/start-selling",
                "Complete payout setup and policy acceptance to start selling.");
    }

    public static List<MarketplaceEmptyStateAlternative> alternatives(String marketplaceCode) {
        return List.of(new MarketplaceEmptyStateAlternative("TRY_DIGITAL", "Try Digital Marketplace",
                "Digital products are available first for MVP.", "Open Digital", "/marketplace/DIGITAL", null));
    }

    public static MarketplaceActionResponse action(String message, String route) {
        return new MarketplaceActionResponse(true, "OK", message, route, LocalDateTime.now());
    }

    private static MarketplaceCardItem card(String code, String name, String status, boolean digitalFirst, int count) {
        return new MarketplaceCardItem(code, name, name + " landing page.", status, digitalFirst,
                "marketplace/icons/" + code.toLowerCase() + ".png",
                "marketplace/banners/" + code.toLowerCase() + ".png", availability(code), 1, count,
                "/marketplace/" + code);
    }

    private static MarketplaceHero hero(String code) {
        return new MarketplaceHero(code, code + " Marketplace", "Browse categories, stores, coupons, and policies.",
                "marketplace/icons/" + code.toLowerCase() + ".png", "marketplace/banners/" + code.toLowerCase() + ".png",
                "Browse listings", "/marketplace/" + code, "View policy", "/marketplace/" + code + "/policy",
                "Start selling", "/marketplace/" + code + "/start-selling");
    }

    private static MarketplaceAvailabilityStatus availability(String code) {
        boolean available = !"ELECTRONICS".equals(code) && !"AUTOMOTIVE".equals(code) && !"GROCERY".equals(code)
                && !"MEAT".equals(code) && !"RENTALS".equals(code);
        return new MarketplaceAvailabilityStatus(available ? "AVAILABLE" : "COMING_SOON", available, true, "US",
                available ? null : "Coming soon in your country.");
    }

    private static DigitalMarketplaceInfo digitalInfo(String code) {
        if (!"DIGITAL".equals(code)) {
            return null;
        }
        return new DigitalMarketplaceInfo(true, true, true, true, true, true,
                "Digital codes are delivered only through Sharity secure delivery. Do not share codes in chat.");
    }

    private static MarketplaceListingItem listing(String marketplaceCode) {
        return new MarketplaceListingItem("listing-1001", "product-1001", "Secure Digital Game Card",
                "marketplace/placeholders/digital-card.png", "19.99", "USD", marketplaceCode, "GIFT_CARDS",
                "DIGITAL", "ACTIVE", "Sharity Digital Deals", true, true, "/listing/listing-1001",
                List.of("OPEN_LISTING", "SAVE", "MOVE_TO_CART"));
    }
}

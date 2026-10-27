package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Public Store & Profile API contracts for STORY-050.
 */
public final class PublicStoreProfileDtos {
    private PublicStoreProfileDtos() {
    }

    public record SellerPublicStoreResponse(String sellerStoreId, String storeDisplayName, String storeLogoUrl,
                                            String storeStatus, List<SellerTrustBadge> sellerTrustBadges,
                                            String memberSince, PublicLocationDisplay approximateLocation,
                                            List<MarketplaceCategoryBadge> marketplaceBadges,
                                            List<MarketplaceCategoryBadge> categoryBadges, String aboutSeller,
                                            StorePolicySummaryResponse policySummary,
                                            StoreListingsResponse activeListingSummary,
                                            StoreReviewsPlaceholderResponse reviewsSummary,
                                            SafeMessagingAvailability safeMessaging,
                                            List<String> reportShareActions,
                                            StoreOwnerPreviewResponse ownerPreview,
                                            List<String> availableActions) {
    }

    public record SellerTrustBadge(String badgeCode, String label, String description, boolean visible,
                                   boolean verified, String userSafeMessage) {
    }

    public record PublicLocationDisplay(String visibility, String cityRegionDisplay, String countryDisplay,
                                        boolean approximateOnly, String userSafeMessage) {
    }

    public record MarketplaceCategoryBadge(String code, String label, String iconUrl, String status,
                                           String userSafeMessage) {
    }

    public record PublicStoreListingItem(String listingId, String productId, String title, String imageUrl,
                                         String price, String currency, String marketplaceCode,
                                         String categoryCode, String productType, String availabilityStatus,
                                         String ratingSummaryLater, String route, List<String> availableActions) {
    }

    public record StoreListingsResponse(String sellerStoreId, List<PublicStoreListingItem> listings,
                                        StoreListingFilterOptions filters, int page, int size, long total,
                                        List<String> availableActions) {
    }

    public record StoreListingFilterOptions(List<String> marketplaceOptions, List<String> categoryOptions,
                                            String priceRange, List<String> availabilityOptions,
                                            List<String> productTypeOptions, List<String> sortOptions) {
    }

    public record StorePolicySummaryResponse(String sellerStoreId, String digitalDeliveryPolicySummary,
                                             String refundReturnPolicySummary, String sellerResponsePolicySummary,
                                             String storeSpecificTermsSummary, String prohibitedOffPlatformWarning,
                                             LocalDateTime updatedAt) {
    }

    public record StoreReviewsPlaceholderResponse(boolean enabled, String averageRatingLater,
                                                  int reviewCountLater, List<String> ratingBreakdownLater,
                                                  String userSafeMessage, String routeLater) {
    }

    public record BuyerLimitedPublicProfileResponse(String buyerAliasId, String buyerAlias, String avatarUrl,
                                                    boolean genericAvatar, String memberSince,
                                                    PublicLocationDisplay approximateLocation,
                                                    List<BuyerTrustIndicator> trustIndicators,
                                                    String reviewDisplayLater, List<String> reportActions,
                                                    List<String> availableActions) {
    }

    public record BuyerTrustIndicator(String indicatorCode, String label, boolean visible, String userSafeMessage) {
    }

    public record SafeMessagingAvailability(boolean available, String route, boolean prePurchaseEnabled,
                                            boolean postPurchaseRequired, String disabledReason,
                                            String userSafeMessage) {
    }

    public record ReportPublicProfileRequest(String profileType, String profileId, String reasonCode,
                                             String message, String relatedListingId,
                                             boolean userAcknowledgedReportRules) {
    }

    public record PublicProfileActionResponse(boolean success, String status, String message, String route,
                                              LocalDateTime updatedAt) {
    }

    public record ShareLinkResponse(String shareUrl, String copyText, LocalDateTime expiresAt,
                                    boolean publicSafe, String message) {
    }

    public record StoreOwnerPreviewResponse(String sellerStoreId, List<String> privateWarnings,
                                            List<String> publicViewNotes, String editStoreRoute,
                                            String managePrivacyRoute, String manageListingsRoute) {
    }

    public record AdminPublicProfileReportItem(String reportId, String profileType, String profileId,
                                               String reasonCode, String status, String severity,
                                               LocalDateTime createdAt, boolean placeholder) {
    }

    public static SellerPublicStoreResponse store(String sellerStoreId) {
        return new SellerPublicStoreResponse(sellerStoreId, "Sharity Digital Deals",
                "marketplace/placeholders/store.png", "ACTIVE", trustBadges(), "2025",
                location(), marketplaceBadges(), categoryBadges(),
                "Digital products and electronics deals. Communication stays inside Sharity.",
                policies(sellerStoreId), listings(sellerStoreId), reviews(sellerStoreId), messaging(sellerStoreId),
                List.of("REPORT_STORE", "SHARE_STORE", "COPY_STORE_LINK", "BLOCK_MESSAGING"),
                ownerPreview(sellerStoreId),
                List.of("VIEW_STORE", "VIEW_LISTINGS", "FILTER_LISTINGS", "CONTACT_SAFE_MESSAGING",
                        "REPORT_STORE_PROFILE", "SHARE_STORE_PROFILE", "SAVE_FOLLOW_STORE_LATER",
                        "PREVIEW_PUBLIC_VIEW", "VIEW_STORE_POLICIES", "BACK"));
    }

    public static StoreListingsResponse listings(String sellerStoreId) {
        return new StoreListingsResponse(sellerStoreId,
                List.of(new PublicStoreListingItem("listing-1001", "product-1001",
                        "Secure Digital Game Card", "marketplace/placeholders/digital-card.png",
                        "24.99", "USD", "DIGITAL", "GIFT_CARDS", "DIGITAL",
                        "ACTIVE", "Reviews later", "/listings/listing-1001",
                        List.of("VIEW_LISTING", "REPORT_LISTING"))),
                new StoreListingFilterOptions(List.of("DIGITAL"), List.of("GIFT_CARDS", "SOFTWARE"),
                        "0-100", List.of("ACTIVE", "AVAILABLE"), List.of("DIGITAL"),
                        List.of("NEWEST", "PRICE_LOW_HIGH", "RATING_LATER")),
                0, 20, 1, List.of("FILTER_LISTINGS", "VIEW_LISTING"));
    }

    public static StorePolicySummaryResponse policies(String sellerStoreId) {
        return new StorePolicySummaryResponse(sellerStoreId,
                "Digital delivery uses Sharity secure reveal only.",
                "Refund eligibility follows marketplace digital refund policy.",
                "Seller responds through Safe Messaging.",
                "Store terms cannot override Sharity policies.",
                "Keep all communication and payments inside Sharity.", LocalDateTime.now().minusDays(3));
    }

    public static StoreReviewsPlaceholderResponse reviews(String sellerStoreId) {
        return new StoreReviewsPlaceholderResponse(false, "Later", 0, List.of(),
                "Reviews and ratings are prepared for a later story.", "/store/" + sellerStoreId + "/reviews");
    }

    public static BuyerLimitedPublicProfileResponse buyer(String buyerAliasId) {
        return new BuyerLimitedPublicProfileResponse(buyerAliasId, "Phoenix Buyer",
                "marketplace/placeholders/avatar.png", false, "2025", location(),
                List.of(new BuyerTrustIndicator("VERIFIED_BUYER_LATER", "Verified buyer later", false,
                        "Buyer trust indicators stay limited and privacy-safe.")),
                "Review display later", List.of("REPORT_PROFILE"),
                List.of("VIEW_PROFILE", "REPORT_PROFILE", "BACK"));
    }

    public static SafeMessagingAvailability messaging(String profileId) {
        return new SafeMessagingAvailability(true, "/messages/listing/listing-1001", false, false,
                null, "Safe Messaging is the only contact path.");
    }

    public static PublicProfileActionResponse action(String message) {
        return new PublicProfileActionResponse(true, "OK", message, null, LocalDateTime.now());
    }

    public static ShareLinkResponse share(String profileType, String profileId) {
        String url = "https://sharity.example/" + profileType + "/" + profileId;
        return new ShareLinkResponse(url, url, LocalDateTime.now().plusDays(7), true,
                "Public-safe share link generated.");
    }

    public static StoreOwnerPreviewResponse ownerPreview(String sellerStoreId) {
        return new StoreOwnerPreviewResponse(sellerStoreId,
                List.of("Payout account, legal name, tax/KYC, and internal risk data are not public."),
                List.of("Buyers see store name, public badges, policies, listings, and Safe Messaging."),
                "/seller/store/edit", "/profile/privacy", "/seller/listings");
    }

    public static List<AdminPublicProfileReportItem> adminReports() {
        return List.of(new AdminPublicProfileReportItem("public-report-1", "STORE", "store-1000",
                "OFF_PLATFORM_PAYMENT", "PENDING", "MEDIUM", LocalDateTime.now().minusHours(5), true));
    }

    private static List<SellerTrustBadge> trustBadges() {
        return List.of(
                new SellerTrustBadge("SELLER_VERIFIED", "Seller verified", "Identity checked by Sharity.",
                        true, true, "Seller verified badge is public-safe."),
                new SellerTrustBadge("PAYPAL_PAYOUT_SAFE", "Payout verified", "Seller-safe payout readiness.",
                        true, true, "Provider account details are never shown."));
    }

    private static PublicLocationDisplay location() {
        return new PublicLocationDisplay("APPROXIMATE", "Phoenix, AZ", "United States", true,
                "Approximate location only. Exact address is never public.");
    }

    private static List<MarketplaceCategoryBadge> marketplaceBadges() {
        return List.of(new MarketplaceCategoryBadge("DIGITAL", "Digital", "marketplace/icons/digital.png",
                "ACTIVE", "Digital marketplace active."));
    }

    private static List<MarketplaceCategoryBadge> categoryBadges() {
        return List.of(new MarketplaceCategoryBadge("GIFT_CARDS", "Gift cards", "marketplace/icons/gift-card.png",
                "ACTIVE", "Category active."));
    }
}

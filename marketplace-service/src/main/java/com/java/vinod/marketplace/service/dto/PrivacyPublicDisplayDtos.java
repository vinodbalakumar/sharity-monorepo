package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Privacy & Public Display API contracts for STORY-048.
 */
public final class PrivacyPublicDisplayDtos {
    private PrivacyPublicDisplayDtos() {
    }

    public record PrivacyDashboardResponse(PrivacySummary privacySummary, BuyerPrivacySettings buyerPrivacy,
                                           SellerPublicDisplaySettings sellerPublicDisplay,
                                           List<PublicDisplayPreview> previews,
                                           SafeMessagingDisplayPreview safeMessagingPreview,
                                           SearchVisibilitySettings searchVisibility,
                                           PrivacyModerationSummary moderationSummary,
                                           List<PrivacyChangeTimelineEvent> timeline,
                                           List<AdminPrivacyReviewQueueItem> adminReviewPlaceholder,
                                           List<String> availableActions) {
    }

    public record PrivacySummary(boolean realNamePublic, String realNameDisplayMode, boolean buyerAliasActive,
                                 boolean sellerDisplayActive, boolean profilePhotoPublic,
                                 String cityRegionVisibility, String safeMessagingDisplayName,
                                 boolean searchVisible, int moderationPendingCount, String userSafeMessage) {
    }

    public record BuyerPrivacySettings(boolean realNameHidden, String buyerAlias, String buyerAliasVisibility,
                                       String buyerPublicDisplayMode, String profilePhotoVisibility,
                                       String cityRegionVisibility, String onlineStatusVisibility,
                                       String reviewDisplayModeLater, String safeMessagingDisplayMode,
                                       String orderPrivacyMode) {
    }

    public record SellerPublicDisplaySettings(String storeDisplayName, String storeLogoUrl,
                                              boolean sellerVerifiedBadgeVisible, String cityRegionVisibility,
                                              boolean responseRateVisibleLater, boolean ratingsReviewsVisibleLater,
                                              boolean memberSinceVisible, boolean soldCountVisibleLater,
                                              String aboutSeller, boolean policiesTermsSummaryVisible,
                                              boolean safeMessagingContactEnabled, boolean searchVisible,
                                              String moderationStatus) {
    }

    public record PublicDisplayPreview(String previewContext, String displayName, String avatarUrl,
                                       boolean genericAvatar, String locationDisplay, List<String> sellerBadges,
                                       String aboutSeller, String contactButtonLabel, List<String> hiddenFields,
                                       String userSafeMessage) {
    }

    public record SafeMessagingDisplayPreview(String buyerMessageDisplayName, String sellerMessageDisplayName,
                                              String avatarDisplay, boolean realNameHidden,
                                              boolean contactInfoHidden, String userSafeMessage) {
    }

    public record SearchVisibilitySettings(boolean sellerProfileSearchable, boolean buyerProfileSearchable,
                                           boolean marketplaceSearchVisible, boolean blockedByMarketplaceStatus,
                                           boolean blockedByAccountStatus, String userSafeReason) {
    }

    public record PrivacyModerationSummary(List<PrivacyModerationItem> pendingItems,
                                           List<PrivacyModerationItem> rejectedItems,
                                           List<PrivacyModerationItem> approvedItems, String userSafeMessage) {
    }

    public record PrivacyModerationItem(String itemId, String itemType, String label, String status,
                                        String userSafeReason, LocalDateTime submittedAt, LocalDateTime reviewedAt) {
    }

    public record UpdateBuyerPrivacyRequest(String buyerAliasVisibility, String buyerPublicDisplayMode,
                                            String profilePhotoVisibility, String cityRegionVisibility,
                                            String onlineStatusVisibility, String reviewDisplayModeLater,
                                            String safeMessagingDisplayMode, String orderPrivacyMode) {
    }

    public record UpdateSellerPublicDisplayRequest(String storeDisplayName, boolean storeLogoVisible,
                                                   String cityRegionVisibility, boolean responseRateVisibleLater,
                                                   boolean ratingsReviewsVisibleLater, boolean memberSinceVisible,
                                                   boolean soldCountVisibleLater, String aboutSeller,
                                                   boolean policiesTermsSummaryVisible,
                                                   boolean safeMessagingContactEnabled, boolean searchVisible) {
    }

    public record SavePrivacySettingsRequest(UpdateBuyerPrivacyRequest buyerPrivacy,
                                             UpdateSellerPublicDisplayRequest sellerPublicDisplay,
                                             String realNameVisibility, String profilePhotoVisibility,
                                             String cityRegionVisibility, SearchVisibilitySettings searchVisibility,
                                             boolean userAcknowledgedPreview) {
    }

    public record PrivacyActionResponse(boolean success, String status, String message, boolean moderationRequired,
                                        List<PrivacyModerationItem> moderationItems, LocalDateTime updatedAt) {
    }

    public record PrivacyChangeTimelineEvent(String eventId, String eventType, String title,
                                             String userSafeMessage, String status, LocalDateTime timestamp) {
    }

    public record AdminPrivacyReviewQueueItem(String reviewId, String userId, String reviewType,
                                              String itemType, String status, String submittedValueSummary,
                                              LocalDateTime createdAt, boolean placeholder) {
    }

    public static PrivacyDashboardResponse dashboard() {
        return new PrivacyDashboardResponse(summary(), buyer(), seller(), previews(), safeMessaging(),
                searchVisibility(), moderation(), timeline(), adminReviews(),
                List.of("CHANGE_BUYER_ALIAS_VISIBILITY", "CHANGE_SELLER_PUBLIC_DISPLAY", "HIDE_REAL_NAME",
                        "SHOW_FIRST_NAME_INITIAL", "MANAGE_PROFILE_PHOTO_VISIBILITY",
                        "MANAGE_CITY_REGION_VISIBILITY", "PREVIEW_PUBLIC_PROFILE",
                        "PREVIEW_SAFE_MESSAGING_DISPLAY", "MANAGE_SEARCH_VISIBILITY",
                        "SAVE_PRIVACY_SETTINGS", "BACK"));
    }

    public static PrivacyActionResponse action(String message) {
        return new PrivacyActionResponse(true, "OK", message, false, List.of(), LocalDateTime.now());
    }

    public static PrivacySummary summary() {
        return new PrivacySummary(false, "HIDDEN", true, true, true, "APPROXIMATE",
                "Phoenix Buyer / Sharity Digital Deals", true, 2,
                "Your real name is hidden in marketplace views. Contact info is private.");
    }

    public static BuyerPrivacySettings buyer() {
        return new BuyerPrivacySettings(true, "Phoenix Buyer", "VISIBLE", "BUYER_ALIAS",
                "GENERIC_OR_APPROVED", "HIDDEN", "HIDDEN", "ALIAS_LATER", "ALIAS", "MINIMUM_REQUIRED");
    }

    public static SellerPublicDisplaySettings seller() {
        return new SellerPublicDisplaySettings("Sharity Digital Deals", "marketplace/placeholders/store.png",
                true, "APPROXIMATE", false, false, true, false,
                "Digital and electronics deals with Safe Messaging only.", true, true, true, "PENDING_REVIEW");
    }

    public static List<PublicDisplayPreview> previews() {
        return List.of(
                new PublicDisplayPreview("BUYER_PUBLIC_VIEW", "Phoenix Buyer",
                        "marketplace/placeholders/avatar.png", false, "Hidden", List.of(), null,
                        null, List.of("Email", "Phone", "Real name"), "Buyer public view uses alias."),
                new PublicDisplayPreview("SELLER_PUBLIC_VIEW", "Sharity Digital Deals",
                        "marketplace/placeholders/store.png", false, "Phoenix, AZ", List.of("Seller verified"),
                        "Digital and electronics deals with Safe Messaging only.", "Contact via Safe Messaging",
                        List.of("Legal name", "Payout email", "Phone"), "Seller public view uses store identity."));
    }

    public static SafeMessagingDisplayPreview safeMessaging() {
        return new SafeMessagingDisplayPreview("Phoenix Buyer", "Sharity Digital Deals",
                "Approved avatar or generic avatar", true, true,
                "Safe Messaging hides legal name, email, and phone.");
    }

    public static SearchVisibilitySettings searchVisibility() {
        return new SearchVisibilitySettings(true, false, true, false, false,
                "Seller store can appear in marketplace search. Buyer profile is not searchable.");
    }

    public static PrivacyModerationSummary moderation() {
        LocalDateTime now = LocalDateTime.now();
        PrivacyModerationItem alias = new PrivacyModerationItem("privacy-mod-1", "BUYER_ALIAS",
                "Phoenix Buyer", "APPROVED", "Alias approved.", now.minusDays(20), now.minusDays(19));
        PrivacyModerationItem sellerName = new PrivacyModerationItem("privacy-mod-2", "SELLER_DISPLAY_NAME",
                "Sharity Digital Deals", "PENDING", "Seller display name is under review.", now.minusHours(8), null);
        PrivacyModerationItem about = new PrivacyModerationItem("privacy-mod-3", "ABOUT_SELLER",
                "About seller", "PENDING", "About seller text is under review.", now.minusHours(2), null);
        return new PrivacyModerationSummary(List.of(sellerName, about), List.of(), List.of(alias),
                "Public-facing changes may keep the last approved value until moderation completes.");
    }

    public static List<PrivacyChangeTimelineEvent> timeline() {
        return List.of(new PrivacyChangeTimelineEvent("privacy-event-1", "REAL_NAME_HIDDEN",
                "Real name hidden", "Real name is hidden in marketplace views.", "ACTIVE", LocalDateTime.now().minusDays(30)));
    }

    public static List<AdminPrivacyReviewQueueItem> adminReviews() {
        return List.of(new AdminPrivacyReviewQueueItem("privacy-review-1", "user-1000",
                "PUBLIC_DISPLAY", "SELLER_DISPLAY_NAME", "PENDING", "Sharity Digital Deals",
                LocalDateTime.now().minusHours(8), true));
    }
}

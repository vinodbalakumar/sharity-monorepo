package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock profile/privacy API contracts for STORY-033.
 */
public final class ProfilePrivacyDtos {
    private ProfilePrivacyDtos() {
    }

    public record ProfilePrivacySettingsResponse(UserProfileSettings profile,
                                                 BuyerProfileSettings buyerProfile,
                                                 SellerProfilePrivacySettings sellerProfile,
                                                 PrivacySettings privacySettings,
                                                 DigitalProductPrivacySettings digitalPrivacy,
                                                 MessagePrivacySettings messagePrivacy,
                                                 List<VerificationBadgeItem> verificationBadges,
                                                 BlockedUsersSummary blockedUsersSummary,
                                                 DataExportStatus dataExportStatus,
                                                 DeleteAccountEligibility deleteAccountEligibility,
                                                 ProfilePrivacyAvailableActions availableActions) {
    }

    public record UserProfileSettings(String userId, String displayName, String profilePhotoUrl, String bio,
                                      String country, String region, String preferredLanguage, String timeZone,
                                      boolean emailVerified, boolean phoneVerified,
                                      boolean complianceFieldsPrivate, String profileVisibility) {
    }

    public record BuyerProfileSettings(String buyerAlias, String buyerDisplayNamePreference,
                                       boolean profilePhotoVisible, boolean countryRegionVisible,
                                       boolean purchaseHistoryVisible, boolean onlineStatusVisible,
                                       boolean lastActiveVisible) {
    }

    public record SellerProfilePrivacySettings(String sellerAlias, String storeName, String storeLogoUrl,
                                               String storeDescription, String sellerDisplayPreference,
                                               boolean salesCountVisible, boolean ratingDetailsVisible,
                                               String sellerProfileVisibility, boolean sellerVerified) {
    }

    public record PrivacySettings(boolean hideRealName, boolean showBuyerAliasInsteadOfRealName,
                                  boolean showSellerAliasStoreNameInsteadOfRealName, boolean hideProfilePhoto,
                                  boolean hideCountryRegion, boolean hidePurchaseHistory,
                                  boolean hideSellerSalesCount, boolean hideSellerRatingDetails,
                                  String profileVisibility, boolean realNamePublic,
                                  boolean realNamePublicAcknowledged) {
    }

    public record DigitalProductPrivacySettings(boolean aliasOnly, boolean hideEmailPhoneAddress,
                                                boolean requireSafeMessaging, boolean blockExternalContact,
                                                boolean blockNormalChatCodes, boolean secureDeliveryOnly,
                                                String message) {
    }

    public record MessagePrivacySettings(boolean allowOrderRefundDisputeMessagesOnly,
                                         boolean allowPrePurchaseQuestionsLater, boolean hideOnlineStatus,
                                         boolean hideLastActive, int blockedUserCount,
                                         boolean reportUserEnabled) {
    }

    public record VerificationBadgeItem(String badgeType, String label, String status, boolean publicVisible,
                                        boolean sellerSafeOnly, String description) {
    }

    public record BlockedUsersSummary(int count, List<BlockedUserItem> users) {
    }

    public record BlockedUserItem(String blockedUserId, String displayAlias, String role, String blockedReason,
                                  LocalDateTime blockedAt, String relatedEntityReference, boolean canUnblock) {
    }

    public record ReportUserRequest(@NotBlank String reportedUserId, @NotBlank String reasonCode, String note,
                                    String relatedEntityType, String relatedEntityId,
                                    List<String> evidenceAttachmentIds) {
    }

    public record DataExportStatus(boolean requested, String status, LocalDateTime requestedAt,
                                   LocalDateTime readyAt, LocalDateTime expiresAt,
                                   boolean downloadAvailable, String secureDownloadRoute) {
    }

    public record DeleteAccountEligibility(boolean eligible, boolean blocked, List<String> blockingReasons,
                                           boolean activeOrders, boolean activeRefunds, boolean activeDisputes,
                                           boolean pendingPayouts, String legalRetentionNotice,
                                           boolean requiresReauthentication,
                                           boolean typedConfirmationRequired) {
    }

    public record DeleteAccountRequest(@NotBlank String typedConfirmation, String reason,
                                       boolean userAcknowledgedRetentionRules,
                                       boolean userAcknowledgedIrreversibleAction) {
    }

    public record ProfilePrivacyAvailableActions(boolean canSaveProfile, boolean canUploadPhoto,
                                                 boolean canUpdateBuyerAlias, boolean canUpdateSellerAlias,
                                                 boolean canUpdateStoreName, boolean canManageMessagePrivacy,
                                                 boolean canManageBlockedUsers, boolean canDownloadMyData,
                                                 boolean canDeleteAccount, boolean canBack) {
    }

    public record AliasCheckResponse(String aliasType, String alias, boolean available, String status) {
    }

    public record ProfileActionResponse(String status, String message, ProfilePrivacySettingsResponse settings) {
    }

    public record PhotoUploadRequest(String fileName, String assetKey) {
    }

    public record AliasUpdateRequest(@NotBlank String alias) {
    }

    public record StoreNameUpdateRequest(@NotBlank String storeName) {
    }

    public static ProfilePrivacySettingsResponse mockSettings() {
        LocalDateTime now = LocalDateTime.now();
        List<BlockedUserItem> blockedUsers = List.of(
                new BlockedUserItem("blocked-1001", "OrderBuyer-42", "BUYER", "Harassment in order thread",
                        now.minusDays(12), "Order ORD-3001", true),
                new BlockedUserItem("blocked-1002", "SuspiciousStore", "SELLER", "Off-platform payment request",
                        now.minusDays(31), "Dispute DSP-1190", true));
        return new ProfilePrivacySettingsResponse(
                new UserProfileSettings("user-1000", "Vinod", "marketplace/placeholders/avatar.png",
                        "Buyer and seller on Sharity.", "United States", "Arizona", "English",
                        "America/Phoenix", true, true, true, "VISIBLE_AFTER_ORDER"),
                new BuyerProfileSettings("V***D", "BUYER_ALIAS", false, false, false, false, false),
                new SellerProfilePrivacySettings("TechDealsPhoenix", "Tech Deals Phoenix",
                        "marketplace/placeholders/store.png", "Verified digital and electronics deals.",
                        "STORE_NAME", false, false, "PUBLIC_WITHIN_SHARITY", true),
                new PrivacySettings(true, true, true, false, true, true, true, true,
                        "VISIBLE_AFTER_ORDER", false, false),
                new DigitalProductPrivacySettings(true, true, true, true, true, true,
                        "For digital products, Sharity uses alias-only identity and Safe Messaging."),
                new MessagePrivacySettings(true, false, true, true, blockedUsers.size(), true),
                List.of(
                        badge("EMAIL_VERIFIED", "Email verified", "VERIFIED", true, false),
                        badge("PHONE_VERIFIED", "Phone verified", "VERIFIED", false, false),
                        badge("SELLER_VERIFIED", "Seller verified", "VERIFIED", true, false),
                        badge("PAYPAL_CONNECTED", "PayPal connected", "CONNECTED", false, true),
                        badge("IDENTITY_VERIFIED", "Identity verified", "VERIFIED", false, true),
                        badge("GOOD_STANDING", "Good seller standing", "ACTIVE", true, false),
                        badge("NEW_SELLER", "New seller", "ACTIVE", true, false),
                        badge("ACCOUNT_HEALTH", "Account health review", "PRIVATE", false, true)),
                new BlockedUsersSummary(blockedUsers.size(), blockedUsers),
                new DataExportStatus(true, "READY", now.minusDays(2), now.minusDays(1),
                        now.plusDays(5), true, "/settings/profile-privacy/data-export"),
                blockedDeleteEligibility(),
                new ProfilePrivacyAvailableActions(true, true, true, true, true,
                        true, true, true, true, true));
    }

    public static List<BlockedUserItem> mockBlockedUsers() {
        return mockSettings().blockedUsersSummary().users();
    }

    public static List<VerificationBadgeItem> mockBadges() {
        return mockSettings().verificationBadges();
    }

    public static DataExportStatus requestedDataExport() {
        return new DataExportStatus(true, "REQUESTED", LocalDateTime.now(), null, null,
                false, "/settings/profile-privacy/data-export");
    }

    public static DeleteAccountEligibility blockedDeleteEligibility() {
        return new DeleteAccountEligibility(false, true,
                List.of("ACTIVE_ORDER", "ACTIVE_DISPUTE", "PENDING_PAYOUT"),
                true, false, true, true,
                "Some order, refund, dispute, payout, tax, fraud-prevention, legal, and security records may be retained.",
                true, true);
    }

    public static DeleteAccountEligibility eligibleDeleteEligibility() {
        return new DeleteAccountEligibility(true, false, List.of(), false, false, false, false,
                "Some legal and security records may still be retained after account deactivation.", true, true);
    }

    private static VerificationBadgeItem badge(String type, String label, String status,
                                               boolean publicVisible, boolean sellerSafeOnly) {
        return new VerificationBadgeItem(type, label, status, publicVisible, sellerSafeOnly,
                sellerSafeOnly ? "Visible only in account-safe settings." : "User-safe verification status.");
    }
}

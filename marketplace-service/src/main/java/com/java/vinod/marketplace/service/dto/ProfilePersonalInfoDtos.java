package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Profile & Personal Information API contracts for STORY-047.
 */
public final class ProfilePersonalInfoDtos {
    private ProfilePersonalInfoDtos() {
    }

    public record ProfileDashboardResponse(ProfileSummary profileSummary, PersonalInfo personalInfo,
                                           PublicDisplayInfo publicDisplay, ContactInfo contactInfo,
                                           CountryRegionInfo countryRegion, ProfilePreferences preferences,
                                           List<ProfileCompletionChecklistItem> completionChecklist,
                                           ProfilePrivacySummary privacySummary,
                                           List<ProfileChangeTimelineEvent> timeline,
                                           List<AdminProfileReviewQueueItem> adminReviewPlaceholder,
                                           List<String> availableActions) {
    }

    public record ProfileSummary(String userId, String fullNameSafeDisplay, String buyerDisplayName,
                                 String sellerDisplayName, String photoUrl, String roleMode,
                                 String countryName, int completionPercentage, String marketplaceStatus) {
    }

    public record PersonalInfo(String fullName, String displayName, String dateOfBirthSafeDisplay,
                               String genderOptional, String country, String stateRegion, String city) {
    }

    public record PublicDisplayInfo(String buyerAlias, String sellerDisplayName, String publicNamePreview,
                                    String safeMessagingDisplayPreview, boolean realNameHidden,
                                    boolean profilePhotoVisible, String moderationStatus, String userSafeMessage) {
    }

    public record ContactInfo(String email, boolean emailVerified, String phone, boolean phoneVerified,
                              boolean emailChangePending, boolean phoneChangePending) {
    }

    public record CountryRegionInfo(String countryCode, String countryName, String stateRegion, String city,
                                    boolean countryChangeAllowed, boolean countryChangeReviewRequired,
                                    String countryChangeStatus, String marketplaceSummary,
                                    String payoutImpactSummary, String currencyImpactSummary,
                                    String manageCountryRoute) {
    }

    public record ProfilePreferences(String preferredLanguage, String preferredCurrencyDisplay,
                                     String buyerSellerModePreference, String privacyDisplayPreference) {
    }

    public record ProfileCompletionChecklistItem(String itemCode, String label, boolean complete, boolean required,
                                                 String userSafeMessage, String route, String actionLabel) {
    }

    public record ProfilePrivacySummary(String realNameVisibility, String aliasVisibility,
                                        String profilePhotoVisibility, String buyerPublicDisplay,
                                        String sellerPublicDisplay, String safeMessagingDisplay,
                                        String managePrivacyRoute) {
    }

    public record CountryChangePreviewRequest(String requestedCountryCode, String requestedStateRegion,
                                              String requestedCity, String reason) {
    }

    public record CountryChangeImpactPreviewResponse(String currentCountryCode, String requestedCountryCode,
                                                     boolean reviewRequired,
                                                     List<MarketplaceImpactItem> marketplaceImpact,
                                                     SellerPayoutImpact sellerPayoutImpact,
                                                     CurrencyImpact currencyImpact,
                                                     List<String> requiredActionsAfterApproval,
                                                     String existingOrdersUnchangedNotice,
                                                     List<String> userAcknowledgmentsRequired) {
    }

    public record MarketplaceImpactItem(String marketplaceCode, String marketplaceName, String currentStatus,
                                        String projectedStatus, boolean buyerAllowed, boolean sellerAllowed,
                                        String userSafeReason) {
    }

    public record SellerPayoutImpact(boolean payoutProviderAvailable, boolean payoutSetupAffected,
                                     boolean payoutEligibilityAffected, String userSafeMessage) {
    }

    public record CurrencyImpact(String currentDisplayCurrency, String projectedDisplayCurrency,
                                 String checkoutCurrencyImpact, String refundCurrencyReminder,
                                 String userSafeMessage) {
    }

    public record SubmitCountryChangeRequest(String requestedCountryCode, String requestedStateRegion,
                                             String requestedCity, String reason,
                                             boolean userAcknowledgedMarketplaceImpact,
                                             boolean userAcknowledgedPayoutImpact,
                                             boolean userAcknowledgedExistingOrdersUnchanged) {
    }

    public record SubmitCountryChangeResponse(String countryChangeRequestId, String status, boolean reviewRequired,
                                              String timelineRoute, List<String> requiredActionsAfterApproval,
                                              String message) {
    }

    public record ProfileChangeTimelineEvent(String eventId, String eventType, String title,
                                             String userSafeMessage, String status, LocalDateTime timestamp) {
    }

    public record ProfileActionResponse(boolean success, String status, String message, boolean reviewRequired,
                                        boolean verificationRequired, boolean reauthenticationRequired,
                                        LocalDateTime updatedAt) {
    }

    public record AdminProfileReviewQueueItem(String reviewId, String userId, String reviewType, String status,
                                             String requestedChangeSummary, LocalDateTime createdAt,
                                             boolean placeholder) {
    }

    public static ProfileDashboardResponse dashboard() {
        return new ProfileDashboardResponse(summary(), personalInfo(), publicDisplay(), contactInfo(), country(),
                preferences(), completion(), privacy(), timeline(), adminReviews(),
                List.of("EDIT_PROFILE", "CHANGE_DISPLAY_NAME", "MANAGE_ALIAS", "CHANGE_EMAIL", "CHANGE_PHONE",
                        "REQUEST_COUNTRY_CHANGE", "UPLOAD_PROFILE_PHOTO", "MANAGE_PRIVACY",
                        "VIEW_PROFILE_COMPLETION", "VIEW_CHANGE_TIMELINE", "BACK"));
    }

    public static CountryChangeImpactPreviewResponse countryPreview() {
        return new CountryChangeImpactPreviewResponse("US", "IN", true,
                List.of(new MarketplaceImpactItem("DIGITAL", "Digital Marketplace", "ENABLED",
                        "ENABLED_WITH_REVIEW", true, true, "Digital buying remains available after review."),
                        new MarketplaceImpactItem("LOCAL_SERVICES", "Local Services", "ENABLED",
                                "DISABLED", false, false, "This marketplace is not available in the requested country.")),
                new SellerPayoutImpact(false, true, true,
                        "Seller payout setup must be reviewed again after the country change is approved."),
                new CurrencyImpact("USD", "INR", "Checkout currency is backend-controlled.",
                        "Refunds keep the original order currency snapshot.",
                        "Currency display may change after approval."),
                List.of("Accept country-specific policies", "Review payout setup", "Refresh seller eligibility"),
                "Existing orders, refunds, disputes, and payout snapshots keep the original country and marketplace rules.",
                List.of("MARKETPLACE_IMPACT", "PAYOUT_IMPACT", "EXISTING_ORDERS_UNCHANGED"));
    }

    public static SubmitCountryChangeResponse submittedCountryChange() {
        return new SubmitCountryChangeResponse("country-change-1001", "PENDING_REVIEW", true,
                "/profile/country/change/status", List.of("Watch review timeline", "Do not resubmit duplicate requests"),
                "Country change submitted. Review is required before marketplace availability changes.");
    }

    public static ProfileActionResponse action(String status, String message) {
        return new ProfileActionResponse(true, status, message, false, false, false, LocalDateTime.now());
    }

    public static ProfileSummary summary() {
        return new ProfileSummary("user-1000", "Vinod B. (private)", "Phoenix Buyer",
                "Sharity Digital Deals", "marketplace/placeholders/avatar.png", "BOTH",
                "United States", 86, "US marketplaces active");
    }

    public static PersonalInfo personalInfo() {
        return new PersonalInfo("Vinod B.", "Vinod", "Required only for compliance", "Optional later",
                "United States", "Arizona", "Phoenix");
    }

    public static PublicDisplayInfo publicDisplay() {
        return new PublicDisplayInfo("Phoenix Buyer", "Sharity Digital Deals", "Phoenix Buyer",
                "Phoenix Buyer / Sharity Digital Deals", true, true, "SELLER_NAME_PENDING",
                "Buyer and seller public names are separate. Real name is hidden in marketplace views.");
    }

    public static ContactInfo contactInfo() {
        return new ContactInfo("v***@example.com", true, "+1 *** *** 0199", false, false, true);
    }

    public static CountryRegionInfo country() {
        return new CountryRegionInfo("US", "United States", "Arizona", "Phoenix", true, true,
                "NO_ACTIVE_REQUEST", "Digital and local marketplaces enabled.",
                "PayPal payout available.", "USD display selected.", "/profile/country/change");
    }

    public static ProfilePreferences preferences() {
        return new ProfilePreferences("English", "USD", "BOTH", "ALIAS_FIRST");
    }

    public static List<ProfileCompletionChecklistItem> completion() {
        return List.of(
                new ProfileCompletionChecklistItem("EMAIL_VERIFIED", "Email verified", true, true,
                        "Email is verified.", "/profile/email", "View"),
                new ProfileCompletionChecklistItem("PHONE_VERIFIED", "Phone verified", false, true,
                        "Phone verification is required for high-risk actions.", "/profile/phone", "Verify"),
                new ProfileCompletionChecklistItem("ALIAS_SET", "Buyer alias set", true, true,
                        "Buyer alias protects your real name.", "/profile/alias", "Manage"),
                new ProfileCompletionChecklistItem("SELLER_STORE_NAME", "Seller/store name set", true, true,
                        "Store name may require moderation.", "/profile/display-name", "Review"));
    }

    public static ProfilePrivacySummary privacy() {
        return new ProfilePrivacySummary("HIDDEN", "BUYER_ALIAS", "VISIBLE_WHEN_APPROVED",
                "Phoenix Buyer", "Sharity Digital Deals", "CONTEXT_AWARE", "/profile/privacy");
    }

    public static List<ProfileChangeTimelineEvent> timeline() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                new ProfileChangeTimelineEvent("profile-event-1", "EMAIL_VERIFIED", "Email verified",
                        "Email verification completed.", "COMPLETED", now.minusDays(10)),
                new ProfileChangeTimelineEvent("profile-event-2", "SELLER_DISPLAY_MODERATION", "Store name review",
                        "Seller display name is pending moderation.", "PENDING", now.minusDays(1)));
    }

    public static List<AdminProfileReviewQueueItem> adminReviews() {
        return List.of(new AdminProfileReviewQueueItem("profile-review-1", "user-1000",
                "COUNTRY_CHANGE", "PENDING", "US to IN country change request", LocalDateTime.now().minusHours(3), true));
    }
}

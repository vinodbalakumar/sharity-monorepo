package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class SellerVerificationDtos {
    private SellerVerificationDtos() {}
    public record SellerVerificationDashboardResponse(String sellerId, String storeName, String sellerAlias,
                                                       SellerVerificationReadiness overallReadiness,
                                                       SellerPayoutEligibilityStatus payoutEligibility,
                                                       List<SellerVerificationChecklistItem> verificationChecklist,
                                                       List<SellerMarketplaceEligibilityItem> marketplaceEligibility,
                                                       List<SellerAccountLimitItem> accountLimits,
                                                       List<SellerDocumentRequirement> documentRequirements,
                                                       SellerAdminReviewStatus adminReview,
                                                       List<SellerBadgePreviewItem> sellerBadges,
                                                       List<SellerVerificationTimelineEvent> timeline,
                                                       SellerVerificationAvailableActions availableActions) {}
    public record SellerVerificationReadiness(int setupProgressPercent, String verificationLevel,
                                              String payoutEligibilityStatus, int enabledMarketplaceCount,
                                              int requiredActionCount, LocalDateTime lastUpdatedAt) {}
    public record SellerVerificationChecklistItem(String verificationType, String label, String status,
                                                  boolean required, List<String> requiredForMarketplaceCodes,
                                                  List<String> requiredForCategoryCodes, String userSafeMessage,
                                                  String ctaLabel, String route, LocalDateTime lastUpdatedAt) {}
    public record SellerPayoutEligibilityStatus(String status, boolean eligible, String userSafeMessage,
                                                List<SellerPayoutBlockingReason> blockingReasons,
                                                String payoutProviderStatus, String reserveHoldStatus,
                                                String refundDisputeHoldStatus, String countrySupportStatus,
                                                List<String> requiredActions, LocalDateTime updatedAt) {}
    public record SellerPayoutBlockingReason(String reasonCode, String title, String userSafeMessage,
                                             String relatedMarketplaceCode, String relatedCategoryCode,
                                             String requiredAction, String route, String severity,
                                             boolean blocking) {}
    public record SellerMarketplaceEligibilityItem(String marketplaceCode, String marketplaceName,
                                                   String marketplaceIconUrl, String status, boolean sellerEligible,
                                                   String requiredVerification, String requiredPolicy,
                                                   boolean payoutSetupRequired, boolean businessLicenseRequired,
                                                   int maxOrderValue, String categoryRestrictions,
                                                   String adminApprovalStatus, String userSafeReason,
                                                   List<String> availableActions) {}
    public record SellerAccountLimitItem(String limitType, String label, String currentValue, String currency,
                                         String userSafeReason, String relatedMarketplaceCode,
                                         String relatedCategoryCode, String unlockGuidance,
                                         LocalDateTime effectiveDate) {}
    public record SellerDocumentRequirement(String requirementId, String documentType, boolean required,
                                            String reason, String marketplaceCode, String categoryCode,
                                            String uploadStatus, String reviewStatus, LocalDateTime expiryDate,
                                            List<String> availableActions) {}
    public record SellerDocumentUploadResponse(String documentId, String documentType, String uploadStatus,
                                               String reviewStatus, String message) {}
    public record SellerAdminReviewStatus(boolean required, String status, String userSafeReason,
                                          LocalDateTime submittedAt, String estimatedReviewTime,
                                          List<String> requiredActions, boolean resubmissionAllowed,
                                          List<SellerVerificationTimelineEvent> timeline) {}
    public record SellerBadgePreviewItem(String badgeType, String label, String status, boolean publicVisible,
                                         boolean sellerSafeOnly, String description) {}
    public record SellerVerificationTimelineEvent(String eventId, String eventType, String title,
                                                  String userSafeMessage, String marketplaceCode,
                                                  String categoryCode, String status, LocalDateTime timestamp) {}
    public record SellerVerificationAvailableActions(boolean canVerifyEmail, boolean canVerifyPhone,
                                                     boolean canCompleteSellerProfile, boolean canAcceptPolicies,
                                                     boolean canConnectPayPal, boolean canAddTaxBusinessInfo,
                                                     boolean canUploadDocuments, boolean canRequestAdminReview,
                                                     boolean canViewPayoutEligibility,
                                                     boolean canBackToSellerCenter) {}

    public static SellerVerificationDashboardResponse dashboard() {
        List<SellerVerificationTimelineEvent> timeline = List.of(new SellerVerificationTimelineEvent("timeline-1", "PROFILE_CREATED", "Seller profile created", "Store profile started.", "DIGITAL", "ALL", "COMPLETE", LocalDateTime.now()));
        List<SellerPayoutBlockingReason> blockers = List.of(new SellerPayoutBlockingReason("PAYPAL_NOT_CONNECTED", "PayPal not connected", "Connect PayPal to receive payouts.", "DIGITAL", "ALL", "Connect PayPal", "/seller/verification", "CRITICAL", true));
        return new SellerVerificationDashboardResponse("seller-gamecodehub", "Game Code Hub", "GameCodeHub",
                new SellerVerificationReadiness(70, "BASIC_SELLER_PROFILE", "PAYPAL_SETUP_REQUIRED", 1, 3, LocalDateTime.now()),
                new SellerPayoutEligibilityStatus("PAYPAL_SETUP_REQUIRED", false, "Complete PayPal setup and accept seller policies.", blockers, "PAYPAL_NOT_CONNECTED", "10% reserve placeholder", "No active hold", "Supported", List.of("Connect PayPal"), LocalDateTime.now()),
                checklist(), marketplace(), limits(), documents(), new SellerAdminReviewStatus(true, "REQUIRED", "Admin review is required for electronics access.", null, "1-2 business days", List.of("Upload identity document"), true, timeline),
                List.of(new SellerBadgePreviewItem("NEW_SELLER", "New seller", "ACTIVE", true, false, "Public positive badge.")), timeline,
                new SellerVerificationAvailableActions(false, true, false, true, true, false, true, true, true, true));
    }
    public static List<SellerVerificationChecklistItem> checklist() { return List.of(new SellerVerificationChecklistItem("EMAIL_VERIFIED", "Email verified", "COMPLETE", true, List.of("DIGITAL"), List.of("ALL"), "Verified", "Done", "/seller/verification", LocalDateTime.now()), new SellerVerificationChecklistItem("PAYPAL_CONNECTED", "PayPal connected", "REQUIRED", true, List.of("DIGITAL"), List.of("ALL"), "Connect PayPal for payouts", "Connect PayPal", "/seller/verification", LocalDateTime.now())); }
    public static List<SellerMarketplaceEligibilityItem> marketplace() { return List.of(new SellerMarketplaceEligibilityItem("DIGITAL", "Digital Marketplace", "marketplace/placeholders/gift_cards.png", "ENABLED", true, "Basic profile", "Seller Terms", true, false, 100, "None", "NOT_REQUIRED", "You can sell digital products.", List.of("CREATE_LISTING")), new SellerMarketplaceEligibilityItem("ELECTRONICS", "Electronics Marketplace", "marketplace/placeholders/gift_cards.png", "REQUIRES_VERIFICATION", false, "Identity verification", "Seller Terms", true, false, 0, "Restricted", "REQUIRED", "Complete identity verification.", List.of("COMPLETE_REQUIREMENTS"))); }
    public static List<SellerAccountLimitItem> limits() { return List.of(new SellerAccountLimitItem("MAX_ORDER_VALUE", "New seller max order value", "100", "USD", "Limit may increase after order history.", "DIGITAL", "ALL", "Complete verification.", LocalDateTime.now())); }
    public static List<SellerDocumentRequirement> documents() { return List.of(new SellerDocumentRequirement("doc-identity", "IDENTITY_DOCUMENT", true, "Required for electronics.", "ELECTRONICS", "ALL", "NOT_UPLOADED", "NOT_SUBMITTED", null, List.of("UPLOAD_DOCUMENT"))); }
}

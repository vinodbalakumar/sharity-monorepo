package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Mock Reviews & Ratings API contracts for STORY-051.
 */
public final class ReviewsRatingsDtos {
    private ReviewsRatingsDtos() {
    }

    public record ReviewEligibilityResponse(boolean eligible, String eligibilityStatus, String reviewTargetType,
                                            String parentOrderId, String sellerOrderId, String listingId,
                                            String productId, String sellerStoreId, boolean alreadyReviewed,
                                            boolean editAllowed, boolean visibilityDelayed,
                                            String refundDisputeContext, String userSafeMessage,
                                            List<String> availableActions) {
    }

    public record ReviewFormConfigResponse(String reviewTargetType, List<RatingFieldConfig> requiredRatingFields,
                                           List<RatingFieldConfig> optionalRatingFields, boolean textReviewRequired,
                                           boolean textReviewAllowed, boolean mediaUploadAllowed,
                                           ReviewIdentityPreview privacyIdentityPreview,
                                           List<String> safetyRules, List<String> submitRules) {
    }

    public record ReviewIdentityPreview(String displayName, String avatarUrl, boolean anonymousLater,
                                        String privacyMode, String managePrivacyRoute, String userSafeMessage) {
    }

    public record RatingFieldConfig(String fieldCode, String label, boolean required, String scaleType,
                                    int minValue, int maxValue, List<String> visibleForProductTypes,
                                    String userSafeHelpText) {
    }

    public record SubmitReviewRequest(String reviewTargetType, String parentOrderId, String sellerOrderId,
                                      String listingId, String productId, String sellerStoreId,
                                      List<ReviewRatingValue> ratings, String textReview, Boolean wouldBuyAgain,
                                      boolean buyerAcknowledgedReviewRules) {
    }

    public record ReviewRatingValue(String fieldCode, int value) {
    }

    public record ReviewResponse(String reviewId, String status, String moderationStatus, String visibilityStatus,
                                 String message, String route, LocalDateTime updatedAt) {
    }

    public record ReviewDetailResponse(String reviewId, String reviewTargetType, ReviewTargetSummary targetSummary,
                                       ReviewIdentityPreview buyerIdentity, List<ReviewRatingValue> ratings,
                                       String textReview, SellerReviewResponseItem sellerResponse,
                                       boolean verifiedPurchase, String visibilityStatus, String moderationStatus,
                                       LocalDateTime createdAt, LocalDateTime updatedAt,
                                       List<String> availableActions) {
    }

    public record ReviewTargetSummary(String parentOrderReference, String sellerOrderReference,
                                      String sellerStoreId, String storeName, String productId, String listingId,
                                      String listingTitle, String listingImageUrl, String productType,
                                      String orderStatus, String digitalDeliveryStatus,
                                      String refundDisputeStatus) {
    }

    public record PublicReviewItem(String reviewId, String buyerDisplayName, String buyerAvatarUrl,
                                   boolean verifiedPurchase, List<ReviewRatingValue> ratings, int overallRating,
                                   String textReview, SellerReviewResponseItem sellerResponse,
                                   LocalDateTime reviewDate, ReviewTargetSummary targetSummary,
                                   int helpfulCountLater, boolean reportAvailable) {
    }

    public record SellerReviewResponseItem(String responseId, String reviewId, String sellerStoreId,
                                           String storeDisplayName, String responseText, String moderationStatus,
                                           LocalDateTime createdAt, LocalDateTime updatedAt,
                                           List<String> availableActions) {
    }

    public record RatingSummaryResponse(String targetType, String targetId, double averageOverallRating,
                                        int reviewCount, int verifiedReviewCount,
                                        List<RatingBreakdownItem> ratingBreakdown,
                                        List<RatingCategorySummary> categorySummaries,
                                        List<PublicReviewItem> latestSafeReviews) {
    }

    public record RatingBreakdownItem(int ratingValue, int count, double percentage) {
    }

    public record RatingCategorySummary(String fieldCode, String label, double averageValue, int count) {
    }

    public record ReviewDraftValidationRequest(String textReview, String sellerResponseText,
                                               String reviewTargetType, List<String> attachmentIdsLater) {
    }

    public record ReviewDraftValidationResponse(boolean allowed, boolean blocked, List<String> warnings,
                                                List<String> blockedReasonCodes, String userSafeMessage,
                                                String suggestedFix) {
    }

    public record ReportReviewRequest(String reasonCode, String message, boolean userAcknowledgedReportRules) {
    }

    public record AdminReviewModerationQueueItem(String reportId, String reviewId, String reportType,
                                                 String severity, String status, LocalDateTime createdAt,
                                                 boolean placeholder) {
    }

    public static ReviewEligibilityResponse eligibility() {
        return new ReviewEligibilityResponse(true, "ELIGIBLE", "DIGITAL_DELIVERY", "order-1001",
                "seller-order-1001", "listing-1001", "product-1001", "store-1000",
                false, false, false, null,
                "You can review this digital order because secure access is complete.",
                List.of("RATE_ORDER", "WRITE_REVIEW", "BACK"));
    }

    public static ReviewFormConfigResponse formConfig() {
        return new ReviewFormConfigResponse("DIGITAL_DELIVERY",
                List.of(field("OVERALL", "Overall rating", true)),
                List.of(field("PRODUCT_ACCURACY", "Product accuracy", false),
                        field("DIGITAL_DELIVERY_QUALITY", "Digital delivery quality", false),
                        field("SELLER_COMMUNICATION", "Seller communication", false),
                        field("SELLER_RESPONSE_SPEED", "Seller response speed", false)),
                false, true, false, identity(),
                List.of("No digital codes", "No phone or email", "No payment links", "No harassment"),
                List.of("Verified buyer only", "Backend validates visibility and moderation"));
    }

    public static ReviewResponse submit(SubmitReviewRequest request) {
        ReviewDraftValidationResponse validation = validate(request == null ? null : request.textReview(), null);
        if (validation.blocked()) {
            return new ReviewResponse(null, "BLOCKED", "BLOCKED", "NOT_PUBLISHED",
                    validation.userSafeMessage(), null, LocalDateTime.now());
        }
        return new ReviewResponse("review-1001", "PUBLISHED", "APPROVED", "PUBLIC",
                "Review submitted.", "/reviews/review-1001", LocalDateTime.now());
    }

    public static ReviewDetailResponse detail(String reviewId) {
        return new ReviewDetailResponse(reviewId, "DIGITAL_DELIVERY", target(), identity(),
                List.of(new ReviewRatingValue("OVERALL", 5), new ReviewRatingValue("DIGITAL_DELIVERY_QUALITY", 5)),
                "Secure delivery was clear and fast.", sellerResponse(reviewId), true,
                "PUBLIC", "APPROVED", LocalDateTime.now().minusDays(4), LocalDateTime.now().minusDays(3),
                List.of("EDIT_REVIEW", "WITHDRAW_REVIEW", "REPORT_REVIEW"));
    }

    public static List<PublicReviewItem> reviews() {
        return List.of(new PublicReviewItem("review-1001", "Phoenix Buyer",
                "marketplace/placeholders/avatar.png", true,
                List.of(new ReviewRatingValue("OVERALL", 5)), 5,
                "Secure delivery was clear and fast.", sellerResponse("review-1001"),
                LocalDateTime.now().minusDays(4), target(), 0, true));
    }

    public static RatingSummaryResponse summary(String targetType, String targetId) {
        return new RatingSummaryResponse(targetType, targetId, 4.8, 24, 24,
                List.of(new RatingBreakdownItem(5, 20, 83.3), new RatingBreakdownItem(4, 4, 16.7)),
                List.of(new RatingCategorySummary("DIGITAL_DELIVERY_QUALITY", "Digital delivery", 4.9, 24),
                        new RatingCategorySummary("SELLER_COMMUNICATION", "Seller communication", 4.7, 24)),
                reviews());
    }

    public static ReviewDraftValidationResponse validate(String reviewText, String sellerResponseText) {
        String value = ((reviewText == null ? "" : reviewText) + " " + (sellerResponseText == null ? "" : sellerResponseText)).toLowerCase();
        if (value.matches(".*\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b.*")) {
            return blocked("REVIEW_DIGITAL_CODE_BLOCKED", "Digital codes cannot appear in reviews.");
        }
        if (value.contains("@") || value.matches(".*\\b\\d{3}[- .]?\\d{3}[- .]?\\d{4}\\b.*")) {
            return blocked("REVIEW_CONTACT_INFO_BLOCKED", "Contact information cannot appear in reviews.");
        }
        return new ReviewDraftValidationResponse(true, false, List.of(), List.of(),
                "Review draft is allowed.", null);
    }

    public static ReviewResponse response(String message) {
        return new ReviewResponse("review-1001", "OK", "APPROVED", "PUBLIC", message,
                "/reviews/review-1001", LocalDateTime.now());
    }

    public static List<AdminReviewModerationQueueItem> adminQueue() {
        return List.of(new AdminReviewModerationQueueItem("review-report-1", "review-1001",
                "CONTACT_INFO", "MEDIUM", "PENDING", LocalDateTime.now().minusHours(6), true));
    }

    private static ReviewIdentityPreview identity() {
        return new ReviewIdentityPreview("Phoenix Buyer", "marketplace/placeholders/avatar.png",
                true, "BUYER_ALIAS", "/profile/privacy",
                "Your review appears with your privacy-safe buyer alias.");
    }

    private static RatingFieldConfig field(String code, String label, boolean required) {
        return new RatingFieldConfig(code, label, required, "STARS", 1, 5,
                List.of("DIGITAL", "PHYSICAL_LATER"), "Backend controls whether this field is required.");
    }

    private static ReviewTargetSummary target() {
        return new ReviewTargetSummary("SH-1001", "SO-1001", "store-1000",
                "Sharity Digital Deals", "product-1001", "listing-1001",
                "Secure Digital Game Card", "marketplace/placeholders/digital-card.png",
                "DIGITAL", "COMPLETED", "ACCESS_COMPLETED", null);
    }

    private static SellerReviewResponseItem sellerResponse(String reviewId) {
        return new SellerReviewResponseItem("response-1001", reviewId, "store-1000",
                "Sharity Digital Deals", "Thanks for buying through Sharity secure delivery.",
                "APPROVED", LocalDateTime.now().minusDays(3), LocalDateTime.now().minusDays(3),
                List.of("REPORT_SELLER_RESPONSE"));
    }

    private static ReviewDraftValidationResponse blocked(String code, String message) {
        return new ReviewDraftValidationResponse(false, true, List.of(), List.of(code), message,
                "Remove unsafe content before submitting.");
    }
}

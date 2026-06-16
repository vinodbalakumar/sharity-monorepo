package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Carries the marketplace browse, listing, order, and dispute payloads.
 *
 * <p>These DTOs define the public commerce home and protected seller/buyer
 * flows without exposing repository entities or internal workflow state.</p>
 */
public final class MarketplaceDtos {
    private MarketplaceDtos() {
    }

    public record ListingResponse(String publicId, String title, String description, String productType,
                                  String deliveryType, String fulfillmentScope, String currencyCode, BigDecimal priceAmount,
                                  BigDecimal originalPriceAmount, String imageUrl, String sellerDisplayName,
                                  boolean verifiedSeller, String categoryCode,
                                  String verticalCode, String providerCountryCode, String listingStatus,
                                  String conditionLabel, Integer stockQuantity, String sourceType, String sourceName,
                                  String sourceUrl, String licenseNote, boolean demoSeed,
                                  List<ListingReviewResponse> publicReviews,
                                  LocalDateTime createdAt,
                                  String displayCurrencyCode, BigDecimal displayPriceAmount,
                                  BigDecimal displayOriginalPriceAmount) {
    }

    /**
     * Summarizes a public listing review for the product detail trust panel.
     *
     * <p>The service keeps the review data safe and read-only so anonymous
     * shoppers can see seller trust cues without exposing internal moderation
     * or payment state.</p>
     */
    public record ListingReviewResponse(String reviewId, String listingPublicId, String reviewerDisplayName,
                                        String title, String body, double rating, boolean verifiedPurchase,
                                        LocalDateTime createdAt) {
    }

    /**
     * Summarizes a marketplace listing for admin moderation and review.
     *
     * <p>This response keeps the seller, vertical, and listing state visible
     * to admin reviewers without exposing repository entities or payment data.</p>
     */
    public record AdminListingResponse(String publicId, String title, String providerAccountPublicId,
                                       String createdByUserPublicId, String sellerDisplayName,
                                       String categoryCode, String verticalCode, String listingStatus,
                                       boolean verifiedSeller, boolean featured, boolean activeDispute,
                                       LocalDateTime createdAt, LocalDateTime updatedAt) {
    }

    public record CategoryResponse(Long id, String code, String name, String slug, String verticalCode,
                                   String countryCode, String iconRef, String imageUrl, boolean active) {
    }

    public record CategoryHighlightResponse(String categoryCode, String categoryName, String slug,
                                            String verticalCode, String iconRef, String imageUrl,
                                            long soldCount, long activeCount, int maxDiscountPercent) {
    }

    public record VerticalResponse(String moduleCode, String moduleName, String description, String status,
                                   int displayOrder, String iconKey, String moduleType, String frontendRoute,
                                   String apiAudience, String imageUrl, String imageKeys, boolean customerAccessEnabled, boolean providerAccessEnabled,
                                   boolean requiresProviderApproval, boolean availableToCustomer,
                                   boolean providerAccessActive) {
        public VerticalResponse(String moduleCode, String moduleName, String description, String status,
                                int displayOrder, String iconKey, String moduleType, String frontendRoute,
                                String apiAudience, String imageUrl, boolean customerAccessEnabled,
                                boolean providerAccessEnabled, boolean requiresProviderApproval,
                                boolean availableToCustomer, boolean providerAccessActive) {
            this(moduleCode, moduleName, description, status, displayOrder, iconKey, moduleType, frontendRoute,
                    apiAudience, imageUrl, null, customerAccessEnabled, providerAccessEnabled,
                    requiresProviderApproval, availableToCustomer, providerAccessActive);
        }
    }

    public record ListingStatusResponse(String statusCode, String displayLabel, boolean customerVisible,
                                        int sortOrder, boolean active) {
    }

    public record SubcategoryResponse(Long id, String code, String categoryCode, String name, String slug,
                                      String iconRef, String countryCode, boolean active) {
    }

    public record FeatureResponse(String featureCode, String displayLabel, String description,
                                  boolean active, int sortOrder) {
    }

    public record ListingConditionResponse(String conditionCode, String displayLabel, String description,
                                            boolean active, int sortOrder) {
    }

    public record ProductTypeResponse(String productTypeCode, String displayLabel, String description,
                                      boolean active, int sortOrder) {
    }

    public record DeliveryTypeResponse(String deliveryTypeCode, String displayLabel, String description,
                                       boolean digitalDelivery, boolean active, int sortOrder) {
    }

    public record FeeTypeResponse(String feeTypeCode, String displayLabel, String description,
                                  String feeBasis, BigDecimal ratePercentage,
                                  boolean active, int sortOrder) {
    }

    public record HomeResponse(List<VerticalResponse> verticals, List<CategoryResponse> categories,
                               List<ListingResponse> featuredListings,
                               List<CategoryHighlightResponse> topCategories) {
    }

    public record ListingRequest(@NotBlank String title, String description, String categoryCode,
                                 @NotBlank String productType, @NotBlank String deliveryType,
                                 String fulfillmentScope,
                                 @NotBlank String currencyCode, @NotNull @Positive BigDecimal priceAmount,
                                 @NotBlank String providerAccountPublicId,
                                 String providerCountryCode,
                                 String imageUrl,
                                 String listingStatus,
                                 String verticalCode,
                                 Integer stockQuantity) {
    }

    public record OrderRequest(@NotBlank String listingPublicId) {
    }

    public record OrderResponse(String publicId, String listingPublicId, String orderStatus,
                                String paymentStatus, String fulfillmentStatus, String payoutStatus,
                                BigDecimal customerTotalAmount, String currencyCode, LocalDateTime createdAt) {
    }

    public record DeliveryRequest(@NotBlank String deliveryMethod, String deliveryReference, String providerNotes) {
    }

    public record ProblemRequest(@NotBlank String disputeReasonCode, String description) {
    }

    /**
     * Carries the admin moderation decision for a listing.
     *
     * <p>The marketplace admin surface can use this to approve, reject, or
     * deactivate a listing without changing the buyer or seller flow rules.</p>
     */
    public record AdminListingDecisionRequest(@NotBlank String listingStatus, String moderationNote) {
    }

    /**
     * Summarizes a marketplace dispute for admin review.
     *
     * <p>This keeps the order and resolution state visible for moderation
     * while avoiding direct exposure of payment internals.</p>
     */
    public record AdminDisputeResponse(String publicId, String orderPublicId, String listingPublicId,
                                       String openedByUserPublicId, String disputeReasonCode,
                                       String disputeStatus, String resolution, String resolvedByUserPublicId,
                                       LocalDateTime openedAt, LocalDateTime resolvedAt) {
    }

    /**
     * Carries an admin dispute decision for moderation workflows.
     *
     * <p>The resolution text is intentionally free-form so support or finance
     * reviewers can label a dispute outcome without changing payment rules.</p>
     */
    public record AdminDisputeDecisionRequest(@NotBlank String resolution, String moderationNote) {
    }

    public record MessageResponse(String message) {
    }

    public static ListingResponse demoListing() {
        return new ListingResponse(UUID.randomUUID().toString(), "Demo Marketplace Listing",
            "Local V3 marketplace listing shell", "DIGITAL", "MANUAL", "NATIONAL", "USD",
                BigDecimal.valueOf(25), BigDecimal.valueOf(30), "marketplace/placeholders/gift_cards.png",
                "Sharity Demo Seller", true, "MARKETPLACE", "MARKETPLACE", "USA", "ACTIVE", "DIGITAL",
                1, "PRESENTATION", "Sharity Demo", null,
                "Synthetic presentation content for browse density", true, List.of(), LocalDateTime.now(),
                "USD", BigDecimal.valueOf(25), BigDecimal.valueOf(30));
    }

    public static List<ListingResponse> demoListings() {
        return List.of(demoListing());
    }
}

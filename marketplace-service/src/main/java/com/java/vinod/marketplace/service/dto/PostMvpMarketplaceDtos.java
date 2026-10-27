package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Carries approved post-MVP vertical payloads that are backed by the existing
 * marketplace listing, order, and dispute architecture.
 */
public final class PostMvpMarketplaceDtos {
    private PostMvpMarketplaceDtos() {
    }

    public record JewelleryHomeResponse(List<JewelleryCategory> categories,
                                        List<JewelleryItemCard> featuredItems,
                                        List<String> policyDisclaimers,
                                        boolean sellerEligibilityBackendControlled,
                                        boolean authenticityClaimsBackendControlled) {
    }

    public record JewelleryCategory(String code, String name, String slug, String countryCode,
                                    boolean storeDefined, boolean purityClaimsAllowed,
                                    String policyDisclaimer) {
    }

    public record JewelleryItemCard(String listingId, String title, String categoryCode,
                                    String displayMaterial, String colorFinish, String condition,
                                    BigDecimal price, String currency, String imageUrl,
                                    String sellerDisplayName, boolean verifiedSeller,
                                    boolean shippingAvailable, boolean couponAvailable) {
    }

    public record JewelleryItemDetail(String listingId, String title, String description,
                                      JewelleryCategory category, String style, String displayMaterial,
                                      String colorFinish, String occasion, String size,
                                      String weightDisplayPlaceholder, String stoneTypePlaceholder,
                                      String condition, BigDecimal price, String currency,
                                      Integer quantity, List<String> images,
                                      boolean shippingAvailable, String returnPolicy,
                                      String sellerDisplayName, boolean verifiedSeller,
                                      List<String> policyDisclaimers) {
    }

    public record SellerJewelleryListing(@NotBlank String title,
                                         String description,
                                         @NotBlank String category,
                                         String style,
                                         @NotBlank String displayMaterial,
                                         String colorFinish,
                                         String occasion,
                                         String size,
                                         String weightDisplayPlaceholder,
                                         String stoneTypePlaceholder,
                                         String condition,
                                         @NotNull @Positive BigDecimal price,
                                         @NotBlank String currency,
                                         @NotNull @Positive Integer quantity,
                                         List<String> images,
                                         boolean shippingAvailable,
                                         String returnPolicy,
                                         @NotBlank String providerAccountPublicId,
                                         String providerCountryCode,
                                         @AssertTrue boolean authenticityDisclaimerAcknowledged,
                                         @AssertTrue boolean marketplacePolicyAcknowledged) {
    }

    public record JewelleryIssueRequest(@NotBlank String reasonCode, String description) {
    }

    public record AdminJewelleryConfigResponse(boolean marketplaceEnabled,
                                              List<JewelleryCategory> categories,
                                              List<String> allowedIssueReasons,
                                              List<String> policyDisclaimers,
                                              boolean purityClaimsRequirePolicyApproval) {
    }

    public record JewelleryActionResponse(String status, String message, String listingId, String orderId) {
    }

    public record GiftCardHomeResponse(List<GiftCardBrand> brands,
                                       List<JewelleryItemCard> featuredItems,
                                       GiftCardRevealPolicy revealPolicy,
                                       List<String> riskDisclaimers) {
    }

    public record GiftCardBrand(String code, String name, String countryCode,
                                boolean active, boolean partialBalanceAllowed,
                                boolean balanceVerificationEnabled) {
    }

    public record GiftCardItemDetail(String listingId, String brand, String cardType,
                                     BigDecimal faceValue, BigDecimal sellingPrice,
                                     String currency, String regionCountry,
                                     LocalDate expiryDate, boolean partialBalance,
                                     String balanceVerificationStatus,
                                     GiftCardRevealPolicy revealPolicy,
                                     String sellerDisplayName, boolean verifiedSeller,
                                     List<String> images) {
    }

    public record SellerGiftCardListing(@NotBlank String brand,
                                        @NotBlank String cardType,
                                        @NotNull @Positive BigDecimal faceValue,
                                        @NotNull @Positive BigDecimal sellingPrice,
                                        @NotBlank String currency,
                                        String regionCountry,
                                        LocalDate expiryDate,
                                        boolean partialBalance,
                                        String balanceVerificationPlaceholder,
                                        @NotBlank String deliveryType,
                                        List<String> images,
                                        @NotBlank String providerAccountPublicId,
                                        String providerCountryCode,
                                        @AssertTrue boolean sellerAcknowledgement,
                                        @AssertTrue boolean noChatCodeSharingAcknowledgement,
                                        @AssertTrue boolean refundRevealPolicyAcknowledgement) {
    }

    public record GiftCardRevealPolicy(boolean secureRevealRequired,
                                       boolean buyerAcknowledgementRequired,
                                       boolean codeHiddenBeforeEligibleReveal,
                                       String refundRuleSummary) {
    }

    public record GiftCardIssueRequest(@NotBlank String reasonCode, String description) {
    }

    public record AdminGiftCardConfig(boolean marketplaceEnabled,
                                      List<GiftCardBrand> brands,
                                      GiftCardRevealPolicy revealPolicy,
                                      List<String> issueReasons,
                                      boolean rawCodeAdminAccessEnabled) {
    }
}

package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class MarketplaceConfigDtos {
    private MarketplaceConfigDtos() {
    }

    public record CountryMarketplaceConfigSummary(String countryCode, String countryName, boolean registrationAllowed,
                                                  boolean countryChangeAllowed, boolean countryChangeReviewRequired,
                                                  String defaultCurrency, String defaultMarketplaceCode,
                                                  int enabledMarketplaceCount, int disabledMarketplaceCount,
                                                  int comingSoonMarketplaceCount, int version, String status,
                                                  LocalDateTime updatedAt) {}
    public record MarketplaceConfigDetail(String configId, String countryCode, String marketplaceCode,
                                          String marketplaceName, String status, String visibility, int displayOrder,
                                          String phase, MarketplaceAvailabilityConfig buyerAvailability,
                                          MarketplaceAvailabilityConfig sellerAvailability,
                                          MarketplaceFeatureFlags featureFlags,
                                          SellerEligibilityConfig sellerEligibility,
                                          BuyerEligibilityConfig buyerEligibility,
                                          List<UserSafeReasonMapping> userSafeReasonMapping,
                                          LocalDateTime effectiveStart, int version, boolean draft,
                                          boolean published, String updatedBy, String changeReason,
                                          LocalDateTime updatedAt) {}
    public record MarketplaceAvailabilityConfig(boolean buyerAllowed, boolean sellerAllowed, String buyerStatus,
                                               String sellerStatus, String buyerUserSafeMessage,
                                               String sellerUserSafeMessage) {}
    public record MarketplaceFeatureFlags(boolean enableBuying, boolean enableSelling, boolean enableCart,
                                         boolean enableCheckout, boolean enableCoupons,
                                         boolean enableSharityCreditRewards, boolean enableRefunds,
                                         boolean enableDisputes, boolean enableSellerAcceptanceBeforeCapture,
                                         boolean enableDigitalDelivery, boolean enablePhysicalShippingLater,
                                         boolean enablePrePurchaseMessagingLater) {}
    public record SellerEligibilityConfig(boolean sellerOnboardingRequired, boolean sellerVerificationRequired,
                                          boolean payoutSetupRequired, boolean policyAcceptanceRequired,
                                          boolean categoryApprovalRequired, boolean businessLicenseRequired,
                                          int maxOrderValueForNewSellers, boolean reserveHoldRuleRequired,
                                          boolean adminApprovalRequired, String userSafeMessage) {}
    public record BuyerEligibilityConfig(boolean countryEligibilityRequired, boolean emailVerifiedRequired,
                                         boolean phoneVerifiedRequired, int minAccountAgeDays,
                                         boolean paymentMethodRequired, int maxFreeGiveawayClaims,
                                         int purchaseLimit, boolean ageComplianceRequirementLater,
                                         String userSafeMessage) {}
    public record UserSafeReasonMapping(String internalReasonCode, String userSafeMessage, String requiredAction,
                                        String route, String severity, boolean visibleToBuyer,
                                        boolean visibleToSeller) {}
    public record MarketplaceDisplayOrderItem(String marketplaceCode, int displayOrder, boolean visible,
                                              boolean showComingSoon) {}
    public record MarketplaceAvailabilitySimulationRequest(String countryCode, String role, String marketplaceCode,
                                                           boolean emailVerified, boolean phoneVerified,
                                                           boolean sellerOnboardingComplete,
                                                           boolean sellerVerificationComplete,
                                                           boolean payoutSetupComplete, boolean policyAccepted,
                                                           boolean categoryApprovalComplete, int accountAgeDays,
                                                           boolean paymentMethodAvailable,
                                                           String productCategoryCode, int freeGiveawayClaimCount,
                                                           java.math.BigDecimal orderValue,
                                                           LocalDateTime testDateTime) {}
    public record MarketplaceAvailabilitySimulationResponse(boolean allowed, boolean buyerAvailable,
                                                            boolean sellerAvailable,
                                                            List<String> missingRequirements,
                                                            String userSafeMessage, List<String> internalRuleIds,
                                                            List<String> featureFlagsEnabled,
                                                            String marketplaceDisplayResult,
                                                            int effectiveRuleVersion,
                                                            String suggestedRequiredAction,
                                                            List<String> warnings) {}
    public record MarketplaceConfigAuditLogItem(String auditId, String actorId, String actorName, String action,
                                                String entityType, String countryCode, String marketplaceCode,
                                                String beforeSummary, String afterSummary, String reason,
                                                int version, LocalDateTime createdAt) {}
    public record UserMarketplaceAvailabilityResponse(String userCountry,
                                                      List<UserMarketplaceAvailabilityItem> buyerMarketplaces,
                                                      List<UserMarketplaceAvailabilityItem> sellerMarketplaces,
                                                      String defaultMarketplaceCode,
                                                      List<MarketplaceDisplayOrderItem> displayOrder,
                                                      List<String> userSafeMessages,
                                                      List<String> availableActions) {}
    public record UserMarketplaceAvailabilityItem(String marketplaceCode, String marketplaceName,
                                                  String marketplaceIconUrl, boolean buyerAvailable,
                                                  boolean sellerAvailable, boolean visible, String status,
                                                  boolean userEnabled, boolean comingSoon,
                                                  String userSafeMessage, String requiredAction,
                                                  String route) {}

    public static List<CountryMarketplaceConfigSummary> countries() {
        return List.of(new CountryMarketplaceConfigSummary("USA", "United States", true, true, false, "USD", "DIGITAL", 2, 1, 2, 12, "PUBLISHED", LocalDateTime.now()),
                new CountryMarketplaceConfigSummary("IND", "India", true, true, true, "INR", "DIGITAL", 1, 2, 1, 5, "DRAFT", LocalDateTime.now()));
    }

    public static List<MarketplaceConfigDetail> configs() {
        return List.of(config("config-usa-digital", "USA", "DIGITAL", "Digital Marketplace", "ENABLED", true, true, 1),
                config("config-usa-electronics", "USA", "ELECTRONICS", "Electronics Marketplace", "ENABLED", true, true, 2),
                config("config-ind-jewellery", "IND", "IMITATION_JEWELLERY", "Imitation Jewellery", "COMING_SOON", true, false, 2));
    }

    public static MarketplaceAvailabilitySimulationResponse simulation() {
        return new MarketplaceAvailabilitySimulationResponse(false, true, false, List.of("PayPal setup", "Seller policy acceptance"),
                "Complete seller setup to start selling digital products.", List.of("SELLER_PAYOUT_SETUP_REQUIRED"),
                List.of("enableBuying", "enableCart", "enableCheckout", "enableDigitalDelivery"),
                "Visible with required actions", 12, "Connect PayPal and accept seller policies",
                List.of("Existing orders keep original snapshots."));
    }

    public static List<MarketplaceConfigAuditLogItem> audit() {
        return List.of(new MarketplaceConfigAuditLogItem("audit-market-1", "admin-1", "Country Ops Admin",
                "Marketplace enabled", "MARKETPLACE_CONFIG", "USA", "ELECTRONICS", "COMING_SOON",
                "ENABLED", "MVP expansion", 12, LocalDateTime.now()));
    }

    private static MarketplaceConfigDetail config(String id, String country, String code, String name, String status,
                                                  boolean buyerAllowed, boolean sellerAllowed, int order) {
        MarketplaceAvailabilityConfig buyer = new MarketplaceAvailabilityConfig(buyerAllowed, false,
                buyerAllowed ? "ALLOWED" : "BLOCKED", "N/A", buyerAllowed ? "Marketplace enabled" : "Not available in your country", "");
        MarketplaceAvailabilityConfig seller = new MarketplaceAvailabilityConfig(false, sellerAllowed, "N/A",
                sellerAllowed ? "ALLOWED" : "REQUIRES_SETUP", "", sellerAllowed ? "Seller access enabled" : "Complete seller setup");
        MarketplaceFeatureFlags flags = new MarketplaceFeatureFlags(buyerAllowed, sellerAllowed, buyerAllowed, buyerAllowed,
                buyerAllowed, buyerAllowed, buyerAllowed, buyerAllowed, true, "DIGITAL".equals(code), !"DIGITAL".equals(code), false);
        return new MarketplaceConfigDetail(id, country, code, name, status, "VISIBLE", order, "MVP", buyer, seller,
                flags, new SellerEligibilityConfig(true, !"DIGITAL".equals(code), true, true, false, false, 100, false, false, "Complete seller setup."),
                new BuyerEligibilityConfig(true, true, false, 0, false, 1, 500, false, "Verify your account."),
                List.of(new UserSafeReasonMapping("SELLER_PAYOUT_SETUP_REQUIRED", "Connect PayPal to start selling.", "Connect PayPal", "/seller/verification", "WARNING", false, true)),
                LocalDateTime.now(), 12, !"ENABLED".equals(status), "ENABLED".equals(status), "Country Ops Admin", "Country readiness", LocalDateTime.now());
    }
}

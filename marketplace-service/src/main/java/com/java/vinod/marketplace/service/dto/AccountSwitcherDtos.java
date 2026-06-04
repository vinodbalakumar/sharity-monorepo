package com.java.vinod.marketplace.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * Mock Account Switcher contracts for STORY-034.
 */
public final class AccountSwitcherDtos {
    private AccountSwitcherDtos() {
    }

    public record AccountSwitcherResponse(String currentMode, String currentMarketplace,
                                          BuyerIdentitySummary buyerIdentity,
                                          SellerIdentitySummary sellerIdentity,
                                          List<AccountModeAvailability> availableModes,
                                          List<MarketplaceModuleAvailability> marketplaceModules,
                                          List<MarketplaceModuleAvailability> marketplacePreferences,
                                          SellerModeEligibility sellerModeEligibility,
                                          String countryAvailability,
                                          AccountSwitcherAvailableActions availableActions) {
    }

    public record BuyerIdentitySummary(String userId, String buyerAlias, String displayName, String avatarUrl,
                                       String country, String buyerStatus, boolean privacyModeEnabled) {
    }

    public record SellerIdentitySummary(String sellerId, String sellerAlias, String storeName, String storeLogoUrl,
                                        String sellerStatus, String onboardingStatus, String verificationStatus,
                                        String payoutSetupStatus, String activeSellerMarketplace) {
    }

    public record AccountModeAvailability(String mode, boolean available, boolean active, String status,
                                          String reasonCode, String reasonMessage, String requiredAction,
                                          String route) {
    }

    public record MarketplaceModuleAvailability(String marketplaceCode, String marketplaceName, String iconUrl,
                                                boolean buyerAvailable, boolean sellerAvailable,
                                                boolean buyerEnabledByUser, boolean sellerEnabledByUser,
                                                boolean countryAllowed, boolean adminAllowed, String status,
                                                String reasonCode, String reasonMessage, String requiredAction,
                                                boolean comingSoon) {
    }

    public record MarketplacePreferenceUpdateRequest(@NotBlank String marketplaceCode,
                                                     boolean buyerEnabled,
                                                     boolean sellerEnabled) {
    }

    public record SwitchAccountModeRequest(@NotBlank String targetMode, String targetMarketplace) {
    }

    public record SwitchAccountModeResponse(String currentMode, String currentMarketplace, boolean switched,
                                            String message, boolean fallbackApplied, String fallbackReason) {
    }

    public record SellerModeEligibility(boolean eligible, boolean sellerProfileComplete,
                                        boolean sellerAliasConfigured, boolean storeNameConfigured,
                                        boolean countryEligible, boolean policyAccepted,
                                        boolean verificationRequired, boolean verificationComplete,
                                        boolean payoutSetupRequired, boolean payoutSetupComplete,
                                        String blockedReason, List<String> requiredActions) {
    }

    public record AccountSwitcherAvailableActions(boolean canSwitchToBuyer, boolean canSwitchToSeller,
                                                  boolean canStartSellerOnboarding,
                                                  boolean canCompleteVerification, boolean canConnectPayPal,
                                                  boolean canManageMarketplacePreferences,
                                                  boolean canGoToSellerCenter,
                                                  boolean canGoToMarketplaceHome, boolean canBack) {
    }

    public static AccountSwitcherResponse mock(String mode, String marketplace) {
        String currentMode = mode == null || mode.isBlank() ? "BUYER" : mode;
        String currentMarketplace = marketplace == null || marketplace.isBlank() ? "DIGITAL" : marketplace;
        SellerModeEligibility eligibility = new SellerModeEligibility(true, true, true, true, true,
                true, true, true, true, true, null, List.of());
        List<MarketplaceModuleAvailability> modules = modules();
        return new AccountSwitcherResponse(currentMode, currentMarketplace,
                new BuyerIdentitySummary("user-1000", "V***D", "Vinod", "marketplace/placeholders/avatar.png",
                        "USA", "ACTIVE", true),
                new SellerIdentitySummary("seller-1000", "TechDealsPhoenix", "Tech Deals Phoenix",
                        "marketplace/placeholders/store.png", "ACTIVE", "COMPLETE", "VERIFIED",
                        "PAYPAL_CONNECTED", "DIGITAL"),
                List.of(
                        new AccountModeAvailability("BUYER", true, "BUYER".equals(currentMode),
                                "AVAILABLE", null, null, null, "/home"),
                        new AccountModeAvailability("SELLER", true, "SELLER".equals(currentMode),
                                "AVAILABLE", null, null, null, "/seller")),
                modules, modules, eligibility, "USA marketplace availability",
                new AccountSwitcherAvailableActions(true, true, true, true, true, true, true, true, true));
    }

    public static List<MarketplaceModuleAvailability> modules() {
        return List.of(
                module("DIGITAL", "Digital Marketplace", "ENABLED", true, true, null),
                module("ELECTRONICS", "Electronics Marketplace", "ENABLED", true, true, null),
                module("JEWELLERY", "Imitation Jewellery", "COMING_SOON", false, false, "Coming soon"),
                module("AUTOMOTIVE", "Automotive", "DISABLED_BY_ADMIN", false, false, "Disabled by admin"),
                module("GROCERY", "Grocery", "NOT_AVAILABLE_IN_COUNTRY", false, false, "Not available in your country"),
                module("FRESH_MEAT", "Fresh Meat", "COMING_SOON", false, false, "Coming soon"),
                module("RENTALS", "Rentals", "REQUIRES_APPROVAL", true, false, "Admin approval required"),
                module("FUTURE", "Future Marketplace", "COMING_SOON", false, false, "Future marketplace placeholder"));
    }

    private static MarketplaceModuleAvailability module(String code, String name, String status,
                                                        boolean buyer, boolean seller, String reason) {
        return new MarketplaceModuleAvailability(code, name, "marketplace/placeholders/gift_cards.png",
                buyer, seller, buyer, seller, !"NOT_AVAILABLE_IN_COUNTRY".equals(status),
                !"DISABLED_BY_ADMIN".equals(status), status, "ENABLED".equals(status) ? null : status,
                reason, "REQUIRES_APPROVAL".equals(status) ? "Request Approval" : null,
                "COMING_SOON".equals(status));
    }
}

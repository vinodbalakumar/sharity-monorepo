package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class AppSettingsDtos {
    private AppSettingsDtos() {}
    public record AppSettingsDashboardResponse(String userId, String currentMode, String currentMarketplace,
                                               ThemePreference themePreference, LanguagePreference languagePreference,
                                               RegionSummary regionSummary, CurrencyDisplayPreference currencyPreference,
                                               List<MarketplacePreferenceItem> marketplacePreferences,
                                               List<NotificationPreferenceItem> notificationPreferencesSummary,
                                               AccessibilityPreference accessibilityPreferences, AppAboutInfo appAbout,
                                               String syncStatus, List<String> availableActions) {}
    public record ThemePreference(String currentTheme, List<String> availableThemes, String systemThemeDetected, boolean highContrastAvailableLater) {}
    public record LanguagePreference(String currentLanguage, List<String> availableLanguages, List<String> futureLanguages, String languageStatus, String userSafeMessage) {}
    public record RegionSummary(String countryCode, String countryName, boolean countryChangeAllowed, boolean countryChangeReviewRequired, String marketplaceImpactSummary, String payoutImpactSummary, String manageCountryRoute) {}
    public record CurrencyDisplayPreference(String checkoutCurrency, String displayCurrency, List<String> availableDisplayCurrencies, boolean backendControlled, boolean userCanChangeDisplayCurrency, String userSafeMessage) {}
    public record MarketplacePreferenceItem(String marketplaceCode, String marketplaceName, String marketplaceIconUrl, boolean buyerVisible, boolean sellerVisible, boolean buyerPreferenceEnabled, boolean sellerPreferenceEnabled, boolean adminCountryAllowed, String status, String userSafeReason, int displayOrder, boolean defaultMarketplace, List<String> availableActions) {}
    public record NotificationPreferenceItem(String notificationType, String label, String description, boolean pushEnabled, boolean emailEnabled, boolean inAppEnabled, boolean mandatory, boolean critical, boolean userCanDisable, String userSafeMessage) {}
    public record AccessibilityPreference(boolean largerTextEnabled, boolean reduceMotionEnabled, boolean highContrastEnabledLater, boolean screenReaderOptimized, boolean hapticFeedbackEnabled) {}
    public record AppAboutInfo(String appName, String appVersion, String buildNumber, String platform, String environmentLabelSafe, String termsRoute, String privacyRoute, String licensesRouteLater, boolean debugInfoAvailableInDevOnly) {}
    public record UpdateMarketplacePreferencesRequest(String marketplaceCode, boolean buyerPreferenceEnabled, boolean sellerPreferenceEnabled) {}
    public record ReorderMarketplaceShortcutsRequest(List<String> orderedMarketplaceCodes) {}
    public record UpdateNotificationPreferenceRequest(String notificationType, boolean pushEnabled, boolean emailEnabled, boolean inAppEnabled) {}
    public record SettingsActionResponse(boolean success, String status, String message, LocalDateTime updatedAt, String syncStatus) {}

    public static AppSettingsDashboardResponse dashboard() {
        return new AppSettingsDashboardResponse("user-1042", "BUYER_SELLER", "Digital Marketplace",
                new ThemePreference("System default", List.of("System default", "Light mode", "Dark mode", "High contrast later"), "Light mode", true),
                new LanguagePreference("English", List.of("English"), List.of("Spanish later", "Hindi later", "French later"), "MVP_ACTIVE", "English is active for MVP."),
                new RegionSummary("USA", "United States", true, true, "Country changes affect marketplace availability, payments, refunds, and compliance.", "Seller payouts may require review.", "profilePrivacy"),
                new CurrencyDisplayPreference("USD", "USD", List.of("USD", "EUR informational", "GBP informational"), true, true, "Display currency does not override checkout, payment, payout, or refund currency."),
                marketplaces(), notifications(), new AccessibilityPreference(true, true, false, true, true),
                new AppAboutInfo("Sharity", "1.0.0", "2026.06.04", "Expo native/web", "Local development", "policies", "profilePrivacy", "/licenses-later", true),
                "SYNCED", List.of("CHANGE_THEME", "CHANGE_LANGUAGE", "MANAGE_REGION_COUNTRY", "MANAGE_CURRENCY_DISPLAY", "MANAGE_MARKETPLACE_PREFERENCES", "MANAGE_NOTIFICATIONS", "OPEN_PRIVACY_SETTINGS", "OPEN_LOGIN_SECURITY", "OPEN_HELP_SUPPORT", "CLEAR_CACHE", "VIEW_ABOUT"));
    }
    public static List<MarketplacePreferenceItem> marketplaces() {
        return List.of(
                market("DIGITAL", "Digital Marketplace", "marketplace/placeholders/gaming.png", true, true, true, true, true, "ACTIVE", "Digital-first MVP marketplace.", 1, true),
                market("ELECTRONICS", "Electronics Marketplace", "marketplace/placeholders/electronics.png", true, true, true, false, true, "ACTIVE", "Seller visibility waits for onboarding.", 2, false),
                market("GROCERY", "Grocery", "marketplace/placeholders/grocery.png", false, false, false, false, false, "DISABLED", "Not available for your country yet.", 4, false));
    }
    public static List<NotificationPreferenceItem> notifications() {
        return List.of(
                notif("ORDER_UPDATES", "Order updates", "Purchase and delivery updates.", true, true, true, false, false, true),
                notif("SECURITY_ALERTS", "Security alerts", "Login, password, and account safety alerts.", true, true, true, true, true, false),
                notif("SELLER_PAYOUT", "Seller payout updates", "Payout eligibility and hold changes.", true, true, true, true, true, false),
                notif("PROMOTIONS_REWARDS", "Promotions and rewards", "Coupons, credits, and giveaways.", false, false, true, false, false, true));
    }
    public static SettingsActionResponse action(String status, String message) { return new SettingsActionResponse(true, status, message, LocalDateTime.now(), "SYNCED"); }
    private static MarketplacePreferenceItem market(String code, String name, String icon, boolean buyerVisible, boolean sellerVisible, boolean buyerEnabled, boolean sellerEnabled, boolean allowed, String status, String reason, int order, boolean defaultMarketplace) {
        return new MarketplacePreferenceItem(code, name, icon, buyerVisible, sellerVisible, buyerEnabled, sellerEnabled, allowed, status, reason, order, defaultMarketplace, allowed ? List.of("TOGGLE_BUYER", "TOGGLE_SELLER", "SET_DEFAULT") : List.of());
    }
    private static NotificationPreferenceItem notif(String type, String label, String desc, boolean push, boolean email, boolean inApp, boolean mandatory, boolean critical, boolean canDisable) {
        return new NotificationPreferenceItem(type, label, desc, push, email, inApp, mandatory, critical, canDisable, mandatory ? "Required for account safety and cannot be fully disabled." : "You can adjust this preference.");
    }
}

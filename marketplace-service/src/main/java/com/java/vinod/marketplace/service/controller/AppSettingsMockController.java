package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.AppSettingsDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings/app")
public class AppSettingsMockController {
    @GetMapping
    public AppSettingsDtos.AppSettingsDashboardResponse dashboard() { return AppSettingsDtos.dashboard(); }
    @PatchMapping("/theme")
    public AppSettingsDtos.SettingsActionResponse theme() { return AppSettingsDtos.action("THEME_UPDATED", "Theme preference saved."); }
    @PatchMapping("/language")
    public AppSettingsDtos.SettingsActionResponse language() { return AppSettingsDtos.action("LANGUAGE_UPDATED", "Language preference saved for future i18n."); }
    @GetMapping("/region")
    public AppSettingsDtos.RegionSummary region() { return AppSettingsDtos.dashboard().regionSummary(); }
    @GetMapping("/currency-options")
    public AppSettingsDtos.CurrencyDisplayPreference currencyOptions() { return AppSettingsDtos.dashboard().currencyPreference(); }
    @PatchMapping("/currency")
    public AppSettingsDtos.SettingsActionResponse currency() { return AppSettingsDtos.action("CURRENCY_UPDATED", "Display currency updated without changing checkout/payment/payout currency."); }
    @GetMapping("/marketplaces")
    public List<AppSettingsDtos.MarketplacePreferenceItem> marketplaces() { return AppSettingsDtos.marketplaces(); }
    @PatchMapping("/marketplaces")
    public AppSettingsDtos.SettingsActionResponse marketplace(@RequestBody(required = false) AppSettingsDtos.UpdateMarketplacePreferencesRequest request) { return AppSettingsDtos.action("MARKETPLACE_PREFERENCE_UPDATED", "Marketplace preference saved subject to country/admin rules."); }
    @PatchMapping("/marketplaces/display-order")
    public AppSettingsDtos.SettingsActionResponse reorder(@RequestBody(required = false) AppSettingsDtos.ReorderMarketplaceShortcutsRequest request) { return AppSettingsDtos.action("MARKETPLACE_REORDERED", "Marketplace shortcut order saved."); }
    @PatchMapping("/marketplaces/default")
    public AppSettingsDtos.SettingsActionResponse defaultMarketplace() { return AppSettingsDtos.action("DEFAULT_MARKETPLACE_UPDATED", "Default marketplace saved."); }
    @GetMapping("/notifications")
    public List<AppSettingsDtos.NotificationPreferenceItem> notifications() { return AppSettingsDtos.notifications(); }
    @PatchMapping("/notifications")
    public AppSettingsDtos.SettingsActionResponse notification(@RequestBody(required = false) AppSettingsDtos.UpdateNotificationPreferenceRequest request) { return AppSettingsDtos.action("NOTIFICATION_PREFERENCE_UPDATED", "Notification preference saved. Critical alerts remain mandatory."); }
    @GetMapping("/accessibility")
    public AppSettingsDtos.AccessibilityPreference accessibility() { return AppSettingsDtos.dashboard().accessibilityPreferences(); }
    @PatchMapping("/accessibility")
    public AppSettingsDtos.SettingsActionResponse accessibilityUpdate() { return AppSettingsDtos.action("ACCESSIBILITY_UPDATED", "Accessibility preference saved."); }
    @GetMapping("/about")
    public AppSettingsDtos.AppAboutInfo about() { return AppSettingsDtos.dashboard().appAbout(); }
    @PostMapping("/audit-event")
    public AppSettingsDtos.SettingsActionResponse audit() { return AppSettingsDtos.action("AUDIT_EVENT_ACCEPTED", "Important setting change audit placeholder recorded."); }
}

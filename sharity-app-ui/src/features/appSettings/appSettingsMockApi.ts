import type { AppSettingsDashboardResponse, SettingsActionResponse } from './appSettingsTypes';

import { placeholderImageUrl } from '../../utils/mockImages';

const icon = (name: string) => placeholderImageUrl(name);

const dashboard: AppSettingsDashboardResponse = {
  userId: 'user-1042',
  currentMode: 'BUYER_SELLER',
  currentMarketplace: 'Digital Marketplace',
  themePreference: { currentTheme: 'System default', availableThemes: ['System default', 'Light mode', 'Dark mode', 'High contrast later'], systemThemeDetected: 'Light mode', highContrastAvailableLater: true },
  languagePreference: { currentLanguage: 'English', availableLanguages: ['English'], futureLanguages: ['Spanish later', 'Hindi later', 'French later'], languageStatus: 'MVP_ACTIVE', userSafeMessage: 'English is active for MVP. Future language hooks are ready.' },
  regionSummary: { countryCode: 'USA', countryName: 'United States', countryChangeAllowed: true, countryChangeReviewRequired: true, marketplaceImpactSummary: 'Country changes can affect marketplace availability, payments, refunds, and compliance.', payoutImpactSummary: 'Seller payout setup may require review after country changes.', manageCountryRoute: 'profilePrivacy' },
  currencyPreference: { checkoutCurrency: 'USD', displayCurrency: 'USD', availableDisplayCurrencies: ['USD', 'EUR informational', 'GBP informational'], backendControlled: true, userCanChangeDisplayCurrency: true, userSafeMessage: 'Display currency is informational and does not override checkout, payment, payout, or refund currency.' },
  marketplacePreferences: [
    market('DIGITAL', 'Digital Marketplace', icon('gaming'), true, true, true, true, true, 'ACTIVE', 'Digital-first MVP marketplace.', 1, true),
    market('ELECTRONICS', 'Electronics Marketplace', icon('electronics'), true, true, true, false, true, 'ACTIVE', 'Seller visibility waits for electronics onboarding.', 2, false),
    market('JEWELLERY', 'Imitation Jewellery', icon('jewellery'), true, false, false, false, true, 'USER_HIDDEN', 'Hidden by buyer preference.', 3, false),
    market('GROCERY', 'Grocery', icon('grocery'), false, false, false, false, false, 'DISABLED', 'Not available for your country yet.', 4, false),
    market('FRESH_MEAT', 'Fresh Meat', icon('fresh_meat'), false, false, false, false, false, 'COMING_SOON', 'Coming later with local compliance support.', 5, false),
    market('RENTALS', 'Rentals', icon('rentals'), false, false, false, false, false, 'COMING_SOON', 'Future marketplace placeholder.', 6, false)
  ],
  notificationPreferencesSummary: [
    notif('ORDER_UPDATES', 'Order updates', 'Purchases, delivery, and receipt updates.', true, true, true, false, false, true),
    notif('DIGITAL_DELIVERY', 'Digital delivery updates', 'Code reveal and secure download updates.', true, true, true, true, true, false),
    notif('REFUND_DISPUTE', 'Refund and dispute updates', 'Refund decisions and Sharity Review activity.', true, true, true, true, true, false),
    notif('PAYMENT_AUTHORIZATION', 'Payment authorization updates', 'PayPal authorization and capture status.', true, true, true, true, true, false),
    notif('SELLER_PAYOUT', 'Seller payout updates', 'Payout eligibility and hold changes.', true, true, true, true, true, false),
    notif('SELLER_VERIFICATION', 'Seller verification updates', 'Checklist and review results.', true, true, true, true, false, true),
    notif('SUPPORT_TICKETS', 'Support ticket updates', 'Replies and support actions.', true, true, true, false, false, true),
    notif('PROMOTIONS_REWARDS', 'Promotions and rewards', 'Coupons, credits, and giveaways.', false, false, true, false, false, true),
    notif('SECURITY_ALERTS', 'Security alerts', 'Login, password, and account protection alerts.', true, true, true, true, true, false),
    notif('MARKETPLACE_AVAILABILITY', 'Marketplace availability', 'Country/admin marketplace availability changes.', true, true, true, false, false, true)
  ],
  accessibilityPreferences: { largerTextEnabled: true, reduceMotionEnabled: true, highContrastEnabledLater: false, screenReaderOptimized: true, hapticFeedbackEnabled: true },
  appAbout: { appName: 'Sharity', appVersion: '1.0.0', buildNumber: '2026.06.04', platform: 'Expo native/web', environmentLabelSafe: 'Local development', termsRoute: 'policies', privacyRoute: 'profilePrivacy', licensesRouteLater: '/licenses-later', debugInfoAvailableInDevOnly: true },
  syncStatus: 'SYNCED',
  availableActions: ['CHANGE_THEME', 'CHANGE_LANGUAGE', 'MANAGE_REGION_COUNTRY', 'MANAGE_CURRENCY_DISPLAY', 'MANAGE_MARKETPLACE_PREFERENCES', 'MANAGE_NOTIFICATIONS', 'OPEN_PRIVACY_SETTINGS', 'OPEN_LOGIN_SECURITY', 'OPEN_HELP_SUPPORT', 'CLEAR_CACHE', 'VIEW_ABOUT']
};

export async function getAppSettingsDashboard(): Promise<AppSettingsDashboardResponse> {
  return dashboard;
}

export async function updateSetting(action: string): Promise<SettingsActionResponse> {
  return { success: true, status: action === 'DISABLE_SECURITY_ALERTS' ? 'NOTIFICATION_PREFERENCE_BLOCKED' : action === 'CLEAR_CACHE' ? 'CACHE_CLEARED' : 'SYNCED', message: action === 'DISABLE_SECURITY_ALERTS' ? 'Security alerts are required for account safety and cannot be fully disabled.' : action === 'CLEAR_CACHE' ? 'Local image, marketplace, temporary, and UI cache cleared. Auth/session and secure order access were not cleared.' : 'Preference saved and queued for account sync.', updatedAt: new Date().toISOString(), syncStatus: 'SYNCED' };
}

function market(marketplaceCode: string, marketplaceName: string, marketplaceIconUrl: string, buyerVisible: boolean, sellerVisible: boolean, buyerPreferenceEnabled: boolean, sellerPreferenceEnabled: boolean, adminCountryAllowed: boolean, status: string, userSafeReason: string, displayOrder: number, defaultMarketplace: boolean) {
  return { marketplaceCode, marketplaceName, marketplaceIconUrl, buyerVisible, sellerVisible, buyerPreferenceEnabled, sellerPreferenceEnabled, adminCountryAllowed, status, userSafeReason, displayOrder, defaultMarketplace, availableActions: adminCountryAllowed ? ['TOGGLE_BUYER', 'TOGGLE_SELLER', 'SET_DEFAULT'] : [] };
}
function notif(notificationType: string, label: string, description: string, pushEnabled: boolean, emailEnabled: boolean, inAppEnabled: boolean, mandatory: boolean, critical: boolean, userCanDisable: boolean) {
  return { notificationType, label, description, pushEnabled, emailEnabled, inAppEnabled, mandatory, critical, userCanDisable, userSafeMessage: mandatory ? 'Required for account, payment, payout, or safety events.' : 'You can adjust this preference.' };
}

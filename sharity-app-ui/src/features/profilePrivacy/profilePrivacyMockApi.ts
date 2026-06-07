import type { ProfilePrivacySettingsResponse } from './profilePrivacyTypes';
import { placeholderImageUrl } from '../../utils/mockImages';

const now = Date.now();

export async function getProfilePrivacySettings(): Promise<ProfilePrivacySettingsResponse> {
  return {
    profile: {
      userId: 'user-1000',
      displayName: 'Vinod',
      profilePhotoUrl: placeholderImageUrl('avatar'),
      bio: 'Buyer and seller on Sharity.',
      country: 'United States',
      region: 'Arizona',
      preferredLanguage: 'English',
      timeZone: 'America/Phoenix',
      emailVerified: true,
      phoneVerified: true,
      complianceFieldsPrivate: true,
      profileVisibility: 'Visible after order'
    },
    buyerProfile: {
      buyerAlias: 'V***D',
      buyerDisplayNamePreference: 'Buyer alias',
      profilePhotoVisible: false,
      countryRegionVisible: false,
      purchaseHistoryVisible: false,
      onlineStatusVisible: false,
      lastActiveVisible: false
    },
    sellerProfile: {
      sellerAlias: 'TechDealsPhoenix',
      storeName: 'Tech Deals Phoenix',
      storeLogoUrl: placeholderImageUrl('store'),
      storeDescription: 'Verified digital and electronics deals.',
      sellerDisplayPreference: 'Store name',
      salesCountVisible: false,
      ratingDetailsVisible: false,
      sellerProfileVisibility: 'Public within Sharity',
      sellerVerified: true
    },
    privacySettings: {
      hideRealName: true,
      showBuyerAliasInsteadOfRealName: true,
      showSellerAliasStoreNameInsteadOfRealName: true,
      hideProfilePhoto: false,
      hideCountryRegion: true,
      hidePurchaseHistory: true,
      hideSellerSalesCount: true,
      hideSellerRatingDetails: true,
      profileVisibility: 'Visible after order',
      realNamePublic: false,
      realNamePublicAcknowledged: false
    },
    digitalPrivacy: {
      aliasOnly: true,
      hideEmailPhoneAddress: true,
      requireSafeMessaging: true,
      blockExternalContact: true,
      blockNormalChatCodes: true,
      secureDeliveryOnly: true,
      message: 'For digital products, Sharity uses alias-only identity and Safe Messaging. Phone, email, address, direct payment links, and normal-chat digital codes are not shared.'
    },
    messagePrivacy: {
      allowOrderRefundDisputeMessagesOnly: true,
      allowPrePurchaseQuestionsLater: false,
      hideOnlineStatus: true,
      hideLastActive: true,
      blockedUserCount: 2,
      reportUserEnabled: true
    },
    verificationBadges: [
      badge('EMAIL_VERIFIED', 'Email verified', 'VERIFIED', true, false),
      badge('PHONE_VERIFIED', 'Phone verified', 'VERIFIED', false, false),
      badge('SELLER_VERIFIED', 'Seller verified', 'VERIFIED', true, false),
      badge('PAYPAL_CONNECTED', 'PayPal connected', 'CONNECTED', false, true),
      badge('IDENTITY_VERIFIED', 'Identity verified', 'VERIFIED', false, true),
      badge('GOOD_STANDING', 'Good seller standing', 'ACTIVE', true, false),
      badge('NEW_SELLER', 'New seller', 'ACTIVE', true, false),
      badge('ACCOUNT_HEALTH', 'Private account health warning', 'PRIVATE', false, true)
    ],
    blockedUsersSummary: {
      count: 2,
      users: [
        blocked('blocked-1001', 'OrderBuyer-42', 'BUYER', 'Harassment in order thread', 12, 'Order ORD-3001'),
        blocked('blocked-1002', 'SuspiciousStore', 'SELLER', 'Off-platform payment request', 31, 'Dispute DSP-1190')
      ]
    },
    dataExportStatus: {
      requested: true,
      status: 'READY',
      requestedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      readyAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
      downloadAvailable: true,
      secureDownloadRoute: '/settings/profile-privacy/data-export'
    },
    deleteAccountEligibility: {
      eligible: false,
      blocked: true,
      blockingReasons: ['Active order', 'Active dispute', 'Pending payout'],
      activeOrders: true,
      activeRefunds: false,
      activeDisputes: true,
      pendingPayouts: true,
      legalRetentionNotice: 'Some order, refund, dispute, payout, tax, fraud-prevention, legal, and security records may be retained.',
      requiresReauthentication: true,
      typedConfirmationRequired: true
    }
  };
}

export async function saveProfilePrivacySettings() {
  return { status: 'OK', message: 'Profile settings saved.' };
}

export async function requestDataExport() {
  return { status: 'REQUESTED', message: 'Data export requested.' };
}

function badge(badgeType: string, label: string, status: string, publicVisible: boolean, sellerSafeOnly: boolean) {
  return { badgeType, label, status, publicVisible, sellerSafeOnly, description: sellerSafeOnly ? 'Visible only in account-safe settings.' : 'User-safe verification status.' };
}

function blocked(blockedUserId: string, displayAlias: string, role: 'BUYER' | 'SELLER', blockedReason: string, daysAgo: number, relatedEntityReference: string) {
  return { blockedUserId, displayAlias, role, blockedReason, blockedAt: new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString(), relatedEntityReference, canUnblock: true };
}

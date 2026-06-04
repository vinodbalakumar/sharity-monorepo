export type VerificationBadgeItem = {
  badgeType: string;
  label: string;
  status: string;
  publicVisible: boolean;
  sellerSafeOnly: boolean;
  description: string;
};

export type BlockedUserItem = {
  blockedUserId: string;
  displayAlias: string;
  role: 'BUYER' | 'SELLER';
  blockedReason: string;
  blockedAt: string;
  relatedEntityReference: string;
  canUnblock: boolean;
};

export type ProfilePrivacySettingsResponse = {
  profile: {
    userId: string;
    displayName: string;
    profilePhotoUrl?: string;
    bio: string;
    country: string;
    region: string;
    preferredLanguage: string;
    timeZone: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    complianceFieldsPrivate: boolean;
    profileVisibility: string;
  };
  buyerProfile: {
    buyerAlias: string;
    buyerDisplayNamePreference: string;
    profilePhotoVisible: boolean;
    countryRegionVisible: boolean;
    purchaseHistoryVisible: boolean;
    onlineStatusVisible: boolean;
    lastActiveVisible: boolean;
  };
  sellerProfile: {
    sellerAlias: string;
    storeName: string;
    storeLogoUrl?: string;
    storeDescription: string;
    sellerDisplayPreference: string;
    salesCountVisible: boolean;
    ratingDetailsVisible: boolean;
    sellerProfileVisibility: string;
    sellerVerified: boolean;
  };
  privacySettings: Record<string, boolean | string>;
  digitalPrivacy: {
    aliasOnly: boolean;
    hideEmailPhoneAddress: boolean;
    requireSafeMessaging: boolean;
    blockExternalContact: boolean;
    blockNormalChatCodes: boolean;
    secureDeliveryOnly: boolean;
    message: string;
  };
  messagePrivacy: {
    allowOrderRefundDisputeMessagesOnly: boolean;
    allowPrePurchaseQuestionsLater: boolean;
    hideOnlineStatus: boolean;
    hideLastActive: boolean;
    blockedUserCount: number;
    reportUserEnabled: boolean;
  };
  verificationBadges: VerificationBadgeItem[];
  blockedUsersSummary: { count: number; users: BlockedUserItem[] };
  dataExportStatus: {
    requested: boolean;
    status: string;
    requestedAt?: string;
    readyAt?: string;
    expiresAt?: string;
    downloadAvailable: boolean;
    secureDownloadRoute: string;
  };
  deleteAccountEligibility: {
    eligible: boolean;
    blocked: boolean;
    blockingReasons: string[];
    activeOrders: boolean;
    activeRefunds: boolean;
    activeDisputes: boolean;
    pendingPayouts: boolean;
    legalRetentionNotice: string;
    requiresReauthentication: boolean;
    typedConfirmationRequired: boolean;
  };
};

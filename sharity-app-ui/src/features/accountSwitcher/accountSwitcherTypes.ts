export type AccountMode = 'BUYER' | 'SELLER';
export type MarketplaceStatus = 'ENABLED' | 'DISABLED_BY_USER' | 'DISABLED_BY_ADMIN' | 'NOT_AVAILABLE_IN_COUNTRY' | 'COMING_SOON' | 'REQUIRES_SELLER_ONBOARDING' | 'REQUIRES_VERIFICATION' | 'REQUIRES_APPROVAL' | 'PAYOUT_SETUP_REQUIRED' | 'SUSPENDED' | 'LIMITED';

export type BuyerIdentitySummary = {
  userId: string;
  buyerAlias: string;
  displayName: string;
  avatarUrl?: string;
  country: string;
  buyerStatus: string;
  privacyModeEnabled: boolean;
};

export type SellerIdentitySummary = {
  sellerId: string;
  sellerAlias: string;
  storeName: string;
  storeLogoUrl?: string;
  sellerStatus: string;
  onboardingStatus: string;
  verificationStatus: string;
  payoutSetupStatus: string;
  activeSellerMarketplace: string;
};

export type AccountModeAvailability = {
  mode: AccountMode;
  available: boolean;
  active: boolean;
  status: string;
  reasonCode?: string;
  reasonMessage?: string;
  requiredAction?: string;
  route: string;
};

export type MarketplaceModuleAvailability = {
  marketplaceCode: string;
  marketplaceName: string;
  iconUrl?: string;
  buyerAvailable: boolean;
  sellerAvailable: boolean;
  buyerEnabledByUser: boolean;
  sellerEnabledByUser: boolean;
  countryAllowed: boolean;
  adminAllowed: boolean;
  status: MarketplaceStatus;
  reasonCode?: string;
  reasonMessage?: string;
  requiredAction?: string;
  comingSoon: boolean;
};

export type SellerModeEligibility = {
  eligible: boolean;
  sellerProfileComplete: boolean;
  sellerAliasConfigured: boolean;
  storeNameConfigured: boolean;
  countryEligible: boolean;
  policyAccepted: boolean;
  verificationRequired: boolean;
  verificationComplete: boolean;
  payoutSetupRequired: boolean;
  payoutSetupComplete: boolean;
  blockedReason?: string;
  requiredActions: string[];
};

export type AccountSwitcherResponse = {
  currentMode: AccountMode;
  currentMarketplace: string;
  buyerIdentity: BuyerIdentitySummary;
  sellerIdentity: SellerIdentitySummary;
  availableModes: AccountModeAvailability[];
  marketplaceModules: MarketplaceModuleAvailability[];
  sellerModeEligibility: SellerModeEligibility;
};

export type SwitchAccountModeResponse = {
  currentMode: AccountMode;
  currentMarketplace: string;
  switched: boolean;
  message: string;
  fallbackApplied: boolean;
  fallbackReason?: string;
};

import { getCurrentUser } from '../../services/userApi';
import { getMyModules, getMyProviderAccounts } from '../../services/platformAuthorizationApi';
import type { AccountMode, AccountSwitcherResponse, SwitchAccountModeResponse } from './accountSwitcherTypes';

export async function getAccountSwitcherSummary(currentMode: AccountMode = 'BUYER', currentMarketplace = 'MARKETPLACE'): Promise<AccountSwitcherResponse> {
 const [user, providers, modules] = await Promise.all([getCurrentUser(), getMyProviderAccounts(), getMyModules()]);
 const provider = providers.find(item => item.overallStatus === 'ACTIVE') ?? providers[0];
 const eligible = Boolean(provider?.chargesEnabled && provider?.enrollments.some(item => item.sellingEnabled));
 const mode = currentMode === 'SELLER' && !eligible ? 'BUYER' : currentMode;
 const selected = modules.find(item => item.moduleCode === currentMarketplace) ?? modules.find(item => item.availableToCustomer);
 return {
  currentMode: mode, currentMarketplace: selected?.moduleCode || 'MARKETPLACE',
  buyerIdentity: { userId: user.publicId, buyerAlias: user.username, displayName: user.username,
   avatarUrl: user.profile.profileImageUrl || undefined, country: user.profile.countryName || user.profile.countryCode || 'Not provided',
   buyerStatus: user.status, privacyModeEnabled: user.profile.privacySetting !== 'PUBLIC' },
  sellerIdentity: { sellerId: provider?.publicId || '', sellerAlias: provider?.displayName || 'No provider account',
   storeName: provider?.displayName || 'Not configured', sellerStatus: provider?.overallStatus || 'NOT_CONFIGURED',
   onboardingStatus: eligible ? 'ACTIVE' : 'REQUIRED', verificationStatus: provider?.verificationStatus || 'NOT_STARTED',
   payoutSetupStatus: provider?.payoutsEnabled ? 'ENABLED' : 'NOT_ENABLED', activeSellerMarketplace: selected?.moduleCode || '' },
  availableModes: [ { mode: 'BUYER', available: true, active: mode === 'BUYER', status: 'AVAILABLE', route: '/home' },
   { mode: 'SELLER', available: eligible, active: mode === 'SELLER', status: eligible ? 'AVAILABLE' : 'ONBOARDING_REQUIRED', route: '/sell' } ],
  marketplaceModules: modules.map(item => ({ marketplaceCode: item.moduleCode, marketplaceName: item.moduleName,
   buyerAvailable: item.availableToCustomer, sellerAvailable: Boolean(provider?.enrollments.some(enrollment => enrollment.moduleCode === item.moduleCode && enrollment.sellingEnabled)),
   buyerEnabledByUser: item.availableToCustomer, sellerEnabledByUser: item.providerAccessActive,
   countryAllowed: item.availableToCustomer, adminAllowed: item.status === 'ACTIVE',
   status: item.availableToCustomer ? 'ENABLED' : 'DISABLED_BY_ADMIN', comingSoon: false,
   reasonMessage: item.availableToCustomer ? 'Availability supplied by your platform account.' : 'This module is currently unavailable.' })),
  sellerModeEligibility: { eligible, sellerProfileComplete: Boolean(provider), sellerAliasConfigured: Boolean(provider?.displayName),
   storeNameConfigured: Boolean(provider?.displayName), countryEligible: Boolean(provider?.countryCode), policyAccepted: eligible,
   verificationRequired: true, verificationComplete: provider?.verificationStatus === 'VERIFIED', payoutSetupRequired: true,
   payoutSetupComplete: Boolean(provider?.payoutsEnabled), requiredActions: eligible ? [] : ['Review seller onboarding and module approval'] }
 };
}
export async function switchAccountMode(targetMode: AccountMode, targetMarketplace: string): Promise<SwitchAccountModeResponse> {
 const summary = await getAccountSwitcherSummary(targetMode, targetMarketplace);
 const switched = targetMode === summary.currentMode;
 return { currentMode: summary.currentMode, currentMarketplace: summary.currentMarketplace, switched,
  fallbackApplied: !switched, message: switched ? `Viewing ${targetMode.toLowerCase()} workspace on this device.` : 'Complete seller onboarding before opening the seller workspace.' };
}

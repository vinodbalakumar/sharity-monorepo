import { observable } from '@legendapp/state';

export const appState$ = observable({
  cart: {
    count: 4
  },
  checkout: {
    selectedPaymentMethod: 'PAYPAL'
  },
  library: {
    downloadLoadingAccessId: '',
    revealLoadingAccessId: '',
    revealModalAccessId: '',
    searchQuery: '',
    selectedFilter: 'All',
    selectedViewMode: 'grid'
  },
  secureAccess: {
    downloadFileId: '',
    downloadLoading: false,
    locationConsent: 'IDLE',
    revealConsent: 'IDLE',
    revealTimerSeconds: 60,
    revealedCodeHidden: true,
    reportModalOpen: false,
    supportModalOpen: false
  },
  marketplace: {
    selected: 'DIGITAL',
    searchQuery: '',
    filters: {
      minPrice: 0,
      maxPrice: 999,
      verifiedSellersOnly: false,
      categoryCode: '',
      verticalCode: '',
      deliveryType: ''
    },
    sortBy: 'newest'
  },
  orders: {
    cancelConfirmationOrderId: '',
    receiptModalOpen: false,
    refundModalOpen: false,
    receiptModalOrderId: '',
    searchQuery: '',
    selectedFilter: 'All',
    selectedSort: 'Newest First',
    trackingMessageOrderId: ''
  },
  receipt: {
    expandedGroupId: '',
    refundHistoryExpanded: true,
    supportModalOpen: false
  },
  refunds: {
    selectedReasonCode: '',
    warningAccepted: false
  },
  disputes: {
    selectedReasonCode: '',
    warningAccepted: false
  },
  disputeStatus: {
    closeConfirmationOpen: false,
    evidencePanelOpen: false,
    supportPanelOpen: false
  },
  payment: {
    lastAttemptReference: 'PAY-ATTEMPT-92831',
    lastSuccessfulOrderId: 'order-digital-001',
    receiptModalOpen: false,
    retryLoading: false,
    status: 'IDLE'
  },
  notifications: {
    archiveError: '',
    lastDeepLink: '',
    selectedFilter: 'All',
    selectedNotificationId: '',
    searchQuery: ''
  },
  appSettings: {
    selectedSection: 'Appearance',
    theme: 'System default',
    language: 'English',
    syncStatus: 'SYNCED'
  },
  loginSecurity: {
    selectedTab: 'Overview',
    selectedFilter: 'All',
    reauthRequired: false,
    selectedDeviceSessionId: '',
    selectedMethodId: ''
  },
  profilePrivacy: {
    deleteConfirmation: '',
    realNameWarningOpen: false,
    saveStatus: 'SAVED',
    selectedSection: 'Identity'
  },
  accountSwitcher: {
    currentMode: 'BUYER',
    selectedMarketplace: 'DIGITAL',
    sheetOpen: false,
    switchLoading: false,
    selectedTab: 'Modes'
  },
  multiSellerCart: {
    couponCode: '',
    digitalTermsAccepted: false,
    lastExpandedSellerGroup: 'seller-gamecodehub',
    checkoutLoading: false,
    lastMessage: ''
  },
  paymentAuthorization: {
    selectedProvider: 'PAYPAL',
    authorizationStatus: 'READY',
    retryLoading: false,
    lastExpandedSellerOrder: 'seller-order-a'
  },
  pricingPromotions: {
    selectedTab: 'Rules',
    selectedRuleId: '',
    simulatorMode: 'Admin',
    saveStatus: 'IDLE'
  },
  rewards: {
    selectedTab: 'Buyer',
    creditApplied: false,
    selectedCampaignId: '',
    claimLoading: false
  },
  sellerOrderRefund: {
    selectedSellerOrderId: 'seller-order-a',
    selectedItemId: 'item-a-1',
    selectedReasonCode: 'DIGITAL_CODE_NOT_WORKING',
    requestedAmount: '18.00',
    submitLoading: false
  },
  marketplaceConfig: {
    selectedTab: 'Countries',
    selectedCountry: 'USA',
    selectedMarketplace: 'DIGITAL',
    saveStatus: 'IDLE'
  },
  sellerVerification: {
    selectedTab: 'Checklist',
    paypalStatus: 'NOT_CONNECTED',
    documentUploadStatus: 'IDLE',
    reviewStatus: 'REQUIRED'
  },
  policies: {
    selectedTab: 'Required',
    selectedPolicyId: 'policy-seller-terms',
    acceptLoading: false,
    acceptedCount: 0
  },
  support: {
    selectedTab: 'Dashboard',
    searchQuery: '',
    selectedFilter: 'All tickets',
    selectedCategory: 'DIGITAL_CODE_ACCESS_ISSUE',
    selectedTicketId: 'ticket-001',
    unsafeWarningVisible: false,
    createLoading: false
  }
});

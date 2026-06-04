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
    selected: 'DIGITAL'
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
  }
});

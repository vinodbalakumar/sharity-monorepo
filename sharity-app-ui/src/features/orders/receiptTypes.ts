export type ReceiptHeader = {
  receiptId: string;
  receiptNumber: string;
  orderId: string;
  orderReference: string;
  checkoutId: string;
  checkoutReference: string;
  receiptStatus: 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'NOT_AVAILABLE';
  orderDate: string;
  paymentDate: string;
  currency: string;
};

export type ReceiptPaymentSummary = {
  paymentStatus: string;
  paymentMethod: string;
  paymentProvider: string;
  safePaymentReference: string;
  currency: string;
  subtotal: number;
  tax: number;
  shipping: number;
  couponDiscount: number;
  marketplaceFee: number;
  totalPaid: number;
  refundAmount: number;
  netPaidAfterRefund: number;
};

export type ReceiptItem = {
  productId: string;
  productTitle: string;
  productImageUrl: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  deliveryStatusSummary: string;
  accessStatusSummary?: string;
  shippingStatusSummary?: string;
  licenseSummary?: string;
  condition?: string;
};

export type ReceiptMarketplaceGroup = {
  marketplaceCode: 'DIGITAL' | 'ELECTRONICS';
  marketplaceName: string;
  sellerId: string;
  sellerDisplayName: string;
  sellerVerified: boolean;
  groupSubtotal: number;
  groupStatus: string;
  items: ReceiptItem[];
};

export type ReceiptFeeBreakdown = {
  subtotal: number;
  tax: number;
  shipping: number;
  couponDiscount: number;
  marketplaceFee: number;
  totalPaid: number;
  refundAmount: number;
  netPaidAfterRefund: number;
  currency: string;
};

export type ReceiptAddressSummary = {
  billingSummaryAvailable: boolean;
  billingDisplayText?: string;
  shippingSummaryAvailable: boolean;
  shippingDisplayText?: string;
};

export type ReceiptDigitalAccessSummary = {
  hasDigitalItems: boolean;
  accessStatus: string;
  codeRevealAvailable: boolean;
  downloadAvailable: boolean;
  libraryRoute: string;
  message: string;
};

export type ReceiptRefundHistoryItem = {
  refundRequestId: string;
  refundStatus: string;
  refundAmount: number;
  refundDate: string;
  refundReasonSummary: string;
  safeProviderRefundReference: string;
};

export type ReceiptAvailableActions = {
  canBackToOrder: boolean;
  canViewOrders: boolean;
  canContactSupport: boolean;
  canGoToLibrary: boolean;
  canTrackPackage: boolean;
  canDownloadPdfFuture: boolean;
  canEmailReceiptFuture: boolean;
};

export type ReceiptResponse = {
  receipt: ReceiptHeader;
  paymentSummary: ReceiptPaymentSummary;
  marketplaceGroups: ReceiptMarketplaceGroup[];
  feeBreakdown: ReceiptFeeBreakdown;
  addressSummary?: ReceiptAddressSummary;
  digitalAccessSummary?: ReceiptDigitalAccessSummary;
  refundHistory: ReceiptRefundHistoryItem[];
  availableActions: ReceiptAvailableActions;
  legalNote: string;
};

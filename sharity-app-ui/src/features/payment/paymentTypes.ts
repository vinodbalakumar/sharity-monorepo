export type PaymentConfirmationResponse = {
  checkoutId: string;
  confirmedAt: string;
  orderIds: string[];
  paymentSessionId: string;
  paymentStatus: 'CONFIRMED';
  provider: 'PAYPAL';
  safePaymentReference: string;
};

export type OrderItemSummary = {
  accessStatus?: string;
  condition?: string;
  deliveryType: string;
  price: number;
  productId: string;
  productImageUrl?: string;
  productTitle: string;
  productType: string;
  quantity: number;
  shippingRequired: boolean;
};

export type OrderGroupSummary = {
  availableActions: string[];
  digitalAccessStatus?: string;
  fulfillmentStatus: string;
  itemCount: number;
  items: OrderItemSummary[];
  marketplaceCode: string;
  marketplaceName: string;
  orderId: string;
  paymentStatus: string;
  sellerDisplayName: string;
  sellerId: string;
  sellerVerified: boolean;
  shippingStatus?: string;
};

export type OrderConfirmationResponse = {
  checkoutId: string;
  notificationMessage: string;
  orderGroups: OrderGroupSummary[];
  paymentStatus: string;
  primaryCta: 'GO_TO_LIBRARY' | 'VIEW_ORDER_DETAILS';
  receiptAvailable: boolean;
  safePaymentReference: string;
  secondaryActions: string[];
};

export type DigitalAccessStatusResponse = {
  accessItems: { accessId: string; title: string; type: string }[];
  accessStatus: string;
  availableActions: string[];
  orderId: string;
  riskReviewStatus: string;
};

export type ReceiptResponse = {
  buyerDisplayName: string;
  checkoutId: string;
  currency: string;
  discount: number;
  items: OrderItemSummary[];
  marketplaceFee: number;
  orderDate: string;
  orderId: string;
  paymentProvider: string;
  receiptId: string;
  safePaymentReference: string;
  shipping: number;
  subtotal: number;
  tax: number;
  total: number;
};

export type PaymentFailureStatus =
  | 'PAYMENT_CANCELLED'
  | 'PAYMENT_DECLINED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_PROVIDER_ERROR'
  | 'PAYMENT_SESSION_EXPIRED'
  | 'PAYMENT_UNKNOWN';

export type PaymentAttemptStatusResponse = {
  attemptedAt: string;
  checkoutId: string;
  failureMessage: string;
  failureReasonCode: string;
  paymentAttemptId: string;
  provider: 'PAYPAL';
  retryAllowed: boolean;
  safeAttemptReference: string;
  status: PaymentFailureStatus;
};

export type RecoveryItem = {
  condition?: string;
  deliveryType: string;
  price: number;
  productId: string;
  productImageUrl?: string;
  productTitle: string;
  productType: string;
  quantity: number;
  shippingRequired: boolean;
};

export type RecoveryOrderGroup = {
  groupSubtotal: number;
  items: RecoveryItem[];
  marketplaceCode: string;
  marketplaceName: string;
  sellerDisplayName: string;
  sellerId: string;
  sellerVerified: boolean;
  shippingRequired: boolean;
};

export type CheckoutRecoverySummaryResponse = {
  cartId: string;
  checkoutId: string;
  checkoutStatus: string;
  groups: RecoveryOrderGroup[];
  recoveryActions: string[];
  summary: {
    currency: string;
    subtotal: number;
    totalPayable: number;
  };
  warnings: string[];
};

export type CheckoutRevalidateResponse = {
  cartChanged: boolean;
  checkoutId: string;
  nextAction: string;
  priceChanged: boolean;
  summary: CheckoutRecoverySummaryResponse['summary'];
  unavailableItems: string[];
  valid: boolean;
  warnings: string[];
};

export type RetryPaymentResponse = {
  approvalUrl: string;
  expiresAt: string;
  paymentAttemptId: string;
  paymentSessionId: string;
  provider: 'PAYPAL';
};

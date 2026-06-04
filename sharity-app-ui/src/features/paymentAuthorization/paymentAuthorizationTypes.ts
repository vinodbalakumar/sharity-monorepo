export type PaymentProviderOption = {
  providerCode: 'PAYPAL' | 'STRIPE';
  providerName: string;
  enabled: boolean;
  primary: boolean;
  comingSoon: boolean;
  status: string;
  message: string;
};

export type PaymentAuthorizationPricingSummary = {
  itemsTotal: number;
  sellerDiscounts: number;
  platformDiscounts: number;
  buyerServiceFee: number;
  sharityCreditApplied: number;
  taxAmount: number;
  shippingAmount: number;
  totalAuthorizationAmount: number;
  totalCapturedAmount: number;
  totalReleasedAmount: number;
  currency: string;
};

export type SellerOrderAuthorizationStatus = {
  sellerOrderId: string;
  sellerOrderReference: string;
  sellerId: string;
  storeName: string;
  sellerAlias: string;
  itemCount: number;
  productTypeSummary: string;
  amountAuthorized: number;
  amountCaptured: number;
  amountReleased: number;
  currency: string;
  sellerAcceptanceRequired: boolean;
  acceptanceStatus: string;
  acceptanceDeadline: string;
  paymentAuthorizationStatus: string;
  captureStatus: string;
  releaseStatus: string;
  digitalDeliveryStatus: string;
  nextStep: string;
};

export type PaymentTimelineEvent = {
  eventId: string;
  eventType: string;
  sellerOrderId?: string;
  sellerOrderReference?: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  buyerSafe: boolean;
};

export type PaymentAuthorizationScreenResponse = {
  checkoutSessionId: string;
  parentOrderPreview: { parentOrderReferencePreview: string; sellerOrderCount: number };
  paymentProviderOptions: PaymentProviderOption[];
  pricingSummary: PaymentAuthorizationPricingSummary;
  authorizationNotice: string;
  sellerAcceptanceSummary: {
    sellerOrderCount: number;
    acceptanceRequiredCount: number;
    acceptedCount: number;
    pendingCount: number;
    rejectedCount: number;
    expiredCount: number;
    partiallyAccepted: boolean;
    message: string;
  };
  sellerOrderAuthorizationStatuses: SellerOrderAuthorizationStatus[];
  digitalDeliveryEligibility: {
    eligible: boolean;
    status: string;
    message: string;
    eligibleSellerOrderIds: string[];
    blockedSellerOrderIds: string[];
    blockedReasons: string[];
  };
  paymentTimeline: PaymentTimelineEvent[];
};

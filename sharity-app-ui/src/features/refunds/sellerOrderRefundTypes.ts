export type ParentOrderRefundSummaryResponse = {
  parentOrderId: string;
  parentOrderReference: string;
  orderDate: string;
  totalSellerOrders: number;
  totalItems: number;
  orderStatus: string;
  paymentStatus: string;
  currency: string;
  sellerOrderRefundSummaries: SellerOrderRefundSummary[];
  availableActions: string[];
};

export type SellerOrderRefundSummary = {
  sellerOrderId: string;
  sellerOrderReference: string;
  sellerId: string;
  storeName: string;
  sellerAlias: string;
  productThumbnails: string[];
  itemCount: number;
  sellerOrderStatus: string;
  paymentStatus: string;
  captureStatus: string;
  digitalDeliveryStatus: string;
  refundEligibilityStatus: string;
  existingRefundStatus?: string;
  estimatedRefundableAmount: number;
  currency: string;
  availableActions: string[];
  items: SellerOrderItemRefundEligibility[];
};

export type SellerOrderItemRefundEligibility = {
  sellerOrderItemId: string;
  productId: string;
  listingId: string;
  productTitle: string;
  productImageUrl: string;
  productType: string;
  deliveryType: string;
  quantity: number;
  price: number;
  currency: string;
  refundRuleSummary: string;
  digitalAccessContext: DigitalRefundAccessContext;
  eligibilityStatus: string;
  eligibilityMessage: string;
  maxRefundAmount: number;
  minRefundAmount: number;
  adminReviewRequired: boolean;
  availableReasons: string[];
};

export type DigitalRefundAccessContext = {
  codeAssigned: boolean;
  codeRevealed: boolean;
  revealTimestamp?: string;
  fileDownloaded: boolean;
  downloadTimestamp?: string;
  manualDeliveryStatus: string;
  accessGrantedStatus: string;
  refundPolicyTemplate: string;
  adminReviewRequired: boolean;
  buyerSafeMessage: string;
};

export type RefundReasonOption = {
  reasonCode: string;
  label: string;
  description: string;
  productTypes: string[];
  evidenceRecommended: string;
  evidenceRequired: boolean;
  adminReviewMayBeRequired: boolean;
  customAmountAllowed: boolean;
};

export type RefundEstimateRequest = {
  parentOrderId: string;
  sellerOrderId: string;
  sellerOrderItemIds: string[];
  reasonCode: string;
  requestedAmount: number;
  evidenceIds: string[];
  buyerAcknowledgedDigitalPolicy: boolean;
};

export type RefundEstimateResponse = {
  suggestedRefundAmount: number;
  maxRefundAmount: number;
  minRefundAmount: number;
  refundBreakdown: RefundBreakdown;
  adminReviewRequired: boolean;
  sellerResponseRequired: boolean;
  sellerResponseDeadlinePreview: string;
  currency: string;
  messages: string[];
};

export type RefundBreakdown = {
  itemRefund: number;
  sellerCouponImpact: number;
  platformCouponImpact: number;
  buyerServiceFeeRefundable: boolean;
  buyerServiceFeeRefundAmount: number;
  sharityCreditReturnBehavior: string;
  taxRefundAmount: number;
  shippingRefundAmount: number;
  totalEstimatedRefund: number;
  refundMethodEstimate: string;
  currency: string;
};

export type RefundEvidenceItem = {
  evidenceId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl: string;
  uploadStatus: string;
  visibilityPolicy: string;
  uploadedAt: string;
};

export type SubmitRefundRequest = {
  parentOrderId: string;
  sellerOrderId: string;
  sellerOrderItemIds: string[];
  reasonCode: string;
  requestedAmount: number;
  evidenceIds: string[];
  buyerMessage: string;
  buyerAcknowledgedDigitalPolicy: boolean;
  buyerAcknowledgedRefundEstimateMayChange: boolean;
};

export type SubmitRefundResponse = {
  refundRequestId: string;
  status: string;
  sellerResponseRequired: boolean;
  sellerResponseDeadline: string;
  adminReviewRequired: boolean;
  payoutHoldCreated: boolean;
  nextRoute: string;
  message: string;
};

export type RefundTimelineEvent = {
  eventId: string;
  refundRequestId: string;
  eventType: string;
  actorType: string;
  title: string;
  message: string;
  timestamp: string;
  status: string;
  buyerSafe: boolean;
};

export type CancelRefundRequest = {
  reason: string;
  buyerAcknowledgedCancelImpact: boolean;
};

export type EscalateRefundRequest = {
  escalationReason: string;
  message: string;
  additionalEvidenceIds: string[];
  buyerAcknowledgedReviewRules: boolean;
};

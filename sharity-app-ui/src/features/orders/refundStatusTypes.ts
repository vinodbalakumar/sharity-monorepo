export type RefundStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'WAITING_FOR_SELLER_RESPONSE'
  | 'WAITING_FOR_BUYER_EVIDENCE'
  | 'ADMIN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'RETURN_REQUIRED'
  | 'RETURN_SHIPPED'
  | 'RETURN_DELIVERED'
  | 'DISPUTE_OPENED';

export type RefundRequestSummary = {
  lastUpdatedAt: string;
  marketplaceCode: 'DIGITAL' | 'ELECTRONICS';
  marketplaceName: string;
  orderId: string;
  orderReference: string;
  productImageUrl: string;
  productTitle: string;
  productType: string;
  reasonCode: string;
  reasonLabel: string;
  refundRequestId: string;
  sellerDisplayName: string;
  sellerId: string;
  status: RefundStatus;
  submittedAt: string;
};

export type RefundStatusSummary = {
  currentStatus: RefundStatus;
  nextStepMessage: string;
  requiresAdminReview: boolean;
  requiresBuyerEvidence: boolean;
  requiresSellerResponse: boolean;
  statusLabel: string;
};

export type EstimatedRefundAmount = {
  amount: number;
  calculationSummary: string;
  currency: 'USD';
  isEstimated: boolean;
  marketplaceFeeRefundStatus: string;
  shippingRefundStatus?: string;
  taxRefundStatus: string;
};

export type RefundTimelineEvent = {
  description: string;
  eventId: string;
  eventType: string;
  timestamp: string;
  title: string;
  visibility: 'BUYER_VISIBLE';
};

export type SellerResponseSummary = {
  buyerSafeMessage?: string;
  respondedAt?: string;
  responseAvailable: boolean;
  responseStatus?: string;
};

export type AdminDecisionSummary = {
  buyerSafeReason?: string;
  decidedAt?: string;
  decisionAvailable: boolean;
  decisionStatus?: string;
  nextStep?: string;
};

export type ReturnInstructions = {
  instructions: string;
  returnDeadline?: string;
  returnLabelAvailable: boolean;
  returnMethod: string;
  returnRequired: boolean;
  returnTrackingStatus?: string;
};

export type RefundAvailableActions = {
  canBackToOrder: boolean;
  canCancelRequest: boolean;
  canContactSupport: boolean;
  canOpenDispute: boolean;
  canUploadEvidence: boolean;
  canViewReceipt: boolean;
};

export type RefundStatusResponse = {
  adminDecision?: AdminDecisionSummary;
  availableActions: RefundAvailableActions;
  digitalAccessSummary?: {
    accessGranted: boolean;
    codeRevealTimestamp?: string;
    codeRevealed: boolean;
    fileDownloadTimestamp?: string;
    fileDownloaded: boolean;
    locationConsentAccepted: boolean;
    reviewImpact: string;
  };
  estimatedRefund: EstimatedRefundAmount;
  refundRequest: RefundRequestSummary;
  returnInstructions?: ReturnInstructions;
  sellerResponse?: SellerResponseSummary;
  statusSummary: RefundStatusSummary;
  timeline: RefundTimelineEvent[];
};

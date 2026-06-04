export type DisputeReviewStatus =
  | 'DISPUTE_SUBMITTED'
  | 'UNDER_SHARITY_REVIEW'
  | 'WAITING_FOR_SELLER_RESPONSE'
  | 'WAITING_FOR_BUYER_EVIDENCE'
  | 'EVIDENCE_SUBMITTED'
  | 'ADMIN_REVIEWING'
  | 'DECISION_MADE'
  | 'FULL_REFUND_APPROVED'
  | 'PARTIAL_REFUND_APPROVED'
  | 'REPLACEMENT_REQUIRED'
  | 'SELLER_MUST_PROVIDE_VALID_CODE'
  | 'BUYER_RETURN_REQUIRED'
  | 'DISPUTE_REJECTED'
  | 'SELLER_WARNING_SUSPENSION'
  | 'ACCOUNT_RISK_REVIEW'
  | 'DISPUTE_CLOSED';

export type DisputeSummary = {
  disputeId: string;
  orderId: string;
  refundRequestId?: string;
  orderReference: string;
  productTitle: string;
  productImageUrl: string;
  marketplaceCode: 'DIGITAL' | 'ELECTRONICS';
  marketplaceName: string;
  sellerId: string;
  sellerDisplayName: string;
  productType: string;
  reasonCode: string;
  reasonLabel: string;
  status: DisputeReviewStatus;
  submittedAt: string;
  lastUpdatedAt: string;
};

export type DisputeStatusSummary = {
  currentStatus: DisputeReviewStatus;
  statusLabel: string;
  nextStepMessage: string;
  requiresBuyerEvidence: boolean;
  requiresSellerResponse: boolean;
  requiresAdminReview: boolean;
  decisionMade: boolean;
  closed: boolean;
};

export type DisputeEstimatedRefund = {
  amount: number;
  currency: 'USD';
  isEstimated: boolean;
  calculationSummary: string;
  marketplaceFeeRefundStatus: string;
  shippingRefundStatus?: string;
  taxRefundStatus: string;
};

export type DisputeDigitalAccessSummary = {
  codeRevealed: boolean;
  codeRevealTimestamp?: string;
  locationConsentAccepted: boolean;
  fileDownloaded: boolean;
  fileDownloadTimestamp?: string;
  accessGranted: boolean;
  reviewImpact: string;
};

export type DisputeShippingReturnSummary = {
  shippingStatus: string;
  deliveryStatus: string;
  trackingAvailable: boolean;
  returnRequired: boolean;
  returnInstructionsStatus: string;
  returnShipmentStatus: string;
};

export type DisputeSellerResponseSummary = {
  responseAvailable: boolean;
  responseStatus?: string;
  buyerSafeMessage?: string;
  respondedAt?: string;
};

export type DisputeAdminDecisionSummary = {
  decisionAvailable: boolean;
  decisionStatus?: string;
  finalOutcome?: string;
  buyerSafeReason?: string;
  decidedAt?: string;
  nextStep?: string;
};

export type DisputeOutcomeSummary = {
  outcomeCode: string;
  label: string;
  description: string;
  status: 'POSSIBLE' | 'PENDING' | 'FINAL' | 'NOT_AVAILABLE';
};

export type DisputeTimelineEvent = {
  eventId: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  visibility: 'BUYER_VISIBLE';
};

export type DisputeEvidenceItem = {
  evidenceId: string;
  evidenceType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl?: string;
  uploadStatus: 'REQUESTED' | 'UPLOADED' | 'REVIEWING' | 'ACCEPTED' | 'FAILED';
  uploadedAt?: string;
};

export type DisputeAvailableActions = {
  canUploadEvidence: boolean;
  canCloseDispute: boolean;
  canContactSupport: boolean;
  canViewReceipt: boolean;
  canViewRefundStatus: boolean;
  canGoToLibrary: boolean;
  canTrackPackage: boolean;
  canBackToOrder: boolean;
};

export type DisputeStatusResponse = {
  dispute: DisputeSummary;
  statusSummary: DisputeStatusSummary;
  estimatedRefund?: DisputeEstimatedRefund;
  digitalAccessSummary?: DisputeDigitalAccessSummary;
  shippingReturnSummary?: DisputeShippingReturnSummary;
  sellerResponse?: DisputeSellerResponseSummary;
  adminDecision?: DisputeAdminDecisionSummary;
  possibleOutcomes: DisputeOutcomeSummary[];
  finalOutcome?: DisputeOutcomeSummary;
  evidence: DisputeEvidenceItem[];
  timeline: DisputeTimelineEvent[];
  availableActions: DisputeAvailableActions;
};

export type UploadDisputeEvidenceResponse = {
  evidence: DisputeEvidenceItem;
  status: DisputeReviewStatus;
  nextStep: string;
};

export type CloseDisputeResponse = {
  disputeId: string;
  status: DisputeReviewStatus;
  closedAt: string;
  message: string;
};

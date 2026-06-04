export type DisputeEligibilityStatus =
  | 'ELIGIBLE'
  | 'REQUIRES_REFUND_REQUEST_FIRST'
  | 'ADMIN_REVIEW_ALLOWED'
  | 'SELLER_RESPONSE_REQUIRED'
  | 'NOT_ELIGIBLE';

export type DisputeReasonCode =
  | 'REFUND_REJECTED'
  | 'SELLER_NOT_RESPONDING'
  | 'DIGITAL_CODE_INVALID'
  | 'DIGITAL_CODE_ALREADY_USED'
  | 'DOWNLOAD_ACCESS_NOT_WORKING'
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_DAMAGED'
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'SELLER_ABUSE_SCAM_CONCERN'
  | 'PAYMENT_REFUND_ISSUE'
  | 'OTHER_SERIOUS_ISSUE';

export type DisputeReasonOption = {
  adminReviewRequired: boolean;
  guidance: string;
  label: string;
  productType: 'DIGITAL' | 'ELECTRONICS' | 'ANY';
  reasonCode: DisputeReasonCode;
  requiresEvidence: boolean;
  requiresMessage: boolean;
  requiresRefundRequestFirst: boolean;
  sellerResponseRequired: boolean;
};

export type DisputeEligibilityResponse = {
  allowedReasons: DisputeReasonOption[];
  eligible: boolean;
  eligibilityStatus: DisputeEligibilityStatus;
  evidenceRequired: boolean;
  existingDisputeId?: string;
  orderId: string;
  reason: string;
  requiresAdminReview: boolean;
  requiresRefundRequestFirst: boolean;
  requiresSellerResponse: boolean;
};

export type DisputeOrderSummary = {
  currency: 'USD';
  marketplaceCode: 'DIGITAL' | 'ELECTRONICS';
  marketplaceName: string;
  orderId: string;
  orderReference: string;
  orderStatus: string;
  paymentStatus: string;
  productImageUrl: string;
  productTitle: string;
  sellerDisplayName: string;
  sellerId: string;
  totalAmount: number;
};

export type DisputeDigitalAccessSummary = {
  accessGranted: boolean;
  codeRevealTimestamp?: string;
  codeRevealed: boolean;
  fileDownloadTimestamp?: string;
  fileDownloaded: boolean;
  refundEligibilityAfterAccess: string;
};

export type DisputeShippingSummary = {
  deliveredAt?: string;
  deliveryStatus: string;
  shippingStatus: string;
  trackingAvailable: boolean;
};

export type DisputeContextResponse = {
  digitalAccessSummary?: DisputeDigitalAccessSummary;
  orderSummary: DisputeOrderSummary;
  paymentSummary: string;
  refundSummary?: string;
  sellerResponseSummary?: string;
  shippingSummary?: DisputeShippingSummary;
};

export type DisputeEvidenceUploadResponse = {
  evidenceId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl?: string;
  uploadStatus: 'UPLOADED' | 'FAILED' | 'SCANNING';
};

export type CreateDisputeRequest = {
  buyerAcknowledgedDisputeWarning: boolean;
  evidenceIds: string[];
  expectedResolution: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'REPLACEMENT' | 'VALID_CODE' | 'ADMIN_REVIEW';
  message: string;
  reasonCode: DisputeReasonCode;
  refundRequestId?: string | null;
};

export type CreateDisputeResponse = {
  createdAt: string;
  disputeId: string;
  nextStep: string;
  requiresAdminReview: boolean;
  requiresSellerResponse: boolean;
  status: 'SUBMITTED' | 'ADMIN_REVIEW_REQUIRED' | 'SELLER_RESPONSE_REQUIRED';
};

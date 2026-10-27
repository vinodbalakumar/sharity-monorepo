export type RefundEligibilityStatus =
  | 'ELIGIBLE'
  | 'ADMIN_REVIEW_REQUIRED'
  | 'SELLER_RESPONSE_REQUIRED'
  | 'NOT_ELIGIBLE'
  | 'RETURN_WINDOW_CLOSED'
  | 'DIGITAL_ACCESS_USED';

export type RefundReasonCode =
  | 'CODE_INVALID'
  | 'CODE_ALREADY_USED'
  | 'WRONG_PRODUCT'
  | 'PRODUCT_NOT_AS_DESCRIBED'
  | 'FILE_DOWNLOAD_FAILED'
  | 'FILE_CORRUPTED'
  | 'SELLER_DID_NOT_DELIVER'
  | 'SUBSCRIPTION_ACCESS_NOT_WORKING'
  | 'DUPLICATE_PURCHASE'
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_DAMAGED'
  | 'WRONG_ITEM_RECEIVED'
  | 'MISSING_ACCESSORIES'
  | 'DEFECTIVE_PRODUCT'
  | 'COUNTERFEIT_FAKE_PRODUCT'
  | 'CHANGED_MY_MIND'
  | 'DELIVERY_ISSUE'
  | 'OTHER';

export type RefundReasonOption = {
  adminReviewRequired: boolean;
  label: string;
  productType: 'DIGITAL' | 'ELECTRONICS';
  reasonCode: RefundReasonCode;
  requiresEvidence: boolean;
  requiresMessage: boolean;
  sellerResponseRequired: boolean;
};

export type DigitalAccessHistorySummary = {
  accessGranted: boolean;
  codeRevealTimestamp?: string;
  codeRevealed: boolean;
  courseAccessed: boolean;
  fileDownloadTimestamp?: string;
  fileDownloaded: boolean;
  locationConsentAccepted: boolean;
  refundEligibilityAfterAccess: string;
  subscriptionOpened: boolean;
};

export type ElectronicsReturnPolicySummary = {
  deliveryStatus: string;
  productCondition: string;
  returnMethodDecisionStatus: string;
  returnWindowStatus: string;
  sellerReturnPolicy: string;
  warrantyStatus: string;
};

export type RefundEligibilityResponse = {
  allowedReasons: RefundReasonOption[];
  digitalAccessHistory?: DigitalAccessHistorySummary;
  electronicsReturnPolicy?: ElectronicsReturnPolicySummary;
  eligible: boolean;
  eligibilityStatus: RefundEligibilityStatus;
  evidenceRequired: boolean;
  orderId: string;
  reason: string;
  requiresAdminReview: boolean;
  requiresSellerResponse: boolean;
};

export type EvidenceUploadResponse = {
  evidenceId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl?: string;
  uploadStatus: 'UPLOADED' | 'FAILED' | 'SCANNING';
};

export type SubmitRefundRequest = {
  buyerAcknowledgedFalseClaimWarning: boolean;
  evidenceIds: string[];
  message: string;
  reasonCode: RefundReasonCode;
  requestedResolution: 'REFUND' | 'RETURN_AND_REFUND' | 'REPLACEMENT' | 'ADMIN_REVIEW';
};

export type SubmitRefundResponse = {
  createdAt: string;
  nextStep: string;
  refundRequestId: string;
  requiresAdminReview: boolean;
  requiresSellerResponse: boolean;
  status: 'SUBMITTED' | 'ADMIN_REVIEW_REQUIRED' | 'SELLER_RESPONSE_REQUIRED';
};

export type RefundFormConfigResponse = {
  evidenceTypes: string[];
  maxEvidenceFiles: number;
  requestedResolutions: SubmitRefundRequest['requestedResolution'][];
};

export type LatestRefundRequestResponse = {
  createdAt: string;
  refundRequestId: string;
  status: string;
} | null;

import { getBuyerOrderDetails } from './orderDetailsMockApi';
import type {
  EvidenceUploadResponse,
  LatestRefundRequestResponse,
  RefundEligibilityResponse,
  RefundFormConfigResponse,
  RefundReasonOption,
  SubmitRefundRequest,
  SubmitRefundResponse
} from './refundTypes';

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const digitalReasons: RefundReasonOption[] = [
  reason('CODE_INVALID', 'Code invalid', 'DIGITAL', true, true, false, true),
  reason('CODE_ALREADY_USED', 'Code already used', 'DIGITAL', true, true, false, true),
  reason('WRONG_PRODUCT', 'Wrong product', 'DIGITAL', true, false, true, false),
  reason('PRODUCT_NOT_AS_DESCRIBED', 'Product not as described', 'DIGITAL', true, true, true, true),
  reason('FILE_DOWNLOAD_FAILED', 'File download failed', 'DIGITAL', true, true, false, true),
  reason('FILE_CORRUPTED', 'File corrupted', 'DIGITAL', true, true, false, true),
  reason('SELLER_DID_NOT_DELIVER', 'Seller did not deliver', 'DIGITAL', false, true, true, false),
  reason('SUBSCRIPTION_ACCESS_NOT_WORKING', 'Subscription/access not working', 'DIGITAL', true, true, true, true),
  reason('DUPLICATE_PURCHASE', 'Duplicate purchase', 'DIGITAL', false, false, false, false),
  reason('OTHER', 'Other', 'DIGITAL', false, true, true, true)
];

const electronicsReasons: RefundReasonOption[] = [
  reason('ITEM_NOT_RECEIVED', 'Item not received', 'ELECTRONICS', true, true, true, false),
  reason('ITEM_DAMAGED', 'Item damaged', 'ELECTRONICS', true, true, true, true),
  reason('PRODUCT_NOT_AS_DESCRIBED', 'Item not as described', 'ELECTRONICS', true, true, true, true),
  reason('WRONG_ITEM_RECEIVED', 'Wrong item received', 'ELECTRONICS', true, true, true, true),
  reason('MISSING_ACCESSORIES', 'Missing accessories', 'ELECTRONICS', true, true, true, false),
  reason('DEFECTIVE_PRODUCT', 'Defective product', 'ELECTRONICS', true, true, true, true),
  reason('COUNTERFEIT_FAKE_PRODUCT', 'Counterfeit/fake product', 'ELECTRONICS', true, true, false, true),
  reason('CHANGED_MY_MIND', 'Changed my mind', 'ELECTRONICS', false, false, true, false),
  reason('DELIVERY_ISSUE', 'Delivery issue', 'ELECTRONICS', true, true, true, false),
  reason('OTHER', 'Other', 'ELECTRONICS', false, true, true, true)
];

export async function getRefundEligibility(orderId: string): Promise<RefundEligibilityResponse | null> {
  await wait();
  const details = await getBuyerOrderDetails(orderId);
  if (!details) {
    return null;
  }

  const isDigital = details.order.marketplaceCode === 'DIGITAL';
  const accessUsed = isDigital && ['CODE_REVEAL_AVAILABLE', 'DOWNLOAD_READY', 'ACCESS_READY'].includes(details.digitalAccessSummary?.accessStatus ?? '');
  const alreadyRefunded = details.order.refundDisputeStatus === 'REFUNDED' || details.order.paymentStatus === 'REFUNDED';

  if (alreadyRefunded) {
    return {
      allowedReasons: isDigital ? digitalReasons : electronicsReasons,
      eligible: false,
      eligibilityStatus: 'NOT_ELIGIBLE',
      evidenceRequired: false,
      orderId,
      reason: 'This order has already been refunded.',
      requiresAdminReview: false,
      requiresSellerResponse: false
    };
  }

  if (isDigital) {
    return {
      allowedReasons: digitalReasons,
      digitalAccessHistory: {
        accessGranted: true,
        codeRevealTimestamp: accessUsed ? '2026-06-03T10:45:00Z' : undefined,
        codeRevealed: accessUsed,
        courseAccessed: false,
        fileDownloadTimestamp: details.digitalAccessSummary?.accessStatus === 'DOWNLOAD_READY' ? '2026-06-03T10:47:00Z' : undefined,
        fileDownloaded: details.digitalAccessSummary?.accessStatus === 'DOWNLOAD_READY',
        locationConsentAccepted: accessUsed,
        refundEligibilityAfterAccess: accessUsed ? 'Admin review required after digital access.' : 'Eligible before code reveal or file download.',
        subscriptionOpened: false
      },
      eligible: true,
      eligibilityStatus: accessUsed ? 'DIGITAL_ACCESS_USED' : 'ELIGIBLE',
      evidenceRequired: accessUsed,
      orderId,
      reason: accessUsed ? 'Digital access was granted. Refunds may require admin review.' : 'This digital order appears eligible for a refund request.',
      requiresAdminReview: accessUsed,
      requiresSellerResponse: false
    };
  }

  return {
    allowedReasons: electronicsReasons,
    electronicsReturnPolicy: {
      deliveryStatus: details.shippingSummary?.shippingStatus ?? 'TRACKING_NOT_AVAILABLE',
      productCondition: details.items[0]?.condition ?? 'Condition provided by seller',
      returnMethodDecisionStatus: 'Return method will be decided after review.',
      returnWindowStatus: details.order.orderStatus === 'DELIVERED' ? 'Inside return review window' : 'Return window starts after delivery',
      sellerReturnPolicy: 'Seller response may be requested before a final decision.',
      warrantyStatus: 'Warranty review depends on item condition and seller policy.'
    },
    eligible: true,
    eligibilityStatus: details.order.orderStatus === 'DELIVERED' ? 'SELLER_RESPONSE_REQUIRED' : 'ELIGIBLE',
    evidenceRequired: details.order.orderStatus === 'DELIVERED',
    orderId,
    reason: 'Electronics return/refund review depends on delivery status, condition, and seller policy.',
    requiresAdminReview: details.order.refundDisputeStatus.includes('DISPUTE'),
    requiresSellerResponse: true
  };
}

export async function getRefundRequestConfig(orderId: string): Promise<RefundFormConfigResponse> {
  await wait(140);
  return {
    evidenceTypes: ['Screenshot', 'Photo', 'Video', 'PDF', 'Error message file'],
    maxEvidenceFiles: 5,
    requestedResolutions: ['REFUND', 'RETURN_AND_REFUND', 'REPLACEMENT', 'ADMIN_REVIEW']
  };
}

export async function getLatestRefundRequest(orderId: string): Promise<LatestRefundRequestResponse> {
  await wait(120);
  if (orderId === 'order-delivered-004') {
    return null;
  }
  return null;
}

export async function uploadRefundEvidence(orderId: string, fileName: string, fileType: string): Promise<EvidenceUploadResponse> {
  await wait(260);
  return {
    evidenceId: `evidence-${orderId}-${Date.now()}`,
    fileName,
    fileSize: fileType.startsWith('image') ? 842000 : 1240000,
    fileType,
    previewUrl: fileType.startsWith('image') ? 'https://images.unsplash.com/photo-1580835239846-5bb9ce03c8c3?auto=format&fit=crop&w=900&q=80' : undefined,
    uploadStatus: 'UPLOADED'
  };
}

export async function submitRefundRequest(orderId: string, request: SubmitRefundRequest): Promise<SubmitRefundResponse> {
  await wait(320);
  const eligibility = await getRefundEligibility(orderId);
  return {
    createdAt: new Date().toISOString(),
    nextStep: eligibility?.requiresAdminReview
      ? 'Sharity admin review will check the order, evidence, and access history.'
      : eligibility?.requiresSellerResponse
        ? 'The seller may be asked to respond before a decision is made.'
        : 'Sharity will review the request and update the refund status.',
    refundRequestId: `refund-${orderId}-${request.reasonCode.toLowerCase()}`,
    requiresAdminReview: eligibility?.requiresAdminReview ?? false,
    requiresSellerResponse: eligibility?.requiresSellerResponse ?? false,
    status: eligibility?.requiresAdminReview ? 'ADMIN_REVIEW_REQUIRED' : eligibility?.requiresSellerResponse ? 'SELLER_RESPONSE_REQUIRED' : 'SUBMITTED'
  };
}

function reason(
  reasonCode: RefundReasonOption['reasonCode'],
  label: string,
  productType: RefundReasonOption['productType'],
  requiresEvidence: boolean,
  requiresMessage: boolean,
  sellerResponseRequired: boolean,
  adminReviewRequired: boolean
): RefundReasonOption {
  return {
    adminReviewRequired,
    label,
    productType,
    reasonCode,
    requiresEvidence,
    requiresMessage,
    sellerResponseRequired
  };
}

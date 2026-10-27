import { getBuyerOrderDetails } from './orderDetailsMockApi';
import type {
  CreateDisputeRequest,
  CreateDisputeResponse,
  DisputeContextResponse,
  DisputeEligibilityResponse,
  DisputeEvidenceUploadResponse,
  DisputeReasonOption
} from './disputeTypes';

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const reasons: DisputeReasonOption[] = [
  option('REFUND_REJECTED', 'Refund request rejected', 'ANY', true, true, true, false, true, 'Explain why the decision should be reviewed again.'),
  option('SELLER_NOT_RESPONDING', 'Seller not responding', 'ANY', true, true, false, true, true, 'Tell us how long you have been waiting and what help you expected.'),
  option('DIGITAL_CODE_INVALID', 'Digital code invalid', 'DIGITAL', true, true, false, false, true, 'Upload screenshots showing the redemption failure.'),
  option('DIGITAL_CODE_ALREADY_USED', 'Digital code already used', 'DIGITAL', true, true, false, false, true, 'Upload the already-used message or platform error.'),
  option('DOWNLOAD_ACCESS_NOT_WORKING', 'Download/access not working', 'DIGITAL', true, true, false, true, true, 'Upload screenshots or error messages showing the access problem.'),
  option('ITEM_NOT_RECEIVED', 'Electronics item not received', 'ELECTRONICS', true, true, false, true, false, 'Check tracking first, then explain what happened.'),
  option('ITEM_DAMAGED', 'Electronics item damaged', 'ELECTRONICS', true, true, false, true, true, 'Upload clear photos or videos showing the issue.'),
  option('ITEM_NOT_AS_DESCRIBED', 'Item not as described', 'ANY', true, true, false, true, true, 'Explain what differs from the listing and upload proof.'),
  option('SELLER_ABUSE_SCAM_CONCERN', 'Seller abuse/scam concern', 'ANY', true, true, false, false, true, 'Include messages or proof of policy violation.'),
  option('PAYMENT_REFUND_ISSUE', 'Payment/refund issue', 'ANY', true, true, false, false, true, 'Describe the payment or refund problem with safe references.'),
  option('OTHER_SERIOUS_ISSUE', 'Other serious issue', 'ANY', true, true, false, true, true, 'Explain what happened and what resolution you expect.')
];

export async function getDisputeEligibility(orderId: string): Promise<DisputeEligibilityResponse | null> {
  await wait();
  const details = await getBuyerOrderDetails(orderId);
  if (!details) {
    return null;
  }
  if (orderId === 'order-disputed-006') {
    return {
      allowedReasons: reasons,
      eligible: false,
      eligibilityStatus: 'NOT_ELIGIBLE',
      evidenceRequired: true,
      existingDisputeId: 'dispute-order-disputed-006',
      orderId,
      reason: 'A dispute already exists for this order.',
      requiresAdminReview: true,
      requiresRefundRequestFirst: false,
      requiresSellerResponse: true
    };
  }
  return {
    allowedReasons: reasons.filter((reason) => reason.productType === 'ANY' || reason.productType === details.order.marketplaceCode),
    eligible: true,
    eligibilityStatus: details.order.marketplaceCode === 'DIGITAL' ? 'ADMIN_REVIEW_ALLOWED' : 'SELLER_RESPONSE_REQUIRED',
    evidenceRequired: true,
    orderId,
    reason: 'This issue can be sent to Sharity Review.',
    requiresAdminReview: true,
    requiresRefundRequestFirst: false,
    requiresSellerResponse: details.order.marketplaceCode === 'ELECTRONICS'
  };
}

export async function getDisputeContext(orderId: string): Promise<DisputeContextResponse | null> {
  await wait(180);
  const details = await getBuyerOrderDetails(orderId);
  if (!details) {
    return null;
  }
  const isDigital = details.order.marketplaceCode === 'DIGITAL';
  return {
    digitalAccessSummary: isDigital
      ? {
          accessGranted: true,
          codeRevealTimestamp: '2026-06-03T10:45:00Z',
          codeRevealed: true,
          fileDownloaded: false,
          refundEligibilityAfterAccess: 'Admin review may be required after digital access.'
        }
      : undefined,
    orderSummary: {
      currency: details.order.currency,
      marketplaceCode: details.order.marketplaceCode === 'DIGITAL' ? 'DIGITAL' : 'ELECTRONICS',
      marketplaceName: details.order.marketplaceName,
      orderId,
      orderReference: details.order.orderReference,
      orderStatus: details.order.orderStatus,
      paymentStatus: details.order.paymentStatus,
      productImageUrl: details.items[0]?.productImageUrl ?? '',
      productTitle: details.items[0]?.productTitle ?? 'Order item',
      sellerDisplayName: details.seller.sellerDisplayName,
      sellerId: details.seller.sellerId,
      totalAmount: details.order.totalAmount
    },
    paymentSummary: `${details.order.paymentStatus} - safe payment details only`,
    refundSummary: details.order.refundDisputeStatus === 'NONE' ? 'No active refund request found.' : details.order.refundDisputeStatus,
    sellerResponseSummary: details.order.refundDisputeStatus.includes('DISPUTE') ? 'Seller response may be requested by Sharity Review.' : 'No buyer-visible seller response yet.',
    shippingSummary: !isDigital
      ? {
          deliveredAt: details.order.orderStatus === 'DELIVERED' ? details.order.updatedAt : undefined,
          deliveryStatus: details.order.orderStatus,
          shippingStatus: details.shippingSummary?.shippingStatus ?? 'TRACKING_NOT_AVAILABLE',
          trackingAvailable: details.shippingSummary?.trackingAvailable ?? false
        }
      : undefined
  };
}

export async function getExistingDispute(orderId: string): Promise<{ disputeId: string; status: string } | null> {
  await wait(120);
  return orderId === 'order-disputed-006' ? { disputeId: 'dispute-order-disputed-006', status: 'DISPUTE_OPENED' } : null;
}

export async function uploadDisputeEvidence(orderId: string): Promise<DisputeEvidenceUploadResponse> {
  await wait(240);
  return {
    evidenceId: `dispute-evidence-${orderId}-${Date.now()}`,
    fileName: 'dispute-evidence.png',
    fileSize: 930000,
    fileType: 'image/png',
    previewUrl: 'https://images.unsplash.com/photo-1580835239846-5bb9ce03c8c3?auto=format&fit=crop&w=900&q=80',
    uploadStatus: 'UPLOADED'
  };
}

export async function createDispute(orderId: string, request: CreateDisputeRequest): Promise<CreateDisputeResponse> {
  await wait(320);
  return {
    createdAt: new Date().toISOString(),
    disputeId: `dispute-${orderId}-${request.reasonCode.toLowerCase()}`,
    nextStep: 'Sharity Review will inspect the order, evidence, seller response, and marketplace rules.',
    requiresAdminReview: true,
    requiresSellerResponse: ['ITEM_DAMAGED', 'ITEM_NOT_RECEIVED', 'SELLER_NOT_RESPONDING'].includes(request.reasonCode),
    status: ['ITEM_DAMAGED', 'ITEM_NOT_RECEIVED', 'SELLER_NOT_RESPONDING'].includes(request.reasonCode) ? 'SELLER_RESPONSE_REQUIRED' : 'ADMIN_REVIEW_REQUIRED'
  };
}

function option(
  reasonCode: DisputeReasonOption['reasonCode'],
  label: string,
  productType: DisputeReasonOption['productType'],
  requiresEvidence: boolean,
  requiresMessage: boolean,
  requiresRefundRequestFirst: boolean,
  sellerResponseRequired: boolean,
  adminReviewRequired: boolean,
  guidance: string
): DisputeReasonOption {
  return {
    adminReviewRequired,
    guidance,
    label,
    productType,
    reasonCode,
    requiresEvidence,
    requiresMessage,
    requiresRefundRequestFirst,
    sellerResponseRequired
  };
}

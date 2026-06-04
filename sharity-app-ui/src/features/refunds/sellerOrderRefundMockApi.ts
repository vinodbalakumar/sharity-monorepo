import type {
  ParentOrderRefundSummaryResponse,
  RefundEstimateResponse,
  RefundEvidenceItem,
  RefundReasonOption,
  RefundTimelineEvent,
  SellerOrderItemRefundEligibility,
  SubmitRefundResponse
} from './sellerOrderRefundTypes';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export async function getParentOrderRefundSummary(): Promise<ParentOrderRefundSummaryResponse> {
  return {
    parentOrderId: 'parent-order-1000',
    parentOrderReference: 'SH-1000',
    orderDate: '2026-06-01',
    totalSellerOrders: 3,
    totalItems: 5,
    orderStatus: 'PARTIALLY_DELIVERED',
    paymentStatus: 'AUTHORIZED_CAPTURED_BY_SELLER_ORDER',
    currency: 'USD',
    availableActions: ['SELECT_SELLER_ORDER', 'VIEW_TIMELINE', 'MESSAGE_SELLER_SAFELY'],
    sellerOrderRefundSummaries: [
      sellerOrder('seller-order-a', 'SH-1000-A', 'Game Code Hub', 'Digital access delivered', 'ADMIN_REVIEW_MAY_BE_REQUIRED', 18),
      sellerOrder('seller-order-b', 'SH-1000-B', 'SoftVault', 'Manual delivery pending', 'ELIGIBLE', 12),
      sellerOrder('seller-order-c', 'SH-1000-C', 'Device Depot', 'Physical return placeholder', 'PHYSICAL_RETURN_LATER', 42)
    ]
  };
}

export async function getRefundReasons(): Promise<RefundReasonOption[]> {
  return [
    reason('DIGITAL_CODE_NOT_WORKING', 'Digital code not working', 'The code did not redeem successfully.', 'Screenshot of error', true, true),
    reason('DIGITAL_CODE_ALREADY_USED', 'Digital code already used', 'The platform says the code was already redeemed.', 'Already-used message', true, true),
    reason('DIGITAL_ITEM_NOT_RECEIVED', 'Digital item not received', 'Access or delivery did not arrive.', 'Order/access screen', false, false),
    reason('SECURE_DOWNLOAD_ISSUE', 'Secure download issue', 'The protected file could not be downloaded.', 'Download error', false, true),
    reason('MANUAL_DELIVERY_ISSUE', 'Manual delivery issue', 'Seller manual delivery was not completed.', 'Seller message proof', false, false),
    reason('WRONG_ITEM_ACCESS', 'Wrong item/access', 'The delivered access does not match the listing.', 'Listing and access screenshots', true, true),
    reason('SELLER_DID_NOT_ACCEPT_ORDER', 'Seller did not accept order', 'Seller acceptance timed out.', 'No evidence usually needed', false, false),
    reason('SELLER_REJECTED_ORDER', 'Seller rejected order', 'Seller rejected the seller order.', 'No evidence usually needed', false, false),
    reason('PHYSICAL_ELECTRONICS_RETURN_LATER', 'Physical/electronics return later', 'Future return workflow placeholder.', 'Product condition photo later', false, true),
    reason('OTHER_ISSUE', 'Other issue', 'Something else happened.', 'Helpful screenshot or note', false, true)
  ];
}

export async function getRefundEstimate(): Promise<RefundEstimateResponse> {
  return {
    suggestedRefundAmount: 18,
    maxRefundAmount: 20,
    minRefundAmount: 0,
    adminReviewRequired: true,
    sellerResponseRequired: true,
    sellerResponseDeadlinePreview: new Date(now + dayMs).toISOString(),
    currency: 'USD',
    messages: ['Digital code was revealed, so Sharity Review may be required.', 'Refund affects only seller order SH-1000-A by default.'],
    refundBreakdown: {
      itemRefund: 20,
      sellerCouponImpact: -2,
      platformCouponImpact: 0,
      buyerServiceFeeRefundable: false,
      buyerServiceFeeRefundAmount: 0,
      sharityCreditReturnBehavior: 'Later-phase placeholder: refund credit may return based on credit type.',
      taxRefundAmount: 0,
      shippingRefundAmount: 0,
      totalEstimatedRefund: 18,
      refundMethodEstimate: 'Original payment method, after seller/admin review',
      currency: 'USD'
    }
  };
}

export async function uploadRefundEvidence(): Promise<RefundEvidenceItem> {
  return {
    evidenceId: 'evidence-001',
    fileName: 'code-error-screenshot.png',
    fileType: 'image/png',
    fileSize: 240000,
    previewUrl: 'marketplace/placeholders/gift_cards.png',
    uploadStatus: 'UPLOADED',
    visibilityPolicy: 'May be shared with seller/admin based on policy',
    uploadedAt: new Date(now).toISOString()
  };
}

export async function submitRefund(): Promise<SubmitRefundResponse> {
  return {
    refundRequestId: 'refund-seller-order-001',
    status: 'SELLER_RESPONSE_PENDING',
    sellerResponseRequired: true,
    sellerResponseDeadline: new Date(now + dayMs).toISOString(),
    adminReviewRequired: true,
    payoutHoldCreated: true,
    nextRoute: '/refunds/refund-seller-order-001/timeline',
    message: 'Refund request submitted and payout hold created for the selected seller order.'
  };
}

export async function getRefundTimeline(): Promise<RefundTimelineEvent[]> {
  return [
    event('timeline-1', 'Refund requested', 'Buyer submitted evidence for seller order SH-1000-A.', 'BUYER', 'COMPLETED', -2),
    event('timeline-2', 'Seller response pending', 'Seller has 24 hours to respond before Sharity may review.', 'SELLER', 'PENDING', -1),
    event('timeline-3', 'Sharity Review available', 'Escalation can open if seller rejects or deadline passes.', 'SHARITY', 'AVAILABLE', 0)
  ];
}

function sellerOrder(id: string, reference: string, storeName: string, deliveryStatus: string, eligibility: string, amount: number) {
  const item = refundItem(`${id}-item-1`, storeName, deliveryStatus, amount);
  return {
    sellerOrderId: id,
    sellerOrderReference: reference,
    sellerId: id.replace('seller-order', 'seller'),
    storeName,
    sellerAlias: storeName.replace(/\s/g, ''),
    productThumbnails: ['marketplace/placeholders/gift_cards.png'],
    itemCount: 1,
    sellerOrderStatus: deliveryStatus.includes('Physical') ? 'DELIVERED_PLACEHOLDER' : 'DIGITAL_ACCESS_READY',
    paymentStatus: 'AUTHORIZED',
    captureStatus: 'CAPTURED_FOR_ACCEPTED_SELLER_ORDER',
    digitalDeliveryStatus: deliveryStatus,
    refundEligibilityStatus: eligibility,
    existingRefundStatus: eligibility === 'ADMIN_REVIEW_MAY_BE_REQUIRED' ? 'NONE' : undefined,
    estimatedRefundableAmount: amount,
    currency: 'USD',
    availableActions: ['SELECT_SELLER_ORDER', 'MESSAGE_SELLER_SAFELY'],
    items: [item]
  };
}

function refundItem(id: string, storeName: string, deliveryStatus: string, amount: number): SellerOrderItemRefundEligibility {
  const codeRevealed = deliveryStatus.includes('delivered');
  return {
    sellerOrderItemId: id,
    productId: `product-${id}`,
    listingId: `listing-${id}`,
    productTitle: `${storeName} digital item`,
    productImageUrl: 'marketplace/placeholders/gift_cards.png',
    productType: deliveryStatus.includes('Physical') ? 'ELECTRONICS_PLACEHOLDER' : 'DIGITAL_CODE',
    deliveryType: deliveryStatus.includes('Physical') ? 'PHYSICAL_RETURN_LATER' : 'SECURE_DIGITAL_ACCESS',
    quantity: 1,
    price: amount,
    currency: 'USD',
    refundRuleSummary: codeRevealed ? 'After reveal, refund may require Sharity Review.' : 'Before reveal/manual delivery, refund is usually simpler.',
    digitalAccessContext: {
      codeAssigned: !deliveryStatus.includes('Physical'),
      codeRevealed,
      revealTimestamp: codeRevealed ? new Date(now - 2 * dayMs).toISOString() : undefined,
      fileDownloaded: false,
      manualDeliveryStatus: deliveryStatus.includes('Manual') ? 'PENDING' : 'NOT_REQUIRED',
      accessGrantedStatus: deliveryStatus,
      refundPolicyTemplate: 'DIGITAL_REVIEW_POLICY',
      adminReviewRequired: codeRevealed,
      buyerSafeMessage: codeRevealed ? 'Code was already revealed. Refund may require Sharity Review.' : 'Access has not been revealed or completed.'
    },
    eligibilityStatus: deliveryStatus.includes('Physical') ? 'PLACEHOLDER' : 'ELIGIBLE_WITH_REVIEW',
    eligibilityMessage: 'Refund is scoped to this seller order item.',
    maxRefundAmount: amount,
    minRefundAmount: 0,
    adminReviewRequired: codeRevealed,
    availableReasons: ['DIGITAL_CODE_NOT_WORKING', 'DIGITAL_ITEM_NOT_RECEIVED', 'OTHER_ISSUE']
  };
}

function reason(reasonCode: string, label: string, description: string, evidenceRecommended: string, evidenceRequired: boolean, adminReviewMayBeRequired: boolean): RefundReasonOption {
  return { reasonCode, label, description, productTypes: ['DIGITAL', 'ELECTRONICS_LATER'], evidenceRecommended, evidenceRequired, adminReviewMayBeRequired, customAmountAllowed: true };
}

function event(eventId: string, title: string, message: string, actorType: string, status: string, daysOffset: number): RefundTimelineEvent {
  return { eventId, refundRequestId: 'refund-seller-order-001', eventType: title.toUpperCase().replace(/\s/g, '_'), actorType, title, message, timestamp: new Date(now + daysOffset * dayMs).toISOString(), status, buyerSafe: true };
}

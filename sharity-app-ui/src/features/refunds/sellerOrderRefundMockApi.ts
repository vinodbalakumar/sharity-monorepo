import { appState$ } from '../../state/appState';
import { placeholderImageUrl } from '../../utils/mockImages';
import { getBuyerOrders, reportOrderProblem } from '../../services/ordersApi';
import type {
  ParentOrderRefundSummaryResponse,
  RefundBreakdown,
  RefundEvidenceItem,
  RefundReasonOption,
  RefundTimelineEvent,
  SellerOrderItemRefundEligibility,
  SellerOrderRefundSummary,
  SubmitRefundResponse
} from './sellerOrderRefundTypes';

type BuyerOrder = Awaited<ReturnType<typeof getBuyerOrders>>[number];

let lastEvidenceId = 1;

export async function getParentOrderRefundSummary(): Promise<ParentOrderRefundSummaryResponse> {
  const orders = await getBuyerOrders();
  const sellerOrders = orders.map(toSellerOrderSummary);
  const firstOrder = orders[0];
  return {
    parentOrderId: sellerOrders[0]?.sellerOrderId ?? 'order-refund-empty',
    parentOrderReference: sellerOrders[0]?.sellerOrderReference ?? 'No orders',
    orderDate: firstOrder?.dateIso ?? new Date().toISOString(),
    totalSellerOrders: sellerOrders.length,
    totalItems: sellerOrders.reduce((total, item) => total + item.itemCount, 0),
    orderStatus: sellerOrders[0]?.sellerOrderStatus ?? 'NO_ORDERS',
    paymentStatus: sellerOrders[0]?.paymentStatus ?? 'UNKNOWN',
    currency: sellerOrders[0]?.currency ?? 'USD',
    sellerOrderRefundSummaries: sellerOrders,
    availableActions: sellerOrders.length > 0 ? ['SELECT_SELLER_ORDER', 'VIEW_TIMELINE', 'MESSAGE_SELLER_SAFELY'] : []
  };
}

export async function getRefundReasons(): Promise<RefundReasonOption[]> {
  await getBuyerOrders();
  return [
    { reasonCode: 'DIGITAL_CODE_NOT_WORKING', label: 'Digital code not working', description: 'The code did not activate or redeem.', productTypes: ['DIGITAL'], evidenceRecommended: 'Screenshot of the error', evidenceRequired: true, adminReviewMayBeRequired: true, customAmountAllowed: true },
    { reasonCode: 'DIGITAL_ITEM_NOT_RECEIVED', label: 'Digital item not received', description: 'The item was not delivered to the secure library.', productTypes: ['DIGITAL'], evidenceRecommended: 'Order page or message screenshot', evidenceRequired: false, adminReviewMayBeRequired: false, customAmountAllowed: true },
    { reasonCode: 'SHIPPING_ISSUE', label: 'Shipping issue', description: 'The package did not arrive or arrived damaged.', productTypes: ['ELECTRONICS'], evidenceRecommended: 'Photo or tracking screenshot', evidenceRequired: true, adminReviewMayBeRequired: true, customAmountAllowed: true },
    { reasonCode: 'OTHER_ISSUE', label: 'Other issue', description: 'Something else needs review.', productTypes: ['DIGITAL', 'ELECTRONICS'], evidenceRecommended: 'Any safe supporting screenshot', evidenceRequired: false, adminReviewMayBeRequired: true, customAmountAllowed: true }
  ];
}

export async function getRefundEstimate(): Promise<{ suggestedRefundAmount: number; maxRefundAmount: number; minRefundAmount: number; refundBreakdown: RefundBreakdown; adminReviewRequired: boolean; sellerResponseRequired: boolean; sellerResponseDeadlinePreview: string; currency: string; messages: string[]; }> {
  const orders = await getBuyerOrders();
  const order = orders[0];
  const amount = order?.price ?? 0;
  const digital = order?.type === 'digital';
  return {
    suggestedRefundAmount: amount,
    maxRefundAmount: amount,
    minRefundAmount: 0,
    refundBreakdown: {
      itemRefund: amount,
      sellerCouponImpact: 0,
      platformCouponImpact: 0,
      buyerServiceFeeRefundable: false,
      buyerServiceFeeRefundAmount: 0,
      sharityCreditReturnBehavior: digital ? 'Digital refunds follow the live access history.' : 'Physical refunds follow live delivery status.',
      taxRefundAmount: 0,
      shippingRefundAmount: 0,
      totalEstimatedRefund: amount,
      refundMethodEstimate: 'Original payment method after review',
      currency: 'USD'
    },
    adminReviewRequired: !!order && order.status !== 'processing',
    sellerResponseRequired: !!order,
    sellerResponseDeadlinePreview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    currency: 'USD',
    messages: order
      ? [
          digital ? 'Live digital access data will shape the final review.' : 'Live delivery status will shape the final review.',
          `Selected order ${order.id} is loaded from the marketplace purchase record.`
        ]
      : ['No live orders were found.']
  };
}

export async function getRefundTimeline(): Promise<RefundTimelineEvent[]> {
  const orders = await getBuyerOrders();
  const order = orders[0];
  const now = new Date();
  const refundRequestId = order?.id ?? 'refund-empty';
  return [
    { eventId: `${refundRequestId}-created`, refundRequestId, eventType: 'ORDER_CREATED', actorType: 'BUYER', title: 'Order created', message: 'Loaded from live marketplace orders.', timestamp: now.toISOString(), status: 'COMPLETED', buyerSafe: true },
    { eventId: `${refundRequestId}-review`, refundRequestId, eventType: 'REFUND_REVIEW', actorType: 'SHARITY', title: 'Review ready', message: 'A live refund review can be opened from this screen.', timestamp: now.toISOString(), status: 'AVAILABLE', buyerSafe: true }
  ];
}

export async function uploadRefundEvidence(): Promise<RefundEvidenceItem> {
  const orders = await getBuyerOrders();
  const order = orders[0];
  const createdAt = new Date().toISOString();
  return {
    evidenceId: `evidence-live-${lastEvidenceId++}`,
    fileName: order ? `${order.name.replace(/\s+/g, '-').toLowerCase()}-evidence.png` : 'refund-evidence.png',
    fileType: 'image/png',
    fileSize: 240000,
    previewUrl: order?.imageUrl ?? placeholderImageUrl('gift_cards'),
    uploadStatus: 'READY',
    visibilityPolicy: 'Visible to seller and Sharity reviewers',
    uploadedAt: createdAt
  };
}

export async function submitRefund(): Promise<SubmitRefundResponse> {
  const orders = await getBuyerOrders();
  const selectedSellerOrderId = appState$.sellerOrderRefund.selectedSellerOrderId.peek();
  const selectedReasonCode = appState$.sellerOrderRefund.selectedReasonCode.peek();
  const requestedAmount = appState$.sellerOrderRefund.requestedAmount.peek();
  const order = orders.find((item) => item.id === selectedSellerOrderId) ?? orders[0];
  if (!order) {
    return {
      refundRequestId: 'refund-empty',
      status: 'NO_ORDER',
      sellerResponseRequired: false,
      sellerResponseDeadline: new Date().toISOString(),
      adminReviewRequired: false,
      payoutHoldCreated: false,
      nextRoute: '/orders',
      message: 'No live orders are available for refund review.'
    };
  }

  await reportOrderProblem(order.id, {
    description: `Requested amount ${requestedAmount}${selectedReasonCode ? ` / reason ${selectedReasonCode}` : ''}`,
    disputeReasonCode: selectedReasonCode || 'OTHER_ISSUE'
  });

  return {
    refundRequestId: `refund-${order.id}`,
    status: 'REPORT_SUBMITTED',
    sellerResponseRequired: true,
    sellerResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    adminReviewRequired: order.status !== 'processing',
    payoutHoldCreated: true,
    nextRoute: `/orders/${order.id}/refund-status`,
    message: 'Live refund or issue report submitted against the selected marketplace order.'
  };
}

export function toSellerOrderSummary(order: BuyerOrder): SellerOrderRefundSummary {
  const currency = 'USD';
  return {
    sellerOrderId: order.id,
    sellerOrderReference: order.id,
    sellerId: `seller-${order.seller.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    storeName: order.seller,
    sellerAlias: order.seller.replace(/\s+/g, ''),
    productThumbnails: [order.imageUrl],
    itemCount: 1,
    sellerOrderStatus: order.status === 'access_ready' ? 'DIGITAL_ACCESS_READY' : order.status === 'shipped' ? 'SHIPPED' : order.status === 'delivered' ? 'DELIVERED' : order.status === 'refund_requested' ? 'REFUND_REQUESTED' : order.status === 'disputed' ? 'DISPUTED' : 'PROCESSING',
    paymentStatus: order.payment === 'paid' ? 'AUTHORIZED_CAPTURED' : order.payment === 'delivered' ? 'DELIVERED' : 'PENDING',
    captureStatus: order.payment === 'paid' ? 'CAPTURED' : 'PENDING',
    digitalDeliveryStatus: order.type === 'digital' ? 'ACCESS_READY' : order.status === 'shipped' ? 'TRACKING_ACTIVE' : 'RETURN_REQUIRED',
    refundEligibilityStatus: order.status === 'disputed' || order.status === 'refund_requested' ? 'IN_REVIEW' : 'ELIGIBLE',
    existingRefundStatus: order.status === 'refund_requested' ? 'PENDING' : 'NONE',
    estimatedRefundableAmount: order.price,
    currency,
    availableActions: ['SELECT_SELLER_ORDER', 'MESSAGE_SELLER_SAFELY'],
    items: [toItem(order)]
  };
}

function toItem(order: BuyerOrder): SellerOrderItemRefundEligibility {
  const codeRevealed = order.type === 'digital' && (order.status === 'access_ready' || order.status === 'delivered' || order.status === 'refund_requested');
  return {
    sellerOrderItemId: `${order.id}-item-1`,
    productId: `product-${order.id}`,
    listingId: order.listingPublicId,
    productTitle: order.name,
    productImageUrl: order.imageUrl,
    productType: order.type === 'digital' ? 'DIGITAL' : 'ELECTRONICS',
    deliveryType: order.type === 'digital' ? 'SECURE_DIGITAL_ACCESS' : 'PHYSICAL_RETURN_LATER',
    quantity: 1,
    price: order.price,
    currency: 'USD',
    refundRuleSummary: order.type === 'digital' ? 'Refund review depends on live access history.' : 'Refund review depends on live delivery and return status.',
    digitalAccessContext: {
      codeAssigned: order.type === 'digital',
      codeRevealed,
      revealTimestamp: codeRevealed ? order.dateIso : undefined,
      fileDownloaded: false,
      downloadTimestamp: undefined,
      manualDeliveryStatus: order.type === 'digital' ? 'NOT_REQUIRED' : 'NOT_REQUIRED',
      accessGrantedStatus: order.status === 'access_ready' ? 'READY' : 'PENDING',
      refundPolicyTemplate: 'LIVE_POLICY',
      adminReviewRequired: order.status !== 'access_ready',
      buyerSafeMessage: order.type === 'digital' ? 'Digital access is controlled from the live purchase record.' : 'Physical order is controlled from the live purchase record.'
    },
    eligibilityStatus: order.status === 'disputed' || order.status === 'refund_requested' ? 'IN_REVIEW' : 'ELIGIBLE',
    eligibilityMessage: order.type === 'digital' ? 'Live digital order selected.' : 'Live physical order selected.',
    maxRefundAmount: order.price,
    minRefundAmount: 0,
    adminReviewRequired: order.status !== 'access_ready',
    availableReasons: order.type === 'digital'
      ? ['DIGITAL_CODE_NOT_WORKING', 'DIGITAL_ITEM_NOT_RECEIVED', 'OTHER_ISSUE']
      : ['SHIPPING_ISSUE', 'OTHER_ISSUE']
  };
}

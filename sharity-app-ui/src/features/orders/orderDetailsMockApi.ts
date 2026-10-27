import { getBuyerOrders, type BuyerOrderItem } from '../../services/ordersApi';
import { getMarketplaceListing } from '../../services/marketplaceApi';
import type { OrderDetailsResponse, OrderEligibility, OrderTimelineEvent } from './orderDetailsTypes';

function toMarketplaceCode(order: BuyerOrderItem): 'DIGITAL' | 'ELECTRONICS' | 'MIXED' {
  return order.type === 'digital' ? 'DIGITAL' : 'ELECTRONICS';
}

export async function getBuyerOrderDetails(orderId: string): Promise<OrderDetailsResponse | null> {
  const orders = await getBuyerOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order) {
    return null;
  }

  const listing = await getMarketplaceListingByOrder(order).catch(() => null);
  const marketplaceCode = toMarketplaceCode(order);
  const isDigital = marketplaceCode === 'DIGITAL';
  const isElectronics = marketplaceCode === 'ELECTRONICS';
  const timeline = buildTimeline(order);

  return {
    availableActions: ['VIEW_RECEIPT', 'CONTACT_SELLER', 'REPORT_ISSUE', isDigital ? 'GO_TO_LIBRARY' : 'TRACK_PACKAGE'],
    digitalAccessSummary: isDigital
      ? {
          accessStatus: order.status === 'refund_requested' ? 'REFUNDED' : order.status === 'access_ready' ? 'ACCESS_READY' : 'PENDING_RISK_REVIEW',
          goToLibraryAvailable: true,
          message: 'Go to Library to securely reveal or download your digital product.',
          refundEligibilityStatus: order.status === 'refund_requested' ? 'Refunded' : 'Refund review depends on access history.',
          riskReviewStatus: order.status === 'processing' ? 'Pending review' : 'No active risk hold'
        }
      : undefined,
    eligibility: buildEligibility(isDigital, isElectronics, order.status),
    items: [
      {
        condition: listing?.conditionLabel || undefined,
        deliveryType: isDigital ? 'DIGITAL' : 'SHIPPING_REQUIRED',
        price: order.price,
        productId: `product-${order.id}`,
        productImageUrl: order.imageUrl,
        productTitle: order.name,
        productType: listing?.productType ?? (isDigital ? 'Digital item' : 'Electronics'),
        quantity: 1,
        refundReturnSummary: isDigital ? 'Digital access is handled through Library and may affect refund review.' : 'Return or refund eligibility depends on delivery status and seller policy.'
      }
    ],
    order: {
      checkoutId: `checkout-${order.id}`,
      currency: order.currencyCode,
      marketplaceCode,
      marketplaceName: marketplaceCode === 'DIGITAL' ? 'Digital Marketplace' : 'Electronics Marketplace',
      orderDate: order.dateIso,
      orderId: order.id,
      orderReference: order.id,
      orderStatus: normalizeOrderStatus(order.status),
      paymentStatus: normalizePaymentStatus(order.payment),
      refundDisputeStatus: normalizeDisputeStatus(order.status),
      totalAmount: order.price,
      updatedAt: order.dateIso
    },
    receiptSummary: {
      receiptAvailable: order.payment === 'paid',
      receiptId: `receipt-${order.id}`,
      safePaymentReference: 'Not provided'
    },
    seller: {
      availableActions: ['CONTACT_SELLER', 'VIEW_PROFILE'],
      country: listing?.providerCountryCode || 'Not provided',
      marketplaceCode,
      sellerDisplayName: order.seller,
      sellerId: `seller-${order.seller.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      sellerRating: 0,
      sellerVerified: listing?.verifiedSeller ?? false
    },
    shippingAddress: undefined,
    shippingSummary: isElectronics ? {
      lastUpdated: order.dateIso, shippingRequired: true,
      shippingStatus: order.status === 'delivered' ? 'DELIVERED' : order.status === 'shipped' ? 'SHIPPED' : 'TRACKING_NOT_AVAILABLE',
      trackingAvailable: false
    } : undefined,
    timeline
  };
}

export async function getOrderTimeline(orderId: string): Promise<OrderTimelineEvent[]> {
  const details = await getBuyerOrderDetails(orderId);
  return details?.timeline ?? [];
}

export async function checkCancelEligibility(orderId: string): Promise<OrderEligibility> {
  const details = await getBuyerOrderDetails(orderId);
  return details?.eligibility ?? buildEligibility(false, false, 'FAILED');
}

export async function cancelOrder(orderId: string) {
  return { orderId, status: 'CANCEL_REQUESTED' };
}

export async function startRefundRequest(orderId: string) {
  return { orderId, status: 'REFUND_FLOW_READY' };
}

export async function startDispute(orderId: string) {
  return { orderId, status: 'DISPUTE_FLOW_READY' };
}

export async function reportOrderIssue(orderId: string) {
  return { orderId, status: 'ISSUE_REPORTED' };
}

async function getMarketplaceListingByOrder(order: BuyerOrderItem) {
  if (!order.listingPublicId) {
    return null;
  }
  try {
    const listing = await getMarketplaceListing(order.listingPublicId);
    return listing;
  } catch {
    return null;
  }
}

function normalizeOrderStatus(status: BuyerOrderItem['status']) {
  return status === 'access_ready' ? 'ACCESS_READY' : status === 'shipped' ? 'SHIPPED' : status === 'delivered' ? 'DELIVERED' : status === 'refund_requested' ? 'REFUND_REQUESTED' : status === 'disputed' ? 'DISPUTED' : 'PROCESSING';
}

function normalizePaymentStatus(status: BuyerOrderItem['payment']) {
  return status === 'paid' ? 'PAID' : status === 'delivered' ? 'PAID' : 'PAYMENT_PENDING';
}

function normalizeDisputeStatus(status: BuyerOrderItem['status']) {
  return status === 'refund_requested' ? 'REFUND_REQUESTED' : status === 'disputed' ? 'DISPUTE_OPEN' : 'NONE';
}

function buildEligibility(isDigital: boolean, isElectronics: boolean, orderStatus: string): OrderEligibility {
  return {
    canCancel: false,
    canContactSeller: true,
    canOpenDispute: ['REFUNDED', 'DISPUTED', 'DELIVERED'].includes(orderStatus),
    canReportIssue: true,
    canRequestRefund: isDigital || isElectronics,
    cancelReason: 'Cancellation is not available online. Contact support with your order reference.',
    disputeReason: 'Dispute can be opened when refund or seller resolution is not enough.',
    refundReason: isDigital ? 'Digital access history may require review.' : 'Return/refund review depends on delivery and product condition.'
  };
}

function buildTimeline(order: BuyerOrderItem): OrderTimelineEvent[] {
  // Only the order creation time is supplied by this API. Never invent payment,
  // shipment or delivery events and timestamps from the current status.
  return [{ eventId: `${order.id}-created`, eventType: 'ORDER_CREATED', timestamp: order.dateIso,
    title: 'Order recorded', description: order.payment === 'pending'
      ? 'Payment has not been confirmed. Access and delivery remain pending.'
      : 'View the current payment and fulfilment status above.', visibility: 'BUYER_VISIBLE' }];
}

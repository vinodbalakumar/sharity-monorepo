import { getBuyerOrders, type BuyerOrderItem } from '../../services/ordersApi';
import { getMarketplaceListing } from '../../services/marketplaceApi';
import type { OrderDetailsResponse, OrderEligibility, OrderTimelineEvent } from './orderDetailsTypes';

function toMarketplaceCode(order: BuyerOrderItem): 'DIGITAL' | 'ELECTRONICS' | 'MIXED' {
  return order.type === 'digital' ? 'DIGITAL' : 'ELECTRONICS';
}

export async function getBuyerOrderDetails(orderId: string): Promise<OrderDetailsResponse | null> {
  const orders = await getBuyerOrders();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];
  if (!order) {
    return null;
  }

  const listing = await getMarketplaceListingByOrder(order).catch(() => null);
  const marketplaceCode = toMarketplaceCode(order);
  const isDigital = marketplaceCode === 'DIGITAL';
  const isElectronics = marketplaceCode === 'ELECTRONICS';
  const timeline = buildTimeline(order.id, isDigital, order.status);

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
        condition: isElectronics ? 'Seller-certified refurbished' : undefined,
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
      currency: 'USD',
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
      receiptAvailable: true,
      receiptId: `receipt-${order.id}`,
      safePaymentReference: `PAY-${order.id.slice(-6).toUpperCase()}`
    },
    seller: {
      availableActions: ['CONTACT_SELLER', 'VIEW_PROFILE'],
      country: 'United States',
      marketplaceCode,
      sellerDisplayName: order.seller,
      sellerId: `seller-${order.seller.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      sellerRating: 4.8,
      sellerVerified: true
    },
    shippingAddress: isElectronics
      ? {
          addressLine1: 'Delivered address on file',
          addressLine2: undefined,
          city: 'Phoenix',
          country: 'United States',
          fullName: 'Sharity Buyer',
          phoneMasked: '+1 *** *** 4821',
          postalCode: '85032',
          state: 'AZ'
        }
      : undefined,
    shippingSummary: isElectronics
      ? {
          carrier: order.status === 'shipped' || order.status === 'delivered' ? 'UPS' : undefined,
          estimatedDelivery: order.status === 'shipped' ? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) : undefined,
          lastUpdated: order.dateIso,
          shippingRequired: true,
          shippingStatus: order.status === 'delivered' ? 'DELIVERED' : order.status === 'shipped' ? 'SHIPPED' : 'TRACKING_NOT_AVAILABLE',
          trackingAvailable: order.status === 'shipped' || order.status === 'delivered',
          trackingMaskedReference: order.status === 'shipped' || order.status === 'delivered' ? 'ending in 4832' : undefined
        }
      : undefined,
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
  const fulfillmentStarted = ['ACCESS_READY', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'DISPUTED'].includes(orderStatus);
  return {
    canCancel: !fulfillmentStarted,
    canContactSeller: true,
    canOpenDispute: ['REFUNDED', 'DISPUTED', 'DELIVERED'].includes(orderStatus),
    canReportIssue: true,
    canRequestRefund: isDigital || isElectronics,
    cancelReason: fulfillmentStarted ? 'This order cannot be cancelled because fulfillment has started.' : 'Order is eligible for cancellation.',
    disputeReason: 'Dispute can be opened when refund or seller resolution is not enough.',
    refundReason: isDigital ? 'Digital access history may require review.' : 'Return/refund review depends on delivery and product condition.'
  };
}

function buildTimeline(orderId: string, isDigital: boolean, status: string): OrderTimelineEvent[] {
  const base = [
    {
      description: 'Payment was received and the order was created.',
      eventId: `${orderId}-created`,
      eventType: 'ORDER_CREATED',
      timestamp: '2026-06-03T10:45:00Z',
      title: 'Order created',
      visibility: 'BUYER_VISIBLE' as const
    },
    {
      description: 'Payment was confirmed through the selected payment method.',
      eventId: `${orderId}-paid`,
      eventType: 'PAYMENT_SUCCESSFUL',
      timestamp: '2026-06-03T10:46:00Z',
      title: 'Payment successful',
      visibility: 'BUYER_VISIBLE' as const
    }
  ];

  if (isDigital) {
    return [
      ...base,
      {
        description: 'Digital access is ready in My Library.',
        eventId: `${orderId}-access`,
        eventType: 'DIGITAL_ACCESS_READY',
        timestamp: '2026-06-03T10:48:00Z',
        title: status === 'REFUNDED' ? 'Digital access disabled after refund' : 'Digital access ready',
        visibility: 'BUYER_VISIBLE' as const
      }
    ];
  }

  return [
    ...base,
    {
      description: 'Seller is preparing shipment.',
      eventId: `${orderId}-prep`,
      eventType: 'PREPARING_SHIPMENT',
      timestamp: '2026-06-03T12:15:00Z',
      title: 'Seller preparing shipment',
      visibility: 'BUYER_VISIBLE' as const
    },
    {
      description: 'Tracking summary is available when carrier updates arrive.',
      eventId: `${orderId}-ship`,
      eventType: 'SHIPPED',
      timestamp: '2026-06-03T16:42:00Z',
      title: status === 'DELIVERED' ? 'Delivered' : 'Shipped',
      visibility: 'BUYER_VISIBLE' as const
    }
  ];
}


import { getOrderDetails } from './ordersMockApi';
import type { OrderDetailsResponse, OrderEligibility, OrderTimelineEvent } from './orderDetailsTypes';

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBuyerOrderDetails(orderId: string): Promise<OrderDetailsResponse | null> {
  await wait();
  const order = await getOrderDetails(orderId);
  if (!order) {
    return null;
  }

  const isDigital = order.marketplaceCode === 'DIGITAL';
  const isElectronics = order.marketplaceCode === 'ELECTRONICS';
  const timeline = buildTimeline(order.orderId, isDigital, order.orderStatus);

  return {
    availableActions: ['VIEW_RECEIPT', 'CONTACT_SELLER', 'REPORT_ISSUE', isDigital ? 'GO_TO_LIBRARY' : 'TRACK_PACKAGE'],
    digitalAccessSummary: isDigital
      ? {
          accessStatus: order.digitalAccessStatus ?? 'ACCESS_READY',
          goToLibraryAvailable: true,
          message: 'Go to Library to securely reveal/download your digital product.',
          refundEligibilityStatus: order.digitalAccessStatus === 'REFUNDED' ? 'Refunded' : 'Admin review may be required after access.',
          riskReviewStatus: order.digitalAccessStatus === 'PENDING_RISK_REVIEW' ? 'Pending review' : 'No active risk hold'
        }
      : undefined,
    eligibility: buildEligibility(isDigital, isElectronics, order.orderStatus),
    items: [
      {
        condition: isElectronics ? 'Seller-certified refurbished' : undefined,
        deliveryType: isDigital ? 'DIGITAL' : 'SHIPPING_REQUIRED',
        price: order.totalAmount,
        productId: `product-${order.orderId}`,
        productImageUrl: order.productImageUrl,
        productTitle: order.productTitle,
        productType: order.productType,
        quantity: 1,
        refundReturnSummary: isDigital ? 'Digital access is handled through Library and may affect refund review.' : 'Return/refund eligibility depends on delivery status and seller policy.'
      }
    ],
    order: {
      checkoutId: order.checkoutId,
      currency: order.currency,
      marketplaceCode: order.marketplaceCode,
      marketplaceName: order.marketplaceName,
      orderDate: order.orderDate,
      orderId: order.orderId,
      orderReference: order.orderReference,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      refundDisputeStatus: order.refundDisputeStatus,
      totalAmount: order.totalAmount,
      updatedAt: order.updatedAt
    },
    receiptSummary: {
      receiptAvailable: order.receiptAvailable,
      receiptId: `receipt-${order.orderId}`,
      safePaymentReference: 'PAYPAL-SAFE-9KQ2'
    },
    seller: {
      availableActions: ['CONTACT_SELLER', 'VIEW_PROFILE'],
      country: 'United States',
      marketplaceCode: order.marketplaceCode,
      sellerDisplayName: order.sellerDisplayName,
      sellerId: order.sellerId,
      sellerRating: order.sellerVerified ? 4.8 : 4.2,
      sellerVerified: order.sellerVerified
    },
    shippingAddress: isElectronics
      ? {
          addressLine1: '2148 N 32nd St',
          addressLine2: 'Apt 5B',
          city: 'Phoenix',
          country: 'United States',
          fullName: 'V D',
          phoneMasked: '+1 *** *** 4821',
          postalCode: '85032',
          state: 'AZ'
        }
      : undefined,
    shippingSummary: isElectronics
      ? {
          carrier: order.trackingAvailable ? 'UPS' : undefined,
          estimatedDelivery: order.trackingAvailable ? '2026-06-06' : undefined,
          lastUpdated: order.updatedAt,
          shippingRequired: true,
          shippingStatus: order.shippingStatus ?? 'TRACKING_NOT_AVAILABLE',
          trackingAvailable: order.trackingAvailable,
          trackingMaskedReference: order.trackingAvailable ? 'ending in 4832' : undefined
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
  await wait(180);
  return {
    orderId,
    status: 'CANCEL_REQUESTED'
  };
}

export async function startRefundRequest(orderId: string) {
  await wait(180);
  return {
    orderId,
    status: 'REFUND_FLOW_READY'
  };
}

export async function startDispute(orderId: string) {
  await wait(180);
  return {
    orderId,
    status: 'DISPUTE_FLOW_READY'
  };
}

export async function reportOrderIssue(orderId: string) {
  await wait(180);
  return {
    orderId,
    status: 'ISSUE_REPORTED'
  };
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
    refundReason: isDigital ? 'Digital access history may require admin review.' : 'Return/refund review depends on delivery and product condition.'
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

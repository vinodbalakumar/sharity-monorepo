import type {
  DeliveryIssueRequest,
  RefundReturnEligibility,
  SellerContactContext,
  TrackingDetailsResponse,
  TrackingTimelineEvent
} from './trackingTypes';

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const shippedTimeline: TrackingTimelineEvent[] = [
  {
    description: 'Your order was paid and confirmed by Sharity.',
    eventId: 'track-event-001',
    eventType: 'ORDER_CONFIRMED',
    occurredAt: '2026-06-02T14:12:00Z',
    status: 'COMPLETED',
    title: 'Order confirmed'
  },
  {
    description: 'The seller is packing and preparing your shipment.',
    eventId: 'track-event-002',
    eventType: 'SELLER_PREPARING_SHIPMENT',
    occurredAt: '2026-06-02T18:30:00Z',
    status: 'COMPLETED',
    title: 'Seller preparing shipment'
  },
  {
    description: 'Carrier pickup is complete and tracking is active.',
    eventId: 'track-event-003',
    eventType: 'SHIPPED',
    occurredAt: '2026-06-03T15:40:00Z',
    status: 'COMPLETED',
    title: 'Shipped'
  },
  {
    description: 'Package is moving through the carrier network.',
    eventId: 'track-event-004',
    eventType: 'IN_TRANSIT',
    occurredAt: '2026-06-03T22:05:00Z',
    status: 'CURRENT',
    title: 'In transit'
  },
  {
    description: 'Carrier will update this step when your item is on the final delivery route.',
    eventId: 'track-event-005',
    eventType: 'OUT_FOR_DELIVERY',
    status: 'UPCOMING',
    title: 'Out for delivery'
  },
  {
    description: 'Delivery confirmation will appear here after the carrier completes delivery.',
    eventId: 'track-event-006',
    eventType: 'DELIVERED',
    status: 'UPCOMING',
    title: 'Delivered'
  }
];

const deliveredTimeline: TrackingTimelineEvent[] = [
  ...shippedTimeline.slice(0, 5).map((event) => ({ ...event, status: 'COMPLETED' as const })),
  {
    description: 'Carrier marked the package delivered to the masked delivery area.',
    eventId: 'track-event-010',
    eventType: 'DELIVERED',
    occurredAt: '2026-06-01T15:20:00Z',
    status: 'COMPLETED',
    title: 'Delivered'
  },
  {
    description: 'A return/refund request can be reviewed from the order actions if eligible.',
    eventId: 'track-event-011',
    eventType: 'REFUND_PROCESSING',
    status: 'UPCOMING',
    title: 'Refund processing'
  }
];

const mockTracking: Record<string, TrackingDetailsResponse> = {
  'order-delivered-004': {
    availableActions: {
      canBackToOrderDetails: true,
      canContactSeller: true,
      canReportDeliveryIssue: true,
      canRequestRefundReturn: true
    },
    carrierSummary: {
      carrierName: 'UPS',
      carrierStatusText: 'Delivered',
      serviceLevel: 'Ground',
      trackingMaskedReference: 'ending in 7184'
    },
    maskedAddress: {
      city: 'Phoenix',
      country: 'United States',
      displayText: 'Phoenix, AZ 85032',
      postalCodePrefix: '85032',
      recipientAlias: 'Buyer',
      state: 'AZ'
    },
    refundReturnEligibility: {
      canRequestRefundReturn: true,
      deadline: '2026-06-15T23:59:59Z',
      eligibleAfterDelivery: true,
      reason: 'Delivered electronics order is inside the return review window.'
    },
    sellerContactContext: {
      canContactSeller: true,
      message: 'Use Sharity messages so seller and buyer private contact details stay hidden.',
      safeChannel: 'Sharity Messages'
    },
    shipmentSummary: {
      deliveredAt: '2026-06-01T15:20:00Z',
      headline: 'Delivered',
      lastUpdatedAt: '2026-06-01T15:20:00Z',
      message: 'Your package was marked delivered by the carrier.',
      status: 'DELIVERED'
    },
    timeline: deliveredTimeline,
    tracking: {
      currency: 'USD',
      marketplaceCode: 'ELECTRONICS',
      marketplaceName: 'Electronics Marketplace',
      orderDate: '2026-05-30T19:30:00Z',
      orderId: 'order-delivered-004',
      orderReference: 'SH-100248',
      productId: 'electronics-earbuds-004',
      productImageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
      productTitle: 'Wireless Noise Cancelling Earbuds',
      productType: 'Electronics',
      quantity: 1,
      sellerDisplayName: 'Audio Atlas',
      sellerVerified: true,
      totalAmount: 89.5
    }
  },
  'order-disputed-006': {
    availableActions: {
      canBackToOrderDetails: true,
      canContactSeller: true,
      canReportDeliveryIssue: true,
      canRequestRefundReturn: false
    },
    carrierSummary: {
      carrierName: 'USPS',
      carrierStatusText: 'Delivered',
      serviceLevel: 'Priority',
      trackingMaskedReference: 'ending in 3021'
    },
    maskedAddress: {
      city: 'Phoenix',
      country: 'United States',
      displayText: 'Phoenix, AZ 85032',
      postalCodePrefix: '85032',
      recipientAlias: 'Buyer',
      state: 'AZ'
    },
    refundReturnEligibility: {
      canRequestRefundReturn: false,
      eligibleAfterDelivery: true,
      reason: 'A dispute is already open for this order.'
    },
    sellerContactContext: {
      canContactSeller: true,
      message: 'Use Sharity messages. Do not share private contact or payment details.',
      safeChannel: 'Sharity Messages'
    },
    shipmentSummary: {
      deliveredAt: '2026-05-23T17:00:00Z',
      headline: 'Delivered with active dispute',
      lastUpdatedAt: '2026-05-27T18:00:00Z',
      message: 'Delivery was completed and the order is now under dispute review.',
      status: 'DELIVERED'
    },
    timeline: deliveredTimeline.map((event, index) => index === 6 ? { ...event, status: 'CURRENT', title: 'Dispute review linked' } : event),
    tracking: {
      currency: 'USD',
      marketplaceCode: 'ELECTRONICS',
      marketplaceName: 'Electronics Marketplace',
      orderDate: '2026-05-20T10:00:00Z',
      orderId: 'order-disputed-006',
      orderReference: 'SH-100250',
      productId: 'electronics-phone-006',
      productImageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
      productTitle: 'Unlocked Smartphone',
      productType: 'Electronics',
      quantity: 1,
      sellerDisplayName: 'Mobile Yard',
      sellerVerified: false,
      totalAmount: 319
    }
  },
  'order-electronics-002': {
    availableActions: {
      canBackToOrderDetails: true,
      canContactSeller: true,
      canReportDeliveryIssue: true,
      canRequestRefundReturn: false
    },
    carrierSummary: {
      carrierName: 'UPS',
      carrierStatusText: 'In transit',
      serviceLevel: 'Ground',
      trackingMaskedReference: 'ending in 4832'
    },
    maskedAddress: {
      city: 'Phoenix',
      country: 'United States',
      displayText: 'Phoenix, AZ 85032',
      postalCodePrefix: '85032',
      recipientAlias: 'Buyer',
      state: 'AZ'
    },
    refundReturnEligibility: {
      canRequestRefundReturn: false,
      deadline: '2026-06-19T23:59:59Z',
      eligibleAfterDelivery: true,
      reason: 'Refund or return request becomes available after delivery when eligible.'
    },
    sellerContactContext: {
      canContactSeller: true,
      message: 'Message the seller through Sharity for shipment questions.',
      safeChannel: 'Sharity Messages'
    },
    shipmentSummary: {
      estimatedDelivery: '2026-06-06T20:00:00Z',
      headline: 'In transit',
      lastUpdatedAt: '2026-06-03T22:05:00Z',
      message: 'Your package is moving through the carrier network.',
      shippedAt: '2026-06-03T15:40:00Z',
      status: 'IN_TRANSIT'
    },
    timeline: shippedTimeline,
    tracking: {
      currency: 'USD',
      marketplaceCode: 'ELECTRONICS',
      marketplaceName: 'Electronics Marketplace',
      orderDate: '2026-06-02T14:10:00Z',
      orderId: 'order-electronics-002',
      orderReference: 'SH-100246',
      productId: 'electronics-ultrabook-002',
      productImageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
      productTitle: 'Refurbished Ultrabook Pro',
      productType: 'Electronics',
      quantity: 1,
      sellerDisplayName: 'Circuit Loop',
      sellerVerified: true,
      totalAmount: 689
    }
  }
};

export async function getOrderTracking(orderId: string): Promise<TrackingDetailsResponse | null> {
  await wait();
  return mockTracking[orderId] ?? null;
}

export async function getOrderTrackingTimeline(orderId: string): Promise<TrackingTimelineEvent[]> {
  await wait(140);
  return mockTracking[orderId]?.timeline ?? [];
}

export async function getRefundEligibility(orderId: string): Promise<RefundReturnEligibility | null> {
  await wait(140);
  return mockTracking[orderId]?.refundReturnEligibility ?? null;
}

export async function getSellerContactContext(orderId: string): Promise<SellerContactContext | null> {
  await wait(140);
  return mockTracking[orderId]?.sellerContactContext ?? null;
}

export async function reportDeliveryIssue(orderId: string, request: DeliveryIssueRequest): Promise<{ issueId: string; orderId: string; status: 'SUBMITTED' }> {
  await wait(180);
  return {
    issueId: `delivery-issue-${orderId}-${request.issueType.toLowerCase()}`,
    orderId,
    status: 'SUBMITTED'
  };
}

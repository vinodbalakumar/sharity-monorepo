import type { ShippingStatus } from './ordersTypes';

export type TrackingEventType =
  | 'ORDER_CONFIRMED'
  | 'SELLER_PREPARING_SHIPMENT'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURN_STARTED'
  | 'RETURN_DELIVERED'
  | 'REFUND_PROCESSING';

export type TrackingEventStatus = 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'ISSUE';

export type ShipmentSummary = {
  status: ShippingStatus | 'IN_TRANSIT' | 'DELIVERY_FAILED' | 'RETURN_STARTED' | 'RETURN_DELIVERED' | 'REFUND_PROCESSING';
  headline: string;
  message: string;
  shippedAt?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  lastUpdatedAt: string;
};

export type CarrierSummary = {
  carrierName: string;
  serviceLevel: string;
  trackingMaskedReference: string;
  carrierStatusText: string;
};

export type MaskedAddress = {
  recipientAlias: string;
  city: string;
  state: string;
  postalCodePrefix: string;
  country: string;
  displayText: string;
};

export type OrderTracking = {
  orderId: string;
  orderReference: string;
  marketplaceCode: 'ELECTRONICS' | 'FUTURE_PHYSICAL';
  marketplaceName: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  productType: string;
  sellerDisplayName: string;
  sellerVerified: boolean;
  quantity: number;
  orderDate: string;
  totalAmount: number;
  currency: string;
};

export type TrackingTimelineEvent = {
  eventId: string;
  eventType: TrackingEventType;
  status: TrackingEventStatus;
  title: string;
  description: string;
  occurredAt?: string;
};

export type RefundReturnEligibility = {
  canRequestRefundReturn: boolean;
  reason: string;
  eligibleAfterDelivery: boolean;
  deadline?: string;
};

export type SellerContactContext = {
  canContactSeller: boolean;
  safeChannel: string;
  message: string;
};

export type TrackingDetailsResponse = {
  tracking: OrderTracking;
  shipmentSummary: ShipmentSummary;
  carrierSummary?: CarrierSummary;
  maskedAddress: MaskedAddress;
  timeline: TrackingTimelineEvent[];
  refundReturnEligibility: RefundReturnEligibility;
  sellerContactContext: SellerContactContext;
  availableActions: {
    canBackToOrderDetails: boolean;
    canContactSeller: boolean;
    canReportDeliveryIssue: boolean;
    canRequestRefundReturn: boolean;
  };
};

export type DeliveryIssueRequest = {
  issueType: 'NOT_DELIVERED' | 'DAMAGED' | 'WRONG_ADDRESS' | 'CARRIER_DELAY' | 'OTHER';
  message: string;
};

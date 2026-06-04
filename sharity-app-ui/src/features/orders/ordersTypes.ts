export type OrderFilter =
  | 'All'
  | 'Digital'
  | 'Electronics'
  | 'Processing'
  | 'Access Ready'
  | 'Shipping Pending'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded'
  | 'Disputed'
  | 'Seller Delivery Pending';

export type OrderSort =
  | 'Newest First'
  | 'Oldest First'
  | 'Highest Amount'
  | 'Lowest Amount'
  | 'Recently Updated'
  | 'Status'
  | 'Marketplace';

export type OrderStatus =
  | 'ORDER_CREATED'
  | 'PROCESSING'
  | 'ACCESS_READY'
  | 'SELLER_DELIVERY_PENDING'
  | 'SHIPPING_PENDING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'DISPUTED'
  | 'FAILED';

export type PaymentStatus = 'PAYMENT_PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type ShippingStatus = 'NOT_REQUIRED' | 'SHIPPING_PENDING' | 'PREPARING_SHIPMENT' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'TRACKING_NOT_AVAILABLE';
export type DigitalAccessStatus = 'ACCESS_READY' | 'CODE_REVEAL_AVAILABLE' | 'DOWNLOAD_READY' | 'PENDING_RISK_REVIEW' | 'SELLER_DELIVERY_PENDING' | 'ACCESS_REVOKED' | 'REFUNDED' | 'EXPIRED';
export type RefundDisputeStatus = 'NONE' | 'REFUND_REQUESTED' | 'REFUND_UNDER_REVIEW' | 'REFUND_APPROVED' | 'REFUND_REJECTED' | 'REFUNDED' | 'DISPUTE_OPEN' | 'DISPUTE_UNDER_REVIEW' | 'DISPUTE_CLOSED';
export type OrderAction = 'VIEW_DETAILS' | 'GO_TO_LIBRARY' | 'TRACK_PACKAGE' | 'VIEW_RECEIPT' | 'CONTACT_SUPPORT';

export type OrderListItem = {
  orderId: string;
  checkoutId: string;
  orderReference: string;
  marketplaceCode: 'DIGITAL' | 'ELECTRONICS';
  marketplaceName: string;
  sellerId: string;
  sellerDisplayName: string;
  sellerVerified: boolean;
  productImageUrl: string;
  productTitle: string;
  productType: string;
  orderDate: string;
  updatedAt: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  digitalAccessStatus?: DigitalAccessStatus;
  shippingStatus?: ShippingStatus;
  refundDisputeStatus: RefundDisputeStatus;
  totalAmount: number;
  currency: 'USD';
  receiptAvailable: boolean;
  trackingAvailable: boolean;
  availableActions: OrderAction[];
};

export type OrderSummaryCounts = Record<
  'all' | 'digital' | 'electronics' | 'processing' | 'accessReady' | 'shippingPending' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'disputed' | 'sellerDeliveryPending',
  number
>;

export type OrdersResponse = {
  orders: OrderListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  summaryCounts: OrderSummaryCounts;
  availableFilters: OrderFilter[];
};

export type TrackingSummary = {
  orderId: string;
  trackingAvailable: boolean;
  shippingStatus: ShippingStatus;
  carrier?: string;
  trackingMaskedReference?: string;
  lastUpdated?: string;
};

export type ReceiptSummary = {
  receiptId: string;
  orderId: string;
  receiptAvailable: boolean;
  safePaymentReference: string;
  createdAt: string;
};

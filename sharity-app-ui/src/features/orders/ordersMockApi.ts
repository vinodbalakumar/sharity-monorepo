import type { OrderListItem, OrderSummaryCounts, OrdersResponse, ReceiptSummary, TrackingSummary } from './ordersTypes';

const wait = (ms = 240) => new Promise((resolve) => setTimeout(resolve, ms));

const mockOrders: OrderListItem[] = [
  {
    availableActions: ['VIEW_DETAILS', 'GO_TO_LIBRARY', 'VIEW_RECEIPT'],
    checkoutId: 'checkout-1001',
    currency: 'USD',
    digitalAccessStatus: 'CODE_REVEAL_AVAILABLE',
    marketplaceCode: 'DIGITAL',
    marketplaceName: 'Digital Marketplace',
    orderDate: '2026-06-03T10:45:00Z',
    orderId: 'order-digital-001',
    orderReference: 'SH-100245',
    orderStatus: 'ACCESS_READY',
    paymentStatus: 'PAID',
    productImageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80',
    productTitle: 'PlayStation Store Digital Code',
    productType: 'Gaming Code',
    receiptAvailable: true,
    refundDisputeStatus: 'NONE',
    sellerDisplayName: 'Code Vault',
    sellerId: 'seller-code-vault',
    sellerVerified: true,
    shippingStatus: 'NOT_REQUIRED',
    totalAmount: 49.99,
    trackingAvailable: false,
    updatedAt: '2026-06-03T10:48:00Z'
  },
  {
    availableActions: ['VIEW_DETAILS', 'TRACK_PACKAGE', 'VIEW_RECEIPT'],
    checkoutId: 'checkout-1002',
    currency: 'USD',
    marketplaceCode: 'ELECTRONICS',
    marketplaceName: 'Electronics Marketplace',
    orderDate: '2026-06-02T14:10:00Z',
    orderId: 'order-electronics-002',
    orderReference: 'SH-100246',
    orderStatus: 'SHIPPED',
    paymentStatus: 'PAID',
    productImageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80',
    productTitle: 'Refurbished Ultrabook Pro',
    productType: 'Electronics',
    receiptAvailable: true,
    refundDisputeStatus: 'NONE',
    sellerDisplayName: 'Circuit Loop',
    sellerId: 'seller-circuit-loop',
    sellerVerified: true,
    shippingStatus: 'SHIPPED',
    totalAmount: 689,
    trackingAvailable: true,
    updatedAt: '2026-06-03T16:42:00Z'
  },
  {
    availableActions: ['VIEW_DETAILS', 'GO_TO_LIBRARY', 'VIEW_RECEIPT'],
    checkoutId: 'checkout-1003',
    currency: 'USD',
    digitalAccessStatus: 'SELLER_DELIVERY_PENDING',
    marketplaceCode: 'DIGITAL',
    marketplaceName: 'Digital Marketplace',
    orderDate: '2026-06-01T08:12:00Z',
    orderId: 'order-service-003',
    orderReference: 'SH-100247',
    orderStatus: 'SELLER_DELIVERY_PENDING',
    paymentStatus: 'PAID',
    productImageUrl: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?auto=format&fit=crop&w=900&q=80',
    productTitle: 'Digital Brand Review Service',
    productType: 'Digital Service',
    receiptAvailable: true,
    refundDisputeStatus: 'NONE',
    sellerDisplayName: 'Brand Desk',
    sellerId: 'seller-brand-desk',
    sellerVerified: false,
    shippingStatus: 'NOT_REQUIRED',
    totalAmount: 129,
    trackingAvailable: false,
    updatedAt: '2026-06-02T09:02:00Z'
  },
  {
    availableActions: ['VIEW_DETAILS', 'TRACK_PACKAGE', 'VIEW_RECEIPT'],
    checkoutId: 'checkout-1004',
    currency: 'USD',
    marketplaceCode: 'ELECTRONICS',
    marketplaceName: 'Electronics Marketplace',
    orderDate: '2026-05-30T19:30:00Z',
    orderId: 'order-delivered-004',
    orderReference: 'SH-100248',
    orderStatus: 'DELIVERED',
    paymentStatus: 'PAID',
    productImageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
    productTitle: 'Wireless Noise Cancelling Earbuds',
    productType: 'Electronics',
    receiptAvailable: true,
    refundDisputeStatus: 'REFUND_REQUESTED',
    sellerDisplayName: 'Audio Atlas',
    sellerId: 'seller-audio-atlas',
    sellerVerified: true,
    shippingStatus: 'DELIVERED',
    totalAmount: 89.5,
    trackingAvailable: true,
    updatedAt: '2026-06-01T15:20:00Z'
  },
  {
    availableActions: ['VIEW_DETAILS', 'VIEW_RECEIPT'],
    checkoutId: 'checkout-1005',
    currency: 'USD',
    digitalAccessStatus: 'REFUNDED',
    marketplaceCode: 'DIGITAL',
    marketplaceName: 'Digital Marketplace',
    orderDate: '2026-05-24T12:20:00Z',
    orderId: 'order-refunded-005',
    orderReference: 'SH-100249',
    orderStatus: 'REFUNDED',
    paymentStatus: 'REFUNDED',
    productImageUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80',
    productTitle: 'Digital Gift Card',
    productType: 'Gift Card',
    receiptAvailable: true,
    refundDisputeStatus: 'REFUNDED',
    sellerDisplayName: 'Gift Grid',
    sellerId: 'seller-gift-grid',
    sellerVerified: true,
    shippingStatus: 'NOT_REQUIRED',
    totalAmount: 25,
    trackingAvailable: false,
    updatedAt: '2026-05-25T11:10:00Z'
  },
  {
    availableActions: ['VIEW_DETAILS', 'VIEW_RECEIPT'],
    checkoutId: 'checkout-1006',
    currency: 'USD',
    marketplaceCode: 'ELECTRONICS',
    marketplaceName: 'Electronics Marketplace',
    orderDate: '2026-05-20T10:00:00Z',
    orderId: 'order-disputed-006',
    orderReference: 'SH-100250',
    orderStatus: 'DISPUTED',
    paymentStatus: 'PAID',
    productImageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    productTitle: 'Unlocked Smartphone',
    productType: 'Electronics',
    receiptAvailable: true,
    refundDisputeStatus: 'DISPUTE_OPEN',
    sellerDisplayName: 'Mobile Yard',
    sellerId: 'seller-mobile-yard',
    sellerVerified: false,
    shippingStatus: 'DELIVERED',
    totalAmount: 319,
    trackingAvailable: true,
    updatedAt: '2026-05-27T18:00:00Z'
  }
];

export async function getBuyerOrders(): Promise<OrdersResponse> {
  await wait();
  return {
    availableFilters: ['All', 'Digital', 'Electronics', 'Processing', 'Access Ready', 'Shipping Pending', 'Shipped', 'Delivered', 'Cancelled', 'Refunded', 'Disputed', 'Seller Delivery Pending'],
    orders: mockOrders,
    pagination: {
      page: 1,
      pageSize: 20,
      total: mockOrders.length
    },
    summaryCounts: buildCounts(mockOrders)
  };
}

export async function getOrderSummaryCounts(): Promise<OrderSummaryCounts> {
  await wait(120);
  return buildCounts(mockOrders);
}

export async function getOrderDetails(orderId: string) {
  await wait(160);
  return mockOrders.find((order) => order.orderId === orderId) ?? null;
}

export async function getOrderReceipt(orderId: string): Promise<ReceiptSummary> {
  await wait(160);
  return {
    createdAt: new Date().toISOString(),
    orderId,
    receiptAvailable: true,
    receiptId: `receipt-${orderId}`,
    safePaymentReference: 'PAYPAL-SAFE-9KQ2'
  };
}

export async function getTrackingSummary(orderId: string): Promise<TrackingSummary> {
  await wait(160);
  const order = mockOrders.find((item) => item.orderId === orderId);
  return {
    carrier: order?.trackingAvailable ? 'UPS' : undefined,
    lastUpdated: order?.updatedAt,
    orderId,
    shippingStatus: order?.shippingStatus ?? 'TRACKING_NOT_AVAILABLE',
    trackingAvailable: order?.trackingAvailable ?? false,
    trackingMaskedReference: order?.trackingAvailable ? 'ending in 4832' : undefined
  };
}

function buildCounts(orders: OrderListItem[]): OrderSummaryCounts {
  return {
    accessReady: orders.filter((order) => order.digitalAccessStatus === 'ACCESS_READY' || order.digitalAccessStatus === 'CODE_REVEAL_AVAILABLE' || order.digitalAccessStatus === 'DOWNLOAD_READY').length,
    all: orders.length,
    cancelled: orders.filter((order) => order.orderStatus === 'CANCELLED').length,
    delivered: orders.filter((order) => order.orderStatus === 'DELIVERED').length,
    digital: orders.filter((order) => order.marketplaceCode === 'DIGITAL').length,
    disputed: orders.filter((order) => order.refundDisputeStatus.includes('DISPUTE')).length,
    electronics: orders.filter((order) => order.marketplaceCode === 'ELECTRONICS').length,
    processing: orders.filter((order) => order.orderStatus === 'PROCESSING' || order.orderStatus === 'ORDER_CREATED').length,
    refunded: orders.filter((order) => order.orderStatus === 'REFUNDED' || order.paymentStatus === 'REFUNDED').length,
    sellerDeliveryPending: orders.filter((order) => order.orderStatus === 'SELLER_DELIVERY_PENDING').length,
    shipped: orders.filter((order) => order.orderStatus === 'SHIPPED').length,
    shippingPending: orders.filter((order) => order.orderStatus === 'SHIPPING_PENDING').length
  };
}

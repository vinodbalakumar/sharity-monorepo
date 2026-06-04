import type { DigitalAccessStatus, OrderStatus, PaymentStatus, RefundDisputeStatus, ShippingStatus } from './ordersTypes';

export type OrderDetails = {
  orderId: string;
  checkoutId: string;
  orderReference: string;
  marketplaceCode: 'DIGITAL' | 'ELECTRONICS' | 'MIXED';
  marketplaceName: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  refundDisputeStatus: RefundDisputeStatus;
  totalAmount: number;
  currency: 'USD';
  orderDate: string;
  updatedAt: string;
};

export type OrderDetailsItem = {
  productId: string;
  productTitle: string;
  productImageUrl: string;
  productType: string;
  quantity: number;
  price: number;
  deliveryType: 'DIGITAL' | 'SHIPPING_REQUIRED';
  condition?: string;
  refundReturnSummary: string;
};

export type SellerSummary = {
  sellerId: string;
  sellerDisplayName: string;
  sellerVerified: boolean;
  sellerRating: number;
  marketplaceCode: string;
  country: string;
  availableActions: ('CONTACT_SELLER' | 'VIEW_PROFILE')[];
};

export type DigitalAccessSummary = {
  accessStatus: DigitalAccessStatus;
  riskReviewStatus: string;
  refundEligibilityStatus: string;
  goToLibraryAvailable: boolean;
  message: string;
};

export type ShippingSummary = {
  shippingRequired: boolean;
  shippingStatus: ShippingStatus;
  carrier?: string;
  trackingMaskedReference?: string;
  estimatedDelivery?: string;
  lastUpdated?: string;
  trackingAvailable: boolean;
};

export type BuyerShippingAddress = {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneMasked: string;
};

export type OrderTimelineEvent = {
  eventId: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  visibility: 'BUYER_VISIBLE';
};

export type OrderEligibility = {
  canCancel: boolean;
  cancelReason: string;
  canRequestRefund: boolean;
  refundReason: string;
  canOpenDispute: boolean;
  disputeReason: string;
  canContactSeller: boolean;
  canReportIssue: boolean;
};

export type ReceiptDetailsSummary = {
  receiptAvailable: boolean;
  receiptId: string;
  safePaymentReference: string;
};

export type OrderDetailsResponse = {
  order: OrderDetails;
  items: OrderDetailsItem[];
  seller: SellerSummary;
  digitalAccessSummary?: DigitalAccessSummary;
  shippingSummary?: ShippingSummary;
  shippingAddress?: BuyerShippingAddress;
  timeline: OrderTimelineEvent[];
  receiptSummary: ReceiptDetailsSummary;
  availableActions: string[];
  eligibility: OrderEligibility;
};

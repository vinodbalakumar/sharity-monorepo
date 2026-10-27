export type CheckoutPrepareRequest = {
  cartId: string;
  couponCode?: string;
  selectedPaymentMethod: string;
  shippingAddressId?: string;
};

export type CheckoutItem = {
  condition?: string;
  deliveryType: string;
  discount: number;
  price: number;
  productId: string;
  productImageUrl?: string;
  productTitle: string;
  productType: string;
  quantity: number;
  refundReturnSummary: string;
  shippingRequired: boolean;
};

export type CheckoutOrderGroup = {
  deliveryType: string;
  groupId: string;
  groupSubtotal: number;
  items: CheckoutItem[];
  marketplaceCode: string;
  marketplaceName: string;
  refundReturnSummary: string;
  sellerDisplayName: string;
  sellerId: string;
  sellerVerified: boolean;
  shippingRequired: boolean;
};

export type ShippingAddress = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  deliveryInstructions?: string;
  fullName: string;
  id: string;
  phoneNumber: string;
  postalCode: string;
  state: string;
};

export type PaymentMethod = {
  code: string;
  description: string;
  name: string;
  provider: string;
  status: 'AVAILABLE' | 'COMING_SOON';
};

export type CheckoutSummary = {
  couponDiscount: number;
  currency: string;
  discount: number;
  estimatedShipping: number | null;
  estimatedTax: number;
  marketplaceFee: number;
  subtotal: number;
  totalPayable: number;
};

export type CheckoutWarning = {
  message: string;
  relatedGroupIds: string[];
  severity: 'INFO' | 'WARNING' | 'ERROR';
  warningCode: string;
};

export type CheckoutResponse = {
  availablePaymentMethods: PaymentMethod[];
  checkoutEligibility: {
    loginRequired: boolean;
    paymentAllowed: boolean;
    policyAcknowledgmentRequired: boolean;
  };
  checkoutId: string;
  currency: string;
  digitalAccessRules: string[];
  orderGroups: CheckoutOrderGroup[];
  refundReturnRules: string[];
  shippingAddress?: ShippingAddress;
  shippingRequired: boolean;
  summary: CheckoutSummary;
  warnings: CheckoutWarning[];
};

export type PaymentStartResponse = {
  approvalUrl: string;
  expiresAt: string;
  paymentSessionId: string;
  provider: 'PAYPAL';
};

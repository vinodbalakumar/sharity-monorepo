export type CartItem = {
  cartItemId: string;
  listingId: string;
  productId: string;
  sellerId: string;
  productImageUrl: string;
  productTitle: string;
  productType: string;
  marketplaceCode: string;
  deliveryType: string;
  price: number;
  originalPrice: number;
  discountAmount: number;
  quantity: number;
  currency: string;
  digitalDeliveryNote: string;
  regionRestriction: string;
  refundRuleSummary: string;
  validationStatus: string;
};

export type CartSellerGroup = {
  sellerId: string;
  sellerAlias: string;
  storeName: string;
  storeLogoUrl: string;
  sellerVerificationBadge: string;
  marketplaceCode: string;
  items: CartItem[];
  groupSubtotal: number;
  sellerCouponDiscount: number;
  platformCouponAllocation: number;
  refundRuleSummary: string;
  sellerAcceptanceRequired: boolean;
  digitalInventoryStatus: string;
  validationStatus: string;
};

export type CartPricingSummary = {
  itemsTotal: number;
  sellerCouponDiscountTotal: number;
  platformCouponDiscountTotal: number;
  buyerServiceFee: number;
  taxAmount: number;
  shippingAmount: number;
  sharityCreditApplied: number;
  freePromotionApplied: number;
  totalAuthorizationAmount: number;
  totalDueNow: number;
  currency: string;
};

export type CartValidationIssue = {
  issueId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  issueCode: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId: string;
  requiredAction: string;
  route: string;
};

export type CartDigitalTerms = {
  required: boolean;
  accepted: boolean;
  termsVersion: string;
  summary: string;
  acceptedAt?: string;
  requiredForItemIds: string[];
};

export type CartResponse = {
  cartId: string;
  buyerId: string;
  currency: string;
  sellerGroups: CartSellerGroup[];
  savedForLaterItems: CartItem[];
  pricingSummary: CartPricingSummary;
  validationSummary: {
    valid: boolean;
    checkoutReady: boolean;
    issues: CartValidationIssue[];
    digitalTermsRequired: boolean;
    pricingRefreshRequired: boolean;
  };
  digitalTerms: CartDigitalTerms;
};

export type CheckoutPreviewResponse = {
  checkoutSessionId: string;
  parentOrderPreview: {
    parentOrderReferencePreview: string;
    sellerOrderCount: number;
    buyerId: string;
    totalAuthorizationAmount: number;
    currency: string;
  };
  sellerOrderPreviews: {
    sellerOrderReferencePreview: string;
    sellerId: string;
    storeName: string;
    itemCount: number;
    subtotal: number;
    sellerCouponDiscount: number;
    platformCouponAllocation: number;
    buyerServiceFeeAllocation: number;
    sellerAcceptanceRequired: boolean;
    fulfillmentType: string;
    currency: string;
  }[];
  paymentAuthorizationModel: string;
};

import type { CartResponse, CartSellerGroup, CheckoutPreviewResponse } from './cartCheckoutTypes';

let digitalTermsAccepted = false;
let sellerCouponApplied = true;
let platformCouponApplied = true;

export async function getCart(): Promise<CartResponse> {
  const sellerGroups: CartSellerGroup[] = [
    {
      sellerId: 'seller-gamecodehub',
      sellerAlias: 'GameCodeHub',
      storeName: 'Game Code Hub',
      storeLogoUrl: 'marketplace/placeholders/gift_cards.png',
      sellerVerificationBadge: 'Verified Seller',
      marketplaceCode: 'DIGITAL',
      items: [
        item('cart-item-001', 'Xbox Game Pass Digital Code', 'GAMING_CODE', 'INSTANT_CODE_REVEAL', 14.99, 19.99, 1),
        item('cart-item-002', 'Premium Downloadable Template Pack', 'DOWNLOADABLE_FILE', 'SECURE_DOWNLOAD', 29.99, 39.99, 1)
      ],
      groupSubtotal: 44.98,
      sellerCouponDiscount: sellerCouponApplied ? 5 : 0,
      platformCouponAllocation: platformCouponApplied ? 3 : 0,
      refundRuleSummary: 'Refund before code reveal or file download unless Sharity review approves.',
      sellerAcceptanceRequired: false,
      digitalInventoryStatus: 'Available code inventory',
      validationStatus: 'VALID'
    },
    {
      sellerId: 'seller-techdeals',
      sellerAlias: 'TechDealsPhoenix',
      storeName: 'Tech Deals Phoenix',
      storeLogoUrl: 'marketplace/placeholders/electronics.png',
      sellerVerificationBadge: 'Verified Seller',
      marketplaceCode: 'ELECTRONICS',
      items: [
        item('cart-item-003', 'Open Box Sony WH-1000XM5 Headphones', 'ELECTRONICS', 'SHIPPING_REQUIRED', 249, 319, 1)
      ],
      groupSubtotal: 249,
      sellerCouponDiscount: 0,
      platformCouponAllocation: platformCouponApplied ? 7 : 0,
      refundRuleSummary: '7-day return eligible after delivery.',
      sellerAcceptanceRequired: true,
      digitalInventoryStatus: 'Physical item',
      validationStatus: 'SELLER_ACCEPTANCE_REQUIRED'
    }
  ];
  const itemsTotal = sellerGroups.reduce((sum, group) => sum + group.groupSubtotal, 0);
  const sellerDiscount = sellerGroups.reduce((sum, group) => sum + group.sellerCouponDiscount, 0);
  const platformDiscount = sellerGroups.reduce((sum, group) => sum + group.platformCouponAllocation, 0);
  const buyerServiceFee = 3.5;
  const total = itemsTotal - sellerDiscount - platformDiscount + buyerServiceFee;
  return {
    cartId: 'cart-001',
    buyerId: 'buyer-1000',
    currency: 'USD',
    sellerGroups,
    savedForLaterItems: [item('saved-001', 'Free Starter Icon Pack', 'FREE_DIGITAL_DOWNLOAD', 'SECURE_DOWNLOAD', 0, 9.99, 1)],
    pricingSummary: {
      itemsTotal,
      sellerCouponDiscountTotal: sellerDiscount,
      platformCouponDiscountTotal: platformDiscount,
      buyerServiceFee,
      taxAmount: 0,
      shippingAmount: 0,
      sharityCreditApplied: 0,
      freePromotionApplied: 0,
      totalAuthorizationAmount: total,
      totalDueNow: total,
      currency: 'USD'
    },
    validationSummary: {
      valid: digitalTermsAccepted,
      checkoutReady: digitalTermsAccepted,
      digitalTermsRequired: !digitalTermsAccepted,
      pricingRefreshRequired: false,
      issues: digitalTermsAccepted ? [{ issueId: 'seller-acceptance', severity: 'INFO', issueCode: 'SELLER_ACCEPTANCE_REQUIRED', message: 'One seller order may require seller acceptance before final capture.', relatedEntityType: 'SELLER_GROUP', relatedEntityId: 'seller-techdeals', requiredAction: 'Review after authorization', route: '/orders' }] : [{ issueId: 'digital-terms', severity: 'WARNING', issueCode: 'DIGITAL_TERMS_REQUIRED', message: 'Digital terms must be accepted before payment authorization.', relatedEntityType: 'CART', relatedEntityId: 'cart-001', requiredAction: 'Accept Digital Terms', route: '/cart' }]
    },
    digitalTerms: {
      required: true,
      accepted: digitalTermsAccepted,
      termsVersion: 'DIGITAL_TERMS_2026_06',
      summary: 'Digital products may become non-refundable after code reveal, file download, or access delivery unless invalid product or Sharity review approves a refund.',
      acceptedAt: digitalTermsAccepted ? new Date().toISOString() : undefined,
      requiredForItemIds: ['cart-item-001', 'cart-item-002', 'saved-001']
    }
  };
}

export async function applyCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  if (normalized === 'SELLER5') {
    sellerCouponApplied = true;
    return 'Seller coupon applied.';
  }
  if (normalized === 'SHARITY10') {
    platformCouponApplied = true;
    return 'Platform coupon applied.';
  }
  throw new Error(normalized === 'EXPIRED' ? 'COUPON_EXPIRED' : 'COUPON_INVALID');
}

export async function acceptDigitalTerms() {
  digitalTermsAccepted = true;
}

export async function getCheckoutPreview(): Promise<CheckoutPreviewResponse> {
  const cart = await getCart();
  return {
    checkoutSessionId: 'checkout-session-1000',
    parentOrderPreview: {
      parentOrderReferencePreview: 'SH-1000',
      sellerOrderCount: cart.sellerGroups.length,
      buyerId: cart.buyerId,
      totalAuthorizationAmount: cart.pricingSummary.totalAuthorizationAmount,
      currency: cart.currency
    },
    sellerOrderPreviews: cart.sellerGroups.map((group, index) => ({
      sellerOrderReferencePreview: `SH-1000-${String.fromCharCode(65 + index)}`,
      sellerId: group.sellerId,
      storeName: group.storeName,
      itemCount: group.items.length,
      subtotal: group.groupSubtotal,
      sellerCouponDiscount: group.sellerCouponDiscount,
      platformCouponAllocation: group.platformCouponAllocation,
      buyerServiceFeeAllocation: Math.round((cart.pricingSummary.buyerServiceFee / cart.sellerGroups.length) * 100) / 100,
      sellerAcceptanceRequired: group.sellerAcceptanceRequired,
      fulfillmentType: group.marketplaceCode === 'DIGITAL' ? 'DIGITAL_ACCESS' : 'SHIPPING',
      currency: cart.currency
    })),
    paymentAuthorizationModel: 'PROVIDER_DECIDED_GROUPED_MARKETPLACE_AUTHORIZATION'
  };
}

function item(cartItemId: string, productTitle: string, productType: string, deliveryType: string, price: number, originalPrice: number, quantity: number) {
  return {
    cartItemId,
    listingId: cartItemId.replace('cart-item', 'listing'),
    productId: cartItemId.replace('cart-item', 'product'),
    sellerId: cartItemId === 'cart-item-003' ? 'seller-techdeals' : 'seller-gamecodehub',
    productImageUrl: productType === 'ELECTRONICS' ? 'marketplace/placeholders/electronics.png' : 'marketplace/placeholders/gift_cards.png',
    productTitle,
    productType,
    marketplaceCode: productType === 'ELECTRONICS' ? 'ELECTRONICS' : 'DIGITAL',
    deliveryType,
    price,
    originalPrice,
    discountAmount: Math.max(originalPrice - price, 0),
    quantity,
    currency: 'USD',
    digitalDeliveryNote: deliveryType === 'SHIPPING_REQUIRED' ? 'Shipping required after seller acceptance' : 'Secure digital delivery after payment capture',
    regionRestriction: 'Works in USA',
    refundRuleSummary: deliveryType === 'SHIPPING_REQUIRED' ? 'Return eligible after delivery' : 'Refund limited after reveal/download',
    validationStatus: 'VALID'
  };
}

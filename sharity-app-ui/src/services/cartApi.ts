// Real cart API service pointing to backend endpoints.
// The screen consumes the buyer-commerce cart contract returned by marketplace-service.

import type { CartResponse, CartSellerGroup, CartItem, CartValidationIssue, CheckoutPreviewResponse } from '../features/cart/cartCheckoutTypes';

const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const marketplaceCommerceBaseUrl = `${bffBaseUrl}/api/marketplace-service`;
export type { CartResponse, CartSellerGroup, CartItem, CartValidationIssue, CheckoutPreviewResponse };
export type CartActionResponse = {
  success: boolean;
  status: string;
  message: string;
  cart: CartResponse;
  updatedAt: string;
};

export async function getCart(): Promise<CartResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart`, {
      credentials: 'include'
    });

    if (!response.ok) {
      // Return empty cart if it doesn't exist yet
      if (response.status === 404) {
        return {
          cartId: '',
          buyerId: '',
          items: [],
          subtotal: 0,
          fees: 0,
          tax: 0,
          total: 0,
          currency: 'USD',
          itemCount: 0
        };
      }
      throw new Error(`Failed to load cart: ${response.statusText}`);
    }

    const raw = await response.json();
    return normalizeCartResponse(raw);
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

export async function addToCart(listingId: string, quantity: number = 1): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/items`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, quantity })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add item to cart: ${error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export async function updateCartItem(cartItemId: string, quantity: number): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/items/${cartItemId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    if (!response.ok) {
      throw new Error(`Failed to update cart item: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

export async function removeFromCart(cartItemId: string): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/items/${cartItemId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to remove item from cart: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

export async function clearCart(): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to clear cart: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

export async function saveItemForLater(cartItemId: string): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/items/${cartItemId}/save-for-later`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to save item for later: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving item for later:', error);
    throw error;
  }
}

export async function applyCouponToCart(couponCode: string): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/coupons/apply`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to apply coupon');
    }

    return await response.json();
  } catch (error) {
    console.error('Error applying coupon:', error);
    throw error;
  }
}

export async function removeCouponFromCart(couponCode: string): Promise<CartActionResponse> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/coupons/remove`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode })
    });

    if (!response.ok) {
      throw new Error(`Failed to remove coupon: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing coupon:', error);
    throw error;
  }
}

export async function validateCart(): Promise<{ valid: boolean; checkoutReady?: boolean; issues?: CartValidationIssue[]; digitalTermsRequired?: boolean; pricingRefreshRequired?: boolean }> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/validate`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to validate cart: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating cart:', error);
    throw error;
  }
}

export async function proceedToCheckout(): Promise<CheckoutPreviewResponse | { checkoutId: string; checkoutRoute: string; userSafeMessage?: string }> {
  try {
    const response = await fetch(`${marketplaceCommerceBaseUrl}/api/cart/checkout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to proceed to checkout: ${error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error proceeding to checkout:', error);
    throw error;
  }
}

function normalizeCartResponse(raw: unknown): CartResponse {
  const fallback: CartResponse = {
    cartId: '',
    buyerId: '',
    currency: 'USD',
    sellerGroups: [],
    savedForLaterItems: [],
    pricingSummary: {
      itemsTotal: 0,
      sellerCouponDiscountTotal: 0,
      platformCouponDiscountTotal: 0,
      buyerServiceFee: 0,
      taxAmount: 0,
      shippingAmount: 0,
      sharityCreditApplied: 0,
      freePromotionApplied: 0,
      totalAuthorizationAmount: 0,
      totalDueNow: 0,
      currency: 'USD'
    },
    validationSummary: {
      valid: true,
      checkoutReady: false,
      issues: [],
      digitalTermsRequired: false,
      pricingRefreshRequired: false
    },
    digitalTerms: {
      required: false,
      accepted: false,
      termsVersion: '',
      summary: '',
      requiredForItemIds: []
    }
  };

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const value = raw as Partial<CartResponse> & {
    cartSummary?: { subtotal?: number; sellerCouponDiscountTotal?: number; platformCouponDiscountTotal?: number; estimatedServiceFee?: number; estimatedTaxes?: number; estimatedTotal?: number };
    digitalTermsAccepted?: boolean;
    digitalTermsRequired?: boolean;
  };

  const sellerGroups = Array.isArray(value.sellerGroups) ? value.sellerGroups : [];
  const savedForLaterItems = Array.isArray(value.savedForLaterItems) ? value.savedForLaterItems : [];
  const validationIssues = value.validationSummary && Array.isArray(value.validationSummary.issues) ? value.validationSummary.issues : [];

  const cart: CartResponse = {
    ...fallback,
    ...value,
    sellerGroups,
    savedForLaterItems,
    pricingSummary: value.pricingSummary ?? {
      ...fallback.pricingSummary,
      itemsTotal: value.cartSummary?.subtotal ?? 0,
      sellerCouponDiscountTotal: value.cartSummary?.sellerCouponDiscountTotal ?? 0,
      platformCouponDiscountTotal: value.cartSummary?.platformCouponDiscountTotal ?? 0,
      buyerServiceFee: value.cartSummary?.estimatedServiceFee ?? 0,
      taxAmount: value.cartSummary?.estimatedTaxes ?? 0,
      shippingAmount: 0,
      sharityCreditApplied: 0,
      freePromotionApplied: 0,
      totalAuthorizationAmount: value.cartSummary?.estimatedTotal ?? 0,
      totalDueNow: value.cartSummary?.estimatedTotal ?? 0,
      currency: value.currency ?? 'USD'
    },
    validationSummary: {
      valid: value.validationSummary?.valid ?? sellerGroups.length > 0,
      checkoutReady: value.validationSummary?.checkoutReady ?? false,
      issues: validationIssues,
      digitalTermsRequired: value.validationSummary?.digitalTermsRequired ?? Boolean(value.digitalTermsRequired),
      pricingRefreshRequired: value.validationSummary?.pricingRefreshRequired ?? false
    },
    digitalTerms: {
      required: value.digitalTerms?.required ?? Boolean(value.digitalTermsRequired),
      accepted: value.digitalTerms?.accepted ?? Boolean(value.digitalTermsAccepted),
      termsVersion: value.digitalTerms?.termsVersion ?? '',
      summary: value.digitalTerms?.summary ?? '',
      acceptedAt: value.digitalTerms?.acceptedAt,
      requiredForItemIds: value.digitalTerms?.requiredForItemIds ?? []
    }
  };

  return cart;
}

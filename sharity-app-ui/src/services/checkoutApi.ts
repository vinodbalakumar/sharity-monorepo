// Real checkout API service pointing to backend endpoints
// Replaces local checkoutMockApi.ts

const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const marketplaceCheckoutBaseUrl = `${bffBaseUrl}/api/marketplace-service`;

export type CheckoutResponse = {
  checkoutId: string;
  buyerId: string;
  items: Array<{
    listingId: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  fees: number;
  tax: number;
  total: number;
  paymentMethods: Array<{
    methodId: string;
    type: 'PAYPAL' | 'CARD' | 'WALLET';
    label: string;
  }>;
  policies: Array<{
    policyId: string;
    title: string;
    required: boolean;
    accepted: boolean;
  }>;
};

export type PaymentAuthorizationResponse = {
  authorizationId: string;
  status: 'PENDING' | 'AUTHORIZED' | 'FAILED' | 'CANCELLED';
  paymentUrl?: string;
  redirectRequired: boolean;
};

export async function createCheckout(cartId: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/from-cart`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Checkout creation failed: ${error || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
}

export async function getCheckout(checkoutId: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to load checkout: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching checkout:', error);
    throw error;
  }
}

export async function refreshCheckout(checkoutId: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh checkout: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing checkout:', error);
    throw error;
  }
}

export async function applyCoupon(checkoutId: string, couponCode: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/coupons/apply`, {
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

export async function removeCoupon(checkoutId: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/coupons/remove`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
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

export async function selectPaymentMethod(checkoutId: string, methodId: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/payment-method`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methodId })
    });

    if (!response.ok) {
      throw new Error(`Failed to select payment method: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error selecting payment method:', error);
    throw error;
  }
}

export async function acknowledgePolicy(checkoutId: string, policyId: string): Promise<CheckoutResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/policies/acknowledge`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyId })
    });

    if (!response.ok) {
      throw new Error(`Failed to acknowledge policy: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    throw error;
  }
}

export async function startPaymentAuthorization(checkoutId: string): Promise<PaymentAuthorizationResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/authorize-payment`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to start payment authorization: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting payment authorization:', error);
    throw error;
  }
}

export async function getAuthorizationStatus(checkoutId: string): Promise<PaymentAuthorizationResponse> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/authorization-status`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to get authorization status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching authorization status:', error);
    throw error;
  }
}

export async function cancelCheckout(checkoutId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/${checkoutId}/cancel`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel checkout: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling checkout:', error);
    throw error;
  }
}

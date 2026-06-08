// Real cart API service pointing to backend endpoints
// Replaces local cartCheckoutMockApi.ts

const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';

export type CartResponse = {
  cartId: string;
  buyerId: string;
  items: Array<{
    cartItemId: string;
    listingId: string;
    title: string;
    imageUrl?: string;
    price: number;
    quantity: number;
    sellerId: string;
    sellerAlias: string;
  }>;
  subtotal: number;
  fees: number;
  tax: number;
  total: number;
  currency: string;
  itemCount: number;
};

export async function getCart(): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart`, {
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

    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

export async function addToCart(listingId: string, quantity: number = 1): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/items`, {
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

export async function updateCartItem(cartItemId: string, quantity: number): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/items/${cartItemId}`, {
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

export async function removeFromCart(cartItemId: string): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/items/${cartItemId}`, {
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

export async function clearCart(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart`, {
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

export async function saveItemForLater(cartItemId: string): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/items/${cartItemId}/save-for-later`, {
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

export async function applyCouponToCart(couponCode: string): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/coupons/apply`, {
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

export async function removeCouponFromCart(couponCode: string): Promise<CartResponse> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/coupons/remove`, {
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

export async function validateCart(): Promise<{ valid: boolean; issues?: string[] }> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/validate`, {
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

export async function proceedToCheckout(): Promise<{ checkoutId: string; checkoutUrl: string }> {
  try {
    const response = await fetch(`${bffBaseUrl}/api/cart/checkout`, {
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

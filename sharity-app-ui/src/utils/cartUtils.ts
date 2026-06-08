import type { CartItem, CartSellerGroup, CartResponse } from '../features/cart/cartCheckoutTypes';

export function getTotalCartValue(cart: CartResponse): number {
  const itemsTotal = cart.sellerGroups.reduce((sum, group) => sum + group.groupSubtotal, 0);
  const sellerDiscount = cart.sellerGroups.reduce((sum, group) => sum + group.sellerCouponDiscount, 0);
  const platformDiscount = cart.sellerGroups.reduce((sum, group) => sum + group.platformCouponAllocation, 0);
  return itemsTotal - sellerDiscount - platformDiscount;
}

export function getCartItemCount(cart: CartResponse): number {
  return cart.sellerGroups.reduce((sum, group) => sum + group.items.length, 0);
}

export function getGroupTotal(group: CartSellerGroup): number {
  return group.groupSubtotal - group.sellerCouponDiscount - group.platformCouponAllocation;
}

export function canCheckout(cart: CartResponse): boolean {
  return cart.sellerGroups.every((group) => group.validationStatus === 'VALID' || group.validationStatus === 'SELLER_ACCEPTANCE_REQUIRED');
}

export function requiresSellerAcceptance(cart: CartResponse): boolean {
  return cart.sellerGroups.some((group) => group.sellerAcceptanceRequired && group.validationStatus === 'SELLER_ACCEPTANCE_REQUIRED');
}

export function getValidationIssues(cart: CartResponse): string[] {
  return cart.validationSummary.issues.map((issue) => issue.message);
}

export function hasDigitalProducts(cart: CartResponse): boolean {
  return cart.sellerGroups.some((group) => group.marketplaceCode === 'DIGITAL');
}

export function hasPhysicalProducts(cart: CartResponse): boolean {
  return cart.sellerGroups.some((group) => group.marketplaceCode !== 'DIGITAL');
}

export function formatCartSubtotal(group: CartSellerGroup): string {
  return `$${group.groupSubtotal.toFixed(2)}`;
}

export function calculateSavings(cart: CartResponse): number {
  return cart.sellerGroups.reduce((sum, group) => sum + group.sellerCouponDiscount + group.platformCouponAllocation, 0);
}

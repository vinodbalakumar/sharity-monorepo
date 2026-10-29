import { appStorage } from '../storage/storage';
import { ApiError, apiRequest } from './apiClient';
import { refreshCartCount, type PurchaseOrder, type StoredCart } from './commerceApi';
import { getBrowserSessionSummary } from './sessionService';

const base = '/api/marketplace-service/api/v1/marketplace';
export type PhysicalCheckout = {
  checkoutPublicId: string; status: string; currencyCode: string;
  itemAmount: number; platformFeeAmount: number; customerTotalAmount: number; providerAmount: number;
  orders: PurchaseOrder[];
};
type CheckoutBody = { items: { cartItemId: string; quantity: number; unitPrice: number; currencyCode: string }[] };
export type CartCheckoutAttempt = {
  owner: string; requestKey: string; cartId: string; body: CheckoutBody;
  cart: StoredCart; submitted: boolean; rejected?: boolean; checkout?: PhysicalCheckout;
};
const storageKey = (owner: string) => `physicalCartCheckout:${owner}`;
export const checkoutConfirmed = (status: string) => ['PAID', 'CAPTURED', 'COMPLETED', 'PURCHASED'].includes(status.toUpperCase());
export const checkoutStopped = (status: string) => /FAIL|CANCEL|HOLD|REJECT|REFUND/.test(status.toUpperCase());
export function physicalCartIssue(cart: StoredCart): string {
  if (!cart.items.length) return 'Add physical items to your cart first.';
  if (!/^[A-Za-z]{3}$/.test(cart.currencyCode)) return 'Review the cart currency before checkout.';
  if (cart.items.some(item => (item.productType && item.productType !== 'PHYSICAL') || !['SHIPPING', 'SHIPPING_REQUIRED', 'LOCAL_PICKUP'].includes(item.deliveryType)))
    return 'Cart checkout is for physical items only. Remove digital items and use their Buy Now option instead.';
  if (cart.items.some(item => item.currencyCode && item.currencyCode.toUpperCase() !== cart.currencyCode.toUpperCase()))
    return 'All physical cart items must use the same currency. Review your cart before checkout.';
  if (cart.items.length > 50 || cart.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || !Number.isFinite(item.unitPrice) || item.unitPrice <= 0))
    return 'Review item quantities and prices before checkout (up to 50 listings and 99 of each item).';
  return '';
}
async function ownerId() {
  const session = await getBrowserSessionSummary();
  if (!session?.authenticated || !session.publicId) throw new Error('Sign in to resume your physical cart checkout.');
  return session.publicId;
}
function read(owner: string): CartCheckoutAttempt | null {
  const raw = appStorage.getString(storageKey(owner));
  if (!raw) return null;
  try {
    const attempt = JSON.parse(raw) as CartCheckoutAttempt;
    if (attempt.owner === owner && /^[A-Za-z0-9_-]{16,64}$/.test(attempt.requestKey) && attempt.cartId && attempt.body?.items?.length && attempt.cart)
      return attempt;
  } catch { /* Never silently replace an unreadable payment intent. */ }
  throw new Error('Your saved checkout cannot be read. Contact support before placing another checkout.');
}
function persist(attempt: CartCheckoutAttempt) {
  const value = JSON.stringify(attempt);
  appStorage.setString(storageKey(attempt.owner), value);
  if (appStorage.getString(storageKey(attempt.owner)) !== value)
    throw new Error('Checkout could not be saved on this device. Enable storage and check your orders before trying again.');
}
export async function readCartCheckout() { return read(await ownerId()); }
export async function prepareCartCheckout(cart: StoredCart) {
  const owner = await ownerId();
  const current = read(owner);
  // An ambiguous POST must be resolved using its original snapshot, even if the cart is now empty or changed.
  if (current?.submitted && (!current.checkout || !checkoutConfirmed(current.checkout.status))) return current;
  const issue = physicalCartIssue(cart);
  if (issue) throw new Error(issue);
  const body: CheckoutBody = { items: cart.items.map(item => ({
    cartItemId: item.cartItemId, quantity: item.quantity, unitPrice: item.unitPrice, currencyCode: cart.currencyCode,
  })).sort((a, b) => a.cartItemId.localeCompare(b.cartItemId)) };
  if (current && !current.submitted && current.cartId === cart.cartId && JSON.stringify(current.body) === JSON.stringify(body)) {
    const reviewed = { ...current, rejected: false };
    persist(reviewed);
    return reviewed;
  }
  const attempt: CartCheckoutAttempt = {
    owner, requestKey: `cart_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`,
    cartId: cart.cartId, body, cart: JSON.parse(JSON.stringify(cart)) as StoredCart, submitted: false,
  };
  persist(attempt);
  return attempt;
}
export async function submitCartCheckout(expected: CartCheckoutAttempt) {
  const owner = await ownerId();
  const current = read(owner);
  if (!current || current.requestKey !== expected.requestKey || JSON.stringify(current.body) !== JSON.stringify(expected.body))
    throw new Error('The saved checkout changed. Reload and review it before continuing.');
  if (current.checkout) return current;
  if (current.rejected) throw new Error('No checkout was recorded. Return to cart and review the current items and prices before trying again.');
  const attempt = { ...current, submitted: true };
  persist(attempt);
  let checkout: PhysicalCheckout;
  try {
    checkout = await apiRequest<PhysicalCheckout>(`${base}/cart/${encodeURIComponent(attempt.cartId)}/checkout`, {
      method: 'POST', headers: { 'Idempotency-Key': attempt.requestKey }, body: JSON.stringify(attempt.body),
    });
  } catch (error) {
    // A rejection can also be an idempotency mismatch after a committed checkout. Never clear on status alone.
    if (!(error instanceof ApiError) || !((error.status >= 400 && error.status < 500) || error.status === 503)) throw error;
    let resolution: { checkout: PhysicalCheckout | null };
    try {
      resolution = await apiRequest(`${base}/cart/${encodeURIComponent(attempt.cartId)}/checkout-attempt`, {
        headers: { 'Idempotency-Key': attempt.requestKey }, cache: 'no-store',
      });
      if (!resolution || !Object.prototype.hasOwnProperty.call(resolution, 'checkout') ||
        (resolution.checkout !== null && !resolution.checkout?.checkoutPublicId)) throw new Error('Invalid resolution');
    } catch {
      throw new Error('Checkout could not be resolved. Keep this saved checkout and retry only its original request; do not start another payment.');
    }
    if (!resolution.checkout) {
      if (read(owner)?.requestKey === attempt.requestKey) persist({ ...attempt, submitted: false, rejected: true });
      throw new Error('No checkout was recorded. Return to cart and review the current items and prices before trying again.');
    }
    checkout = resolution.checkout;
  }
  const saved = { ...attempt, checkout };
  if (read(owner)?.requestKey === attempt.requestKey) persist(saved);
  void refreshCartCount();
  return saved;
}
export async function refreshCartCheckout(expected: CartCheckoutAttempt) {
  const owner = await ownerId();
  const current = read(owner);
  if (!current?.checkout || current.requestKey !== expected.requestKey) throw new Error('Reload your saved checkout to check its payment.');
  const checkout = await apiRequest<PhysicalCheckout>(`${base}/checkouts/${encodeURIComponent(current.checkout.checkoutPublicId)}`);
  const saved = { ...current, checkout };
  if (read(owner)?.requestKey === current.requestKey) persist(saved);
  void refreshCartCount();
  return saved;
}

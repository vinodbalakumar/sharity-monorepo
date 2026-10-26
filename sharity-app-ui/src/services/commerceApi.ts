import { apiRequest } from './apiClient';
import { appStorage } from '../storage/storage';

const base = '/api/marketplace-service/api/v1';
export type StoredCartItem = { cartItemId: string; listingId: string; listingTitle: string; quantity: number; unitPrice: number; lineTotal: number; deliveryType: string };
export type StoredCart = { cartId: string; totalItems: number; subtotal: number; discountAmount: number; taxAmount: number; total: number; currencyCode: string; items: StoredCartItem[] };
export type PurchaseOrder = { publicId: string; listingPublicId: string; orderStatus: string; paymentStatus: string; fulfillmentStatus: string; payoutStatus: string; customerTotalAmount: number; currencyCode: string; createdAt: string };
export const getStoredCart = () => apiRequest<StoredCart>(`${base}/cart/current`, { method: 'POST' });
export async function addStoredCartItem(listingId: string) {
  const cart = await getStoredCart();
  return apiRequest<StoredCartItem>(`${base}/cart/${encodeURIComponent(cart.cartId)}/items`, { method: 'POST', body: JSON.stringify({ listingId, quantity: 1 }) });
}
export const changeStoredCartItem = (cartId: string, itemId: string, quantity: number) => apiRequest<StoredCartItem>(`${base}/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
export const removeStoredCartItem = (cartId: string, itemId: string) => apiRequest<void>(`${base}/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
export function selectPurchase(listingId: string) {
  const previous = readPurchase();
  if (previous.listingId !== listingId) appStorage.setString('commercePurchase', JSON.stringify({ listingId }));
}
export function readPurchase(): { listingId?: string; requestKey?: string; orderId?: string } {
  try { return JSON.parse(appStorage.getString('commercePurchase') ?? '{}'); } catch { return {}; }
}
export async function submitPurchase(listingId: string, amount: number, currency: string) {
  const context = readPurchase();
  const requestKey = context.listingId === listingId && context.requestKey ? context.requestKey
    : `purchase_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  appStorage.setString('commercePurchase', JSON.stringify({ listingId, requestKey }));
  const order = await apiRequest<PurchaseOrder>(`${base}/marketplace/orders`, { method: 'POST', headers: { 'Idempotency-Key': requestKey }, body: JSON.stringify({ listingPublicId: listingId, expectedAmount: amount, expectedCurrency: currency }) });
  appStorage.setString('commercePurchase', JSON.stringify({ listingId, requestKey, orderId: order.publicId }));
  return order;
}
export const loadPurchase = (id: string) => apiRequest<PurchaseOrder>(`${base}/marketplace/orders/purchases/${encodeURIComponent(id)}`);
export const refreshPurchase = (id: string) => apiRequest<PurchaseOrder>(`${base}/marketplace/orders/purchases/${encodeURIComponent(id)}/refresh`, { method: 'POST' });

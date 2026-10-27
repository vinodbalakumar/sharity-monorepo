import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from './apiClient';
import { loadPurchase, refreshPurchase, type PurchaseOrder } from './commerceApi';
import { getMarketplaceListing } from './marketplaceApi';
import type { MarketplaceListing } from '../types/marketplace';

export const paymentConfirmed = (status: string) => ['CAPTURED', 'PAID', 'COMPLETED'].includes(status.toUpperCase());
export const paymentPending = (status: string) => ['PENDING', 'PAYMENT_PENDING', 'PROCESSING', 'AUTHORIZED'].includes(status.toUpperCase());
export const paymentStatusLabel = (status: string) => paymentConfirmed(status) ? 'Confirmed' : paymentPending(status) ? 'Awaiting confirmation' : status.toLowerCase().replace(/_/g, ' ').replace(/^./, value => value.toUpperCase());
export const fulfillmentStatusLabel = (status: string) => ['PENDING', 'PENDING_DELIVERY'].includes(status) ? 'Awaiting seller delivery' : status.toLowerCase().replace(/_/g, ' ').replace(/^./, value => value.toUpperCase());
export const purchaseDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
export function usePurchaseDetails(orderId: string | null) {
  const sequence = useRef(0);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    const request = ++sequence.current;
    const active = () => request === sequence.current;
    setLoading(true); setError(''); setNotice(''); setOrder(null); setListing(null); setDemo(false);
    try {
      if (!orderId) throw new Error('Choose an order from your purchase history to continue.');
      const saved = await loadPurchase(orderId);
      if (!active()) return;
      setOrder(saved);
      const [item, config, current] = await Promise.allSettled([
        getMarketplaceListing(saved.listingPublicId).then(item => { if (active()) setListing(item); return item; }),
        apiRequest<{ mode: string }>('/api/marketplace-service/api/v1/commerce/config').then(config => { if (active()) setDemo(config.mode === 'DEMO'); return config; }),
        refreshPurchase(saved.publicId).then(current => { if (active()) setOrder(current); return current; }),
      ]);
      if (!active()) return;
      if (item.status === 'fulfilled') setListing(item.value);
      if (config.status === 'fulfilled') setDemo(config.value.mode === 'DEMO');
      if (current.status === 'fulfilled') setOrder(current.value);
      else setNotice('We could not update payment status. Your recorded order is shown below. Refresh to check again.');
      if (current.status === 'fulfilled' && paymentPending(current.value.paymentStatus)) setNotice('Payment confirmation is still pending. Your order is saved; please check again shortly.');
    } catch (ex) { if (active()) setError(ex instanceof Error ? ex.message : 'Unable to load your order.'); }
    finally { if (active()) setLoading(false); }
  }, [orderId]);
  const cancelPending = useCallback(() => { sequence.current++; }, []);
  useEffect(() => { void load(); return cancelPending; }, [load, cancelPending]);
  return { order, listing, demo, loading, error, notice, reload: load };
}

import type { MarketplaceListing } from '../types/marketplace';
export function listingLabel(value: string) {
  if (value === 'GIFTCARDS' || value === 'GIFT_CARDS') return 'Gift cards';
  return String(value || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
export function formatListingPrice(item: MarketplaceListing, override?: number) {
  const currency = item.displayCurrencyCode || item.currencyCode;
  const amount = override ?? item.displayPriceAmount ?? item.priceAmount;
  if (!Number.isFinite(amount) || !/^[A-Z]{3}$/.test(currency)) return 'Price unavailable';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return 'Price unavailable'; }
}
export function compareListingPrice(a: MarketplaceListing, b: MarketplaceListing) {
  // Different display currencies must not be ranked as if their values were equivalent.
  return (a.displayCurrencyCode || a.currencyCode).localeCompare(b.displayCurrencyCode || b.currencyCode)
    || (a.displayPriceAmount ?? a.priceAmount) - (b.displayPriceAmount ?? b.priceAmount);
}

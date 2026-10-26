import { createContext, useContext } from 'react';
export const OrderCurrencyContext = createContext('USD');
export function CurrencyAmount({ amount }: { amount: number }) {
 const currency = useContext(OrderCurrencyContext);
 let value = 'Amount unavailable';
 try { value = new Intl.NumberFormat('en-US', { currency, style: 'currency' }).format(amount); } catch { /* invalid currency is not an amount in dollars */ }
 return <>{value}</>;
}

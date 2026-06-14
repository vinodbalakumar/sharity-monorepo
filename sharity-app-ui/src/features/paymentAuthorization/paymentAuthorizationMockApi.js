import { readPaymentFlowContext, writePaymentFlowContext } from '../../services/paymentFlowStorage';
import { readApiErrorMessage } from '../../services/sessionService';
const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const marketplaceCheckoutBaseUrl = `${bffBaseUrl}/api/marketplace-service`;
function toNumber(value) {
    if (typeof value === 'number') {
        return value;
    }
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}
function resolveCheckoutSessionId(checkoutSessionId) {
    const storedCheckoutId = readPaymentFlowContext().checkoutId;
    const resolved = checkoutSessionId ?? storedCheckoutId;
    if (!resolved) {
        throw new Error('Payment authorization session is unavailable. Return to checkout and try again.');
    }
    return resolved;
}
function mapScreenResponse(body) {
    return {
        ...body,
        pricingSummary: {
            ...body.pricingSummary,
            buyerServiceFee: toNumber(body.pricingSummary.buyerServiceFee),
            itemsTotal: toNumber(body.pricingSummary.itemsTotal),
            platformDiscounts: toNumber(body.pricingSummary.platformDiscounts),
            sellerDiscounts: toNumber(body.pricingSummary.sellerDiscounts),
            sharityCreditApplied: toNumber(body.pricingSummary.sharityCreditApplied),
            shippingAmount: toNumber(body.pricingSummary.shippingAmount),
            taxAmount: toNumber(body.pricingSummary.taxAmount),
            totalAuthorizationAmount: toNumber(body.pricingSummary.totalAuthorizationAmount),
            totalCapturedAmount: toNumber(body.pricingSummary.totalCapturedAmount),
            totalReleasedAmount: toNumber(body.pricingSummary.totalReleasedAmount)
        },
        sellerOrderAuthorizationStatuses: body.sellerOrderAuthorizationStatuses.map((sellerOrder) => ({
            ...sellerOrder,
            amountAuthorized: toNumber(sellerOrder.amountAuthorized),
            amountCaptured: toNumber(sellerOrder.amountCaptured),
            amountReleased: toNumber(sellerOrder.amountReleased)
        }))
    };
}
async function parseResponse(response, fallbackMessage) {
    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, fallbackMessage));
    }
    return await response.json();
}
export async function getPaymentAuthorization(checkoutSessionId) {
    const resolvedCheckoutId = resolveCheckoutSessionId(checkoutSessionId);
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/sessions/${encodeURIComponent(resolvedCheckoutId)}/payment-authorization`, {
        credentials: 'include'
    });
    const body = await parseResponse(response, 'Failed to load payment authorization details');
    writePaymentFlowContext({ checkoutId: body.checkoutSessionId });
    return mapScreenResponse(body);
}
export async function startPayPalAuthorization(checkoutSessionId) {
    const resolvedCheckoutId = resolveCheckoutSessionId(checkoutSessionId);
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/sessions/${encodeURIComponent(resolvedCheckoutId)}/paypal/authorize`, {
        method: 'POST',
        credentials: 'include'
    });
    const body = await parseResponse(response, 'Failed to start PayPal authorization');
    writePaymentFlowContext({ checkoutId: body.checkoutSessionId, status: body.status });
    return body;
}
export async function retryAuthorization(checkoutSessionId) {
    const resolvedCheckoutId = resolveCheckoutSessionId(checkoutSessionId);
    const response = await fetch(`${marketplaceCheckoutBaseUrl}/api/checkout/sessions/${encodeURIComponent(resolvedCheckoutId)}/authorization/retry`, {
        method: 'POST',
        credentials: 'include'
    });
    const body = await parseResponse(response, 'Failed to retry payment authorization');
    writePaymentFlowContext({ checkoutId: body.checkoutSessionId, status: body.status });
    return body;
}

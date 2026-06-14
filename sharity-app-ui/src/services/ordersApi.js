import { getMarketplaceListing } from './marketplaceApi';
import { getBffCsrfToken } from './sessionService';
import { placeholderImageUrl, resolveMockImageUrl } from '../utils/mockImages';
const marketplaceOrdersBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const requestTimeoutMs = 7000;
async function getJson(path, signal) {
    const controller = signal ? null : new AbortController();
    const timeout = controller
        ? setTimeout(() => {
            controller.abort();
        }, requestTimeoutMs)
        : undefined;
    try {
        const response = await fetch(`${marketplaceOrdersBaseUrl}${path}`, {
            credentials: 'include',
            signal: signal ?? controller?.signal
        });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return (await response.json());
    }
    finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
}
export async function getBuyerOrders(signal) {
    const orders = await getJson('/api/marketplace-service/api/v1/marketplace/orders/purchases', signal);
    const enriched = await Promise.all(orders.map(async (order) => {
        const listing = await loadListing(order.listingPublicId).catch(() => null);
        return mapOrder(order, listing);
    }));
    return enriched.sort((left, right) => new Date(right.dateIso).getTime() - new Date(left.dateIso).getTime());
}
export async function reportOrderProblem(orderId, request) {
    const csrf = await getBffCsrfToken();
    const response = await fetch(`${marketplaceOrdersBaseUrl}/api/marketplace-service/api/v1/marketplace/orders/${orderId}/report-problem`, {
        body: JSON.stringify(request),
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(csrf.csrfToken ? { 'X-CSRF-TOKEN': csrf.csrfToken } : {})
        },
        method: 'POST'
    });
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json());
}
async function loadListing(listingPublicId) {
    const listing = await getMarketplaceListing(listingPublicId);
    return {
        publicId: listing.publicId,
        title: listing.title,
        categoryCode: listing.categoryCode,
        productType: listing.productType,
        deliveryType: listing.deliveryType,
        imageUrl: listing.imageUrl,
        sellerDisplayName: listing.sellerDisplayName,
        listingStatus: listing.listingStatus
    };
}
function mapOrder(order, listing) {
    const digital = isDigitalProduct(listing);
    const status = mapStatus(order.orderStatus, order.fulfillmentStatus, order.payoutStatus, digital);
    const payment = mapPayment(order.paymentStatus);
    const imageUrl = resolveImage(listing?.imageUrl, digital);
    return {
        category: listing?.categoryCode ?? 'Marketplace',
        dateIso: order.createdAt,
        dateLabel: formatDateLabel(order.createdAt),
        id: order.publicId,
        listingPublicId: order.listingPublicId,
        imageUrl,
        name: listing?.title ?? order.publicId,
        payment,
        price: Number(order.customerTotalAmount),
        seller: listing?.sellerDisplayName ?? 'Sharity Seller',
        status,
        trackingStep: status === 'delivered' || status === 'refund_requested' || status === 'disputed'
            ? 4
            : status === 'shipped'
                ? 2
                : status === 'access_ready'
                    ? 1
                    : 1,
        type: digital ? 'digital' : 'physical'
    };
}
function isDigitalProduct(listing) {
    if (!listing) {
        return false;
    }
    const productType = listing.productType.toUpperCase();
    const deliveryType = listing.deliveryType.toUpperCase();
    return productType.includes('DIGITAL') || deliveryType.includes('DIGITAL');
}
function mapStatus(orderStatus, fulfillmentStatus, payoutStatus, digital) {
    const normalizedOrder = orderStatus.toUpperCase();
    const normalizedFulfillment = fulfillmentStatus.toUpperCase();
    const normalizedPayout = payoutStatus.toUpperCase();
    if (normalizedOrder.includes('DISPUT') || normalizedPayout.includes('DISPUT')) {
        return 'disputed';
    }
    if (normalizedOrder.includes('REFUND') || normalizedPayout.includes('REFUND')) {
        return 'refund_requested';
    }
    if (normalizedFulfillment.includes('DELIVER') || normalizedOrder.includes('COMPLET')) {
        return digital ? 'access_ready' : 'delivered';
    }
    if (normalizedFulfillment.includes('SHIP') || normalizedOrder.includes('SHIP')) {
        return 'shipped';
    }
    if (normalizedOrder.includes('ACCES') || normalizedFulfillment.includes('READY') || normalizedPayout.includes('ELIGIBLE')) {
        return 'access_ready';
    }
    if (normalizedOrder.includes('PENDING') || normalizedFulfillment.includes('PENDING') || normalizedPayout.includes('HOLD')) {
        return 'processing';
    }
    return digital ? 'access_ready' : 'processing';
}
function mapPayment(paymentStatus) {
    const normalized = paymentStatus.toUpperCase();
    if (normalized.includes('PAID') || normalized.includes('CAPTURE') || normalized.includes('AUTHORIZED')) {
        return 'paid';
    }
    if (normalized.includes('DELIVER')) {
        return 'delivered';
    }
    return 'pending';
}
function resolveImage(imageUrl, digital) {
    if (imageUrl && imageUrl.trim().length > 0) {
        return resolveMockImageUrl(imageUrl, 96);
    }
    return placeholderImageUrl(digital ? 'gift_cards' : 'electronics', 96);
}
function formatDateLabel(isoDate) {
    const date = new Date(isoDate);
    return Number.isNaN(date.getTime())
        ? isoDate
        : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

import type { PaymentAuthorizationScreenResponse } from './paymentAuthorizationTypes';

const now = Date.now();

export async function getPaymentAuthorization(): Promise<PaymentAuthorizationScreenResponse> {
  return {
    checkoutSessionId: 'checkout-session-1000',
    parentOrderPreview: { parentOrderReferencePreview: 'SH-1000', sellerOrderCount: 3 },
    paymentProviderOptions: [
      { providerCode: 'PAYPAL', providerName: 'PayPal', enabled: true, primary: true, comingSoon: false, status: 'AVAILABLE', message: 'PayPal is the primary MVP authorization provider.' },
      { providerCode: 'STRIPE', providerName: 'Stripe', enabled: false, primary: false, comingSoon: true, status: 'COMING_SOON', message: 'Stripe authorization is coming later.' }
    ],
    pricingSummary: {
      itemsTotal: 293.98,
      sellerDiscounts: 5,
      platformDiscounts: 10,
      buyerServiceFee: 3.5,
      sharityCreditApplied: 0,
      taxAmount: 0,
      shippingAmount: 0,
      totalAuthorizationAmount: 282.48,
      totalCapturedAmount: 39.98,
      totalReleasedAmount: 24.99,
      currency: 'USD'
    },
    authorizationNotice: 'Authorization confirms your payment method. Final capture may happen only for seller orders that are accepted and eligible.',
    sellerAcceptanceSummary: {
      sellerOrderCount: 3,
      acceptanceRequiredCount: 2,
      acceptedCount: 1,
      pendingCount: 1,
      rejectedCount: 1,
      expiredCount: 0,
      partiallyAccepted: true,
      message: 'Partial acceptance: one seller accepted, one is pending, and one was rejected with authorization released.'
    },
    sellerOrderAuthorizationStatuses: [
      order('seller-order-a', 'SH-1000-A', 'Game Code Hub', 'GameCodeHub', false, 'ACCEPTED', 'CAPTURED', 'DIGITAL_DELIVERY_READY', 39.98, 39.98, 0),
      order('seller-order-b', 'SH-1000-B', 'Tech Deals Phoenix', 'TechDealsPhoenix', true, 'PENDING', 'CAPTURE_PENDING', 'WAITING_FOR_SELLER_ACCEPTANCE', 217.51, 0, 0),
      order('seller-order-c', 'SH-1000-C', 'Template Studio', 'TemplateStudio', true, 'REJECTED', 'RELEASED', 'DIGITAL_DELIVERY_BLOCKED', 24.99, 0, 24.99)
    ],
    digitalDeliveryEligibility: {
      eligible: false,
      status: 'PARTIAL',
      message: 'Digital delivery is available only for captured seller orders. Pending/rejected orders remain blocked.',
      eligibleSellerOrderIds: ['seller-order-a'],
      blockedSellerOrderIds: ['seller-order-b', 'seller-order-c'],
      blockedReasons: ['Waiting for seller acceptance', 'Seller rejected and authorization released']
    },
    paymentTimeline: [
      event('created', 'Checkout session created', 'Parent order preview SH-1000 prepared.', 'INFO', 60),
      event('terms', 'Digital terms accepted', 'Buyer accepted digital delivery and refund rules.', 'SUCCESS', 45),
      event('authorized', 'Payment authorized', 'PayPal authorization completed with buyer-safe reference only.', 'SUCCESS', 30),
      event('accepted', 'Seller accepted', 'SH-1000-A accepted and captured.', 'SUCCESS', 20, 'seller-order-a', 'SH-1000-A'),
      event('pending', 'Seller acceptance pending', 'SH-1000-B must be accepted before the deadline.', 'WARNING', 12, 'seller-order-b', 'SH-1000-B'),
      event('rejected', 'Seller rejected', 'SH-1000-C was cancelled and authorization released.', 'CRITICAL', 6, 'seller-order-c', 'SH-1000-C')
    ]
  };
}

export async function startPayPalAuthorization() {
  return { checkoutSessionId: 'checkout-session-1000', provider: 'PAYPAL', redirectUrl: '/paypal/mock-authorize', status: 'REDIRECTING', message: 'Redirecting to PayPal...' };
}

export async function retryAuthorization() {
  return { status: 'AUTHORIZED', message: 'Retry authorization succeeded.' };
}

function order(sellerOrderId: string, ref: string, store: string, alias: string, required: boolean, acceptance: string, capture: string, delivery: string, amount: number, captured: number, released: number) {
  return {
    sellerOrderId,
    sellerOrderReference: ref,
    sellerId: sellerOrderId.replace('seller-order', 'seller'),
    storeName: store,
    sellerAlias: alias,
    itemCount: 1,
    productTypeSummary: required ? 'Electronics / manual digital delivery' : 'Instant digital code',
    amountAuthorized: amount,
    amountCaptured: captured,
    amountReleased: released,
    currency: 'USD',
    sellerAcceptanceRequired: required,
    acceptanceStatus: acceptance,
    acceptanceDeadline: new Date(now + 22 * 60 * 60 * 1000).toISOString(),
    paymentAuthorizationStatus: 'AUTHORIZED',
    captureStatus: capture,
    releaseStatus: released > 0 ? 'RELEASED' : 'NONE',
    digitalDeliveryStatus: delivery,
    nextStep: acceptance === 'PENDING' ? 'Seller must accept within 24 hours.' : acceptance === 'REJECTED' ? 'Authorization released for this seller order.' : 'Buyer may view eligible order status.'
  };
}

function event(eventId: string, title: string, description: string, status: string, minutesAgo: number, sellerOrderId?: string, sellerOrderReference?: string) {
  return { eventId, eventType: eventId.toUpperCase(), sellerOrderId, sellerOrderReference, title, description, timestamp: new Date(now - minutesAgo * 60 * 1000).toISOString(), status, buyerSafe: true };
}

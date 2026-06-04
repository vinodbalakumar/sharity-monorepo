import type {
  CheckoutRecoverySummaryResponse,
  CheckoutRevalidateResponse,
  DigitalAccessStatusResponse,
  OrderConfirmationResponse,
  PaymentAttemptStatusResponse,
  PaymentConfirmationResponse,
  PaymentFailureStatus,
  ReceiptResponse,
  RetryPaymentResponse
} from './paymentTypes';

const productImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3';

export async function getPaymentConfirmation(paymentSessionId: string): Promise<PaymentConfirmationResponse> {
  return {
    checkoutId: 'checkout-001',
    confirmedAt: '2026-06-03T19:05:00Z',
    orderIds: ['order-digital-001', 'order-electronics-001'],
    paymentSessionId,
    paymentStatus: 'CONFIRMED',
    provider: 'PAYPAL',
    safePaymentReference: 'PAY-1234-ABCD'
  };
}

export async function getOrderConfirmationSummary(checkoutId: string): Promise<OrderConfirmationResponse> {
  return {
    checkoutId,
    notificationMessage: "We'll send updates by email and app notifications.",
    orderGroups: [
      {
        availableActions: ['GO_TO_LIBRARY', 'DOWNLOAD_FILE', 'VIEW_CODE', 'VIEW_ORDER_DETAILS'],
        digitalAccessStatus: 'Code Reveal Available',
        fulfillmentStatus: 'Access Ready',
        itemCount: 2,
        items: [
          {
            accessStatus: 'Code Reveal Available',
            deliveryType: 'INSTANT_CODE_REVEAL',
            price: 14.99,
            productId: 'digital-xbox-game-pass',
            productImageUrl: productImage,
            productTitle: 'Xbox Game Pass Digital Code',
            productType: 'GAMING_CODE',
            quantity: 1,
            shippingRequired: false
          },
          {
            accessStatus: 'Download Ready',
            deliveryType: 'SECURE_DOWNLOAD',
            price: 29.99,
            productId: 'digital-template-pack',
            productImageUrl: productImage,
            productTitle: 'Premium Downloadable Template Pack',
            productType: 'DOWNLOADABLE_FILE',
            quantity: 1,
            shippingRequired: false
          }
        ],
        marketplaceCode: 'DIGITAL',
        marketplaceName: 'Digital Marketplace',
        orderId: 'order-digital-001',
        paymentStatus: 'Paid',
        sellerDisplayName: 'GameCodeHub',
        sellerId: 'seller-001',
        sellerVerified: true
      },
      {
        availableActions: ['VIEW_ORDER_DETAILS', 'TRACK_SHIPPING', 'CONTACT_SELLER'],
        fulfillmentStatus: 'Shipping Pending',
        itemCount: 1,
        items: [
          {
            condition: 'Used',
            deliveryType: 'SHIPPING_REQUIRED',
            price: 499,
            productId: 'electronics-iphone-14',
            productImageUrl: productImage,
            productTitle: 'Used iPhone 14',
            productType: 'ELECTRONICS',
            quantity: 1,
            shippingRequired: true
          }
        ],
        marketplaceCode: 'ELECTRONICS',
        marketplaceName: 'Electronics Marketplace',
        orderId: 'order-electronics-001',
        paymentStatus: 'Paid',
        sellerDisplayName: 'TechDeals USA',
        sellerId: 'seller-002',
        sellerVerified: true,
        shippingStatus: 'Shipping Pending'
      }
    ],
    paymentStatus: 'Paid',
    primaryCta: 'VIEW_ORDER_DETAILS',
    receiptAvailable: true,
    safePaymentReference: 'PAY-1234-ABCD',
    secondaryActions: ['CONTINUE_SHOPPING', 'VIEW_RECEIPT', 'GO_TO_LIBRARY']
  };
}

export async function getDigitalAccessStatus(orderId: string): Promise<DigitalAccessStatusResponse> {
  return {
    accessItems: [
      { accessId: 'access-code-001', title: 'Xbox Game Pass Digital Code', type: 'CODE' },
      { accessId: 'access-download-001', title: 'Premium Downloadable Template Pack', type: 'DOWNLOAD' }
    ],
    accessStatus: 'Access Ready',
    availableActions: ['VIEW_CODE', 'DOWNLOAD_FILE'],
    orderId,
    riskReviewStatus: 'APPROVED'
  };
}

export async function getReceipt(orderId: string): Promise<ReceiptResponse> {
  return {
    buyerDisplayName: 'Demo Buyer',
    checkoutId: 'checkout-001',
    currency: 'USD',
    discount: 10,
    items: (await getOrderConfirmationSummary('checkout-001')).orderGroups.flatMap((group) => group.items),
    marketplaceFee: 9.52,
    orderDate: '2026-06-03T19:05:00Z',
    orderId,
    paymentProvider: 'PayPal',
    receiptId: 'receipt-001',
    safePaymentReference: 'PAY-1234-ABCD',
    shipping: 0,
    subtotal: 543.98,
    tax: 40.8,
    total: 594.3
  };
}

export async function getPaymentAttemptStatus(status: PaymentFailureStatus = 'PAYMENT_CANCELLED'): Promise<PaymentAttemptStatusResponse> {
  return {
    attemptedAt: '2026-06-03T19:12:00Z',
    checkoutId: 'checkout-001',
    failureMessage: statusMessageFor(status),
    failureReasonCode: status,
    paymentAttemptId: 'attempt-001',
    provider: 'PAYPAL',
    retryAllowed: status !== 'PAYMENT_UNKNOWN',
    safeAttemptReference: 'PAY-ATTEMPT-92831',
    status
  };
}

export async function getCheckoutRecoverySummary(checkoutId: string): Promise<CheckoutRecoverySummaryResponse> {
  const success = await getOrderConfirmationSummary(checkoutId);
  return {
    cartId: 'cart-001',
    checkoutId,
    checkoutStatus: 'PAYMENT_NOT_COMPLETED',
    groups: success.orderGroups.map((group) => ({
      groupSubtotal: group.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      items: group.items,
      marketplaceCode: group.marketplaceCode,
      marketplaceName: group.marketplaceName,
      sellerDisplayName: group.sellerDisplayName,
      sellerId: group.sellerId,
      sellerVerified: group.sellerVerified,
      shippingRequired: group.items.some((item) => item.shippingRequired)
    })),
    recoveryActions: ['TRY_PAYMENT_AGAIN', 'RETURN_TO_CHECKOUT', 'CHANGE_PAYMENT_METHOD', 'GO_TO_CART', 'CONTACT_SUPPORT'],
    summary: {
      currency: 'USD',
      subtotal: 543.98,
      totalPayable: 594.3
    },
    warnings: ['Digital codes, downloads, subscriptions, and access are not available until payment succeeds.']
  };
}

export async function revalidateCheckout(checkoutId: string): Promise<CheckoutRevalidateResponse> {
  return {
    cartChanged: false,
    checkoutId,
    nextAction: 'RETRY_PAYMENT',
    priceChanged: false,
    summary: {
      currency: 'USD',
      subtotal: 543.98,
      totalPayable: 594.3
    },
    unavailableItems: [],
    valid: true,
    warnings: []
  };
}

export async function retryPayment(checkoutId: string): Promise<RetryPaymentResponse> {
  void checkoutId;
  return {
    approvalUrl: 'https://www.paypal.com/checkoutnow/mock-retry',
    expiresAt: '2026-06-03T20:00:00Z',
    paymentAttemptId: 'attempt-002',
    paymentSessionId: 'payment-session-retry-001',
    provider: 'PAYPAL'
  };
}

export async function contactPaymentSupport(paymentAttemptId: string, checkoutId: string) {
  return {
    createdAt: '2026-06-03T19:20:00Z',
    status: 'CREATED',
    ticketId: `support-${paymentAttemptId}-${checkoutId}`
  };
}

function statusMessageFor(status: PaymentFailureStatus) {
  const messages: Record<PaymentFailureStatus, string> = {
    PAYMENT_CANCELLED: 'Your payment was cancelled. You can return to checkout and try again.',
    PAYMENT_DECLINED: 'Your payment was declined. Please try again or choose another payment method.',
    PAYMENT_FAILED: "We couldn't complete your payment. Please try again or choose another payment method.",
    PAYMENT_PROVIDER_ERROR: 'The payment provider could not process this request. Please try again or contact support.',
    PAYMENT_SESSION_EXPIRED: 'Your payment session expired. Please return to checkout and try again.',
    PAYMENT_UNKNOWN: 'We could not confirm your payment status. Please check your orders or contact support.'
  };
  return messages[status];
}

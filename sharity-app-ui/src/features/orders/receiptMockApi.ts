import { getBuyerOrderDetails } from './orderDetailsMockApi';
import type { ReceiptMarketplaceGroup, ReceiptRefundHistoryItem, ReceiptResponse } from './receiptTypes';

const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const mixedDigitalImage = 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=900&auto=format&fit=crop';
const mixedElectronicsImage = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=900&auto=format&fit=crop';

export async function getReceiptByOrder(orderId: string | null): Promise<ReceiptResponse | null> {
  await wait();
  if (!orderId) {
    return buildMixedReceipt();
  }
  const details = await getBuyerOrderDetails(orderId);
  if (!details || !details.receiptSummary.receiptAvailable) {
    return null;
  }

  const isDigital = details.order.marketplaceCode === 'DIGITAL';
  const isElectronics = details.order.marketplaceCode === 'ELECTRONICS';
  const subtotal = details.items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = isElectronics ? 8.99 : 0;
  const tax = roundMoney(subtotal * 0.078);
  const couponDiscount = isDigital ? 5 : 0;
  const marketplaceFee = 1.49;
  const refundAmount = details.order.paymentStatus === 'REFUNDED' ? details.order.totalAmount : details.order.refundDisputeStatus === 'REFUND_REQUESTED' ? 10 : 0;
  const totalPaid = roundMoney(subtotal + shipping + tax + marketplaceFee - couponDiscount);
  const netPaidAfterRefund = roundMoney(totalPaid - refundAmount);

  return {
    addressSummary: {
      billingDisplayText: 'Billing: Phoenix, AZ, United States',
      billingSummaryAvailable: true,
      shippingDisplayText: isElectronics ? 'Shipping to: Phoenix, AZ 85032' : undefined,
      shippingSummaryAvailable: isElectronics
    },
    availableActions: {
      canBackToOrder: true,
      canContactSupport: true,
      canDownloadPdfFuture: false,
      canEmailReceiptFuture: false,
      canGoToLibrary: isDigital,
      canTrackPackage: isElectronics,
      canViewOrders: true
    },
    digitalAccessSummary: isDigital
      ? {
          accessStatus: details.digitalAccessSummary?.accessStatus ?? 'ACCESS_READY',
          codeRevealAvailable: true,
          downloadAvailable: details.items[0]?.productType !== 'Gift Card',
          hasDigitalItems: true,
          libraryRoute: `/library?orderId=${details.order.orderId}`,
          message: 'Go to Library to securely reveal or download your product.'
        }
      : undefined,
    feeBreakdown: {
      couponDiscount,
      currency: 'USD',
      marketplaceFee,
      netPaidAfterRefund,
      refundAmount,
      shipping,
      subtotal,
      tax,
      totalPaid
    },
    legalNote: 'This receipt confirms your Sharity marketplace purchase. Seller-specific tax obligations may vary.',
    marketplaceGroups: [
      {
        groupStatus: details.order.orderStatus,
        groupSubtotal: subtotal,
        items: details.items.map((item) => ({
          accessStatusSummary: item.deliveryType === 'DIGITAL' ? details.digitalAccessSummary?.message : undefined,
          condition: item.condition,
          deliveryStatusSummary: item.deliveryType === 'DIGITAL' ? 'Digital access status only. Secure values are hidden.' : 'Shipping status summary only.',
          discount: couponDiscount,
          lineTotal: roundMoney(item.price * item.quantity - couponDiscount),
          licenseSummary: item.deliveryType === 'DIGITAL' ? 'License/access details are available only through protected library screens.' : undefined,
          productId: item.productId,
          productImageUrl: item.productImageUrl,
          productTitle: item.productTitle,
          productType: item.productType,
          quantity: item.quantity,
          shippingStatusSummary: item.deliveryType === 'SHIPPING_REQUIRED' ? details.shippingSummary?.shippingStatus : undefined,
          unitPrice: item.price
        })),
        marketplaceCode: details.order.marketplaceCode === 'ELECTRONICS' ? 'ELECTRONICS' : 'DIGITAL',
        marketplaceName: details.order.marketplaceName,
        sellerDisplayName: details.seller.sellerDisplayName,
        sellerId: details.seller.sellerId,
        sellerVerified: details.seller.sellerVerified
      }
    ],
    paymentSummary: {
      couponDiscount,
      currency: 'USD',
      marketplaceFee,
      netPaidAfterRefund,
      paymentMethod: 'PayPal',
      paymentProvider: 'PayPal',
      paymentStatus: details.order.paymentStatus,
      refundAmount,
      safePaymentReference: details.receiptSummary.safePaymentReference,
      shipping,
      subtotal,
      tax,
      totalPaid
    },
    receipt: {
      checkoutId: details.order.checkoutId,
      checkoutReference: `CHK-${details.order.checkoutId.slice(-4).toUpperCase()}`,
      currency: 'USD',
      orderDate: details.order.orderDate,
      orderId: details.order.orderId,
      orderReference: details.order.orderReference,
      paymentDate: details.order.orderDate,
      receiptId: details.receiptSummary.receiptId,
      receiptNumber: `RCT-${details.order.orderReference.replace('SH-', '')}`,
      receiptStatus: refundAmount === totalPaid ? 'REFUNDED' : refundAmount > 0 ? 'PARTIALLY_REFUNDED' : 'PAID'
    },
    refundHistory: buildRefundHistory(details.order.orderId, refundAmount),
  };
}

export async function getReceiptByReceiptId(receiptId: string | null): Promise<ReceiptResponse | null> {
  await wait();
  if (!receiptId) {
    return buildMixedReceipt();
  }
  return getReceiptByOrder(receiptId.replace('receipt-', ''));
}

export async function getReceiptRefundHistory(receiptId: string): Promise<ReceiptRefundHistoryItem[]> {
  await wait(120);
  const receipt = await getReceiptByReceiptId(receiptId);
  return receipt?.refundHistory ?? [];
}

export async function requestReceiptPdf(receiptId: string) {
  await wait(120);
  return {
    receiptId,
    status: 'FUTURE_NOT_AVAILABLE'
  };
}

export async function emailReceipt(receiptId: string) {
  await wait(120);
  return {
    receiptId,
    status: 'FUTURE_NOT_AVAILABLE'
  };
}

function buildMixedReceipt(): ReceiptResponse {
  const digitalGroup: ReceiptMarketplaceGroup = {
    groupStatus: 'ACCESS_READY',
    groupSubtotal: 49.99,
    items: [
      {
        accessStatusSummary: 'Ready in Library. Secure code value is hidden.',
        deliveryStatusSummary: 'Digital access status only.',
        discount: 5,
        licenseSummary: 'Protected reveal required.',
        lineTotal: 44.99,
        productId: 'product-mixed-digital',
        productImageUrl: mixedDigitalImage,
        productTitle: 'PlayStation Store Digital Code',
        productType: 'Gaming Code',
        quantity: 1,
        unitPrice: 49.99
      }
    ],
    marketplaceCode: 'DIGITAL',
    marketplaceName: 'Digital Marketplace',
    sellerDisplayName: 'Code Vault',
    sellerId: 'seller-code-vault',
    sellerVerified: true
  };
  const electronicsGroup: ReceiptMarketplaceGroup = {
    groupStatus: 'SHIPPED',
    groupSubtotal: 689,
    items: [
      {
        condition: 'Seller-certified refurbished',
        deliveryStatusSummary: 'Shipping status summary only.',
        discount: 0,
        lineTotal: 689,
        productId: 'product-mixed-electronics',
        productImageUrl: mixedElectronicsImage,
        productTitle: 'Refurbished Ultrabook Pro',
        productType: 'Electronics',
        quantity: 1,
        shippingStatusSummary: 'SHIPPED',
        unitPrice: 689
      }
    ],
    marketplaceCode: 'ELECTRONICS',
    marketplaceName: 'Electronics Marketplace',
    sellerDisplayName: 'Circuit Loop',
    sellerId: 'seller-circuit-loop',
    sellerVerified: true
  };
  const subtotal = 738.99;
  const shipping = 8.99;
  const tax = 57.64;
  const couponDiscount = 5;
  const marketplaceFee = 2.49;
  const totalPaid = 803.11;
  const refundAmount = 10;

  return {
    addressSummary: {
      billingDisplayText: 'Billing: Phoenix, AZ, United States',
      billingSummaryAvailable: true,
      shippingDisplayText: 'Shipping to: Phoenix, AZ 85032',
      shippingSummaryAvailable: true
    },
    availableActions: {
      canBackToOrder: true,
      canContactSupport: true,
      canDownloadPdfFuture: false,
      canEmailReceiptFuture: false,
      canGoToLibrary: true,
      canTrackPackage: true,
      canViewOrders: true
    },
    digitalAccessSummary: {
      accessStatus: 'ACCESS_READY',
      codeRevealAvailable: true,
      downloadAvailable: false,
      hasDigitalItems: true,
      libraryRoute: '/library',
      message: 'Digital items are ready in Library. Secure values are hidden from the receipt.'
    },
    feeBreakdown: {
      couponDiscount,
      currency: 'USD',
      marketplaceFee,
      netPaidAfterRefund: totalPaid - refundAmount,
      refundAmount,
      shipping,
      subtotal,
      tax,
      totalPaid
    },
    legalNote: 'This receipt confirms your Sharity marketplace purchase. Seller-specific tax obligations may vary.',
    marketplaceGroups: [digitalGroup, electronicsGroup],
    paymentSummary: {
      couponDiscount,
      currency: 'USD',
      marketplaceFee,
      netPaidAfterRefund: totalPaid - refundAmount,
      paymentMethod: 'PayPal',
      paymentProvider: 'PayPal',
      paymentStatus: 'PARTIALLY_REFUNDED',
      refundAmount,
      safePaymentReference: 'PAYPAL-SAFE-9KQ2',
      shipping,
      subtotal,
      tax,
      totalPaid
    },
    receipt: {
      checkoutId: 'checkout-mixed-1007',
      checkoutReference: 'CHK-1007',
      currency: 'USD',
      orderDate: '2026-06-03T10:45:00Z',
      orderId: 'order-mixed-007',
      orderReference: 'SH-100251',
      paymentDate: '2026-06-03T10:46:00Z',
      receiptId: 'receipt-order-mixed-007',
      receiptNumber: 'RCT-100251',
      receiptStatus: 'PARTIALLY_REFUNDED'
    },
    refundHistory: buildRefundHistory('order-mixed-007', refundAmount)
  };
}

function buildRefundHistory(orderId: string, refundAmount: number): ReceiptRefundHistoryItem[] {
  if (refundAmount <= 0) {
    return [];
  }
  return [
    {
      refundAmount,
      refundDate: '2026-06-04T09:20:00Z',
      refundReasonSummary: 'Partial refund approved after marketplace review.',
      refundRequestId: `refund-${orderId}`,
      refundStatus: refundAmount > 20 ? 'REFUNDED' : 'REFUND_PROCESSING',
      safeProviderRefundReference: 'PAYPAL-REFUND-SAFE-7B2'
    }
  ];
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

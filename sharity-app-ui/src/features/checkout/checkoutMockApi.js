export const mockShippingAddress = {
    addressLine1: '100 Market Street',
    addressLine2: 'Suite 12',
    city: 'Phoenix',
    country: 'USA',
    deliveryInstructions: 'Leave with front desk if needed',
    fullName: 'Demo Buyer',
    id: 'ship-001',
    phoneNumber: '+1 555 0100',
    postalCode: '85001',
    state: 'AZ'
};
export async function prepareCheckout(request) {
    void request;
    return {
        availablePaymentMethods: [
            {
                code: 'PAYPAL',
                description: 'Secure checkout using PayPal.',
                name: 'PayPal',
                provider: 'PAYPAL',
                status: 'AVAILABLE'
            },
            {
                code: 'CARD',
                description: 'Stripe card payments will be available later.',
                name: 'Card',
                provider: 'STRIPE',
                status: 'COMING_SOON'
            },
            {
                code: 'APPLE_PAY',
                description: 'Apple Pay will be available later.',
                name: 'Apple Pay',
                provider: 'APPLE',
                status: 'COMING_SOON'
            },
            {
                code: 'GOOGLE_PAY',
                description: 'Google Pay will be available later.',
                name: 'Google Pay',
                provider: 'GOOGLE',
                status: 'COMING_SOON'
            },
            {
                code: 'WALLET',
                description: 'Wallet balance payments will be available later.',
                name: 'Wallet Balance',
                provider: 'SHARITY',
                status: 'COMING_SOON'
            }
        ],
        checkoutEligibility: {
            loginRequired: false,
            paymentAllowed: true,
            policyAcknowledgmentRequired: true
        },
        checkoutId: 'checkout-001',
        currency: 'USD',
        digitalAccessRules: [
            'Codes are hidden before payment.',
            'Downloads are secured.',
            'Access history is tracked.',
            'Refund eligibility may change after code reveal, download, or access grant.'
        ],
        orderGroups: [
            {
                deliveryType: 'INSTANT_CODE_REVEAL',
                groupId: 'group-digital-001',
                groupSubtotal: 44.98,
                items: [
                    {
                        deliveryType: 'INSTANT_CODE_REVEAL',
                        discount: 5,
                        price: 14.99,
                        productId: 'digital-xbox-game-pass',
                        productTitle: 'Xbox Game Pass Digital Code',
                        productType: 'GAMING_CODE',
                        quantity: 1,
                        refundReturnSummary: 'Refund limited after code reveal',
                        shippingRequired: false
                    },
                    {
                        deliveryType: 'SECURE_DOWNLOAD',
                        discount: 0,
                        price: 29.99,
                        productId: 'digital-template-pack',
                        productTitle: 'Premium Downloadable Template Pack',
                        productType: 'DOWNLOADABLE_FILE',
                        quantity: 1,
                        refundReturnSummary: 'Refund eligibility may change after download',
                        shippingRequired: false
                    }
                ],
                marketplaceCode: 'DIGITAL',
                marketplaceName: 'Digital Marketplace',
                refundReturnSummary: 'Digital refunds may be limited after reveal, download, or access grant.',
                sellerDisplayName: 'GameCodeHub',
                sellerId: 'seller-001',
                sellerVerified: true,
                shippingRequired: false
            },
            {
                deliveryType: 'SHIPPING_REQUIRED',
                groupId: 'group-electronics-001',
                groupSubtotal: 748,
                items: [
                    {
                        condition: 'Used',
                        deliveryType: 'SHIPPING_REQUIRED',
                        discount: 50,
                        price: 499,
                        productId: 'electronics-iphone-14',
                        productTitle: 'Used iPhone 14',
                        productType: 'ELECTRONICS',
                        quantity: 1,
                        refundReturnSummary: '7-day return eligible',
                        shippingRequired: true
                    },
                    {
                        condition: 'Open Box',
                        deliveryType: 'SHIPPING_REQUIRED',
                        discount: 70,
                        price: 249,
                        productId: 'electronics-sony-headphones',
                        productTitle: 'Sony WH-1000XM5 Headphones',
                        productType: 'ELECTRONICS',
                        quantity: 1,
                        refundReturnSummary: 'Seller return policy',
                        shippingRequired: true
                    }
                ],
                marketplaceCode: 'ELECTRONICS',
                marketplaceName: 'Electronics Marketplace',
                refundReturnSummary: 'Returns depend on seller policy, product condition, shipping status, and buyer protection.',
                sellerDisplayName: 'TechDeals USA',
                sellerId: 'seller-002',
                sellerVerified: true,
                shippingRequired: true
            }
        ],
        refundReturnRules: [
            'Digital product refunds may be limited after a code is revealed, file is downloaded, or access is granted.',
            'Electronics returns depend on seller policy, product condition, shipping status, and Sharity buyer protection rules.'
        ],
        shippingAddress: mockShippingAddress,
        shippingRequired: true,
        summary: {
            couponDiscount: 10,
            currency: 'USD',
            discount: 125,
            estimatedShipping: null,
            estimatedTax: 59.47,
            marketplaceFee: 9.52,
            subtotal: 792.98,
            totalPayable: 851.97
        },
        warnings: [
            {
                message: 'Your checkout may create separate orders by marketplace and seller. Each seller order may have separate delivery, refund, return, and payout rules.',
                relatedGroupIds: ['group-digital-001', 'group-electronics-001'],
                severity: 'WARNING',
                warningCode: 'SEPARATE_ORDERS'
            }
        ]
    };
}
export async function saveShippingAddress(checkoutId, address) {
    void checkoutId;
    return address;
}
export async function selectPaymentMethod(checkoutId, paymentMethodCode) {
    void checkoutId;
    return { paymentMethodCode };
}
export async function acknowledgePolicies(checkoutId, refundReturnAcknowledged, digitalAccessAcknowledged) {
    void checkoutId;
    return { digitalAccessAcknowledged, refundReturnAcknowledged };
}
export async function startPayment(checkoutId, paymentMethodCode) {
    void checkoutId;
    void paymentMethodCode;
    return {
        approvalUrl: 'https://www.paypal.com/checkoutnow/mock-sharity',
        expiresAt: '2026-06-03T18:30:00Z',
        paymentSessionId: 'payment-session-001',
        provider: 'PAYPAL'
    };
}
export async function confirmPayment(paymentSessionId) {
    void paymentSessionId;
    return {
        accessStatus: 'PENDING_PAYMENT_PROVIDER',
        nextScreen: 'paymentSuccess',
        orderIds: ['order-digital-001', 'order-electronics-001'],
        paymentStatus: 'MOCK_APPROVAL_CREATED'
    };
}

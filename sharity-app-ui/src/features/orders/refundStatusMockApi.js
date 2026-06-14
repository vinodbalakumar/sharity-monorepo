const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));
const digitalTimeline = [
    {
        description: 'Your refund request was submitted with the selected reason and evidence.',
        eventId: 'refund-timeline-001',
        eventType: 'REFUND_SUBMITTED',
        timestamp: '2026-06-03T11:10:00Z',
        title: 'Refund request submitted',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'Digital access history was attached as a buyer-safe review summary.',
        eventId: 'refund-timeline-002',
        eventType: 'DIGITAL_ACCESS_REVIEW',
        timestamp: '2026-06-03T11:12:00Z',
        title: 'Digital access summary captured',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'Sharity is reviewing the request because digital access was available.',
        eventId: 'refund-timeline-003',
        eventType: 'ADMIN_REVIEW_STARTED',
        timestamp: '2026-06-03T11:18:00Z',
        title: 'Admin review started',
        visibility: 'BUYER_VISIBLE'
    }
];
const electronicsTimeline = [
    {
        description: 'Your return/refund request was submitted for the electronics order.',
        eventId: 'refund-timeline-010',
        eventType: 'REFUND_SUBMITTED',
        timestamp: '2026-06-01T16:05:00Z',
        title: 'Return request submitted',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'The seller has been asked to respond before a return method is finalized.',
        eventId: 'refund-timeline-011',
        eventType: 'SELLER_RESPONSE_REQUESTED',
        timestamp: '2026-06-01T16:20:00Z',
        title: 'Seller response requested',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'More evidence may be requested if the package condition cannot be verified.',
        eventId: 'refund-timeline-012',
        eventType: 'UNDER_REVIEW',
        timestamp: '2026-06-01T17:00:00Z',
        title: 'Under review',
        visibility: 'BUYER_VISIBLE'
    }
];
const mockStatuses = {
    'refund-order-delivered-004-item_damaged': {
        adminDecision: {
            decisionAvailable: false
        },
        availableActions: {
            canBackToOrder: true,
            canCancelRequest: true,
            canContactSupport: true,
            canOpenDispute: false,
            canUploadEvidence: false,
            canViewReceipt: true
        },
        estimatedRefund: {
            amount: 89.5,
            calculationSummary: 'Product amount is estimated. Shipping and tax review may change final refund.',
            currency: 'USD',
            isEstimated: true,
            marketplaceFeeRefundStatus: 'Pending review',
            shippingRefundStatus: 'Pending return decision',
            taxRefundStatus: 'Calculated after approval'
        },
        refundRequest: {
            lastUpdatedAt: '2026-06-01T17:00:00Z',
            marketplaceCode: 'ELECTRONICS',
            marketplaceName: 'Electronics Marketplace',
            orderId: 'order-delivered-004',
            orderReference: 'SH-100248',
            productImageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
            productTitle: 'Wireless Noise Cancelling Earbuds',
            productType: 'Electronics',
            reasonCode: 'ITEM_DAMAGED',
            reasonLabel: 'Item damaged',
            refundRequestId: 'refund-order-delivered-004-item_damaged',
            sellerDisplayName: 'Audio Atlas',
            sellerId: 'seller-audio-atlas',
            status: 'WAITING_FOR_SELLER_RESPONSE',
            submittedAt: '2026-06-01T16:05:00Z'
        },
        returnInstructions: {
            instructions: 'Return method is pending. Do not ship the item until Sharity or the seller provides instructions.',
            returnLabelAvailable: false,
            returnMethod: 'Return method pending',
            returnRequired: true,
            returnTrackingStatus: 'Not started'
        },
        sellerResponse: {
            buyerSafeMessage: 'Seller response has been requested.',
            responseAvailable: true,
            respondedAt: '2026-06-01T16:20:00Z',
            responseStatus: 'Waiting'
        },
        statusSummary: {
            currentStatus: 'WAITING_FOR_SELLER_RESPONSE',
            nextStepMessage: 'The seller has been asked to respond before a decision is made.',
            requiresAdminReview: false,
            requiresBuyerEvidence: false,
            requiresSellerResponse: true,
            statusLabel: 'Waiting for Seller Response'
        },
        timeline: electronicsTimeline
    },
    'refund-order-digital-001-code_invalid': {
        adminDecision: {
            buyerSafeReason: 'Admin review is checking access history and submitted evidence.',
            decisionAvailable: true,
            decisionStatus: 'Reviewing',
            nextStep: 'You will be notified when the review is complete.'
        },
        availableActions: {
            canBackToOrder: true,
            canCancelRequest: true,
            canContactSupport: true,
            canOpenDispute: false,
            canUploadEvidence: true,
            canViewReceipt: true
        },
        digitalAccessSummary: {
            accessGranted: true,
            codeRevealTimestamp: '2026-06-03T10:45:00Z',
            codeRevealed: true,
            fileDownloaded: false,
            locationConsentAccepted: true,
            reviewImpact: 'Admin review required after code reveal.'
        },
        estimatedRefund: {
            amount: 49.99,
            calculationSummary: 'Estimated until approved. Digital access history may affect the final decision.',
            currency: 'USD',
            isEstimated: true,
            marketplaceFeeRefundStatus: 'Pending review',
            taxRefundStatus: 'Calculated after approval'
        },
        refundRequest: {
            lastUpdatedAt: '2026-06-03T11:18:00Z',
            marketplaceCode: 'DIGITAL',
            marketplaceName: 'Digital Marketplace',
            orderId: 'order-digital-001',
            orderReference: 'SH-100245',
            productImageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80',
            productTitle: 'PlayStation Store Digital Code',
            productType: 'Gaming Code',
            reasonCode: 'CODE_INVALID',
            reasonLabel: 'Code invalid',
            refundRequestId: 'refund-order-digital-001-code_invalid',
            sellerDisplayName: 'Code Vault',
            sellerId: 'seller-code-vault',
            status: 'WAITING_FOR_BUYER_EVIDENCE',
            submittedAt: '2026-06-03T11:10:00Z'
        },
        sellerResponse: {
            responseAvailable: false
        },
        statusSummary: {
            currentStatus: 'WAITING_FOR_BUYER_EVIDENCE',
            nextStepMessage: 'Please upload the requested evidence to continue the review.',
            requiresAdminReview: true,
            requiresBuyerEvidence: true,
            requiresSellerResponse: false,
            statusLabel: 'Waiting for Buyer Evidence'
        },
        timeline: [
            ...digitalTimeline,
            {
                description: 'Upload invalid-code proof or an error screenshot to continue review.',
                eventId: 'refund-timeline-004',
                eventType: 'EVIDENCE_REQUESTED',
                timestamp: '2026-06-03T11:24:00Z',
                title: 'More evidence requested',
                visibility: 'BUYER_VISIBLE'
            }
        ]
    }
};
export async function getRefundStatus(refundRequestId, orderId) {
    await wait();
    if (refundRequestId && mockStatuses[refundRequestId]) {
        return mockStatuses[refundRequestId];
    }
    if (orderId === 'order-digital-001') {
        return mockStatuses['refund-order-digital-001-code_invalid'];
    }
    if (orderId === 'order-delivered-004') {
        return mockStatuses['refund-order-delivered-004-item_damaged'];
    }
    return null;
}
export async function getRefundTimeline(refundRequestId) {
    await wait(140);
    return mockStatuses[refundRequestId]?.timeline ?? [];
}
export async function uploadRequestedEvidence(refundRequestId) {
    await wait(220);
    return {
        evidenceId: `requested-evidence-${refundRequestId}`,
        fileName: 'requested-evidence-screenshot.png',
        fileSize: 910000,
        fileType: 'image/png',
        previewUrl: 'https://images.unsplash.com/photo-1580835239846-5bb9ce03c8c3?auto=format&fit=crop&w=900&q=80',
        uploadStatus: 'UPLOADED'
    };
}
export async function cancelRefundRequest(refundRequestId) {
    await wait(180);
    return {
        refundRequestId,
        status: 'CANCELLED'
    };
}
export async function openDisputeFromRefund(refundRequestId) {
    await wait(180);
    return {
        disputeId: `dispute-${refundRequestId}`,
        refundRequestId,
        status: 'DISPUTE_OPENED'
    };
}

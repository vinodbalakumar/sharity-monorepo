const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
const digitalProductImage = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=900&auto=format&fit=crop';
const electronicsProductImage = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=900&auto=format&fit=crop';
const evidencePreview = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop';
const possibleOutcomes = [
    {
        outcomeCode: 'FULL_REFUND',
        label: 'Full refund',
        description: 'Sharity may approve a full refund if the evidence supports the claim.',
        status: 'POSSIBLE'
    },
    {
        outcomeCode: 'PARTIAL_REFUND',
        label: 'Partial refund',
        description: 'A partial refund may be approved when only part of the order is affected.',
        status: 'POSSIBLE'
    },
    {
        outcomeCode: 'REPLACEMENT',
        label: 'Replacement',
        description: 'The seller may be required to provide replacement access or a valid item.',
        status: 'POSSIBLE'
    },
    {
        outcomeCode: 'VALID_CODE',
        label: 'Valid code from seller',
        description: 'For digital codes, Sharity may require the seller to provide a valid replacement.',
        status: 'POSSIBLE'
    },
    {
        outcomeCode: 'RETURN_REQUIRED',
        label: 'Return required',
        description: 'For physical orders, return instructions may be required before refund processing.',
        status: 'POSSIBLE'
    },
    {
        outcomeCode: 'DISPUTE_REJECTED',
        label: 'Dispute rejected',
        description: 'A dispute may be rejected if the evidence does not support the claim.',
        status: 'POSSIBLE'
    }
];
const baseActions = {
    canBackToOrder: true,
    canCloseDispute: true,
    canContactSupport: true,
    canGoToLibrary: true,
    canTrackPackage: false,
    canUploadEvidence: false,
    canViewReceipt: true,
    canViewRefundStatus: true
};
const digitalTimeline = [
    {
        description: 'Your dispute was submitted with buyer evidence for Sharity Review.',
        eventId: 'timeline-dispute-submitted',
        eventType: 'DISPUTE_SUBMITTED',
        timestamp: '2026-06-03T10:20:00Z',
        title: 'Dispute submitted',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'The seller has been asked to respond before a final decision is made.',
        eventId: 'timeline-seller-requested',
        eventType: 'WAITING_FOR_SELLER_RESPONSE',
        timestamp: '2026-06-03T10:32:00Z',
        title: 'Seller response requested',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'Sharity is checking access history, evidence, seller response, and marketplace rules.',
        eventId: 'timeline-review-started',
        eventType: 'UNDER_SHARITY_REVIEW',
        timestamp: '2026-06-03T10:45:00Z',
        title: 'Sharity review started',
        visibility: 'BUYER_VISIBLE'
    }
];
const electronicsTimeline = [
    {
        description: 'Your dispute was submitted after the delivery issue was not resolved.',
        eventId: 'timeline-physical-submitted',
        eventType: 'DISPUTE_SUBMITTED',
        timestamp: '2026-06-02T16:15:00Z',
        title: 'Dispute submitted',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'Package and return details are being reviewed by Sharity.',
        eventId: 'timeline-admin-reviewing',
        eventType: 'ADMIN_REVIEWING',
        timestamp: '2026-06-02T17:05:00Z',
        title: 'Admin reviewing',
        visibility: 'BUYER_VISIBLE'
    },
    {
        description: 'Additional package photos were requested to continue the review.',
        eventId: 'timeline-evidence-requested',
        eventType: 'WAITING_FOR_BUYER_EVIDENCE',
        timestamp: '2026-06-03T08:30:00Z',
        title: 'More evidence requested',
        visibility: 'BUYER_VISIBLE'
    }
];
const disputes = {
    'dispute-order-digital-001-digital_code_invalid': digitalDispute('dispute-order-digital-001-digital_code_invalid'),
    'dispute-order-delivered-004-item_damaged': electronicsDispute('dispute-order-delivered-004-item_damaged'),
    'dispute-order-disputed-006': {
        ...digitalDispute('dispute-order-disputed-006'),
        adminDecision: {
            buyerSafeReason: 'The submitted evidence confirms the original digital access could not be used successfully.',
            decidedAt: '2026-06-03T18:20:00Z',
            decisionAvailable: true,
            decisionStatus: 'DECISION_MADE',
            finalOutcome: 'Seller must provide a valid code.',
            nextStep: 'We will notify you when replacement access is ready.'
        },
        availableActions: {
            ...baseActions,
            canCloseDispute: false,
            canUploadEvidence: false
        },
        finalOutcome: {
            description: 'The seller must provide valid replacement access before the case can close.',
            label: 'Seller must provide valid code',
            outcomeCode: 'VALID_CODE',
            status: 'FINAL'
        },
        statusSummary: {
            closed: false,
            currentStatus: 'SELLER_MUST_PROVIDE_VALID_CODE',
            decisionMade: true,
            nextStepMessage: 'We will notify you when the replacement code or access is available.',
            requiresAdminReview: false,
            requiresBuyerEvidence: false,
            requiresSellerResponse: true,
            statusLabel: 'Seller must provide a valid code'
        }
    }
};
export async function getDisputeStatus(disputeId, orderId) {
    await delay();
    const key = disputeId && disputes[disputeId] ? disputeId : findDisputeIdByOrder(orderId);
    const dispute = key ? disputes[key] : null;
    return dispute ? clone(dispute) : null;
}
export async function getDisputeTimeline(disputeId) {
    await delay(120);
    return clone(disputes[disputeId]?.timeline ?? digitalTimeline);
}
export async function getDisputeActions(disputeId) {
    await delay(120);
    return clone(disputes[disputeId]?.availableActions ?? baseActions);
}
export async function uploadRequestedDisputeEvidence(disputeId) {
    await delay(220);
    const evidence = {
        evidenceId: `evidence-${Date.now()}`,
        evidenceType: 'Screenshot',
        fileName: 'requested-evidence-screenshot.png',
        fileSize: 428000,
        fileType: 'image/png',
        previewUrl: evidencePreview,
        uploadedAt: new Date().toISOString(),
        uploadStatus: 'UPLOADED'
    };
    return {
        evidence,
        nextStep: 'Evidence uploaded. Sharity will review the additional evidence.',
        status: 'EVIDENCE_SUBMITTED'
    };
}
export async function closeDispute(disputeId) {
    await delay(220);
    return {
        closedAt: new Date().toISOString(),
        disputeId,
        message: 'Dispute closed. This review has been completed.',
        status: 'DISPUTE_CLOSED'
    };
}
function digitalDispute(disputeId) {
    return {
        adminDecision: {
            decisionAvailable: false,
            decisionStatus: 'PENDING'
        },
        availableActions: baseActions,
        digitalAccessSummary: {
            accessGranted: true,
            codeRevealTimestamp: '2026-06-03T09:42:00Z',
            codeRevealed: true,
            fileDownloaded: false,
            locationConsentAccepted: true,
            reviewImpact: 'Admin review required because digital access was revealed before the issue was reported.'
        },
        dispute: {
            disputeId,
            lastUpdatedAt: '2026-06-03T10:45:00Z',
            marketplaceCode: 'DIGITAL',
            marketplaceName: 'Digital Marketplace',
            orderId: 'order-digital-001',
            orderReference: 'SH-1001',
            productImageUrl: digitalProductImage,
            productTitle: 'PlayStation Store Digital Code',
            productType: 'Gaming Code',
            reasonCode: 'DIGITAL_CODE_INVALID',
            reasonLabel: 'Digital code did not work',
            refundRequestId: 'refund-order-digital-001',
            sellerDisplayName: 'CodeHub Pro',
            sellerId: 'seller-codehub',
            status: 'WAITING_FOR_SELLER_RESPONSE',
            submittedAt: '2026-06-03T10:20:00Z'
        },
        estimatedRefund: {
            amount: 29.99,
            calculationSummary: 'Estimated refund is based on the digital item price and current marketplace policy review.',
            currency: 'USD',
            isEstimated: true,
            marketplaceFeeRefundStatus: 'Estimated until final decision',
            taxRefundStatus: 'Estimated until final decision'
        },
        evidence: [
            {
                evidenceId: 'evidence-invalid-code',
                evidenceType: 'Screenshot',
                fileName: 'invalid-code-error.png',
                fileSize: 312000,
                fileType: 'image/png',
                previewUrl: evidencePreview,
                uploadedAt: '2026-06-03T10:18:00Z',
                uploadStatus: 'REVIEWING'
            }
        ],
        possibleOutcomes,
        sellerResponse: {
            responseAvailable: true,
            buyerSafeMessage: 'The seller says they are checking the code batch and will provide a valid replacement if confirmed.',
            respondedAt: '2026-06-03T11:10:00Z',
            responseStatus: 'Seller response received'
        },
        statusSummary: {
            closed: false,
            currentStatus: 'WAITING_FOR_SELLER_RESPONSE',
            decisionMade: false,
            nextStepMessage: 'The seller has been asked to respond before a final decision is made.',
            requiresAdminReview: true,
            requiresBuyerEvidence: false,
            requiresSellerResponse: true,
            statusLabel: 'Waiting for seller response'
        },
        timeline: digitalTimeline
    };
}
function electronicsDispute(disputeId) {
    return {
        adminDecision: {
            decisionAvailable: false,
            decisionStatus: 'PENDING'
        },
        availableActions: {
            ...baseActions,
            canGoToLibrary: false,
            canTrackPackage: true,
            canUploadEvidence: true
        },
        dispute: {
            disputeId,
            lastUpdatedAt: '2026-06-03T08:30:00Z',
            marketplaceCode: 'ELECTRONICS',
            marketplaceName: 'Electronics Marketplace',
            orderId: 'order-delivered-004',
            orderReference: 'SH-1004',
            productImageUrl: electronicsProductImage,
            productTitle: 'Refurbished Laptop',
            productType: 'Electronics',
            reasonCode: 'ITEM_DAMAGED',
            reasonLabel: 'Item arrived damaged',
            refundRequestId: 'refund-order-delivered-004',
            sellerDisplayName: 'Northstar Devices',
            sellerId: 'seller-northstar',
            status: 'WAITING_FOR_BUYER_EVIDENCE',
            submittedAt: '2026-06-02T16:15:00Z'
        },
        estimatedRefund: {
            amount: 289,
            calculationSummary: 'Estimated refund may change after return condition and shipping review.',
            currency: 'USD',
            isEstimated: true,
            marketplaceFeeRefundStatus: 'Estimated until final decision',
            shippingRefundStatus: 'Under review',
            taxRefundStatus: 'Estimated until final decision'
        },
        evidence: [],
        possibleOutcomes,
        sellerResponse: {
            responseAvailable: false,
            responseStatus: 'Seller response pending'
        },
        shippingReturnSummary: {
            deliveryStatus: 'Delivered',
            returnInstructionsStatus: 'Pending evidence review',
            returnRequired: true,
            returnShipmentStatus: 'Not started',
            shippingStatus: 'Delivered',
            trackingAvailable: true
        },
        statusSummary: {
            closed: false,
            currentStatus: 'WAITING_FOR_BUYER_EVIDENCE',
            decisionMade: false,
            nextStepMessage: 'Please upload the requested evidence to continue the review.',
            requiresAdminReview: true,
            requiresBuyerEvidence: true,
            requiresSellerResponse: false,
            statusLabel: 'More evidence is needed'
        },
        timeline: electronicsTimeline
    };
}
function findDisputeIdByOrder(orderId) {
    if (!orderId) {
        return null;
    }
    return Object.keys(disputes).find((key) => disputes[key]?.dispute.orderId === orderId) ?? null;
}
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

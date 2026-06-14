import { placeholderImageUrl } from '../../utils/mockImages';
const now = new Date().toISOString();
export async function getSupportScreenData() {
    const categories = supportCategories();
    const suggestions = selfServiceSuggestions();
    const tickets = ticketSummaries();
    const detail = ticketDetail();
    return {
        dashboard: {
            searchPlaceholder: 'Search orders, refunds, payouts, verification, policies, and app help',
            commonActions: suggestions,
            supportCategories: categories,
            openTicketCount: 2,
            actionRequiredCount: 1,
            unreadCount: 2,
            recentTickets: tickets,
            availableActions: ['SEARCH_HELP', 'START_GUIDED_HELP', 'CREATE_SUPPORT_TICKET', 'VIEW_TICKET_TIMELINE']
        },
        searchResults: [
            { resultId: 'result-payout', resultType: 'SELF_SERVICE_ROUTE', title: 'View Payout Eligibility', summary: 'Check PayPal setup, payout blockers, and holds.', categoryCode: 'PAYOUT_ISSUE', route: '/seller/payout-eligibility', actionLabel: 'Open payout eligibility' },
            { resultId: 'result-digital', resultType: 'GUIDED_FLOW', title: 'Digital code issue help', summary: 'Troubleshoot invalid or already-used digital codes.', categoryCode: 'DIGITAL_CODE_ACCESS_ISSUE', route: '/support/tickets/create', actionLabel: 'Start guided help' }
        ],
        guidedHelp: guidedHelp(),
        selfServiceSuggestions: suggestions,
        selectedTicket: detail,
        relatedEntities: relatedEntities(),
        adminQueue: tickets.map((ticket) => ({ ...ticket, createdAt: now, updatedAt: ticket.lastUpdatedAt, assignedTo: 'Support placeholder', escalationStatus: ticket.escalated ? 'ESCALATED' : 'NONE' }))
    };
}
export async function createSupportTicket() {
    return { ticketId: 'ticket-new-001', ticketReference: 'SUP-1003', status: 'CREATED', priority: 'HIGH', nextRoute: '/support/tickets/ticket-new-001', message: 'Support ticket created. Replies stay inside Sharity.' };
}
export async function uploadSupportAttachment() {
    return attachment('attach-new-001', 'support-screenshot.png', 'UPLOADED');
}
export async function replyToSupportTicket() {
    return { ticketId: 'ticket-001', status: 'WAITING_FOR_SUPPORT', message: 'Reply sent inside Sharity. Unsafe content scanner passed.', updatedAt: now };
}
export async function escalateSupportTicket() {
    return { ticketId: 'ticket-001', status: 'ESCALATED', message: 'Ticket escalated to Sharity Review placeholder.', updatedAt: now };
}
export async function closeSupportTicket() {
    return { ticketId: 'ticket-001', status: 'CLOSED', message: 'Ticket closed. You can reopen if the issue continues.', updatedAt: now };
}
export async function reopenSupportTicket() {
    return { ticketId: 'ticket-001', status: 'REOPENED', message: 'Ticket reopened and timeline updated.', updatedAt: now };
}
function supportCategories() {
    return [
        category('ORDER_ISSUE', 'Order issue', ['ORDER', 'SELLER_ORDER'], 'MEDIUM'),
        category('DIGITAL_CODE_ACCESS_ISSUE', 'Digital code/access issue', ['ORDER', 'SELLER_ORDER_ITEM'], 'HIGH'),
        category('REFUND_ISSUE', 'Refund issue', ['REFUND_REQUEST'], 'HIGH'),
        category('DISPUTE_SHARITY_REVIEW_ISSUE', 'Dispute/Sharity Review issue', ['DISPUTE'], 'HIGH'),
        category('PAYMENT_AUTHORIZATION_ISSUE', 'Payment authorization issue', ['PAYMENT_AUTHORIZATION'], 'URGENT'),
        category('PAYOUT_ISSUE', 'Payout issue', ['PAYOUT'], 'HIGH'),
        category('SELLER_VERIFICATION_ISSUE', 'Seller verification issue', ['VERIFICATION_REVIEW'], 'MEDIUM'),
        category('ACCOUNT_LOGIN_SECURITY_ISSUE', 'Account/login/security issue', ['ACCOUNT'], 'SAFETY_CRITICAL'),
        category('MARKETPLACE_AVAILABILITY_ISSUE', 'Marketplace availability issue', ['MARKETPLACE_AVAILABILITY'], 'MEDIUM'),
        category('COUPON_PROMOTION_REWARD_ISSUE', 'Coupon/promotion/reward issue', ['REWARD_CAMPAIGN'], 'LOW'),
        category('SAFE_MESSAGING_REPORT_USER_ISSUE', 'Safe messaging/report user issue', ['MESSAGE_THREAD'], 'SAFETY_CRITICAL'),
        category('LISTING_PRODUCT_MODERATION_ISSUE', 'Listing/product moderation issue', ['LISTING'], 'HIGH'),
        category('TECHNICAL_APP_BUG', 'Technical/app bug', ['APP'], 'MEDIUM'),
        category('POLICY_TERMS_QUESTION', 'Policy/terms question', ['POLICY'], 'LOW'),
        category('OTHER', 'Other', ['GENERAL'], 'LOW')
    ];
}
function category(categoryCode, label, related, priority) {
    return {
        categoryCode,
        label,
        description: `${label} support with guided troubleshooting and ticket creation.`,
        suggestedRelatedEntityTypes: related,
        evidenceRecommendations: ['Screenshot', 'Error proof', 'Relevant timeline context'],
        selfServiceSuggestionTypes: ['VIEW_RELATED_STATUS', 'GUIDED_HELP', 'CREATE_TICKET'],
        defaultPriorityHint: priority,
        unsafeContentWarningRequired: ['DIGITAL_CODE_ACCESS_ISSUE', 'ACCOUNT_LOGIN_SECURITY_ISSUE', 'PAYOUT_ISSUE'].includes(categoryCode)
    };
}
function guidedHelp() {
    return {
        flowId: 'guided-digital-code',
        categoryCode: 'DIGITAL_CODE_ACCESS_ISSUE',
        title: 'Digital code issue',
        createTicketRecommended: true,
        steps: [
            { stepId: 'step-revealed', question: 'Was the code revealed?', options: ['Yes', 'No'], explanation: 'Reveal status changes refund and review routing.', nextStepMap: { Yes: 'step-invalid', No: 'step-library' } },
            { stepId: 'step-invalid', question: 'Is the code invalid or already used?', options: ['Invalid', 'Already used', 'Other'], explanation: 'Attach only screenshots, not the actual code.', nextStepMap: { Invalid: 'create-ticket', 'Already used': 'create-ticket', Other: 'self-service' } }
        ],
        suggestedActions: selfServiceSuggestions()
    };
}
function selfServiceSuggestions() {
    return [
        { suggestionId: 'suggest-refund', title: 'Request Refund', description: 'Start a seller-order scoped refund for digital access issues.', actionLabel: 'Request refund', route: '/orders/parent-order-1000/refund', relatedEntityType: 'ORDER', relatedEntityId: 'parent-order-1000' },
        { suggestionId: 'suggest-library', title: 'Check Digital Library', description: 'Confirm reveal/download status before opening a ticket.', actionLabel: 'Open library', route: '/library', relatedEntityType: 'DIGITAL_ACCESS', relatedEntityId: 'access-001' },
        { suggestionId: 'suggest-paypal', title: 'Connect PayPal', description: 'Resolve common payout blockers before creating a ticket.', actionLabel: 'Open payout eligibility', route: '/seller/verification', relatedEntityType: 'PAYOUT', relatedEntityId: 'payout-001' }
    ];
}
function ticketSummaries() {
    return [
        { ticketId: 'ticket-001', ticketReference: 'SUP-1001', categoryCode: 'DIGITAL_CODE_ACCESS_ISSUE', subject: 'Code says already used', relatedEntityType: 'SELLER_ORDER_ITEM', relatedEntityReference: 'SH-1000-A item 1', status: 'WAITING_FOR_SUPPORT', priority: 'HIGH', severity: 'HIGH', lastUpdatedAt: now, unreadCount: 1, actionRequired: false, escalated: false },
        { ticketId: 'ticket-002', ticketReference: 'SUP-1002', categoryCode: 'PAYOUT_ISSUE', subject: 'PayPal payout setup blocked', relatedEntityType: 'PAYOUT', relatedEntityReference: 'PAYOUT-88', status: 'WAITING_FOR_BUYER', priority: 'MEDIUM', severity: 'MEDIUM', lastUpdatedAt: now, unreadCount: 1, actionRequired: true, escalated: true }
    ];
}
function ticketDetail() {
    const attachments = [attachment('attach-001', 'code-error-proof.png', 'UPLOADED')];
    const timeline = ticketTimeline();
    return {
        ticketId: 'ticket-001',
        ticketReference: 'SUP-1001',
        categoryCode: 'DIGITAL_CODE_ACCESS_ISSUE',
        subject: 'Code says already used',
        description: 'Buyer reported redemption error without sharing the actual digital code.',
        status: 'WAITING_FOR_SUPPORT',
        priority: 'HIGH',
        severity: 'HIGH',
        relatedEntity: relatedEntities()[0],
        messages: [
            { messageId: 'msg-1', senderType: 'USER', senderDisplayName: 'Buyer', body: 'The redemption page says this code was already used. I attached the error screenshot.', attachments, createdAt: now, read: true, moderationStatus: 'SAFE', systemMessage: false },
            { messageId: 'msg-2', senderType: 'SYSTEM', senderDisplayName: 'Sharity', body: 'For safety, do not share the actual code, passwords, card details, or private contact information.', attachments: [], createdAt: now, read: true, moderationStatus: 'SAFE', systemMessage: true }
        ],
        attachments,
        timeline,
        availableActions: ['REPLY', 'ATTACH_EVIDENCE', 'ESCALATE', 'CLOSE'],
        createdAt: now,
        updatedAt: now
    };
}
function relatedEntities() {
    return [
        { relatedEntityType: 'SELLER_ORDER_ITEM', relatedEntityId: 'item-a-1', relatedEntityReference: 'SH-1000-A item 1', status: 'DIGITAL_ACCESS_READY', summary: 'Game Code Hub digital item with reveal history.', route: '/orders/parent-order-1000/refund', accessAllowed: true },
        { relatedEntityType: 'REFUND_REQUEST', relatedEntityId: 'refund-seller-order-001', relatedEntityReference: 'RF-1001', status: 'SELLER_RESPONSE_PENDING', summary: 'Refund timeline is waiting for seller response.', route: '/refunds/refund-seller-order-001', accessAllowed: true }
    ];
}
function attachment(id, fileName, status) {
    return { attachmentId: id, fileName, fileType: 'image/png', fileSize: 240000, previewUrl: placeholderImageUrl('gift_cards'), uploadStatus: status, scanStatus: 'SCAN_PASSED', visibilityPolicy: 'Visible to support and relevant seller/admin reviewers only', createdAt: now };
}
function ticketTimeline() {
    return [
        { eventId: 'support-time-1', eventType: 'TICKET_CREATED', title: 'Ticket created', message: 'Support ticket created with related seller order item.', actorType: 'USER', status: 'COMPLETED', timestamp: now },
        { eventId: 'support-time-2', eventType: 'ATTACHMENT_UPLOADED', title: 'Attachment uploaded', message: 'Screenshot uploaded and scanned.', actorType: 'USER', status: 'COMPLETED', timestamp: now },
        { eventId: 'support-time-3', eventType: 'WAITING_FOR_SUPPORT', title: 'Waiting for support', message: 'Support team placeholder will review this ticket.', actorType: 'SHARITY', status: 'PENDING', timestamp: now }
    ];
}

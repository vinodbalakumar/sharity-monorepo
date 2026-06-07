import type { NotificationActionResponse, NotificationCenterDashboardResponse, NotificationCenterScreenData, NotificationFilter, NotificationItem, NotificationTimeGroup, NotificationUnreadCounts } from './notificationTypes';

const now = Date.now();
const iso = (hoursAgo: number) => new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

let notifications: NotificationItem[] = [
  item('notif-order', 'Order update available', 'Order SH-1000 is moving through checkout.', 'ORDER_UPDATE', 'BUYER', 'SUCCESS', false, false, false, 1, 'ORDER', 'SH-1000', 'View order', 'orders', placeholderImageUrl('gift_cards')),
  item('notif-seller-order', 'Seller acceptance needed', 'Accept seller order SH-1000-A within 24 hours.', 'SELLER_ACCEPTANCE_UPDATE', 'SELLER', 'WARNING', true, true, false, 2, 'SELLER_ORDER', 'SH-1000-A', 'Review seller order', 'orders'),
  item('notif-payment-failed', 'Payment authorization failed', 'Your PayPal authorization could not be completed.', 'PAYMENT_AUTHORIZATION_UPDATE', 'BUYER', 'CRITICAL', true, true, false, 3, 'PAYMENT_AUTHORIZATION', 'PAY-AUTH-4431', 'Retry payment', 'paymentAuthorization'),
  item('notif-delivery', 'Digital delivery ready', 'Your digital item is ready in the secure library.', 'DIGITAL_DELIVERY_UPDATE', 'BUYER', 'SUCCESS', false, false, false, 5, 'ORDER', 'SH-1001', 'Open library', 'library', placeholderImageUrl('gaming')),
  item('notif-refund', 'Refund response needed', 'A seller responded to your refund request.', 'REFUND_UPDATE', 'BUYER', 'WARNING', true, true, false, 21, 'REFUND_REQUEST', 'REF-7781', 'View refund', 'refundStatus'),
  item('notif-dispute', 'Sharity Review update', 'New timeline event added to dispute DSP-8821.', 'DISPUTE_SHARITY_REVIEW_UPDATE', 'BOTH', 'WARNING', false, true, false, 25, 'DISPUTE', 'DSP-8821', 'Open dispute', 'disputeStatus'),
  item('notif-payout', 'Payout blocked', 'Complete verification before payout can proceed.', 'SELLER_PAYOUT_UPDATE', 'SELLER', 'CRITICAL', true, true, false, 49, 'PAYOUT', 'PAY-7712', 'View eligibility', 'sellerVerification'),
  item('notif-verification', 'Seller verification required', 'Upload required verification details to keep selling.', 'SELLER_VERIFICATION_UPDATE', 'SELLER', 'WARNING', true, true, false, 55, 'SELLER_VERIFICATION', 'VER-5520', 'Complete verification', 'sellerVerification'),
  item('notif-support', 'Support ticket reply', 'Support replied to ticket SUP-1001.', 'SUPPORT_TICKET_UPDATE', 'BOTH', 'INFO', false, false, false, 77, 'SUPPORT_TICKET', 'SUP-1001', 'Open support ticket', 'support'),
  item('notif-security', 'Security alert', 'A new login was detected from an approximate Phoenix region.', 'SECURITY_ALERT', 'BOTH', 'CRITICAL', true, true, false, 80, 'SECURITY_EVENT', 'SEC-1002', 'Review security alert', 'loginSecurity'),
  item('notif-marketplace', 'Marketplace availability changed', 'Grocery is not yet available for your country.', 'MARKETPLACE_AVAILABILITY_UPDATE', 'BOTH', 'INFO', false, false, false, 110, 'MARKETPLACE', 'GROCERY', 'View settings', 'appSettings'),
  item('notif-reward', 'Reward credit available', 'A Sharity credit campaign is available.', 'COUPON_PROMOTION_REWARD_UPDATE', 'BUYER', 'SUCCESS', false, false, false, 130, 'REWARD', 'RW-2201', 'View rewards', 'rewards'),
  item('notif-policy', 'Policy re-acceptance required', 'Accept updated seller terms to continue selling.', 'POLICY_TERMS_REACCEPTANCE_ALERT', 'SELLER', 'CRITICAL', true, true, false, 170, 'POLICY', 'POL-2026-06', 'Accept policy', 'policies'),
  item('notif-country', 'Profile country review', 'Your country change request may affect future marketplace access.', 'ACCOUNT_PROFILE_COUNTRY_CHANGE_ALERT', 'BOTH', 'WARNING', false, true, false, 190, 'PROFILE', 'COUNTRY-USA', 'Open profile', 'profilePrivacy'),
  item('notif-listing', 'Listing moderation result', 'One listing needs changes before publishing.', 'LISTING_MODERATION_ALERT', 'SELLER', 'WARNING', true, true, false, 260, 'LISTING', 'LST-2055', 'Review listing', 'marketplaces'),
  item('notif-admin', 'Admin announcement placeholder', 'Future broadcasts and templates will appear here.', 'ADMIN_ANNOUNCEMENT', 'ADMIN', 'INFO', false, false, false, 320, 'ANNOUNCEMENT', 'ANN-001', 'Preview announcement', 'notifications')
];

export async function getNotificationCenterData(filter: NotificationFilter, query = ''): Promise<NotificationCenterScreenData> {
  const filtered = filterNotifications(notifications, filter, query);
  return {
    dashboard: dashboard(filtered),
    notifications: filtered,
    timeGroups: groups(filtered),
    adminBroadcasts: [
      { broadcastId: 'broadcast-001', title: 'Marketplace maintenance placeholder', status: 'DRAFT_PLACEHOLDER', audienceType: 'All users later', deliveryChannels: ['IN_APP', 'PUSH', 'EMAIL'], createdBy: 'Admin placeholder', createdAt: iso(3), placeholder: true },
      { broadcastId: 'broadcast-002', title: 'Country availability announcement', status: 'TEMPLATE_PLACEHOLDER', audienceType: 'Country segment later', deliveryChannels: ['IN_APP'], createdBy: 'Admin placeholder', createdAt: iso(30), placeholder: true }
    ],
    adminTemplates: [
      { templateId: 'template-marketplace', templateName: 'Marketplace announcement', category: 'MARKETPLACE', channel: 'IN_APP', placeholder: true },
      { templateId: 'template-policy', templateName: 'Policy update', category: 'POLICY', channel: 'EMAIL', placeholder: true }
    ]
  };
}

export async function markNotificationRead(notificationId: string, read: boolean): Promise<NotificationActionResponse> {
  notifications = notifications.map((item) => item.notificationId === notificationId ? { ...item, status: read ? 'READ' : 'UNREAD', readAt: read ? new Date().toISOString() : undefined } : item);
  return response(notificationId, read ? 'MARK_READ' : 'MARK_UNREAD', true, 'Notification read state updated.');
}

export async function markAllNotificationsRead(): Promise<NotificationActionResponse> {
  notifications = notifications.map((item) => item.archived ? item : { ...item, status: 'READ', readAt: new Date().toISOString() });
  return response('ALL', 'MARK_ALL_READ', true, 'All eligible notifications marked read.');
}

export async function archiveNotification(notificationId: string): Promise<NotificationActionResponse> {
  const target = notifications.find((item) => item.notificationId === notificationId);
  if (!target || (target.critical && target.actionRequired)) return response(notificationId, 'ARCHIVE', false, 'Critical unresolved notifications cannot be archived until action is complete.');
  notifications = notifications.map((item) => item.notificationId === notificationId ? { ...item, archived: true, status: 'ARCHIVED' } : item);
  return response(notificationId, 'ARCHIVE', true, 'Notification archived. Audit and business history were not deleted.');
}

export async function openNotificationAction(notificationId: string, actionCode: string): Promise<NotificationActionResponse> {
  const target = notifications.find((item) => item.notificationId === notificationId);
  const action = target?.primaryAction.actionCode === actionCode ? target.primaryAction : target?.secondaryActions.find((candidate) => candidate.actionCode === actionCode);
  if (!target || !action || action.expired) return response(notificationId, actionCode, false, 'This action is no longer available.');
  return { ...response(notificationId, actionCode, true, `Action validated. Route: ${action.route}.`), route: action.route, requiresReauth: action.requiresReauth };
}

function dashboard(items: NotificationItem[]): NotificationCenterDashboardResponse {
  const unreadCounts = counts(notifications);
  return {
    unreadCounts,
    criticalNotifications: notifications.filter((item) => item.critical && item.pinned && !item.archived),
    actionRequiredNotifications: notifications.filter((item) => item.actionRequired && !item.archived),
    availableFilters: filters().map((filterCode) => ({ filterCode, label: filterCode, count: filterNotifications(notifications, filterCode, '').length, active: false, available: true })),
    recentNotifications: items.slice(0, 6),
    preferencesShortcut: { route: 'appSettings', criticalAlertsMandatory: true, promotionalNotificationsEnabled: false, pushEnabled: true, emailEnabled: true, inAppEnabled: true, userSafeMessage: 'Critical security, payment, payout, and safety alerts cannot be fully disabled.' },
    availableActions: ['VIEW_NOTIFICATION', 'OPEN_RELATED_ENTITY', 'MARK_READ', 'MARK_UNREAD', 'MARK_ALL_READ', 'ARCHIVE_NOTIFICATION', 'FILTER_NOTIFICATIONS', 'SEARCH_NOTIFICATIONS', 'MANAGE_NOTIFICATION_PREFERENCES']
  };
}

function item(notificationId: string, title: string, shortMessage: string, category: string, roleContext: NotificationItem['roleContext'], severity: NotificationItem['severity'], unread: boolean, actionRequired: boolean, archived: boolean, hoursAgo: number, entityType: string, entityId: string, actionLabel: string, route: string, imageUrl?: string): NotificationItem {
  const critical = severity === 'CRITICAL';
  return {
    notificationId,
    title,
    shortMessage,
    fullMessage: `${shortMessage} Sharity keeps sensitive provider payloads, digital codes, raw URLs, security raw payloads, internal risk, and admin notes hidden from notification content.`,
    category,
    roleContext,
    severity,
    status: archived ? 'ARCHIVED' : unread ? 'UNREAD' : 'READ',
    archived,
    pinned: critical || actionRequired,
    critical,
    actionRequired,
    createdAt: iso(hoursAgo),
    readAt: unread ? undefined : iso(hoursAgo - 0.1),
    imageUrl,
    relatedEntity: { relatedEntityType: entityType, relatedEntityId: entityId, relatedEntityReference: entityId, status: actionRequired ? 'ACTION_REQUIRED' : 'AVAILABLE', summary: `${entityType} ${entityId}`, route, accessAllowed: entityType !== 'MISSING' },
    primaryAction: { actionCode: 'OPEN_RELATED_ENTITY', label: actionLabel, route, enabled: true, expired: false, requiresReauth: critical && category.includes('SECURITY'), primary: true },
    secondaryActions: [
      { actionCode: 'MARK_READ', label: 'Mark read', route: 'notifications', enabled: true, expired: false, requiresReauth: false, primary: false },
      { actionCode: 'ARCHIVE', label: 'Archive', route: 'notifications', enabled: !(critical && actionRequired), expired: false, userSafeDisabledReason: critical && actionRequired ? 'Resolve critical action first.' : undefined, requiresReauth: false, primary: false }
    ],
    deliveryChannels: [
      { channel: 'IN_APP', enabled: true, sent: true, delivered: true, failed: false, userSafeMessage: 'Delivered in-app.' },
      { channel: 'PUSH', enabled: true, sent: critical || actionRequired, delivered: critical || actionRequired, failed: false, userSafeMessage: critical || actionRequired ? 'Push notification sent.' : 'Push not required.' },
      { channel: 'EMAIL', enabled: true, sent: critical, delivered: critical, failed: false, userSafeMessage: critical ? 'Email notification sent.' : 'Email not required.' },
      { channel: 'SMS_LATER', enabled: false, sent: false, delivered: false, failed: false, userSafeMessage: 'SMS is later.' }
    ],
    userSafeMetadata: 'Related entity access is backend-validated before navigation.'
  };
}

function groups(items: NotificationItem[]): NotificationTimeGroup[] {
  return [
    group('today', 'Today', items.filter((item) => hours(item) < 24)),
    group('yesterday', 'Yesterday', items.filter((item) => hours(item) >= 24 && hours(item) < 48)),
    group('this-week', 'This week', items.filter((item) => hours(item) >= 48 && hours(item) < 168)),
    group('older', 'Older', items.filter((item) => hours(item) >= 168))
  ];
}
function group(groupCode: NotificationTimeGroup['groupCode'], label: string, items: NotificationItem[]): NotificationTimeGroup { return { groupCode, label, count: items.length, unreadCount: items.filter((item) => item.status === 'UNREAD').length, notifications: items }; }
function counts(items: NotificationItem[]): NotificationUnreadCounts { const visible = items.filter((item) => !item.archived); return { totalUnread: visible.filter((item) => item.status === 'UNREAD').length, buyerUnread: visible.filter((item) => item.status === 'UNREAD' && item.roleContext === 'BUYER').length, sellerUnread: visible.filter((item) => item.status === 'UNREAD' && item.roleContext === 'SELLER').length, criticalUnread: visible.filter((item) => item.status === 'UNREAD' && item.critical).length, actionRequiredUnread: visible.filter((item) => item.actionRequired).length }; }
function filterNotifications(items: NotificationItem[], filter: NotificationFilter, query: string) { const needle = query.trim().toLowerCase(); return items.filter((item) => (filter === 'Archived' ? item.archived : !item.archived)).filter((item) => matches(item, filter)).filter((item) => !needle || `${item.title} ${item.shortMessage} ${item.category} ${item.relatedEntity.relatedEntityReference}`.toLowerCase().includes(needle)); }
function matches(item: NotificationItem, filter: NotificationFilter) { if (filter === 'All' || filter === 'Archived') return true; if (filter === 'Buyer') return item.roleContext === 'BUYER'; if (filter === 'Seller') return item.roleContext === 'SELLER'; if (filter === 'Unread') return item.status === 'UNREAD'; if (filter === 'Critical') return item.critical; if (filter === 'Action required') return item.actionRequired; return item.category.replaceAll('_', ' ').toLowerCase().includes(filter.toLowerCase().split('/')[0] ?? ''); }
function filters(): NotificationFilter[] { return ['All', 'Buyer', 'Seller', 'Orders', 'Seller orders', 'Payments', 'Seller acceptance', 'Digital delivery', 'Refunds', 'Disputes', 'Payouts', 'Verification', 'Support', 'Security', 'Marketplace', 'Coupons/rewards', 'Policies', 'Listing moderation', 'Admin announcements', 'Unread', 'Critical', 'Action required', 'Archived']; }
function hours(item: NotificationItem) { return Math.max(0, (now - new Date(item.createdAt).getTime()) / (60 * 60 * 1000)); }
function response(notificationId: string, actionCode: string, allowed: boolean, message: string): NotificationActionResponse { return { notificationId, actionCode, allowed, route: 'notifications', message, requiresReauth: false, updatedAt: new Date().toISOString() }; }
import { placeholderImageUrl } from '../../utils/mockImages';

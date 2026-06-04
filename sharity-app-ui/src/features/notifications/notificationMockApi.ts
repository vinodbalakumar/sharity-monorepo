import type { NotificationFeedResponse, NotificationFilter, NotificationItem, NotificationSummaryCounts } from './notificationTypes';

const now = Date.now();

const baseActions = {
  canMarkRead: true,
  canMarkUnread: true,
  canArchive: true,
  canViewOrder: false,
  canViewRefund: false,
  canViewDispute: false,
  canOpenMessage: false,
  canViewPayout: false,
  canViewListing: false,
  canManagePreferences: true,
  canBack: true
};

const notifications: NotificationItem[] = [
  item('notif-dispute-response', 'Dispute response required', 'Respond before Jun 5 to avoid delayed review.', 'SELLER', 'Disputes', 'ACTION_REQUIRED', 1, false, true, true, '/seller/disputes/DSP-8821', 'DSP-8821', { canViewDispute: true }),
  item('notif-security-login', 'New login detected', 'A new login was detected from a recognized browser.', 'SYSTEM', 'Security', 'CRITICAL', 2, false, true, true, '/profile/security', 'SEC-1002'),
  item('notif-order-complete', 'Order completed', 'Your digital order is complete and ready in your library.', 'BUYER', 'Orders', 'SUCCESS', 5, false, false, false, '/orders/ORD-4109', 'ORD-4109', { canViewOrder: true, image: 'marketplace/placeholders/gift_cards.png' }),
  item('notif-low-code', 'Low code inventory', 'Add codes soon to keep this digital listing available.', 'SELLER', 'Listings', 'WARNING', 26, false, false, true, '/seller/listings/LST-2055/codes', 'LST-2055', { canViewListing: true, image: 'marketplace/placeholders/gaming.png' }),
  item('notif-message', 'New safe message', 'A buyer sent a message about order ORD-4109.', 'SELLER', 'Messages', 'INFO', 30, true, false, false, '/seller/messages/order/ORD-4109', 'ORD-4109', { canOpenMessage: true }),
  item('notif-payout-hold', 'Payout on hold', 'A payout is held until verification is completed.', 'SELLER', 'Payouts', 'WARNING', 80, false, false, true, '/seller/payouts', 'PAY-7712', { canViewPayout: true }),
  item('notif-listing-approved', 'Listing approved', 'Your listing passed review and is visible to buyers.', 'SELLER', 'Listings', 'SUCCESS', 90, true, false, false, '/seller/products', 'LST-2001', { canViewListing: true, image: 'marketplace/placeholders/electronics.png' }),
  item('notif-policy-required', 'Policy acceptance required', 'Accept the updated seller policy to continue selling.', 'SYSTEM', 'Security', 'CRITICAL', 220, false, true, true, '/settings/policies', 'POL-2026-06'),
  item('notif-maintenance', 'System maintenance scheduled', 'Some marketplace tools may be unavailable during maintenance.', 'SYSTEM', 'System', 'INFO', 360, true, false, false, '/system/status', 'SYS-2201')
];

export async function getNotificationFeed(filter: NotificationFilter): Promise<NotificationFeedResponse> {
  const filtered = notifications.filter((notification) => matchesFilter(notification, filter) && !notification.archived);
  return {
    notifications: filtered,
    groups: [
      group('today', 'Today', filtered, ['notif-dispute-response', 'notif-security-login', 'notif-order-complete']),
      group('yesterday', 'Yesterday', filtered, ['notif-low-code', 'notif-message']),
      group('this-week', 'This Week', filtered, ['notif-payout-hold', 'notif-listing-approved']),
      group('earlier', 'Earlier', filtered, ['notif-policy-required', 'notif-maintenance'])
    ],
    summaryCounts: counts(notifications),
    availableFilters: ['All', 'Buyer', 'Seller', 'Orders', 'Refunds', 'Disputes', 'Messages', 'Payouts', 'Listings', 'Security', 'Unread', 'Action Required']
  };
}

export async function markNotificationRead(notificationId: string, read: boolean) {
  const notification = notifications.find((item) => item.notificationId === notificationId);
  if (notification) {
    notification.read = read;
    notification.readAt = read ? new Date().toISOString() : undefined;
  }
}

export async function markAllNotificationsRead() {
  notifications.forEach((notification) => {
    notification.read = true;
    notification.readAt = new Date().toISOString();
  });
}

export async function archiveNotification(notificationId: string) {
  const notification = notifications.find((item) => item.notificationId === notificationId);
  if (!notification) {
    throw new Error('NOTIFICATION_NOT_FOUND');
  }
  if (notification.nonDismissible) {
    throw new Error('NOTIFICATION_ARCHIVE_NOT_ALLOWED');
  }
  notification.archived = true;
}

function item(notificationId: string, title: string, message: string, role: NotificationItem['role'], category: string, priority: NotificationItem['priority'], hoursAgo: number, read: boolean, critical: boolean, actionRequired: boolean, route: string, relatedEntityId: string, options: Partial<NotificationItem['availableActions']> & { image?: string } = {}): NotificationItem {
  const nonDismissible = critical || priority === 'ACTION_REQUIRED';
  return {
    notificationId,
    title,
    message,
    role,
    category,
    priority,
    read,
    archived: false,
    critical,
    nonDismissible,
    actionRequired,
    relatedEntityType: category.toUpperCase(),
    relatedEntityId,
    relatedReference: relatedEntityId,
    productImageUrl: options.image,
    iconType: critical ? 'shield' : actionRequired ? 'alert' : 'bell',
    createdAt: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
    readAt: read ? new Date(now - (hoursAgo - 0.2) * 60 * 60 * 1000).toISOString() : undefined,
    availableActions: { ...baseActions, ...options, canArchive: !nonDismissible },
    deepLink: { route, routeParams: { id: relatedEntityId }, targetType: category.toUpperCase(), requiresAuth: true, requiredRole: role === 'SYSTEM' ? 'MIXED' : role, fallbackRoute: '/notifications' }
  };
}

function group(groupKey: NotificationFeedResponse['groups'][number]['groupKey'], groupLabel: string, items: NotificationItem[], ids: string[]) {
  return { groupKey, groupLabel, notificationIds: ids.filter((id) => items.some((item) => item.notificationId === id)) };
}

function counts(items: NotificationItem[]): NotificationSummaryCounts {
  return {
    unreadCount: items.filter((item) => !item.read).length,
    actionRequiredCount: items.filter((item) => item.actionRequired).length,
    criticalCount: items.filter((item) => item.critical).length,
    buyerCount: items.filter((item) => item.role === 'BUYER').length,
    sellerCount: items.filter((item) => item.role === 'SELLER').length
  };
}

function matchesFilter(notification: NotificationItem, filter: NotificationFilter) {
  if (filter === 'All') return true;
  if (filter === 'Buyer') return notification.role === 'BUYER';
  if (filter === 'Seller') return notification.role === 'SELLER';
  if (filter === 'Unread') return !notification.read;
  if (filter === 'Action Required') return notification.actionRequired;
  return notification.category === filter;
}

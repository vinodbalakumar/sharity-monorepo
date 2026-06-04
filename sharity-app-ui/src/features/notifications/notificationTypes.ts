export type NotificationRole = 'BUYER' | 'SELLER' | 'SYSTEM';
export type NotificationPriority = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'ACTION_REQUIRED';
export type NotificationFilter = 'All' | 'Buyer' | 'Seller' | 'Orders' | 'Refunds' | 'Disputes' | 'Messages' | 'Payouts' | 'Listings' | 'Security' | 'Unread' | 'Action Required';

export type NotificationDeepLink = {
  route: string;
  routeParams: Record<string, string>;
  targetType: string;
  requiresAuth: boolean;
  requiredRole: NotificationRole | 'MIXED';
  fallbackRoute: string;
};

export type NotificationAvailableActions = {
  canMarkRead: boolean;
  canMarkUnread: boolean;
  canArchive: boolean;
  canViewOrder: boolean;
  canViewRefund: boolean;
  canViewDispute: boolean;
  canOpenMessage: boolean;
  canViewPayout: boolean;
  canViewListing: boolean;
  canManagePreferences: boolean;
  canBack: boolean;
};

export type NotificationItem = {
  notificationId: string;
  title: string;
  message: string;
  role: NotificationRole;
  category: string;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  critical: boolean;
  nonDismissible: boolean;
  actionRequired: boolean;
  relatedEntityType: string;
  relatedEntityId: string;
  relatedReference: string;
  productImageUrl?: string;
  iconType: string;
  createdAt: string;
  readAt?: string;
  availableActions: NotificationAvailableActions;
  deepLink: NotificationDeepLink;
};

export type NotificationGroup = {
  groupKey: 'today' | 'yesterday' | 'this-week' | 'earlier';
  groupLabel: string;
  notificationIds: string[];
};

export type NotificationSummaryCounts = {
  unreadCount: number;
  actionRequiredCount: number;
  criticalCount: number;
  buyerCount: number;
  sellerCount: number;
};

export type NotificationFeedResponse = {
  notifications: NotificationItem[];
  groups: NotificationGroup[];
  summaryCounts: NotificationSummaryCounts;
  availableFilters: NotificationFilter[];
};

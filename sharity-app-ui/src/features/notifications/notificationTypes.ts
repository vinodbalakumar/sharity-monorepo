export type NotificationRoleContext = 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
export type NotificationFilter =
  | 'All'
  | 'Buyer'
  | 'Seller'
  | 'Orders'
  | 'Seller orders'
  | 'Payments'
  | 'Seller acceptance'
  | 'Digital delivery'
  | 'Refunds'
  | 'Disputes'
  | 'Payouts'
  | 'Verification'
  | 'Support'
  | 'Security'
  | 'Marketplace'
  | 'Coupons/rewards'
  | 'Policies'
  | 'Listing moderation'
  | 'Admin announcements'
  | 'Unread'
  | 'Critical'
  | 'Action required'
  | 'Archived';

export type NotificationUnreadCounts = {
  totalUnread: number;
  buyerUnread: number;
  sellerUnread: number;
  criticalUnread: number;
  actionRequiredUnread: number;
};

export type NotificationRelatedEntity = {
  relatedEntityType: string;
  relatedEntityId: string;
  relatedEntityReference: string;
  status: string;
  summary: string;
  route: string;
  accessAllowed: boolean;
};

export type NotificationAction = {
  actionCode: string;
  label: string;
  route: string;
  enabled: boolean;
  expired: boolean;
  userSafeDisabledReason?: string;
  requiresReauth: boolean;
  primary: boolean;
};

export type NotificationDeliveryChannelStatus = {
  channel: 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS_LATER';
  enabled: boolean;
  sent: boolean;
  delivered: boolean;
  failed: boolean;
  userSafeMessage: string;
};

export type NotificationItem = {
  notificationId: string;
  title: string;
  shortMessage: string;
  fullMessage: string;
  category: string;
  roleContext: NotificationRoleContext;
  severity: NotificationSeverity;
  status: NotificationStatus;
  archived: boolean;
  pinned: boolean;
  critical: boolean;
  actionRequired: boolean;
  createdAt: string;
  readAt?: string;
  relatedEntity: NotificationRelatedEntity;
  primaryAction: NotificationAction;
  secondaryActions: NotificationAction[];
  deliveryChannels: NotificationDeliveryChannelStatus[];
  userSafeMetadata: string;
  imageUrl?: string;
};

export type NotificationFilterOption = { filterCode: NotificationFilter; label: string; count: number; active: boolean; available: boolean };
export type NotificationTimeGroup = { groupCode: 'today' | 'yesterday' | 'this-week' | 'older'; label: string; count: number; unreadCount: number; notifications: NotificationItem[] };
export type NotificationActionResponse = { notificationId: string; actionCode: string; allowed: boolean; route: string; message: string; requiresReauth: boolean; updatedAt: string };
export type NotificationPreferenceSummary = { route: string; criticalAlertsMandatory: boolean; promotionalNotificationsEnabled: boolean; pushEnabled: boolean; emailEnabled: boolean; inAppEnabled: boolean; userSafeMessage: string };
export type AdminBroadcastSummary = { broadcastId: string; title: string; status: string; audienceType: string; deliveryChannels: string[]; createdBy: string; createdAt: string; placeholder: boolean };
export type AdminBroadcastTemplate = { templateId: string; templateName: string; category: string; channel: string; placeholder: boolean };
export type NotificationCenterDashboardResponse = { unreadCounts: NotificationUnreadCounts; criticalNotifications: NotificationItem[]; actionRequiredNotifications: NotificationItem[]; availableFilters: NotificationFilterOption[]; recentNotifications: NotificationItem[]; preferencesShortcut: NotificationPreferenceSummary; availableActions: string[] };
export type NotificationCenterScreenData = { dashboard: NotificationCenterDashboardResponse; notifications: NotificationItem[]; timeGroups: NotificationTimeGroup[]; adminBroadcasts: AdminBroadcastSummary[]; adminTemplates: AdminBroadcastTemplate[] };

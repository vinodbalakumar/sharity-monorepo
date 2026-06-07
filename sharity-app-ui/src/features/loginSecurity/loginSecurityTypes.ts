export type SecurityStatus = 'GOOD' | 'ACTION_RECOMMENDED' | 'RISK_DETECTED';
export type SecuritySeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export type SecurityDashboardResponse = {
  securityStatus: SecurityStatus;
  loginMethods: number;
  activeDeviceCount: number;
  recentAlertCount: number;
  recoveryStatus: string;
  lastPasswordChangeAt: string;
  lastLoginAt: string;
  requiredActionCount: number;
  availableActions: string[];
};

export type LoginMethodItem = {
  methodId: string;
  methodType: 'PASSWORD' | 'GOOGLE' | 'APPLE' | 'PASSKEY_LATER' | 'TWO_FACTOR_LATER';
  label: string;
  status: 'ACTIVE' | 'NOT_ADDED' | 'COMING_LATER';
  linkedEmail?: string;
  primary: boolean;
  lastUsedAt?: string;
  canUnlink: boolean;
  unlinkBlockedReason?: string;
  availableActions: string[];
};

export type DeviceSessionItem = {
  deviceSessionId: string;
  deviceName: string;
  browserOrApp: string;
  platform: string;
  approximateLocation: string;
  lastActiveAt: string;
  currentDevice: boolean;
  sessionStatus: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  trustedLater: boolean;
  availableActions: string[];
};

export type SecurityAlertItem = {
  alertId: string;
  alertType: string;
  title: string;
  severity: SecuritySeverity;
  createdAt: string;
  approximateLocation?: string;
  deviceSummary?: string;
  relatedAction?: string;
  notificationSent: boolean;
  reportSuspiciousAvailable: boolean;
  userSafeMessage: string;
};

export type SecurityEventHistoryItem = {
  eventId: string;
  eventType: string;
  title: string;
  timestamp: string;
  deviceSummary: string;
  approximateLocation: string;
  status: string;
  userSafeMessage: string;
  actionTaken: string;
  reportSuspiciousAvailable: boolean;
};

export type ReauthenticationChallengeRequest = {
  actionType: string;
  relatedEntityId?: string;
  preferredMethod: string;
};

export type ReauthenticationChallengeResponse = {
  challengeId: string;
  required: boolean;
  allowedMethods: string[];
  expiresAt: string;
  message: string;
};

export type RecoveryOptionItem = {
  recoveryType: string;
  label: string;
  status: 'ACTIVE' | 'MISSING' | 'COMING_LATER';
  verified: boolean;
  lastUpdatedAt?: string;
  availableActions: string[];
};

export type SuspiciousActivityReportRequest = {
  relatedSecurityEventId?: string;
  reasonCode: string;
  message: string;
  attachmentIds: string[];
  requestSignOutAllDevices: boolean;
  userAcknowledgedSecurityGuidance: boolean;
};

export type SuspiciousActivityReportResponse = {
  reportId: string;
  status: string;
  supportTicketId: string;
  accountProtectionRecommended: boolean;
  nextActions: string[];
  message: string;
};

export type SecurityActionResponse = {
  success: boolean;
  status: string;
  message: string;
  updatedAt: string;
};

export type AdminSecurityReviewQueueItem = {
  reviewId: string;
  userId: string;
  userSafeIdentifier: string;
  eventType: string;
  severity: SecuritySeverity;
  status: string;
  createdAt: string;
  assignedTo: string;
  placeholder: boolean;
};

export type LoginSecurityScreenData = {
  dashboard: SecurityDashboardResponse;
  loginMethods: LoginMethodItem[];
  devices: DeviceSessionItem[];
  alerts: SecurityAlertItem[];
  events: SecurityEventHistoryItem[];
  recoveryOptions: RecoveryOptionItem[];
  adminQueue: AdminSecurityReviewQueueItem[];
};

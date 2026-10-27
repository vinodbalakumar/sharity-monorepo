import type { AdminSecurityReviewQueueItem, DeviceSessionItem, LoginMethodItem, LoginSecurityScreenData, RecoveryOptionItem, SecurityActionResponse, SecurityAlertItem, SecurityDashboardResponse, SecurityEventHistoryItem, SuspiciousActivityReportResponse } from './loginSecurityTypes';

const now = Date.now();
const iso = (hoursAgo: number) => new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

const dashboard: SecurityDashboardResponse = {
  securityStatus: 'ACTION_RECOMMENDED',
  loginMethods: 3,
  activeDeviceCount: 3,
  recentAlertCount: 6,
  recoveryStatus: 'Recovery phone missing',
  lastPasswordChangeAt: iso(24 * 38),
  lastLoginAt: iso(1),
  requiredActionCount: 2,
  availableActions: ['CHANGE_PASSWORD', 'ADD_GOOGLE_LOGIN', 'ADD_APPLE_LOGIN', 'SIGN_OUT_EVERYWHERE', 'REPORT_SUSPICIOUS_ACTIVITY']
};

const loginMethods: LoginMethodItem[] = [
  { methodId: 'method-password', methodType: 'PASSWORD', label: 'Email and password', status: 'ACTIVE', linkedEmail: 'alex@example.com', primary: true, lastUsedAt: iso(2), canUnlink: true, availableActions: ['CHANGE_PASSWORD'] },
  { methodId: 'method-google', methodType: 'GOOGLE', label: 'Google', status: 'ACTIVE', linkedEmail: 'alex@gmail.com', primary: false, lastUsedAt: iso(36), canUnlink: true, availableActions: ['UNLINK_LOGIN_METHOD'] },
  { methodId: 'method-apple', methodType: 'APPLE', label: 'Apple', status: 'ACTIVE', linkedEmail: 'a***@privaterelay.appleid.com', primary: false, lastUsedAt: iso(120), canUnlink: true, availableActions: ['UNLINK_LOGIN_METHOD'] },
  { methodId: 'method-passkey', methodType: 'PASSKEY_LATER', label: 'Passkeys', status: 'COMING_LATER', primary: false, canUnlink: false, availableActions: [] },
  { methodId: 'method-two-factor', methodType: 'TWO_FACTOR_LATER', label: 'Two-factor authentication', status: 'COMING_LATER', primary: false, canUnlink: false, availableActions: [] }
];

const devices: DeviceSessionItem[] = [
  { deviceSessionId: 'device-current', deviceName: 'Chrome on Windows', browserOrApp: 'Chrome', platform: 'Windows', approximateLocation: 'Phoenix, AZ, USA', lastActiveAt: iso(0.2), currentDevice: true, sessionStatus: 'ACTIVE', trustedLater: true, availableActions: ['SIGN_OUT_THIS_DEVICE'] },
  { deviceSessionId: 'device-ios', deviceName: 'Sharity iOS app', browserOrApp: 'Sharity app', platform: 'iPhone', approximateLocation: 'Tempe, AZ, USA', lastActiveAt: iso(5), currentDevice: false, sessionStatus: 'ACTIVE', trustedLater: false, availableActions: ['REVOKE_DEVICE'] },
  { deviceSessionId: 'device-unknown', deviceName: 'Firefox on Linux', browserOrApp: 'Firefox', platform: 'Linux', approximateLocation: 'Denver, CO, USA', lastActiveAt: iso(18), currentDevice: false, sessionStatus: 'ACTIVE', trustedLater: false, availableActions: ['REVOKE_DEVICE', 'REPORT_SUSPICIOUS_ACTIVITY'] }
];

const alerts: SecurityAlertItem[] = [
  alert('alert-new-login', 'NEW_LOGIN', 'New login from a browser', 'WARNING', 1, 'Phoenix, AZ, USA', 'Chrome on Windows', 'Review device'),
  alert('alert-password', 'PASSWORD_CHANGED', 'Password changed', 'SUCCESS', 24, 'Phoenix, AZ, USA', 'Chrome on Windows', 'Security email sent'),
  alert('alert-google', 'LOGIN_METHOD_LINKED', 'Google login linked', 'INFO', 36, undefined, 'Google account', 'Review linked methods'),
  alert('alert-payout', 'PAYOUT_METHOD_CHANGED', 'Payout method changed', 'WARNING', 48, 'Phoenix, AZ, USA', 'Sharity web', 'Review payouts'),
  alert('alert-reveal', 'DIGITAL_CODE_REVEAL_NEW_DEVICE', 'Digital code revealed from a new device', 'CRITICAL', 72, 'Denver, CO, USA', 'Firefox on Linux', 'Report suspicious'),
  alert('alert-failed', 'FAILED_LOGIN_ATTEMPTS', 'Failed login attempts detected', 'WARNING', 96, 'Approximate US region', 'Unknown browser', 'Change password')
];

const events: SecurityEventHistoryItem[] = alerts.map((item, index) => ({
  eventId: item.alertId.replace('alert', 'event'),
  eventType: item.alertType,
  title: item.title,
  timestamp: item.createdAt,
  deviceSummary: item.deviceSummary ?? 'Account security',
  approximateLocation: item.approximateLocation ?? 'Not location-specific',
  status: index === 4 ? 'ACTION_REQUIRED' : 'RECORDED',
  userSafeMessage: item.userSafeMessage,
  actionTaken: item.relatedAction ?? 'Notification sent',
  reportSuspiciousAvailable: item.reportSuspiciousAvailable
}));

const recoveryOptions: RecoveryOptionItem[] = [
  { recoveryType: 'RECOVERY_EMAIL', label: 'Recovery email', status: 'ACTIVE', verified: true, lastUpdatedAt: iso(24 * 20), availableActions: ['UPDATE'] },
  { recoveryType: 'RECOVERY_PHONE', label: 'Recovery phone', status: 'MISSING', verified: false, availableActions: ['ADD'] },
  { recoveryType: 'TRUSTED_DEVICE_LATER', label: 'Trusted device', status: 'COMING_LATER', verified: false, availableActions: [] },
  { recoveryType: 'BACKUP_CODES_LATER', label: 'Backup codes', status: 'COMING_LATER', verified: false, availableActions: [] }
];

const adminQueue: AdminSecurityReviewQueueItem[] = [
  { reviewId: 'sec-review-001', userId: 'user-1042', userSafeIdentifier: 'alex@example.com', eventType: 'SUSPICIOUS_ACTIVITY', severity: 'CRITICAL', status: 'PLACEHOLDER_QUEUE', createdAt: iso(2), assignedTo: 'Security review later', placeholder: true },
  { reviewId: 'sec-review-002', userId: 'user-1177', userSafeIdentifier: 'seller***@example.com', eventType: 'PAYOUT_SECURITY', severity: 'WARNING', status: 'PLACEHOLDER_QUEUE', createdAt: iso(8), assignedTo: 'Unassigned', placeholder: true }
];

export async function getLoginSecurityScreenData(): Promise<LoginSecurityScreenData> {
  return { dashboard, loginMethods, devices, alerts, events, recoveryOptions, adminQueue };
}

export async function startSecurityAction(action: string): Promise<SecurityActionResponse> {
  return { success: true, status: action === 'UNLINK_FINAL_METHOD' ? 'FINAL_LOGIN_METHOD_CANNOT_BE_REMOVED' : 'REAUTH_REQUIRED', message: action === 'UNLINK_FINAL_METHOD' ? 'Add another login method before removing this one.' : 'Please verify your identity before continuing.', updatedAt: new Date().toISOString() };
}

export async function revokeDevice(deviceSessionId: string): Promise<SecurityActionResponse> {
  return { success: true, status: 'DEVICE_REVOKED', message: `Session ${deviceSessionId} will be signed out. Backend remains source of truth.`, updatedAt: new Date().toISOString() };
}

export async function signOutEverywhere(): Promise<SecurityActionResponse> {
  return { success: true, status: 'SIGN_OUT_EVERYWHERE_REAUTH_REQUIRED', message: 'Strong confirmation required before signing out every device.', updatedAt: new Date().toISOString() };
}

export async function reportSuspiciousActivity(): Promise<SuspiciousActivityReportResponse> {
  return { reportId: 'suspicious-report-001', status: 'SUBMITTED', supportTicketId: 'SUP-SEC-1001', accountProtectionRecommended: true, nextActions: ['CHANGE_PASSWORD', 'SIGN_OUT_EVERYWHERE', 'REVIEW_DEVICES'], message: 'Suspicious activity report submitted. A support/security review placeholder was created.' };
}

function alert(alertId: string, alertType: string, title: string, severity: SecurityAlertItem['severity'], hoursAgo: number, approximateLocation?: string, deviceSummary?: string, relatedAction?: string): SecurityAlertItem {
  return { alertId, alertType, title, severity, createdAt: iso(hoursAgo), approximateLocation, deviceSummary, relatedAction, notificationSent: true, reportSuspiciousAvailable: severity !== 'SUCCESS', userSafeMessage: 'Only approximate location and safe device details are shown. Raw IP, exact GPS, OAuth payloads, and risk scores stay hidden.' };
}

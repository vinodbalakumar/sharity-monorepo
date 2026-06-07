package com.java.vinod.marketplace.service.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class SecurityDtos {
    private SecurityDtos() {}

    public record SecurityDashboardResponse(String securityStatus, long loginMethods, long activeDeviceCount,
                                            long recentAlertCount, String recoveryStatus,
                                            LocalDateTime lastPasswordChangeAt, LocalDateTime lastLoginAt,
                                            long requiredActionCount, List<String> availableActions) {}
    public record LoginMethodItem(String methodId, String methodType, String label, String status,
                                  String linkedEmail, boolean primary, LocalDateTime lastUsedAt,
                                  boolean canUnlink, String unlinkBlockedReason, List<String> availableActions) {}
    public record DeviceSessionItem(String deviceSessionId, String deviceName, String browserOrApp, String platform,
                                    String approximateLocation, LocalDateTime lastActiveAt, boolean currentDevice,
                                    String sessionStatus, boolean trustedLater, List<String> availableActions) {}
    public record SecurityAlertItem(String alertId, String alertType, String title, String severity,
                                    LocalDateTime createdAt, String approximateLocation, String deviceSummary,
                                    String relatedAction, boolean notificationSent,
                                    boolean reportSuspiciousAvailable, String userSafeMessage) {}
    public record SecurityEventHistoryItem(String eventId, String eventType, String title, LocalDateTime timestamp,
                                           String deviceSummary, String approximateLocation, String status,
                                           String userSafeMessage, String actionTaken,
                                           boolean reportSuspiciousAvailable) {}
    public record ReauthenticationChallengeRequest(String actionType, String relatedEntityId, String preferredMethod) {}
    public record ReauthenticationChallengeResponse(String challengeId, boolean required, List<String> allowedMethods,
                                                    LocalDateTime expiresAt, String message) {}
    public record RecoveryOptionItem(String recoveryType, String label, String status, boolean verified,
                                     LocalDateTime lastUpdatedAt, List<String> availableActions) {}
    public record SuspiciousActivityReportRequest(String relatedSecurityEventId, String reasonCode, String message,
                                                  List<String> attachmentIds, boolean requestSignOutAllDevices,
                                                  boolean userAcknowledgedSecurityGuidance) {}
    public record SuspiciousActivityReportResponse(String reportId, String status, String supportTicketId,
                                                   boolean accountProtectionRecommended, List<String> nextActions,
                                                   String message) {}
    public record SecurityActionResponse(boolean success, String status, String message, LocalDateTime updatedAt) {}
    public record AdminSecurityReviewQueueItem(String reviewId, String userId, String userSafeIdentifier,
                                               String eventType, String severity, String status,
                                               LocalDateTime createdAt, String assignedTo, boolean placeholder) {}
    public record SecurityDashboardBundle(SecurityDashboardResponse dashboard, List<LoginMethodItem> loginMethods,
                                          List<DeviceSessionItem> devices, List<SecurityAlertItem> alerts,
                                          List<SecurityEventHistoryItem> events,
                                          List<RecoveryOptionItem> recoveryOptions,
                                          List<AdminSecurityReviewQueueItem> adminQueue) {}
    public record AccountSecurityResponse(String userId, String primaryEmail,
                                          List<LoginMethodItem> loginMethods,
                                          List<AccountSessionPlaceholder> sessions,
                                          List<SecurityAlertItem> securityAlerts,
                                          AccountSecurityActionEligibility actionEligibility,
                                          String userSafeMessage, LocalDateTime updatedAt) {}
    public record SocialLinkStartResponse(String provider, String status, String linkUrl,
                                          String userSafeMessage) {}
    public record SocialLinkCompleteRequest(String provider, String providerStateReference,
                                            String authorizationCodeReference) {}
    public record SocialLinkCompleteResponse(boolean success, String provider, String status,
                                             String userSafeMessage, LocalDateTime updatedAt) {}
    public record SocialUnlinkRequest(String provider, boolean userAcknowledgedFinalMethodRule) {}
    public record SocialUnlinkResponse(boolean success, String provider, String status,
                                       boolean finalLoginMethodBlocked, String userSafeMessage,
                                       LocalDateTime updatedAt) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword,
                                        boolean userAcknowledgedSignOutOtherSessions) {}
    public record AccountSessionPlaceholder(String sessionId, String deviceSummary,
                                            String approximateLocation, LocalDateTime lastActiveAt,
                                            boolean currentSession, String status) {}
    public record AccountSecurityActionEligibility(boolean linkGoogle, boolean unlinkGoogle,
                                                   boolean linkApple, boolean unlinkApple,
                                                   boolean changePassword, boolean resetPassword,
                                                   boolean viewActiveSessionsPlaceholder,
                                                   boolean logoutOtherSessionsPlaceholder,
                                                   boolean viewSecurityAlerts,
                                                   List<String> disabledReasons) {}

    public static SecurityDashboardResponse dashboard() {
        LocalDateTime now = LocalDateTime.now();
        return new SecurityDashboardResponse("ACTION_RECOMMENDED", 3, 3, 6, "Recovery phone missing",
                now.minusDays(38), now.minusHours(1), 2,
                List.of("CHANGE_PASSWORD", "ADD_GOOGLE_LOGIN", "ADD_APPLE_LOGIN", "SIGN_OUT_EVERYWHERE", "REPORT_SUSPICIOUS_ACTIVITY"));
    }
    public static List<LoginMethodItem> loginMethods() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                new LoginMethodItem("method-password", "PASSWORD", "Email and password", "ACTIVE", "alex@example.com", true, now.minusHours(2), true, null, List.of("CHANGE_PASSWORD")),
                new LoginMethodItem("method-google", "GOOGLE", "Google", "ACTIVE", "alex@gmail.com", false, now.minusHours(36), true, null, List.of("UNLINK_LOGIN_METHOD")),
                new LoginMethodItem("method-apple", "APPLE", "Apple", "ACTIVE", "a***@privaterelay.appleid.com", false, now.minusDays(5), true, null, List.of("UNLINK_LOGIN_METHOD")),
                new LoginMethodItem("method-passkey", "PASSKEY_LATER", "Passkeys", "COMING_LATER", null, false, null, false, "Coming later", List.of()));
    }
    public static List<DeviceSessionItem> devices() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                new DeviceSessionItem("device-current", "Chrome on Windows", "Chrome", "Windows", "Phoenix, AZ, USA", now.minusMinutes(12), true, "ACTIVE", true, List.of("SIGN_OUT_THIS_DEVICE")),
                new DeviceSessionItem("device-ios", "Sharity iOS app", "Sharity app", "iPhone", "Tempe, AZ, USA", now.minusHours(5), false, "ACTIVE", false, List.of("REVOKE_DEVICE")),
                new DeviceSessionItem("device-unknown", "Firefox on Linux", "Firefox", "Linux", "Denver, CO, USA", now.minusHours(18), false, "ACTIVE", false, List.of("REVOKE_DEVICE", "REPORT_SUSPICIOUS_ACTIVITY")));
    }
    public static List<SecurityAlertItem> alerts() {
        LocalDateTime now = LocalDateTime.now();
        return List.of(
                alert("alert-new-login", "NEW_LOGIN", "New login from a browser", "WARNING", now.minusHours(1), "Phoenix, AZ, USA", "Chrome on Windows"),
                alert("alert-password", "PASSWORD_CHANGED", "Password changed", "SUCCESS", now.minusDays(1), "Phoenix, AZ, USA", "Chrome on Windows"),
                alert("alert-reveal", "DIGITAL_CODE_REVEAL_NEW_DEVICE", "Digital code revealed from a new device", "CRITICAL", now.minusDays(3), "Denver, CO, USA", "Firefox on Linux"),
                alert("alert-failed", "FAILED_LOGIN_ATTEMPTS", "Failed login attempts detected", "WARNING", now.minusDays(4), "Approximate US region", "Unknown browser"));
    }
    public static List<SecurityEventHistoryItem> events() {
        return alerts().stream().map(item -> new SecurityEventHistoryItem(item.alertId().replace("alert", "event"), item.alertType(), item.title(), item.createdAt(), item.deviceSummary(), item.approximateLocation(), item.severity().equals("CRITICAL") ? "ACTION_REQUIRED" : "RECORDED", item.userSafeMessage(), item.relatedAction(), item.reportSuspiciousAvailable())).toList();
    }
    public static List<RecoveryOptionItem> recoveryOptions() {
        return List.of(
                new RecoveryOptionItem("RECOVERY_EMAIL", "Recovery email", "ACTIVE", true, LocalDateTime.now().minusDays(20), List.of("UPDATE")),
                new RecoveryOptionItem("RECOVERY_PHONE", "Recovery phone", "MISSING", false, null, List.of("ADD")),
                new RecoveryOptionItem("TRUSTED_DEVICE_LATER", "Trusted device", "COMING_LATER", false, null, List.of()));
    }
    public static List<AdminSecurityReviewQueueItem> adminQueue() {
        return List.of(new AdminSecurityReviewQueueItem("sec-review-001", "user-1042", "alex@example.com", "SUSPICIOUS_ACTIVITY", "CRITICAL", "PLACEHOLDER_QUEUE", LocalDateTime.now().minusHours(2), "Security review later", true));
    }
    public static SecurityDashboardBundle bundle() { return new SecurityDashboardBundle(dashboard(), loginMethods(), devices(), alerts(), events(), recoveryOptions(), adminQueue()); }
    public static AccountSecurityResponse account() {
        List<AccountSessionPlaceholder> sessions = devices().stream()
                .map(device -> new AccountSessionPlaceholder(device.deviceSessionId(), device.deviceName(),
                        device.approximateLocation(), device.lastActiveAt(), device.currentDevice(),
                        device.sessionStatus()))
                .toList();
        return new AccountSecurityResponse("user-1000", "alex@example.com", loginMethods(), sessions, alerts(),
                new AccountSecurityActionEligibility(true, true, true, true, true, true, true,
                        true, true, List.of()),
                "Passwords, OAuth tokens, provider payloads, refresh tokens, and secrets are never returned.",
                LocalDateTime.now());
    }
    public static SecurityActionResponse action(String status, String message) { return new SecurityActionResponse(true, status, message, LocalDateTime.now()); }
    public static ReauthenticationChallengeResponse reauth() { return new ReauthenticationChallengeResponse("reauth-001", true, List.of("PASSWORD", "GOOGLE", "APPLE"), LocalDateTime.now().plusMinutes(10), "Please verify your identity before continuing."); }
    public static SuspiciousActivityReportResponse suspiciousReport() { return new SuspiciousActivityReportResponse("suspicious-report-001", "SUBMITTED", "SUP-SEC-1001", true, List.of("CHANGE_PASSWORD", "SIGN_OUT_EVERYWHERE", "REVIEW_DEVICES"), "Suspicious activity report submitted."); }
    private static SecurityAlertItem alert(String id, String type, String title, String severity, LocalDateTime createdAt, String location, String device) {
        return new SecurityAlertItem(id, type, title, severity, createdAt, location, device, "Review account security", true, !"SUCCESS".equals(severity), "Approximate location only; raw IP, exact GPS, tokens, provider payloads, risk scores, and admin notes are hidden.");
    }
}

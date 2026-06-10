package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SecurityDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SecurityController {
    @GetMapping("/api/account/security")
    public SecurityDtos.AccountSecurityResponse accountSecurity() { return SecurityDtos.account(); }
    @GetMapping("/api/account/login-methods")
    public List<SecurityDtos.LoginMethodItem> accountLoginMethods() { return SecurityDtos.loginMethods(); }
    @PostMapping("/api/account/login-methods/google/link/start")
    public SecurityDtos.SocialLinkStartResponse googleLinkStart() { return new SecurityDtos.SocialLinkStartResponse("GOOGLE", "STARTED", "/oauth/google/link/mock", "Google linking requires authenticated session."); }
    @PostMapping("/api/account/login-methods/google/link/complete")
    public SecurityDtos.SocialLinkCompleteResponse googleLinkComplete(@RequestBody(required = false) SecurityDtos.SocialLinkCompleteRequest request) { return new SecurityDtos.SocialLinkCompleteResponse(true, "GOOGLE", "LINKED", "Google linked. Existing email conflicts require explicit account linking.", java.time.LocalDateTime.now()); }
    @PostMapping("/api/account/login-methods/apple/link/start")
    public SecurityDtos.SocialLinkStartResponse appleLinkStart() { return new SecurityDtos.SocialLinkStartResponse("APPLE", "STARTED", "/oauth/apple/link/mock", "Apple private relay email is supported."); }
    @PostMapping("/api/account/login-methods/apple/link/complete")
    public SecurityDtos.SocialLinkCompleteResponse appleLinkComplete(@RequestBody(required = false) SecurityDtos.SocialLinkCompleteRequest request) { return new SecurityDtos.SocialLinkCompleteResponse(true, "APPLE", "LINKED", "Apple linked. Display name is stored only on first login if available.", java.time.LocalDateTime.now()); }
    @PostMapping("/api/account/login-methods/{provider}/unlink")
    public SecurityDtos.SocialUnlinkResponse accountUnlink(@PathVariable String provider, @RequestBody(required = false) SecurityDtos.SocialUnlinkRequest request) { return new SecurityDtos.SocialUnlinkResponse(true, provider, "UNLINK_READY", false, "Unlink allowed only when another login method remains.", java.time.LocalDateTime.now()); }
    @PostMapping("/api/account/password/change")
    public SecurityDtos.SecurityActionResponse accountPasswordChange(@RequestBody(required = false) SecurityDtos.ChangePasswordRequest request) { return SecurityDtos.action("PASSWORD_CHANGE_REAUTH_REQUIRED", "Password change requires re-authentication; password is not logged."); }
    @PostMapping("/api/account/password/reset-request")
    public SecurityDtos.SecurityActionResponse accountPasswordReset() { return SecurityDtos.action("PASSWORD_RESET_REQUESTED", "Password reset request placeholder sent."); }
    @GetMapping("/api/account/sessions")
    public List<SecurityDtos.AccountSessionPlaceholder> accountSessions() { return SecurityDtos.account().sessions(); }
    @GetMapping("/api/account/security-alerts")
    public List<SecurityDtos.SecurityAlertItem> accountSecurityAlerts() { return SecurityDtos.alerts(); }
    @GetMapping("/api/security/dashboard")
    public SecurityDtos.SecurityDashboardResponse dashboard() { return SecurityDtos.dashboard(); }
    @GetMapping("/api/security/login-methods")
    public List<SecurityDtos.LoginMethodItem> loginMethods() { return SecurityDtos.loginMethods(); }
    @PostMapping("/api/security/login-methods/google/link")
    public SecurityDtos.SecurityActionResponse googleLink() { return SecurityDtos.action("REAUTH_REQUIRED", "Google login linking started after authenticated session."); }
    @PostMapping("/api/security/login-methods/apple/link")
    public SecurityDtos.SecurityActionResponse appleLink() { return SecurityDtos.action("REAUTH_REQUIRED", "Apple login linking started after authenticated session."); }
    @PostMapping("/api/security/login-methods/password/add")
    public SecurityDtos.SecurityActionResponse addPassword() { return SecurityDtos.action("REAUTH_REQUIRED", "Password setup requires verified email and secure flow."); }
    @PostMapping("/api/security/password/change")
    public SecurityDtos.SecurityActionResponse changePassword() { return SecurityDtos.action("REAUTH_REQUIRED", "Password change requires re-authentication."); }
    @PostMapping("/api/security/login-methods/{methodId}/unlink")
    public SecurityDtos.SecurityActionResponse unlink(@PathVariable String methodId) { return SecurityDtos.action("UNLINK_READY", "Login method unlink mock allowed only when another method remains: " + methodId); }
    @GetMapping("/api/security/devices")
    public List<SecurityDtos.DeviceSessionItem> devices() { return SecurityDtos.devices(); }
    @PostMapping("/api/security/devices/{deviceSessionId}/revoke")
    public SecurityDtos.SecurityActionResponse revoke(@PathVariable String deviceSessionId) { return SecurityDtos.action("DEVICE_REVOKED", "Device/session revoke requested: " + deviceSessionId); }
    @PostMapping("/api/security/devices/sign-out-others")
    public SecurityDtos.SecurityActionResponse signOutOthers() { return SecurityDtos.action("SIGN_OUT_OTHERS", "All other sessions will be signed out."); }
    @PostMapping("/api/security/devices/sign-out-everywhere")
    public SecurityDtos.SecurityActionResponse signOutEverywhere() { return SecurityDtos.action("REAUTH_REQUIRED", "Sign out everywhere requires strong confirmation."); }
    @GetMapping("/api/security/alerts")
    public List<SecurityDtos.SecurityAlertItem> alerts() { return SecurityDtos.alerts(); }
    @GetMapping("/api/security/events")
    public List<SecurityDtos.SecurityEventHistoryItem> events() { return SecurityDtos.events(); }
    @PostMapping("/api/security/reauth/start")
    public SecurityDtos.ReauthenticationChallengeResponse reauthStart(@RequestBody(required = false) SecurityDtos.ReauthenticationChallengeRequest request) { return SecurityDtos.reauth(); }
    @PostMapping("/api/security/reauth/confirm")
    public SecurityDtos.SecurityActionResponse reauthConfirm() { return SecurityDtos.action("REAUTH_CONFIRMED", "Identity verified for short-lived security action."); }
    @GetMapping("/api/security/recovery-options")
    public List<SecurityDtos.RecoveryOptionItem> recoveryOptions() { return SecurityDtos.recoveryOptions(); }
    @PostMapping("/api/security/recovery/email")
    public SecurityDtos.SecurityActionResponse recoveryEmail() { return SecurityDtos.action("RECOVERY_EMAIL_UPDATED", "Recovery email update requires verification."); }
    @PostMapping("/api/security/recovery/phone")
    public SecurityDtos.SecurityActionResponse recoveryPhone() { return SecurityDtos.action("RECOVERY_PHONE_UPDATED", "Recovery phone update requires verification."); }
    @PostMapping("/api/security/suspicious-activity/report")
    public SecurityDtos.SuspiciousActivityReportResponse suspicious(@RequestBody(required = false) SecurityDtos.SuspiciousActivityReportRequest request) { return SecurityDtos.suspiciousReport(); }
    @GetMapping("/api/admin/security/review")
    public List<SecurityDtos.AdminSecurityReviewQueueItem> adminReview() { return SecurityDtos.adminQueue(); }
    @GetMapping("/api/admin/security/users/{userId}")
    public SecurityDtos.SecurityDashboardBundle adminUser(@PathVariable String userId) { return SecurityDtos.bundle(); }
    @PostMapping("/api/admin/security/users/{userId}/review-note")
    public SecurityDtos.SecurityActionResponse reviewNote(@PathVariable String userId) { return SecurityDtos.action("PLACEHOLDER_NOTE_ADDED", "Admin security review note placeholder for " + userId); }
}

package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.entity.AppUser;

public interface EmailService {
    void sendEmailVerificationEmail(AppUser user, String verificationToken);

    void sendPasswordResetEmail(AppUser user, String resetToken);

    void sendPasswordChangedNotification(AppUser user);

    void sendNewLoginNotification(AppUser user, String ipAddress, String userAgent);

    void sendSuperAdminSecurityAlert(AppUser targetUser, AppUser actorUser);
}

package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.EmailDeliveryLog;
import com.java.vinod.authorization.server.repository.EmailDeliveryLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SmtpEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);
    private static final String PROVIDER = "SMTP";

    private final JavaMailSender mailSender;
    private final EmailDeliveryLogRepository emailDeliveryLogRepository;
    private final boolean deliveryEnabled;
    private final int maxAttempts;
    private final String from;
    private final String fromName;
    private final String frontendBaseUrl;
    private final String verificationPath;
    private final String passwordResetPath;

    public SmtpEmailService(JavaMailSender mailSender,
                            EmailDeliveryLogRepository emailDeliveryLogRepository,
                            @Value("${app.email.delivery-enabled:false}") boolean deliveryEnabled,
                            @Value("${app.email.max-attempts:3}") int maxAttempts,
                            @Value("${app.email.from}") String from,
                            @Value("${app.email.from-name}") String fromName,
                            @Value("${app.email.frontend-base-url}") String frontendBaseUrl,
                            @Value("${app.email.verification-path}") String verificationPath,
                            @Value("${app.email.password-reset-path}") String passwordResetPath) {
        this.mailSender = mailSender;
        this.emailDeliveryLogRepository = emailDeliveryLogRepository;
        this.deliveryEnabled = deliveryEnabled;
        this.maxAttempts = Math.max(1, Math.min(maxAttempts, 3));
        this.from = from;
        this.fromName = fromName;
        this.frontendBaseUrl = frontendBaseUrl;
        this.verificationPath = verificationPath;
        this.passwordResetPath = passwordResetPath;
    }

    @Override
    public void sendEmailVerificationEmail(AppUser user, String verificationToken) {
        String link = tokenLink(verificationPath, verificationToken);
        send(
                "EMAIL_VERIFICATION",
                user,
                user.getEmail(),
                "Verify your email address",
                """
                Hello,

                Please verify your email address using this link:
                %s

                This verification link expires in 24 hours.

                If you did not create this account, you can ignore this email.
                """.formatted(link)
        );
    }

    @Override
    public void sendPasswordResetEmail(AppUser user, String resetToken) {
        String link = tokenLink(passwordResetPath, resetToken);
        send(
                "PASSWORD_RESET",
                user,
                user.getEmail(),
                "Reset your password",
                """
                Hello,

                We received a request to reset your password. Use this link:
                %s

                This password reset link expires in 1 hour.

                If you did not request this, you can ignore this email.
                """.formatted(link)
        );
    }

    @Override
    public void sendPasswordChangedNotification(AppUser user) {
        send(
                "PASSWORD_CHANGED",
                user,
                user.getEmail(),
                "Your password was changed",
                """
                Hello,

                Your password was changed successfully.

                If you did not make this change, reset your password immediately and contact support.
                """
        );
    }

    @Override
    public void sendNewLoginNotification(AppUser user, String ipAddress, String userAgent) {
        send(
                "NEW_LOGIN",
                user,
                user.getEmail(),
                "New login to your account",
                """
                Hello,

                We detected a new login to your account.

                IP address: %s
                Device: %s

                If this was you, no action is needed. If this was not you, change your password immediately.
                """.formatted(emptyFallback(ipAddress), emptyFallback(userAgent))
        );
    }

    @Override
    public void sendSuperAdminSecurityAlert(AppUser targetUser, AppUser actorUser) {
        send(
                "SUPER_ADMIN_SECURITY_ALERT",
                targetUser,
                targetUser.getEmail(),
                "Super admin access was assigned",
                """
                Hello,

                SUPER_ADMIN access was assigned to your account.

                Assigned by: %s

                If this was unexpected, contact security support immediately.
                """.formatted(actorUser == null ? "system" : actorUser.getEmail())
        );
    }

    private void send(String type, AppUser user, String to, String subject, String body) {
        String messageGroupId = UUID.randomUUID().toString();
        if (!deliveryEnabled) {
            saveLog(messageGroupId, user, type, to, subject, "SKIPPED", 0, null);
            log.info("Email delivery disabled. type={}, recipient={}", type, to);
            return;
        }

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                mailSender.send(message(to, subject, body));
                saveLog(messageGroupId, user, type, to, subject, "SENT", attempt, null);
                log.info("Email sent. type={}, recipient={}, attempt={}", type, to, attempt);
                return;
            } catch (RuntimeException exception) {
                saveLog(messageGroupId, user, type, to, subject, "FAILED", attempt, exception);
                log.warn("Email send failed. type={}, recipient={}, attempt={}/{}", type, to, attempt, maxAttempts);
            }
        }
        log.error("Email delivery failed after max attempts. type={}, recipient={}, maxAttempts={}", type, to, maxAttempts);
    }

    private SimpleMailMessage message(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(formatFrom());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        return message;
    }

    private void saveLog(String messageGroupId,
                         AppUser user,
                         String type,
                         String to,
                         String subject,
                         String status,
                         int attemptNumber,
                         RuntimeException exception) {
        EmailDeliveryLog deliveryLog = new EmailDeliveryLog();
        deliveryLog.setMessageGroupId(messageGroupId);
        deliveryLog.setUser(user);
        deliveryLog.setEmailType(type);
        deliveryLog.setRecipientEmail(to);
        deliveryLog.setSubject(subject);
        deliveryLog.setProvider(PROVIDER);
        deliveryLog.setStatus(status);
        deliveryLog.setAttemptNumber(attemptNumber);
        deliveryLog.setMaxAttempts(maxAttempts);
        deliveryLog.setErrorMessage(exception == null ? null : truncate(exception.getClass().getSimpleName() + ": " + exception.getMessage(), 1000));
        deliveryLog.setCreatedAt(LocalDateTime.now());
        emailDeliveryLogRepository.save(deliveryLog);
    }

    private String tokenLink(String path, String token) {
        return UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path(path)
                .queryParam("token", token)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();
    }

    private String formatFrom() {
        if (fromName == null || fromName.isBlank()) {
            return from;
        }
        return fromName + " <" + from + ">";
    }

    private String emptyFallback(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}

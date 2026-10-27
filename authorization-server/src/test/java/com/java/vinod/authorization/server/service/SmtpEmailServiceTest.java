package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.EmailDeliveryLog;
import com.java.vinod.authorization.server.repository.EmailDeliveryLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SmtpEmailServiceTest {
    @Mock
    private JavaMailSender mailSender;
    @Mock
    private EmailDeliveryLogRepository emailDeliveryLogRepository;

    @Test
    void sendEmailVerificationEmailDoesNotSendWhenDeliveryDisabled() {
        SmtpEmailService service = service(false);

        service.sendEmailVerificationEmail(user("user@example.com"), "secret-token");

        verify(mailSender, never()).send(org.mockito.ArgumentMatchers.any(SimpleMailMessage.class));
        EmailDeliveryLog log = captureLog();
        assertThat(log.getStatus()).isEqualTo("SKIPPED");
        assertThat(log.getAttemptNumber()).isZero();
        assertThat(log.getMaxAttempts()).isEqualTo(3);
        assertThat(log.getEmailType()).isEqualTo("EMAIL_VERIFICATION");
        assertThat(log.getRecipientEmail()).isEqualTo("user@example.com");
        assertThat(log.getErrorMessage()).isNull();
    }

    @Test
    void sendEmailVerificationEmailSendsVerificationLinkWhenDeliveryEnabled() {
        SmtpEmailService service = service(true);

        service.sendEmailVerificationEmail(user("user@example.com"), "verification-token");

        SimpleMailMessage message = captureMessage();
        assertThat(message.getTo()).containsExactly("user@example.com");
        assertThat(message.getFrom()).isEqualTo("Identity Server <no-reply@example.com>");
        assertThat(message.getSubject()).isEqualTo("Verify your email address");
        assertThat(message.getText()).contains("http://localhost:3000/verify-email?token=verification-token");
        EmailDeliveryLog log = captureLog();
        assertThat(log.getStatus()).isEqualTo("SENT");
        assertThat(log.getAttemptNumber()).isEqualTo(1);
        assertThat(log.getEmailType()).isEqualTo("EMAIL_VERIFICATION");
    }

    @Test
    void sendPasswordResetEmailSendsResetLinkWhenDeliveryEnabled() {
        SmtpEmailService service = service(true);

        service.sendPasswordResetEmail(user("user@example.com"), "reset-token");

        SimpleMailMessage message = captureMessage();
        assertThat(message.getTo()).containsExactly("user@example.com");
        assertThat(message.getSubject()).isEqualTo("Reset your password");
        assertThat(message.getText()).contains("http://localhost:3000/reset-password?token=reset-token");
        assertThat(captureLog().getStatus()).isEqualTo("SENT");
    }

    @Test
    void sendSuperAdminSecurityAlertSendsActorEmail() {
        SmtpEmailService service = service(true);

        service.sendSuperAdminSecurityAlert(user("target@example.com"), user("actor@example.com"));

        SimpleMailMessage message = captureMessage();
        assertThat(message.getTo()).containsExactly("target@example.com");
        assertThat(message.getSubject()).isEqualTo("Super admin access was assigned");
        assertThat(message.getText()).contains("Assigned by: actor@example.com");
        assertThat(captureLog().getStatus()).isEqualTo("SENT");
    }

    @Test
    void sendEmailRetriesUpToThreeTimesAndLogsEveryFailure() {
        SmtpEmailService service = service(true);
        doThrow(new RuntimeException("smtp down"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        service.sendPasswordChangedNotification(user("user@example.com"));

        verify(mailSender, times(3)).send(any(SimpleMailMessage.class));
        ArgumentCaptor<EmailDeliveryLog> captor = ArgumentCaptor.forClass(EmailDeliveryLog.class);
        verify(emailDeliveryLogRepository, times(3)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(EmailDeliveryLog::getStatus)
                .containsExactly("FAILED", "FAILED", "FAILED");
        assertThat(captor.getAllValues())
                .extracting(EmailDeliveryLog::getAttemptNumber)
                .containsExactly(1, 2, 3);
        assertThat(captor.getAllValues().getFirst().getErrorMessage()).contains("smtp down");
    }

    private SmtpEmailService service(boolean deliveryEnabled) {
        return new SmtpEmailService(
                mailSender,
                emailDeliveryLogRepository,
                deliveryEnabled,
                3,
                "no-reply@example.com",
                "Identity Server",
                "http://localhost:3000",
                "/verify-email",
                "/reset-password"
        );
    }

    private SimpleMailMessage captureMessage() {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        return captor.getValue();
    }

    private EmailDeliveryLog captureLog() {
        ArgumentCaptor<EmailDeliveryLog> captor = ArgumentCaptor.forClass(EmailDeliveryLog.class);
        verify(emailDeliveryLogRepository).save(captor.capture());
        return captor.getValue();
    }

    private AppUser user(String email) {
        AppUser user = new AppUser();
        user.setEmail(email);
        return user;
    }
}

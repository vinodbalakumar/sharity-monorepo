package com.java.vinod.payment.service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email service for sending notifications.
 *
 * Supports:
 * - SMTP via Spring Mail (requires configuration)
 * - Mock mode for development
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.from:notifications@sharity.com}")
    private String fromAddress;

    @Value("${mail.enabled:false}")
    private boolean mailEnabled;

    /**
     * Send HTML email.
     */
    public void sendEmail(String to, String subject, String htmlContent) throws MessagingException {
        if (!mailEnabled) {
            log.warn("Email disabled in configuration. Would send to: {}, subject: {}", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            log.info("Email sent successfully to: {}, subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            throw e;
        }
    }

    /**
     * Send plain text email.
     */
    public void sendSimpleEmail(String to, String subject, String textContent) {
        if (!mailEnabled) {
            log.warn("Email disabled in configuration. Would send to: {}, subject: {}", to, subject);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(textContent);

            mailSender.send(message);
            log.info("Email sent successfully to: {}, subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
        }
    }

    /**
     * Send batch emails (for notifications to multiple recipients).
     */
    public void sendBatchEmails(String[] recipients, String subject, String htmlContent) {
        for (String recipient : recipients) {
            try {
                sendEmail(recipient, subject, htmlContent);
            } catch (MessagingException e) {
                log.error("Failed to send batch email to: {}", recipient, e);
                // Continue sending to other recipients
            }
        }
    }
}

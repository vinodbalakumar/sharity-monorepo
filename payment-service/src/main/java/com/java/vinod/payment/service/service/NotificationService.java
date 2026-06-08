package com.java.vinod.payment.service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Notification service for sending customer updates.
 *
 * Supports:
 * - Email notifications
 * - SMS notifications (future)
 * - Push notifications (future)
 *
 * All notifications are async to avoid blocking payment requests.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final EmailService emailService;

    public enum NotificationType {
        PAYMENT_AUTHORIZED("payment.authorized", "Payment Authorization Successful"),
        PAYMENT_COMPLETED("payment.completed", "Payment Completed"),
        PAYMENT_FAILED("payment.failed", "Payment Failed"),
        REFUND_INITIATED("refund.initiated", "Refund Initiated"),
        REFUND_COMPLETED("refund.completed", "Refund Completed"),
        DISPUTE_OPENED("dispute.opened", "Dispute Opened"),
        DISPUTE_RESOLVED("dispute.resolved", "Dispute Resolved");

        public final String code;
        public final String subject;

        NotificationType(String code, String subject) {
            this.code = code;
            this.subject = subject;
        }
    }

    /**
     * Send async notification to customer.
     * Returns immediately; actual sending happens in background.
     */
    @Async
    public void notifyCustomer(String customerId, String email, NotificationType type, Map<String, String> data) {
        try {
            log.info("Sending notification to customer {}: {}", customerId, type);

            String template = getEmailTemplate(type, data);
            emailService.sendEmail(email, type.subject, template);

            log.info("Notification sent successfully to {}", email);
        } catch (Exception e) {
            log.error("Failed to send notification to customer {}", customerId, e);
            // Log for retry queue (would use outbox pattern in production)
        }
    }

    /**
     * Send order confirmation notification
     */
    public void sendOrderConfirmation(String customerId, String email, String orderId, String amount) {
        Map<String, String> data = new HashMap<>();
        data.put("customerId", customerId);
        data.put("orderId", orderId);
        data.put("amount", amount);
        notifyCustomer(customerId, email, NotificationType.PAYMENT_COMPLETED, data);
    }

    /**
     * Send payment authorized notification
     */
    public void sendPaymentAuthorized(String customerId, String email, String orderId) {
        Map<String, String> data = new HashMap<>();
        data.put("customerId", customerId);
        data.put("orderId", orderId);
        notifyCustomer(customerId, email, NotificationType.PAYMENT_AUTHORIZED, data);
    }

    /**
     * Send payment failed notification
     */
    public void sendPaymentFailed(String customerId, String email, String orderId, String reason) {
        Map<String, String> data = new HashMap<>();
        data.put("customerId", customerId);
        data.put("orderId", orderId);
        data.put("reason", reason);
        notifyCustomer(customerId, email, NotificationType.PAYMENT_FAILED, data);
    }

    /**
     * Send refund notification
     */
    public void sendRefundNotification(String customerId, String email, String orderId, String amount) {
        Map<String, String> data = new HashMap<>();
        data.put("customerId", customerId);
        data.put("orderId", orderId);
        data.put("amount", amount);
        notifyCustomer(customerId, email, NotificationType.REFUND_COMPLETED, data);
    }

    /**
     * Send dispute notification
     */
    public void sendDisputeNotification(String customerId, String email, String disputeId) {
        Map<String, String> data = new HashMap<>();
        data.put("customerId", customerId);
        data.put("disputeId", disputeId);
        notifyCustomer(customerId, email, NotificationType.DISPUTE_OPENED, data);
    }

    private String getEmailTemplate(NotificationType type, Map<String, String> data) {
        return switch (type) {
            case PAYMENT_COMPLETED -> buildOrderConfirmationTemplate(data);
            case PAYMENT_AUTHORIZED -> buildAuthorizationTemplate(data);
            case PAYMENT_FAILED -> buildPaymentFailedTemplate(data);
            case REFUND_COMPLETED -> buildRefundTemplate(data);
            case DISPUTE_OPENED -> buildDisputeTemplate(data);
            default -> buildDefaultTemplate(type, data);
        };
    }

    private String buildOrderConfirmationTemplate(Map<String, String> data) {
        return """
            <h2>Payment Confirmed</h2>
            <p>Your payment has been successfully processed.</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Amount:</strong> {amount}</p>
            <p>Thank you for your purchase!</p>
            <p>Best regards,<br/>Sharity Team</p>
            """.replace("{orderId}", data.get("orderId"))
             .replace("{amount}", data.get("amount"));
    }

    private String buildAuthorizationTemplate(Map<String, String> data) {
        return """
            <h2>Payment Authorized</h2>
            <p>Your payment has been authorized and is being processed.</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p>You will receive a final confirmation shortly.</p>
            """.replace("{orderId}", data.get("orderId"));
    }

    private String buildPaymentFailedTemplate(Map<String, String> data) {
        return """
            <h2>Payment Failed</h2>
            <p>Your payment could not be processed.</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p>Please try again or contact support.</p>
            """.replace("{orderId}", data.get("orderId"))
             .replace("{reason}", data.get("reason"));
    }

    private String buildRefundTemplate(Map<String, String> data) {
        return """
            <h2>Refund Processed</h2>
            <p>Your refund has been successfully processed.</p>
            <p><strong>Order ID:</strong> {orderId}</p>
            <p><strong>Amount:</strong> {amount}</p>
            <p>The funds should appear in your account within 3-5 business days.</p>
            """.replace("{orderId}", data.get("orderId"))
             .replace("{amount}", data.get("amount"));
    }

    private String buildDisputeTemplate(Map<String, String> data) {
        return """
            <h2>Dispute Opened</h2>
            <p>A dispute has been opened on your account.</p>
            <p><strong>Dispute ID:</strong> {disputeId}</p>
            <p>Please log in to your account to provide evidence and track the resolution.</p>
            """.replace("{disputeId}", data.get("disputeId"));
    }

    private String buildDefaultTemplate(NotificationType type, Map<String, String> data) {
        return "<h2>" + type.subject + "</h2><p>Your notification has been received.</p>";
    }
}

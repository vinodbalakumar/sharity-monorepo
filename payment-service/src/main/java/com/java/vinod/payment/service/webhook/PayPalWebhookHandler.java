package com.java.vinod.payment.service.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.payment.service.config.PayPalConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Webhook handler for PayPal webhook events.
 * Verifies webhook authenticity and processes payment events.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PayPalWebhookHandler {
    private final PayPalConfig config;
    private final ObjectMapper objectMapper;

    /**
     * Webhook event types from PayPal
     */
    public enum EventType {
        CHECKOUT_ORDER_APPROVED("checkout.order.approved"),
        CHECKOUT_ORDER_COMPLETED("checkout.order.completed"),
        PAYMENT_CAPTURE_COMPLETED("payment.capture.completed"),
        PAYMENT_CAPTURE_DENIED("payment.capture.denied"),
        PAYMENT_CAPTURE_REFUNDED("payment.capture.refunded"),
        PAYMENT_CAPTURE_PENDING("payment.capture.pending");

        public final String code;

        EventType(String code) {
            this.code = code;
        }

        public static EventType fromCode(String code) {
            for (EventType type : EventType.values()) {
                if (type.code.equals(code)) {
                    return type;
                }
            }
            return null;
        }
    }

    /**
     * Verifies webhook authenticity using HMAC-SHA256.
     * PayPal sends: transmission_id, transmission_time, cert_url, auth_algo, transmission_sig
     */
    public boolean verifyWebhookSignature(String transmissionId, String transmissionTime,
                                         String certUrl, String authAlgo,
                                         String transmissionSig, String webhookBody) {
        try {
            // Reconstruct the signed content
            String signedContent = transmissionId + "|" + transmissionTime + "|" + certUrl + "|" +
                                 Base64.getEncoder().encodeToString(webhookBody.getBytes());

            // PayPal webhook signing key should be configured in environment
            String webhookSigningKey = System.getenv("PAYPAL_WEBHOOK_ID");
            if (webhookSigningKey == null || webhookSigningKey.isBlank()) {
                log.warn("PayPal webhook signing key not configured");
                return false;
            }

            // Compute HMAC
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(webhookSigningKey.getBytes(), "HmacSHA256");
            mac.init(keySpec);
            byte[] hmac = mac.doFinal(signedContent.getBytes());
            String computedSignature = Base64.getEncoder().encodeToString(hmac);

            boolean verified = computedSignature.equals(transmissionSig);
            if (!verified) {
                log.warn("PayPal webhook signature verification failed");
            }
            return verified;
        } catch (Exception e) {
            log.error("Error verifying PayPal webhook signature", e);
            return false;
        }
    }

    /**
     * Parse webhook event and extract relevant data
     */
    public PayPalWebhookEvent parseWebhookEvent(String webhookBody) throws Exception {
        JsonNode json = objectMapper.readTree(webhookBody);

        String eventType = json.get("event_type").asText();
        String eventId = json.get("id").asText();
        long eventTime = json.get("create_time").asLong();
        JsonNode resource = json.get("resource");

        PayPalWebhookEvent event = new PayPalWebhookEvent();
        event.setEventType(EventType.fromCode(eventType));
        event.setEventId(eventId);
        event.setEventTime(eventTime);

        if (resource != null) {
            event.setStatus(resource.get("status").asText());
            event.setOrderId(resource.get("id").asText());

            // Extract payment details based on event type
            if (eventType.contains("payment.capture")) {
                event.setAmount(resource.get("amount").get("value").asText());
                event.setCurrencyCode(resource.get("amount").get("currency_code").asText());
                event.setCustomId(resource.get("custom_id").asText());
            }
        }

        return event;
    }

    /**
     * Webhook event DTO
     */
    public static class PayPalWebhookEvent {
        private EventType eventType;
        private String eventId;
        private long eventTime;
        private String orderId;
        private String status;
        private String amount;
        private String currencyCode;
        private String customId;

        // Getters and setters
        public EventType getEventType() { return eventType; }
        public void setEventType(EventType eventType) { this.eventType = eventType; }

        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }

        public long getEventTime() { return eventTime; }
        public void setEventTime(long eventTime) { this.eventTime = eventTime; }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getAmount() { return amount; }
        public void setAmount(String amount) { this.amount = amount; }

        public String getCurrencyCode() { return currencyCode; }
        public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }

        public String getCustomId() { return customId; }
        public void setCustomId(String customId) { this.customId = customId; }
    }
}

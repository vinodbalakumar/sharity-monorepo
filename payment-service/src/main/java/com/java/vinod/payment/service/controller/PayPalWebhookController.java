package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.webhook.PayPalWebhookHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static org.springframework.http.HttpStatus.OK;

/**
 * Webhook endpoint for PayPal payment events.
 * PayPal sends POST requests to this endpoint when payment events occur.
 */
@RestController
@RequestMapping("/api/v1/payments/webhooks")
@RequiredArgsConstructor
@Slf4j
public class PayPalWebhookController {
    private final PayPalWebhookHandler webhookHandler;

    /**
     * Receives PayPal webhook events.
     *
     * PayPal includes these headers:
     * - PayPal-Transmission-Id: Unique ID for this transmission
     * - PayPal-Transmission-Time: ISO 8601 format timestamp
     * - PayPal-Cert-Url: URL to PayPal's certificate
     * - PayPal-Auth-Algo: Algorithm used (SHA256withRSA)
     * - PayPal-Transmission-Sig: HMAC-SHA256 signature
     */
    @PostMapping("/paypal")
    public ResponseEntity<String> handlePayPalWebhook(
        @RequestBody String webhookBody,
        @RequestHeader(value = "PayPal-Transmission-Id") String transmissionId,
        @RequestHeader(value = "PayPal-Transmission-Time") String transmissionTime,
        @RequestHeader(value = "PayPal-Cert-Url") String certUrl,
        @RequestHeader(value = "PayPal-Auth-Algo") String authAlgo,
        @RequestHeader(value = "PayPal-Transmission-Sig") String transmissionSig) {

        try {
            log.info("Received PayPal webhook event: {}", transmissionId);

            // Step 1: Verify webhook authenticity
            boolean verified = webhookHandler.verifyWebhookSignature(
                transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig, webhookBody);

            if (!verified) {
                log.warn("PayPal webhook signature verification failed for transmission: {}", transmissionId);
                // Still return 200 to prevent PayPal retries, but don't process
                return ResponseEntity.ok().body("{\"status\": \"verification_failed\"}");
            }

            // Step 2: Parse webhook event
            PayPalWebhookHandler.PayPalWebhookEvent event = webhookHandler.parseWebhookEvent(webhookBody);
            log.info("Parsed PayPal webhook event: type={}, eventId={}, orderId={}, status={}",
                event.getEventType(), event.getEventId(), event.getOrderId(), event.getStatus());

            // Step 3: Handle specific event types
            handleWebhookEvent(event);

            // Step 4: Return 200 OK to acknowledge receipt
            return ResponseEntity.ok().body("{\"status\": \"received\"}");
        } catch (Exception e) {
            log.error("Error processing PayPal webhook", e);
            // Still return 200 to prevent PayPal retries
            return ResponseEntity.ok().body("{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    private void handleWebhookEvent(PayPalWebhookHandler.PayPalWebhookEvent event) {
        switch (event.getEventType()) {
            case CHECKOUT_ORDER_COMPLETED:
                log.info("Order completed: {} with status: {}", event.getOrderId(), event.getStatus());
                // Update payment order status to COMPLETED
                break;

            case PAYMENT_CAPTURE_COMPLETED:
                log.info("Payment capture completed: {} for amount: {} {}",
                    event.getOrderId(), event.getAmount(), event.getCurrencyCode());
                // Update payment transaction status to CAPTURED
                // Trigger order creation event
                break;

            case PAYMENT_CAPTURE_DENIED:
                log.warn("Payment capture denied: {}", event.getOrderId());
                // Update payment transaction status to FAILED
                break;

            case PAYMENT_CAPTURE_REFUNDED:
                log.info("Payment refunded: {} for amount: {} {}",
                    event.getOrderId(), event.getAmount(), event.getCurrencyCode());
                // Update refund transaction status
                break;

            default:
                log.debug("Unhandled webhook event type: {}", event.getEventType());
        }
    }
}

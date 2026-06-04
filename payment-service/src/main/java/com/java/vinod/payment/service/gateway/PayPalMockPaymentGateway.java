package com.java.vinod.payment.service.gateway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Local PayPal-like gateway adapter used for demo routing and admin selection.
 *
 * <p>This adapter mirrors the capture, payout, and refund contract without
 * calling a real external provider, so country routing can be validated safely
 * before the future PayPal integration story is activated.</p>
 */
@Component("paypal-mock")
public class PayPalMockPaymentGateway implements PaymentGateway {

    /**
     * Returns a mock PayPal capture reference.
     */
    @Override
    public String capture(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "paypal-mock-capture-" + UUID.randomUUID();
    }

    /**
     * Returns a mock PayPal payout reference.
     */
    @Override
    public String releasePayout(String payoutPublicId, BigDecimal amount, String currencyCode) {
        return "paypal-mock-payout-" + UUID.randomUUID();
    }

    /**
     * Returns a mock PayPal refund reference.
     */
    @Override
    public String refund(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "paypal-mock-refund-" + UUID.randomUUID();
    }
}

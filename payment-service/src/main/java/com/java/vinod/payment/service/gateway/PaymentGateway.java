package com.java.vinod.payment.service.gateway;

import java.math.BigDecimal;

/**
 * Boundary for payment provider implementations used by payment-service.
 */
public interface PaymentGateway {

    /**
     * Captures a customer payment and returns the provider transaction reference.
     */
    String capture(String paymentOrderPublicId, BigDecimal amount, String currencyCode);

    /**
     * Requests provider payout release and returns the provider payout reference.
     */
    String releasePayout(String payoutPublicId, BigDecimal amount, String currencyCode);

    /**
     * Refunds a captured customer payment and returns the provider refund reference.
     */
    String refund(String paymentOrderPublicId, BigDecimal amount, String currencyCode);
}

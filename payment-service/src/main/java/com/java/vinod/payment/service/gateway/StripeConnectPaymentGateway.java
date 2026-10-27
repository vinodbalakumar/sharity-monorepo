package com.java.vinod.payment.service.gateway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Stripe-shaped mock adapter used by the country gateway router.
 *
 * <p>The adapter returns Stripe-like references without calling the real Stripe
 * API so payment routing can be exercised safely until real provider integration
 * is intentionally activated.</p>
 */
@Component("stripe-test")
public class StripeConnectPaymentGateway implements PaymentGateway {

    /**
     * Returns a Stripe-shaped capture reference.
     */
    @Override
    public String capture(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "stripe-test-capture-" + UUID.randomUUID();
    }

    /**
     * Returns a Stripe-shaped payout reference.
     */
    @Override
    public String releasePayout(String payoutPublicId, BigDecimal amount, String currencyCode) {
        return "stripe-test-payout-" + UUID.randomUUID();
    }

    /**
     * Returns a Stripe-shaped refund reference.
     */
    @Override
    public String refund(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "stripe-test-refund-" + UUID.randomUUID();
    }
}

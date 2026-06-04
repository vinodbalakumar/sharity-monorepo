package com.java.vinod.payment.service.gateway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Local/demo payment provider that always succeeds without moving real money.
 */
@Component("mock")
public class MockPaymentGateway implements PaymentGateway {

    /**
     * Returns a mock capture reference.
     */
    @Override
    public String capture(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "mock-capture-" + UUID.randomUUID();
    }

    /**
     * Returns a mock payout reference.
     */
    @Override
    public String releasePayout(String payoutPublicId, BigDecimal amount, String currencyCode) {
        return "mock-payout-" + UUID.randomUUID();
    }

    /**
     * Returns a mock refund reference.
     */
    @Override
    public String refund(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "mock-refund-" + UUID.randomUUID();
    }
}

package com.java.vinod.payment.service.gateway;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Local/demo payment provider that always succeeds without moving real money.
 */
@Component("mock")
public class SandboxPaymentGateway implements PaymentGateway {

    /**
     * Returns a sandbox capture reference.
     */
    @Override
    public String capture(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "sandbox-capture-" + UUID.randomUUID();
    }

    /**
     * Returns a sandbox payout reference.
     */
    @Override
    public String releasePayout(String payoutPublicId, BigDecimal amount, String currencyCode) {
        return "sandbox-payout-" + UUID.randomUUID();
    }

    /**
     * Returns a sandbox refund reference.
     */
    @Override
    public String refund(String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return "sandbox-refund-" + UUID.randomUUID();
    }
}

package com.java.vinod.payment.service.config;

import com.java.vinod.payment.service.gateway.PaymentGateway;
import com.java.vinod.payment.service.gateway.PayPalPaymentGateway;
import com.java.vinod.payment.service.gateway.PayPalMockPaymentGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class PaymentGatewayConfig {

    /**
     * Primary payment gateway bean selected based on configuration.
     * Use property: payment.gateway.provider=paypal-mock | paypal-real
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "payment.gateway.provider", havingValue = "paypal-real", matchIfMissing = false)
    public PaymentGateway realPayPalGateway(PayPalPaymentGateway paypalGateway) {
        log.info("Initializing REAL PayPal payment gateway");
        return paypalGateway;
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "payment.gateway.provider", havingValue = "paypal-mock")
    public PaymentGateway mockPayPalGateway(PayPalMockPaymentGateway mockGateway) {
        log.warn("Initializing MOCK PayPal payment gateway (for development only)");
        return mockGateway;
    }

    /**
     * Fallback to mock if no provider specified
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "payment.gateway.provider", matchIfMissing = true)
    public PaymentGateway defaultPaymentGateway(PayPalMockPaymentGateway mockGateway) {
        log.warn("No payment gateway provider specified, using MOCK (for development)");
        return mockGateway;
    }
}

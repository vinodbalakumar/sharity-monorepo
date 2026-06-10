package com.java.vinod.payment.service.config;

import com.java.vinod.payment.service.gateway.PaymentGateway;
import com.java.vinod.payment.service.gateway.PayPalPaymentGateway;
import com.java.vinod.payment.service.gateway.PayPalSandboxPaymentGateway;
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
    public PaymentGateway sandboxPayPalGateway(PayPalSandboxPaymentGateway sandboxGateway) {
        log.warn("Initializing SANDBOX PayPal payment gateway (for development only)");
        return sandboxGateway;
    }

    /**
     * Fallback to sandbox if no provider is specified.
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "payment.gateway.provider", matchIfMissing = true)
    public PaymentGateway defaultPaymentGateway(PayPalSandboxPaymentGateway sandboxGateway) {
        log.warn("No payment gateway provider specified, using SANDBOX (for development)");
        return sandboxGateway;
    }
}

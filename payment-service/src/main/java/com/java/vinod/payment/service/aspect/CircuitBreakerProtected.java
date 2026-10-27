package com.java.vinod.payment.service.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to apply circuit breaker protection to a method.
 *
 * Circuit breaker opens after 50% failure rate, preventing cascade failures.
 *
 * Usage:
 *   @CircuitBreakerProtected("paypal-circuit-breaker")
 *   public String capturePayment() { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CircuitBreakerProtected {
    /**
     * Name of the circuit breaker to apply.
     * Must match a registered CircuitBreaker bean.
     */
    String value();
}

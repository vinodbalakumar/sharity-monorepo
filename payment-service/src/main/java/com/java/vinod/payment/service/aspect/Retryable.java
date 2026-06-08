package com.java.vinod.payment.service.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to apply retry policy to a method.
 *
 * Usage:
 *   @Retryable("paypal-retry")
 *   public void capturePayment() { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Retryable {
    /**
     * Name of the retry policy to apply.
     * Must match a registered Retry bean.
     */
    String value();
}

package com.java.vinod.payment.service.gateway;

public class PayPalException extends Exception {
    public PayPalException(String message) {
        super(message);
    }

    public PayPalException(String message, Throwable cause) {
        super(message, cause);
    }
}

package com.java.vinod.marketplace.service.config;

import com.java.vinod.marketplace.service.service.MarketplaceCheckoutService.CheckoutPriceChangedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SafeFailureAdviceTest {
    private final SafeFailureAdvice advice = new SafeFailureAdvice();

    @Test
    void checkoutConflictPreservesActionableReasonAndCorrelationId() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("X-Correlation-ID", "checkout-correlation");
        var exception = new CheckoutPriceChangedException();

        var response = advice.status(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<?, ?>) response.getBody()).isEqualTo(Map.of(
                "code", "REQUEST_REJECTED",
                "message", exception.getReason(),
                "correlationId", "checkout-correlation"));
    }

    @Test
    void unrelatedConflictsDoNotExposeExceptionDetails() {
        var response = advice.status(new ResponseStatusException(HttpStatus.CONFLICT,
                "Sensitive database detail"), new MockHttpServletRequest());

        assertThat((Map<?, ?>) response.getBody()).isEqualTo(Map.of(
                "code", "REQUEST_REJECTED",
                "message", "Please check your request and try again.",
                "correlationId", "null"));
    }

    @Test
    void serverErrorsDoNotExposeExceptionDetails() {
        var response = advice.status(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Sensitive database detail"), new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat((Map<?, ?>) response.getBody()).isEqualTo(Map.of(
                "code", "SERVICE_UNAVAILABLE",
                "message", "This service is temporarily unavailable. Please try again shortly.",
                "correlationId", "null"));
    }
}

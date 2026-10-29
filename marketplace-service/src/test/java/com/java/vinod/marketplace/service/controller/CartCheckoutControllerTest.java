package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.CartCheckoutDtos;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CartCheckoutControllerTest {
    private final CartCheckoutController controller = new CartCheckoutController();

    @Test
    void doesNotReportMockMultiSellerCheckoutAsStarted() {
        assertCheckoutUnavailable(controller::checkoutAllEligible);
    }

    @Test
    void doesNotReportMockSellerGroupCheckoutAsStarted() {
        assertCheckoutUnavailable(() -> controller.checkoutSellerGroup("seller-123"));
    }

    @Test
    void doesNotCreateMockCheckoutSessions() {
        CartCheckoutDtos.CreateCheckoutSessionRequest request =
                new CartCheckoutDtos.CreateCheckoutSessionRequest("cart-123", true, null, true, true);

        assertCheckoutUnavailable(() -> controller.createCheckoutSession(request));
    }

    @Test
    void doesNotStartMockPaymentAuthorization() {
        assertCheckoutUnavailable(() -> controller.startPaymentAuthorization(null));
    }

    private void assertCheckoutUnavailable(Runnable checkoutAction) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, checkoutAction::run);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
        assertEquals("Consolidated multi-seller checkout is not enabled. No order or payment was created.",
                exception.getReason());
    }
}

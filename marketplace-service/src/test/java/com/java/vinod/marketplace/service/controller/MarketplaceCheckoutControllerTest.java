package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.MarketplaceCheckoutDtos;
import com.java.vinod.marketplace.service.service.MarketplaceCheckoutService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

class MarketplaceCheckoutControllerTest {
    @Test
    void attemptResolutionReturns200WithExplicitNullAndNoStoreAndPassesAuthenticatedBuyerAndKey() {
        MarketplaceCheckoutService service = mock(MarketplaceCheckoutService.class);
        MarketplaceCheckoutController controller = new MarketplaceCheckoutController(service);
        Jwt buyer = Jwt.withTokenValue("t").header("alg", "none").subject("buyer").build();
        var absence = new MarketplaceCheckoutDtos.CheckoutAttemptResponse(null);
        when(service.checkoutAttempt("cart-1", "checkout-key-1234567890", buyer)).thenReturn(absence);

        var response = controller.checkoutAttempt("cart-1", "checkout-key-1234567890", buyer);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getBody()).isSameAs(absence);
        verify(service).checkoutAttempt("cart-1", "checkout-key-1234567890", buyer);
        verifyNoMoreInteractions(service);
    }
}

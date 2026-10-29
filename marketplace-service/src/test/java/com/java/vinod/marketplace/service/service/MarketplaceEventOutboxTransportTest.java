package com.java.vinod.marketplace.service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.marketplace.service.repository.MarketplaceEventOutboxRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

class MarketplaceEventOutboxTransportTest {
    private static final String URL = "http://localhost:9095/payment-service/internal/api/v1/payments/orders";
    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

    @Test
    void missingTokenFailsBeforeSendingRequest() {
        assertThatThrownBy(() -> service(" ").post(URL, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("APP_INTERNAL_SERVICE_TOKEN")
                .satisfies(exception -> org.assertj.core.api.Assertions.assertThat(
                        ((ResponseStatusException) exception).getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        server.verify();
    }

    @Test
    void unauthorizedResponseExplainsTokenMismatchWithoutExposingResponseBody() {
        server.expect(requestTo(URL)).andExpect(header("X-Internal-Service-Token", "test-token"))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED).body("private-upstream-detail"));

        assertThatThrownBy(() -> service("test-token").post(URL, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("HTTP 401")
                .hasMessageContaining("APP_INTERNAL_SERVICE_TOKEN")
                .hasMessageNotContaining("private-upstream-detail");
        server.verify();
    }

    @Test
    void serverErrorReportsActualUpstreamStatus() {
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> service("test-token").post(URL, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("HTTP 500");
        server.verify();
    }

    @Test
    void connectionFailureExplainsAvailabilityConfiguration() {
        server.expect(requestTo(URL)).andRespond(withException(new IOException("Connection refused")));

        assertThatThrownBy(() -> service("test-token").post(URL, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("ResourceAccessException")
                .hasMessageContaining("PAYMENT_SERVICE_INTERNAL_URL");
        server.verify();
    }

    private MarketplaceEventOutboxService service(String token) {
        return new MarketplaceEventOutboxService(mock(MarketplaceEventOutboxRepository.class),
                new ObjectMapper(), mock(PlatformTransactionManager.class), URL, token, builder);
    }
}

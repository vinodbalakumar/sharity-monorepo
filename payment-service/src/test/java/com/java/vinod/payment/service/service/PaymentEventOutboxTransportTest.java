package com.java.vinod.payment.service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import com.java.vinod.payment.service.repository.PaymentEventOutboxRepository;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class PaymentEventOutboxTransportTest {
    @Test
    void walletClientUsesBoundedConnectAndReadTimeouts() {
        var service = new PaymentEventOutboxService(mock(PaymentEventOutboxRepository.class),
                new ObjectMapper(), mock(PlatformTransactionManager.class), "http://wallet", "private-internal-token");
        Object client = ReflectionTestUtils.getField(service, "restClient");
        Object factory = ReflectionTestUtils.getField(client, "clientRequestFactory");
        assertThat(factory).isInstanceOf(SimpleClientHttpRequestFactory.class);
        assertThat(ReflectionTestUtils.getField(factory, "connectTimeout")).isEqualTo(3000);
        assertThat(ReflectionTestUtils.getField(factory, "readTimeout")).isEqualTo(10000);
    }

    @ParameterizedTest
    @ValueSource(ints = {401, 403, 503})
    void responseFailuresRetain502AndLogSanitizedStatusAndRetryDetails(int status, CapturedOutput output)
            throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/wallet/events", exchange -> {
            byte[] body = "private-response-body-must-not-be-logged".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, body.length);
            try (var response = exchange.getResponseBody()) {
                response.write(body);
            } finally {
                exchange.close();
            }
        });
        server.start();
        try {
            var repository = mock(PaymentEventOutboxRepository.class);
            var manager = mock(PlatformTransactionManager.class);
            when(manager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));
            PaymentEventOutboxService service = new PaymentEventOutboxService(repository, new ObjectMapper(), manager,
                    "http://127.0.0.1:" + server.getAddress().getPort(), "private-internal-token");
            ResponseStatusException failure = catchThrowableOfType(ResponseStatusException.class,
                    () -> service.publishWalletEvent("payment-captured", payload()));
            assertThat(failure.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
            assertThat(failure.getReason()).contains("HTTP " + status).doesNotContain("private-response-body");
            if (status == 401 || status == 403) {
                assertThat(failure.getReason()).contains("internal service tokens");
            }

            var event = new PaymentEventOutbox();
            event.setId(1L);
            event.setEventId("transport-event");
            event.setEventType("payment-captured");
            event.setProcessingStatus("PENDING");
            event.setCreatedAt(LocalDateTime.now());
            event.setPayloadJson(new ObjectMapper().writeValueAsString(payload()));
            when(repository.findDueEvents(any(), any(), any())).thenReturn(List.of(event));
            when(repository.findForDispatchById(eq(1L))).thenReturn(Optional.of(event));
            service.dispatchPendingEvents();

            assertThat(output.getOut()).contains("eventId=transport-event", "attempt=1", "nextAttemptAt=",
                    "Wallet returned HTTP " + status)
                    .doesNotContain("private-response-body-must-not-be-logged", "private-internal-token");
            assertThat(event.getProcessingStatus()).isEqualTo("FAILED");
            assertThat(event.getNextAttemptAt()).isNotNull();
        } finally {
            server.stop(0);
        }
    }

    @Test
    void unreachableWalletIsReportedAsConnectivityFailureAndStillReturns502() throws Exception {
        HttpServer unused = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        int port = unused.getAddress().getPort();
        unused.start();
        unused.stop(0);
        var service = new PaymentEventOutboxService(mock(PaymentEventOutboxRepository.class),
                new ObjectMapper(), mock(PlatformTransactionManager.class),
                "http://127.0.0.1:" + port, "private-internal-token");
        ResponseStatusException failure = catchThrowableOfType(ResponseStatusException.class,
                () -> service.publishWalletEvent("payment-captured", payload()));
        assertThat(failure.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(failure.getReason()).contains("connectivity failure").doesNotContain("HTTP 401");
    }

    private PaymentEventOutboxService.WalletEventPayload payload() {
        return new PaymentEventOutboxService.WalletEventPayload("event", "payment", "order",
                "owner", "USD", BigDecimal.TEN);
    }
}

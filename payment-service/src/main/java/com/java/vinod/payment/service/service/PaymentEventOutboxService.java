package com.java.vinod.payment.service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.repository.PaymentEventOutboxRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Queues and dispatches payment events to wallet-service using the outbox pattern.
 *
 * <p>The payment service records wallet events durably first and then retries delivery
 * until the wallet projection acknowledges the event. This keeps payment capture,
 * payout, and refund updates safe even if wallet-service is briefly unavailable.</p>
 */
@Service
public class PaymentEventOutboxService {
    static final String STATUS_PENDING = "PENDING";
    static final String STATUS_PROCESSING = "PROCESSING";
    static final String STATUS_PROCESSED = "PROCESSED";
    static final String STATUS_FAILED = "FAILED";
    private static final Logger log = LoggerFactory.getLogger(PaymentEventOutboxService.class);
    private static final List<String> RETRYABLE_STATUSES = List.of(STATUS_PENDING, STATUS_FAILED);

    private final PaymentEventOutboxRepository paymentEventOutboxRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final RestClient restClient;
    private final String walletInternalUrl;
    private final String internalServiceToken;

    @Value("${app.outbox.retry-initial-delay-ms:5000}")
    private long retryInitialDelayMs = 5000;

    @Value("${app.outbox.retry-max-delay-ms:300000}")
    private long retryMaxDelayMs = 300000;

    /**
     * Builds the outbox service with durable storage and the internal wallet client.
     */
    public PaymentEventOutboxService(PaymentEventOutboxRepository paymentEventOutboxRepository,
                                      ObjectMapper objectMapper,
                                      PlatformTransactionManager transactionManager,
                                      @Value("${app.services.wallet-internal-url}") String walletInternalUrl,
                                      @Value("${app.internal.service-token}") String internalServiceToken) {
        this.paymentEventOutboxRepository = paymentEventOutboxRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(3));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
        this.walletInternalUrl = walletInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Queues a durable wallet event for scheduler-only delivery after commit.
     */
    public void queueWalletEvent(String eventType, PaymentOrder order, String ownerPublicId, BigDecimal amount) {
        String eventId = buildEventId(eventType, order.getPublicId());
        WalletEventPayload payload = new WalletEventPayload(eventId, order.getPublicId(),
                order.getMarketplaceOrderPublicId(), ownerPublicId, order.getCurrencyCode(), amount);
        upsertPendingEvent(eventId, eventType, order.getPublicId(), payload);
    }

    /**
     * Queues a wallet event for one consolidated checkout allocation.
     *
     * <p>The event is keyed by the allocation public id so each seller allocation is projected once,
     * while the payload still references the parent payment order and the child marketplace order.</p>
     */
    public void queueAllocationWalletEvent(String eventType, String allocationPublicId, PaymentOrder parentOrder,
                                           String marketplaceOrderPublicId, String ownerPublicId, BigDecimal amount) {
        String eventId = buildEventId(eventType, allocationPublicId);
        WalletEventPayload payload = new WalletEventPayload(eventId, parentOrder.getPublicId(),
                marketplaceOrderPublicId, ownerPublicId, parentOrder.getCurrencyCode(), amount);
        upsertPendingEvent(eventId, eventType, allocationPublicId, payload);
    }
    /**
     * Dispatches retryable payment outbox rows to wallet-service.
     *
     * <p>Only due rows are selected; each row is rechecked under a database lock.</p>
     */
    @Scheduled(fixedDelayString = "${app.outbox.dispatch-delay-ms:5000}")
    public void dispatchPendingEvents() {
        List<PaymentEventOutbox> events = paymentEventOutboxRepository
                .findDueEvents(RETRYABLE_STATUSES, LocalDateTime.now(), PageRequest.of(0, 20));
        for (PaymentEventOutbox event : events) {
            processEvent(event.getId());
        }
    }

    private void upsertPendingEvent(String eventId, String eventType, String aggregatePublicId, WalletEventPayload payload) {
        if (paymentEventOutboxRepository.findByEventId(eventId).isPresent()) {
            return;
        }
        PaymentEventOutbox event = new PaymentEventOutbox();
        event.setEventId(eventId);
        event.setEventType(eventType);
        event.setAggregatePublicId(aggregatePublicId);
        event.setPayloadJson(writePayload(payload));
        event.setProcessingStatus(STATUS_PENDING);
        event.setProcessedAt(null);
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(LocalDateTime.now());
        }
        paymentEventOutboxRepository.save(event);
        log.info("Queued payment outbox event: eventId={}, eventType={}, aggregatePublicId={}",
                eventId, eventType, aggregatePublicId);
    }

    @PostConstruct
    void validateRetryConfiguration() {
        if (retryInitialDelayMs <= 0 || retryMaxDelayMs < retryInitialDelayMs) {
            throw new IllegalArgumentException("Outbox retry initial delay must be positive and max delay must be >= initial delay");
        }
    }

    long retryDelayMillis(int attemptCount) {
        validateRetryConfiguration();
        long delay = retryInitialDelayMs;
        for (int attempt = 1; attempt < attemptCount && delay < retryMaxDelayMs; attempt++) {
            delay = delay > retryMaxDelayMs / 2 ? retryMaxDelayMs : delay * 2;
        }
        return Math.min(retryMaxDelayMs, Math.max(1L,
                (long) (delay * ThreadLocalRandom.current().nextDouble(0.8, 1.0))));
    }

    private void processEvent(Long outboxId) {
        transactionTemplate.executeWithoutResult(status -> {
            PaymentEventOutbox event = paymentEventOutboxRepository.findForDispatchById(outboxId).orElse(null);
            if (event == null || !RETRYABLE_STATUSES.contains(event.getProcessingStatus())
                    || (event.getNextAttemptAt() != null && event.getNextAttemptAt().isAfter(LocalDateTime.now()))) {
                return;
            }
            event.setProcessingStatus(STATUS_PROCESSING);
            paymentEventOutboxRepository.save(event);
            try {
                WalletEventPayload payload = readPayload(event.getPayloadJson());
                publishWalletEvent(event.getEventType(), payload);
                event.setProcessingStatus(STATUS_PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                event.setNextAttemptAt(null);
                paymentEventOutboxRepository.save(event);
                log.info("Dispatched payment outbox event: eventId={}, eventType={}, aggregatePublicId={}",
                        event.getEventId(), event.getEventType(), event.getAggregatePublicId());
            } catch (RuntimeException exception) {
                event.setProcessingStatus(STATUS_FAILED);
                event.setAttemptCount(event.getAttemptCount() == Integer.MAX_VALUE
                        ? Integer.MAX_VALUE : event.getAttemptCount() + 1);
                event.setNextAttemptAt(LocalDateTime.now().plus(
                        Duration.ofMillis(retryDelayMillis(event.getAttemptCount()))));
                paymentEventOutboxRepository.save(event);
                log.warn("Payment outbox dispatch failed: eventId={}, attempt={}, nextAttemptAt={}, reason={}",
                        event.getEventId(), event.getAttemptCount(), event.getNextAttemptAt(), failureReason(exception));
            }
        });
    }

    /**
     * Publishes a wallet event to the internal wallet-service endpoint.
     *
     * <p>The payload contains only the durable identifiers and amounts needed for
     * the wallet projection, never cookies, tokens, or user credentials.</p>
     */
    protected void publishWalletEvent(String path, WalletEventPayload payload) {
        try {
            restClient.post()
                    .uri(walletInternalUrl + "/wallet/events/" + path)
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, responseFailureReason(exception), exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Wallet connectivity failure (connection, timeout, or transport); check wallet availability", exception);
        }
    }

    private String responseFailureReason(RestClientResponseException exception) {
        int status = exception.getStatusCode().value();
        return "Wallet returned HTTP " + status + (status == 401 || status == 403
                ? "; verify matching internal service tokens and wallet authorization" : "");
    }

    private String failureReason(RuntimeException exception) {
        if (exception.getCause() instanceof RestClientResponseException responseException) {
            return responseFailureReason(responseException);
        }
        if (exception.getCause() instanceof RestClientException) {
            return "Wallet connectivity failure (connection, timeout, or transport)";
        }
        return exception.getClass().getSimpleName();
    }

    private String writePayload(WalletEventPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to serialize payment outbox payload", exception);
        }
    }

    private WalletEventPayload readPayload(String payloadJson) {
        try {
            JsonNode payloadNode = objectMapper.readTree(payloadJson);
            if (payloadNode.isTextual()) {
                return objectMapper.readValue(payloadNode.textValue(), WalletEventPayload.class);
            }
            return objectMapper.treeToValue(payloadNode, WalletEventPayload.class);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to deserialize payment outbox payload", exception);
        }
    }

    /**
     * Builds a compact deterministic identifier that fits the payment outbox schema.
     *
     * <p>The event identifier must remain stable for idempotent upserts but short enough
     * to fit the outbox column width. A UUID hash preserves both properties without
     * exposing long composite business keys.</p>
     */
    private String buildEventId(String eventType, String aggregatePublicId) {
        return UUID.nameUUIDFromBytes((eventType + ":" + aggregatePublicId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    /**
     * Carries the wallet projection data for a single payment event.
     */
    record WalletEventPayload(String sourceEventId, String paymentOrderPublicId, String marketplaceOrderPublicId,
                              String ownerPublicId, String currencyCode, BigDecimal amount) {
    }
}

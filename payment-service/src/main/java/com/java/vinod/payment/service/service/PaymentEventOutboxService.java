package com.java.vinod.payment.service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.repository.PaymentEventOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        this.restClient = RestClient.builder().build();
        this.walletInternalUrl = walletInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Queues a wallet event from payment-service and schedules an after-commit dispatch.
     *
     * <p>The event stays public-service internal until the transaction commits, then
     * the dispatcher delivers it immediately or leaves it retryable if wallet-service
     * is unavailable.</p>
     */
    public void queueWalletEvent(String eventType, PaymentOrder order, String ownerPublicId, BigDecimal amount) {
        String eventId = buildEventId(eventType, order.getPublicId());
        WalletEventPayload payload = new WalletEventPayload(eventId, order.getPublicId(),
                order.getMarketplaceOrderPublicId(), ownerPublicId, order.getCurrencyCode(), amount);
        upsertPendingEvent(eventId, eventType, order.getPublicId(), payload);
        registerAfterCommitDispatch();
    }

    /**
     * Dispatches retryable payment outbox rows to wallet-service.
     *
     * <p>This method is intentionally scheduled and also used after commit so the
     * service can recover from temporary downstream failures without a separate
     * operator action.</p>
     */
    @Scheduled(fixedDelayString = "${app.outbox.dispatch-delay-ms:5000}")
    public void dispatchPendingEvents() {
        List<PaymentEventOutbox> events = paymentEventOutboxRepository
                .findTop20ByProcessingStatusInOrderByCreatedAtAsc(RETRYABLE_STATUSES);
        for (PaymentEventOutbox event : events) {
            processEvent(event.getId());
        }
    }

    private void upsertPendingEvent(String eventId, String eventType, String aggregatePublicId, WalletEventPayload payload) {
        PaymentEventOutbox event = paymentEventOutboxRepository.findByEventId(eventId).orElseGet(PaymentEventOutbox::new);
        if (event.getId() != null && STATUS_PROCESSED.equals(event.getProcessingStatus())) {
            return;
        }
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

    private void registerAfterCommitDispatch() {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatchPendingEvents();
                }
            });
            return;
        }
        dispatchPendingEvents();
    }

    private void processEvent(Long outboxId) {
        transactionTemplate.executeWithoutResult(status -> {
            PaymentEventOutbox event = paymentEventOutboxRepository.findById(outboxId).orElse(null);
            if (event == null || STATUS_PROCESSED.equals(event.getProcessingStatus())) {
                return;
            }
            event.setProcessingStatus(STATUS_PROCESSING);
            paymentEventOutboxRepository.save(event);
            try {
                WalletEventPayload payload = readPayload(event.getPayloadJson());
                publishWalletEvent(event.getEventType(), payload);
                event.setProcessingStatus(STATUS_PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                paymentEventOutboxRepository.save(event);
                log.info("Dispatched payment outbox event: eventId={}, eventType={}, aggregatePublicId={}",
                        event.getEventId(), event.getEventType(), event.getAggregatePublicId());
            } catch (RuntimeException exception) {
                event.setProcessingStatus(STATUS_FAILED);
                paymentEventOutboxRepository.save(event);
                log.warn("Payment outbox dispatch failed: outboxId={}, reason={}", outboxId, exception.getMessage());
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
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to update wallet projection right now", exception);
        }
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

package com.java.vinod.marketplace.service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.MarketplaceEventOutbox;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.MarketplaceEventOutboxRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Queues and dispatches marketplace commands to payment-service using a retryable outbox.
 *
 * <p>The marketplace service keeps order-to-payment coordination durable so buyer
 * purchases, payout eligibility, disputes, and refunds can recover if payment-service
 * is unavailable at the time the request is first processed.</p>
 */
@Service
public class MarketplaceEventOutboxService {
    static final String STATUS_PENDING = "PENDING";
    static final String STATUS_PROCESSING = "PROCESSING";
    static final String STATUS_PROCESSED = "PROCESSED";
    static final String STATUS_FAILED = "FAILED";
    private static final Logger log = LoggerFactory.getLogger(MarketplaceEventOutboxService.class);
    private static final List<String> RETRYABLE_STATUSES = List.of(STATUS_PENDING, STATUS_FAILED);
    private static final String AGGREGATE_TYPE_ORDER = "MARKETPLACE_ORDER";
    private static final String EVENT_CREATE_PAYMENT_ORDER = "payment-order-create-requested";
    private static final String EVENT_MARK_PAYOUT_ELIGIBLE = "payment-payout-eligible-requested";
    private static final String EVENT_DISPUTE_REQUEST = "payment-dispute-requested";
    private static final String EVENT_REFUND_REQUEST = "payment-refund-requested";

    private final MarketplaceEventOutboxRepository marketplaceEventOutboxRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final RestClient restClient;
    private final String paymentInternalUrl;
    private final String internalServiceToken;

    /**
     * Builds the marketplace outbox service with the internal payment client.
     */
    public MarketplaceEventOutboxService(MarketplaceEventOutboxRepository marketplaceEventOutboxRepository,
                                         ObjectMapper objectMapper,
                                         PlatformTransactionManager transactionManager,
                                         @Value("${app.services.payment-internal-url}") String paymentInternalUrl,
                                         @Value("${app.internal.service-token}") String internalServiceToken) {
        this.marketplaceEventOutboxRepository = marketplaceEventOutboxRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.restClient = RestClient.builder().build();
        this.paymentInternalUrl = paymentInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Queues the payment-service order creation command for a newly created marketplace order.
     */
    public void queuePaymentOrderCreate(OrderHeader order) {
        queue(EVENT_CREATE_PAYMENT_ORDER, order.getPublicId(), buildPaymentOrderPayload(order));
    }

    /**
     * Queues the payout-eligibility command that follows customer acceptance.
     */
    public void queueMarkPayoutEligible(OrderHeader order) {
        queue(EVENT_MARK_PAYOUT_ELIGIBLE, order.getPublicId(), new MarketplaceOrderReferencePayload(order.getPublicId()));
    }

    /**
     * Queues the payment dispute command for a marketplace problem report.
     */
    public void queueDisputeRequest(OrderHeader order, String reason) {
        queue(EVENT_DISPUTE_REQUEST, order.getPublicId(), new MarketplaceLifecycleCommandPayload(reason));
    }

    /**
     * Queues the payment refund command for a marketplace problem report.
     */
    public void queueRefundRequest(OrderHeader order, String reason) {
        queue(EVENT_REFUND_REQUEST, order.getPublicId(), new MarketplaceRefundCommandPayload(reason));
    }

    /**
     * Dispatches queued marketplace commands to payment-service.
     */
    @Scheduled(fixedDelayString = "${app.outbox.dispatch-delay-ms:5000}")
    public void dispatchPendingEvents() {
        List<MarketplaceEventOutbox> events = marketplaceEventOutboxRepository
                .findTop20ByProcessingStatusInOrderByCreatedAtAsc(RETRYABLE_STATUSES);
        for (MarketplaceEventOutbox event : events) {
            processEvent(event.getId());
        }
    }

    private void queue(String eventType, String aggregatePublicId, Object payload) {
        String eventId = buildEventId(eventType, aggregatePublicId);
        MarketplaceEventOutbox event = marketplaceEventOutboxRepository.findByEventId(eventId).orElseGet(MarketplaceEventOutbox::new);
        if (event.getId() != null && STATUS_PROCESSED.equals(event.getProcessingStatus())) {
            return;
        }
        event.setEventId(eventId);
        event.setAggregateType(AGGREGATE_TYPE_ORDER);
        event.setAggregatePublicId(aggregatePublicId);
        event.setEventType(eventType);
        event.setPayloadJson(writePayload(payload));
        event.setProcessingStatus(STATUS_PENDING);
        event.setProcessedAt(null);
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(LocalDateTime.now());
        }
        marketplaceEventOutboxRepository.save(event);
        registerAfterCommitDispatch();
        log.info("Queued marketplace outbox event: eventId={}, eventType={}, aggregatePublicId={}",
                eventId, eventType, aggregatePublicId);
    }

    /**
     * Builds a compact deterministic event identifier that fits the outbox schema.
     *
     * <p>The outbox uses a 36-character unique key, so the identifier must stay
     * short even when the event type and aggregate id are verbose. A stable UUID
     * hash preserves idempotent upsert behavior across retries.</p>
     */
    private String buildEventId(String eventType, String aggregatePublicId) {
        return UUID.nameUUIDFromBytes((eventType + ":" + aggregatePublicId).getBytes()).toString();
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
            MarketplaceEventOutbox event = marketplaceEventOutboxRepository.findById(outboxId).orElse(null);
            if (event == null || STATUS_PROCESSED.equals(event.getProcessingStatus())) {
                return;
            }
            event.setProcessingStatus(STATUS_PROCESSING);
            marketplaceEventOutboxRepository.save(event);
            try {
                dispatch(event);
                event.setProcessingStatus(STATUS_PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                marketplaceEventOutboxRepository.save(event);
                log.info("Dispatched marketplace outbox event: eventId={}, eventType={}, aggregatePublicId={}",
                        event.getEventId(), event.getEventType(), event.getAggregatePublicId());
            } catch (RuntimeException exception) {
                event.setProcessingStatus(STATUS_FAILED);
                marketplaceEventOutboxRepository.save(event);
                log.warn("Marketplace outbox dispatch failed: outboxId={}, reason={}", outboxId, exception.getMessage());
            }
        });
    }

    private void dispatch(MarketplaceEventOutbox event) {
        switch (event.getEventType()) {
            case EVENT_CREATE_PAYMENT_ORDER -> post(paymentInternalUrl + "/payments/orders", readPayload(event, PaymentOrderCommandPayload.class));
            case EVENT_MARK_PAYOUT_ELIGIBLE -> post(paymentInternalUrl + "/payments/orders/" + event.getAggregatePublicId() + "/mark-payout-eligible", null);
            case EVENT_DISPUTE_REQUEST -> post(paymentInternalUrl + "/payments/orders/" + event.getAggregatePublicId() + "/dispute-request",
                    readPayload(event, MarketplaceLifecycleCommandPayload.class));
            case EVENT_REFUND_REQUEST -> post(paymentInternalUrl + "/payments/orders/" + event.getAggregatePublicId() + "/refund-request",
                    readPayload(event, MarketplaceRefundCommandPayload.class));
            default -> throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unsupported marketplace outbox event");
        }
    }

    protected void post(String uri, Object body) {
        try {
            var request = restClient.post().uri(uri).header("X-Internal-Service-Token", internalServiceToken);
            if (body != null) {
                request.body(body).retrieve().toBodilessEntity();
                return;
            }
            request.retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to update payment state right now", exception);
        }
    }

    private PaymentOrderCommandPayload buildPaymentOrderPayload(OrderHeader order) {
        return new PaymentOrderCommandPayload(order.getPublicId(), order.getCustomerTotalAmount(),
                order.getTransactionCurrencyCode(), order.getProviderAccountPublicId(), order.getCustomerUserPublicId(),
                order.getProviderCountryCode());
    }

    private String writePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to serialize marketplace outbox payload", exception);
        }
    }

    private <T> T readPayload(MarketplaceEventOutbox event, Class<T> payloadType) {
        try {
            return objectMapper.readValue(event.getPayloadJson(), payloadType);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to deserialize marketplace outbox payload", exception);
        }
    }

    /**
     * Carries the payment creation payload to payment-service.
     */
    private record PaymentOrderCommandPayload(String marketplaceOrderPublicId, BigDecimal amount, String currencyCode,
                                              String providerAccountPublicId, String customerUserPublicId,
                                              String providerCountryCode) {
    }

    /**
     * Carries marketplace order state into the payment lifecycle endpoints.
     */
    private record MarketplaceOrderReferencePayload(String marketplaceOrderPublicId) {
    }

    /**
     * Carries the dispute reason into the payment-service dispute endpoint.
     */
    private record MarketplaceLifecycleCommandPayload(String reason) {
    }

    /**
     * Carries the refund reason into the payment-service refund endpoint.
     */
    private record MarketplaceRefundCommandPayload(String reason) {
    }

    private record MarketplaceOrderCommandPayload(String marketplaceOrderPublicId, String reason) {
    }
}

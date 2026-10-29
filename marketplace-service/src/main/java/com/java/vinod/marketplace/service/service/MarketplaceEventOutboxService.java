package com.java.vinod.marketplace.service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import com.java.vinod.marketplace.service.entity.MarketplaceEventOutbox;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.MarketplaceEventOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.data.domain.PageRequest;
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
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;
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
    private static final String AGGREGATE_TYPE_CHECKOUT = "MARKETPLACE_CHECKOUT";
    static final String EVENT_CREATE_CHECKOUT_PAYMENT = "payment-checkout-create-requested";
    static final String EVENT_CHECKOUT_ALLOCATION_PAYOUT_ELIGIBLE = "payment-checkout-allocation-payout-eligible-requested";
    static final String EVENT_CHECKOUT_ALLOCATION_DISPUTE = "payment-checkout-allocation-dispute-requested";

    private final MarketplaceEventOutboxRepository marketplaceEventOutboxRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final RestClient restClient;
    private final String paymentInternalUrl;
    private final String internalServiceToken;
    @Value("${app.outbox.retry-initial-delay-ms:5000}")
    private long retryInitialDelayMs = 5000;
    @Value("${app.outbox.retry-max-delay-ms:300000}")
    private long retryMaxDelayMs = 300000;

    /**
     * Builds the marketplace outbox service with the internal payment client.
     */
    @Autowired
    public MarketplaceEventOutboxService(MarketplaceEventOutboxRepository marketplaceEventOutboxRepository,
                                         ObjectMapper objectMapper,
                                         PlatformTransactionManager transactionManager,
                                         @Value("${app.services.payment-internal-url}") String paymentInternalUrl,
                                         @Value("${app.internal.service-token}") String internalServiceToken) {
        this(marketplaceEventOutboxRepository, objectMapper, transactionManager, paymentInternalUrl,
                internalServiceToken, paymentClientBuilder());
    }

    private static RestClient.Builder paymentClientBuilder() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder().requestFactory(factory);
    }

    MarketplaceEventOutboxService(MarketplaceEventOutboxRepository marketplaceEventOutboxRepository,
                                  ObjectMapper objectMapper,
                                  PlatformTransactionManager transactionManager,
                                  String paymentInternalUrl,
                                  String internalServiceToken,
                                  RestClient.Builder restClientBuilder) {
        this.marketplaceEventOutboxRepository = marketplaceEventOutboxRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.restClient = restClientBuilder.build();
        this.paymentInternalUrl = paymentInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Queues the payment-service order creation command for a newly created marketplace order.
     */
    public void queuePaymentOrderCreate(OrderHeader order) {
        rejectConsolidatedChild(order);
        queue(EVENT_CREATE_PAYMENT_ORDER, order.getPublicId(), buildPaymentOrderPayload(order));
    }

    /**
     * Queues the payout-eligibility command that follows customer acceptance.
     */
    public void queueMarkPayoutEligible(OrderHeader order) {
        rejectConsolidatedChild(order);
        queue(EVENT_MARK_PAYOUT_ELIGIBLE, order.getPublicId(), new MarketplaceOrderReferencePayload(order.getPublicId()));
    }

    /**
     * Queues the payment dispute command for a marketplace problem report.
     */
    public void queueDisputeRequest(OrderHeader order, String reason) {
        rejectConsolidatedChild(order);
        queue(EVENT_DISPUTE_REQUEST, order.getPublicId(), new MarketplaceLifecycleCommandPayload(reason));
    }

    /**
     * Queues the payment refund command for a marketplace problem report.
     */
    public void queueRefundRequest(OrderHeader order, String reason) {
        rejectConsolidatedChild(order);
        queue(EVENT_REFUND_REQUEST, order.getPublicId(), new MarketplaceRefundCommandPayload(reason));
    }

    /**
     * Queues the single payment-service command that creates the aggregate payment for a consolidated checkout.
     * Allocation amounts are customer totals per child order and must sum exactly to the parent totals.
     */
    public void queueCheckoutPaymentCreate(MarketplaceCheckout checkout, List<OrderHeader> orders) {
        if (orders == null || orders.isEmpty()) {
            throw new IllegalStateException("Consolidated checkout requires at least one child order");
        }
        List<CheckoutPaymentAllocationPayload> allocations = orders.stream()
                .map(order -> new CheckoutPaymentAllocationPayload(order.getPublicId(), order.getProviderAccountPublicId(),
                        order.getProviderCountryCode(), order.getCustomerTotalAmount(), order.getPlatformFeeAmount(),
                        order.getProviderExpectedAmount()))
                .toList();
        BigDecimal amount = sum(allocations.stream().map(CheckoutPaymentAllocationPayload::amount).toList());
        BigDecimal fee = sum(allocations.stream().map(CheckoutPaymentAllocationPayload::platformFeeAmount).toList());
        BigDecimal payable = sum(allocations.stream().map(CheckoutPaymentAllocationPayload::providerPayableAmount).toList());
        if (amount.compareTo(checkout.getCustomerTotalAmount()) != 0
                || fee.compareTo(checkout.getPlatformFeeAmount()) != 0
                || payable.compareTo(checkout.getProviderAmount()) != 0
                || amount.compareTo(fee.add(payable)) != 0) {
            throw new IllegalStateException("Consolidated checkout allocations do not reconcile with parent totals");
        }
        queue(EVENT_CREATE_CHECKOUT_PAYMENT, AGGREGATE_TYPE_CHECKOUT, checkout.getPublicId(),
                new CheckoutPaymentCommandPayload(checkout.getPublicId(), checkout.getCustomerUserPublicId(),
                        checkout.getCurrencyCode(), checkout.getCustomerTotalAmount(), checkout.getPlatformFeeAmount(),
                        checkout.getProviderAmount(), allocations));
    }

    /**
     * Queues payout eligibility for one child allocation of a consolidated checkout payment.
     */
    public void queueCheckoutAllocationPayoutEligible(OrderHeader order) {
        String checkoutPublicId = requireCheckoutPublicId(order);
        queue(EVENT_CHECKOUT_ALLOCATION_PAYOUT_ELIGIBLE, AGGREGATE_TYPE_ORDER, order.getPublicId(),
                new CheckoutAllocationCommandPayload(checkoutPublicId, order.getPublicId(), null));
    }

    /**
     * Queues a dispute hold for one child allocation of a consolidated checkout payment.
     */
    public void queueCheckoutAllocationDispute(OrderHeader order, String reason) {
        String checkoutPublicId = requireCheckoutPublicId(order);
        queue(EVENT_CHECKOUT_ALLOCATION_DISPUTE, AGGREGATE_TYPE_ORDER, order.getPublicId(),
                new CheckoutAllocationCommandPayload(checkoutPublicId, order.getPublicId(), reason));
    }

    boolean isCheckoutPaymentCreatePending(String checkoutPublicId) {
        return marketplaceEventOutboxRepository
                .findByEventId(buildEventId(EVENT_CREATE_CHECKOUT_PAYMENT, checkoutPublicId))
                .map(event -> STATUS_PENDING.equals(event.getProcessingStatus())
                        || STATUS_PROCESSING.equals(event.getProcessingStatus())
                        || STATUS_FAILED.equals(event.getProcessingStatus()))
                .orElse(false);
    }

    /**
     * Dispatches queued marketplace commands to payment-service.
     */
    @Scheduled(fixedDelayString = "${app.outbox.dispatch-delay-ms:5000}")
    public void dispatchPendingEvents() {
        List<MarketplaceEventOutbox> events = marketplaceEventOutboxRepository
                .findDueEvents(RETRYABLE_STATUSES, LocalDateTime.now(), PageRequest.of(0, 20));
        for (MarketplaceEventOutbox event : events) {
            processEvent(event.getId());
        }
    }

    private void queue(String eventType, String aggregatePublicId, Object payload) {
        queue(eventType, AGGREGATE_TYPE_ORDER, aggregatePublicId, payload);
    }

    private void queue(String eventType, String aggregateType, String aggregatePublicId, Object payload) {
        String eventId = buildEventId(eventType, aggregatePublicId);
        MarketplaceEventOutbox event = marketplaceEventOutboxRepository.findByEventId(eventId).orElseGet(MarketplaceEventOutbox::new);
        if (event.getId() != null) {
            return;
        }
        event.setEventId(eventId);
        event.setAggregateType(aggregateType);
        event.setAggregatePublicId(aggregatePublicId);
        event.setEventType(eventType);
        event.setPayloadJson(writePayload(payload));
        event.setProcessingStatus(STATUS_PENDING);
        event.setProcessedAt(null);
        if (event.getCreatedAt() == null) {
            event.setCreatedAt(LocalDateTime.now());
        }
        marketplaceEventOutboxRepository.save(event);
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

    private void processEvent(Long outboxId) {
        transactionTemplate.executeWithoutResult(status -> {
            MarketplaceEventOutbox event = marketplaceEventOutboxRepository.findForDispatchById(outboxId).orElse(null);
            if (event == null || !RETRYABLE_STATUSES.contains(event.getProcessingStatus())
                    || (event.getNextAttemptAt() != null && event.getNextAttemptAt().isAfter(LocalDateTime.now()))) {
                return;
            }
            event.setProcessingStatus(STATUS_PROCESSING);
            marketplaceEventOutboxRepository.save(event);
            try {
                dispatch(event);
                event.setProcessingStatus(STATUS_PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
                event.setNextAttemptAt(null);
                marketplaceEventOutboxRepository.save(event);
                log.info("Dispatched marketplace outbox event: eventId={}, eventType={}, aggregatePublicId={}",
                        event.getEventId(), event.getEventType(), event.getAggregatePublicId());
            } catch (RuntimeException exception) {
                event.setProcessingStatus(STATUS_FAILED);
                event.setAttemptCount(event.getAttemptCount() == Integer.MAX_VALUE
                        ? Integer.MAX_VALUE : event.getAttemptCount() + 1);
                event.setNextAttemptAt(LocalDateTime.now().plusNanos(retryDelayMillis(event.getAttemptCount()) * 1_000_000));
                marketplaceEventOutboxRepository.save(event);
                log.warn("Marketplace outbox dispatch failed: outboxId={}, eventId={}, attempt={}, nextAttemptAt={}, reason={}",
                        outboxId, event.getEventId(), event.getAttemptCount(), event.getNextAttemptAt(), exception.getMessage());
            }
        });
    }

    @PostConstruct
    void validateRetryConfiguration() {
        if (retryInitialDelayMs <= 0 || retryMaxDelayMs < retryInitialDelayMs
                || retryMaxDelayMs > Long.MAX_VALUE / 1_000_000) {
            throw new IllegalStateException("Outbox retry delays must be positive, bounded and max >= initial");
        }
    }

    long retryDelayMillis(int attemptCount) {
        validateRetryConfiguration();
        long delay = retryInitialDelayMs;
        for (int attempt = 1; attempt < attemptCount && delay < retryMaxDelayMs; attempt++) {
            delay = delay > retryMaxDelayMs / 2 ? retryMaxDelayMs : delay * 2;
        }
        return Math.max(1, (long) (delay * ThreadLocalRandom.current().nextDouble(0.8, 1.0)));
    }

    private void dispatch(MarketplaceEventOutbox event) {
        switch (event.getEventType()) {
            case EVENT_CREATE_PAYMENT_ORDER -> post(paymentInternalUrl + "/payments/orders", readPayload(event, PaymentOrderCommandPayload.class));
            case EVENT_MARK_PAYOUT_ELIGIBLE -> post(paymentInternalUrl + "/payments/orders/" + event.getAggregatePublicId() + "/mark-payout-eligible", null);
            case EVENT_DISPUTE_REQUEST -> post(paymentInternalUrl + "/payments/orders/" + event.getAggregatePublicId() + "/dispute-request",
                    readPayload(event, MarketplaceLifecycleCommandPayload.class));
            case EVENT_REFUND_REQUEST -> post(paymentInternalUrl + "/payments/orders/" + event.getAggregatePublicId() + "/refund-request",
                    readPayload(event, MarketplaceRefundCommandPayload.class));
            case EVENT_CREATE_CHECKOUT_PAYMENT -> post(paymentInternalUrl + "/payments/checkouts",
                    readPayload(event, CheckoutPaymentCommandPayload.class));
            case EVENT_CHECKOUT_ALLOCATION_PAYOUT_ELIGIBLE -> {
                CheckoutAllocationCommandPayload payload = readPayload(event, CheckoutAllocationCommandPayload.class);
                requireCheckoutPaymentCreated(payload.checkoutPublicId());
                post(checkoutAllocationUri(payload) + "/mark-payout-eligible", null);
            }
            case EVENT_CHECKOUT_ALLOCATION_DISPUTE -> {
                CheckoutAllocationCommandPayload payload = readPayload(event, CheckoutAllocationCommandPayload.class);
                requireCheckoutPaymentCreated(payload.checkoutPublicId());
                post(checkoutAllocationUri(payload) + "/dispute-request", new MarketplaceLifecycleCommandPayload(payload.reason()));
            }
            default -> throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unsupported marketplace outbox event");
        }
    }

    protected void post(String uri, Object body) {
        if (internalServiceToken == null || internalServiceToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payment dispatch requires APP_INTERNAL_SERVICE_TOKEN; configure the same non-empty token in marketplace-service and payment-service");
        }
        try {
            var request = restClient.post().uri(uri).header("X-Internal-Service-Token", internalServiceToken);
            if (body != null) {
                request.body(body).retrieve().toBodilessEntity();
                return;
            }
            request.retrieve().toBodilessEntity();
        } catch (RestClientResponseException exception) {
            String reason = "Payment-service rejected the outbox command (HTTP " + exception.getStatusCode().value() + ")";
            if (exception.getStatusCode().value() == 401 || exception.getStatusCode().value() == 403) {
                reason += "; configure the same APP_INTERNAL_SERVICE_TOKEN in marketplace-service and payment-service";
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, reason, exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Payment-service request failed (" + exception.getClass().getSimpleName()
                            + "); check PAYMENT_SERVICE_INTERNAL_URL and payment-service availability", exception);
        }
    }

    private String checkoutAllocationUri(CheckoutAllocationCommandPayload payload) {
        return paymentInternalUrl + "/payments/checkouts/" + payload.checkoutPublicId()
                + "/allocations/" + payload.marketplaceOrderPublicId();
    }

    /**
     * Allocation lifecycle commands must never reach payment-service before the aggregate payment exists;
     * an unprocessed create command leaves the lifecycle command failed so the scheduler retries it later.
     */
    private void requireCheckoutPaymentCreated(String checkoutPublicId) {
        boolean created = marketplaceEventOutboxRepository
                .findByEventId(buildEventId(EVENT_CREATE_CHECKOUT_PAYMENT, checkoutPublicId))
                .map(event -> STATUS_PROCESSED.equals(event.getProcessingStatus()))
                .orElse(false);
        if (!created) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout payment has not been created yet");
        }
    }

    /**
     * Consolidated checkout children are paid by the aggregate checkout payment and must never use legacy order paths.
     */
    private static void rejectConsolidatedChild(OrderHeader order) {
        if (order.isConsolidatedCheckoutChild()) {
            throw new IllegalStateException("Consolidated checkout orders must use checkout payment commands");
        }
    }

    private static String requireCheckoutPublicId(OrderHeader order) {
        if (order.getCheckout() == null || order.getCheckout().getPublicId() == null) {
            throw new IllegalStateException("Order is not part of a consolidated checkout");
        }
        return order.getCheckout().getPublicId();
    }

    private static BigDecimal sum(List<BigDecimal> values) {
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
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

    /**
     * Body of POST /payments/checkouts: one aggregate payment keyed by checkoutPublicId with exact allocations.
     */
    record CheckoutPaymentCommandPayload(String checkoutPublicId, String customerUserPublicId, String currencyCode,
                                         BigDecimal amount, BigDecimal platformFeeAmount, BigDecimal providerPayableAmount,
                                         List<CheckoutPaymentAllocationPayload> allocations) {
    }

    record CheckoutPaymentAllocationPayload(String marketplaceOrderPublicId, String providerAccountPublicId,
                                            String providerCountryCode, BigDecimal amount, BigDecimal platformFeeAmount,
                                            BigDecimal providerPayableAmount) {
    }

    /**
     * Outbox-only routing data for consolidated allocation lifecycle commands.
     */
    record CheckoutAllocationCommandPayload(String checkoutPublicId, String marketplaceOrderPublicId, String reason) {
    }
}

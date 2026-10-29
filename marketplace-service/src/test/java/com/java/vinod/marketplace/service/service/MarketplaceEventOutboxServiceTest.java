package com.java.vinod.marketplace.service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.marketplace.service.entity.MarketplaceEventOutbox;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.MarketplaceEventOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
import static org.mockito.ArgumentMatchers.any;

/**
 * Verifies that marketplace outbox commands are stored durably and forwarded to payment-service.
 */
@ExtendWith(MockitoExtension.class)
class MarketplaceEventOutboxServiceTest {
    private MarketplaceEventOutboxRepository marketplaceEventOutboxRepository;
    private PlatformTransactionManager transactionManager;
    private MarketplaceEventOutboxService marketplaceEventOutboxService;
    private AtomicReference<MarketplaceEventOutbox> savedEvent;
    private AtomicLong sequence;

    @BeforeEach
    void setUp() {
        marketplaceEventOutboxRepository = Mockito.mock(MarketplaceEventOutboxRepository.class);
        transactionManager = Mockito.mock(PlatformTransactionManager.class);
        marketplaceEventOutboxService = Mockito.spy(new TestableMarketplaceEventOutboxService(marketplaceEventOutboxRepository,
                new ObjectMapper(), transactionManager, "http://payment-service:8080/payment-service",
                "internal-token"));
        savedEvent = new AtomicReference<>();
        sequence = new AtomicLong(1L);
        TransactionStatus transactionStatus = mock(TransactionStatus.class);
        lenient().when(transactionManager.getTransaction(ArgumentMatchers.any())).thenReturn(transactionStatus);
        when(marketplaceEventOutboxRepository.findByEventId(ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty());
        when(marketplaceEventOutboxRepository.save(ArgumentMatchers.any())).thenAnswer(invocation -> {
            MarketplaceEventOutbox event = invocation.getArgument(0);
            if (event.getId() == null) {
                event.setId(sequence.getAndIncrement());
            }
            savedEvent.set(event);
            return event;
        });
        lenient().when(marketplaceEventOutboxRepository.findDueEvents(any(), any(), any()))
                .thenAnswer(invocation -> savedEvent.get() == null ? List.of() : List.of(savedEvent.get()));
        lenient().when(marketplaceEventOutboxRepository.findForDispatchById(ArgumentMatchers.anyLong()))
                .thenAnswer(invocation -> Optional.ofNullable(savedEvent.get()));
    }

    @Test
    void queuePaymentOrderCreatePersistsAndProcessesOrderCommand() {
        OrderHeader order = order("marketplace-order-1", BigDecimal.valueOf(125.00));

        marketplaceEventOutboxService.queuePaymentOrderCreate(order);

        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PENDING);
        verify(marketplaceEventOutboxService, never()).post(any(), any());
        marketplaceEventOutboxService.dispatchPendingEvents();
        assertThat(savedEvent.get()).isNotNull();
        assertThat(savedEvent.get().getEventType()).isEqualTo("payment-order-create-requested");
        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED);
        assertThat(savedEvent.get().getProcessedAt()).isNotNull();
    }

    @Test
    void queueRefundRequestPersistsAndProcessesRefundCommand() {
        OrderHeader order = order("marketplace-order-2", BigDecimal.valueOf(88.00));

        marketplaceEventOutboxService.queueRefundRequest(order, "refund requested for test");
        marketplaceEventOutboxService.dispatchPendingEvents();

        assertThat(savedEvent.get()).isNotNull();
        assertThat(savedEvent.get().getEventType()).isEqualTo("payment-refund-requested");
        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED);
    }

    @Test
    void failuresBackOffAndRepeatedQueueDoesNotResetRetrySchedule() {
        OrderHeader order = order("retry-order", BigDecimal.TEN);
        marketplaceEventOutboxService.queuePaymentOrderCreate(order);
        doThrow(new IllegalStateException("payment unavailable")).when(marketplaceEventOutboxService).post(any(), any());
        LocalDateTime before = LocalDateTime.now();
        marketplaceEventOutboxService.dispatchPendingEvents();
        var event = savedEvent.get();
        assertThat(event.getAttemptCount()).isEqualTo(1);
        assertThat(event.getNextAttemptAt()).isAfterOrEqualTo(before.plusSeconds(4));
        assertThat(event.getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_FAILED);
        LocalDateTime dueAt = event.getNextAttemptAt();
        when(marketplaceEventOutboxRepository.findByEventId(any())).thenReturn(Optional.of(event));
        marketplaceEventOutboxService.queuePaymentOrderCreate(order);
        assertThat(event.getNextAttemptAt()).isEqualTo(dueAt);
        marketplaceEventOutboxService.dispatchPendingEvents();
        verify(marketplaceEventOutboxService, Mockito.times(1)).post(any(), any());
        event.setNextAttemptAt(LocalDateTime.now().minusSeconds(1));
        doNothing().when(marketplaceEventOutboxService).post(any(), any());
        marketplaceEventOutboxService.dispatchPendingEvents();
        assertThat(event.getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED);
        assertThat(event.getNextAttemptAt()).isNull();
        verify(marketplaceEventOutboxRepository, Mockito.times(3)).findForDispatchById(event.getId());
    }

    @Test
    void retryDelayDoublesAndIsCappedWithJitter() {
        marketplaceEventOutboxService.queuePaymentOrderCreate(order("delay-order", BigDecimal.TEN));
        for (int attempt = 1; attempt <= 8; attempt++) {
            long ceiling = Math.min(300000, 5000L << (attempt - 1));
            assertThat(marketplaceEventOutboxService.retryDelayMillis(attempt))
                    .isBetween((long) (ceiling * 0.8), ceiling);
        }
        assertThat(marketplaceEventOutboxService.retryDelayMillis(Integer.MAX_VALUE)).isBetween(240000L, 300000L);
    }

    @Test
    void staleBatchEntryAlreadyProcessedIsNotSentAgain() {
        marketplaceEventOutboxService.queuePaymentOrderCreate(order("stale-order", BigDecimal.TEN));
        marketplaceEventOutboxService.dispatchPendingEvents();
        marketplaceEventOutboxService.dispatchPendingEvents();
        verify(marketplaceEventOutboxService, Mockito.times(1)).post(any(), any());
    }

    @Test
    void invalidRetryConfigurationFailsExplicitly() {
        marketplaceEventOutboxService.queuePaymentOrderCreate(order("config-order", BigDecimal.TEN));
        org.springframework.test.util.ReflectionTestUtils.setField(marketplaceEventOutboxService, "retryInitialDelayMs", 0L);
        assertThatThrownBy(marketplaceEventOutboxService::validateRetryConfiguration)
                .isInstanceOf(IllegalStateException.class);
        org.springframework.test.util.ReflectionTestUtils.setField(marketplaceEventOutboxService, "retryInitialDelayMs", 5000L);
        org.springframework.test.util.ReflectionTestUtils.setField(marketplaceEventOutboxService, "retryMaxDelayMs", 1000L);
        assertThatThrownBy(marketplaceEventOutboxService::validateRetryConfiguration)
                .isInstanceOf(IllegalStateException.class);
    }

    private static OrderHeader order(String publicId, BigDecimal amount) {
        OrderHeader order = new OrderHeader();
        order.setPublicId(publicId);
        order.setCustomerTotalAmount(amount);
        order.setTransactionCurrencyCode("USD");
        order.setProviderAccountPublicId("provider-1");
        order.setCustomerUserPublicId("customer-1");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return order;
    }

    /**
     * Test-only outbox service that suppresses live payment transport.
     */
    private static final class TestableMarketplaceEventOutboxService extends MarketplaceEventOutboxService {
        private TestableMarketplaceEventOutboxService(MarketplaceEventOutboxRepository marketplaceEventOutboxRepository,
                                                      ObjectMapper objectMapper,
                                                      PlatformTransactionManager transactionManager,
                                                      String paymentInternalUrl,
                                                      String internalServiceToken) {
            super(marketplaceEventOutboxRepository, objectMapper, transactionManager, paymentInternalUrl, internalServiceToken);
        }

        @Override
        protected void post(String uri, Object body) {
            // Suppressed in unit tests so the marketplace outbox transition can be verified without a live payment service.
        }
    }
}

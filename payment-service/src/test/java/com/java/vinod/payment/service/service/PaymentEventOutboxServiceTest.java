package com.java.vinod.payment.service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.repository.PaymentEventOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.test.util.ReflectionTestUtils;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that payment outbox rows are stored durably and processed into wallet events.
 */
@ExtendWith(MockitoExtension.class)
class PaymentEventOutboxServiceTest {
    private PaymentEventOutboxRepository paymentEventOutboxRepository;
    private PlatformTransactionManager transactionManager;
    private TestablePaymentEventOutboxService paymentEventOutboxService;
    private AtomicReference<PaymentEventOutbox> savedEvent;
    private AtomicLong sequence;

    @BeforeEach
    void setUp() {
        paymentEventOutboxRepository = Mockito.mock(PaymentEventOutboxRepository.class);
        transactionManager = Mockito.mock(PlatformTransactionManager.class);
        paymentEventOutboxService = new TestablePaymentEventOutboxService(paymentEventOutboxRepository,
                new ObjectMapper(), transactionManager, "http://wallet-service:8080/payment-service",
                "internal-token");
        savedEvent = new AtomicReference<>();
        sequence = new AtomicLong(1L);
        TransactionStatus transactionStatus = mock(TransactionStatus.class);
        lenient().when(transactionManager.getTransaction(ArgumentMatchers.any())).thenReturn(transactionStatus);
        lenient().doNothing().when(transactionManager).commit(ArgumentMatchers.any());
        lenient().when(paymentEventOutboxRepository.findByEventId(ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty());
        lenient().when(paymentEventOutboxRepository.save(ArgumentMatchers.any())).thenAnswer(invocation -> {
            PaymentEventOutbox event = invocation.getArgument(0);
            if (event.getId() == null) {
                event.setId(sequence.getAndIncrement());
            }
            savedEvent.set(event);
            return event;
        });
        lenient().when(paymentEventOutboxRepository.findDueEvents(ArgumentMatchers.any(),
                        ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenAnswer(invocation -> savedEvent.get() == null ? List.of() : List.of(savedEvent.get()));
        lenient().when(paymentEventOutboxRepository.findForDispatchById(ArgumentMatchers.anyLong()))
                .thenAnswer(invocation -> Optional.ofNullable(savedEvent.get()));
    }

    @Test
    void queueWalletEventPersistsWithoutImmediateDelivery() {
        PaymentOrder order = paymentOrder();

        paymentEventOutboxService.queueWalletEvent("payment-captured", order, order.getCustomerUserPublicId(), order.getCustomerChargeAmount());

        assertThat(savedEvent.get()).isNotNull();
        assertThat(savedEvent.get().getEventType()).isEqualTo("payment-captured");
        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(PaymentEventOutboxService.STATUS_PENDING);
        assertThat(savedEvent.get().getProcessedAt()).isNull();
        assertThat(savedEvent.get().getAttemptCount()).isZero();
        assertThat(savedEvent.get().getNextAttemptAt()).isNull();
        assertThat(paymentEventOutboxService.publishCount).isZero();

        paymentEventOutboxService.dispatchPendingEvents();

        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(PaymentEventOutboxService.STATUS_PROCESSED);
        assertThat(savedEvent.get().getProcessedAt()).isNotNull();
    }

    @Test
    void failedEventsBackOffThenRetrySuccessfullyWithoutResettingAttempts() {
        PaymentOrder order = paymentOrder();
        paymentEventOutboxService.queueWalletEvent("payment-captured", order, "customer", BigDecimal.TEN);
        paymentEventOutboxService.fail = true;
        LocalDateTime before = LocalDateTime.now();

        paymentEventOutboxService.dispatchPendingEvents();

        PaymentEventOutbox event = savedEvent.get();
        assertThat(event.getProcessingStatus()).isEqualTo("FAILED");
        assertThat(event.getAttemptCount()).isEqualTo(1);
        assertThat(event.getNextAttemptAt()).isAfterOrEqualTo(before.plusSeconds(4));
        assertThat(event.getNextAttemptAt()).isBeforeOrEqualTo(LocalDateTime.now().plusSeconds(5));
        LocalDateTime nextAttempt = event.getNextAttemptAt();
        paymentEventOutboxService.dispatchPendingEvents();
        assertThat(event.getAttemptCount()).isEqualTo(1);
        assertThat(event.getNextAttemptAt()).isEqualTo(nextAttempt);
        assertThat(paymentEventOutboxService.publishCount).isEqualTo(1);

        event.setNextAttemptAt(LocalDateTime.now().minusSeconds(1));
        paymentEventOutboxService.dispatchPendingEvents();
        assertThat(event.getAttemptCount()).isEqualTo(2);
        assertThat(event.getNextAttemptAt()).isAfterOrEqualTo(before.plusSeconds(8));

        event.setNextAttemptAt(LocalDateTime.now().minusSeconds(1));
        paymentEventOutboxService.fail = false;
        paymentEventOutboxService.dispatchPendingEvents();
        assertThat(event.getProcessingStatus()).isEqualTo("PROCESSED");
        assertThat(event.getAttemptCount()).isEqualTo(2);
        assertThat(event.getNextAttemptAt()).isNull();
        assertThat(event.getProcessedAt()).isNotNull();
        Mockito.verify(paymentEventOutboxRepository, Mockito.never()).findById(ArgumentMatchers.anyLong());
        Mockito.verify(transactionManager, Mockito.times(4)).commit(ArgumentMatchers.any());
    }

    @Test
    void repeatedQueuePreservesEveryExistingStatusPayloadAndRetrySchedule() {
        PaymentOrder order = paymentOrder();
        paymentEventOutboxService.queueWalletEvent("payment-captured", order, "original-owner", BigDecimal.TEN);
        PaymentEventOutbox event = savedEvent.get();
        String originalPayload = event.getPayloadJson();
        LocalDateTime createdAt = event.getCreatedAt();
        when(paymentEventOutboxRepository.findByEventId(event.getEventId())).thenReturn(Optional.of(event));
        for (String status : List.of("PENDING", "FAILED", "PROCESSING", "PROCESSED")) {
            LocalDateTime nextAttempt = LocalDateTime.now().plusHours(1);
            LocalDateTime processedAt = LocalDateTime.now().minusHours(1);
            event.setProcessingStatus(status);
            event.setAttemptCount(7);
            event.setNextAttemptAt(nextAttempt);
            event.setProcessedAt(processedAt);

            paymentEventOutboxService.queueWalletEvent("payment-captured", order, "changed-owner", BigDecimal.ONE);

            assertThat(event.getPayloadJson()).isEqualTo(originalPayload);
            assertThat(event.getProcessingStatus()).isEqualTo(status);
            assertThat(event.getAttemptCount()).isEqualTo(7);
            assertThat(event.getNextAttemptAt()).isEqualTo(nextAttempt);
            assertThat(event.getProcessedAt()).isEqualTo(processedAt);
            assertThat(event.getCreatedAt()).isEqualTo(createdAt);
        }
        Mockito.verify(paymentEventOutboxRepository, Mockito.times(1)).save(event);
    }

    @Test
    void allocationQueueIsAlsoSchedulerOnlyAndImmutable() {
        PaymentOrder order = paymentOrder();
        paymentEventOutboxService.queueAllocationWalletEvent("provider-pending-earning", "allocation",
                order, "marketplace-order", "seller", BigDecimal.TEN);
        PaymentEventOutbox event = savedEvent.get();
        String payload = event.getPayloadJson();
        event.setProcessingStatus("FAILED");
        event.setAttemptCount(5);
        LocalDateTime nextAttempt = LocalDateTime.now().plusHours(1);
        event.setNextAttemptAt(nextAttempt);
        when(paymentEventOutboxRepository.findByEventId(event.getEventId())).thenReturn(Optional.of(event));
        paymentEventOutboxService.queueAllocationWalletEvent("provider-pending-earning", "allocation",
                order, "changed-order", "changed-seller", BigDecimal.ONE);
        assertThat(event.getPayloadJson()).isEqualTo(payload);
        assertThat(event.getAttemptCount()).isEqualTo(5);
        assertThat(event.getNextAttemptAt()).isEqualTo(nextAttempt);
        assertThat(event.getProcessingStatus()).isEqualTo("FAILED");
        assertThat(paymentEventOutboxService.publishCount).isZero();
    }

    @Test
    void dispatchRechecksStatusAndDueDateUnderPessimisticLock() throws Exception {
        PaymentOrder order = paymentOrder();
        paymentEventOutboxService.queueWalletEvent("payment-captured", order, "customer", BigDecimal.TEN);
        PaymentEventOutbox event = savedEvent.get();
        for (String status : List.of("PROCESSED", "PROCESSING", "UNKNOWN")) {
            event.setProcessingStatus(status);
            paymentEventOutboxService.dispatchPendingEvents();
        }
        event.setProcessingStatus("PENDING");
        event.setNextAttemptAt(LocalDateTime.now().plusDays(1));
        paymentEventOutboxService.dispatchPendingEvents();
        assertThat(paymentEventOutboxService.publishCount).isZero();
        Mockito.verify(paymentEventOutboxRepository, Mockito.times(4)).findForDispatchById(event.getId());
        Mockito.verify(paymentEventOutboxRepository, Mockito.times(4)).findDueEvents(
                ArgumentMatchers.eq(List.of("PENDING", "FAILED")), ArgumentMatchers.any(),
                ArgumentMatchers.argThat((Pageable page) -> page.getPageSize() == 20 && page.getPageNumber() == 0));
        assertThat(PaymentEventOutboxRepository.class.getMethod("findForDispatchById", Long.class)
                .getAnnotation(Lock.class).value()).isEqualTo(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
    }

    @Test
    void retryDelayDoublesWithBoundedJitterAndHardCapEvenForVeryLargeAttemptCounts() {
        for (int attempt = 1; attempt <= 12; attempt++) {
            long expected = Math.min(300000L, 5000L << (attempt - 1));
            for (int sample = 0; sample < 100; sample++) {
                assertThat(paymentEventOutboxService.retryDelayMillis(attempt))
                        .isBetween((long) (expected * 0.8), expected);
            }
        }
        assertThat(paymentEventOutboxService.retryDelayMillis(Integer.MAX_VALUE)).isBetween(240000L, 300000L);
    }

    @Test
    void retryConfigurationRejectsInvalidBoundsAndUsesConfiguredValues() {
        ReflectionTestUtils.setField(paymentEventOutboxService, "retryInitialDelayMs", 0L);
        assertThatThrownBy(paymentEventOutboxService::validateRetryConfiguration)
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("positive");
        ReflectionTestUtils.setField(paymentEventOutboxService, "retryInitialDelayMs", 1000L);
        ReflectionTestUtils.setField(paymentEventOutboxService, "retryMaxDelayMs", 999L);
        assertThatThrownBy(paymentEventOutboxService::validateRetryConfiguration)
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("max");
        ReflectionTestUtils.setField(paymentEventOutboxService, "retryMaxDelayMs", 4000L);
        assertThat(paymentEventOutboxService.retryDelayMillis(1)).isBetween(800L, 1000L);
        assertThat(paymentEventOutboxService.retryDelayMillis(2)).isBetween(1600L, 2000L);
        assertThat(paymentEventOutboxService.retryDelayMillis(100)).isBetween(3200L, 4000L);
    }

    @Test
    void dispatchPendingEventsHandlesQuotedJsonPayloads() {
        PaymentOrder order = paymentOrder();

        paymentEventOutboxService.queueWalletEvent("payment-captured", order, order.getCustomerUserPublicId(), order.getCustomerChargeAmount());

        PaymentEventOutbox persisted = savedEvent.get();
        persisted.setProcessingStatus(PaymentEventOutboxService.STATUS_PENDING);
        persisted.setProcessedAt(null);
        persisted.setPayloadJson("\"" + persisted.getPayloadJson().replace("\\", "\\\\").replace("\"", "\\\"") + "\"");

        paymentEventOutboxService.dispatchPendingEvents();

        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(PaymentEventOutboxService.STATUS_PROCESSED);
        assertThat(savedEvent.get().getProcessedAt()).isNotNull();
    }

    private static PaymentOrder paymentOrder() {
        PaymentOrder order = new PaymentOrder();
        order.setPublicId("payment-order-1");
        order.setMarketplaceOrderPublicId("marketplace-order-1");
        order.setCustomerUserPublicId("customer-1");
        order.setProviderAccountPublicId("provider-1");
        order.setCurrencyCode("USD");
        order.setCustomerChargeAmount(BigDecimal.valueOf(100));
        order.setPlatformFeeAmount(BigDecimal.valueOf(5));
        order.setProviderPayableAmount(BigDecimal.valueOf(95));
        order.setPaymentProvider("mock");
        order.setPaymentStatus("CAPTURED");
        order.setPayoutEligibilityStatus("ON_HOLD");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return order;
    }

    /**
     * Test-only outbox service that suppresses live wallet transport.
     */
    private static final class TestablePaymentEventOutboxService extends PaymentEventOutboxService {
        private boolean fail;
        private int publishCount;
        private TestablePaymentEventOutboxService(PaymentEventOutboxRepository paymentEventOutboxRepository,
                                                  ObjectMapper objectMapper,
                                                  PlatformTransactionManager transactionManager,
                                                  String walletInternalUrl,
                                                  String internalServiceToken) {
            super(paymentEventOutboxRepository, objectMapper, transactionManager, walletInternalUrl, internalServiceToken);
        }

        @Override
        protected void publishWalletEvent(String path, WalletEventPayload payload) {
            publishCount++;
            if (fail) {
                throw new IllegalStateException("Simulated wallet failure");
            }
        }
    }
}

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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that payment outbox rows are stored durably and processed into wallet events.
 */
@ExtendWith(MockitoExtension.class)
class PaymentEventOutboxServiceTest {
    private PaymentEventOutboxRepository paymentEventOutboxRepository;
    private PlatformTransactionManager transactionManager;
    private PaymentEventOutboxService paymentEventOutboxService;
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
        when(transactionManager.getTransaction(ArgumentMatchers.any())).thenReturn(transactionStatus);
        doNothing().when(transactionManager).commit(ArgumentMatchers.any());
        when(paymentEventOutboxRepository.findByEventId(ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty());
        when(paymentEventOutboxRepository.save(ArgumentMatchers.any())).thenAnswer(invocation -> {
            PaymentEventOutbox event = invocation.getArgument(0);
            if (event.getId() == null) {
                event.setId(sequence.getAndIncrement());
            }
            savedEvent.set(event);
            return event;
        });
        when(paymentEventOutboxRepository.findTop20ByProcessingStatusInOrderByCreatedAtAsc(ArgumentMatchers.any()))
                .thenAnswer(invocation -> savedEvent.get() == null ? List.of() : List.of(savedEvent.get()));
        when(paymentEventOutboxRepository.findById(ArgumentMatchers.anyLong()))
                .thenAnswer(invocation -> Optional.ofNullable(savedEvent.get()));
    }

    @Test
    void queueWalletEventPersistsAndProcessesCapturedPaymentEvent() {
        PaymentOrder order = paymentOrder();

        paymentEventOutboxService.queueWalletEvent("payment-captured", order, order.getCustomerUserPublicId(), order.getCustomerChargeAmount());

        assertThat(savedEvent.get()).isNotNull();
        assertThat(savedEvent.get().getEventType()).isEqualTo("payment-captured");
        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(PaymentEventOutboxService.STATUS_PROCESSED);
        assertThat(savedEvent.get().getProcessedAt()).isNotNull();
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
        private TestablePaymentEventOutboxService(PaymentEventOutboxRepository paymentEventOutboxRepository,
                                                  ObjectMapper objectMapper,
                                                  PlatformTransactionManager transactionManager,
                                                  String walletInternalUrl,
                                                  String internalServiceToken) {
            super(paymentEventOutboxRepository, objectMapper, transactionManager, walletInternalUrl, internalServiceToken);
        }

        @Override
        protected void publishWalletEvent(String path, WalletEventPayload payload) {
            // Suppressed in unit tests so the outbox transition can be verified without a live wallet service.
        }
    }
}

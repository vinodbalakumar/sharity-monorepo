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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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
        marketplaceEventOutboxService = new TestableMarketplaceEventOutboxService(marketplaceEventOutboxRepository,
                new ObjectMapper(), transactionManager, "http://payment-service:8080/payment-service",
                "internal-token");
        savedEvent = new AtomicReference<>();
        sequence = new AtomicLong(1L);
        TransactionStatus transactionStatus = mock(TransactionStatus.class);
        when(transactionManager.getTransaction(ArgumentMatchers.any())).thenReturn(transactionStatus);
        doNothing().when(transactionManager).commit(ArgumentMatchers.any());
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
        when(marketplaceEventOutboxRepository.findTop20ByProcessingStatusInOrderByCreatedAtAsc(ArgumentMatchers.any()))
                .thenAnswer(invocation -> savedEvent.get() == null ? List.of() : List.of(savedEvent.get()));
        when(marketplaceEventOutboxRepository.findById(ArgumentMatchers.anyLong()))
                .thenAnswer(invocation -> Optional.ofNullable(savedEvent.get()));
    }

    @Test
    void queuePaymentOrderCreatePersistsAndProcessesOrderCommand() {
        OrderHeader order = order("marketplace-order-1", BigDecimal.valueOf(125.00));

        marketplaceEventOutboxService.queuePaymentOrderCreate(order);

        assertThat(savedEvent.get()).isNotNull();
        assertThat(savedEvent.get().getEventType()).isEqualTo("payment-order-create-requested");
        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED);
        assertThat(savedEvent.get().getProcessedAt()).isNotNull();
    }

    @Test
    void queueRefundRequestPersistsAndProcessesRefundCommand() {
        OrderHeader order = order("marketplace-order-2", BigDecimal.valueOf(88.00));

        marketplaceEventOutboxService.queueRefundRequest(order, "refund requested for test");

        assertThat(savedEvent.get()).isNotNull();
        assertThat(savedEvent.get().getEventType()).isEqualTo("payment-refund-requested");
        assertThat(savedEvent.get().getProcessingStatus()).isEqualTo(MarketplaceEventOutboxService.STATUS_PROCESSED);
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

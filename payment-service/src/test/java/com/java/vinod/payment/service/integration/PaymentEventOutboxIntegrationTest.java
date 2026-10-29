package com.java.vinod.payment.service.integration;

import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.repository.PaymentEventOutboxRepository;
import com.java.vinod.payment.service.service.PaymentEventOutboxService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest(properties = "app.payment.demo-transactions-enabled=true")
@ActiveProfiles("test")
class PaymentEventOutboxIntegrationTest extends IntegrationTestSupport {
    @Autowired
    private PaymentEventOutboxRepository repository;
    @Autowired
    private PaymentEventOutboxService service;
    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void dueQueryFiltersDeadlinesAndStatusesWithStableOrderingAndBatchLimit() {
        LocalDateTime now = LocalDateTime.now();
        PaymentEventOutbox first = row("PENDING", null, now.minusHours(1));
        PaymentEventOutbox second = row("FAILED", now.minusSeconds(1), first.getCreatedAt());
        row("FAILED", now.plusHours(1), now.minusHours(2));
        row("PROCESSED", null, now.minusHours(2));
        row("PROCESSING", null, now.minusHours(2));

        assertThat(repository.findDueEvents(List.of("PENDING", "FAILED"), now, PageRequest.of(0, 20)))
                .extracting(PaymentEventOutbox::getId).containsExactly(first.getId(), second.getId());

        for (int i = 0; i < 25; i++) {
            row("PENDING", null, now.plusSeconds(i));
        }
        assertThat(repository.findDueEvents(List.of("PENDING", "FAILED"), now, PageRequest.of(0, 20)))
                .hasSize(20).extracting(PaymentEventOutbox::getId).startsWith(first.getId(), second.getId());
    }

    @Test
    void walletFailurePersistsBackoffAndDueReplaySucceedsWithoutResettingHistory() {
        PaymentOrder order = new PaymentOrder();
        order.setPublicId("retry-order");
        order.setMarketplaceOrderPublicId("retry-marketplace-order");
        order.setCurrencyCode("USD");
        service.queueWalletEvent("payment-captured", order, "customer", BigDecimal.TEN);
        assertThat(WALLET_REQUESTS.get()).isZero();
        WALLET_STATUS.set(503);

        service.dispatchPendingEvents();

        PaymentEventOutbox failed = repository.findAll().getFirst();
        assertThat(failed.getProcessingStatus()).isEqualTo("FAILED");
        assertThat(failed.getAttemptCount()).isEqualTo(1);
        assertThat(failed.getNextAttemptAt()).isAfter(LocalDateTime.now());
        service.dispatchPendingEvents();
        assertThat(WALLET_REQUESTS.get()).isEqualTo(1);

        service.queueWalletEvent("payment-captured", order, "different-customer", BigDecimal.ONE);
        PaymentEventOutbox unchanged = repository.findById(failed.getId()).orElseThrow();
        assertThat(unchanged.getPayloadJson()).isEqualTo(failed.getPayloadJson());
        assertThat(unchanged.getNextAttemptAt()).isEqualTo(failed.getNextAttemptAt());
        assertThat(unchanged.getAttemptCount()).isEqualTo(1);
        unchanged.setNextAttemptAt(LocalDateTime.now().minusSeconds(1));
        repository.saveAndFlush(unchanged);
        WALLET_STATUS.set(200);
        service.dispatchPendingEvents();

        PaymentEventOutbox processed = repository.findById(failed.getId()).orElseThrow();
        assertThat(processed.getProcessingStatus()).isEqualTo("PROCESSED");
        assertThat(processed.getProcessedAt()).isNotNull();
        assertThat(processed.getNextAttemptAt()).isNull();
        assertThat(processed.getAttemptCount()).isEqualTo(1);
        assertThat(WALLET_REQUESTS.get()).isEqualTo(2);
    }

    @Test
    void dispatcherWaitsForRowLockAndRechecksCommittedStatusBeforeSending() throws Exception {
        PaymentEventOutbox event = row("PENDING", null, LocalDateTime.now());
        var executor = Executors.newSingleThreadExecutor();
        var dispatch = new AtomicReference<Future<?>>();
        var started = new CountDownLatch(1);
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                PaymentEventOutbox locked = repository.findForDispatchById(event.getId()).orElseThrow();
                dispatch.set(executor.submit(() -> {
                    started.countDown();
                    service.dispatchPendingEvents();
                }));
                try {
                    assertThat(started.await(5, TimeUnit.SECONDS)).isTrue();
                    assertThrows(TimeoutException.class, () -> dispatch.get().get(300, TimeUnit.MILLISECONDS));
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                assertThat(WALLET_REQUESTS.get()).isZero();
                locked.setProcessingStatus("PROCESSED");
                locked.setProcessedAt(LocalDateTime.now());
                repository.saveAndFlush(locked);
            });
            dispatch.get().get(5, TimeUnit.SECONDS);
            assertThat(WALLET_REQUESTS.get()).isZero();
        } finally {
            executor.shutdownNow();
        }
    }

    private PaymentEventOutbox row(String status, LocalDateTime nextAttempt, LocalDateTime createdAt) {
        PaymentEventOutbox event = new PaymentEventOutbox();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType("payment-captured");
        event.setAggregatePublicId(UUID.randomUUID().toString());
        event.setPayloadJson("{}");
        event.setProcessingStatus(status);
        event.setCreatedAt(createdAt);
        event.setNextAttemptAt(nextAttempt);
        return repository.saveAndFlush(event);
    }
}

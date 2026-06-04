package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Persists and loads wallet outbox rows for retryable payment-event delivery.
 */
public interface PaymentEventOutboxRepository extends JpaRepository<PaymentEventOutbox, Long> {
    Optional<PaymentEventOutbox> findByEventId(String eventId);

    List<PaymentEventOutbox> findTop20ByProcessingStatusInOrderByCreatedAtAsc(Collection<String> processingStatuses);
}

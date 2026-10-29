package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Persists and loads wallet outbox rows for retryable payment-event delivery.
 */
public interface PaymentEventOutboxRepository extends JpaRepository<PaymentEventOutbox, Long> {
    Optional<PaymentEventOutbox> findByEventId(String eventId);

    List<PaymentEventOutbox> findTop20ByProcessingStatusInOrderByCreatedAtAsc(Collection<String> processingStatuses);

    @Query("""
            select event from PaymentEventOutbox event
            where event.processingStatus in :statuses
              and (event.nextAttemptAt is null or event.nextAttemptAt <= :now)
            order by event.createdAt, event.id
            """)
    List<PaymentEventOutbox> findDueEvents(@Param("statuses") Collection<String> statuses,
                                         @Param("now") LocalDateTime now, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select event from PaymentEventOutbox event where event.id = :id")
    Optional<PaymentEventOutbox> findForDispatchById(@Param("id") Long id);
}

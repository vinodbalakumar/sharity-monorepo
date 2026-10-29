package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.MarketplaceEventOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Persists marketplace outbox commands until payment-service acknowledges them.
 */
public interface MarketplaceEventOutboxRepository extends JpaRepository<MarketplaceEventOutbox, Long> {
    Optional<MarketplaceEventOutbox> findByEventId(String eventId);

    List<MarketplaceEventOutbox> findTop20ByProcessingStatusInOrderByCreatedAtAsc(Collection<String> processingStatuses);

    @Query("select e from MarketplaceEventOutbox e where e.processingStatus in :statuses "
            + "and (e.nextAttemptAt is null or e.nextAttemptAt <= :now) order by e.createdAt, e.id")
    List<MarketplaceEventOutbox> findDueEvents(@Param("statuses") Collection<String> statuses,
                                              @Param("now") LocalDateTime now, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from MarketplaceEventOutbox e where e.id = :id")
    Optional<MarketplaceEventOutbox> findForDispatchById(@Param("id") Long id);
}

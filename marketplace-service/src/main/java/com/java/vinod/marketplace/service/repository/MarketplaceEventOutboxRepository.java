package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.MarketplaceEventOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Persists marketplace outbox commands until payment-service acknowledges them.
 */
public interface MarketplaceEventOutboxRepository extends JpaRepository<MarketplaceEventOutbox, Long> {
    Optional<MarketplaceEventOutbox> findByEventId(String eventId);

    List<MarketplaceEventOutbox> findTop20ByProcessingStatusInOrderByCreatedAtAsc(Collection<String> processingStatuses);
}

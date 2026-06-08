package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.DisputeEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeEventRepository extends JpaRepository<DisputeEvent, Long> {
    List<DisputeEvent> findByDisputeIdOrderByCreatedAtDesc(Long disputeId);

    List<DisputeEvent> findByDisputeIdAndVisibility(Long disputeId, String visibility);
}

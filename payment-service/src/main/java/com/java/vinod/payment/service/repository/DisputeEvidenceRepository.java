package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.DisputeEvidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisputeEvidenceRepository extends JpaRepository<DisputeEvidence, Long> {
    Optional<DisputeEvidence> findByEvidenceId(String evidenceId);

    List<DisputeEvidence> findByDisputeId(Long disputeId);

    long countByDisputeId(Long disputeId);
}

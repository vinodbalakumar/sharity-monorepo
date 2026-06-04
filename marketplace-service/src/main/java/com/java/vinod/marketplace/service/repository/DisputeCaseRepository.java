package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.DisputeCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisputeCaseRepository extends JpaRepository<DisputeCase, Long> {
    Optional<DisputeCase> findByPublicId(String publicId);

    boolean existsByOrder_IdAndResolvedAtIsNull(Long orderId);

    List<DisputeCase> findAllByOrderByOpenedAtDesc();
}

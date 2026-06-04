package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.DeliverySubmission;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliverySubmissionRepository extends JpaRepository<DeliverySubmission, Long> {
    boolean existsByOrder_Id(Long orderId);
}

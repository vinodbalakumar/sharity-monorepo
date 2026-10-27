package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.CustomerAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerAcceptanceRepository extends JpaRepository<CustomerAcceptance, Long> {
    boolean existsByOrder_Id(Long orderId);
}

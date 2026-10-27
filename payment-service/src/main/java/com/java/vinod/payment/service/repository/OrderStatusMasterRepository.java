package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.OrderStatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusMasterRepository extends JpaRepository<OrderStatusMaster, String> {
    List<OrderStatusMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

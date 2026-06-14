package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentStatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentStatusMasterRepository extends JpaRepository<PaymentStatusMaster, String> {
    List<PaymentStatusMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

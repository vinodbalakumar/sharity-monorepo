package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentMethodMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentMethodMasterRepository extends JpaRepository<PaymentMethodMaster, String> {
    List<PaymentMethodMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

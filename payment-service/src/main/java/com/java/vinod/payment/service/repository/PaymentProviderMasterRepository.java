package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentProviderMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentProviderMasterRepository extends JpaRepository<PaymentProviderMaster, String> {
    List<PaymentProviderMaster> findByActiveTrueOrderBySortOrderAscDisplayNameAsc();
}

package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.RefundReasonMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RefundReasonMasterRepository extends JpaRepository<RefundReasonMaster, String> {
    List<RefundReasonMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

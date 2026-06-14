package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.DisputeReasonMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DisputeReasonMasterRepository extends JpaRepository<DisputeReasonMaster, String> {
    List<DisputeReasonMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

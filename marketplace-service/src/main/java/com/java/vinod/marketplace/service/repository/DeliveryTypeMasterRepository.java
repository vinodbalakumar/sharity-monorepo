package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.DeliveryTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryTypeMasterRepository extends JpaRepository<DeliveryTypeMaster, String> {
    List<DeliveryTypeMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

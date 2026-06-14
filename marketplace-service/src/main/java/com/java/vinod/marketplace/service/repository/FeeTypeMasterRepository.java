package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.FeeTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeTypeMasterRepository extends JpaRepository<FeeTypeMaster, String> {
    List<FeeTypeMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.FeatureMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeatureMasterRepository extends JpaRepository<FeatureMaster, String> {
    List<FeatureMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

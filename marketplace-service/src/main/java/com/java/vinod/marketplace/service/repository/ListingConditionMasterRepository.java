package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.ListingConditionMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingConditionMasterRepository extends JpaRepository<ListingConditionMaster, String> {
    List<ListingConditionMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

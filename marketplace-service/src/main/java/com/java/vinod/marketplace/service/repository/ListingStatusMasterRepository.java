package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.ListingStatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingStatusMasterRepository extends JpaRepository<ListingStatusMaster, String> {
    List<ListingStatusMaster> findByCustomerVisibleTrueAndActiveTrueOrderBySortOrderAscDisplayLabelAsc();

    List<ListingStatusMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();

    Optional<ListingStatusMaster> findByStatusCodeIgnoreCase(String statusCode);

    boolean existsByStatusCodeIgnoreCaseAndActiveTrue(String statusCode);
}

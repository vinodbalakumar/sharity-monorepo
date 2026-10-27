package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.SellerStatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerStatusMasterRepository extends JpaRepository<SellerStatusMaster, String> {
    List<SellerStatusMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

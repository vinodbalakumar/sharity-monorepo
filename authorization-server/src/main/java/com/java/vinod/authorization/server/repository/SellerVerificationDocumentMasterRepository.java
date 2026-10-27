package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.SellerVerificationDocumentMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SellerVerificationDocumentMasterRepository extends JpaRepository<SellerVerificationDocumentMaster, String> {
    List<SellerVerificationDocumentMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

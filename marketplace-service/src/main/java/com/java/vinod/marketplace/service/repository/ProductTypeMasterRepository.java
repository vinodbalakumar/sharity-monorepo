package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.ProductTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductTypeMasterRepository extends JpaRepository<ProductTypeMaster, String> {
    List<ProductTypeMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();

    boolean existsByProductTypeCodeIgnoreCaseAndActiveTrue(String productTypeCode);
}

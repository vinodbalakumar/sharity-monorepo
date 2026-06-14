package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.SubcategoryMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubcategoryMasterRepository extends JpaRepository<SubcategoryMaster, Long> {
    List<SubcategoryMaster> findByActiveTrueOrderByDisplayOrderAscSubcategoryNameAsc();
    List<SubcategoryMaster> findByActiveTrueAndCountryCodeIsNullOrderByDisplayOrderAscSubcategoryNameAsc();
    List<SubcategoryMaster> findByActiveTrueAndCountryCodeOrderByDisplayOrderAscSubcategoryNameAsc(String countryCode);
    List<SubcategoryMaster> findByActiveTrueAndCategoryCodeOrderByDisplayOrderAscSubcategoryNameAsc(String categoryCode);
    List<SubcategoryMaster> findByActiveTrueAndCategoryCodeAndCountryCodeIsNullOrderByDisplayOrderAscSubcategoryNameAsc(String categoryCode);
    List<SubcategoryMaster> findByActiveTrueAndCategoryCodeAndCountryCodeOrderByDisplayOrderAscSubcategoryNameAsc(String categoryCode, String countryCode);
}

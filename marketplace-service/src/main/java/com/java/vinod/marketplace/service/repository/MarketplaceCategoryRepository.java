package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketplaceCategoryRepository extends JpaRepository<MarketplaceCategory, Long> {
    List<MarketplaceCategory> findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc();

    List<MarketplaceCategory> findByActiveTrueAndVerticalCodeOrderByDisplayOrderAscCategoryNameAsc(String verticalCode);

    List<MarketplaceCategory> findByActiveTrueAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc();

    List<MarketplaceCategory> findByActiveTrueAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(String countryCode);

    List<MarketplaceCategory> findByActiveTrueAndVerticalCodeAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc(String verticalCode);

    List<MarketplaceCategory> findByActiveTrueAndVerticalCodeAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(String verticalCode, String countryCode);
}

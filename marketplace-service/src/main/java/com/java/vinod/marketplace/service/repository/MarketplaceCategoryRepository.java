package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MarketplaceCategoryRepository extends JpaRepository<MarketplaceCategory, Long> {
    List<MarketplaceCategory> findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc();

    List<MarketplaceCategory> findByActiveTrueAndVerticalCodeOrderByDisplayOrderAscCategoryNameAsc(String verticalCode);

    List<MarketplaceCategory> findByActiveTrueAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc();

    List<MarketplaceCategory> findByActiveTrueAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(String countryCode);

    List<MarketplaceCategory> findByActiveTrueAndVerticalCodeAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc(String verticalCode);

    List<MarketplaceCategory> findByActiveTrueAndVerticalCodeAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(String verticalCode, String countryCode);

    Optional<MarketplaceCategory> findByCategoryCode(String categoryCode);

    List<MarketplaceCategory> findByCategoryCodeIn(Collection<String> categoryCodes);
}

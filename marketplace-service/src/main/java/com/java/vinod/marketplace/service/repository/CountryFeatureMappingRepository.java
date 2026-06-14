package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.CountryFeatureMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CountryFeatureMappingRepository extends JpaRepository<CountryFeatureMapping, Long> {
    List<CountryFeatureMapping> findByCountryCodeAndEnabledTrueOrderBySortOrderAsc(String countryCode);
}

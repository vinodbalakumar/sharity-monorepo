package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.SupportedCountry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportedCountryRepository extends JpaRepository<SupportedCountry, Long> {
    Optional<SupportedCountry> findByCountryCode(String countryCode);

    List<SupportedCountry> findAllByOrderByCountryNameAsc();
}

package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.ServiceModuleCountry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceModuleCountryRepository extends JpaRepository<ServiceModuleCountry, Long> {
    Optional<ServiceModuleCountry> findByModule_ModuleCodeAndCountry_CountryCode(String moduleCode, String countryCode);
}

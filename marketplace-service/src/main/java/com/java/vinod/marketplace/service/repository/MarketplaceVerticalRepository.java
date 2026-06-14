package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.MarketplaceVertical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarketplaceVerticalRepository extends JpaRepository<MarketplaceVertical, String> {
    List<MarketplaceVertical> findByStatusAndAvailableToCustomerTrueOrderByDisplayOrderAscModuleNameAsc(String status);

    Optional<MarketplaceVertical> findByModuleCodeIgnoreCase(String moduleCode);

    boolean existsByModuleCodeIgnoreCase(String moduleCode);
}

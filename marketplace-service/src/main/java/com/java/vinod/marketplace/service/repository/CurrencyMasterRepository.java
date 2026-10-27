package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.CurrencyMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CurrencyMasterRepository extends JpaRepository<CurrencyMaster, String> {
    List<CurrencyMaster> findByActiveTrueOrderBySortOrderAscCurrencyNameAsc();
}

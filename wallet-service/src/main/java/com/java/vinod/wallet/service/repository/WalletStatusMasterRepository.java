package com.java.vinod.wallet.service.repository;

import com.java.vinod.wallet.service.entity.WalletStatusMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletStatusMasterRepository extends JpaRepository<WalletStatusMaster, String> {
    List<WalletStatusMaster> findByActiveTrueOrderBySortOrderAscDisplayLabelAsc();
}

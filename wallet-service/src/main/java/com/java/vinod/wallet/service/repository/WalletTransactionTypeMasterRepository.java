package com.java.vinod.wallet.service.repository;

import com.java.vinod.wallet.service.entity.WalletTransactionTypeMaster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletTransactionTypeMasterRepository extends JpaRepository<WalletTransactionTypeMaster, String> {
    List<WalletTransactionTypeMaster> findByActiveTrueOrderBySortOrderAscSourceEventTypeAsc();

    Optional<WalletTransactionTypeMaster> findBySourceEventTypeIgnoreCaseAndActiveTrue(String sourceEventType);

    Optional<WalletTransactionTypeMaster> findByEntryTypeIgnoreCaseAndActiveTrue(String entryType);
}

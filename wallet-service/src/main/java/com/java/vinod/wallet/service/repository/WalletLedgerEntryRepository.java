package com.java.vinod.wallet.service.repository;

import com.java.vinod.wallet.service.entity.WalletLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {
    List<WalletLedgerEntry> findByWalletAccount_OwnerTypeAndWalletAccount_OwnerPublicIdOrderByCreatedAtDesc(String ownerType, String ownerPublicId);

    List<WalletLedgerEntry> findAllByOrderByCreatedAtDesc();

    boolean existsBySourceServiceAndSourceEventIdAndEntryType(String sourceService, String sourceEventId, String entryType);
}

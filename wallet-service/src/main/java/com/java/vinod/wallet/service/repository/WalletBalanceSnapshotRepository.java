package com.java.vinod.wallet.service.repository;

import com.java.vinod.wallet.service.entity.WalletBalanceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletBalanceSnapshotRepository extends JpaRepository<WalletBalanceSnapshot, Long> {
    Optional<WalletBalanceSnapshot> findByWalletAccount_Id(Long walletAccountId);
}

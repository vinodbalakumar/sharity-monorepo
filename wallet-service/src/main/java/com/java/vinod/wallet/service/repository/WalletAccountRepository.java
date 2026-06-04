package com.java.vinod.wallet.service.repository;

import com.java.vinod.wallet.service.entity.WalletAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletAccountRepository extends JpaRepository<WalletAccount, Long> {
    Optional<WalletAccount> findByOwnerTypeAndOwnerPublicIdAndCurrencyCode(String ownerType, String ownerPublicId, String currencyCode);

    List<WalletAccount> findAllByOrderByCreatedAtDesc();
}

package com.java.vinod.wallet.service.repository;

import com.java.vinod.wallet.service.entity.WalletEventInbox;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletEventInboxRepository extends JpaRepository<WalletEventInbox, Long> {
    boolean existsBySourceEventId(String sourceEventId);
}

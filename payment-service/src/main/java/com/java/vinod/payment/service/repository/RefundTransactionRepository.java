package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.RefundTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefundTransactionRepository extends JpaRepository<RefundTransaction, Long> {
    List<RefundTransaction> findAllByOrderByCreatedAtDesc();

    Optional<RefundTransaction> findTopByPaymentOrder_MarketplaceOrderPublicIdOrderByCreatedAtDesc(String marketplaceOrderPublicId);
}

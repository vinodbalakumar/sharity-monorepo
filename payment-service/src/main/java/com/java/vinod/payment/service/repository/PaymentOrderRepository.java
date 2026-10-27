package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {
    Optional<PaymentOrder> findByPublicId(String publicId);

    Optional<PaymentOrder> findByMarketplaceOrderPublicId(String marketplaceOrderPublicId);

    List<PaymentOrder> findByCustomerUserPublicIdOrderByCreatedAtDesc(String customerUserPublicId);

    List<PaymentOrder> findAllByOrderByCreatedAtDesc();
}

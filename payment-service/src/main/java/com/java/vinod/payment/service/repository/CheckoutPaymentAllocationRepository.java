package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.CheckoutPaymentAllocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CheckoutPaymentAllocationRepository extends JpaRepository<CheckoutPaymentAllocation, Long> {
    List<CheckoutPaymentAllocation> findByCheckoutPayment_IdOrderByLineNumberAsc(Long checkoutPaymentId);

    Optional<CheckoutPaymentAllocation> findByCheckoutPayment_IdAndMarketplaceOrderPublicId(Long checkoutPaymentId,
                                                                                           String marketplaceOrderPublicId);

    boolean existsByMarketplaceOrderPublicId(String marketplaceOrderPublicId);
}

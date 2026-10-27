package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.ProviderPayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderPayoutRepository extends JpaRepository<ProviderPayout, Long> {
    Optional<ProviderPayout> findByPublicId(String publicId);

    Optional<ProviderPayout> findByPaymentOrder_MarketplaceOrderPublicId(String marketplaceOrderPublicId);

    List<ProviderPayout> findByProviderAccountPublicIdOrderByCreatedAtDesc(String providerAccountPublicId);

    List<ProviderPayout> findByPayoutStatusOrderByCreatedAtDesc(String payoutStatus);

    List<ProviderPayout> findAllByOrderByCreatedAtDesc();
}

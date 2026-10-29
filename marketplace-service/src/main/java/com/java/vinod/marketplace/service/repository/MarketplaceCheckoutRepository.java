package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface MarketplaceCheckoutRepository extends JpaRepository<MarketplaceCheckout, Long> {
    Optional<MarketplaceCheckout> findByCustomerUserPublicIdAndIdempotencyKey(String customerUserPublicId, String idempotencyKey);

    Optional<MarketplaceCheckout> findByPublicId(String publicId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from MarketplaceCheckout c where c.publicId = :publicId")
    Optional<MarketplaceCheckout> findByPublicIdForUpdate(@Param("publicId") String publicId);

    boolean existsByPublicId(String publicId);
}
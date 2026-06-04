package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.OrderHeader;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderHeaderRepository extends JpaRepository<OrderHeader, Long> {
    Optional<OrderHeader> findByPublicId(String publicId);

    List<OrderHeader> findByCustomerUserPublicIdOrderByCreatedAtDesc(String customerUserPublicId);

    List<OrderHeader> findByProviderAccountPublicIdOrderByCreatedAtDesc(String providerAccountPublicId);

    List<OrderHeader> findAllByOrderByCreatedAtDesc();
}

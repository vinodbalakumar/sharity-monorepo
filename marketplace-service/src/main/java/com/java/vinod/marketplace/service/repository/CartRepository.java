package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByCartId(String cartId);

    Optional<Cart> findByCustomerIdAndCartStatus(String customerId, String cartStatus);

    @Query("SELECT c FROM Cart c WHERE c.customerId = :customerId AND c.cartStatus = 'ACTIVE' ORDER BY c.lastModifiedAt DESC LIMIT 1")
    Optional<Cart> findActiveCartForCustomer(@Param("customerId") String customerId);
}

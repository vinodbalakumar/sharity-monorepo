package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartItemId(String cartItemId);

    List<CartItem> findByCartCartId(String cartId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM CartItem i WHERE i.cart.cartId = :cartId ORDER BY i.id ASC")
    List<CartItem> findByCartIdForUpdate(@Param("cartId") String cartId);

    Optional<CartItem> findByCartCartIdAndListingId(String cartId, String listingId);
}

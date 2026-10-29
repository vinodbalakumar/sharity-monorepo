package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface OrderHeaderRepository extends JpaRepository<OrderHeader, Long> {
    Optional<OrderHeader> findByPurchaseRequestKey(String purchaseRequestKey);
    Optional<OrderHeader> findByPublicId(String publicId);

    List<OrderHeader> findByCheckout_IdOrderByIdAsc(Long checkoutId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c from MarketplaceCheckout c where c.id in
            (select o.checkout.id from OrderHeader o where o.publicId = :orderPublicId)
            """)
    Optional<MarketplaceCheckout> lockCheckoutByOrderPublicId(@Param("orderPublicId") String orderPublicId);

    boolean existsByPublicIdAndCheckoutIsNotNull(String publicId);

    List<OrderHeader> findByCustomerUserPublicIdOrderByCreatedAtDesc(String customerUserPublicId);

    List<OrderHeader> findByProviderAccountPublicIdOrderByCreatedAtDesc(String providerAccountPublicId);

    List<OrderHeader> findAllByOrderByCreatedAtDesc();

    @Query("""
            SELECT l.publicId AS listingPublicId, COUNT(o.id) AS completedCount
            FROM OrderHeader o
            JOIN o.listing l
            WHERE o.completedAt IS NOT NULL OR UPPER(o.orderStatus) = 'COMPLETED'
            GROUP BY l.publicId
            """)
    List<ListingSelectionCountView> countCompletedOrdersByListingPublicId();

    interface ListingSelectionCountView {
        String getListingPublicId();
        Long getCompletedCount();
    }
}

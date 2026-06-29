package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.OrderHeader;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderHeaderRepository extends JpaRepository<OrderHeader, Long> {
    Optional<OrderHeader> findByPublicId(String publicId);

    List<OrderHeader> findByCustomerUserPublicIdOrderByCreatedAtDesc(String customerUserPublicId);

    List<OrderHeader> findByProviderAccountPublicIdOrderByCreatedAtDesc(String providerAccountPublicId);

    List<OrderHeader> findAllByOrderByCreatedAtDesc();

    @Query("""
            SELECT o.listing.publicId AS listingPublicId, COUNT(o) AS completedCount
            FROM OrderHeader o
            WHERE o.completedAt IS NOT NULL OR UPPER(o.orderStatus) = 'COMPLETED'
            GROUP BY o.listing.publicId
            """)
    List<ListingSelectionCountView> countCompletedOrdersByListingPublicId();

    interface ListingSelectionCountView {
        String getListingPublicId();
        long getCompletedCount();
    }
}

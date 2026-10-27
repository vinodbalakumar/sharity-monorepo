package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Listing l where l.publicId = :publicId")
    Optional<Listing> findForPurchase(@Param("publicId") String publicId);
    Optional<Listing> findByPublicId(String publicId);

    List<Listing> findByListingStatusInOrderByCreatedAtDesc(List<String> listingStatuses);

    List<Listing> findTop24ByListingStatusInOrderByCreatedAtDesc(List<String> listingStatuses);

    List<Listing> findByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(List<String> listingStatuses, String verticalCode);

    List<Listing> findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(List<String> listingStatuses, String verticalCode);

    List<Listing> findByListingStatusInAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                 String providerCountryCode);

    List<Listing> findTop24ByListingStatusInAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                       String providerCountryCode);

    List<Listing> findByListingStatusInAndVerticalCodeAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                                String verticalCode,
                                                                                                String providerCountryCode);

    List<Listing> findTop24ByListingStatusInAndVerticalCodeAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                                     String verticalCode,
                                                                                                     String providerCountryCode);

    List<Listing> findByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(List<String> listingStatuses);

    List<Listing> findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(List<String> listingStatuses);

    List<Listing> findByListingStatusInAndFeaturedTrueAndProviderCountryCodeOrderByUpdatedAtDesc(List<String> listingStatuses,
                                                                                                String providerCountryCode);

    List<Listing> findTop8ByListingStatusInAndFeaturedTrueAndProviderCountryCodeOrderByUpdatedAtDesc(List<String> listingStatuses,
                                                                                                    String providerCountryCode);

    List<Listing> findByListingStatusInAndCategoryCodeOrderByCreatedAtDesc(List<String> listingStatuses, String categoryCode);

    List<Listing> findTop24ByListingStatusInAndCategoryCodeOrderByCreatedAtDesc(List<String> listingStatuses, String categoryCode);

    List<Listing> findByListingStatusInAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                                String categoryCode,
                                                                                                String providerCountryCode);

    List<Listing> findTop24ByListingStatusInAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                                     String categoryCode,
                                                                                                     String providerCountryCode);

    List<Listing> findByListingStatusInAndVerticalCodeAndCategoryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                       String verticalCode,
                                                                                       String categoryCode);

    List<Listing> findByListingStatusInAndVerticalCodeAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                                               String verticalCode,
                                                                                                               String categoryCode,
                                                                                                               String providerCountryCode);

    List<Listing> findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                              String verticalCode,
                                                                                              String categoryCode);

    List<Listing> findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(List<String> listingStatuses,
                                                                                                                      String verticalCode,
                                                                                                                      String categoryCode,
                                                                                                                      String providerCountryCode);

    List<Listing> findByProviderAccountPublicIdOrderByCreatedAtDesc(String providerAccountPublicId);

    List<Listing> findTop24ByProviderAccountPublicIdOrderByCreatedAtDesc(String providerAccountPublicId);

    List<Listing> findByPublicIdIn(Collection<String> publicIds);

    List<Listing> findByProviderAccountPublicIdInAndListingStatusInOrderByUpdatedAtDesc(Collection<String> providerAccountPublicIds,
                                                                                       List<String> listingStatuses);

    List<Listing> findByProviderAccountPublicIdInAndListingStatusInAndProviderCountryCodeOrderByUpdatedAtDesc(Collection<String> providerAccountPublicIds,
                                                                                                             List<String> listingStatuses,
                                                                                                             String providerCountryCode);

    long countByListingStatusInAndVerticalCode(List<String> listingStatuses, String verticalCode);

    long countByListingStatusInAndCategoryCode(List<String> listingStatuses, String categoryCode);

    long countByListingStatusIn(Collection<String> listingStatuses);

    long countByListingStatusInAndProviderCountryCode(Collection<String> listingStatuses, String providerCountryCode);

    @Query("""
            SELECT l
            FROM Listing l
            WHERE l.listingStatus IN :statuses
              AND l.rollbackOfferExpiresAt IS NOT NULL
              AND l.rollbackOfferExpiresAt > :now
              AND (:countryCode IS NULL OR l.providerCountryCode = :countryCode)
            ORDER BY l.rollbackOfferExpiresAt ASC, l.updatedAt DESC
            """)
    List<Listing> findTopRollbackOfferListings(@Param("statuses") List<String> statuses,
                                               @Param("now") LocalDateTime now,
                                               @Param("countryCode") String countryCode,
                                               Pageable pageable);

    @Query(value = """
            SELECT *
            FROM listing l
            WHERE l.listing_status IN (:statuses)
              AND l.created_at < :cutoff
              AND l.original_price_amount IS NOT NULL
              AND l.price_amount IS NOT NULL
              AND l.original_price_amount > l.price_amount
              AND ((l.original_price_amount - l.price_amount) / NULLIF(l.original_price_amount, 0)) >= 0.50
              AND (:countryCode IS NULL OR l.provider_country_code = :countryCode)
            ORDER BY ((l.original_price_amount - l.price_amount) / NULLIF(l.original_price_amount, 0)) DESC,
                     l.created_at ASC,
                     l.updated_at DESC
            LIMIT 20
            """, nativeQuery = true)
    List<Listing> findTopClearanceListings(@Param("statuses") List<String> statuses,
                                           @Param("cutoff") LocalDateTime cutoff,
                                           @Param("countryCode") String countryCode);

    @Query(value = """
            SELECT *
            FROM listing l
            WHERE l.listing_status IN (:statuses)
              AND l.original_price_amount IS NOT NULL
              AND l.price_amount IS NOT NULL
              AND l.original_price_amount > l.price_amount
              AND (:countryCode IS NULL OR l.provider_country_code = :countryCode)
            ORDER BY ((l.original_price_amount - l.price_amount) / NULLIF(l.original_price_amount, 0)) DESC,
                     l.updated_at DESC
            LIMIT 20
            """, nativeQuery = true)
    List<Listing> findTopDiscountedListings(@Param("statuses") List<String> statuses,
                                            @Param("countryCode") String countryCode);

    interface HomepageCategoryAggregateView {
        String getCategoryCode();

        Long getSoldCount();

        Long getActiveCount();

        Integer getMaxDiscountPercent();
    }

    @Query("""
            SELECT l.categoryCode AS categoryCode,
                   SUM(CASE WHEN UPPER(l.listingStatus) = 'SOLD' THEN 1 ELSE 0 END) AS soldCount,
                   SUM(CASE WHEN l.listingStatus IN :publicStatuses THEN 1 ELSE 0 END) AS activeCount,
                   MAX(CASE WHEN l.originalPriceAmount IS NOT NULL
                              AND l.priceAmount IS NOT NULL
                              AND l.originalPriceAmount > l.priceAmount
                            THEN FLOOR(((l.originalPriceAmount - l.priceAmount) * 100.0) / l.originalPriceAmount)
                            ELSE 0 END) AS maxDiscountPercent
            FROM Listing l
            WHERE l.categoryCode IS NOT NULL
              AND l.categoryCode <> ''
              AND (:countryCode IS NULL OR l.providerCountryCode = :countryCode)
            GROUP BY l.categoryCode
            ORDER BY SUM(CASE WHEN UPPER(l.listingStatus) = 'SOLD' THEN 1 ELSE 0 END) DESC,
                     SUM(CASE WHEN l.listingStatus IN :publicStatuses THEN 1 ELSE 0 END) DESC,
                     MAX(l.updatedAt) DESC
            """)
    List<HomepageCategoryAggregateView> findHomepageCategoryAggregates(@Param("publicStatuses") List<String> publicStatuses,
                                                                       @Param("countryCode") String countryCode,
                                                                       Pageable pageable);

    interface ListingSelectionCountView {
        String getListingPublicId();
        Long getCompletedCount();
    }

    @Query("""
            SELECT l FROM Listing l
            WHERE l.listingStatus IN :statuses
              AND (:verticalCode IS NULL OR l.verticalCode = :verticalCode)
              AND (:categoryCode IS NULL OR l.categoryCode = :categoryCode)
              AND (:countryCode IS NULL OR l.providerCountryCode = :countryCode)
              AND (
                    LOWER(l.title) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(COALESCE(l.description, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  )
            ORDER BY l.createdAt DESC
            """)
    List<Listing> searchActiveListings(@Param("statuses") List<String> statuses,
                                       @Param("query") String query,
                                       @Param("categoryCode") String categoryCode,
                                       @Param("verticalCode") String verticalCode,
                                       @Param("countryCode") String countryCode,
                                       Pageable pageable);

    @Query("""
            SELECT l.publicId AS listingPublicId, COUNT(o.id) AS completedCount
            FROM OrderHeader o
            JOIN o.listing l
            WHERE (o.completedAt IS NOT NULL OR UPPER(o.orderStatus) = 'COMPLETED')
              AND l.listingStatus IN :statuses
              AND (:countryCode IS NULL OR l.providerCountryCode = :countryCode)
            GROUP BY l.publicId
            ORDER BY COUNT(o.id) DESC, MAX(o.completedAt) DESC, MAX(o.createdAt) DESC
            """)
    List<ListingSelectionCountView> findTopCompletedOrdersByListingPublicId(@Param("statuses") List<String> statuses,
                                                                            @Param("countryCode") String countryCode,
                                                                            Pageable pageable);
}

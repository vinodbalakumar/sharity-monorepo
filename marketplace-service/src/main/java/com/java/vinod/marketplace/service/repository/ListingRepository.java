package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {
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
}

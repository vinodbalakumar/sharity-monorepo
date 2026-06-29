package com.java.vinod.marketplace.service.repository;

import com.java.vinod.marketplace.service.entity.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, Integer> {

    Optional<SellerProfile> findByProviderAccountPublicId(String providerAccountPublicId);

    List<SellerProfile> findByProviderAccountPublicIdIn(Collection<String> providerAccountPublicIds);

    List<SellerProfile> findByVerificationStatusOrderBySellerRatingDescCompletedOrdersDesc(
        SellerProfile.VerificationStatus verificationStatus);

    List<SellerProfile> findByVerificationStatusAndActiveTrueOrderBySellerRatingDescCompletedOrdersDesc(
        SellerProfile.VerificationStatus verificationStatus);

    @Query("SELECT sp FROM SellerProfile sp WHERE sp.verificationStatus IN ('VERIFIED', 'PREMIUM') AND sp.active = TRUE " +
           "ORDER BY sp.sellerRating DESC, sp.completedOrders DESC")
    List<SellerProfile> findTopVerifiedSellers();

    List<SellerProfile> findByActiveTrueOrderBySellerRatingDescCompletedOrdersDesc();
}

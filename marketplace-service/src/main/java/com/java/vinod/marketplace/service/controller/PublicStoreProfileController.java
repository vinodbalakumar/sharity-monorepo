package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.PublicStoreProfileDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PublicStoreProfileController {
    @GetMapping("/api/public/stores/{sellerStoreId}")
    public PublicStoreProfileDtos.SellerPublicStoreResponse store(@PathVariable String sellerStoreId) {
        return PublicStoreProfileDtos.store(sellerStoreId);
    }

    @GetMapping("/api/public/stores/{sellerStoreId}/listings")
    public PublicStoreProfileDtos.StoreListingsResponse listings(@PathVariable String sellerStoreId) {
        return PublicStoreProfileDtos.listings(sellerStoreId);
    }

    @GetMapping("/api/public/stores/{sellerStoreId}/policies")
    public PublicStoreProfileDtos.StorePolicySummaryResponse policies(@PathVariable String sellerStoreId) {
        return PublicStoreProfileDtos.policies(sellerStoreId);
    }

    @GetMapping("/api/public/stores/{sellerStoreId}/reviews")
    public PublicStoreProfileDtos.StoreReviewsPlaceholderResponse reviews(@PathVariable String sellerStoreId) {
        return PublicStoreProfileDtos.reviews(sellerStoreId);
    }

    @GetMapping("/api/public/buyers/{buyerAliasId}")
    public PublicStoreProfileDtos.BuyerLimitedPublicProfileResponse buyer(@PathVariable String buyerAliasId) {
        return PublicStoreProfileDtos.buyer(buyerAliasId);
    }

    @GetMapping("/api/seller/store/public-preview")
    public PublicStoreProfileDtos.StoreOwnerPreviewResponse ownerPreview() {
        return PublicStoreProfileDtos.ownerPreview("store-1000");
    }

    @GetMapping("/api/public/profiles/{profileType}/{profileId}/messaging-availability")
    public PublicStoreProfileDtos.SafeMessagingAvailability messaging(@PathVariable String profileId) {
        return PublicStoreProfileDtos.messaging(profileId);
    }

    @PostMapping({"/api/public/profiles/report", "/api/public/stores/{sellerStoreId}/listings/{listingId}/report",
            "/api/public/profiles/{profileType}/{profileId}/block-messaging",
            "/api/admin/public-profiles/reports/{reportId}/resolve"})
    public PublicStoreProfileDtos.PublicProfileActionResponse action() {
        return PublicStoreProfileDtos.action("Public profile mock action accepted.");
    }

    @PostMapping("/api/public/profiles/{profileType}/{profileId}/share-link")
    public PublicStoreProfileDtos.ShareLinkResponse share(@PathVariable String profileType, @PathVariable String profileId) {
        return PublicStoreProfileDtos.share(profileType, profileId);
    }

    @GetMapping("/api/admin/public-profiles/reports")
    public List<PublicStoreProfileDtos.AdminPublicProfileReportItem> reports() {
        return PublicStoreProfileDtos.adminReports();
    }

    @GetMapping("/api/admin/public-profiles/reports/{reportId}")
    public PublicStoreProfileDtos.AdminPublicProfileReportItem report(@PathVariable String reportId) {
        return PublicStoreProfileDtos.adminReports().get(0);
    }

    @GetMapping("/api/admin/stores/{sellerStoreId}/moderation-preview")
    public PublicStoreProfileDtos.SellerPublicStoreResponse moderationPreview(@PathVariable String sellerStoreId) {
        return PublicStoreProfileDtos.store(sellerStoreId);
    }
}

package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.ProductListingDetailDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductListingDetailMockController {
    @GetMapping({"/api/listings/{listingId}", "/l/{listingId}"})
    public ProductListingDetailDtos.ListingDetailResponse listing(@PathVariable String listingId) {
        return ProductListingDetailDtos.detail(listingId, false);
    }

    @GetMapping({"/api/listings/slug/{listingSlug}", "/p/{listingSlug}", "/m/{marketplaceCode}/p/{listingSlug}"})
    public ProductListingDetailDtos.ListingDetailResponse slug(@PathVariable String listingSlug) {
        return ProductListingDetailDtos.detail("listing-1001", false);
    }

    @GetMapping("/api/seller/listings/{listingId}/preview")
    public ProductListingDetailDtos.ListingDetailResponse ownerPreview(@PathVariable String listingId) {
        return ProductListingDetailDtos.detail(listingId, true);
    }

    @GetMapping("/api/listings/{listingId}/coupons")
    public List<ProductListingDetailDtos.ListingCouponItem> coupons(@PathVariable String listingId) {
        return ProductListingDetailDtos.coupons();
    }

    @GetMapping("/api/listings/{listingId}/digital-delivery-summary")
    public ProductListingDetailDtos.ListingDigitalDeliverySummary digitalDelivery(@PathVariable String listingId) {
        return ProductListingDetailDtos.digitalDelivery();
    }

    @GetMapping("/api/listings/{listingId}/policy-summary")
    public ProductListingDetailDtos.ListingPolicySummary policy(@PathVariable String listingId) {
        return ProductListingDetailDtos.policy();
    }

    @GetMapping("/api/listings/{listingId}/reviews-summary")
    public ProductListingDetailDtos.ListingReviewsSummary reviews(@PathVariable String listingId) {
        return ProductListingDetailDtos.reviews();
    }

    @GetMapping("/api/listings/{listingId}/similar")
    public List<ProductListingDetailDtos.ListingSimilarItem> similar(@PathVariable String listingId) {
        return ProductListingDetailDtos.similar();
    }

    @PostMapping("/api/listings/{listingId}/save")
    public ProductListingDetailDtos.ListingActionResponse save(@PathVariable String listingId) {
        return ProductListingDetailDtos.action("Listing saved.", "/saved");
    }

    @DeleteMapping("/api/listings/{listingId}/save")
    public ProductListingDetailDtos.ListingActionResponse unsave(@PathVariable String listingId) {
        return ProductListingDetailDtos.action("Listing removed from saved items.", "/saved");
    }

    @PostMapping("/api/listings/{listingId}/share-link")
    public ProductListingDetailDtos.ListingShareLinkResponse share(@PathVariable String listingId) {
        return ProductListingDetailDtos.share(listingId);
    }

    @GetMapping("/api/listings/{listingId}/messaging-availability")
    public ProductListingDetailDtos.ListingSafeMessagingAvailability messaging(@PathVariable String listingId) {
        return ProductListingDetailDtos.safeMessaging();
    }

    @PostMapping("/api/listings/{listingId}/add-to-cart")
    public ProductListingDetailDtos.AddListingToCartResponse addToCart(@PathVariable String listingId) {
        return ProductListingDetailDtos.addToCart(listingId);
    }

    @PostMapping({"/api/listings/{listingId}/report", "/api/seller/listings/{listingId}/pause",
            "/api/seller/listings/{listingId}/resume", "/api/seller/listings/{listingId}/mark-unavailable",
            "/api/seller/listings/{listingId}/archive", "/api/admin/listings/reports/{reportId}/resolve"})
    public ProductListingDetailDtos.ListingActionResponse action() {
        return ProductListingDetailDtos.action("Listing mock action accepted.", null);
    }

    @GetMapping("/api/seller/listings/{listingId}/orders")
    public List<String> orders(@PathVariable String listingId) {
        return List.of("seller-order-1001 placeholder", "seller-order-1002 placeholder");
    }

    @GetMapping("/api/seller/listings/{listingId}/analytics")
    public ProductListingDetailDtos.SellerListingAnalyticsPlaceholder analytics(@PathVariable String listingId) {
        return ProductListingDetailDtos.analytics(listingId);
    }

    @GetMapping("/api/seller/listings/{listingId}/coupon-management")
    public List<ProductListingDetailDtos.ListingCouponItem> couponManagement(@PathVariable String listingId) {
        return ProductListingDetailDtos.coupons();
    }

    @GetMapping("/api/admin/listings/{listingId}/moderation")
    public ProductListingDetailDtos.ListingDetailResponse moderation(@PathVariable String listingId) {
        return ProductListingDetailDtos.detail(listingId, true);
    }

    @GetMapping("/api/admin/listings/reports")
    public List<ProductListingDetailDtos.AdminListingReportItem> reports() {
        return ProductListingDetailDtos.reports();
    }

    @GetMapping("/api/admin/listings/reports/{reportId}")
    public ProductListingDetailDtos.AdminListingReportItem report(@PathVariable String reportId) {
        return ProductListingDetailDtos.reports().get(0);
    }
}

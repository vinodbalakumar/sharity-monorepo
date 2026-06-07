package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.CategoryMarketplaceDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CategoryMarketplaceMockController {
    @GetMapping("/api/marketplaces")
    public CategoryMarketplaceDtos.MarketplaceDashboardResponse dashboard() {
        return CategoryMarketplaceDtos.dashboard();
    }

    @GetMapping({"/api/marketplaces/{marketplaceCode}", "/api/public/marketplaces/{marketplaceCode}"})
    public CategoryMarketplaceDtos.MarketplaceLandingResponse landing(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.landing(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/categories")
    public List<CategoryMarketplaceDtos.MarketplaceCategoryItem> categories(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.categories(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/categories/{categoryCode}")
    public CategoryMarketplaceDtos.MarketplaceLandingResponse category(@PathVariable String marketplaceCode,
                                                                       @PathVariable String categoryCode) {
        return CategoryMarketplaceDtos.landing(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/categories/{categoryCode}/subcategories/{subcategoryCode}")
    public CategoryMarketplaceDtos.MarketplaceLandingResponse subcategory(@PathVariable String marketplaceCode,
                                                                          @PathVariable String categoryCode,
                                                                          @PathVariable String subcategoryCode) {
        return CategoryMarketplaceDtos.landing(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/filters")
    public CategoryMarketplaceDtos.MarketplaceFilterConfigResponse filters(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.filters(marketplaceCode, null, null);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/listings")
    public List<CategoryMarketplaceDtos.MarketplaceListingSection> listings(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.listingSections(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/stores")
    public List<CategoryMarketplaceDtos.MarketplaceSellerStoreItem> stores(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.stores(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/coupons")
    public List<CategoryMarketplaceDtos.MarketplaceCouponItem> coupons(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.coupons(marketplaceCode);
    }

    @GetMapping({"/api/marketplaces/{marketplaceCode}/policy", "/m/{marketplaceCode}/policy"})
    public CategoryMarketplaceDtos.MarketplacePolicySummary policy(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.policy(marketplaceCode);
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/seller-eligibility")
    public CategoryMarketplaceDtos.SellerMarketplaceEligibilityResponse sellerEligibility(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.sellerEligibility(marketplaceCode);
    }

    @PostMapping("/api/marketplaces/save")
    public CategoryMarketplaceDtos.MarketplaceActionResponse save(@RequestBody(required = false) CategoryMarketplaceDtos.SaveMarketplaceRequest request) {
        return CategoryMarketplaceDtos.action("Marketplace/category/search saved.", "/saved");
    }

    @GetMapping("/api/marketplaces/{marketplaceCode}/alternatives")
    public List<CategoryMarketplaceDtos.MarketplaceEmptyStateAlternative> alternatives(@PathVariable String marketplaceCode) {
        return CategoryMarketplaceDtos.alternatives(marketplaceCode);
    }
}

package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SearchExploreDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SearchExploreMockController {
    @GetMapping("/api/search")
    public SearchExploreDtos.SearchDashboardResponse dashboard() {
        return SearchExploreDtos.dashboard();
    }

    @GetMapping("/api/search/suggestions")
    public List<SearchExploreDtos.SearchSuggestionItem> suggestions(@RequestParam(required = false) String q) {
        return SearchExploreDtos.suggestions();
    }

    @GetMapping("/api/search/results")
    public SearchExploreDtos.SearchResultsResponse results(@RequestParam(required = false) String q) {
        return SearchExploreDtos.results(q);
    }

    @GetMapping("/api/search/stores")
    public List<SearchExploreDtos.SearchStoreResult> stores() {
        return SearchExploreDtos.stores();
    }

    @GetMapping("/api/search/categories")
    public List<SearchExploreDtos.SearchCategoryResult> categories() {
        return SearchExploreDtos.categories();
    }

    @GetMapping("/api/search/coupons")
    public List<SearchExploreDtos.SearchCouponResult> coupons() {
        return SearchExploreDtos.coupons();
    }

    @GetMapping("/api/search/marketplaces")
    public List<SearchExploreDtos.SearchMarketplaceResult> marketplaces() {
        return SearchExploreDtos.marketplaces();
    }

    @GetMapping("/api/search/marketplaces/{marketplaceCode}/categories")
    public List<SearchExploreDtos.SearchCategoryResult> marketplaceCategories(@PathVariable String marketplaceCode) {
        return SearchExploreDtos.categories();
    }

    @GetMapping("/api/search/recent")
    public List<SearchExploreDtos.RecentSearchItem> recent() {
        return SearchExploreDtos.recent();
    }

    @PostMapping("/api/search/recent")
    public SearchExploreDtos.SearchActionResponse recordRecent(@RequestBody(required = false) Object request) {
        return SearchExploreDtos.action("Recent search recorded when history tracking is enabled.");
    }

    @DeleteMapping({"/api/search/recent/{recentSearchId}", "/api/search/recent"})
    public SearchExploreDtos.SearchActionResponse clearRecent() {
        return SearchExploreDtos.action("Recent search clear mock action accepted.");
    }

    @GetMapping("/api/search/popular")
    public List<SearchExploreDtos.PopularSearchItem> popular() {
        return SearchExploreDtos.popular();
    }

    @PostMapping("/api/search/saved")
    public SearchExploreDtos.SearchActionResponse saveSearch(@RequestBody(required = false) SearchExploreDtos.SaveSearchRequest request) {
        return SearchExploreDtos.action("Search saved.");
    }

    @GetMapping("/api/search/saved")
    public List<SearchExploreDtos.SavedSearchItem> saved() {
        return SearchExploreDtos.saved();
    }

    @DeleteMapping("/api/search/saved/{savedSearchId}")
    public SearchExploreDtos.SearchActionResponse deleteSaved(@PathVariable String savedSearchId) {
        return SearchExploreDtos.action("Saved search " + savedSearchId + " deleted.");
    }

    @PostMapping("/api/search/results/{listingId}/move-to-cart")
    public SearchExploreDtos.MoveSearchResultToCartResponse moveToCart(@PathVariable String listingId) {
        return SearchExploreDtos.moveToCart(listingId);
    }

    @GetMapping("/api/search/alternatives")
    public List<SearchExploreDtos.EmptyStateAlternative> alternatives() {
        return SearchExploreDtos.alternatives();
    }
}

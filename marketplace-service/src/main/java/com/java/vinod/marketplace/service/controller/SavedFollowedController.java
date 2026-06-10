package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SavedFollowedDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SavedFollowedController {
    @GetMapping("/api/saved")
    public SavedFollowedDtos.SavedDashboardResponse dashboard() {
        return SavedFollowedDtos.dashboard();
    }

    @GetMapping({"/api/saved/items", "/api/saved/search"})
    public List<SavedFollowedDtos.SavedItem> items(@RequestParam(required = false) String group,
                                                   @RequestParam(required = false) String q) {
        return SavedFollowedDtos.items();
    }

    @PostMapping({"/api/saved/listings/{listingId}", "/api/saved/stores/{sellerStoreId}",
            "/api/saved/stores/{sellerStoreId}/follow", "/api/saved/searches",
            "/api/saved/coupons/{couponId}"})
    public SavedFollowedDtos.SavedActionResponse save() {
        return SavedFollowedDtos.action("Saved & Followed mock save accepted.");
    }

    @DeleteMapping({"/api/saved/listings/{listingId}", "/api/saved/stores/{sellerStoreId}",
            "/api/saved/searches/{savedSearchId}", "/api/saved/coupons/{couponId}"})
    public SavedFollowedDtos.SavedActionResponse remove() {
        return SavedFollowedDtos.action("Saved item removed.");
    }

    @PostMapping("/api/saved/stores/{sellerStoreId}/unfollow")
    public SavedFollowedDtos.SavedActionResponse unfollow(@PathVariable String sellerStoreId) {
        return SavedFollowedDtos.action("Follow store placeholder updated for " + sellerStoreId + ".");
    }

    @GetMapping("/api/saved/searches")
    public List<SavedFollowedDtos.SavedSearchInfo> searches() {
        return SavedFollowedDtos.items().stream()
                .map(SavedFollowedDtos.SavedItem::savedSearch)
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    @PatchMapping("/api/saved/searches/{savedSearchId}")
    public SavedFollowedDtos.SavedActionResponse updateSearch(@PathVariable String savedSearchId) {
        return SavedFollowedDtos.action("Saved search " + savedSearchId + " updated.");
    }

    @GetMapping("/api/saved/availability-changes")
    public List<SavedFollowedDtos.SavedAvailabilityChange> availabilityChanges() {
        return SavedFollowedDtos.changes();
    }

    @PostMapping("/api/saved/listings/{listingId}/move-to-cart")
    public SavedFollowedDtos.MoveSavedToCartResponse moveToCart(@PathVariable String listingId) {
        return SavedFollowedDtos.moveToCart(listingId);
    }
}

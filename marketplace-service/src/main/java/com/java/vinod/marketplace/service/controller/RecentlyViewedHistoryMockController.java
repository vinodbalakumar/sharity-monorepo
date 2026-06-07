package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.RecentlyViewedHistoryDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class RecentlyViewedHistoryMockController {
    @GetMapping("/api/history")
    public RecentlyViewedHistoryDtos.HistoryDashboardResponse dashboard(
            @RequestParam(defaultValue = "false") boolean guestMode,
            @RequestParam(defaultValue = "false") boolean paused) {
        return RecentlyViewedHistoryDtos.dashboard(guestMode, paused);
    }

    @GetMapping({"/api/history/items", "/api/history/search"})
    public List<RecentlyViewedHistoryDtos.HistoryItem> items(@RequestParam(required = false) String group,
                                                             @RequestParam(required = false) String q) {
        return RecentlyViewedHistoryDtos.items();
    }

    @PostMapping("/api/history/items")
    public RecentlyViewedHistoryDtos.HistoryActionResponse record(
            @RequestBody(required = false) RecentlyViewedHistoryDtos.RecordHistoryItemRequest request) {
        return RecentlyViewedHistoryDtos.action("History item recorded unless tracking is paused.");
    }

    @DeleteMapping({"/api/history/items/{historyItemId}", "/api/history",
            "/api/history/groups/{groupCode}"})
    public RecentlyViewedHistoryDtos.HistoryActionResponse clear() {
        return RecentlyViewedHistoryDtos.action("History clear/remove mock action accepted.");
    }

    @PostMapping("/api/history/pause")
    public RecentlyViewedHistoryDtos.HistoryActionResponse pause() {
        return RecentlyViewedHistoryDtos.action("Browsing history tracking paused.");
    }

    @PostMapping("/api/history/resume")
    public RecentlyViewedHistoryDtos.HistoryActionResponse resume() {
        return RecentlyViewedHistoryDtos.action("Browsing history tracking resumed.");
    }

    @PostMapping("/api/history/items/{historyItemId}/save")
    public RecentlyViewedHistoryDtos.HistoryActionResponse save(@PathVariable String historyItemId) {
        return RecentlyViewedHistoryDtos.action("History item " + historyItemId + " saved.");
    }

    @PostMapping("/api/history/items/{historyItemId}/move-to-cart")
    public RecentlyViewedHistoryDtos.MoveHistoryToCartResponse moveToCart(@PathVariable String historyItemId) {
        return RecentlyViewedHistoryDtos.moveToCart(historyItemId);
    }

    @GetMapping("/api/history/items/{historyItemId}/similar")
    public RecentlyViewedHistoryDtos.SimilarItemsPlaceholderResponse similar(@PathVariable String historyItemId) {
        return RecentlyViewedHistoryDtos.similar(historyItemId);
    }
}

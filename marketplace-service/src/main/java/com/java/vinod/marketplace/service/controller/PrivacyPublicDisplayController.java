package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.PrivacyPublicDisplayDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PrivacyPublicDisplayController {
    @GetMapping({"/api/privacy", "/api/privacy/buyer", "/api/privacy/seller"})
    public PrivacyPublicDisplayDtos.PrivacyDashboardResponse dashboard() {
        return PrivacyPublicDisplayDtos.dashboard();
    }

    @PatchMapping({"/api/privacy/buyer", "/api/privacy/seller", "/api/privacy/real-name-visibility",
            "/api/privacy/profile-photo-visibility", "/api/privacy/location-visibility",
            "/api/privacy/search-visibility"})
    public PrivacyPublicDisplayDtos.PrivacyActionResponse patch(@RequestBody(required = false) Object request) {
        return PrivacyPublicDisplayDtos.action("Privacy settings saved. Preview remains available before publish.");
    }

    @GetMapping("/api/privacy/preview")
    public List<PrivacyPublicDisplayDtos.PublicDisplayPreview> preview() {
        return PrivacyPublicDisplayDtos.previews();
    }

    @GetMapping("/api/privacy/preview/safe-messaging")
    public PrivacyPublicDisplayDtos.SafeMessagingDisplayPreview safeMessaging() {
        return PrivacyPublicDisplayDtos.safeMessaging();
    }

    @GetMapping("/api/privacy/search-visibility")
    public PrivacyPublicDisplayDtos.SearchVisibilitySettings searchVisibility() {
        return PrivacyPublicDisplayDtos.searchVisibility();
    }

    @GetMapping("/api/privacy/change-timeline")
    public List<PrivacyPublicDisplayDtos.PrivacyChangeTimelineEvent> timeline() {
        return PrivacyPublicDisplayDtos.timeline();
    }

    @PostMapping("/api/privacy/save")
    public PrivacyPublicDisplayDtos.PrivacyActionResponse save(@RequestBody(required = false) Object request) {
        return PrivacyPublicDisplayDtos.action("Privacy settings saved. Contact info remains private.");
    }

    @GetMapping("/api/admin/privacy-reviews")
    public List<PrivacyPublicDisplayDtos.AdminPrivacyReviewQueueItem> adminReviews() {
        return PrivacyPublicDisplayDtos.adminReviews();
    }

    @GetMapping({"/api/admin/privacy-reviews/{reviewId}", "/api/admin/moderation/privacy",
            "/api/admin/moderation/public-display"})
    public PrivacyPublicDisplayDtos.AdminPrivacyReviewQueueItem adminReview(@PathVariable(required = false) String reviewId) {
        return PrivacyPublicDisplayDtos.adminReviews().get(0);
    }

    @PostMapping({"/api/admin/privacy-reviews/{reviewId}/approve", "/api/admin/privacy-reviews/{reviewId}/reject",
            "/api/admin/privacy-reviews/{reviewId}/request-changes"})
    public PrivacyPublicDisplayDtos.PrivacyActionResponse adminAction(@PathVariable String reviewId) {
        return PrivacyPublicDisplayDtos.action("Admin privacy review placeholder accepted for " + reviewId + ".");
    }
}

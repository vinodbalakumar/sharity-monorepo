package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.ProfilePersonalInfoDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProfileReviewAdminMockController {
    @GetMapping("/api/admin/profile-reviews")
    public List<ProfilePersonalInfoDtos.AdminProfileReviewQueueItem> reviews() {
        return ProfilePersonalInfoDtos.adminReviews();
    }

    @GetMapping("/api/admin/profile-reviews/{reviewId}")
    public ProfilePersonalInfoDtos.AdminProfileReviewQueueItem review(@PathVariable String reviewId) {
        return ProfilePersonalInfoDtos.adminReviews().get(0);
    }

    @GetMapping("/api/admin/users/{userId}/profile-review")
    public ProfilePersonalInfoDtos.AdminProfileReviewQueueItem userReview(@PathVariable String userId) {
        return ProfilePersonalInfoDtos.adminReviews().get(0);
    }

    @PostMapping({"/api/admin/profile-reviews/{reviewId}/approve", "/api/admin/profile-reviews/{reviewId}/reject",
            "/api/admin/profile-reviews/{reviewId}/request-more-info"})
    public ProfilePersonalInfoDtos.ProfileActionResponse action(@PathVariable String reviewId) {
        return ProfilePersonalInfoDtos.action("OK", "Admin profile review placeholder accepted for " + reviewId + ".");
    }
}

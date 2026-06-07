package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.ReviewsRatingsDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ReviewsRatingsMockController {
    @GetMapping("/api/reviews/eligibility")
    public ReviewsRatingsDtos.ReviewEligibilityResponse eligibility() {
        return ReviewsRatingsDtos.eligibility();
    }

    @GetMapping("/api/reviews/form-config")
    public ReviewsRatingsDtos.ReviewFormConfigResponse formConfig() {
        return ReviewsRatingsDtos.formConfig();
    }

    @PostMapping("/api/reviews")
    public ReviewsRatingsDtos.ReviewResponse submit(@RequestBody(required = false) ReviewsRatingsDtos.SubmitReviewRequest request) {
        return ReviewsRatingsDtos.submit(request);
    }

    @GetMapping({"/api/reviews/{reviewId}", "/api/admin/reviews/{reviewId}/moderation"})
    public ReviewsRatingsDtos.ReviewDetailResponse detail(@PathVariable String reviewId) {
        return ReviewsRatingsDtos.detail(reviewId);
    }

    @PatchMapping("/api/reviews/{reviewId}")
    public ReviewsRatingsDtos.ReviewResponse update(@PathVariable String reviewId) {
        return ReviewsRatingsDtos.response("Review updated.");
    }

    @PostMapping({"/api/reviews/{reviewId}/withdraw", "/api/reviews/{reviewId}/seller-response",
            "/api/reviews/{reviewId}/seller-response/report", "/api/reviews/{reviewId}/report",
            "/api/admin/reviews/reports/{reportId}/resolve"})
    public ReviewsRatingsDtos.ReviewResponse action() {
        return ReviewsRatingsDtos.response("Review mock action accepted.");
    }

    @PatchMapping("/api/reviews/{reviewId}/seller-response")
    public ReviewsRatingsDtos.ReviewResponse updateSellerResponse(@PathVariable String reviewId) {
        return ReviewsRatingsDtos.response("Seller response updated.");
    }

    @GetMapping({"/api/reviews/seller/{sellerStoreId}", "/api/reviews/product/{productId}",
            "/api/reviews/listing/{listingId}"})
    public List<ReviewsRatingsDtos.PublicReviewItem> reviews() {
        return ReviewsRatingsDtos.reviews();
    }

    @GetMapping("/api/reviews/summary")
    public ReviewsRatingsDtos.RatingSummaryResponse summary(@RequestParam(defaultValue = "SELLER") String targetType,
                                                            @RequestParam(defaultValue = "store-1000") String targetId) {
        return ReviewsRatingsDtos.summary(targetType, targetId);
    }

    @PostMapping("/api/reviews/validate-draft")
    public ReviewsRatingsDtos.ReviewDraftValidationResponse validate(
            @RequestBody(required = false) ReviewsRatingsDtos.ReviewDraftValidationRequest request) {
        return ReviewsRatingsDtos.validate(request == null ? null : request.textReview(),
                request == null ? null : request.sellerResponseText());
    }

    @GetMapping({"/api/admin/reviews/moderation", "/api/admin/reviews/reports"})
    public List<ReviewsRatingsDtos.AdminReviewModerationQueueItem> adminQueue() {
        return ReviewsRatingsDtos.adminQueue();
    }

    @GetMapping("/api/admin/reviews/reports/{reportId}")
    public ReviewsRatingsDtos.AdminReviewModerationQueueItem adminReport(@PathVariable String reportId) {
        return ReviewsRatingsDtos.adminQueue().get(0);
    }
}

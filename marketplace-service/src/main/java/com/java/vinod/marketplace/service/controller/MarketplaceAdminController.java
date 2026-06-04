package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.service.MarketplaceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

/**
 * Exposes internal admin marketplace views for orders and dispute placeholders.
 */
@RestController
@RequestMapping("/api/v1/marketplace/admin")
public class MarketplaceAdminController {
    private final MarketplaceService marketplaceService;

    /**
     * Creates the admin controller with the marketplace workflow service.
     */
    public MarketplaceAdminController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    /**
     * Returns marketplace listings for admin moderation and review.
     */
    @GetMapping("/listings")
    public List<MarketplaceDtos.AdminListingResponse> listings(@RequestParam(required = false) String status,
                                                               @RequestParam(required = false) String verticalCode,
                                                               @RequestParam(required = false) String sellerPublicId,
                                                               @RequestParam(required = false) String problemState) {
        return marketplaceService.adminListings(status, verticalCode, sellerPublicId, problemState);
    }

    /**
     * Moderates one marketplace listing by public id.
     */
    @PutMapping("/listings/{publicId}/status")
    public MarketplaceDtos.AdminListingResponse moderateListing(@PathVariable String publicId,
                                                                @Valid @RequestBody MarketplaceDtos.AdminListingDecisionRequest request,
                                                                @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.moderateListing(publicId, request, jwt);
    }

    /**
     * Returns all marketplace orders for admin review.
     */
    @GetMapping("/orders")
    public List<MarketplaceDtos.OrderResponse> orders() {
        return marketplaceService.adminOrders();
    }

    /**
     * Returns marketplace disputes for admin review.
     */
    @GetMapping("/disputes")
    public List<MarketplaceDtos.AdminDisputeResponse> disputes() {
        return marketplaceService.adminDisputes();
    }

    /**
     * Returns a single marketplace dispute for review.
     */
    @GetMapping("/disputes/{publicId}")
    public MarketplaceDtos.AdminDisputeResponse dispute(@PathVariable String publicId) {
        return marketplaceService.adminDispute(publicId);
    }

    /**
     * Records an admin dispute decision for moderation tracking.
     */
    @PutMapping("/disputes/{publicId}/decision")
    public MarketplaceDtos.AdminDisputeResponse decision(@PathVariable String publicId,
                                                         @Valid @RequestBody MarketplaceDtos.AdminDisputeDecisionRequest request,
                                                         @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.moderateDispute(publicId, request, jwt);
    }
}

package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.service.MarketplaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes customer and provider marketplace APIs for listings, purchases, delivery, and acceptance.
 */
@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceController {
    private final MarketplaceService marketplaceService;
    private final com.java.vinod.marketplace.service.service.MarketplaceMasterService marketplaceMasterService;

    /**
     * Creates the controller with the marketplace workflow service.
     */
    public MarketplaceController(MarketplaceService marketplaceService,
                                 com.java.vinod.marketplace.service.service.MarketplaceMasterService marketplaceMasterService) {
        this.marketplaceService = marketplaceService;
        this.marketplaceMasterService = marketplaceMasterService;
    }

    /**
     * Returns the supported commerce verticals for anonymous navigation.
     */
    @GetMapping("/verticals")
    public List<MarketplaceDtos.VerticalResponse> verticals() {
        return marketplaceService.activeVerticals();
    }

    /**
     * Returns marketplace listing statuses from the database master table.
     */
    @GetMapping("/listing-statuses")
    public List<MarketplaceDtos.ListingStatusResponse> listingStatuses() {
        return marketplaceService.listingStatuses();
    }

    @GetMapping("/subcategories")
    public List<MarketplaceDtos.SubcategoryResponse> subcategories(@RequestParam(required = false) String categoryCode,
                                                                   @RequestParam(required = false) String countryCode) {
        return marketplaceMasterService.subcategories(categoryCode, countryCode);
    }

    @GetMapping("/features")
    public List<MarketplaceDtos.FeatureResponse> features(@RequestParam(required = false) String countryCode) {
        return marketplaceMasterService.features(countryCode);
    }

    @GetMapping("/listing-conditions")
    public List<MarketplaceDtos.ListingConditionResponse> listingConditions() {
        return marketplaceMasterService.listingConditions();
    }

    @GetMapping("/delivery-types")
    public List<MarketplaceDtos.DeliveryTypeResponse> deliveryTypes() {
        return marketplaceMasterService.deliveryTypes();
    }

    @GetMapping("/fee-types")
    public List<MarketplaceDtos.FeeTypeResponse> feeTypes() {
        return marketplaceMasterService.feeTypes();
    }

    /**
     * Returns the public home payload for the multi-vertical catalog experience.
     */
    @GetMapping("/home")
    public MarketplaceDtos.HomeResponse home(@RequestParam(required = false) String countryCode) {
        return marketplaceService.home(countryCode);
    }

    /**
     * Returns all currently active marketplace listings visible to customers.
     */
    @GetMapping("/listings")
    public List<MarketplaceDtos.ListingResponse> listings(@RequestParam(required = false) String sort,
                                                          @RequestParam(required = false) String verticalCode,
                                                          @RequestParam(required = false) String countryCode) {
        return marketplaceService.activeListings(sort, verticalCode, countryCode);
    }

    /**
     * Returns active marketplace listings for a category code.
     */
    @GetMapping("/listings/by-category")
    public List<MarketplaceDtos.ListingResponse> listingsByCategory(@RequestParam String categoryCode,
                                                                   @RequestParam(required = false) String sort,
                                                                   @RequestParam(required = false) String verticalCode,
                                                                   @RequestParam(required = false) String countryCode) {
        return marketplaceService.activeListingsByCategory(categoryCode, sort, verticalCode, countryCode);
    }

    /**
     * Returns active marketplace listings matched by keyword with optional category filter.
     */
    @GetMapping("/listings/search")
    public List<MarketplaceDtos.ListingResponse> searchListings(@RequestParam String query,
                                                                @RequestParam(required = false) String categoryCode,
                                                                @RequestParam(required = false) String sort,
                                                                @RequestParam(required = false) String verticalCode,
                                                                @RequestParam(required = false) String countryCode) {
        return marketplaceService.searchActiveListings(query, categoryCode, sort, verticalCode, countryCode);
    }

    /**
     * Returns active categories for marketplace home page discovery.
     */
    @GetMapping("/categories")
    public List<MarketplaceDtos.CategoryResponse> categories(@RequestParam(required = false) String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return marketplaceService.activeCategories();
        }
        return marketplaceService.activeCategories(null, countryCode);
    }

    /**
     * Returns categories for a specific vertical when the caller is browsing a vertical storefront.
     */
    @GetMapping("/categories/by-vertical")
    public List<MarketplaceDtos.CategoryResponse> categoriesByVertical(@RequestParam String verticalCode,
                                                                       @RequestParam(required = false) String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return marketplaceService.activeCategories(verticalCode);
        }
        return marketplaceService.activeCategories(verticalCode, countryCode);
    }

    /**
     * Returns featured active listings for marketplace home page.
     */
    @GetMapping("/listings/featured")
    public List<MarketplaceDtos.ListingResponse> featuredListings(@RequestParam(required = false) String countryCode) {
        return marketplaceService.featuredListings(countryCode);
    }

    /**
     * Returns details for a single listing by public id.
     */
    @GetMapping("/listings/{listingPublicId}")
    public MarketplaceDtos.ListingResponse listing(@PathVariable String listingPublicId) {
        return marketplaceService.listing(listingPublicId);
    }

    /**
     * Returns the public reviews attached to a listing so shoppers can review trust cues before purchase.
     */
    @GetMapping("/listings/{listingPublicId}/reviews")
    public List<MarketplaceDtos.ListingReviewResponse> listingReviews(@PathVariable String listingPublicId) {
        return marketplaceService.listingReviews(listingPublicId);
    }

    /**
     * Returns public reviews for a listing when the caller passes the listing id as a safe query parameter.
     */
    @GetMapping("/reviews")
    public List<MarketplaceDtos.ListingReviewResponse> listingReviewsByQuery(@RequestParam String listingPublicId) {
        return marketplaceService.listingReviews(listingPublicId);
    }

    /**
     * Creates a customer order for an active listing and starts the mock payment workflow.
     */
    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public MarketplaceDtos.OrderResponse createOrder(@Valid @RequestBody MarketplaceDtos.OrderRequest request,
                                                    @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.createOrder(request, jwt);
    }

    /**
     * Returns orders purchased by the authenticated customer.
     */
    @GetMapping("/orders/purchases")
    public List<MarketplaceDtos.OrderResponse> purchases(@AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.purchases(jwt);
    }

    /**
     * Returns one purchase when it belongs to the authenticated customer.
     */
    @GetMapping("/orders/purchases/{orderPublicId}")
    public MarketplaceDtos.OrderResponse purchase(@PathVariable String orderPublicId, @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.purchase(orderPublicId, jwt);
    }

    /**
     * Accepts provider delivery and requests payout eligibility from payment-service.
     */
    @PostMapping("/orders/{orderPublicId}/accept")
    public MarketplaceDtos.MessageResponse accept(@PathVariable String orderPublicId, @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.accept(orderPublicId, jwt);
    }

    /**
     * Opens a dispute placeholder for a purchased order and blocks payout eligibility.
     */
    @PostMapping("/orders/{orderPublicId}/report-problem")
    public MarketplaceDtos.MessageResponse reportProblem(@PathVariable String orderPublicId,
                                                        @Valid @RequestBody MarketplaceDtos.ProblemRequest request,
                                                        @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.reportProblem(orderPublicId, request, jwt);
    }

    /**
     * Creates a provider listing for the authenticated provider owner.
     */
    @PostMapping("/provider/listings")
    @ResponseStatus(HttpStatus.CREATED)
    public MarketplaceDtos.ListingResponse createListing(@Valid @RequestBody MarketplaceDtos.ListingRequest request,
                                                        @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.createListing(request, jwt);
    }

    /**
     * Updates an existing listing when the authenticated user owns it.
     */
    @PutMapping("/provider/listings/{listingPublicId}")
    public MarketplaceDtos.ListingResponse updateListing(@PathVariable String listingPublicId,
                                                        @Valid @RequestBody MarketplaceDtos.ListingRequest request,
                                                        @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.updateListing(listingPublicId, request, jwt);
    }

    /**
     * Returns listings belonging to a provider account.
     */
    @GetMapping("/provider/listings")
    public List<MarketplaceDtos.ListingResponse> providerListings(@RequestParam String providerPublicId) {
        return marketplaceService.providerListings(providerPublicId);
    }

    /**
     * Returns orders assigned to a provider account.
     */
    @GetMapping("/provider/orders")
    public List<MarketplaceDtos.OrderResponse> providerOrders(@RequestParam String providerPublicId) {
        return marketplaceService.providerOrders(providerPublicId);
    }

    /**
     * Returns a provider order when the authenticated user is the assigned provider owner.
     */
    @GetMapping("/provider/orders/{orderPublicId}")
    public MarketplaceDtos.OrderResponse providerOrder(@PathVariable String orderPublicId, @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.providerOrder(orderPublicId, jwt);
    }

    /**
     * Records provider delivery submission for an order.
     */
    @PostMapping("/provider/orders/{orderPublicId}/deliver")
    public MarketplaceDtos.MessageResponse deliver(@PathVariable String orderPublicId,
                                                  @Valid @RequestBody MarketplaceDtos.DeliveryRequest request,
                                                  @AuthenticationPrincipal Jwt jwt) {
        return marketplaceService.deliver(orderPublicId, request, jwt);
    }
}

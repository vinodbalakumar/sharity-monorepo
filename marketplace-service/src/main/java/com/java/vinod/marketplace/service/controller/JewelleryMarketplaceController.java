package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.dto.PostMvpMarketplaceDtos;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes approved jewellery marketplace routes backed by the core marketplace service.
 */
@RestController
public class JewelleryMarketplaceController {
    private static final String VERTICAL = "JEWELLERY";
    private final MarketplaceService marketplaceService;

    public JewelleryMarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/api/jewellery/home")
    public PostMvpMarketplaceDtos.JewelleryHomeResponse home(@RequestParam(required = false) String countryCode) {
        return new PostMvpMarketplaceDtos.JewelleryHomeResponse(
                jewelleryCategories(countryCode),
                jewelleryCards(marketplaceService.featuredListings(countryCode)),
                jewelleryPolicyDisclaimers(),
                true,
                true);
    }

    @GetMapping("/api/jewellery/categories")
    public List<PostMvpMarketplaceDtos.JewelleryCategory> categories(@RequestParam(required = false) String countryCode) {
        return jewelleryCategories(countryCode);
    }

    @GetMapping("/api/jewellery/items/{listingId}")
    public PostMvpMarketplaceDtos.JewelleryItemDetail item(@PathVariable String listingId) {
        MarketplaceDtos.ListingResponse listing = marketplaceService.listing(listingId);
        return jewelleryDetail(listing);
    }

    @GetMapping("/api/jewellery/search")
    public List<PostMvpMarketplaceDtos.JewelleryItemCard> search(@RequestParam(required = false) String query,
                                                                 @RequestParam(required = false) String categoryCode,
                                                                 @RequestParam(required = false) String sort,
                                                                 @RequestParam(required = false) String countryCode) {
        List<MarketplaceDtos.ListingResponse> results = query == null || query.isBlank()
                ? (categoryCode == null || categoryCode.isBlank()
                ? marketplaceService.activeListings(sort, VERTICAL, countryCode)
                : marketplaceService.activeListingsByCategory(categoryCode, sort, VERTICAL, countryCode))
                : marketplaceService.searchActiveListings(query, categoryCode, sort, VERTICAL, countryCode);
        return jewelleryCards(results);
    }

    @PostMapping("/api/seller/jewellery/listings")
    @ResponseStatus(HttpStatus.CREATED)
    public PostMvpMarketplaceDtos.JewelleryActionResponse createListing(@Valid @RequestBody PostMvpMarketplaceDtos.SellerJewelleryListing request,
                                                                        @AuthenticationPrincipal Jwt jwt) {
        MarketplaceDtos.ListingResponse created = marketplaceService.createListing(toListingRequest(request), jwt);
        return new PostMvpMarketplaceDtos.JewelleryActionResponse("CREATED", "Jewellery listing created", created.publicId(), null);
    }

    @PutMapping("/api/seller/jewellery/listings/{listingId}")
    public PostMvpMarketplaceDtos.JewelleryActionResponse updateListing(@PathVariable String listingId,
                                                                        @Valid @RequestBody PostMvpMarketplaceDtos.SellerJewelleryListing request,
                                                                        @AuthenticationPrincipal Jwt jwt) {
        MarketplaceDtos.ListingResponse updated = marketplaceService.updateListing(listingId, toListingRequest(request), jwt);
        return new PostMvpMarketplaceDtos.JewelleryActionResponse("UPDATED", "Jewellery listing updated", updated.publicId(), null);
    }

    @PostMapping("/api/buyer/jewellery/orders/{orderId}/issue")
    public PostMvpMarketplaceDtos.JewelleryActionResponse issue(@PathVariable String orderId,
                                                               @Valid @RequestBody PostMvpMarketplaceDtos.JewelleryIssueRequest request,
                                                               @AuthenticationPrincipal Jwt jwt) {
        marketplaceService.reportProblem(orderId, new MarketplaceDtos.ProblemRequest(request.reasonCode(), request.description()), jwt);
        return new PostMvpMarketplaceDtos.JewelleryActionResponse("ISSUE_REPORTED", "Jewellery issue reported", null, orderId);
    }

    @GetMapping("/api/admin/jewellery/config")
    public PostMvpMarketplaceDtos.AdminJewelleryConfigResponse adminConfig(@RequestParam(required = false) String countryCode) {
        return new PostMvpMarketplaceDtos.AdminJewelleryConfigResponse(
                true,
                jewelleryCategories(countryCode),
                List.of("WRONG_ITEM", "DAMAGED_ITEM", "NOT_AS_DESCRIBED", "MISSING_STONES_OR_ACCESSORY",
                        "COLOR_FINISH_MISMATCH", "SIZE_MISMATCH", "AUTHENTICITY_CLAIM_CONCERN", "SHIPPING_DAMAGE", "OTHER"),
                jewelleryPolicyDisclaimers(),
                true);
    }

    private List<PostMvpMarketplaceDtos.JewelleryCategory> jewelleryCategories(String countryCode) {
        return marketplaceService.activeCategories(VERTICAL, countryCode).stream()
                .map(category -> new PostMvpMarketplaceDtos.JewelleryCategory(
                        category.code(),
                        category.name(),
                        category.slug(),
                        category.countryCode(),
                        category.code() != null && category.code().startsWith("STORE_"),
                        false,
                        "Metal purity and authenticity claims are allowed only when backend category policy permits them."))
                .toList();
    }

    private List<PostMvpMarketplaceDtos.JewelleryItemCard> jewelleryCards(List<MarketplaceDtos.ListingResponse> listings) {
        return listings.stream()
                .filter(listing -> VERTICAL.equalsIgnoreCase(listing.verticalCode()))
                .map(listing -> new PostMvpMarketplaceDtos.JewelleryItemCard(
                        listing.publicId(),
                        listing.title(),
                        listing.categoryCode(),
                        listing.productType(),
                        null,
                        listing.conditionLabel(),
                        listing.priceAmount(),
                        listing.currencyCode(),
                        listing.imageUrl(),
                        listing.sellerDisplayName(),
                        listing.verifiedSeller(),
                        !"DIGITAL".equalsIgnoreCase(listing.deliveryType()),
                        listing.originalPriceAmount() != null && listing.originalPriceAmount().compareTo(listing.priceAmount()) > 0))
                .toList();
    }

    private PostMvpMarketplaceDtos.JewelleryItemDetail jewelleryDetail(MarketplaceDtos.ListingResponse listing) {
        return new PostMvpMarketplaceDtos.JewelleryItemDetail(
                listing.publicId(),
                listing.title(),
                listing.description(),
                new PostMvpMarketplaceDtos.JewelleryCategory(listing.categoryCode(), listing.categoryCode(), listing.categoryCode(),
                        listing.providerCountryCode(), false, false,
                        "Backend policy controls authenticity and purity claims."),
                null,
                listing.productType(),
                null,
                null,
                null,
                "Provided by seller when backend policy supports structured weight.",
                "Provided by seller when backend policy supports structured stone type.",
                listing.conditionLabel(),
                listing.priceAmount(),
                listing.currencyCode(),
                listing.stockQuantity(),
                listing.imageUrl() == null || listing.imageUrl().isBlank() ? List.of() : List.of(listing.imageUrl()),
                !"DIGITAL".equalsIgnoreCase(listing.deliveryType()),
                "Return policy is backend/category-policy controlled.",
                listing.sellerDisplayName(),
                listing.verifiedSeller(),
                jewelleryPolicyDisclaimers());
    }

    private MarketplaceDtos.ListingRequest toListingRequest(PostMvpMarketplaceDtos.SellerJewelleryListing request) {
        return new MarketplaceDtos.ListingRequest(
                request.title(),
                request.description(),
                request.category(),
                request.displayMaterial(),
                request.shippingAvailable() ? "SHIPPING" : "PICKUP_OR_LOCAL",
                request.currency(),
                request.price(),
                request.providerAccountPublicId(),
                request.providerCountryCode(),
                firstImage(request.images()),
                "ACTIVE",
                VERTICAL);
    }

    private List<String> jewelleryPolicyDisclaimers() {
        return List.of(
                "Buyer sees only public seller/store information.",
                "Seller commission, payout, internal risk score, admin notes, and provider payloads are hidden.",
                "Authenticity and metal purity claims are backend/category-policy controlled.");
    }

    private String firstImage(List<String> images) {
        return images == null || images.isEmpty() ? null : images.get(0);
    }
}

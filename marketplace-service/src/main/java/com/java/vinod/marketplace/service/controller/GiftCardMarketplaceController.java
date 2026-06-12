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
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

/**
 * Exposes approved gift-card marketplace routes with secure digital delivery constraints.
 */
@RestController
public class GiftCardMarketplaceController {
    private static final String VERTICAL = "GIFT_CARDS";
    private final MarketplaceService marketplaceService;

    public GiftCardMarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/api/gift-cards/home")
    public PostMvpMarketplaceDtos.GiftCardHomeResponse home(@RequestParam(required = false) String countryCode) {
        return new PostMvpMarketplaceDtos.GiftCardHomeResponse(
                brands(countryCode),
                cards(marketplaceService.featuredListings(countryCode)),
                revealPolicy(),
                riskDisclaimers());
    }

    @GetMapping("/api/gift-cards/brands")
    public List<PostMvpMarketplaceDtos.GiftCardBrand> brands(@RequestParam(required = false) String countryCode) {
        return marketplaceService.activeCategories(VERTICAL, countryCode).stream()
                .map(category -> new PostMvpMarketplaceDtos.GiftCardBrand(
                        category.code(),
                        category.name(),
                        category.countryCode(),
                        category.active(),
                        true,
                        false))
                .toList();
    }

    @GetMapping("/api/gift-cards/items/{listingId}")
    public PostMvpMarketplaceDtos.GiftCardItemDetail item(@PathVariable String listingId) {
        MarketplaceDtos.ListingResponse listing = marketplaceService.listing(listingId);
        return new PostMvpMarketplaceDtos.GiftCardItemDetail(
                listing.publicId(),
                listing.categoryCode(),
                listing.productType(),
                listing.originalPriceAmount() == null ? listing.priceAmount() : listing.originalPriceAmount(),
                listing.priceAmount(),
                listing.currencyCode(),
                listing.providerCountryCode(),
                null,
                false,
                "BALANCE_VERIFICATION_PLACEHOLDER",
                revealPolicy(),
                listing.sellerDisplayName(),
                listing.verifiedSeller(),
                listing.imageUrl() == null || listing.imageUrl().isBlank() ? List.of() : List.of(listing.imageUrl()));
    }

    @PostMapping("/api/seller/gift-cards/listings")
    @ResponseStatus(HttpStatus.CREATED)
    public PostMvpMarketplaceDtos.SellerGiftCardListing createListing(@Valid @RequestBody PostMvpMarketplaceDtos.SellerGiftCardListing request,
                                                                      @AuthenticationPrincipal Jwt jwt) {
        ensureSecureDelivery(request.deliveryType());
        marketplaceService.createListing(toListingRequest(request, null), jwt);
        return request;
    }

    @PutMapping("/api/seller/gift-cards/listings/{listingId}")
    public PostMvpMarketplaceDtos.SellerGiftCardListing updateListing(@PathVariable String listingId,
                                                                      @Valid @RequestBody PostMvpMarketplaceDtos.SellerGiftCardListing request,
                                                                      @AuthenticationPrincipal Jwt jwt) {
        ensureSecureDelivery(request.deliveryType());
        marketplaceService.updateListing(listingId, toListingRequest(request, listingId), jwt);
        return request;
    }

    @PostMapping("/api/buyer/gift-cards/orders/{orderId}/issue")
    public PostMvpMarketplaceDtos.GiftCardRevealPolicy issue(@PathVariable String orderId,
                                                            @Valid @RequestBody PostMvpMarketplaceDtos.GiftCardIssueRequest request,
                                                            @AuthenticationPrincipal Jwt jwt) {
        marketplaceService.reportProblem(orderId, new MarketplaceDtos.ProblemRequest(request.reasonCode(), request.description()), jwt);
        return revealPolicy();
    }

    @GetMapping("/api/admin/gift-cards/config")
    public PostMvpMarketplaceDtos.AdminGiftCardConfig adminConfig(@RequestParam(required = false) String countryCode) {
        return new PostMvpMarketplaceDtos.AdminGiftCardConfig(
                true,
                brands(countryCode),
                revealPolicy(),
                List.of("CODE_INVALID", "CODE_ALREADY_USED", "WRONG_BRAND", "WRONG_BALANCE",
                        "REGION_NOT_SUPPORTED", "EXPIRED_CARD", "SELLER_SENT_CODE_IN_CHAT", "OTHER"),
                false);
    }

    private List<PostMvpMarketplaceDtos.JewelleryItemCard> cards(List<MarketplaceDtos.ListingResponse> listings) {
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
                        false,
                        listing.originalPriceAmount() != null && listing.originalPriceAmount().compareTo(listing.priceAmount()) > 0))
                .toList();
    }

    private MarketplaceDtos.ListingRequest toListingRequest(PostMvpMarketplaceDtos.SellerGiftCardListing request, String listingId) {
        BigDecimal originalPrice = request.faceValue();
        String title = request.brand() + " " + request.cardType() + " Gift Card";
        String description = "Gift card listing. Code/PIN is stored and revealed only through approved secure digital delivery.";
        return new MarketplaceDtos.ListingRequest(
                title,
                description,
                request.brand(),
                request.cardType(),
                "SECURE_DIGITAL",
            "NATIONAL",
                request.currency(),
                request.sellingPrice(),
                request.providerAccountPublicId(),
                request.regionCountry() == null ? request.providerCountryCode() : request.regionCountry(),
                firstImage(request.images()),
                "ACTIVE",
            VERTICAL,
            1);
    }

    private void ensureSecureDelivery(String deliveryType) {
        if (!"SECURE_DIGITAL".equalsIgnoreCase(deliveryType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gift cards require SECURE_DIGITAL delivery");
        }
    }

    private PostMvpMarketplaceDtos.GiftCardRevealPolicy revealPolicy() {
        return new PostMvpMarketplaceDtos.GiftCardRevealPolicy(
                true,
                true,
                true,
                "Gift card code/PIN remains hidden until backend confirms eligible buyer reveal and buyer acknowledges reveal/refund rules.");
    }

    private List<String> riskDisclaimers() {
        return List.of(
                "Gift cards are high-risk digital items and use secure reveal only.",
                "Gift card code/PIN is never returned in list, detail, chat, logs, route params, or local storage.",
                "Balance verification is placeholder unless backend/provider enables it.");
    }

    private String firstImage(List<String> images) {
        return images == null || images.isEmpty() ? null : images.get(0);
    }
}

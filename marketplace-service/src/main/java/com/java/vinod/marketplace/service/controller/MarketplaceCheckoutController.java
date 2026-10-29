package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.MarketplaceCheckoutDtos;
import com.java.vinod.marketplace.service.service.MarketplaceCheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authenticated buyer API for the consolidated physical cart checkout.
 */
@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceCheckoutController {
    private final MarketplaceCheckoutService checkoutService;

    public MarketplaceCheckoutController(MarketplaceCheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    /**
     * Checks out every current line of the buyer's cart. Replaying the same Idempotency-Key with the same
     * snapshot returns the original checkout; a different snapshot with the same key is rejected with 409.
     */
    @PostMapping("/cart/{cartPublicId}/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public MarketplaceCheckoutDtos.CheckoutResponse checkoutCart(@PathVariable String cartPublicId,
                                                                 @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
                                                                 @Valid @RequestBody MarketplaceCheckoutDtos.CheckoutRequest request,
                                                                 @AuthenticationPrincipal Jwt jwt) {
        return checkoutService.checkoutCart(cartPublicId, request, idempotencyKey, jwt);
    }

    /**
     * Resolves a rejected attempt after waiting for any submission holding the cart lock.
     * A null checkout is definitive only for this owned cart and buyer's key at that locked lookup.
     */
    @GetMapping("/cart/{cartPublicId}/checkout-attempt")
    public ResponseEntity<MarketplaceCheckoutDtos.CheckoutAttemptResponse> checkoutAttempt(
            @PathVariable String cartPublicId,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(checkoutService.checkoutAttempt(cartPublicId, idempotencyKey, jwt));
    }

    /**
     * Returns a checkout owned by the authenticated buyer so the UI can resume it.
     */
    @GetMapping("/checkouts/{checkoutPublicId}")
    public MarketplaceCheckoutDtos.CheckoutResponse checkout(@PathVariable String checkoutPublicId,
                                                             @AuthenticationPrincipal Jwt jwt) {
        return checkoutService.checkout(checkoutPublicId, jwt);
    }
}
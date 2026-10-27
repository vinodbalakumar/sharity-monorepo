package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.CartDtos;
import com.java.vinod.marketplace.service.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping("/{cartId}")
    public CartDtos.CartResponse getCart(@PathVariable String cartId, @AuthenticationPrincipal Jwt jwt) {
        cartService.requireOwner(cartId, customer(jwt));
        return cartService.getCart(cartId);
    }

    @PostMapping
    public CartDtos.CartResponse createCart(@RequestParam(required = false) String customerId, @AuthenticationPrincipal Jwt jwt) {
        String owner = customer(jwt);
        if (customerId != null && !owner.equals(customerId)) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        return cartService.getOrCreateCart(owner);
    }

    @PostMapping("/current")
    public CartDtos.CartResponse current(@AuthenticationPrincipal Jwt jwt) { return cartService.getOrCreateCart(customer(jwt)); }

    @PostMapping("/{cartId}/items")
    public CartDtos.CartItemResponse addToCart(
        @PathVariable String cartId,
        @Valid @RequestBody CartDtos.AddToCartRequest request, @AuthenticationPrincipal Jwt jwt) {
        cartService.requireOwner(cartId, customer(jwt));
        return cartService.addToCart(cartId, request);
    }

    @PutMapping("/{cartId}/items/{cartItemId}")
    public CartDtos.CartItemResponse updateQuantity(
        @PathVariable String cartId,
        @PathVariable String cartItemId,
        @Valid @RequestBody CartDtos.UpdateQuantityRequest request, @AuthenticationPrincipal Jwt jwt) {
        cartService.requireOwner(cartId, customer(jwt));
        return cartService.updateQuantity(cartId, cartItemId, request.getQuantity());
    }

    @DeleteMapping("/{cartId}/items/{cartItemId}")
    public void removeFromCart(
        @PathVariable String cartId,
        @PathVariable String cartItemId, @AuthenticationPrincipal Jwt jwt) {
        cartService.requireOwner(cartId, customer(jwt));
        cartService.removeFromCart(cartId, cartItemId);
    }

    @DeleteMapping("/{cartId}")
    public CartDtos.CartResponse clearCart(@PathVariable String cartId, @AuthenticationPrincipal Jwt jwt) {
        cartService.requireOwner(cartId, customer(jwt));
        return cartService.clearCart(cartId);
    }

    private String customer(Jwt jwt) {
        if (jwt == null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);
        String uid = jwt.getClaimAsString("uid");
        return uid == null || uid.isBlank() ? jwt.getSubject() : uid;
    }
}

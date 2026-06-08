package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.CartDtos;
import com.java.vinod.marketplace.service.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping("/{cartId}")
    public CartDtos.CartResponse getCart(@PathVariable String cartId) {
        return cartService.getCart(cartId);
    }

    @PostMapping
    public CartDtos.CartResponse createCart(@RequestParam String customerId) {
        return cartService.getOrCreateCart(customerId);
    }

    @PostMapping("/{cartId}/items")
    public CartDtos.CartItemResponse addToCart(
        @PathVariable String cartId,
        @Valid @RequestBody CartDtos.AddToCartRequest request) {
        return cartService.addToCart(cartId, request);
    }

    @PutMapping("/{cartId}/items/{cartItemId}")
    public CartDtos.CartItemResponse updateQuantity(
        @PathVariable String cartId,
        @PathVariable String cartItemId,
        @Valid @RequestBody CartDtos.UpdateQuantityRequest request) {
        return cartService.updateQuantity(cartId, cartItemId, request.getQuantity());
    }

    @DeleteMapping("/{cartId}/items/{cartItemId}")
    public void removeFromCart(
        @PathVariable String cartId,
        @PathVariable String cartItemId) {
        cartService.removeFromCart(cartId, cartItemId);
    }

    @DeleteMapping("/{cartId}")
    public CartDtos.CartResponse clearCart(@PathVariable String cartId) {
        return cartService.clearCart(cartId);
    }
}

package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.aspect.Retryable;
import com.java.vinod.marketplace.service.dto.CartDtos;
import com.java.vinod.marketplace.service.entity.Cart;
import com.java.vinod.marketplace.service.entity.CartItem;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.repository.CartItemRepository;
import com.java.vinod.marketplace.service.repository.CartRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ListingRepository listingRepository;

    @Transactional
    @Retryable("database-retry")
    public CartDtos.CartResponse getOrCreateCart(String customerId) {
        Optional<Cart> existing = cartRepository.findActiveCartForCustomer(customerId);
        if (existing.isPresent()) {
            return mapToCartResponse(existing.get());
        }

        Cart newCart = Cart.builder()
            .cartId(UUID.randomUUID().toString())
            .customerId(customerId)
            .totalItems(0)
            .subtotal(BigDecimal.ZERO)
            .discountAmount(BigDecimal.ZERO)
            .taxAmount(BigDecimal.ZERO)
            .total(BigDecimal.ZERO)
            .cartStatus("ACTIVE")
            .currencyCode("USD")
            .createdAt(LocalDateTime.now())
            .lastModifiedAt(LocalDateTime.now())
            .build();

        Cart saved = cartRepository.save(newCart);
        log.info("Created new cart {} for customer {}", saved.getCartId(), customerId);
        return mapToCartResponse(saved);
    }

    @Transactional
    @Retryable("database-retry")
    public CartDtos.CartItemResponse addToCart(String cartId, CartDtos.AddToCartRequest request) {
        Cart cart = cartRepository.findByCartId(cartId)
            .orElseThrow(() -> new RuntimeException("Cart not found: " + cartId));

        Listing listing = listingRepository.findByPublicId(request.getListingId())
            .orElseThrow(() -> new RuntimeException("Listing not found: " + request.getListingId()));

        if (isDigitalListing(listing)) {
            throw new ResponseStatusException(BAD_REQUEST, "Digital products cannot be added to cart. Use Buy Now.");
        }

        // Check if item already in cart
        Optional<CartItem> existing = cartItemRepository.findByCartCartIdAndListingId(cartId, listing.getPublicId());
        if (existing.isPresent()) {
            return updateCartItemQuantity(existing.get(), existing.get().getQuantity() + request.getQuantity());
        }

        // Add new item
        CartItem item = CartItem.builder()
            .cartItemId(UUID.randomUUID().toString())
            .cart(cart)
            .listingId(listing.getPublicId())
            .listingTitle(listing.getTitle())
            .providerId(listing.getProviderAccountPublicId())
            .providerName(listing.getSellerDisplayName())
            .quantity(request.getQuantity())
            .unitPrice(listing.getPriceAmount())
            .lineTotal(listing.getPriceAmount().multiply(BigDecimal.valueOf(request.getQuantity())))
            .discountPerUnit(BigDecimal.ZERO)
            .deliveryType(listing.getDeliveryType())
            .verticalCode(listing.getVerticalCode())
            .itemStatus("ADDED")
            .addedAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        CartItem saved = cartItemRepository.save(item);
        recalculateCartTotals(cart);

        log.info("Added item {} to cart {}", listing.getPublicId(), cartId);
        return mapToCartItemResponse(saved);
    }

    @Transactional
    @Retryable("database-retry")
    public void removeFromCart(String cartId, String cartItemId) {
        Cart cart = cartRepository.findByCartId(cartId)
            .orElseThrow(() -> new RuntimeException("Cart not found: " + cartId));

        CartItem item = cartItemRepository.findByCartItemId(cartItemId)
            .orElseThrow(() -> new RuntimeException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Cart item does not belong to this cart");
        }

        cartItemRepository.delete(item);
        recalculateCartTotals(cart);

        log.info("Removed item {} from cart {}", cartItemId, cartId);
    }

    @Transactional
    @Retryable("database-retry")
    public CartDtos.CartItemResponse updateQuantity(String cartId, String cartItemId, int newQuantity) {
        CartItem item = cartItemRepository.findByCartItemId(cartItemId)
            .orElseThrow(() -> new RuntimeException("Cart item not found: " + cartItemId));

        if (!item.getCart().getCartId().equals(cartId)) {
            throw new RuntimeException("Cart item does not belong to this cart");
        }

        return updateCartItemQuantity(item, newQuantity);
    }

    @Transactional
    @Retryable("database-retry")
    public CartDtos.CartResponse clearCart(String cartId) {
        Cart cart = cartRepository.findByCartId(cartId)
            .orElseThrow(() -> new RuntimeException("Cart not found: " + cartId));

        List<CartItem> items = cartItemRepository.findByCartCartId(cartId);
        cartItemRepository.deleteAll(items);

        cart.setTotalItems(0);
        cart.setSubtotal(BigDecimal.ZERO);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setTaxAmount(BigDecimal.ZERO);
        cart.setTotal(BigDecimal.ZERO);
        cartRepository.save(cart);

        log.info("Cleared cart {}", cartId);
        return mapToCartResponse(cart);
    }

    public CartDtos.CartResponse getCart(String cartId) {
        Cart cart = cartRepository.findByCartId(cartId)
            .orElseThrow(() -> new RuntimeException("Cart not found: " + cartId));
        return mapToCartResponse(cart);
    }

    private CartDtos.CartItemResponse updateCartItemQuantity(CartItem item, int newQuantity) {
        if (newQuantity <= 0) {
            cartItemRepository.delete(item);
            recalculateCartTotals(item.getCart());
            return null;
        }

        item.setQuantity(newQuantity);
        item.setLineTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(newQuantity)));
        CartItem saved = cartItemRepository.save(item);
        recalculateCartTotals(item.getCart());

        return mapToCartItemResponse(saved);
    }

    private void recalculateCartTotals(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartCartId(cart.getCartId());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : items) {
            subtotal = subtotal.add(item.getLineTotal());
            totalDiscount = totalDiscount.add(item.getLineDiscount() != null ? item.getLineDiscount() : BigDecimal.ZERO);
            totalItems += item.getQuantity();
        }

        cart.setTotalItems(totalItems);
        cart.setSubtotal(subtotal);
        cart.setDiscountAmount(totalDiscount);
        cart.setTaxAmount(BigDecimal.ZERO); // Tax calculation logic would go here
        cart.setTotal(subtotal.subtract(totalDiscount).add(cart.getTaxAmount()));
        cart.setLastModifiedAt(LocalDateTime.now());

        cartRepository.save(cart);
    }

    private CartDtos.CartResponse mapToCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartCartId(cart.getCartId());
        return CartDtos.CartResponse.builder()
            .cartId(cart.getCartId())
            .totalItems(cart.getTotalItems())
            .subtotal(cart.getSubtotal().doubleValue())
            .discountAmount(cart.getDiscountAmount().doubleValue())
            .taxAmount(cart.getTaxAmount().doubleValue())
            .total(cart.getTotal().doubleValue())
            .currencyCode(cart.getCurrencyCode())
            .items(items.stream().map(this::mapToCartItemResponse).toList())
            .build();
    }

    private boolean isDigitalListing(Listing listing) {
        String productType = listing.getProductType() == null ? "" : listing.getProductType().trim().toUpperCase();
        String deliveryType = listing.getDeliveryType() == null ? "" : listing.getDeliveryType().trim().toUpperCase();
        return "DIGITAL".equals(productType)
            || "INSTANT".equals(deliveryType)
            || "MANUAL".equals(deliveryType)
            || "DOWNLOAD".equals(deliveryType);
    }

    private CartDtos.CartItemResponse mapToCartItemResponse(CartItem item) {
        return CartDtos.CartItemResponse.builder()
            .cartItemId(item.getCartItemId())
            .listingId(item.getListingId())
            .listingTitle(item.getListingTitle())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice().doubleValue())
            .lineTotal(item.getLineTotal().doubleValue())
            .deliveryType(item.getDeliveryType())
            .build();
    }
}

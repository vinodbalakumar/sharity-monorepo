package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.CartDtos;
import com.java.vinod.marketplace.service.entity.Cart;
import com.java.vinod.marketplace.service.entity.CartItem;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.repository.CartItemRepository;
import com.java.vinod.marketplace.service.repository.CartRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private AssetStorageService assetStorageService;

    @InjectMocks
    private CartService cartService;

    @Test
    void addToCartRejectsDigitalListings() {
        Cart cart = cart("cart-1");
        Listing listing = listing("listing-digital", "DIGITAL", "INSTANT");

        when(cartRepository.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart));
        when(listingRepository.findByPublicId("listing-digital")).thenReturn(Optional.of(listing));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () ->
            cartService.addToCart("cart-1", CartDtos.AddToCartRequest.builder()
                .listingId("listing-digital")
                .quantity(1)
                .build())
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        assertEquals("Digital products cannot be added to cart. Use Buy Now.", exception.getReason());
    }

    @Test void cannotReadAnotherCustomersCart() {
        when(cartRepository.findByCartId("cart-1")).thenReturn(Optional.of(cart("cart-1")));
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> cartService.requireOwner("cart-1", "another-customer"));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test void ownerCanAccessTheirCart() {
        when(cartRepository.findByCartId("cart-1")).thenReturn(Optional.of(cart("cart-1")));
        cartService.requireOwner("cart-1", "customer-1");
    }

    @Test void excessiveQuantityIsRejectedBeforeWriting() {
        when(cartRepository.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart("cart-1")));
        when(listingRepository.findByPublicId("listing-physical")).thenReturn(Optional.of(listing("listing-physical", "PHYSICAL", "SHIPPING_REQUIRED")));
        assertThrows(ResponseStatusException.class, () -> cartService.addToCart("cart-1", CartDtos.AddToCartRequest.builder().listingId("listing-physical").quantity(100).build()));
        org.mockito.Mockito.verifyNoInteractions(cartItemRepository);
    }

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.NullAndEmptySource
    @org.junit.jupiter.params.provider.ValueSource(strings = {"Seller One", " "})
    void addToCartAllowsPhysicalListings(String sellerName) {
        Cart cart = cart("cart-1");
        Listing listing = listing("listing-physical", "PHYSICAL", "SHIPPING");
        listing.setSellerDisplayName(sellerName);
        CartItem savedItem = cartItem(cart, listing, 2);

        when(cartRepository.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart));
        when(listingRepository.findByPublicId("listing-physical")).thenReturn(Optional.of(listing));
        when(assetStorageService.publicListingImageUrl(null)).thenReturn(null);
        when(cartItemRepository.findByCartCartIdAndListingId("cart-1", "listing-physical")).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(savedItem);
        when(cartItemRepository.findByCartCartId("cart-1")).thenReturn(List.of(savedItem));
        when(cartRepository.save(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartDtos.CartItemResponse response = cartService.addToCart(
            "cart-1",
            CartDtos.AddToCartRequest.builder().listingId("listing-physical").quantity(2).build()
        );

        assertEquals("listing-physical", response.getListingId());
        assertEquals(2, response.getQuantity());
        assertEquals("SHIPPING", response.getDeliveryType());
        var inserted = org.mockito.ArgumentCaptor.forClass(CartItem.class);
        org.mockito.Mockito.verify(cartItemRepository).save(inserted.capture());
        assertEquals(sellerName == null || sellerName.isBlank() ? "Marketplace seller" : sellerName,
                inserted.getValue().getProviderName());
    }

    @Test
    void quantityUpdateLocksCartBeforeReadingItsItems() {
        Cart cart = cart("cart-1");
        Listing listing = listing("listing-physical", "PHYSICAL", "SHIPPING");
        CartItem item = cartItem(cart, listing, 1);
        when(cartRepository.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartItemId("cart-item-1")).thenReturn(Optional.of(item));
        when(cartItemRepository.save(item)).thenReturn(item);
        when(cartItemRepository.findByCartCartId("cart-1")).thenReturn(List.of(item));
        when(listingRepository.findByPublicId(listing.getPublicId())).thenReturn(Optional.of(listing));

        assertEquals(3, cartService.updateQuantity("cart-1", "cart-item-1", 3).getQuantity());

        var locks = org.mockito.Mockito.inOrder(cartRepository, cartItemRepository);
        locks.verify(cartRepository).findByCartIdForUpdate("cart-1");
        locks.verify(cartItemRepository).findByCartItemId("cart-item-1");
        assertEquals(3, cart.getTotalItems());
    }

    @Test
    void removalLocksCartBeforeReadingItsItems() {
        Cart cart = cart("cart-1");
        CartItem item = cartItem(cart, listing("listing-physical", "PHYSICAL", "SHIPPING"), 1);
        when(cartRepository.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartItemId("cart-item-1")).thenReturn(Optional.of(item));
        when(cartItemRepository.findByCartCartId("cart-1")).thenReturn(List.of());

        cartService.removeFromCart("cart-1", "cart-item-1");

        var locks = org.mockito.Mockito.inOrder(cartRepository, cartItemRepository);
        locks.verify(cartRepository).findByCartIdForUpdate("cart-1");
        locks.verify(cartItemRepository).findByCartItemId("cart-item-1");
        org.mockito.Mockito.verify(cartItemRepository).delete(item);
        assertEquals(0, cart.getTotalItems());
    }

    @Test
    void clearingLocksCartBeforeReadingItsItems() {
        Cart cart = cart("cart-1");
        when(cartRepository.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartCartId("cart-1")).thenReturn(List.of());
        when(cartRepository.save(cart)).thenReturn(cart);

        cartService.clearCart("cart-1");

        var locks = org.mockito.Mockito.inOrder(cartRepository, cartItemRepository);
        locks.verify(cartRepository).findByCartIdForUpdate("cart-1");
        locks.verify(cartItemRepository).findByCartCartId("cart-1");
    }

    private static Cart cart(String cartId) {
        return Cart.builder()
            .id(1L)
            .cartId(cartId)
            .customerId("customer-1")
            .totalItems(0)
            .subtotal(BigDecimal.ZERO)
            .discountAmount(BigDecimal.ZERO)
            .taxAmount(BigDecimal.ZERO)
            .total(BigDecimal.ZERO)
            .currencyCode("USD")
            .cartStatus("ACTIVE")
            .build();
    }

    private static Listing listing(String publicId, String productType, String deliveryType) {
        Listing listing = new Listing();
        listing.setPublicId(publicId);
        listing.setProviderAccountPublicId("provider-1");
        listing.setCreatedByUserPublicId("user-1");
        listing.setTitle("Listing " + publicId);
        listing.setProductType(productType);
        listing.setDeliveryType(deliveryType);
        listing.setVerticalCode("MARKETPLACE");
        listing.setCurrencyCode("USD");
        listing.setPriceAmount(BigDecimal.valueOf(19.99));
        listing.setListingStatus("ACTIVE");
        listing.setSellerDisplayName("Seller One");
        return listing;
    }

    private static CartItem cartItem(Cart cart, Listing listing, int quantity) {
        return CartItem.builder()
            .id(1L)
            .cart(cart)
            .cartItemId("cart-item-1")
            .listingId(listing.getPublicId())
            .listingTitle(listing.getTitle())
            .providerId(listing.getProviderAccountPublicId())
            .providerName(listing.getSellerDisplayName())
            .quantity(quantity)
            .unitPrice(listing.getPriceAmount())
            .lineTotal(listing.getPriceAmount().multiply(BigDecimal.valueOf(quantity)))
            .discountPerUnit(BigDecimal.ZERO)
            .lineDiscount(BigDecimal.ZERO)
            .deliveryType(listing.getDeliveryType())
            .verticalCode(listing.getVerticalCode())
            .itemStatus("ADDED")
            .build();
    }
}

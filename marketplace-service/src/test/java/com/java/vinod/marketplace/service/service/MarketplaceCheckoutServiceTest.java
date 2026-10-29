package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceCheckoutDtos;
import com.java.vinod.marketplace.service.entity.Cart;
import com.java.vinod.marketplace.service.entity.CartItem;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.ListingStatusMaster;
import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.CartItemRepository;
import com.java.vinod.marketplace.service.repository.CartRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.ListingStatusMasterRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCheckoutRepository;
import com.java.vinod.marketplace.service.repository.OrderHeaderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class MarketplaceCheckoutServiceTest {
    private static final String KEY = "checkout-key-1234567890";
    private final CartRepository carts = mock(CartRepository.class);
    private final CartItemRepository cartItems = mock(CartItemRepository.class);
    private final ListingRepository listings = mock(ListingRepository.class);
    private final ListingStatusMasterRepository statuses = mock(ListingStatusMasterRepository.class);
    private final MarketplaceCheckoutRepository checkouts = mock(MarketplaceCheckoutRepository.class);
    private final OrderHeaderRepository orders = mock(OrderHeaderRepository.class);
    private final MarketplaceEventOutboxService outbox = mock(MarketplaceEventOutboxService.class);
    private final MarketplaceService marketplace = mock(MarketplaceService.class);
    private final Jwt buyer = Jwt.withTokenValue("t").header("alg", "none").subject("buyer").build();
    private MarketplaceCheckoutService service;
    private Cart cart;
    private CartItem itemB;
    private CartItem itemA;
    private Listing listingA;
    private Listing listingB;

    @BeforeEach
    void setUp() {
        service = new MarketplaceCheckoutService(carts, cartItems, listings, statuses, checkouts, orders, outbox,
                marketplace);
        ReflectionTestUtils.setField(service, "purchasesEnabled", true);
        cart = new Cart();
        cart.setCartId("cart-1");
        cart.setCustomerId("buyer");
        cart.setCurrencyCode("USD");
        cart.setTotalItems(3);
        cart.setSubtotal(new BigDecimal("53.97"));
        cart.setTotal(new BigDecimal("53.97"));
        listingA = listing("listing-a", "seller-1", "store-1", "19.99", 5);
        listingB = listing("listing-b", "seller-2", "store-2", "6.99", 2);
        itemA = item("item-a", "listing-a", 2, "19.99");
        itemB = item("item-b", "listing-b", 2, "6.99");
        when(carts.findByCartIdForUpdate("cart-1")).thenReturn(Optional.of(cart));
        when(cartItems.findByCartIdForUpdate("cart-1")).thenReturn(new ArrayList<>(List.of(itemB, itemA)));
        when(listings.findForPurchase("listing-a")).thenReturn(Optional.of(listingA));
        when(listings.findForPurchase("listing-b")).thenReturn(Optional.of(listingB));
        ListingStatusMaster active = new ListingStatusMaster();
        active.setActive(true);
        active.setCustomerVisible(true);
        when(statuses.findByStatusCodeIgnoreCase("ACTIVE")).thenReturn(Optional.of(active));
        when(checkouts.findByCustomerUserPublicIdAndIdempotencyKey(anyString(), anyString())).thenReturn(Optional.empty());
        when(checkouts.saveAndFlush(any())).thenAnswer(inv -> {
            MarketplaceCheckout checkout = inv.getArgument(0);
            checkout.setId(10L);
            return checkout;
        });
        when(orders.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createsParentCheckoutWithChildOrdersReservesStockConsumesCartAndQueuesOnePaymentCommand() {
        MarketplaceCheckoutDtos.CheckoutResponse response = service.checkoutCart("cart-1", request(), KEY, buyer);

        assertThat(response.status()).isEqualTo("PAYMENT_PENDING");
        assertThat(response.currencyCode()).isEqualTo("USD");
        // listing-a: 2 x 19.99 = 39.98, fee 1.999 -> 2.00; listing-b: 2 x 6.99 = 13.98, fee 0.699 -> 0.70
        assertThat(response.itemAmount()).isEqualByComparingTo("53.96");
        assertThat(response.customerTotalAmount()).isEqualByComparingTo("53.96");
        assertThat(response.platformFeeAmount()).isEqualByComparingTo("2.70");
        assertThat(response.providerAmount()).isEqualByComparingTo("51.26");
        assertThat(response.orders()).extracting(o -> o.listingPublicId()).containsExactly("listing-a", "listing-b");
        assertThat(response.orders()).extracting(o -> o.customerTotalAmount().toPlainString()).containsExactly("39.98", "13.98");
        assertThat(response.orders()).extracting(o -> o.quantity()).containsExactly(2, 2);

        ArgumentCaptor<OrderHeader> saved = ArgumentCaptor.forClass(OrderHeader.class);
        verify(orders, times(2)).save(saved.capture());
        OrderHeader first = saved.getAllValues().get(0);
        assertThat(first.getQuantity()).isEqualTo(2);
        assertThat(first.getUnitPriceAmount()).isEqualByComparingTo("19.99");
        assertThat(first.getPlatformFeeAmount()).isEqualByComparingTo("2.00");
        assertThat(first.getProviderExpectedAmount()).isEqualByComparingTo("37.98");
        assertThat(first.getProviderAccountPublicId()).isEqualTo("store-1");
        assertThat(first.getCartItemPublicId()).isEqualTo("item-a");
        assertThat(first.getCheckout().getId()).isEqualTo(10L);
        assertThat(saved.getAllValues()).allSatisfy(order -> {
            assertThat(order.isConsolidatedCheckoutChild()).isTrue();
            assertThat(order.getPaymentStatus()).isEqualTo("PENDING");
        });

        assertThat(listingA.getStockQuantity()).isEqualTo(3);
        assertThat(listingA.getListingStatus()).isEqualTo("ACTIVE");
        assertThat(listingB.getStockQuantity()).isZero();
        assertThat(listingB.getListingStatus()).isEqualTo("RESERVED");
        verify(cartItems).deleteAll(List.of(itemB, itemA));
        assertThat(cart.getTotalItems()).isZero();
        assertThat(cart.getTotal()).isEqualByComparingTo("0");
        verify(outbox, times(1)).queueCheckoutPaymentCreate(any(), anyList());

        InOrder lockOrder = inOrder(carts, checkouts, cartItems, listings);
        lockOrder.verify(carts).findByCartIdForUpdate("cart-1");
        lockOrder.verify(checkouts).findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY);
        lockOrder.verify(cartItems).findByCartIdForUpdate("cart-1");
        lockOrder.verify(listings).findForPurchase("listing-a");
        lockOrder.verify(listings).findForPurchase("listing-b");
    }

    @Test
    void replayWithSameKeyAndPayloadReturnsOriginalCheckoutEvenAfterCartWasConsumed() {
        MarketplaceCheckout existing = existingCheckout(MarketplaceCheckoutService.fingerprint("cart-1", request().items()));
        OrderHeader child = new OrderHeader();
        child.setPublicId("order-1");
        child.setListing(listingA);
        child.setCustomerTotalAmount(new BigDecimal("39.98"));
        when(checkouts.findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY)).thenReturn(Optional.of(existing));
        when(orders.findByCheckout_IdOrderByIdAsc(7L)).thenReturn(List.of(child));
        when(cartItems.findByCartIdForUpdate("cart-1")).thenReturn(List.of());

        MarketplaceCheckoutDtos.CheckoutResponse response = service.checkoutCart("cart-1", reorderedRequest(), KEY, buyer);

        assertThat(response.checkoutPublicId()).isEqualTo("checkout-1");
        assertThat(response.orders()).extracting(o -> o.publicId()).containsExactly("order-1");
        verify(checkouts, never()).saveAndFlush(any());
        verify(orders, never()).save(any());
        verifyNoInteractions(outbox);
    }

    @Test
    void sameKeyWithDifferentPayloadConflicts() {
        when(checkouts.findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY))
                .thenReturn(Optional.of(existingCheckout("different-fingerprint")));
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.CONFLICT);
        verify(checkouts, never()).saveAndFlush(any());
        verifyNoInteractions(outbox);
    }

    @Test
    void idempotencyKeyIsRequiredAndValidated() {
        assertStatus(() -> service.checkoutCart("cart-1", request(), null, buyer), HttpStatus.BAD_REQUEST);
        assertStatus(() -> service.checkoutCart("cart-1", request(), "short", buyer), HttpStatus.BAD_REQUEST);
        assertStatus(() -> service.checkoutCart("cart-1", request(), "bad key with spaces!!!", buyer), HttpStatus.BAD_REQUEST);
        verifyNoInteractions(carts, outbox);
    }

    @Test
    void cartOwnedByAnotherCustomerIsNotFound() {
        cart.setCustomerId("someone-else");
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.NOT_FOUND);
        verifyNoInteractions(outbox);
        verify(listings, never()).findForPurchase(anyString());
    }

    @Test
    void disabledPurchasesAreUnavailable() {
        ReflectionTestUtils.setField(service, "purchasesEnabled", false);
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.SERVICE_UNAVAILABLE);
        verifyNoInteractions(outbox);
    }

    @Test
    void snapshotMustMatchEveryCurrentCartLine() {
        MarketplaceCheckoutDtos.CheckoutRequest missingLine = new MarketplaceCheckoutDtos.CheckoutRequest(List.of(
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-a", 2, new BigDecimal("19.99"), "USD")));
        assertStatus(() -> service.checkoutCart("cart-1", missingLine, KEY, buyer), HttpStatus.CONFLICT);

        MarketplaceCheckoutDtos.CheckoutRequest wrongQuantity = new MarketplaceCheckoutDtos.CheckoutRequest(List.of(
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-a", 1, new BigDecimal("19.99"), "USD"),
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-b", 2, new BigDecimal("6.99"), "USD")));
        assertStatus(() -> service.checkoutCart("cart-1", wrongQuantity, KEY, buyer), HttpStatus.CONFLICT);

        MarketplaceCheckoutDtos.CheckoutRequest wrongCurrency = new MarketplaceCheckoutDtos.CheckoutRequest(List.of(
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-a", 2, new BigDecimal("19.99"), "EUR"),
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-b", 2, new BigDecimal("6.99"), "USD")));
        assertStatus(() -> service.checkoutCart("cart-1", wrongCurrency, KEY, buyer), HttpStatus.CONFLICT);

        verify(orders, never()).save(any());
        verifyNoInteractions(outbox);
    }

    @Test
    void digitalLinesAreRejectedWithoutFallback() {
        listingB.setProductType("DIGITAL");
        listingB.setDeliveryType("DIGITAL_DOWNLOAD");
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.BAD_REQUEST);
        assertThat(listingA.getStockQuantity()).isEqualTo(5);
        verify(cartItems, never()).deleteAll(any());
        verifyNoInteractions(outbox);
    }

    @Test
    void insufficientStockPreventsOversell() {
        listingB.setStockQuantity(1);
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.CONFLICT);
        assertThat(listingA.getStockQuantity()).isEqualTo(5);
        verify(orders, never()).save(any());
        verifyNoInteractions(outbox);
    }

    @Test
    void unavailableListingsAndSelfPurchaseAreRejected() {
        listingA.setListingStatus("SOLD");
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.CONFLICT);
        listingA.setListingStatus("ACTIVE");
        listingA.setCreatedByUserPublicId("buyer");
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.BAD_REQUEST);
        verifyNoInteractions(outbox);
    }

    @Test
    void listingCurrencyChangeIsRejected() {
        listingA.setCurrencyCode("EUR");
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.CONFLICT);
        verifyNoInteractions(outbox);
    }

    @Test
    void priceChangeRepricesCartAndRequiresReviewWithoutCreatingOrders() {
        listingA.setPriceAmount(new BigDecimal("21.00"));
        assertThatThrownBy(() -> service.checkoutCart("cart-1", request(), KEY, buyer))
                .isInstanceOf(MarketplaceCheckoutService.CheckoutPriceChangedException.class);
        assertThat(itemA.getUnitPrice()).isEqualByComparingTo("21.00");
        assertThat(itemA.getLineTotal()).isEqualByComparingTo("42.00");
        assertThat(cart.getSubtotal()).isEqualByComparingTo("55.98");
        assertThat(listingA.getStockQuantity()).isEqualTo(5);
        verify(checkouts, never()).saveAndFlush(any());
        verify(cartItems, never()).deleteAll(any());
        verifyNoInteractions(outbox);
    }

    @Test
    void concurrentDuplicateInsertIsReportedAsConflict() {
        org.mockito.Mockito.doThrow(new DataIntegrityViolationException("duplicate")).when(checkouts).saveAndFlush(any());
        assertStatus(() -> service.checkoutCart("cart-1", request(), KEY, buyer), HttpStatus.CONFLICT);
        verifyNoInteractions(outbox);
    }

    @Test
    void checkoutLookupIsOwnerOnly() {
        MarketplaceCheckout existing = existingCheckout("fp");
        when(checkouts.findByPublicIdForUpdate("checkout-1")).thenReturn(Optional.of(existing));
        when(orders.findByCheckout_IdOrderByIdAsc(7L)).thenReturn(List.of());
        assertThat(service.checkout("checkout-1", buyer).checkoutPublicId()).isEqualTo("checkout-1");
        Jwt other = Jwt.withTokenValue("t").header("alg", "none").subject("other").build();
        assertStatus(() -> service.checkout("checkout-1", other), HttpStatus.NOT_FOUND);
    }

    @Test
    void attemptResolutionLocksOwnedCartBeforeBuyerKeyLookupAndReturnsDefinitiveAbsenceWithoutWrites() {
        ReflectionTestUtils.setField(service, "purchasesEnabled", false);
        assertThat(service.checkoutAttempt("cart-1", KEY, buyer).checkout()).isNull();

        InOrder lookupOrder = inOrder(carts, checkouts);
        lookupOrder.verify(carts).findByCartIdForUpdate("cart-1");
        lookupOrder.verify(checkouts).findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY);
        org.mockito.Mockito.verifyNoMoreInteractions(carts, checkouts);
        verifyNoInteractions(cartItems, listings, orders, outbox, marketplace);
        assertThat(cart.getTotalItems()).isEqualTo(3);
        assertThat(cart.getTotal()).isEqualByComparingTo("53.97");
    }

    @Test
    void attemptResolutionSeesCheckoutCommittedWhileWaitingForCartLockWithoutRefreshingPayment() {
        MarketplaceCheckout existing = existingCheckout("a-different-snapshot-is-still-recovered");
        when(carts.findByCartIdForUpdate("cart-1")).thenAnswer(invocation -> {
            when(checkouts.findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY))
                    .thenReturn(Optional.of(existing));
            return Optional.of(cart);
        });
        when(orders.findByCheckout_IdOrderByIdAsc(7L)).thenReturn(List.of());

        assertThat(service.checkoutAttempt("cart-1", KEY, buyer).checkout().checkoutPublicId())
                .isEqualTo("checkout-1");
        InOrder lookupOrder = inOrder(carts, checkouts, orders);
        lookupOrder.verify(carts).findByCartIdForUpdate("cart-1");
        lookupOrder.verify(checkouts).findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY);
        lookupOrder.verify(orders).findByCheckout_IdOrderByIdAsc(7L);
        org.mockito.Mockito.verifyNoMoreInteractions(carts, checkouts, orders);
        verifyNoInteractions(cartItems, listings, outbox, marketplace);
    }

    @Test
    void attemptResolutionRequiresOwnedExistingCartBeforeLookingUpKey() {
        Jwt other = Jwt.withTokenValue("t").header("alg", "none").subject("other").build();
        assertStatus(() -> service.checkoutAttempt("cart-1", KEY, other), HttpStatus.NOT_FOUND);
        when(carts.findByCartIdForUpdate("cart-1")).thenReturn(Optional.empty());
        assertStatus(() -> service.checkoutAttempt("cart-1", KEY, buyer), HttpStatus.NOT_FOUND);
        verifyNoInteractions(checkouts, orders, outbox, marketplace);
    }

    @Test
    void attemptResolutionRejectsKeyBoundToAnotherCartRatherThanReturningAbsence() {
        MarketplaceCheckout existing = existingCheckout("fp");
        existing.setCartPublicId("cart-2");
        when(checkouts.findByCustomerUserPublicIdAndIdempotencyKey("buyer", KEY))
                .thenReturn(Optional.of(existing));
        assertStatus(() -> service.checkoutAttempt("cart-1", KEY, buyer), HttpStatus.CONFLICT);
        verifyNoInteractions(orders, outbox, marketplace);
    }

    @Test
    void attemptResolutionRequiresValidKeyAndAuthenticatedBuyer() {
        assertStatus(() -> service.checkoutAttempt("cart-1", null, buyer), HttpStatus.BAD_REQUEST);
        assertStatus(() -> service.checkoutAttempt("cart-1", "short", buyer), HttpStatus.BAD_REQUEST);
        assertStatus(() -> service.checkoutAttempt("cart-1", KEY, null), HttpStatus.UNAUTHORIZED);
        verifyNoInteractions(carts, checkouts, orders, outbox, marketplace);
    }

    @Test
    void attemptResolutionUsesFreshWriteCapableTransactionForLockButDoesNotSyncPayments() throws Exception {
        var transaction = MarketplaceCheckoutService.class.getMethod("checkoutAttempt",
                String.class, String.class, Jwt.class)
                .getAnnotation(org.springframework.transaction.annotation.Transactional.class);
        assertThat(transaction).isNotNull();
        assertThat(transaction.readOnly()).isFalse();
        assertThat(transaction.isolation()).isEqualTo(org.springframework.transaction.annotation.Isolation.READ_COMMITTED);
    }

    @Test
    void refundOrCancelOfConsolidatedOrdersIsRejectedButLegacyOrdersPass() {
        when(checkouts.existsByPublicId("checkout-1")).thenReturn(true);
        when(orders.existsByPublicIdAndCheckoutIsNotNull("child-order")).thenReturn(true);
        assertStatus(() -> service.rejectConsolidatedRefundOrCancel("checkout-1"), HttpStatus.CONFLICT);
        assertStatus(() -> service.rejectConsolidatedRefundOrCancel(null, "child-order"), HttpStatus.CONFLICT);
        service.rejectConsolidatedRefundOrCancel("legacy-order", null, " ");
    }

    @Test
    void fingerprintIsOrderIndependentAndPriceScaleInsensitive() {
        assertThat(MarketplaceCheckoutService.fingerprint("cart-1", request().items()))
                .isEqualTo(MarketplaceCheckoutService.fingerprint("cart-1", reorderedRequest().items()));
        assertThat(MarketplaceCheckoutService.fingerprint("cart-1", request().items()))
                .isNotEqualTo(MarketplaceCheckoutService.fingerprint("cart-2", request().items()));
    }

    private MarketplaceCheckoutDtos.CheckoutRequest request() {
        return new MarketplaceCheckoutDtos.CheckoutRequest(List.of(
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-a", 2, new BigDecimal("19.99"), "USD"),
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-b", 2, new BigDecimal("6.99"), "USD")));
    }

    private MarketplaceCheckoutDtos.CheckoutRequest reorderedRequest() {
        return new MarketplaceCheckoutDtos.CheckoutRequest(List.of(
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-b", 2, new BigDecimal("6.990"), "usd"),
                new MarketplaceCheckoutDtos.CheckoutItemRequest("item-a", 2, new BigDecimal("19.99"), "USD")));
    }

    private MarketplaceCheckout existingCheckout(String fingerprint) {
        MarketplaceCheckout checkout = new MarketplaceCheckout();
        checkout.setId(7L);
        checkout.setPublicId("checkout-1");
        checkout.setCustomerUserPublicId("buyer");
        checkout.setCartPublicId("cart-1");
        checkout.setRequestFingerprint(fingerprint);
        checkout.setCheckoutStatus("PAYMENT_PENDING");
        checkout.setCurrencyCode("USD");
        return checkout;
    }

    private static Listing listing(String id, String owner, String store, String price, int stock) {
        Listing listing = new Listing();
        listing.setPublicId(id);
        listing.setCreatedByUserPublicId(owner);
        listing.setProviderAccountPublicId(store);
        listing.setProviderCountryCode("US");
        listing.setProductType("PHYSICAL");
        listing.setDeliveryType("SHIPPING_REQUIRED");
        listing.setCurrencyCode("USD");
        listing.setPriceAmount(new BigDecimal(price));
        listing.setListingStatus("ACTIVE");
        listing.setStockQuantity(stock);
        return listing;
    }

    private CartItem item(String id, String listingId, int quantity, String price) {
        CartItem item = new CartItem();
        item.setCartItemId(id);
        item.setCart(cart);
        item.setListingId(listingId);
        item.setQuantity(quantity);
        item.setUnitPrice(new BigDecimal(price));
        item.setLineTotal(new BigDecimal(price).multiply(BigDecimal.valueOf(quantity)));
        return item;
    }

    private static void assertStatus(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                ex -> assertThat(ex.getStatusCode()).isEqualTo(status));
    }
}

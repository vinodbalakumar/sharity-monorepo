package com.java.vinod.marketplace.service.service;

import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.*;
import com.java.vinod.marketplace.service.repository.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import static org.assertj.core.api.Assertions.*;

class PurchaseIntegrityTest {
    ListingRepository listings = mock(ListingRepository.class);
    ListingStatusMasterRepository statuses = mock(ListingStatusMasterRepository.class);
    OrderHeaderRepository orders = mock(OrderHeaderRepository.class);
    MarketplaceEventOutboxService outbox = mock(MarketplaceEventOutboxService.class);
    MarketplaceService service;
    Listing listing;
    Jwt buyer = Jwt.withTokenValue("test").header("alg", "none").subject("buyer").build();
    @BeforeEach void setup() {
        service = new MarketplaceService(listings, statuses, mock(MarketplaceCategoryRepository.class), mock(MarketplaceVerticalRepository.class),
                mock(SellerProfileRepository.class), mock(ProductTypeMasterRepository.class), mock(DeliveryTypeMasterRepository.class), orders,
                mock(DeliverySubmissionRepository.class), mock(CustomerAcceptanceRepository.class), mock(DisputeCaseRepository.class),
                mock(AssetStorageProviderRepository.class), outbox, mock(MarketplaceCurrencyService.class), "https://identity.example", "https://payments.example", "test-token");
        ReflectionTestUtils.setField(service, "demoPurchasesEnabled", true);
        listing = new Listing(); listing.setPublicId("listing-1"); listing.setCreatedByUserPublicId("seller");
        listing.setProviderAccountPublicId("store-1"); listing.setCurrencyCode("USD"); listing.setPriceAmount(new BigDecimal("20.00")); listing.setListingStatus("ACTIVE");
        when(listings.findForPurchase("listing-1")).thenReturn(Optional.of(listing));
        var active = new ListingStatusMaster(); active.setActive(true); active.setCustomerVisible(true);
        when(statuses.findByStatusCodeIgnoreCase("ACTIVE")).thenReturn(Optional.of(active));
        when(orders.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }
    @Test void newOrdersRemainPendingUntilPaymentIsVerified() {
        var response = service.createOrder(new MarketplaceDtos.OrderRequest("listing-1", new BigDecimal("20.00"), "USD"), buyer, "purchase-request-123456");
        assertThat(response.paymentStatus()).isEqualTo("PENDING");
        assertThat(response.orderStatus()).isEqualTo("PAYMENT_PENDING");
        verify(outbox).queuePaymentOrderCreate(any());
    }
    @Test void repeatedIntentReturnsExistingOrderWithoutChargingAgain() {
        var order = new OrderHeader(); order.setPublicId("order-1"); order.setListing(listing); order.setPaymentStatus("PENDING");
        when(orders.findByPurchaseRequestKey("buyer:purchase-request-123456")).thenReturn(Optional.of(order));
        assertThat(service.createOrder(new MarketplaceDtos.OrderRequest("listing-1"), buyer, "purchase-request-123456").publicId()).isEqualTo("order-1");
        verify(orders, never()).save(any()); verifyNoInteractions(outbox);
    }
    @Test void priceChangesRequireAnotherReview() {
        assertThatThrownBy(() -> service.createOrder(new MarketplaceDtos.OrderRequest("listing-1", new BigDecimal("10.00"), "USD"), buyer, "purchase-request-123456"))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        verifyNoInteractions(outbox);
    }
    @Test void disabledCheckoutCannotCreateAnOrder() {
        ReflectionTestUtils.setField(service, "demoPurchasesEnabled", false);
        assertThatThrownBy(() -> service.createOrder(new MarketplaceDtos.OrderRequest("listing-1"), buyer, "purchase-request-123456"))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        verifyNoInteractions(outbox);
    }
    @Test void requestKeysCannotBeReusedForDifferentListings() {
        var another = new Listing(); another.setPublicId("different-listing");
        var order = new OrderHeader(); order.setListing(another);
        when(orders.findByPurchaseRequestKey("buyer:purchase-request-123456")).thenReturn(Optional.of(order));
        assertThatThrownBy(() -> service.createOrder(new MarketplaceDtos.OrderRequest("listing-1"), buyer, "purchase-request-123456"))
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        verifyNoInteractions(outbox);
    }
}

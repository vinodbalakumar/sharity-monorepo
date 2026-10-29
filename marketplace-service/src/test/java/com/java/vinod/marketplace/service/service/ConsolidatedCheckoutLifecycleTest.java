package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.dto.MarketplaceCheckoutDtos;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies consolidated checkout children use the aggregate checkout payment lifecycle instead of legacy order paths.
 */
class ConsolidatedCheckoutLifecycleTest {
    private final OrderHeaderRepository orders = mock(OrderHeaderRepository.class);
    private final DisputeCaseRepository disputes = mock(DisputeCaseRepository.class);
    private final CustomerAcceptanceRepository acceptances = mock(CustomerAcceptanceRepository.class);
    private final MarketplaceEventOutboxService outbox = mock(MarketplaceEventOutboxService.class);
    private final Jwt buyer = Jwt.withTokenValue("t").header("alg", "none").subject("buyer").build();
    private MarketplaceService service;
    private MarketplaceCheckout checkout;
    private Listing listing;
    private OrderHeader child;
    private OrderHeader sibling;
    private MockRestServiceServer paymentServer;
    private MarketplaceCheckoutService checkoutService;

    @BeforeEach
    void setUp() {
        service = new MarketplaceService(mock(ListingRepository.class), mock(ListingStatusMasterRepository.class),
                mock(MarketplaceCategoryRepository.class), mock(MarketplaceVerticalRepository.class),
                mock(SellerProfileRepository.class), mock(ProductTypeMasterRepository.class), mock(DeliveryTypeMasterRepository.class), orders,
                mock(DeliverySubmissionRepository.class), acceptances, disputes,
                mock(AssetStorageProviderRepository.class), outbox, mock(MarketplaceCurrencyService.class),
                "https://identity.example", "https://payments.example", "test-token");
        checkout = new MarketplaceCheckout();
        checkout.setId(5L);
        checkout.setPublicId("checkout-1");
        checkout.setCustomerUserPublicId("buyer");
        checkout.setCurrencyCode("USD");
        checkout.setCustomerTotalAmount(new BigDecimal("20.00"));
        checkout.setPlatformFeeAmount(new BigDecimal("1.00"));
        checkout.setProviderAmount(new BigDecimal("19.00"));
        checkout.setCheckoutStatus("PAYMENT_PENDING");
        listing = new Listing();
        listing.setPublicId("listing-1");
        listing.setListingStatus("ACTIVE");
        listing.setStockQuantity(3);
        child = child("order-1");
        sibling = child("order-2");
        when(orders.findByPublicId("order-1")).thenReturn(Optional.of(child));
        when(orders.findByCheckout_IdOrderByIdAsc(5L)).thenReturn(List.of(child, sibling));
        RestClient.Builder builder = RestClient.builder();
        paymentServer = MockRestServiceServer.bindTo(builder).build();
        ReflectionTestUtils.setField(service, "restClient", builder.build());
        MarketplaceCheckoutRepository checkouts = mock(MarketplaceCheckoutRepository.class);
        when(checkouts.findByPublicIdForUpdate("checkout-1")).thenReturn(Optional.of(checkout));
        checkoutService = new MarketplaceCheckoutService(mock(CartRepository.class), mock(CartItemRepository.class),
                mock(ListingRepository.class), mock(ListingStatusMasterRepository.class), checkouts, orders, outbox, service);
    }

    @Test
    void acceptanceRoutesToCheckoutAllocationAndKeepsMultiQuantityListingAvailable() {
        MarketplaceDtos.MessageResponse response = service.accept("order-1", buyer);

        var locks = org.mockito.Mockito.inOrder(orders);
        locks.verify(orders).lockCheckoutByOrderPublicId("order-1");
        locks.verify(orders).findByPublicId("order-1");
        assertThat(response.message()).contains("payout eligibility requested");
        assertThat(child.getFulfillmentStatus()).isEqualTo("ACCEPTED");
        assertThat(child.getPayoutStatus()).isEqualTo("ELIGIBLE_REQUESTED");
        assertThat(listing.getListingStatus()).isEqualTo("ACTIVE");
        verify(outbox).queueCheckoutAllocationPayoutEligible(child);
        verify(outbox, never()).queueMarkPayoutEligible(any());
    }

    @Test
    void problemReportHoldsAllocationThroughDisputeWithoutRefund() {
        service.reportProblem("order-1", new MarketplaceDtos.ProblemRequest("DAMAGED", "Broken on arrival"), buyer);

        var locks = org.mockito.Mockito.inOrder(orders);
        locks.verify(orders).lockCheckoutByOrderPublicId("order-1");
        locks.verify(orders).findByPublicId("order-1");
        assertThat(child.getPayoutStatus()).isEqualTo("BLOCKED_BY_DISPUTE");
        verify(disputes).save(any());
        verify(outbox).queueCheckoutAllocationDispute(child, "DAMAGED: Broken on arrival");
        verify(outbox, never()).queueRefundRequest(any(), anyString());
        verify(outbox, never()).queueDisputeRequest(any(), anyString());
    }

    @Test
    void longProblemReportRetainsFullDescriptionAndQueuesBoundedLedgerReason() {
        String description = "Broken on arrival. ".repeat(100);

        service.reportProblem("order-1", new MarketplaceDtos.ProblemRequest("DAMAGED", description), buyer);

        var report = org.mockito.ArgumentCaptor.forClass(com.java.vinod.marketplace.service.entity.DisputeCase.class);
        verify(disputes).save(report.capture());
        assertThat(report.getValue().getDescription()).isEqualTo(description);
        var reason = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(outbox).queueCheckoutAllocationDispute(org.mockito.ArgumentMatchers.eq(child), reason.capture());
        assertThat(reason.getValue()).hasSize(255).startsWith("DAMAGED: Broken on arrival.");
        assertThat(child.getPayoutStatus()).isEqualTo("BLOCKED_BY_DISPUTE");
    }

    @Test
    void checkoutPaymentStateAppliesToAllChildrenAndPreservesDisputeHolds() {
        sibling.setPayoutStatus("BLOCKED_BY_DISPUTE");
        when(orders.findByCheckout_IdOrderByIdAsc(5L)).thenReturn(List.of(child, sibling));

        service.applyCheckoutPaymentState(child, new MarketplaceService.CheckoutPaymentState("checkout-1", "CAPTURED", List.of(
                new MarketplaceService.CheckoutAllocationState("order-1", "HELD"),
                new MarketplaceService.CheckoutAllocationState("order-2", "ELIGIBLE"))));

        assertThat(child.getPaymentStatus()).isEqualTo("CAPTURED");
        assertThat(child.getOrderStatus()).isEqualTo("PURCHASED");
        assertThat(child.getPayoutStatus()).isEqualTo("HELD");
        assertThat(sibling.getOrderStatus()).isEqualTo("PURCHASED");
        assertThat(sibling.getPayoutStatus()).isEqualTo("BLOCKED_BY_DISPUTE");
        assertThat(checkout.getCheckoutStatus()).isEqualTo("DISPUTE_HOLD");
    }

    @Test
    void failedAggregatePaymentMarksCheckoutFailedAndMissingStatusIsRejected() {
        when(orders.findByCheckout_IdOrderByIdAsc(5L)).thenReturn(List.of(child, sibling));
        assertThatThrownBy(() -> service.applyCheckoutPaymentState(child,
                new MarketplaceService.CheckoutPaymentState("checkout-1", null, null)))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(checkout.getCheckoutStatus()).isEqualTo("PAYMENT_PENDING");

        service.applyCheckoutPaymentState(child, state("checkout-1", "FAILED", "PENDING_CAPTURE", "PENDING_CAPTURE"));
        assertThat(checkout.getCheckoutStatus()).isEqualTo("PAYMENT_FAILED");
        assertThat(sibling.getPaymentStatus()).isEqualTo("FAILED");
        assertThat(sibling.getOrderStatus()).isEqualTo("PAYMENT_PENDING");
    }

    @Test
    void parsesPaymentServiceAggregateResponseAndMapsDisputeHold() throws Exception {
        String json = "{\"checkoutPublicId\":\"checkout-1\",\"paymentStatus\":\"CAPTURED\",\"payoutMode\":\"LEDGER_ONLY\","
                + "\"allocations\":[{\"marketplaceOrderPublicId\":\"order-1\",\"allocationStatus\":\"DISPUTE_HOLD\",\"amount\":10.00},"
                + "{\"marketplaceOrderPublicId\":\"order-2\",\"allocationStatus\":\"ELIGIBLE_LEDGER_ONLY\"}]}";
        MarketplaceService.CheckoutPaymentState state = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(json, MarketplaceService.CheckoutPaymentState.class);
        when(orders.findByCheckout_IdOrderByIdAsc(5L)).thenReturn(List.of(child, sibling));

        service.applyCheckoutPaymentState(child, state);

        assertThat(child.getPayoutStatus()).isEqualTo("BLOCKED_BY_DISPUTE");
        assertThat(sibling.getPayoutStatus()).isEqualTo("ELIGIBLE_LEDGER_ONLY");
        assertThat(checkout.getCheckoutStatus()).isEqualTo("DISPUTE_HOLD");
    }

    @Test
    void parentGetRefreshesAllChildrenAndReturnsPaidWithoutPaymentWrites() {
        expectPayment(withSuccess(paymentJson("CAPTURED", "HELD", "HELD"), MediaType.APPLICATION_JSON));

        MarketplaceCheckoutDtos.CheckoutResponse response = checkoutService.checkout("checkout-1", buyer);

        assertThat(response.status()).isEqualTo("PAID");
        assertThat(response.orders()).extracting(MarketplaceDtos.OrderResponse::paymentStatus)
                .containsExactly("CAPTURED", "CAPTURED");
        assertThat(response.orders()).extracting(MarketplaceDtos.OrderResponse::orderStatus)
                .containsExactly("PURCHASED", "PURCHASED");
        paymentServer.verify();
        org.mockito.Mockito.verifyNoInteractions(outbox);
    }

    @Test
    void parentGetKeepsLocalDisputeHoldAndRequestedAcceptanceWhileOutboxIsDelayed() {
        child.setPayoutStatus("ELIGIBLE_REQUESTED");
        sibling.setPayoutStatus("BLOCKED_BY_DISPUTE");
        expectPayment(withSuccess(paymentJson("CAPTURED", "HELD", "ELIGIBLE_LEDGER_ONLY"), MediaType.APPLICATION_JSON));

        MarketplaceCheckoutDtos.CheckoutResponse response = checkoutService.checkout("checkout-1", buyer);

        assertThat(response.status()).isEqualTo("DISPUTE_HOLD");
        assertThat(child.getPayoutStatus()).isEqualTo("ELIGIBLE_REQUESTED");
        assertThat(sibling.getPayoutStatus()).isEqualTo("BLOCKED_BY_DISPUTE");
        paymentServer.verify();
    }

    @Test
    void parentGetAppliesRemoteDisputeHold() {
        expectPayment(withSuccess(paymentJson("CAPTURED", "DISPUTE_HOLD", "HELD"), MediaType.APPLICATION_JSON));
        assertThat(checkoutService.checkout("checkout-1", buyer).status()).isEqualTo("DISPUTE_HOLD");
        assertThat(child.getPayoutStatus()).isEqualTo("BLOCKED_BY_DISPUTE");
        paymentServer.verify();
    }

    @Test
    void pendingCaptureIsAValidSnapshotAndDoesNotConfirmThePurchase() {
        expectPayment(withSuccess(paymentJson("PENDING", "PENDING_CAPTURE", "PENDING_CAPTURE"), MediaType.APPLICATION_JSON));
        assertThat(checkoutService.checkout("checkout-1", buyer).status()).isEqualTo("PAYMENT_PENDING");
        assertThat(child.getOrderStatus()).isEqualTo("PAYMENT_PENDING");
        assertThat(sibling.getOrderStatus()).isEqualTo("PAYMENT_PENDING");
        paymentServer.verify();
    }

    @Test
    void capturedPaymentCannotBeDowngradedByAStaleSnapshot() {
        child.setPaymentStatus("CAPTURED");
        child.setOrderStatus("PURCHASED");
        checkout.setCheckoutStatus("PAID");
        expectPayment(withSuccess(paymentJson("PENDING", "PENDING_CAPTURE", "PENDING_CAPTURE"), MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> checkoutService.checkout("checkout-1", buyer))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
        assertThat(child.getPaymentStatus()).isEqualTo("CAPTURED");
        assertThat(child.getOrderStatus()).isEqualTo("PURCHASED");
        assertThat(checkout.getCheckoutStatus()).isEqualTo("PAID");
        assertThat(sibling.getPaymentStatus()).isEqualTo("PENDING");
        assertThat(checkout.getUpdatedAt()).isNull();
        paymentServer.verify();
    }

    @Test
    void payment404WhileCreateCommandPendingReturnsActualPendingState() {
        when(outbox.isCheckoutPaymentCreatePending("checkout-1")).thenReturn(true);
        expectPayment(withStatus(HttpStatus.NOT_FOUND));
        assertThat(checkoutService.checkout("checkout-1", buyer).status()).isEqualTo("PAYMENT_PENDING");
        assertThat(child.getPaymentStatus()).isEqualTo("PENDING");
        assertThat(checkout.getUpdatedAt()).isNull();
        paymentServer.verify();
    }

    @Test
    void missingPaymentWithoutPendingCreateAndOutagesAreBadGatewayNotSilentSuccess() {
        for (HttpStatus downstream : List.of(HttpStatus.NOT_FOUND, HttpStatus.SERVICE_UNAVAILABLE)) {
            paymentServer.reset();
            expectPayment(withStatus(downstream));
            assertThatThrownBy(() -> checkoutService.checkout("checkout-1", buyer))
                    .isInstanceOfSatisfying(ResponseStatusException.class,
                            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
            assertUnchanged();
            paymentServer.verify();
        }
    }

    @Test
    void parentAndChildRefreshRejectMalformedSnapshotsBeforeAnyMutation() {
        List<MarketplaceService.CheckoutPaymentState> invalid = List.of(
                new MarketplaceService.CheckoutPaymentState("checkout-1", null, null),
                state("wrong-checkout", "CAPTURED", "HELD", "HELD"),
                state("checkout-1", " ", "HELD", "HELD"),
                state("checkout-1", "UNKNOWN", "HELD", "HELD"),
                new MarketplaceService.CheckoutPaymentState("checkout-1", "CAPTURED", null),
                new MarketplaceService.CheckoutPaymentState("checkout-1", "CAPTURED", List.of(
                        new MarketplaceService.CheckoutAllocationState("order-1", "HELD"))),
                new MarketplaceService.CheckoutPaymentState("checkout-1", "CAPTURED", List.of(
                        new MarketplaceService.CheckoutAllocationState("order-1", "HELD"),
                        new MarketplaceService.CheckoutAllocationState("order-1", "HELD"))),
                new MarketplaceService.CheckoutPaymentState("checkout-1", "CAPTURED", List.of(
                        new MarketplaceService.CheckoutAllocationState("order-1", "HELD"),
                        new MarketplaceService.CheckoutAllocationState("foreign-order", "HELD"))),
                state("checkout-1", "CAPTURED", "HELD", ""),
                state("checkout-1", "CAPTURED", "HELD", "UNSUPPORTED"),
                state("checkout-1", "CAPTURED", "HELD", "PENDING_CAPTURE"),
                state("checkout-1", "PENDING", "HELD", "HELD"));
        for (MarketplaceService.CheckoutPaymentState snapshot : invalid) {
            assertThatThrownBy(() -> service.applyCheckoutPaymentState(child, snapshot))
                    .isInstanceOfSatisfying(ResponseStatusException.class,
                            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
            assertUnchanged();
        }
    }

    @Test
    void parentGetRejectsMalformedJsonAndMoneyOrIdentityMismatches() {
        String valid = paymentJson("CAPTURED", "HELD", "HELD");
        List<String> invalid = List.of(
                "{}", "null", "{broken",
                valid.replace("\"checkout-1\"", "\"other-checkout\""),
                valid.replace("\"amount\":20", "\"amount\":21"),
                valid.replace("\"platformFeeAmount\":1,", "\"platformFeeAmount\":2,"),
                valid.replace("\"providerPayableAmount\":19", "\"providerPayableAmount\":18"),
                valid.replace("\"currencyCode\":\"USD\"", "\"currencyCode\":\"EUR\""),
                valid.replace("\"customerUserPublicId\":\"buyer\"", "\"customerUserPublicId\":\"other\""),
                valid.replace("\"amount\":10", "\"amount\":9"),
                valid.replace("\"providerAccountPublicId\":\"seller\"", "\"providerAccountPublicId\":\"other\""));
        for (String body : invalid) {
            paymentServer.reset();
            expectPayment(withSuccess(body, MediaType.APPLICATION_JSON));
            assertThatThrownBy(() -> checkoutService.checkout("checkout-1", buyer))
                    .isInstanceOfSatisfying(ResponseStatusException.class,
                            ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
            assertUnchanged();
            paymentServer.verify();
        }
    }

    @Test
    void childRefreshUsesSameValidatedAggregateSnapshot() {
        expectPayment(withSuccess(paymentJson("CAPTURED", "HELD", "HELD"), MediaType.APPLICATION_JSON));
        assertThat(service.refreshPurchase("order-1", buyer).paymentStatus()).isEqualTo("CAPTURED");
        assertThat(sibling.getPaymentStatus()).isEqualTo("CAPTURED");
        assertThat(checkout.getCheckoutStatus()).isEqualTo("PAID");
        paymentServer.verify();
    }

    @Test
    void legacyDigitalOrderRefreshKeepsItsExistingOrderPaymentContract() {
        child.setCheckout(null);
        paymentServer.expect(requestTo("https://payments.example/payments/orders/order-1"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andRespond(withSuccess("{\"paymentStatus\":\"CAPTURED\",\"payoutEligibilityStatus\":\"HELD\"}",
                        MediaType.APPLICATION_JSON));
        assertThat(service.refreshPurchase("order-1", buyer).orderStatus()).isEqualTo("PURCHASED");
        assertThat(child.getPayoutStatus()).isEqualTo("HELD");
        assertThat(sibling.getPaymentStatus()).isEqualTo("PENDING");
        assertThat(checkout.getCheckoutStatus()).isEqualTo("PAYMENT_PENDING");
        paymentServer.verify();
    }

    @Test
    void unauthorizedParentReadDoesNotContactPaymentOrMutateState() {
        Jwt other = Jwt.withTokenValue("t").header("alg", "none").subject("other").build();
        assertThatThrownBy(() -> checkoutService.checkout("checkout-1", other))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        assertUnchanged();
        paymentServer.verify();
    }

    @Test
    void refreshEntryPointsHaveWritableTransactions() throws Exception {
        assertThat(MarketplaceCheckoutService.class.getMethod("checkout", String.class, Jwt.class)
                .getAnnotation(Transactional.class).readOnly()).isFalse();
        assertThat(MarketplaceService.class.getMethod("refreshPurchase", String.class, Jwt.class)
                .getAnnotation(Transactional.class).readOnly()).isFalse();
        assertThat(MarketplaceService.class.getMethod("syncCheckoutPaymentState", MarketplaceCheckout.class)
                .getAnnotation(Transactional.class).readOnly()).isFalse();
    }

    private void assertUnchanged() {
        assertThat(checkout.getCheckoutStatus()).isEqualTo("PAYMENT_PENDING");
        assertThat(checkout.getUpdatedAt()).isNull();
        for (OrderHeader order : List.of(child, sibling)) {
            assertThat(order.getPaymentStatus()).isEqualTo("PENDING");
            assertThat(order.getOrderStatus()).isEqualTo("PAYMENT_PENDING");
            assertThat(order.getPayoutStatus()).isEqualTo("PAYMENT_PENDING");
            assertThat(order.getUpdatedAt()).isNull();
        }
    }

    private MarketplaceService.CheckoutPaymentState state(String id, String status, String first, String second) {
        return new MarketplaceService.CheckoutPaymentState(id, status, List.of(
                new MarketplaceService.CheckoutAllocationState("order-1", first),
                new MarketplaceService.CheckoutAllocationState("order-2", second)));
    }

    private void expectPayment(org.springframework.test.web.client.ResponseCreator response) {
        paymentServer.expect(requestTo("https://payments.example/payments/checkouts/checkout-1"))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andExpect(header("X-Internal-Service-Token", "test-token")).andRespond(response);
    }

    private String paymentJson(String status, String first, String second) {
        return "{\"checkoutPublicId\":\"checkout-1\",\"paymentStatus\":\"" + status
                + "\",\"customerUserPublicId\":\"buyer\",\"currencyCode\":\"USD\","
                + "\"amount\":20,\"platformFeeAmount\":1,\"providerPayableAmount\":19,\"allocations\":["
                + allocationJson("order-1", first) + "," + allocationJson("order-2", second) + "]}";
    }

    private String allocationJson(String id, String status) {
        return "{\"marketplaceOrderPublicId\":\"" + id + "\",\"allocationStatus\":\"" + status
                + "\",\"checkoutPublicId\":\"checkout-1\",\"providerAccountPublicId\":\"seller\","
                + "\"currencyCode\":\"USD\",\"amount\":10,\"platformFeeAmount\":0.5,\"providerPayableAmount\":9.5}";
    }

    private OrderHeader child(String publicId) {
        OrderHeader order = new OrderHeader();
        order.setId(publicId.endsWith("1") ? 11L : 12L);
        order.setPublicId(publicId);
        order.setCheckout(checkout);
        order.setListing(listing);
        order.setCustomerUserPublicId("buyer");
        order.setCustomerTotalAmount(new BigDecimal("10.00"));
        order.setPlatformFeeAmount(new BigDecimal("0.50"));
        order.setProviderExpectedAmount(new BigDecimal("9.50"));
        order.setProviderAccountPublicId("seller");
        order.setTransactionCurrencyCode("USD");
        order.setOrderStatus("PAYMENT_PENDING");
        order.setPaymentStatus("PENDING");
        order.setPayoutStatus("PAYMENT_PENDING");
        return order;
    }
}
package com.java.vinod.payment.service.integration;

import com.java.vinod.payment.service.dto.CheckoutPaymentDtos;
import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.CheckoutPayment;
import com.java.vinod.payment.service.entity.CheckoutPaymentAllocation;
import com.java.vinod.payment.service.entity.PaymentEventOutbox;
import com.java.vinod.payment.service.entity.PaymentGatewayPolicy;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.gateway.PaymentGatewayRegistry;
import com.java.vinod.payment.service.repository.CheckoutPaymentAllocationRepository;
import com.java.vinod.payment.service.repository.CheckoutPaymentRepository;
import com.java.vinod.payment.service.repository.PaymentEventOutboxRepository;
import com.java.vinod.payment.service.repository.PaymentGatewayPolicyRepository;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.repository.PaymentTransactionRepository;
import com.java.vinod.payment.service.repository.ProviderPayoutRepository;
import com.java.vinod.payment.service.repository.RefundTransactionRepository;
import com.java.vinod.payment.service.service.ConsolidatedCheckoutPaymentService;
import com.java.vinod.payment.service.service.PaymentEventOutboxService;
import com.java.vinod.payment.service.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Exercises consolidated multi-seller checkout payments end to end against the in-memory database
 * and the sandbox gateway adapter (no external payment calls).
 */
@SpringBootTest(properties = "app.payment.demo-transactions-enabled=true")
@ActiveProfiles("test")
@DisplayName("Consolidated checkout payment integration tests")
class ConsolidatedCheckoutPaymentIntegrationTest extends IntegrationTestSupport {
    private static final String CUSTOMER = "customer-multi-1";

    @Autowired
    private ConsolidatedCheckoutPaymentService checkoutService;
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private PaymentOrderRepository paymentOrderRepository;
    @Autowired
    private CheckoutPaymentRepository checkoutPaymentRepository;
    @Autowired
    private CheckoutPaymentAllocationRepository allocationRepository;
    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;
    @Autowired
    private ProviderPayoutRepository providerPayoutRepository;
    @Autowired
    private RefundTransactionRepository refundTransactionRepository;
    @Autowired
    private PaymentEventOutboxRepository outboxRepository;
    @Autowired
    private PaymentGatewayPolicyRepository policyRepository;
    @MockitoSpyBean
    private PaymentGatewayRegistry gatewayRegistry;
    @MockitoSpyBean
    private PaymentEventOutboxService outboxService;

    @Test
    @DisplayName("Multiple sellers are charged once and allocated in the ledger")
    void multiSellerCheckoutCapturesOneChargeWithReconciledAllocations() {
        String checkoutId = "checkout-" + shortId();
        CheckoutPaymentDtos.CheckoutPaymentResponse response = checkoutService.createCheckoutPayment(request(checkoutId));

        assertEquals("CAPTURED", response.checkoutStatus());
        assertEquals("CAPTURED", response.paymentStatus());
        assertEquals("HELD", response.aggregateAllocationStatus());
        assertEquals("LEDGER_ONLY", response.payoutMode());
        assertEquals(new BigDecimal("66.61"), response.amount());
        assertEquals(new BigDecimal("3.33"), response.platformFeeAmount());
        assertEquals(new BigDecimal("63.28"), response.providerPayableAmount());
        assertEquals(3, response.allocations().size());
        assertEquals(response.amount(), response.allocations().stream()
                .map(CheckoutPaymentDtos.CheckoutAllocationResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add));

        verify(gatewayRegistry, times(1)).capture(eq("mock"), eq(expectedGatewayKey(checkoutId)),
                eq(new BigDecimal("66.61")), eq("USD"));
        verify(gatewayRegistry, never()).releasePayout(any(), any(), any(), any());

        PaymentOrder parent = paymentOrderRepository.findByMarketplaceOrderPublicId(checkoutId).orElseThrow();
        assertTrue(parent.isConsolidatedCheckout());
        assertEquals(1, paymentOrderRepository.count());
        assertEquals(0, providerPayoutRepository.count());
        assertEquals(1, paymentTransactionRepository.count());
        assertEquals(3, allocationRepository.count());
        assertEquals(response.paymentOrderPublicId(), parent.getPublicId());

        assertTrue(outboxRepository.findAll().stream()
                .allMatch(event -> "PENDING".equals(event.getProcessingStatus())));
        outboxService.dispatchPendingEvents();
        List<PaymentEventOutbox> events = outboxRepository.findAll();
        assertEquals(1, events.stream().filter(event -> "payment-captured".equals(event.getEventType())).count());
        assertEquals(3, events.stream().filter(event -> "provider-pending-earning".equals(event.getEventType())).count());
        assertTrue(events.stream().noneMatch(event -> event.getEventType().startsWith("payout")));
        assertTrue(events.stream().allMatch(event -> "PROCESSED".equals(event.getProcessingStatus())));

        CheckoutPaymentDtos.CheckoutPaymentResponse aggregate = checkoutService.checkoutPayment(checkoutId);
        assertEquals(response.allocations(), aggregate.allocations());
    }

    @Test
    @DisplayName("Fees are deducted from each buyer amount and rounded half-up before summing")
    void feesRoundPerBuyerLineRatherThanOnParentOrProviderPayable() {
        String checkoutId = "checkout-" + shortId();
        CheckoutPaymentDtos.CheckoutPaymentResponse response = checkoutService.createCheckoutPayment(
                new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(checkoutId, CUSTOMER, "USD",
                        new BigDecimal("0.20"), new BigDecimal("0.02"), new BigDecimal("0.18"), List.of(
                        line(checkoutId + "-a1", "seller-a", "US", "0.10", "0.01", "0.09"),
                        line(checkoutId + "-b1", "seller-b", "US", "0.10", "0.01", "0.09"))));

        assertEquals(new BigDecimal("0.02"), response.platformFeeAmount());
        assertEquals(new BigDecimal("0.18"), response.providerPayableAmount());
        assertTrue(response.allocations().stream().allMatch(allocation ->
                new BigDecimal("0.01").equals(allocation.platformFeeAmount())
                        && new BigDecimal("0.09").equals(allocation.providerPayableAmount())));
        verify(gatewayRegistry).capture(eq("mock"), eq(expectedGatewayKey(checkoutId)),
                eq(new BigDecimal("0.20")), eq("USD"));
    }

    @Test
    @DisplayName("The incorrect fee-on-provider-payable policy is rejected even when all sums reconcile")
    void feeOnProviderPayableIsRejected() {
        String checkoutId = "checkout-" + shortId();
        var incorrect = new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(checkoutId, CUSTOMER, "USD",
                new BigDecimal("21.00"), new BigDecimal("1.00"), new BigDecimal("20.00"), List.of(
                line(checkoutId + "-a1", "seller-a", "US", "21.00", "1.00", "20.00")));

        assertStatus(HttpStatus.BAD_REQUEST, () -> checkoutService.createCheckoutPayment(incorrect));
        verify(gatewayRegistry, never()).capture(any(), any(), any(), any());
        assertEquals(0, checkoutPaymentRepository.count());
        assertEquals(0, paymentOrderRepository.count());
        assertEquals(0, allocationRepository.count());
    }

    @Test
    @DisplayName("Identical retries replay without a second charge, even with reordered allocations")
    void identicalRetryIsIdempotent() {
        String checkoutId = "checkout-" + shortId();
        CheckoutPaymentDtos.CreateCheckoutPaymentRequest request = request(checkoutId);
        CheckoutPaymentDtos.CheckoutPaymentResponse first = checkoutService.createCheckoutPayment(request);
        List<CheckoutPaymentDtos.AllocationRequest> reordered = new ArrayList<>(request.allocations());
        java.util.Collections.reverse(reordered);
        CheckoutPaymentDtos.CheckoutPaymentResponse second = checkoutService.createCheckoutPayment(
                new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(checkoutId, CUSTOMER, "USD",
                        new BigDecimal("66.610"), new BigDecimal("3.33"), new BigDecimal("63.28"), reordered));

        assertEquals(first.paymentOrderPublicId(), second.paymentOrderPublicId());
        assertEquals(first.allocations(), second.allocations());
        verify(gatewayRegistry, times(1)).capture(anyString(), anyString(), any(), anyString());
        assertEquals(1, paymentTransactionRepository.count());
        assertEquals(3, allocationRepository.count());
    }

    @Test
    @DisplayName("A retry with a different payload is rejected and leaves the ledger untouched")
    void mismatchedRetryConflicts() {
        String checkoutId = "checkout-" + shortId();
        checkoutService.createCheckoutPayment(request(checkoutId));
        CheckoutPaymentDtos.CreateCheckoutPaymentRequest original = request(checkoutId);
        List<CheckoutPaymentDtos.AllocationRequest> changedSeller = new ArrayList<>(original.allocations());
        CheckoutPaymentDtos.AllocationRequest first = changedSeller.get(0);
        changedSeller.set(0, new CheckoutPaymentDtos.AllocationRequest(first.marketplaceOrderPublicId(), "seller-other",
                first.providerCountryCode(), first.amount(), first.platformFeeAmount(), first.providerPayableAmount()));

        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.createCheckoutPayment(
                new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(checkoutId, CUSTOMER, "USD", original.amount(),
                        original.platformFeeAmount(), original.providerPayableAmount(), changedSeller)));
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.createCheckoutPayment(
                new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(checkoutId, "customer-other", "USD", original.amount(),
                        original.platformFeeAmount(), original.providerPayableAmount(), original.allocations())));

        verify(gatewayRegistry, times(1)).capture(anyString(), anyString(), any(), anyString());
        assertEquals("seller-a", allocationRepository.findAll().stream()
                .filter(allocation -> allocation.getLineNumber() == 1).findFirst().orElseThrow().getProviderAccountPublicId());
    }

    @Test
    @DisplayName("Gateway success followed by rollback is retried with the same gateway idempotency key")
    void retryAfterPostCaptureRollbackReusesStableGatewayKey() {
        String checkoutId = "checkout-" + shortId();
        doThrow(new IllegalStateException("simulated failure after gateway capture"))
                .doCallRealMethod()
                .when(outboxService).queueWalletEvent(eq("payment-captured"), any(), any(), any());

        assertThrows(IllegalStateException.class, () -> checkoutService.createCheckoutPayment(request(checkoutId)));
        CheckoutPayment pending = checkoutPaymentRepository.findByCheckoutPublicId(checkoutId).orElseThrow();
        assertEquals(CheckoutPayment.STATUS_CAPTURE_PENDING, pending.getCheckoutStatus());
        assertEquals(0, paymentTransactionRepository.count());
        assertTrue(allocationRepository.findAll().stream()
                .allMatch(allocation -> CheckoutPaymentAllocation.STATUS_PENDING_CAPTURE.equals(allocation.getAllocationStatus())));

        CheckoutPaymentDtos.CheckoutPaymentResponse retried = checkoutService.createCheckoutPayment(request(checkoutId));

        assertEquals("CAPTURED", retried.checkoutStatus());
        verify(gatewayRegistry, times(2)).capture(eq("mock"), eq(expectedGatewayKey(checkoutId)),
                eq(new BigDecimal("66.61")), eq("USD"));
        assertEquals(pending.getGatewayIdempotencyKey(), expectedGatewayKey(checkoutId));
        assertEquals(1, paymentOrderRepository.count());
        assertEquals(1, paymentTransactionRepository.count());
        assertEquals(3, allocationRepository.count());
    }

    @Test
    @DisplayName("Concurrent identical requests converge on one parent ledger")
    void concurrentIdenticalRequestsConverge() throws Exception {
        String checkoutId = "checkout-" + shortId();
        int threads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<CheckoutPaymentDtos.CheckoutPaymentResponse>> futures = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                Callable<CheckoutPaymentDtos.CheckoutPaymentResponse> call = () -> {
                    start.await();
                    return checkoutService.createCheckoutPayment(request(checkoutId));
                };
                futures.add(executor.submit(call));
            }
            start.countDown();
            List<String> paymentOrderIds = new ArrayList<>();
            for (Future<CheckoutPaymentDtos.CheckoutPaymentResponse> future : futures) {
                CheckoutPaymentDtos.CheckoutPaymentResponse response = future.get(30, TimeUnit.SECONDS);
                assertEquals("CAPTURED", response.checkoutStatus());
                paymentOrderIds.add(response.paymentOrderPublicId());
            }
            assertEquals(1, paymentOrderIds.stream().distinct().count());
        } finally {
            executor.shutdownNow();
        }
        verify(gatewayRegistry, atLeastOnce()).capture(eq("mock"), eq(expectedGatewayKey(checkoutId)), any(), eq("USD"));
        verify(gatewayRegistry, never()).capture(anyString(), org.mockito.ArgumentMatchers.argThat(
                key -> !expectedGatewayKey(checkoutId).equals(key)), any(), anyString());
        assertEquals(1, paymentOrderRepository.count());
        assertEquals(1, checkoutPaymentRepository.count());
        assertEquals(1, paymentTransactionRepository.count());
        assertEquals(3, allocationRepository.count());
    }
    @Test
    @DisplayName("Marking an allocation eligible is ledger-only and never releases a payout")
    void markEligibleIsLedgerOnly() {
        String checkoutId = "checkout-" + shortId();
        checkoutService.createCheckoutPayment(request(checkoutId));

        CheckoutPaymentDtos.CheckoutAllocationResponse eligible =
                checkoutService.markAllocationPayoutEligible(checkoutId, checkoutId + "-a1");
        CheckoutPaymentDtos.CheckoutAllocationResponse repeated =
                checkoutService.markAllocationPayoutEligible(checkoutId, checkoutId + "-a1");

        assertEquals(CheckoutPaymentAllocation.STATUS_ELIGIBLE_LEDGER_ONLY, eligible.allocationStatus());
        assertEquals(eligible, repeated);
        verify(gatewayRegistry, never()).releasePayout(any(), any(), any(), any());
        assertEquals(0, providerPayoutRepository.count());
        assertTrue(outboxRepository.findAll().stream().noneMatch(event -> event.getEventType().startsWith("payout")));

        Map<String, String> statuses = allocationStatuses();
        assertEquals(CheckoutPaymentAllocation.STATUS_ELIGIBLE_LEDGER_ONLY, statuses.get(checkoutId + "-a1"));
        assertEquals(CheckoutPaymentAllocation.STATUS_HELD, statuses.get(checkoutId + "-a2"));
        assertEquals(CheckoutPaymentAllocation.STATUS_HELD, statuses.get(checkoutId + "-b1"));
        assertEquals("MIXED", checkoutService.checkoutPayment(checkoutId).aggregateAllocationStatus());
        assertStatus(HttpStatus.NOT_FOUND, () -> checkoutService.markAllocationPayoutEligible(checkoutId, "unknown-order"));
    }

    @Test
    @DisplayName("Marking eligible before capture is rejected")
    void markEligibleRequiresCapture() {
        String checkoutId = "checkout-" + shortId();
        doThrow(new IllegalStateException("simulated failure after gateway capture"))
                .when(outboxService).queueWalletEvent(eq("payment-captured"), any(), any(), any());
        assertThrows(IllegalStateException.class, () -> checkoutService.createCheckoutPayment(request(checkoutId)));

        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.markAllocationPayoutEligible(checkoutId, checkoutId + "-a1"));
        assertEquals(CheckoutPaymentAllocation.STATUS_PENDING_CAPTURE, allocationStatuses().get(checkoutId + "-a1"));
    }

    @Test
    @DisplayName("A dispute request persists a ledger hold that blocks eligibility")
    void disputeHoldsAllocation() {
        String checkoutId = "checkout-" + shortId();
        checkoutService.createCheckoutPayment(request(checkoutId));

        CheckoutPaymentDtos.CheckoutAllocationResponse disputed = checkoutService.disputeAllocation(checkoutId,
                checkoutId + "-b1", new CheckoutPaymentDtos.AllocationDisputeRequest("Item not received"));

        assertEquals(CheckoutPaymentAllocation.STATUS_DISPUTE_HOLD, disputed.allocationStatus());
        CheckoutPaymentAllocation stored = allocationRepository.findAll().stream()
                .filter(allocation -> allocation.getMarketplaceOrderPublicId().equals(checkoutId + "-b1"))
                .findFirst().orElseThrow();
        assertEquals("Item not received", stored.getDisputeReason());
        assertNotNull(stored.getDisputedAt());
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.markAllocationPayoutEligible(checkoutId, checkoutId + "-b1"));
        assertEquals(CheckoutPaymentAllocation.STATUS_DISPUTE_HOLD, allocationStatuses().get(checkoutId + "-b1"));
        verify(gatewayRegistry, never()).releasePayout(any(), any(), any(), any());
        verify(gatewayRegistry, never()).refund(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Refund, cancel and legacy lifecycle operations are rejected for parent and child without mutation")
    void unsupportedReversalsAndLegacyOperationsAreRejected() {
        String checkoutId = "checkout-" + shortId();
        checkoutService.createCheckoutPayment(request(checkoutId));
        String childId = checkoutId + "-a2";
        Map<String, String> before = allocationStatuses();
        PaymentOrder parentBefore = paymentOrderRepository.findByMarketplaceOrderPublicId(checkoutId).orElseThrow();

        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.rejectUnsupportedReversal(checkoutId, null, "refund"));
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.rejectUnsupportedReversal(checkoutId, childId, "refund"));
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.rejectUnsupportedReversal(checkoutId, childId, "cancel"));
        assertStatus(HttpStatus.NOT_FOUND, () -> checkoutService.rejectUnsupportedReversal("checkout-missing", null, "refund"));
        for (String id : List.of(checkoutId, childId)) {
            assertStatus(HttpStatus.CONFLICT, () -> paymentService.refund(id,
                    new PaymentDtos.RefundRequest("partial"), null));
            assertStatus(HttpStatus.CONFLICT, () -> paymentService.cancel(id, new PaymentDtos.LifecycleRequest("cancel"), null));
            assertStatus(HttpStatus.CONFLICT, () -> paymentService.dispute(id, new PaymentDtos.LifecycleRequest("dispute"), null));
            assertStatus(HttpStatus.CONFLICT, () -> paymentService.markPayoutEligible(id));
            assertStatus(HttpStatus.CONFLICT, () -> paymentService.createPaymentOrder(legacyCheckout(id), CUSTOMER));
        }

        verify(gatewayRegistry, never()).refund(any(), any(), any(), any());
        verify(gatewayRegistry, never()).releasePayout(any(), any(), any(), any());
        assertEquals(before, allocationStatuses());
        PaymentOrder parentAfter = paymentOrderRepository.findByMarketplaceOrderPublicId(checkoutId).orElseThrow();
        assertEquals(parentBefore.getPaymentStatus(), parentAfter.getPaymentStatus());
        assertEquals(0, refundTransactionRepository.count());
        assertEquals(0, providerPayoutRepository.count());
        assertEquals(1, paymentOrderRepository.count());
    }

    @Test
    @DisplayName("Invalid or unreconciled payloads are rejected before any persistence")
    void invalidPayloadsAreRejected() {
        String checkoutId = "checkout-" + shortId();
        List<Function<CheckoutPaymentDtos.CreateCheckoutPaymentRequest, CheckoutPaymentDtos.CreateCheckoutPaymentRequest>> mutations = List.of(
                r -> withLine(r, 0, line("x1", "seller-a", "US", "21.00", "1.01", "19.99")),
                r -> withLine(r, 0, line(checkoutId + "-a1", "seller-a", "US", "21.01", "1.05", "19.95")),
                r -> withLine(r, 0, line(checkoutId + "-a1", "seller-a", "US", "21.000", "1.050", "19.951")),
                r -> withLine(r, 0, line(checkoutId + "-a2", "seller-a", "US", "21.00", "1.05", "19.95")),
                r -> withLine(r, 0, line(checkoutId, "seller-a", "US", "21.00", "1.05", "19.95")),
                r -> withLine(r, 0, line(checkoutId + "-a1", "seller-a", "USA", "21.00", "1.05", "19.95")),
                r -> withLine(r, 0, line(checkoutId + "-a1", "seller-a", "US", "-21.00", "-1.00", "-20.00")),
                r -> new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(r.checkoutPublicId(), r.customerUserPublicId(), "USD",
                        new BigDecimal("66.62"), r.platformFeeAmount(), r.providerPayableAmount(), r.allocations()),
                r -> new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(r.checkoutPublicId(), r.customerUserPublicId(), "USD",
                        new BigDecimal("66.61"), new BigDecimal("3.32"), new BigDecimal("63.29"), r.allocations()),
                r -> new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(r.checkoutPublicId(), r.customerUserPublicId(), "usd",
                        r.amount(), r.platformFeeAmount(), r.providerPayableAmount(), r.allocations()),
                r -> new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(r.checkoutPublicId(), r.customerUserPublicId(), "USD",
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of()),
                r -> new CheckoutPaymentDtos.CreateCheckoutPaymentRequest("bad id!", r.customerUserPublicId(), "USD",
                        r.amount(), r.platformFeeAmount(), r.providerPayableAmount(), r.allocations()));

        for (var mutation : mutations) {
            assertStatus(HttpStatus.BAD_REQUEST, () -> checkoutService.createCheckoutPayment(mutation.apply(request(checkoutId))));
        }
        assertStatus(HttpStatus.BAD_REQUEST, () -> checkoutService.createCheckoutPayment(null));
        verify(gatewayRegistry, never()).capture(any(), any(), any(), any());
        assertEquals(0, checkoutPaymentRepository.count());
        assertEquals(0, paymentOrderRepository.count());
        assertEquals(0, allocationRepository.count());
    }

    @Test
    @DisplayName("Allocation identities are globally unique across checkouts and legacy orders")
    void allocationIdentityConflictsAreRejected() {
        String firstCheckout = "checkout-" + shortId();
        checkoutService.createCheckoutPayment(request(firstCheckout));
        String secondCheckout = "checkout-" + shortId();
        CheckoutPaymentDtos.CreateCheckoutPaymentRequest reusesChild = withLine(request(secondCheckout), 0,
                line(firstCheckout + "-a1", "seller-a", "US", "21.00", "1.05", "19.95"));
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.createCheckoutPayment(reusesChild));

        String legacyOrderId = "legacy-" + shortId();
        paymentService.createPaymentOrder(legacyCheckout(legacyOrderId), CUSTOMER);
        String thirdCheckout = "checkout-" + shortId();
        CheckoutPaymentDtos.CreateCheckoutPaymentRequest reusesLegacy = withLine(request(thirdCheckout), 0,
                line(legacyOrderId, "seller-a", "US", "21.00", "1.05", "19.95"));
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.createCheckoutPayment(reusesLegacy));
        assertStatus(HttpStatus.CONFLICT, () -> checkoutService.createCheckoutPayment(request(legacyOrderId)));

        assertEquals(1, checkoutPaymentRepository.count());
        assertEquals(3, allocationRepository.count());
        assertEquals(2, paymentOrderRepository.count());
        verify(gatewayRegistry, times(2)).capture(any(), any(), any(), any());
    }

    @Test
    @DisplayName("Allocations resolving to different buyer gateways are rejected")
    void mixedGatewayModesAreRejected() {
        PaymentGatewayPolicy policy = new PaymentGatewayPolicy();
        policy.setPublicId(UUID.randomUUID().toString());
        policy.setCountryCode("GB");
        policy.setGatewayMode("paypal-mock");
        policy.setActive(true);
        policy.setRecommendationNote("test");
        policy.setCreatedAt(LocalDateTime.now());
        policy.setUpdatedAt(LocalDateTime.now());
        policyRepository.save(policy);
        try {
            String checkoutId = "checkout-" + shortId();
            CheckoutPaymentDtos.CreateCheckoutPaymentRequest mixed = withLine(request(checkoutId), 2,
                    line(checkoutId + "-b1", "seller-b", "GB", "10.61", "0.53", "10.08"));
            assertStatus(HttpStatus.CONFLICT, () -> checkoutService.createCheckoutPayment(mixed));
            verify(gatewayRegistry, never()).capture(any(), any(), any(), any());
            assertEquals(0, checkoutPaymentRepository.count());
            assertEquals(0, paymentOrderRepository.count());
        } finally {
            policyRepository.delete(policy);
        }
    }

    @Test
    @DisplayName("Legacy single-listing payout release is unchanged")
    void legacySingleListingReleaseStillPaysProvider() {
        String orderId = "legacy-" + shortId();
        paymentService.createPaymentOrder(legacyCheckout(orderId), CUSTOMER);

        paymentService.markPayoutEligible(orderId);

        assertEquals("PAID", providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(orderId)
                .orElseThrow().getPayoutStatus());
        verify(gatewayRegistry, times(1)).releasePayout(eq("mock"), anyString(), eq(new BigDecimal("47.50")), eq("USD"));
        assertTrue(!paymentOrderRepository.findByMarketplaceOrderPublicId(orderId).orElseThrow().isConsolidatedCheckout());
        assertEquals(0, checkoutPaymentRepository.count());
    }

    private Map<String, String> allocationStatuses() {
        return allocationRepository.findAll().stream().collect(Collectors.toMap(
                CheckoutPaymentAllocation::getMarketplaceOrderPublicId, CheckoutPaymentAllocation::getAllocationStatus));
    }

    private static CheckoutPaymentDtos.CreateCheckoutPaymentRequest request(String checkoutId) {
        return new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(checkoutId, CUSTOMER, "USD",
                new BigDecimal("66.61"), new BigDecimal("3.33"), new BigDecimal("63.28"), List.of(
                line(checkoutId + "-a1", "seller-a", "US", "21.00", "1.05", "19.95"),
                line(checkoutId + "-a2", "seller-a", "us", "35.00", "1.75", "33.25"),
                line(checkoutId + "-b1", "seller-b", "US", "10.61", "0.53", "10.08")));
    }

    private static CheckoutPaymentDtos.CreateCheckoutPaymentRequest withLine(
            CheckoutPaymentDtos.CreateCheckoutPaymentRequest request, int index, CheckoutPaymentDtos.AllocationRequest line) {
        List<CheckoutPaymentDtos.AllocationRequest> lines = new ArrayList<>(request.allocations());
        lines.set(index, line);
        return new CheckoutPaymentDtos.CreateCheckoutPaymentRequest(request.checkoutPublicId(), request.customerUserPublicId(),
                request.currencyCode(), request.amount(), request.platformFeeAmount(), request.providerPayableAmount(), lines);
    }

    private static CheckoutPaymentDtos.AllocationRequest line(String orderId, String providerId, String country,
                                                             String amount, String fee, String payable) {
        return new CheckoutPaymentDtos.AllocationRequest(orderId, providerId, country,
                new BigDecimal(amount), new BigDecimal(fee), new BigDecimal(payable));
    }

    private static PaymentDtos.CheckoutRequest legacyCheckout(String orderId) {
        return new PaymentDtos.CheckoutRequest(orderId, new BigDecimal("50.00"), "USD", "provider-legacy", CUSTOMER, "US");
    }

    private static String expectedGatewayKey(String checkoutId) {
        return UUID.nameUUIDFromBytes(("consolidated-checkout-capture:" + checkoutId).getBytes(StandardCharsets.UTF_8)).toString();
    }

    private static String shortId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private static void assertStatus(HttpStatus expected, Executable executable) {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, executable);
        assertEquals(expected, exception.getStatusCode());
    }
}
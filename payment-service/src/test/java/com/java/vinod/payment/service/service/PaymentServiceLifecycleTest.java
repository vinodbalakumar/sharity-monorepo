package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.entity.ProviderPayout;
import com.java.vinod.payment.service.entity.RefundTransaction;
import com.java.vinod.payment.service.gateway.PaymentGatewayRegistry;
import com.java.vinod.payment.service.repository.CheckoutPaymentAllocationRepository;
import com.java.vinod.payment.service.repository.CheckoutPaymentRepository;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.repository.PaymentTransactionRepository;
import com.java.vinod.payment.service.repository.PaymentWebhookEventRepository;
import com.java.vinod.payment.service.repository.ProviderPayoutRepository;
import com.java.vinod.payment.service.repository.RefundTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies the payment lifecycle transitions that support refund, cancellation, and dispute handling.
 *
 * <p>These tests keep the lifecycle state machine local to payment-service so the broader marketplace flow
 * can rely on deterministic payment status updates without requiring live downstream services.</p>
 */
@ExtendWith(MockitoExtension.class)
class PaymentServiceLifecycleTest {
    private PaymentOrderRepository paymentOrderRepository;
    private PaymentTransactionRepository paymentTransactionRepository;
    private ProviderPayoutRepository providerPayoutRepository;
    private RefundTransactionRepository refundTransactionRepository;
    private PaymentWebhookEventRepository paymentWebhookEventRepository;
    private PaymentEventOutboxService paymentEventOutboxService;
    private PaymentGatewayRegistry paymentGatewayRegistry;
    private PaymentService paymentService;

    /**
     * Rebuilds the service with Mockito-backed repositories and a no-op wallet publisher.
     */
    @BeforeEach
    void setUp() {
        paymentOrderRepository = Mockito.mock(PaymentOrderRepository.class);
        paymentTransactionRepository = Mockito.mock(PaymentTransactionRepository.class);
        providerPayoutRepository = Mockito.mock(ProviderPayoutRepository.class);
        refundTransactionRepository = Mockito.mock(RefundTransactionRepository.class);
        paymentWebhookEventRepository = Mockito.mock(PaymentWebhookEventRepository.class);
        paymentEventOutboxService = Mockito.mock(PaymentEventOutboxService.class);
        paymentGatewayRegistry = Mockito.mock(PaymentGatewayRegistry.class);
        paymentService = new TestablePaymentService(paymentOrderRepository, paymentTransactionRepository,
                providerPayoutRepository, refundTransactionRepository, paymentWebhookEventRepository,
                paymentEventOutboxService, paymentGatewayRegistry, "mock", "secret", "http://authorization",
                "http://wallet", "internal-token", Mockito.mock(CheckoutPaymentRepository.class),
                Mockito.mock(CheckoutPaymentAllocationRepository.class));
    }

    /**
     * Refunds a captured order and updates the current lifecycle state to refunded.
     */
    @Test
    void refundCompletesLifecycleAndUpdatesRefundState() {
        PaymentOrder order = capturedOrder();
        ProviderPayout payout = payoutFor(order, "ON_HOLD");
        when(paymentOrderRepository.findByMarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(order));
        when(providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(payout));
        when(paymentGatewayRegistry.refund(order.getPaymentProvider(), order.getPublicId(), order.getCustomerChargeAmount(), order.getCurrencyCode()))
                .thenReturn("refund-ref-123");
        when(refundTransactionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDtos.MessageResponse response = paymentService.refund(order.getMarketplaceOrderPublicId(),
                new PaymentDtos.RefundRequest("customer changed mind"), null);

        assertEquals("Refund completed", response.message());
        assertEquals("REFUNDED", order.getPaymentStatus());
        assertEquals("REFUNDED", order.getPayoutEligibilityStatus());
        assertEquals("REFUNDED", payout.getPayoutStatus());
        verify(paymentGatewayRegistry).refund(order.getPaymentProvider(), order.getPublicId(), order.getCustomerChargeAmount(), order.getCurrencyCode());
        verify(refundTransactionRepository).save(any(RefundTransaction.class));
    }

    /**
     * Cancels a captured order and records the cancellation as a refund-like reversal.
     */
    @Test
    void cancelMarksLifecycleCancelledAndReversesFunds() {
        PaymentOrder order = capturedOrder();
        ProviderPayout payout = payoutFor(order, "ON_HOLD");
        when(paymentOrderRepository.findByMarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(order));
        when(providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(payout));
        when(paymentGatewayRegistry.refund(order.getPaymentProvider(), order.getPublicId(), order.getCustomerChargeAmount(), order.getCurrencyCode()))
                .thenReturn("refund-ref-456");
        when(refundTransactionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDtos.MessageResponse response = paymentService.cancel(order.getMarketplaceOrderPublicId(),
                new PaymentDtos.LifecycleRequest("buyer cancelled before delivery"), null);

        assertEquals("Cancellation completed", response.message());
        assertEquals("CANCELLED", order.getPaymentStatus());
        assertEquals("CANCELLED", order.getPayoutEligibilityStatus());
        assertEquals("CANCELLED", payout.getPayoutStatus());
        verify(paymentGatewayRegistry).refund(order.getPaymentProvider(), order.getPublicId(), order.getCustomerChargeAmount(), order.getCurrencyCode());
        verify(refundTransactionRepository).save(any(RefundTransaction.class));
    }

    /**
     * Disputes an order without completing a refund so payout eligibility stays blocked.
     */
    @Test
    void disputeBlocksPayoutWithoutRefundingImmediately() {
        PaymentOrder order = capturedOrder();
        ProviderPayout payout = payoutFor(order, "ON_HOLD");
        when(paymentOrderRepository.findByMarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(order));
        when(providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(payout));

        PaymentDtos.MessageResponse response = paymentService.dispute(order.getMarketplaceOrderPublicId(),
                new PaymentDtos.LifecycleRequest("item not delivered"), null);

        assertEquals("Dispute opened", response.message());
        assertEquals("DISPUTED", order.getPaymentStatus());
        assertEquals("BLOCKED_BY_DISPUTE", order.getPayoutEligibilityStatus());
        assertEquals("BLOCKED_BY_DISPUTE", payout.getPayoutStatus());
        verify(paymentGatewayRegistry, never()).refund(any(), any(), any(), any());
        verify(refundTransactionRepository, never()).save(any());
    }

    /**
     * Returns a lifecycle snapshot that combines the payment order, payout, and latest refund state.
     */
    @Test
    void lifecycleReturnsCurrentStateSnapshot() {
        PaymentOrder order = capturedOrder();
        order.setPaymentStatus("DISPUTED");
        order.setPayoutEligibilityStatus("BLOCKED_BY_DISPUTE");
        ProviderPayout payout = payoutFor(order, "BLOCKED_BY_DISPUTE");
        payout.setPayoutHoldReason("Waiting for dispute review");
        RefundTransaction refund = new RefundTransaction();
        refund.setRefundStatus("COMPLETED");
        refund.setRefundReason("customer changed mind");
        when(paymentOrderRepository.findByMarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(order));
        when(providerPayoutRepository.findByPaymentOrder_MarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(payout));
        when(refundTransactionRepository.findTopByPaymentOrder_MarketplaceOrderPublicIdOrderByCreatedAtDesc(order.getMarketplaceOrderPublicId()))
                .thenReturn(Optional.of(refund));

        PaymentDtos.PaymentLifecycleResponse lifecycle = paymentService.lifecycle(order.getMarketplaceOrderPublicId());

        assertEquals(order.getMarketplaceOrderPublicId(), lifecycle.marketplaceOrderPublicId());
        assertEquals("DISPUTED", lifecycle.paymentStatus());
        assertEquals("BLOCKED_BY_DISPUTE", lifecycle.payoutEligibilityStatus());
        assertEquals("BLOCKED_BY_DISPUTE", lifecycle.payoutStatus());
        assertEquals("COMPLETED", lifecycle.refundStatus());
        assertEquals("Waiting for dispute review", lifecycle.payoutHoldReason());
        assertEquals("customer changed mind", lifecycle.refundReason());
    }

    /**
     * Prevents payout release once the order has moved into a disputed state.
     */
    @Test
    void payoutEligibilityIsRejectedAfterDispute() {
        PaymentOrder order = capturedOrder();
        order.setPaymentStatus("DISPUTED");
        when(paymentOrderRepository.findByMarketplaceOrderPublicId(order.getMarketplaceOrderPublicId())).thenReturn(Optional.of(order));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> paymentService.markPayoutEligible(order.getMarketplaceOrderPublicId()));

        assertEquals(409, exception.getStatusCode().value());
    }

    /**
     * Builds a baseline captured payment order for lifecycle tests.
     */
    private PaymentOrder capturedOrder() {
        PaymentOrder order = new PaymentOrder();
        order.setPublicId("payment-order-1");
        order.setMarketplaceOrderPublicId("marketplace-order-1");
        order.setCustomerUserPublicId("customer-1");
        order.setProviderAccountPublicId("provider-1");
        order.setCurrencyCode("USD");
        order.setCustomerChargeAmount(BigDecimal.valueOf(100));
        order.setPlatformFeeAmount(BigDecimal.valueOf(5));
        order.setProviderPayableAmount(BigDecimal.valueOf(95));
        order.setPaymentProvider("mock");
        order.setPaymentStatus("CAPTURED");
        order.setPayoutEligibilityStatus("ON_HOLD");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return order;
    }

    /**
     * Builds a provider payout row for the shared captured order fixture.
     */
    private ProviderPayout payoutFor(PaymentOrder order, String status) {
        ProviderPayout payout = new ProviderPayout();
        payout.setPublicId("payout-1");
        payout.setPaymentOrder(order);
        payout.setProviderAccountPublicId(order.getProviderAccountPublicId());
        payout.setAmount(order.getProviderPayableAmount());
        payout.setCurrencyCode(order.getCurrencyCode());
        payout.setPayoutStatus(status);
        payout.setCreatedAt(LocalDateTime.now());
        payout.setUpdatedAt(LocalDateTime.now());
        return payout;
    }

    /**
     * Test-only payment service that suppresses outbound wallet publishing.
     */
    private static final class TestablePaymentService extends PaymentService {
        private TestablePaymentService(PaymentOrderRepository paymentOrderRepository,
                                       PaymentTransactionRepository paymentTransactionRepository,
                                       ProviderPayoutRepository providerPayoutRepository,
                                       RefundTransactionRepository refundTransactionRepository,
                                       PaymentWebhookEventRepository paymentWebhookEventRepository,
                                       PaymentEventOutboxService paymentEventOutboxService,
                                       PaymentGatewayRegistry paymentGatewayRegistry,
                                       String gatewayMode,
                                       String stripeWebhookSecret,
                                       String authorizationProviderEligibilityUrl,
                                       String walletInternalUrl,
                                       String internalServiceToken,
                                       CheckoutPaymentRepository checkoutPaymentRepository,
                                       CheckoutPaymentAllocationRepository checkoutPaymentAllocationRepository) {
            super(paymentOrderRepository, paymentTransactionRepository, providerPayoutRepository,
                    refundTransactionRepository, paymentWebhookEventRepository, paymentEventOutboxService, paymentGatewayRegistry,
                    gatewayMode, stripeWebhookSecret, authorizationProviderEligibilityUrl,
                    walletInternalUrl, internalServiceToken, checkoutPaymentRepository, checkoutPaymentAllocationRepository);
        }

        @Override
        protected void publishWalletEvent(String path, PaymentOrder order, String ownerPublicId, BigDecimal amount) {
            // Suppressed in unit tests so lifecycle state changes can be verified without a live wallet service.
        }
    }
}

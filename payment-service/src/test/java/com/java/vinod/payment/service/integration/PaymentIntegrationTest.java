package com.java.vinod.payment.service.integration;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for payment service end-to-end flows.
 * Tests: Order creation → Payment capture → Payout hold → Payout release
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Payment Service Integration Tests")
public class PaymentIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentOrderRepository paymentOrderRepository;

    @Test
    @DisplayName("Should create payment order and capture payment successfully")
    public void testPaymentFlow_Success() {
        // Arrange
        PaymentDtos.CheckoutRequest request = new PaymentDtos.CheckoutRequest(
            "marketplace-order-123",
            "customer-user-456",
            "seller-account-789",
            BigDecimal.valueOf(99.99),
            "USD",
            "US"
        );

        Jwt jwt = createMockJwt("customer-user-456");

        // Act
        PaymentDtos.PaymentOrderResponse response = paymentService.checkout(request, jwt);

        // Assert
        assertNotNull(response);
        assertNotNull(response.paymentOrderPublicId());
        assertEquals("CAPTURED", response.paymentStatus());
        assertEquals("ON_HOLD", response.payoutEligibilityStatus());
        assertEquals(BigDecimal.valueOf(99.99), response.customerChargeAmount());

        // Verify payment was persisted
        assertTrue(paymentOrderRepository.findByMarketplaceOrderPublicId("marketplace-order-123").isPresent());
    }

    @Test
    @DisplayName("Should handle duplicate checkout requests idempotently")
    public void testPaymentFlow_Idempotent() {
        // Arrange
        PaymentDtos.CheckoutRequest request = new PaymentDtos.CheckoutRequest(
            "marketplace-order-456",
            "customer-user-789",
            "seller-account-012",
            BigDecimal.valueOf(49.99),
            "USD",
            "US"
        );

        Jwt jwt = createMockJwt("customer-user-789");

        // Act
        PaymentDtos.PaymentOrderResponse response1 = paymentService.checkout(request, jwt);
        PaymentDtos.PaymentOrderResponse response2 = paymentService.checkout(request, jwt);

        // Assert - Both calls should return the same order (idempotent)
        assertEquals(response1.paymentOrderPublicId(), response2.paymentOrderPublicId());

        // Verify only one order was created
        long orderCount = paymentOrderRepository.findByMarketplaceOrderPublicId("marketplace-order-456")
            .stream().count();
        assertEquals(1, orderCount);
    }

    @Test
    @DisplayName("Should retrieve payment order by marketplace order ID")
    public void testGetPaymentOrder_Success() {
        // Arrange
        PaymentDtos.CheckoutRequest request = new PaymentDtos.CheckoutRequest(
            "marketplace-order-789",
            "customer-user-012",
            "seller-account-345",
            BigDecimal.valueOf(199.99),
            "USD",
            "US"
        );

        Jwt jwt = createMockJwt("customer-user-012");
        paymentService.checkout(request, jwt);

        // Act
        PaymentDtos.PaymentOrderResponse response = paymentService.order("marketplace-order-789");

        // Assert
        assertNotNull(response);
        assertEquals("CAPTURED", response.paymentStatus());
        assertEquals(BigDecimal.valueOf(199.99), response.customerChargeAmount());
    }

    @Test
    @DisplayName("Should handle payment lifecycle: capture → hold → eligible → release")
    public void testCompletePaymentLifecycle() {
        // Arrange - Create payment
        PaymentDtos.CheckoutRequest checkoutRequest = new PaymentDtos.CheckoutRequest(
            "marketplace-order-lifecycle",
            "customer-user-lifecycle",
            "seller-account-lifecycle",
            BigDecimal.valueOf(299.99),
            "USD",
            "US"
        );

        Jwt jwt = createMockJwt("customer-user-lifecycle");
        PaymentDtos.PaymentOrderResponse paymentResponse = paymentService.checkout(checkoutRequest, jwt);

        // Assert - Payment captured and payout on hold
        assertEquals("CAPTURED", paymentResponse.paymentStatus());
        assertEquals("ON_HOLD", paymentResponse.payoutEligibilityStatus());

        // Act - Mark payout as eligible
        PaymentDtos.MessageResponse eligibleResponse = paymentService.markPayoutEligible(
            "marketplace-order-lifecycle");

        // Assert - Payout should now be eligible
        assertNotNull(eligibleResponse);

        // Verify lifecycle state
        PaymentDtos.PaymentLifecycleResponse lifecycle = paymentService.lifecycle(
            "marketplace-order-lifecycle");
        assertEquals("CAPTURED", lifecycle.paymentStatus());
        assertEquals("ELIGIBLE", lifecycle.payoutEligibilityStatus());
        assertEquals("PAID", lifecycle.payoutStatus());
    }

    @Test
    @DisplayName("Should handle payment cancellation")
    public void testPaymentCancellation() {
        // Arrange
        PaymentDtos.CheckoutRequest request = new PaymentDtos.CheckoutRequest(
            "marketplace-order-cancel",
            "customer-user-cancel",
            "seller-account-cancel",
            BigDecimal.valueOf(79.99),
            "USD",
            "US"
        );

        Jwt jwt = createMockJwt("customer-user-cancel");
        paymentService.checkout(request, jwt);

        // Act
        PaymentDtos.LifecycleRequest cancelRequest = new PaymentDtos.LifecycleRequest("Customer changed mind");
        PaymentDtos.MessageResponse response = paymentService.cancel(
            "marketplace-order-cancel", cancelRequest, jwt);

        // Assert
        assertNotNull(response);
        assertEquals("Cancellation completed", response.message());

        // Verify lifecycle updated
        PaymentDtos.PaymentLifecycleResponse lifecycle = paymentService.lifecycle(
            "marketplace-order-cancel");
        assertEquals("CANCELLED", lifecycle.paymentStatus());
    }

    @Test
    @DisplayName("Should handle payment refund")
    public void testPaymentRefund() {
        // Arrange
        PaymentDtos.CheckoutRequest request = new PaymentDtos.CheckoutRequest(
            "marketplace-order-refund",
            "customer-user-refund",
            "seller-account-refund",
            BigDecimal.valueOf(150.00),
            "USD",
            "US"
        );

        Jwt jwt = createMockJwt("customer-user-refund");
        paymentService.checkout(request, jwt);

        // Act
        PaymentDtos.RefundRequest refundRequest = new PaymentDtos.RefundRequest(
            "Defective product");
        PaymentDtos.MessageResponse response = paymentService.refund(
            "marketplace-order-refund", refundRequest, jwt);

        // Assert
        assertNotNull(response);
        assertEquals("Refund completed", response.message());

        // Verify lifecycle
        PaymentDtos.PaymentLifecycleResponse lifecycle = paymentService.lifecycle(
            "marketplace-order-refund");
        assertEquals("REFUNDED", lifecycle.paymentStatus());
        assertEquals("REFUND_COMPLETED", lifecycle.refundStatus());
    }

    /**
     * Create a mock JWT token for testing.
     */
    private Jwt createMockJwt(String userId) {
        return Jwt.withTokenValue("mock-token")
            .header("alg", "none")
            .claim("uid", userId)
            .subject(userId)
            .build();
    }
}

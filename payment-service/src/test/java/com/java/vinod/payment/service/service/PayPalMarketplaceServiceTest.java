package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.config.PayPalConfig;
import com.java.vinod.payment.service.dto.PayPalMarketplaceDtos;
import com.java.vinod.payment.service.entity.PaymentOrder;
import com.java.vinod.payment.service.repository.DisputeRepository;
import com.java.vinod.payment.service.repository.PaymentGatewayPolicyRepository;
import com.java.vinod.payment.service.repository.PaymentOrderRepository;
import com.java.vinod.payment.service.repository.PaymentWebhookEventRepository;
import com.java.vinod.payment.service.repository.ProviderPayoutRepository;
import com.java.vinod.payment.service.repository.RefundTransactionRepository;
import com.java.vinod.payment.service.webhook.PayPalWebhookHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PayPalMarketplaceServiceTest {
    private PaymentOrderRepository paymentOrderRepository;
    private ProviderPayoutRepository providerPayoutRepository;
    private PayPalMarketplaceService service;

    @BeforeEach
    void setUp() {
        PayPalConfig payPalConfig = new PayPalConfig();
        payPalConfig.setClientId("client-id");
        payPalConfig.setClientSecret("client-secret");

        paymentOrderRepository = mock(PaymentOrderRepository.class);
        providerPayoutRepository = mock(ProviderPayoutRepository.class);

        service = new PayPalMarketplaceService(
                payPalConfig,
                mock(PaymentGatewayPolicyRepository.class),
                paymentOrderRepository,
                providerPayoutRepository,
                mock(RefundTransactionRepository.class),
                mock(PaymentWebhookEventRepository.class),
                mock(DisputeRepository.class),
                mock(PaymentService.class),
                mock(PayPalWebhookHandler.class));
    }

    @Test
    void sellerStatusUsesAuthenticatedSellerIdInsteadOfFirstPersistedSeller() {
        PaymentOrder otherSellerOrder = paymentOrder("other-seller", LocalDateTime.now().minusHours(1));
        PaymentOrder authenticatedSellerOrder = paymentOrder("seller-from-jwt", LocalDateTime.now());

        when(paymentOrderRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(List.of(otherSellerOrder, authenticatedSellerOrder));
        when(providerPayoutRepository.findByProviderAccountPublicIdOrderByCreatedAtDesc("seller-from-jwt"))
                .thenReturn(List.of());

        PayPalMarketplaceDtos.SellerPayPalAccountStatusResponse response = service.sellerStatus(jwt("seller-from-jwt"));

        assertEquals("seller-from-jwt", response.sellerId());
    }

    @Test
    void sellerReturnRejectsMismatchedSellerIdInRequestBody() {
        PayPalMarketplaceDtos.SellerPayPalReturnRequest request =
                new PayPalMarketplaceDtos.SellerPayPalReturnRequest("different-seller", null, null, null);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.sellerReturn(jwt("seller-from-jwt"), request));

        assertEquals(403, exception.getStatusCode().value());
    }

    private PaymentOrder paymentOrder(String providerAccountPublicId, LocalDateTime createdAt) {
        PaymentOrder order = new PaymentOrder();
        order.setProviderAccountPublicId(providerAccountPublicId);
        order.setPaymentProvider("paypal-mock");
        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);
        return order;
    }

    private Jwt jwt(String sellerId) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("uid", sellerId)
                .subject(sellerId)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
    }
}
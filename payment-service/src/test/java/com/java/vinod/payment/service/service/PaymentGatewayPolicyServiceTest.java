package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.PaymentGatewayPolicy;
import com.java.vinod.payment.service.gateway.PaymentGatewayRegistry;
import com.java.vinod.payment.service.repository.PaymentGatewayPolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Verifies the super-admin payment gateway policy surface.
 */
@ExtendWith(MockitoExtension.class)
class PaymentGatewayPolicyServiceTest {
    private PaymentGatewayPolicyRepository policyRepository;
    private PaymentGatewayRegistry paymentGatewayRegistry;
    private PaymentGatewayPolicyService service;

    @BeforeEach
    void setUp() {
        policyRepository = Mockito.mock(PaymentGatewayPolicyRepository.class);
        paymentGatewayRegistry = Mockito.mock(PaymentGatewayRegistry.class);
        lenient().when(paymentGatewayRegistry.catalog()).thenReturn(List.of(
                new PaymentDtos.PaymentGatewayCatalogResponse("mock", "Mock Gateway", "Demo gateway", true),
                new PaymentDtos.PaymentGatewayCatalogResponse("stripe-test", "Stripe Test", "Stripe-shaped adapter", true),
                new PaymentDtos.PaymentGatewayCatalogResponse("paypal-mock", "PayPal Mock", "PayPal-shaped adapter", true)
        ));
        lenient().when(paymentGatewayRegistry.resolveGatewayMode(any())).thenReturn("mock");
        service = new PaymentGatewayPolicyService(policyRepository, paymentGatewayRegistry);
    }

    @Test
    void catalogReturnsSupportedGateways() {
        assertEquals(3, service.catalog().size());
    }

    @Test
    void policyResponseMapsPersistedPolicy() {
        PaymentGatewayPolicy policy = policy("US", "stripe-test", true, "Best for US cards");
        when(policyRepository.findByCountryCodeIgnoreCase("US")).thenReturn(Optional.of(policy));

        PaymentDtos.PaymentGatewayPolicyResponse response = service.policy("us");

        assertEquals("US", response.countryCode());
        assertEquals("stripe-test", response.gatewayMode());
        assertTrue(response.active());
    }

    @Test
    void upsertCreatesOrUpdatesPolicy() {
        when(policyRepository.findByCountryCodeIgnoreCase("US")).thenReturn(Optional.empty());
        when(policyRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentDtos.PaymentGatewayPolicyResponse response = service.upsert("US",
                new PaymentDtos.PaymentGatewayPolicyRequest("US", "paypal-mock", true, "Best for this region"));

        assertEquals("US", response.countryCode());
        assertEquals("paypal-mock", response.gatewayMode());
        assertTrue(response.active());
    }

    @Test
    void recommendationFallsBackWhenNoPolicyConfigured() {
        when(policyRepository.findByCountryCodeIgnoreCase("AE")).thenReturn(Optional.empty());

        PaymentDtos.PaymentGatewayRecommendationResponse response = service.recommendation("AE");

        assertEquals("AE", response.countryCode());
        assertFalse(response.policyConfigured());
        assertEquals("mock", response.gatewayMode());
    }

    private PaymentGatewayPolicy policy(String countryCode, String gatewayMode, boolean active, String note) {
        PaymentGatewayPolicy policy = new PaymentGatewayPolicy();
        policy.setPublicId("policy-" + countryCode);
        policy.setCountryCode(countryCode);
        policy.setGatewayMode(gatewayMode);
        policy.setActive(active);
        policy.setRecommendationNote(note);
        policy.setCreatedAt(LocalDateTime.now());
        policy.setUpdatedAt(LocalDateTime.now());
        return policy;
    }
}

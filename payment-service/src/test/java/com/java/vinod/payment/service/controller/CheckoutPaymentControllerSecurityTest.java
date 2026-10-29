package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.config.InternalServiceTokenFilter;
import com.java.vinod.payment.service.config.SecurityConfig;
import com.java.vinod.payment.service.dto.CheckoutPaymentDtos;
import com.java.vinod.payment.service.service.ConsolidatedCheckoutPaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies consolidated checkout routes are only reachable with the internal service token.
 */
@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = CheckoutPaymentControllerSecurityTest.TestConfig.class)
class CheckoutPaymentControllerSecurityTest {
    private static final Path PUBLIC_KEY_PATH = createPublicKeyFile();
    private static final String BASE = "/internal/api/v1/payments/checkouts";
    private static final String VALID_BODY = """
            {"checkoutPublicId":"checkout-1","customerUserPublicId":"customer-1","currencyCode":"USD",
             "amount":31.50,"platformFeeAmount":1.58,"providerPayableAmount":29.92,
             "allocations":[{"marketplaceOrderPublicId":"order-1","providerAccountPublicId":"seller-a","providerCountryCode":"US",
                             "amount":21.00,"platformFeeAmount":1.05,"providerPayableAmount":19.95},
                            {"marketplaceOrderPublicId":"order-2","providerAccountPublicId":"seller-b","providerCountryCode":"US",
                             "amount":10.50,"platformFeeAmount":0.53,"providerPayableAmount":9.97}]}
            """;

    @Configuration
    @EnableWebSecurity
    @EnableWebMvc
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean
        ConsolidatedCheckoutPaymentService consolidatedCheckoutPaymentService() {
            return mock(ConsolidatedCheckoutPaymentService.class);
        }

        @Bean
        CheckoutPaymentController checkoutPaymentController(ConsolidatedCheckoutPaymentService service) {
            return new CheckoutPaymentController(service);
        }

        @Bean
        InternalServiceTokenFilter internalServiceTokenFilter() {
            return new InternalServiceTokenFilter("test-token");
        }
    }

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private ConsolidatedCheckoutPaymentService service;
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.public-key-path", () -> PUBLIC_KEY_PATH.toString());
        registry.add("app.jwt.issuer", () -> "https://vinodbalakumar.com/authorization-server/api");
        registry.add("app.jwt.audience", () -> "PAYMENT_API");
        registry.add("app.internal.service-token", () -> "test-token");
    }

    @BeforeEach
    void setUp() {
        Mockito.reset(service);
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    void createWithoutInternalTokenIsRejected() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post(BASE).header("X-Internal-Service-Token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void endUserJwtCannotReplaceInternalToken() throws Exception {
        mockMvc.perform(post(BASE).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_FINANCE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post(BASE + "/checkout-1/allocations/order-1/mark-payout-eligible")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_FINANCE_ADMIN"))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get(BASE + "/checkout-1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post(BASE + "/checkout-1/allocations/order-1/dispute-request")).andExpect(status().isUnauthorized());
        mockMvc.perform(post(BASE + "/checkout-1/refund-request")).andExpect(status().isUnauthorized());
        verifyNoInteractions(service);
    }

    @Test
    void createWithInternalTokenReachesService() throws Exception {
        when(service.createCheckoutPayment(any())).thenReturn(response());

        mockMvc.perform(post(BASE).header("X-Internal-Service-Token", "test-token")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.checkoutPublicId").value("checkout-1"))
                .andExpect(jsonPath("$.payoutMode").value("LEDGER_ONLY"));
        verify(service).createCheckoutPayment(any());
    }

    @Test
    void invalidBodyIsRejectedBeforeService() throws Exception {
        mockMvc.perform(post(BASE).header("X-Internal-Service-Token", "test-token")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"checkoutPublicId\":\"checkout-1\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test
    void allocationRoutesUseInternalToken() throws Exception {
        CheckoutPaymentDtos.CheckoutAllocationResponse allocation = response().allocations().get(0);
        when(service.markAllocationPayoutEligible("checkout-1", "order-1")).thenReturn(allocation);
        when(service.disputeAllocation(eq("checkout-1"), eq("order-1"), any())).thenReturn(allocation);
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "unsupported"))
                .when(service).rejectUnsupportedReversal(anyString(), any(), anyString());

        mockMvc.perform(post(BASE + "/checkout-1/allocations/order-1/mark-payout-eligible")
                        .header("X-Internal-Service-Token", "test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.marketplaceOrderPublicId").value("order-1"));
        mockMvc.perform(post(BASE + "/checkout-1/allocations/order-1/dispute-request")
                        .header("X-Internal-Service-Token", "test-token")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Item not received\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(post(BASE + "/checkout-1/allocations/order-1/refund-request")
                        .header("X-Internal-Service-Token", "test-token"))
                .andExpect(status().isConflict());
        mockMvc.perform(post(BASE + "/checkout-1/cancel-request")
                        .header("X-Internal-Service-Token", "test-token"))
                .andExpect(status().isConflict());
        verify(service).markAllocationPayoutEligible("checkout-1", "order-1");
    }

    private static CheckoutPaymentDtos.CheckoutPaymentResponse response() {
        CheckoutPaymentDtos.CheckoutAllocationResponse allocation = new CheckoutPaymentDtos.CheckoutAllocationResponse(
                "allocation-1", "checkout-1", "order-1", "seller-a", "US", "USD", new BigDecimal("21.00"),
                new BigDecimal("1.05"), new BigDecimal("19.95"), "HELD", null, null, null, null, null);
        return new CheckoutPaymentDtos.CheckoutPaymentResponse("checkout-1", "payment-1", "customer-1", "USD",
                new BigDecimal("21.00"), new BigDecimal("1.05"), new BigDecimal("19.95"), "CAPTURED", "CAPTURED", "HELD",
                "LEDGER_ONLY", List.of(allocation), null, null, null);
    }

    private static Path createPublicKeyFile() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            String pem = "-----BEGIN PUBLIC KEY-----\n"
                    + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8))
                    .encodeToString(generator.generateKeyPair().getPublic().getEncoded())
                    + "\n-----END PUBLIC KEY-----\n";
            Path path = Files.createTempFile("payment-jwt-public", ".pem");
            Files.writeString(path, pem, StandardCharsets.UTF_8);
            path.toFile().deleteOnExit();
            return path;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create test public key", exception);
        }
    }
}
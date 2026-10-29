package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.config.InternalServiceTokenFilter;
import com.java.vinod.marketplace.service.config.SecurityConfig;
import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.service.MarketplaceMasterService;
import com.java.vinod.marketplace.service.service.MarketplaceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.util.Base64;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = MarketplaceControllerSecurityTest.TestConfig.class)
class MarketplaceControllerSecurityTest {
    @Test
    void storefrontSettingsRequireAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/marketplace/home-sections")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/marketplace/admin/home-sections")).andExpect(status().isUnauthorized());
        for (String role : List.of("CUSTOMER", "SUPPORT_AGENT", "MODULE_ADMIN")) {
            mockMvc.perform(get("/api/v1/marketplace/admin/home-sections").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role)))).andExpect(status().isForbidden());
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/marketplace/admin/home-sections/ALL_PRODUCTS").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role))).contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}")).andExpect(status().isForbidden());
        }
        for (String role : List.of("ADMIN", "SUPER_ADMIN")) {
            mockMvc.perform(get("/api/v1/marketplace/admin/home-sections").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role)))).andExpect(status().isOk());
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/marketplace/admin/home-sections/ALL_PRODUCTS").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_" + role))).contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}")).andExpect(status().isOk());
        }
    }
    private static final Path PUBLIC_KEY_PATH = createPublicKeyFile();

    @Configuration
    @EnableWebSecurity
    @EnableWebMvc
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean com.java.vinod.marketplace.service.service.StorefrontSectionService storefrontSections() { return mock(com.java.vinod.marketplace.service.service.StorefrontSectionService.class); }
        @Bean StorefrontSectionController storefrontController(com.java.vinod.marketplace.service.service.StorefrontSectionService service) { return new StorefrontSectionController(service); }

        @Bean
        MarketplaceService marketplaceService() {
            return mock(MarketplaceService.class);
        }

        @Bean
        com.java.vinod.marketplace.service.service.ListingImageService listingImageService() {
            return mock(com.java.vinod.marketplace.service.service.ListingImageService.class);
        }
        @Bean
        ListingImageController listingImageController(com.java.vinod.marketplace.service.service.ListingImageService images) {
            return new ListingImageController(images);
        }

        @Bean
        MarketplaceMasterService marketplaceMasterService() {
            return mock(MarketplaceMasterService.class);
        }

        @Bean
        MarketplaceController marketplaceController(MarketplaceService marketplaceService,
                                                    MarketplaceMasterService marketplaceMasterService) {
            return new MarketplaceController(marketplaceService, marketplaceMasterService);
        }

        @Bean
        com.java.vinod.marketplace.service.service.MarketplaceCheckoutService marketplaceCheckoutService() {
            return mock(com.java.vinod.marketplace.service.service.MarketplaceCheckoutService.class);
        }

        @Bean
        MarketplaceCheckoutController marketplaceCheckoutController(
                com.java.vinod.marketplace.service.service.MarketplaceCheckoutService checkoutService) {
            return new MarketplaceCheckoutController(checkoutService);
        }

        @Bean
        MarketplaceAdminController marketplaceAdminController(MarketplaceService marketplaceService) {
            return new MarketplaceAdminController(marketplaceService);
        }

        @Bean
        InternalServiceTokenFilter internalServiceTokenFilter() {
            return new InternalServiceTokenFilter("test-token");
        }

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper().findAndRegisterModules();
        }

        @Bean
        MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter(ObjectMapper objectMapper) {
            return new MappingJackson2HttpMessageConverter(objectMapper);
        }
    }

    @org.springframework.beans.factory.annotation.Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.public-key-path", () -> PUBLIC_KEY_PATH.toString());
        registry.add("app.jwt.issuer", () -> "https://vinodbalakumar.com/authorization-server/api");
        registry.add("app.jwt.audience", () -> "MARKETPLACE_API");
        registry.add("app.internal.service-token", () -> "test-token");
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    void consolidatedCartCheckoutRequiresAuthenticationAndForwardsIdempotencyKey() throws Exception {
        var checkoutService = context.getBean(com.java.vinod.marketplace.service.service.MarketplaceCheckoutService.class);
        String body = "{\"items\":[{\"cartItemId\":\"item-a\",\"quantity\":2,\"unitPrice\":19.99,\"currencyCode\":\"USD\"}]}";
        mockMvc.perform(post("/api/v1/marketplace/cart/cart-1/checkout").header("Idempotency-Key", "checkout-key-1234567890")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/marketplace/checkouts/checkout-1")).andExpect(status().isUnauthorized());

        var response = new com.java.vinod.marketplace.service.dto.MarketplaceCheckoutDtos.CheckoutResponse("checkout-1", "PAYMENT_PENDING",
                "USD", new java.math.BigDecimal("39.98"), new java.math.BigDecimal("2.00"), new java.math.BigDecimal("39.98"),
                new java.math.BigDecimal("37.98"), List.of());
        when(checkoutService.checkoutCart(org.mockito.ArgumentMatchers.eq("cart-1"), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq("checkout-key-1234567890"), org.mockito.ArgumentMatchers.any())).thenReturn(response);
        when(checkoutService.checkout(org.mockito.ArgumentMatchers.eq("checkout-1"), org.mockito.ArgumentMatchers.any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/marketplace/cart/cart-1/checkout").with(jwt().jwt(token -> token.subject("buyer")))
                        .header("Idempotency-Key", "checkout-key-1234567890")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.checkoutPublicId").value("checkout-1"))
                .andExpect(jsonPath("$.customerTotalAmount").value(39.98))
                .andExpect(jsonPath("$.providerAmount").value(37.98));
        mockMvc.perform(get("/api/v1/marketplace/checkouts/checkout-1").with(jwt().jwt(token -> token.subject("buyer"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_PENDING"));
        mockMvc.perform(post("/api/v1/marketplace/cart/cart-1/checkout").with(jwt().jwt(token -> token.subject("buyer")))
                        .header("Idempotency-Key", "checkout-key-1234567890")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"items\":[]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void publicListingImageDoesNotRequireLogin() throws Exception {
        var images = context.getBean(com.java.vinod.marketplace.service.service.ListingImageService.class);
        when(images.image("image-test")).thenReturn(new com.java.vinod.marketplace.service.service.AssetStorageService.ListingImage(new byte[]{1,2}, "image/jpeg"));
        mockMvc.perform(get("/api/v1/marketplace/listings/image-test/image"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType("image/jpeg"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Cache-Control", "max-age=300, public"));
    }

    @Test
    void anonymousVerticalDiscoveryIsPublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.activeVerticals()).thenReturn(List.of(
                new MarketplaceDtos.VerticalResponse("MARKETPLACE", "Marketplace", "Protected resale and everyday commerce",
                        "ACTIVE", 10, "store", "COMMERCE_VERTICAL", "/marketplace", "MARKETPLACE_API", null,
                        true, true, true, true, true)));

        mockMvc.perform(get("/api/v1/marketplace/verticals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].moduleCode").value("MARKETPLACE"));
    }

    @Test
    void anonymousHomePayloadIsPublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.home((String) null)).thenReturn(new MarketplaceDtos.HomeResponse(
                List.of(new MarketplaceDtos.VerticalResponse("MARKETPLACE", "Marketplace", "Protected resale and everyday commerce",
                        "ACTIVE", 10, "store", "COMMERCE_VERTICAL", "/marketplace", "MARKETPLACE_API", null,
                        true, true, true, true, true)),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0L));

        mockMvc.perform(get("/api/v1/marketplace/home"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verticals[0].moduleCode").value("MARKETPLACE"));
    }

    @Test
    void anonymousBrowseCategoriesIsPublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.activeCategories()).thenReturn(List.of(
                new MarketplaceDtos.CategoryResponse(1L, "GROCERY", "Grocery", "grocery", "GROCERY", "USA", "shopping_basket", null, true)));

        mockMvc.perform(get("/api/v1/marketplace/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("GROCERY"));
    }

    @Test
    void anonymousBrowseListingsHeadRequestIsPublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.activeListings(null, "MARKETPLACE", "US")).thenReturn(List.of());

        mockMvc.perform(head("/api/v1/marketplace/listings")
                        .param("verticalCode", "MARKETPLACE")
                        .param("countryCode", "US"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousBrowseCategoriesByVerticalIsPublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.activeCategories("GROCERY")).thenReturn(List.of(
                new MarketplaceDtos.CategoryResponse(1L, "GROCERY", "Grocery", "grocery", "GROCERY", "USA", "shopping_basket", null, true)));

        mockMvc.perform(get("/api/v1/marketplace/categories/by-vertical").param("verticalCode", "GROCERY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("GROCERY"));
    }

    @Test
    void anonymousListingReviewsArePublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.listingReviews("LISTING-1")).thenReturn(List.of(
                new MarketplaceDtos.ListingReviewResponse("review-1", "LISTING-1", "Ava M.",
                        "Fast redemption", "Redeemed quickly and the seller kept the process clear.", 5.0, true,
                        java.time.LocalDateTime.now())));

        mockMvc.perform(get("/api/v1/marketplace/listings/LISTING-1/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].listingPublicId").value("LISTING-1"));
    }

    @Test
    void anonymousListingReviewsByQueryArePublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.listingReviews("LISTING-2")).thenReturn(List.of(
                new MarketplaceDtos.ListingReviewResponse("review-2", "LISTING-2", "Ava M.",
                        "Fast redemption", "Redeemed quickly and the seller kept the process clear.", 5.0, true,
                        java.time.LocalDateTime.now())));

        mockMvc.perform(get("/api/v1/marketplace/reviews").param("listingPublicId", "LISTING-2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].listingPublicId").value("LISTING-2"));
    }

    @Test
    void anonymousListingDetailIsPublic() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.listing("LISTING-3", null)).thenReturn(new MarketplaceDtos.ListingResponse(
                "LISTING-3",
                "Digital Design Service Voucher",
                "Original creative service voucher",
                "SERVICE",
                "DIGITAL",
                "NATIONAL",
                "USD",
                new java.math.BigDecimal("95.00"),
                new java.math.BigDecimal("120.00"),
                null,
                "Studio Fresh",
                true,
                "SERVICES",
                "MARKETPLACE",
                "USA",
                "ACTIVE",
                "DIGITAL",
                3,
                "SYNTHETIC",
                "Sharity Seed Studio",
                "",
                "Original synthetic listing created for Sharity browse depth.",
                true,
                List.of(),
                java.time.LocalDateTime.now(),
                "USD",
                new java.math.BigDecimal("95.00"),
                new java.math.BigDecimal("120.00")));

        mockMvc.perform(get("/api/v1/marketplace/listings/LISTING-3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicId").value("LISTING-3"))
                .andExpect(jsonPath("$.publicReviews").isArray());
    }

    @Test
    void anonymousProtectedWriteRemainsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/marketplace/provider/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void marketplaceAdminListingsRequireAdminRole() throws Exception {
        mockMvc.perform(get("/api/v1/marketplace/admin/listings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void marketplaceAdminListingsAllowTrustedAdminRole() throws Exception {
        MarketplaceService service = context.getBean(MarketplaceService.class);
        when(service.adminListings(null, null, null, null)).thenReturn(List.of(
                new MarketplaceDtos.AdminListingResponse("listing-1", "Marketplace Listing", "provider-1",
                        "seller-1", "Trusted Seller", "GIFT_CARDS", "MARKETPLACE", "ACTIVE",
                        true, true, false, java.time.LocalDateTime.now(), java.time.LocalDateTime.now())));

        mockMvc.perform(get("/api/v1/marketplace/admin/listings")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].publicId").value("listing-1"));
    }

    private static Path createPublicKeyFile() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            PublicKey publicKey = keyPair.getPublic();
            String pem = "-----BEGIN PUBLIC KEY-----\n"
                    + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8)).encodeToString(publicKey.getEncoded())
                    + "\n-----END PUBLIC KEY-----\n";
            Path path = Files.createTempFile("marketplace-jwt-public", ".pem");
            Files.writeString(path, pem, StandardCharsets.UTF_8);
            path.toFile().deleteOnExit();
            return path;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create test public key", exception);
        }
    }
}

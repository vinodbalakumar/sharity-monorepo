package com.java.vinod.wallet.service.controller;

import com.java.vinod.wallet.service.config.InternalServiceTokenFilter;
import com.java.vinod.wallet.service.config.SecurityConfig;
import com.java.vinod.wallet.service.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
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
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.util.Base64;

import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = WalletControllerSecurityTest.TestConfig.class)
class WalletControllerSecurityTest {
    private static final Path PUBLIC_KEY_PATH = createPublicKeyFile();

    @Configuration
    @EnableWebSecurity
    @EnableWebMvc
    @Import(SecurityConfig.class)
    static class TestConfig {
        @Bean
        WalletService walletService() {
            return mock(WalletService.class);
        }

        @Bean
        WalletController walletController(WalletService walletService) {
            return new WalletController(walletService);
        }

        @Bean
        InternalServiceTokenFilter internalServiceTokenFilter() {
            return new InternalServiceTokenFilter("test-token");
        }
    }

    @org.springframework.beans.factory.annotation.Autowired
    private WebApplicationContext context;
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.public-key-path", () -> PUBLIC_KEY_PATH.toString());
        registry.add("app.jwt.issuer", () -> "https://vinodbalakumar.com/authorization-server/api");
        registry.add("app.jwt.audience", () -> "WALLET_API");
        registry.add("app.internal.service-token", () -> "test-token");
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    @Test
    void anonymousAdminAccountsAreRejected() throws Exception {
        mockMvc.perform(get("/api/v1/wallet/admin/accounts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void financeAdminCanAccessAdminAccounts() throws Exception {
        mockMvc.perform(get("/api/v1/wallet/admin/accounts")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_FINANCE_ADMIN"))))
                .andExpect(status().isOk());
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
            Path path = Files.createTempFile("wallet-jwt-public", ".pem");
            Files.writeString(path, pem, StandardCharsets.UTF_8);
            path.toFile().deleteOnExit();
            return path;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create test public key", exception);
        }
    }
}

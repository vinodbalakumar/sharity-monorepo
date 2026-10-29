package com.java.vinod.payment.service.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.security.oauth2.jwt.JwtException;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPairGenerator;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityConfigTest {
    @TempDir
    Path directory;

    @Test
    void acceptsBase64WithoutAKeyFile() throws Exception {
        String encoded = Base64.getEncoder().encodeToString(publicPem().getBytes(StandardCharsets.UTF_8));
        assertThat(new SecurityConfig().jwtDecoder(encoded, "missing.pem", "https://issuer.test", "PAYMENT_API"))
                .isNotNull();
    }

    @Test
    void retainsFileFallback() throws Exception {
        Path file = directory.resolve("public.pem");
        Files.writeString(file, publicPem());
        assertThat(new SecurityConfig().jwtDecoder("", file.toString(), "https://issuer.test", "PAYMENT_API"))
                .isNotNull();
    }

    @Test
    void invalidBase64DoesNotFallBackToValidFile() throws Exception {
        Path file = directory.resolve("public.pem");
        Files.writeString(file, publicPem());
        assertThatThrownBy(() -> new SecurityConfig().jwtDecoder("invalid!", file.toString(),
                "https://issuer.test", "PAYMENT_API"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("public-key-base64");
    }

    @Test
    void missingKeyStillRejectsTokens() throws Exception {
        var decoder = new SecurityConfig().jwtDecoder("", "", "https://issuer.test", "PAYMENT_API");
        assertThatThrownBy(() -> decoder.decode("invalid")).isInstanceOf(JwtException.class);
    }

    private String publicPem() throws Exception {
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return "-----BEGIN PUBLIC KEY-----\n"
                + Base64.getEncoder().encodeToString(generator.generateKeyPair().getPublic().getEncoded())
                + "\n-----END PUBLIC KEY-----";
    }
}

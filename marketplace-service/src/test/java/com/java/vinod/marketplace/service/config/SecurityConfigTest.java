package com.java.vinod.marketplace.service.config;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityConfigTest {
    private static final String ISSUER = "https://authorization.example.test";
    private static final String AUDIENCE = "MARKETPLACE_API";
    private static final Path KEY_DIRECTORY = Path.of("target", "security-config-test-keys");
    private static KeyPair keyPair;
    private static String publicKeyPem;
    private final SecurityConfig config = new SecurityConfig();
    private final List<Path> keyFiles = new ArrayList<>();

    @BeforeAll
    static void generateKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        publicKeyPem = "-----BEGIN PUBLIC KEY-----\r\n"
                + Base64.getMimeEncoder(64, new byte[]{'\r', '\n'}).encodeToString(keyPair.getPublic().getEncoded())
                + "\r\n-----END PUBLIC KEY-----\r\n";
    }

    @AfterEach
    void removeKeyFixtures() throws Exception {
        for (Path keyFile : keyFiles) {
            Files.deleteIfExists(keyFile);
        }
        Files.deleteIfExists(KEY_DIRECTORY);
    }

    @Test
    void acceptsBase64EncodedPemWithoutAPath() throws Exception {
        JwtDecoder decoder = decoder(encode(publicKeyPem), "");

        assertThat(decoder.decode(token(ISSUER, AUDIENCE, Instant.now().plusSeconds(300))).getSubject())
                .isEqualTo("test-user");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" \t\n"})
    void fallsBackToPemPathWhenBase64IsAbsent(String base64) throws Exception {
        JwtDecoder decoder = decoder(base64, keyFile(publicKeyPem).toString());

        assertThat(decoder.decode(token(ISSUER, AUDIENCE, Instant.now().plusSeconds(300))).getIssuer().toString())
                .isEqualTo(ISSUER);
    }

    @Test
    void base64TakesPriorityOverDifferentPathKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        String otherKey = "-----BEGIN PUBLIC KEY-----\n"
                + Base64.getEncoder().encodeToString(generator.generateKeyPair().getPublic().getEncoded())
                + "\n-----END PUBLIC KEY-----";
        JwtDecoder decoder = decoder(encode(publicKeyPem), keyFile(otherKey).toString());

        assertThat(decoder.decode(token(ISSUER, AUDIENCE, Instant.now().plusSeconds(300))).getSubject())
                .isEqualTo("test-user");
    }

    @Test
    void base64DoesNotReadMissingPath() throws Exception {
        JwtDecoder decoder = decoder(encode(publicKeyPem), KEY_DIRECTORY.resolve("missing.pem").toString());

        assertThat(decoder.decode(token(ISSUER, AUDIENCE, Instant.now().plusSeconds(300))).getSubject())
                .isEqualTo("test-user");
    }

    @Test
    void malformedBase64DoesNotFallBackToValidPath() throws Exception {
        String path = keyFile(publicKeyPem).toString();

        assertThatThrownBy(() -> decoder("invalid-base64!", path))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("app.jwt.public-key-base64 must be Base64-encoded public key PEM");
    }

    @Test
    void invalidPemInBase64DoesNotFallBackToValidPath() throws Exception {
        String path = keyFile(publicKeyPem).toString();

        assertThatThrownBy(() -> decoder(encode("not an RSA public key"), path))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT public key from app.jwt.public-key-base64 must be an RSA PUBLIC KEY PEM (X.509)");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" \t\n"})
    void missingKeyHasExplicitConfigurationError(String absent) {
        assertThatThrownBy(() -> decoder(absent, absent))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("app.jwt.public-key-base64 or app.jwt.public-key-path must be configured");
    }

    @Test
    void missingPathHasExplicitReadError() {
        assertThatThrownBy(() -> decoder("", KEY_DIRECTORY.resolve("missing.pem").toString()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Unable to read JWT public key from app.jwt.public-key-path")
                .hasCauseInstanceOf(java.nio.file.NoSuchFileException.class);
    }

    @Test
    void malformedPathPemHasExplicitKeyError() throws Exception {
        String path = keyFile("not an RSA public key").toString();

        assertThatThrownBy(() -> decoder("", path))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT public key from app.jwt.public-key-path must be an RSA PUBLIC KEY PEM (X.509)");
    }

    @Test
    void rejectsIncorrectIssuer() throws Exception {
        JwtDecoder decoder = decoder(encode(publicKeyPem), "");
        String token = token("https://wrong.example.test", AUDIENCE, Instant.now().plusSeconds(300));

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void rejectsIncorrectAudience() throws Exception {
        JwtDecoder decoder = decoder(encode(publicKeyPem), "");
        String token = token(ISSUER, "OTHER_API", Instant.now().plusSeconds(300));

        assertThatThrownBy(() -> decoder.decode(token))
                .isInstanceOf(JwtException.class)
                .hasMessageContaining("Token audience is not allowed");
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        JwtDecoder decoder = decoder(encode(publicKeyPem), "");
        String token = token(ISSUER, AUDIENCE, Instant.now().minusSeconds(300));

        assertThatThrownBy(() -> decoder.decode(token)).isInstanceOf(JwtException.class);
    }

    private JwtDecoder decoder(String base64, String path) throws Exception {
        return config.jwtDecoder(base64, path, ISSUER, AUDIENCE);
    }

    private Path keyFile(String contents) throws Exception {
        Files.createDirectories(KEY_DIRECTORY);
        Path path = KEY_DIRECTORY.resolve(UUID.randomUUID() + ".pem");
        keyFiles.add(path);
        return Files.writeString(path, contents, StandardCharsets.UTF_8);
    }

    private static String encode(String pem) {
        return Base64.getEncoder().encodeToString(pem.getBytes(StandardCharsets.UTF_8));
    }

    private static String token(String issuer, String audience, Instant expiresAt) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).type(JOSEObjectType.JWT).build(),
                new JWTClaimsSet.Builder().issuer(issuer).audience(audience).subject("test-user")
                        .issueTime(Date.from(Instant.now().minusSeconds(600)))
                        .expirationTime(Date.from(expiresAt)).build());
        jwt.sign(new RSASSASigner(keyPair.getPrivate()));
        return jwt.serialize();
    }
}

package com.java.vinod.payment.service.integration;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PublicKey;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;

abstract class IntegrationTestSupport {
    private static final Path PUBLIC_KEY_PATH = createPublicKeyFile();
    private static final HttpServer TEST_SERVER = createTestServer();
    protected static final AtomicInteger WALLET_STATUS = new AtomicInteger(200);
    protected static final AtomicInteger WALLET_REQUESTS = new AtomicInteger();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void registerTestProperties(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.public-key-path", () -> PUBLIC_KEY_PATH.toString());
        registry.add("app.jwt.issuer", () -> "https://test.sharity.local/authorization-server/api");
        registry.add("app.jwt.audience", () -> "PAYMENT_API");
        registry.add("app.services.authorization-provider-eligibility-url", () -> testServerBaseUrl() + "/auth");
        registry.add("app.services.wallet-internal-url", IntegrationTestSupport::testServerBaseUrl);
        registry.add("app.internal.service-token", () -> "test-token");
        registry.add("app.outbox.dispatch-delay-ms", () -> "3600000");
    }

    @BeforeEach
    void resetDatabase() {
        WALLET_STATUS.set(200);
        WALLET_REQUESTS.set(0);
        jdbcTemplate.update("DELETE FROM dispute_event");
        jdbcTemplate.update("DELETE FROM dispute_evidence");
        jdbcTemplate.update("DELETE FROM dispute");
        jdbcTemplate.update("DELETE FROM refund_transaction");
        jdbcTemplate.update("DELETE FROM checkout_payment_allocation");
        jdbcTemplate.update("DELETE FROM checkout_payment");
        jdbcTemplate.update("DELETE FROM provider_payout");
        jdbcTemplate.update("DELETE FROM payment_transaction");
        jdbcTemplate.update("DELETE FROM payment_webhook_event");
        jdbcTemplate.update("DELETE FROM payment_event_outbox");
        jdbcTemplate.update("DELETE FROM payment_order");
        jdbcTemplate.update("DELETE FROM payment_gateway_policy");
    }

    private static String testServerBaseUrl() {
        return "http://127.0.0.1:" + TEST_SERVER.getAddress().getPort();
    }

    private static HttpServer createTestServer() {
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
            server.createContext("/auth/providers", IntegrationTestSupport::handleAuthorizationEligibility);
            server.createContext("/wallet/events", IntegrationTestSupport::handleWalletEvent);
            server.start();
            Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(0)));
            return server;
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to start integration test HTTP server", exception);
        }
    }

    private static void handleAuthorizationEligibility(HttpExchange exchange) throws IOException {
        byte[] payload = ("""
                {
                  \"eligible\": true,
                  \"providerPublicId\": \"test-provider\",
                  \"moduleCode\": \"MARKETPLACE\",
                  \"providerStatus\": \"ACTIVE\",
                  \"enrollmentStatus\": \"ENROLLED\",
                  \"sellingEnabled\": true,
                  \"payoutEligible\": true,
                  \"restricted\": false
                }
                """).getBytes(StandardCharsets.UTF_8);
        writeJsonResponse(exchange, 200, payload);
    }

    private static void handleWalletEvent(HttpExchange exchange) throws IOException {
        WALLET_REQUESTS.incrementAndGet();
        writeJsonResponse(exchange, WALLET_STATUS.get(), "{}".getBytes(StandardCharsets.UTF_8));
    }

    private static void writeJsonResponse(HttpExchange exchange, int statusCode, byte[] payload) throws IOException {
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, payload.length);
        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(payload);
        } finally {
            exchange.close();
        }
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
            Path directory = Path.of("target", "test-keys");
            Files.createDirectories(directory);
            Path path = Files.createTempFile(directory, "payment-integration-jwt-public", ".pem");
            Files.writeString(path, pem, StandardCharsets.UTF_8);
            path.toFile().deleteOnExit();
            return path;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create integration test public key", exception);
        }
    }
}
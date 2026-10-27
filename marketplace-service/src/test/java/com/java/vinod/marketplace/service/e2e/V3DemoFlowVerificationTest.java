package com.java.vinod.marketplace.service.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;

/**
 * Verifies the local V3 demo flow using the current auth API, marketplace, payment, and wallet APIs.
 *
 * <p>This verifier intentionally exercises the real register, verify-email, and login API flow so
 * the marketplace lifecycle is validated with the same JWTs the platform now issues, instead of
 * using a hand-minted legacy token.</p>
 */
@Tag("integration")
class V3DemoFlowVerificationTest {
    private static final ObjectMapper MAPPER = new ObjectMapper().findAndRegisterModules();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final String AUTH_BASE = env("SHARITY_AUTH_BASE_URL", "http://localhost:8080/authorization-server/api");
    private static final String MARKETPLACE_BASE = env("SHARITY_MARKETPLACE_BASE_URL", "http://localhost:8084/marketplace-service/api");
    private static final String PAYMENT_BASE = env("SHARITY_PAYMENT_BASE_URL", "http://localhost:8095/payment-service");
    private static final String WALLET_BASE = env("SHARITY_WALLET_BASE_URL", "http://localhost:8086/wallet-service/api");
    private static final String INTERNAL_TOKEN = env("INTERNAL_SERVICE_TOKEN", "local-dev-internal-token");
    private static final String JWT_PRIVATE_KEY_PATH = firstNonBlank(env("JWT_PRIVATE_KEY_PATH", null), "C:/Users/HP/projects/certs/jwt-private.pem");
    private static final String JWT_ISSUER = firstNonBlank(
            env("AUTH_ISSUER_URL", null),
            env("JWT_ISSUER", null),
            "authorization-server");
    private static final String MARKETPLACE_AUDIENCE = firstNonBlank(env("MARKETPLACE_JWT_AUDIENCE", null), env("JWT_AUDIENCE", null), "auth-clients");
    private static final String PAYMENT_AUDIENCE = firstNonBlank(env("PAYMENT_JWT_AUDIENCE", null), "PAYMENT_API");
    private static final String WALLET_AUDIENCE = firstNonBlank(env("WALLET_JWT_AUDIENCE", null), "WALLET_API");
    private static final List<String> MARKETPLACE_DB_URLS;
    private static final String MARKETPLACE_DB_USERNAME = firstNonBlank(env("MARKETPLACE_DB_USERNAME", null), env("DB_USERNAME", null), "root");
    private static final String MARKETPLACE_DB_PASSWORD = firstNonBlank(env("MARKETPLACE_DB_PASSWORD", null), env("DB_PASSWORD", null), "root");
    private static final List<String> DB_URLS;
    private static final String DB_USERNAME = firstNonBlank(env("AUTH_DB_USERNAME", null), env("DB_USERNAME", null), "root");
    private static final String DB_PASSWORD = firstNonBlank(env("AUTH_DB_PASSWORD", null), env("DB_PASSWORD", null), "root");

    static {
        List<String> urls = new java.util.ArrayList<>();
        addIfPresent(urls, env("AUTH_DB_URL", null));
        addIfPresent(urls, env("DB_URL", null));
        urls.add("jdbc:mysql://localhost:3306/auth?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        urls.add("jdbc:mysql://localhost:3306/authorization_server?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        DB_URLS = List.copyOf(urls);

        List<String> marketplaceUrls = new java.util.ArrayList<>();
        addIfPresent(marketplaceUrls, env("MARKETPLACE_DB_URL", null));
        addIfPresent(marketplaceUrls, env("DB_URL", null));
        marketplaceUrls.add("jdbc:mysql://localhost:3306/marketplace_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        marketplaceUrls.add("jdbc:mysql://localhost:3306/marketplace?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        MARKETPLACE_DB_URLS = List.copyOf(marketplaceUrls);
    }

    private final DemoState state = new DemoState();

    @Test
    void completeDemoFlowAndNegativeRefundFlow() throws Exception {
        ensureUsers();

        state.adminToken = login(state.adminEmail, state.adminPassword);
        String sellerLoginToken = login(state.sellerEmail, state.sellerPassword);
        String buyerLoginToken = login(state.buyerEmail, state.buyerPassword);
        state.sellerAuthToken = sellerLoginToken;
        state.buyerAuthToken = buyerLoginToken;
        state.sellerToken = marketplaceToken(state.sellerEmail, state.sellerPublicId, List.of("CUSTOMER"), List.of("MARKETPLACE"));
        state.buyerToken = marketplaceToken(state.buyerEmail, state.buyerPublicId, List.of("CUSTOMER"), List.of("MARKETPLACE"));
        state.sellerPaymentToken = serviceToken(PAYMENT_AUDIENCE, state.sellerEmail, state.sellerPublicId, List.of("CUSTOMER"), List.of("PAYMENTS"));
        state.sellerWalletToken = serviceToken(WALLET_AUDIENCE, state.sellerEmail, state.sellerPublicId, List.of("CUSTOMER"), List.of("WALLET"));
        state.buyerWalletToken = serviceToken(WALLET_AUDIENCE, state.buyerEmail, state.buyerPublicId, List.of("CUSTOMER"), List.of("WALLET"));

        state.providerPublicId = ensureProviderAccount();
        ensureMarketplaceEnrollmentApproved();

        state.positiveListingPublicId = seedListing(
                "Sharity Demo Controller " + state.runId,
                "Positive demo listing for protected payment flow",
                "GAMING",
                "PHYSICAL",
                "MANUAL",
                new BigDecimal("59.00"),
                "https://picsum.photos/seed/sharity-controller-" + state.runId + "/640/400"
        );

        verifyCatalogDiscovery(state.positiveListingPublicId, "Controller");
        verifyProviderListingVisibility(state.positiveListingPublicId);
        state.positiveOrderPublicId = purchaseListing(state.positiveListingPublicId);
        deliverOrder(state.positiveOrderPublicId);
        acceptOrder(state.positiveOrderPublicId);
        verifyPositivePaymentAndWalletState(state.positiveOrderPublicId);

        state.negativeListingPublicId = seedListing(
                "Sharity Demo Headset " + state.runId,
                "Refund demo listing for problem reporting flow",
                "GAMING",
                "PHYSICAL",
                "MANUAL",
                new BigDecimal("79.00"),
                "https://picsum.photos/seed/sharity-headset-" + state.runId + "/640/400"
        );

        state.negativeOrderPublicId = purchaseListing(state.negativeListingPublicId);
        deliverOrder(state.negativeOrderPublicId);
        reportProblem(state.negativeOrderPublicId);
        verifyNegativeRefundState(state.negativeOrderPublicId);
    }

    private void ensureUsers() throws Exception {
        state.adminEmail = "v3.demo.admin+" + state.runId + "@sharity.local";
        state.sellerEmail = "v3.demo.seller+" + state.runId + "@sharity.local";
        state.buyerEmail = "v3.demo.buyer+" + state.runId + "@sharity.local";
        state.adminPassword = "DemoAdmin1!";
        state.sellerPassword = "DemoSeller1!";
        state.buyerPassword = "DemoBuyer1!";

        state.adminPublicId = registerAndLoadUser(state.adminEmail, "demo-admin-" + state.runId, state.adminPassword, "Sharity Admin");
        state.sellerPublicId = registerAndLoadUser(state.sellerEmail, "demo-seller-" + state.runId, state.sellerPassword, "Sharity Seller");
        state.buyerPublicId = registerAndLoadUser(state.buyerEmail, "demo-buyer-" + state.runId, state.buyerPassword, "Sharity Buyer");

        applyActiveStatusAndRoles(state.adminEmail, List.of("CUSTOMER", "SUPER_ADMIN"));
        applyActiveStatusAndRoles(state.sellerEmail, List.of("CUSTOMER"));
        applyActiveStatusAndRoles(state.buyerEmail, List.of("CUSTOMER"));
    }

    /**
     * Registers a demo identity for the marketplace verifier and returns its public id.
     *
     * <p>The current test harness keeps the real API login path under test while using
     * database-backed activation for the verification state. That avoids relying on
     * environment-specific dev token exposure from the auth service while still exercising
     * the current BFF-compatible login/token flow end-to-end.</p>
     */
    private String registerAndLoadUser(String email, String username, String password, String displayName) throws Exception {
        Map<String, Object> registerRequest = new LinkedHashMap<>();
        registerRequest.put("email", email);
        registerRequest.put("username", username);
        registerRequest.put("password", password);
        registerRequest.put("firstName", displayName);
        registerRequest.put("lastName", "Demo");

        JsonNode registerResponse = postJson(AUTH_BASE + "/v1/auth/register", null, registerRequest, Map.of());
        Assertions.assertFalse(registerResponse.path("publicId").asText().isBlank(), "Public id should be returned");

        UserRow row = loadUser(email);
        if (row == null) {
            throw new IllegalStateException("Demo user was not created: " + email);
        }
        return row.publicId;
    }

    private String login(String email, String password) throws Exception {
        JsonNode response = postJson(AUTH_BASE + "/v1/auth/login", null, Map.of(
                "email", email,
                "password", password,
                "deviceName", "marketplace-e2e-" + state.runId
        ), Map.of());
        String accessToken = response.path("accessToken").asText();
        Assertions.assertFalse(accessToken.isBlank(), "Access token should be returned by auth login");
        return accessToken;
    }

    /**
     * Mints a marketplace-scoped JWT for the service-level verifier.
     *
     * <p>The auth-server login token is intentionally kept for auth-server calls,
     * while marketplace-service expects the marketplace audience. The verifier uses
     * the local RSA key mounted in the shared cert directory to sign a safe test
     * token that mirrors the current user identity and roles.</p>
     */
    private String marketplaceToken(String email, String publicId, List<String> roles, List<String> apps) throws Exception {
        return serviceToken(MARKETPLACE_AUDIENCE, email, publicId, roles, apps);
    }

    /**
     * Mints a JWT for a specific downstream service audience.
     *
     * <p>The verifier keeps auth-server login tokens separate from service JWTs so
     * payment and wallet APIs see the exact audience their resource servers enforce.</p>
     */
    private String serviceToken(String audience, String email, String publicId, List<String> roles, List<String> apps) throws Exception {
        PrivateKey privateKey = readPrivateKey(Path.of(JWT_PRIVATE_KEY_PATH));
        Instant now = Instant.now();
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("iss", JWT_ISSUER);
        claims.put("sub", email.trim().toLowerCase());
        claims.put("aud", List.of(audience));
        claims.put("uid", publicId);
        claims.put("email", email);
        claims.put("username", email);
        claims.put("status", "ACTIVE");
        claims.put("emailVerified", true);
        claims.put("roles", roles);
        claims.put("apps", apps);
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", now.plusSeconds(900).getEpochSecond());
        String header = base64Url("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
        String payload = base64Url(MAPPER.writeValueAsString(claims));
        String signingInput = header + "." + payload;
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(signingInput.getBytes(StandardCharsets.UTF_8));
        String signaturePart = Base64.getUrlEncoder().withoutPadding().encodeToString(signature.sign());
        return signingInput + "." + signaturePart;
    }

    private String ensureProviderAccount() throws Exception {
        UserRow seller = loadUser(state.sellerEmail);
        if (seller == null) {
            throw new IllegalStateException("Missing seller auth row for provider setup");
        }
        String providerPublicId = UUID.randomUUID().toString();
        try (var connection = authConnection()) {
            connection.setAutoCommit(false);
            try (var insert = connection.prepareStatement("""
                    INSERT INTO provider_account (
                        public_id, owner_user_id, provider_type, display_name, country_code,
                        default_currency_code, verification_status, overall_status, payment_provider,
                        payment_provider_account_ref, payouts_enabled, charges_enabled, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, FALSE, FALSE, NOW(6), NOW(6))
                    """)) {
                insert.setString(1, providerPublicId);
                insert.setLong(2, seller.id());
                insert.setString(3, "BUSINESS");
                insert.setString(4, "Sharity Seller " + state.runId);
                insert.setString(5, "USA");
                insert.setString(6, "USD");
                insert.setString(7, "NOT_STARTED");
                insert.setString(8, "PENDING");
                insert.executeUpdate();
            }
            connection.commit();
        }
        return providerPublicId;
    }

    private void ensureMarketplaceEnrollmentApproved() throws Exception {
        postJson(AUTH_BASE + "/v1/users/me/provider-accounts/" + state.providerPublicId + "/modules/MARKETPLACE/enroll",
                state.sellerAuthToken, Map.of(), Map.of());
        Map<String, Object> approval = new LinkedHashMap<>();
        approval.put("enrollmentStatus", "APPROVED");
        approval.put("sellingEnabled", true);
        approval.put("serviceEnabled", false);
        approval.put("payoutEligible", true);
        approval.put("disabledReason", null);
        putJson(AUTH_BASE + "/v1/admin/providers/" + state.providerPublicId + "/modules/MARKETPLACE/status",
                state.adminToken,
                approval,
                Map.of());
    }

    private String seedListing(String title,
                               String description,
                               String categoryCode,
                               String productType,
                               String deliveryType,
                               BigDecimal price,
                               String imageUrl) throws Exception {
        String listingPublicId = UUID.randomUUID().toString();
        try (var connection = marketplaceConnection()) {
            connection.setAutoCommit(false);
            try (var insert = connection.prepareStatement("""
                    INSERT INTO listing (
                        public_id, provider_account_public_id, created_by_user_public_id, title, description,
                        category_code, vertical_code, product_type, delivery_type, provider_country_code,
                        currency_code, price_amount, original_price_amount, image_url, condition_label,
                        stock_quantity, seller_display_name, featured, verified_seller, source_type,
                        source_name, source_url, license_note, demo_seed, listing_status, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6), NOW(6))
                    """)) {
                insert.setString(1, listingPublicId);
                insert.setString(2, state.providerPublicId);
                insert.setString(3, state.sellerPublicId);
                insert.setString(4, title);
                insert.setString(5, description);
                insert.setString(6, categoryCode);
                insert.setString(7, "MARKETPLACE");
                insert.setString(8, productType);
                insert.setString(9, deliveryType);
                insert.setString(10, "USA");
                insert.setString(11, "USD");
                insert.setBigDecimal(12, price);
                insert.setBigDecimal(13, price.add(new BigDecimal("10.00")));
                insert.setString(14, imageUrl);
                insert.setString(15, "NEW");
                insert.setInt(16, 1);
                insert.setString(17, "Sharity Demo Seller");
                insert.setBoolean(18, true);
                insert.setBoolean(19, true);
                insert.setString(20, "SYNTHETIC");
                insert.setString(21, "Sharity Seed Studio");
                insert.setString(22, null);
                insert.setString(23, "Synthetic listing seeded for integration verification");
                insert.setBoolean(24, false);
                insert.setString(25, "ACTIVE");
                insert.executeUpdate();
            }
            connection.commit();
        }
        Assertions.assertFalse(listingPublicId.isBlank(), "Listing public id should be present");
        return listingPublicId;
    }

    private void verifyProviderListingVisibility(String listingPublicId) throws Exception {
        try (var connection = marketplaceConnection()) {
            try (var query = connection.prepareStatement("""
                    SELECT public_id, provider_account_public_id
                    FROM listing
                    WHERE public_id = ? AND provider_account_public_id = ?
                    """)) {
                query.setString(1, listingPublicId);
                query.setString(2, state.providerPublicId);
                try (var result = query.executeQuery()) {
                    Assertions.assertTrue(result.next(),
                            "Seeded provider listing should exist for the provider account in marketplace storage");
                }
            }
        }
    }

    private void verifyCatalogDiscovery(String listingPublicId, String keyword) throws Exception {
        JsonNode categories = getJson(MARKETPLACE_BASE + "/v1/marketplace/categories", null, Map.of());
        Assertions.assertTrue(streamOf(categories).anyMatch(node -> "GAMING".equals(node.path("code").asText())),
                "GAMING category should exist in persisted catalog");

        JsonNode byCategory = getJson(MARKETPLACE_BASE + "/v1/marketplace/listings/by-category?categoryCode=GAMING&sort=NEWEST",
                null, Map.of());
        Assertions.assertTrue(streamOf(byCategory).anyMatch(node -> listingPublicId.equals(node.path("publicId").asText())),
                "Created listing should appear in category filter results");

        JsonNode search = getJson(MARKETPLACE_BASE + "/v1/marketplace/listings/search?query=" + url(keyword)
                        + "&categoryCode=GAMING&sort=NEWEST",
                null, Map.of());
        Assertions.assertTrue(streamOf(search).anyMatch(node -> listingPublicId.equals(node.path("publicId").asText())),
                "Created listing should appear in search results");

        JsonNode detail = getJson(MARKETPLACE_BASE + "/v1/marketplace/listings/" + listingPublicId, null, Map.of());
        Assertions.assertEquals(listingPublicId, detail.path("publicId").asText(), "Listing detail should round-trip");
    }

    private String purchaseListing(String listingPublicId) throws Exception {
        JsonNode response = postJson(MARKETPLACE_BASE + "/v1/marketplace/orders",
                state.buyerToken,
                Map.of("listingPublicId", listingPublicId),
                Map.of());
        String orderPublicId = response.path("publicId").asText();
        Assertions.assertFalse(orderPublicId.isBlank(), "Order public id should be present");
        return orderPublicId;
    }

    private void deliverOrder(String orderPublicId) throws Exception {
        postJson(MARKETPLACE_BASE + "/v1/marketplace/provider/orders/" + orderPublicId + "/deliver",
                state.sellerToken,
                Map.of(
                        "deliveryMethod", "MANUAL",
                        "deliveryReference", "ref-" + orderPublicId,
                        "providerNotes", "Delivered for demo verification"
                ),
                Map.of());
    }

    private void acceptOrder(String orderPublicId) throws Exception {
        postJson(MARKETPLACE_BASE + "/v1/marketplace/orders/" + orderPublicId + "/accept",
                state.buyerToken,
                Map.of(),
                Map.of());
    }

    private void reportProblem(String orderPublicId) throws Exception {
        postJson(MARKETPLACE_BASE + "/v1/marketplace/orders/" + orderPublicId + "/report-problem",
                state.buyerToken,
                Map.of(
                        "disputeReasonCode", "DEMO_REFUND",
                        "description", "Demo refund verification"
                ),
                Map.of());
    }

    private void verifyPositivePaymentAndWalletState(String orderPublicId) throws Exception {
        JsonNode paymentOrder = getJson(PAYMENT_BASE + "/internal/api/v1/payments/orders/" + orderPublicId,
                null,
                Map.of("X-Internal-Service-Token", INTERNAL_TOKEN));
        Assertions.assertEquals("CAPTURED", paymentOrder.path("paymentStatus").asText(), "Payment should be captured");
        Assertions.assertEquals("ELIGIBLE", paymentOrder.path("payoutEligibilityStatus").asText(),
                "Payout should be eligible after acceptance");

        JsonNode payouts = getJson(PAYMENT_BASE + "/api/v1/payments/provider/payouts?providerPublicId=" + state.providerPublicId,
                state.sellerPaymentToken,
                Map.of());
        Assertions.assertTrue(streamOf(payouts).anyMatch(node -> "PAID".equals(node.path("payoutStatus").asText())),
                "Provider payout should be paid in mock mode");

        JsonNode providerSummary = getJson(WALLET_BASE + "/v1/wallet/providers/" + state.providerPublicId + "/summary",
                state.sellerWalletToken,
                Map.of());
        Assertions.assertTrue(providerSummary.path("availableAmount").decimalValue().compareTo(BigDecimal.ZERO) > 0,
                "Provider available earnings should be projected");
        Assertions.assertTrue(providerSummary.path("paidAmount").decimalValue().compareTo(BigDecimal.ZERO) > 0,
                "Provider paid earnings should be projected");
    }

    private void verifyNegativeRefundState(String orderPublicId) throws Exception {
        JsonNode paymentOrder = getJson(PAYMENT_BASE + "/internal/api/v1/payments/orders/" + orderPublicId,
                null,
                Map.of("X-Internal-Service-Token", INTERNAL_TOKEN));
        Assertions.assertEquals("REFUNDED", paymentOrder.path("paymentStatus").asText(),
                "Refund flow should mark payment refunded");
        Assertions.assertEquals("REFUNDED", paymentOrder.path("payoutEligibilityStatus").asText(),
                "Refund flow should mark payout state refunded");

        JsonNode customerSummary = getJson(WALLET_BASE + "/v1/wallet/me/summary",
                state.buyerWalletToken,
                Map.of());
        Assertions.assertTrue(customerSummary.path("reversedAmount").decimalValue().compareTo(BigDecimal.ZERO) > 0,
                "Customer reversed amount should reflect refund");

        JsonNode customerActivity = getJson(WALLET_BASE + "/v1/wallet/me/activity",
                state.buyerWalletToken,
                Map.of());
        Assertions.assertTrue(streamOf(customerActivity).anyMatch(node -> "CUSTOMER_REFUND".equals(node.path("entryType").asText())),
                "Customer wallet activity should include refund entry");
    }

    private void applyActiveStatusAndRoles(String email, List<String> roles) throws Exception {
        try (var connection = authConnection()) {
            connection.setAutoCommit(false);
            UserRow row = loadUser(connection, email);
            if (row == null) {
                throw new IllegalStateException("Missing auth row for " + email);
            }
            try (var update = connection.prepareStatement("""
                    UPDATE app_user
                    SET status = 'ACTIVE',
                        email_verified = TRUE,
                        phone_verified = FALSE,
                        failed_login_count = 0,
                        locked_until = NULL,
                        deleted_at = NULL,
                        updated_at = NOW(6)
                    WHERE id = ?
                    """)) {
                update.setLong(1, row.id);
                update.executeUpdate();
            }
            for (String role : roles) {
                try (var insert = connection.prepareStatement("""
                        INSERT INTO user_role (user_id, role_id, assigned_at, assigned_by)
                        SELECT ?, id, NOW(6), NULL FROM app_role WHERE role_name = ?
                        ON DUPLICATE KEY UPDATE assigned_at = VALUES(assigned_at)
                        """)) {
                    insert.setLong(1, row.id);
                    insert.setString(2, role);
                    insert.executeUpdate();
                }
            }
            connection.commit();
        }
    }

    private UserRow loadUser(String email) throws Exception {
        try (var connection = authConnection()) {
            return loadUser(connection, email);
        }
    }

    private UserRow loadUser(java.sql.Connection connection, String email) throws Exception {
        try (var query = connection.prepareStatement("""
                SELECT id, public_id, email
                FROM app_user
                WHERE normalized_email = ?
                """)) {
            query.setString(1, email.trim().toLowerCase());
            try (var result = query.executeQuery()) {
                if (!result.next()) {
                    return null;
                }
                return new UserRow(result.getLong("id"), result.getString("public_id"), result.getString("email"));
            }
        }
    }

    private java.sql.Connection authConnection() throws Exception {
        Exception last = null;
        for (String url : DB_URLS) {
            try {
                java.sql.Connection connection = java.sql.DriverManager.getConnection(url, DB_USERNAME, DB_PASSWORD);
                String schema = resolveAuthSchema(connection);
                if (schema != null) {
                    String currentSchema = connection.getCatalog();
                    if (schema.equals(currentSchema)) {
                        return connection;
                    }
                    connection.close();
                    String schemaUrl = replaceDatabase(url, schema);
                    return java.sql.DriverManager.getConnection(schemaUrl, DB_USERNAME, DB_PASSWORD);
                }
                connection.close();
            } catch (Exception exception) {
                last = exception;
            }
        }
        throw new IllegalStateException("Unable to connect to auth database using known URLs", last);
    }

    private java.sql.Connection marketplaceConnection() throws Exception {
        Exception last = null;
        for (String url : MARKETPLACE_DB_URLS) {
            try {
                java.sql.Connection connection = java.sql.DriverManager.getConnection(url, MARKETPLACE_DB_USERNAME, MARKETPLACE_DB_PASSWORD);
                String schema = resolveMarketplaceSchema(connection);
                if (schema != null) {
                    String currentSchema = connection.getCatalog();
                    if (schema.equals(currentSchema)) {
                        return connection;
                    }
                    connection.close();
                    String schemaUrl = replaceDatabase(url, schema);
                    return java.sql.DriverManager.getConnection(schemaUrl, MARKETPLACE_DB_USERNAME, MARKETPLACE_DB_PASSWORD);
                }
                connection.close();
            } catch (Exception exception) {
                last = exception;
            }
        }
        throw new IllegalStateException("Unable to connect to marketplace database using known URLs", last);
    }

    private String resolveMarketplaceSchema(java.sql.Connection connection) {
        try (var statement = connection.prepareStatement("""
                SELECT table_schema
                FROM information_schema.tables
                WHERE table_name IN ('listing', 'category_master')
                GROUP BY table_schema
                HAVING COUNT(DISTINCT table_name) = 2
                LIMIT 1
                """);
             var result = statement.executeQuery()) {
            if (result.next()) {
                return result.getString("table_schema");
            }
            return null;
        } catch (Exception exception) {
            return null;
        }
    }

    private String resolveAuthSchema(java.sql.Connection connection) {
        try (var statement = connection.prepareStatement("""
                SELECT table_schema
                FROM information_schema.tables
                WHERE table_name IN ('app_user', 'app_role')
                GROUP BY table_schema
                HAVING COUNT(DISTINCT table_name) = 2
                LIMIT 1
                """);
             var result = statement.executeQuery()) {
            if (result.next()) {
                return result.getString("table_schema");
            }
            return null;
        } catch (Exception exception) {
            return null;
        }
    }

    private String replaceDatabase(String url, String database) {
        int question = url.indexOf('?');
        String prefix = question >= 0 ? url.substring(0, question) : url;
        String suffix = question >= 0 ? url.substring(question) : "";
        int lastSlash = prefix.lastIndexOf('/');
        if (lastSlash < 0) {
            return url;
        }
        return prefix.substring(0, lastSlash + 1) + database + suffix;
    }

    private JsonNode getJson(String url, String token, Map<String, String> headers) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .GET()
                .header("Accept", "application/json");
        applyHeaders(builder, token, headers);
        return sendJson(builder.build());
    }

    private JsonNode postJson(String url, String token, Object body, Map<String, String> headers) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json");
        applyHeaders(builder, token, headers);
        return sendJson(builder.build());
    }

    private JsonNode putJson(String url, String token, Object body, Map<String, String> headers) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .PUT(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(body)))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json");
        applyHeaders(builder, token, headers);
        return sendJson(builder.build());
    }

    private JsonNode sendJson(HttpRequest request) throws Exception {
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new HttpException(response.statusCode(), request.uri(), response.body());
        }
        String body = response.body();
        if (body == null || body.isBlank()) {
            return MAPPER.createObjectNode();
        }
        return MAPPER.readTree(body);
    }

    private void applyHeaders(HttpRequest.Builder builder, String token, Map<String, String> headers) {
        if (token != null && !token.isBlank()) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (headers != null) {
            headers.forEach(builder::header);
        }
    }

    private String url(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private java.util.stream.Stream<JsonNode> streamOf(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return java.util.stream.Stream.empty();
        }
        if (node.isArray()) {
            return java.util.stream.StreamSupport.stream(node.spliterator(), false);
        }
        return java.util.stream.Stream.of(node);
    }

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static void addIfPresent(List<String> values, String candidate) {
        if (candidate != null && !candidate.isBlank()) {
            values.add(candidate);
        }
    }

    private PrivateKey readPrivateKey(Path path) throws Exception {
        String pem = Files.readString(path, StandardCharsets.UTF_8);
        boolean rsaPkcs1 = pem.contains("-----BEGIN RSA PRIVATE KEY-----");
        String body = pem
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(body);
        byte[] der = rsaPkcs1 ? wrapPkcs1(decoded) : decoded;
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
    }

    private byte[] wrapPkcs1(byte[] pkcs1) {
        byte[] algorithmIdentifier = new byte[] {
                0x30, 0x0d,
                0x06, 0x09,
                0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
                0x05, 0x00
        };
        java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();
        body.write(0x02);
        body.write(0x01);
        body.write(0x00);
        body.writeBytes(algorithmIdentifier);
        body.write(0x04);
        body.writeBytes(derLength(pkcs1.length));
        body.writeBytes(pkcs1);
        byte[] bodyBytes = body.toByteArray();
        java.io.ByteArrayOutputStream sequence = new java.io.ByteArrayOutputStream();
        sequence.write(0x30);
        sequence.writeBytes(derLength(bodyBytes.length));
        sequence.writeBytes(bodyBytes);
        return sequence.toByteArray();
    }

    private byte[] derLength(int length) {
        if (length < 128) {
            return new byte[] {(byte) length};
        }
        int temp = length;
        int bytesRequired = 0;
        while (temp > 0) {
            temp >>= 8;
            bytesRequired++;
        }
        byte[] result = new byte[bytesRequired + 1];
        result[0] = (byte) (0x80 | bytesRequired);
        for (int i = bytesRequired; i > 0; i--) {
            result[i] = (byte) (length & 0xff);
            length >>= 8;
        }
        return result;
    }

    private String base64Url(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private record UserRow(long id, String publicId, String email) {
    }

    private static final class DemoState {
        private final String runId = UUID.randomUUID().toString().substring(0, 8);
        private String adminEmail;
        private String sellerEmail;
        private String buyerEmail;
        private String adminPassword;
        private String sellerPassword;
        private String buyerPassword;
        private String adminPublicId;
        private String sellerPublicId;
        private String buyerPublicId;
        private String adminToken;
        private String sellerToken;
        private String buyerToken;
        private String sellerAuthToken;
        private String buyerAuthToken;
        private String sellerPaymentToken;
        private String sellerWalletToken;
        private String buyerWalletToken;
        private String providerPublicId;
        private String positiveListingPublicId;
        private String negativeListingPublicId;
        private String positiveOrderPublicId;
        private String negativeOrderPublicId;
    }

    private static final class HttpException extends IOException {
        private final int statusCode;

        private HttpException(int statusCode, URI uri, String body) {
            super("HTTP " + statusCode + " calling " + uri + " -> " + body);
            this.statusCode = statusCode;
        }
    }
}

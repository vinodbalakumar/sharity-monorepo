package com.java.vinod.payment.service.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.payment.service.config.PayPalConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PayPalApiClient {
    private final PayPalConfig config;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private volatile String cachedAccessToken;
    private volatile long tokenExpiresAt;

    public String getAccessToken() throws PayPalException {
        if (cachedAccessToken != null && System.currentTimeMillis() < tokenExpiresAt) {
            return cachedAccessToken;
        }

        try {
            String auth = config.getClientId() + ":" + config.getClientSecret();
            String base64Auth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            String body = "grant_type=client_credentials";

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/v1/oauth2/token"))
                .header("Authorization", "Basic " + base64Auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofMillis(config.getConnectTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new PayPalException("Failed to get access token: " + response.body());
            }

            JsonNode jsonNode = objectMapper.readTree(response.body());
            cachedAccessToken = jsonNode.get("access_token").asText();
            long expiresIn = jsonNode.get("expires_in").asLong();
            tokenExpiresAt = System.currentTimeMillis() + (expiresIn * 1000) - 60000; // Refresh 1min before expiry

            log.info("PayPal access token obtained, expires in {} seconds", expiresIn);
            return cachedAccessToken;
        } catch (IOException | InterruptedException e) {
            throw new PayPalException("Failed to obtain PayPal access token", e);
        }
    }

    public JsonNode createOrder(Map<String, Object> orderData) throws PayPalException {
        try {
            String accessToken = getAccessToken();
            String body = objectMapper.writeValueAsString(orderData);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/v2/checkout/orders"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMillis(config.getReadTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("PayPal order creation failed: {}", response.body());
                throw new PayPalException("Failed to create PayPal order: " + response.body());
            }

            return objectMapper.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            throw new PayPalException("Failed to create PayPal order", e);
        }
    }

    public JsonNode captureOrder(String orderId) throws PayPalException {
        try {
            String accessToken = getAccessToken();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/v2/checkout/orders/" + orderId + "/capture"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMillis(config.getReadTimeout()))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("PayPal order capture failed: {}", response.body());
                throw new PayPalException("Failed to capture PayPal order: " + response.body());
            }

            return objectMapper.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            throw new PayPalException("Failed to capture PayPal order", e);
        }
    }

    public JsonNode refundCapture(String captureId, Map<String, Object> refundData) throws PayPalException {
        try {
            String accessToken = getAccessToken();
            String body = objectMapper.writeValueAsString(refundData);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/v2/payments/captures/" + captureId + "/refund"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMillis(config.getReadTimeout()))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("PayPal refund failed: {}", response.body());
                throw new PayPalException("Failed to refund PayPal capture: " + response.body());
            }

            return objectMapper.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            throw new PayPalException("Failed to refund PayPal capture", e);
        }
    }

    public JsonNode getOrder(String orderId) throws PayPalException {
        try {
            String accessToken = getAccessToken();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getBaseUrl() + "/v2/checkout/orders/" + orderId))
                .header("Authorization", "Bearer " + accessToken)
                .timeout(Duration.ofMillis(config.getReadTimeout()))
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new PayPalException("Failed to get PayPal order: " + response.body());
            }

            return objectMapper.readTree(response.body());
        } catch (IOException | InterruptedException e) {
            throw new PayPalException("Failed to get PayPal order", e);
        }
    }

    @Component
    public static class PayPalHttpClientProvider {
        public HttpClient httpClient() {
            return HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        }
    }
}

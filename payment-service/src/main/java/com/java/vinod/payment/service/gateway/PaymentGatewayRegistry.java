package com.java.vinod.payment.service.gateway;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.PaymentGatewayPolicy;
import com.java.vinod.payment.service.repository.PaymentGatewayPolicyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Resolves the active payment gateway adapter and the admin-selected country policy.
 *
 * <p>The registry keeps provider routing in one place so payment-service can
 * swap between mock, Stripe test mode, and PayPal mock behavior without wiring
 * the buyer checkout flow directly to a specific provider.</p>
 */
@Service
public class PaymentGatewayRegistry {
    private final Map<String, PaymentGateway> gateways;
    private final PaymentGatewayPolicyRepository policyRepository;
    private final String defaultGatewayMode;

    /**
     * Creates the registry with all known gateway adapters and the country policy store.
     */
    public PaymentGatewayRegistry(Map<String, PaymentGateway> gateways,
                                  PaymentGatewayPolicyRepository policyRepository,
                                  @Value("${app.payment.gateway-mode:mock}") String defaultGatewayMode) {
        this.gateways = gateways;
        this.policyRepository = policyRepository;
        this.defaultGatewayMode = normalizeMode(defaultGatewayMode);
    }

    /**
     * Resolves the gateway mode that should be used for a country.
     *
     * <p>If no policy exists, the service falls back to the configured default
     * mode so checkout remains stable while admins are still configuring the map.</p>
     */
    public String resolveGatewayMode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return defaultGatewayMode;
        }
        return policyRepository.findByCountryCodeIgnoreCase(countryCode.trim())
                .filter(PaymentGatewayPolicy::isActive)
                .map(PaymentGatewayPolicy::getGatewayMode)
                .map(this::normalizeMode)
                .orElse(defaultGatewayMode);
    }

    /**
     * Captures a payment using the selected gateway mode.
     */
    public String capture(String gatewayMode, String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return gateway(gatewayMode).capture(paymentOrderPublicId, amount, currencyCode);
    }

    /**
     * Releases a payout using the selected gateway mode.
     */
    public String releasePayout(String gatewayMode, String payoutPublicId, BigDecimal amount, String currencyCode) {
        return gateway(gatewayMode).releasePayout(payoutPublicId, amount, currencyCode);
    }

    /**
     * Refunds a payment using the selected gateway mode.
     */
    public String refund(String gatewayMode, String paymentOrderPublicId, BigDecimal amount, String currencyCode) {
        return gateway(gatewayMode).refund(paymentOrderPublicId, amount, currencyCode);
    }

    /**
     * Lists the gateway modes available to the admin surface.
     */
    public List<PaymentDtos.PaymentGatewayCatalogResponse> catalog() {
        return List.of(
                new PaymentDtos.PaymentGatewayCatalogResponse("mock", "Mock Gateway",
                        "Local demo gateway that always succeeds without moving real money.", gateways.containsKey("mock")),
                new PaymentDtos.PaymentGatewayCatalogResponse("stripe-test", "Stripe Test Adapter",
                        "Stripe-shaped mock adapter that returns test references without calling the real Stripe API.",
                        gateways.containsKey("stripe-test")),
                new PaymentDtos.PaymentGatewayCatalogResponse("paypal-mock", "PayPal Mock Adapter",
                        "PayPal-shaped mock adapter for future country routing and admin previews.",
                        gateways.containsKey("paypal-mock"))
        );
    }

    private PaymentGateway gateway(String gatewayMode) {
        String normalized = normalizeMode(gatewayMode);
        PaymentGateway gateway = gateways.get(normalized);
        if (gateway == null) {
            gateway = gateways.get(defaultGatewayMode);
        }
        if (gateway == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No payment gateway adapter is configured");
        }
        return gateway;
    }

    private String normalizeMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return "mock";
        }
        return mode.trim().toLowerCase(Locale.ROOT);
    }
}

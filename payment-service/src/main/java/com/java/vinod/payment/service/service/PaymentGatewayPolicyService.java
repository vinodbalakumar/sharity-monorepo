package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.PaymentGatewayPolicy;
import com.java.vinod.payment.service.gateway.PaymentGatewayRegistry;
import com.java.vinod.payment.service.repository.PaymentGatewayPolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

/**
 * Owns the super-admin payment gateway policy surface.
 *
 * <p>This service keeps country-to-gateway selection separate from checkout so
 * admins can decide whether a country should route to mock, Stripe test mode,
 * or the PayPal-style mock adapter without changing buyer payment flows.</p>
 */
@Service
public class PaymentGatewayPolicyService {
    private final PaymentGatewayPolicyRepository policyRepository;
    private final PaymentGatewayRegistry paymentGatewayRegistry;

    /**
     * Creates the policy service with the persisted country routing store.
     */
    public PaymentGatewayPolicyService(PaymentGatewayPolicyRepository policyRepository,
                                       PaymentGatewayRegistry paymentGatewayRegistry) {
        this.policyRepository = policyRepository;
        this.paymentGatewayRegistry = paymentGatewayRegistry;
    }

    /**
     * Returns the payment gateway catalog available to super admins.
     */
    @Transactional(readOnly = true)
    public java.util.List<PaymentDtos.PaymentGatewayCatalogResponse> catalog() {
        return paymentGatewayRegistry.catalog();
    }

    /**
     * Returns all configured country-level payment gateway policies.
     */
    @Transactional(readOnly = true)
    public java.util.List<PaymentDtos.PaymentGatewayPolicyResponse> policies() {
        return policyRepository.findAllByOrderByCountryCodeAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns the configured policy for a country.
     */
    @Transactional(readOnly = true)
    public PaymentDtos.PaymentGatewayPolicyResponse policy(String countryCode) {
        return policyRepository.findByCountryCodeIgnoreCase(normalizeCountryCode(countryCode))
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gateway policy not found"));
    }

    /**
     * Creates or updates the gateway policy for a country.
     */
    @Transactional
    public PaymentDtos.PaymentGatewayPolicyResponse upsert(String countryCode, PaymentDtos.PaymentGatewayPolicyRequest request) {
        String normalizedCountryCode = normalizeCountryCode(countryCode);
        if (!normalizedCountryCode.equals(normalizeCountryCode(request.countryCode()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Country code in path and body must match");
        }
        String gatewayMode = normalizeGatewayMode(request.gatewayMode());
        if (!paymentGatewayRegistry.catalog().stream().anyMatch(option -> option.gatewayMode().equalsIgnoreCase(gatewayMode))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported gateway mode");
        }
        LocalDateTime now = LocalDateTime.now();
        PaymentGatewayPolicy policy = policyRepository.findByCountryCodeIgnoreCase(normalizedCountryCode).orElseGet(() -> {
            PaymentGatewayPolicy created = new PaymentGatewayPolicy();
            created.setPublicId(UUID.randomUUID().toString());
            created.setCountryCode(normalizedCountryCode);
            created.setCreatedAt(now);
            return created;
        });
        policy.setGatewayMode(gatewayMode);
        policy.setActive(request.active());
        policy.setRecommendationNote(request.recommendationNote());
        policy.setUpdatedAt(now);
        return toResponse(policyRepository.save(policy));
    }

    /**
     * Returns the current recommendation for a country.
     */
    @Transactional(readOnly = true)
    public PaymentDtos.PaymentGatewayRecommendationResponse recommendation(String countryCode) {
        String normalizedCountryCode = normalizeCountryCode(countryCode);
        var policies = paymentGatewayRegistry.catalog();
        return policyRepository.findByCountryCodeIgnoreCase(normalizedCountryCode)
                .map(policy -> new PaymentDtos.PaymentGatewayRecommendationResponse(
                        policy.getCountryCode(),
                        policy.isActive() ? policy.getGatewayMode() : paymentGatewayRegistry.resolveGatewayMode(normalizedCountryCode),
                        policy.getRecommendationNote(),
                        true,
                        policies))
                .orElseGet(() -> new PaymentDtos.PaymentGatewayRecommendationResponse(
                        normalizedCountryCode,
                        paymentGatewayRegistry.resolveGatewayMode(normalizedCountryCode),
                        "No country policy configured yet",
                        false,
                        policies));
    }

    private PaymentDtos.PaymentGatewayPolicyResponse toResponse(PaymentGatewayPolicy policy) {
        return new PaymentDtos.PaymentGatewayPolicyResponse(policy.getPublicId(), policy.getCountryCode(),
                policy.getGatewayMode(), policy.isActive(), policy.getRecommendationNote(),
                policy.getCreatedAt(), policy.getUpdatedAt());
    }

    private String normalizeCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Country code is required");
        }
        String normalized = countryCode.trim().toUpperCase(Locale.ROOT);
        if (normalized.length() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Country code must be a 2-letter ISO code");
        }
        return normalized;
    }

    private String normalizeGatewayMode(String gatewayMode) {
        if (gatewayMode == null || gatewayMode.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gateway mode is required");
        }
        return gatewayMode.trim().toLowerCase(Locale.ROOT);
    }
}

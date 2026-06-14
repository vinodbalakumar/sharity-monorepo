package com.java.vinod.payment.service.controller;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.service.PaymentGatewayPolicyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes the super-admin payment gateway policy surface.
 *
 * <p>These endpoints keep the supported provider catalog, country routing rules,
 * and recommendation view separated from customer checkout and payout logic.</p>
 */
@RestController
@RequestMapping("/api/v1/payments/admin/gateways")
public class PaymentGatewayPolicyController {
    private final PaymentGatewayPolicyService paymentGatewayPolicyService;
    private final com.java.vinod.payment.service.service.PaymentMasterService paymentMasterService;

    /**
     * Creates the controller with the payment gateway policy service.
     */
    public PaymentGatewayPolicyController(PaymentGatewayPolicyService paymentGatewayPolicyService,
                                          com.java.vinod.payment.service.service.PaymentMasterService paymentMasterService) {
        this.paymentGatewayPolicyService = paymentGatewayPolicyService;
        this.paymentMasterService = paymentMasterService;
    }

    /**
     * Returns the supported payment gateway catalog for admins.
     */
    @GetMapping("/catalog")
    public List<PaymentDtos.PaymentGatewayCatalogResponse> catalog() {
        return paymentGatewayPolicyService.catalog();
    }

    /**
     * Returns all country-level payment gateway policies.
     */
    @GetMapping("/policies")
    public List<PaymentDtos.PaymentGatewayPolicyResponse> policies() {
        return paymentGatewayPolicyService.policies();
    }

    /**
     * Returns the configured policy for a country.
     */
    @GetMapping("/policies/{countryCode}")
    public PaymentDtos.PaymentGatewayPolicyResponse policy(@PathVariable String countryCode) {
        return paymentGatewayPolicyService.policy(countryCode);
    }

    /**
     * Creates or updates the payment gateway policy for a country.
     */
    @PutMapping("/policies/{countryCode}")
    @ResponseStatus(HttpStatus.OK)
    public PaymentDtos.PaymentGatewayPolicyResponse upsert(@PathVariable String countryCode,
                                                           @Valid @RequestBody PaymentDtos.PaymentGatewayPolicyRequest request) {
        return paymentGatewayPolicyService.upsert(countryCode, request);
    }

    /**
     * Returns the recommended gateway choice for a country.
     */
    @GetMapping("/recommendation")
    public PaymentDtos.PaymentGatewayRecommendationResponse recommendation(@RequestParam String countryCode) {
        return paymentGatewayPolicyService.recommendation(countryCode);
    }

    @GetMapping("/order-statuses")
    public List<PaymentDtos.StatusResponse> orderStatuses() {
        return paymentMasterService.orderStatuses();
    }

    @GetMapping("/payment-statuses")
    public List<PaymentDtos.StatusResponse> paymentStatuses() {
        return paymentMasterService.paymentStatuses();
    }

    @GetMapping("/payment-methods")
    public List<PaymentDtos.PaymentMethodResponse> paymentMethods() {
        return paymentMasterService.paymentMethods();
    }

    @GetMapping("/refund-reasons")
    public List<PaymentDtos.ReasonResponse> refundReasons() {
        return paymentMasterService.refundReasons();
    }

    @GetMapping("/dispute-reasons")
    public List<PaymentDtos.ReasonResponse> disputeReasons() {
        return paymentMasterService.disputeReasons();
    }
}

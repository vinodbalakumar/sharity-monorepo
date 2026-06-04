package com.java.vinod.wallet.service.controller;

import com.java.vinod.wallet.service.dto.WalletDtos;
import com.java.vinod.wallet.service.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Exposes customer, provider, admin, and internal wallet projection APIs.
 */
@RestController
public class WalletController {
    private final WalletService walletService;

    /**
     * Creates the controller with the wallet projection service.
     */
    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    /**
     * Returns the authenticated customer's wallet summary projection.
     */
    @GetMapping("/api/v1/wallet/me/summary")
    public WalletDtos.SummaryResponse mySummary(@AuthenticationPrincipal Jwt jwt) {
        return walletService.customerSummary(jwt);
    }

    /**
     * Returns the authenticated customer's wallet activity.
     */
    @GetMapping("/api/v1/wallet/me/activity")
    public List<WalletDtos.ActivityResponse> myActivity(@AuthenticationPrincipal Jwt jwt) {
        return walletService.customerActivity(jwt);
    }

    /**
     * Returns provider earning and payout summary projection.
     */
    @GetMapping("/api/v1/wallet/providers/{providerPublicId}/summary")
    public WalletDtos.SummaryResponse providerSummary(@PathVariable String providerPublicId) {
        return walletService.providerSummary(providerPublicId);
    }

    /**
     * Returns provider wallet activity.
     */
    @GetMapping("/api/v1/wallet/providers/{providerPublicId}/activity")
    public List<WalletDtos.ActivityResponse> providerActivity(@PathVariable String providerPublicId) {
        return walletService.providerActivity(providerPublicId);
    }

    /**
     * Returns provider payout-related wallet activity.
     */
    @GetMapping("/api/v1/wallet/providers/{providerPublicId}/payouts")
    public List<WalletDtos.ActivityResponse> providerPayouts(@PathVariable String providerPublicId) {
        return walletService.providerActivity(providerPublicId);
    }

    /**
     * Returns wallet account summaries for admin audit views.
     */
    @GetMapping("/api/v1/wallet/admin/accounts")
    public List<WalletDtos.SummaryResponse> adminAccounts() {
        return walletService.adminAccounts();
    }

    /**
     * Returns all wallet ledger activity for admin audit views.
     */
    @GetMapping("/api/v1/wallet/admin/activity")
    public List<WalletDtos.ActivityResponse> adminActivity() {
        return walletService.adminActivity();
    }

    /**
     * Ingests a payment captured event from payment-service.
     */
    @PostMapping("/internal/api/v1/wallet/events/payment-captured")
    public WalletDtos.MessageResponse paymentCaptured(@Valid @RequestBody WalletDtos.PaymentEventRequest request) {
        return walletService.ingest("PAYMENT_CAPTURED", request);
    }

    /**
     * Ingests a provider pending earning event from payment-service.
     */
    @PostMapping("/internal/api/v1/wallet/events/provider-pending-earning")
    public WalletDtos.MessageResponse providerPendingEarning(@Valid @RequestBody WalletDtos.PaymentEventRequest request) {
        return walletService.ingest("PROVIDER_PENDING_EARNING", request);
    }

    /**
     * Ingests a payout eligible event from payment-service.
     */
    @PostMapping("/internal/api/v1/wallet/events/payout-eligible")
    public WalletDtos.MessageResponse payoutEligible(@Valid @RequestBody WalletDtos.PaymentEventRequest request) {
        return walletService.ingest("PAYOUT_ELIGIBLE", request);
    }

    /**
     * Ingests a payout paid event from payment-service.
     */
    @PostMapping("/internal/api/v1/wallet/events/payout-paid")
    public WalletDtos.MessageResponse payoutPaid(@Valid @RequestBody WalletDtos.PaymentEventRequest request) {
        return walletService.ingest("PAYOUT_PAID", request);
    }

    /**
     * Ingests a refund completed event from payment-service.
     */
    @PostMapping("/internal/api/v1/wallet/events/refund-completed")
    public WalletDtos.MessageResponse refundCompleted(@Valid @RequestBody WalletDtos.PaymentEventRequest request) {
        return walletService.ingest("REFUND_COMPLETED", request);
    }
}

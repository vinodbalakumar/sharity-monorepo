package com.java.vinod.wallet.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Carries wallet summary, activity, and event-ingestion payloads for the
 * customer and provider ledger views.
 *
 * <p>The DTOs keep wallet projections separate from payment capture logic so
 * the platform can explain balance movements without exposing internal ledger
 * implementation details.</p>
 */
public final class WalletDtos {
    private WalletDtos() {
    }

    /**
     * Summarizes the wallet balances shown to customers and providers.
     */
    public record SummaryResponse(BigDecimal pendingAmount, BigDecimal availableAmount,
                                  BigDecimal paidAmount, BigDecimal reversedAmount, String currencyCode) {
    }

    /**
     * Describes a single wallet ledger entry in chronological activity views.
     */
    public record ActivityResponse(String publicId, String entryType, String direction,
                                   BigDecimal amount, String currencyCode, String entryStatus,
                                   String description, LocalDateTime createdAt) {
    }

    /**
     * Carries a payment event into the wallet projection pipeline.
     */
    public record PaymentEventRequest(@NotBlank String sourceEventId, @NotBlank String paymentOrderPublicId,
                                      String marketplaceOrderPublicId, String ownerPublicId,
                                      String currencyCode, BigDecimal amount) {
    }

    /**
     * Returns a concise status message for wallet operations.
     */
    public record MessageResponse(String message) {
    }

    /**
     * Returns an empty balance snapshot for callers that need a safe default.
     */
    public static SummaryResponse emptySummary() {
        return new SummaryResponse(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "USD");
    }

    /**
     * Returns an empty activity list for a wallet owner with no ledger rows.
     */
    public static List<ActivityResponse> emptyActivity() {
        return List.of();
    }

    /**
     * Builds a deterministic demo activity row for preview and documentation flows.
     */
    public static ActivityResponse demoActivity(String type) {
        return new ActivityResponse(UUID.randomUUID().toString(), type, "CREDIT", BigDecimal.ZERO, "USD",
                "POSTED", "Wallet V3 ledger projection shell", LocalDateTime.now());
    }
}

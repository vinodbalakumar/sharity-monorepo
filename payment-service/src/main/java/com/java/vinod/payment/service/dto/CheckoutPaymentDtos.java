package com.java.vinod.payment.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Internal contract for consolidated multi-seller checkout payments.
 *
 * <p>One buyer charge is captured for the whole checkout and allocated to marketplace orders in an
 * internal ledger. Allocations never trigger provider transfers.</p>
 */
public final class CheckoutPaymentDtos {
    private CheckoutPaymentDtos() {
    }

    /**
     * Creates (or idempotently replays) one consolidated buyer charge.
     *
     * <p>{@code amount} is the total customer charge, {@code platformFeeAmount} the total platform fee,
     * and {@code providerPayableAmount} the total payable to sellers after fees. Each allocation must
     * satisfy {@code amount = platformFeeAmount + providerPayableAmount} with the platform fee equal to
     * 5% of that allocation's buyer {@code amount} rounded half-up to cents. The allocation sums must
     * equal the parent totals; the parent fee is not recalculated from the aggregate amount.</p>
     */
    public record CreateCheckoutPaymentRequest(@NotBlank String checkoutPublicId,
                                               @NotBlank String customerUserPublicId,
                                               @NotBlank String currencyCode,
                                               @NotNull BigDecimal amount,
                                               @NotNull BigDecimal platformFeeAmount,
                                               @NotNull BigDecimal providerPayableAmount,
                                               @NotEmpty List<@Valid @NotNull AllocationRequest> allocations) {
    }

    /**
     * One marketplace order share of the consolidated charge.
     */
    public record AllocationRequest(@NotBlank String marketplaceOrderPublicId,
                                    @NotBlank String providerAccountPublicId,
                                    @NotBlank String providerCountryCode,
                                    @NotNull BigDecimal amount,
                                    @NotNull BigDecimal platformFeeAmount,
                                    @NotNull BigDecimal providerPayableAmount) {
    }

    /**
     * Places a ledger hold on one allocation while a dispute is reviewed.
     */
    public record AllocationDisputeRequest(@Size(max = 255) String reason) {
    }

    /**
     * Aggregate view of a consolidated checkout charge and its ledger allocations.
     */
    public record CheckoutPaymentResponse(String checkoutPublicId, String paymentOrderPublicId,
                                          String customerUserPublicId, String currencyCode,
                                          BigDecimal amount, BigDecimal platformFeeAmount,
                                          BigDecimal providerPayableAmount, String checkoutStatus,
                                          String paymentStatus, String aggregateAllocationStatus,
                                          String payoutMode, List<CheckoutAllocationResponse> allocations,
                                          LocalDateTime capturedAt, LocalDateTime createdAt,
                                          LocalDateTime updatedAt) {
    }

    /**
     * Ledger state for one marketplace order allocation.
     */
    public record CheckoutAllocationResponse(String allocationPublicId, String checkoutPublicId,
                                             String marketplaceOrderPublicId, String providerAccountPublicId,
                                             String providerCountryCode, String currencyCode,
                                             BigDecimal amount, BigDecimal platformFeeAmount,
                                             BigDecimal providerPayableAmount, String allocationStatus,
                                             String holdReason, String disputeReason,
                                             LocalDateTime eligibleAt, LocalDateTime disputedAt,
                                             LocalDateTime updatedAt) {
    }
}
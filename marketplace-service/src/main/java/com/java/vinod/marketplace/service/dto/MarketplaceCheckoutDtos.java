package com.java.vinod.marketplace.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Contracts for the consolidated physical cart checkout.
 */
public final class MarketplaceCheckoutDtos {
    public static final int MAX_CHECKOUT_LINES = 50;
    public static final int MAX_LINE_QUANTITY = 99;

    private MarketplaceCheckoutDtos() {
    }

    /**
     * Immutable snapshot of every current cart line the buyer reviewed before paying.
     */
    public record CheckoutRequest(@NotEmpty @Size(max = MAX_CHECKOUT_LINES) List<@Valid @NotNull CheckoutItemRequest> items) {
    }

    public record CheckoutItemRequest(@NotBlank @Size(max = 50) String cartItemId,
                                      @NotNull @Min(1) @Max(MAX_LINE_QUANTITY) Integer quantity,
                                      @NotNull @DecimalMin(value = "0.01") BigDecimal unitPrice,
                                      @NotBlank @Pattern(regexp = "[A-Za-z]{3}") String currencyCode) {
    }

    public record CheckoutResponse(String checkoutPublicId, String status, String currencyCode,
                                   BigDecimal itemAmount, BigDecimal platformFeeAmount,
                                   BigDecimal customerTotalAmount, BigDecimal providerAmount,
                                   List<MarketplaceDtos.OrderResponse> orders) {
    }

    public record CheckoutAttemptResponse(CheckoutResponse checkout) {
    }
}
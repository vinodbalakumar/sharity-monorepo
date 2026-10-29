package com.java.vinod.marketplace.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public class CartDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartResponse {
        private String cartId;
        private Integer totalItems;
        private Double subtotal;
        private Double discountAmount;
        private Double taxAmount;
        private Double total;
        private String currencyCode;
        private List<CartItemResponse> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartItemResponse {
        private String cartItemId;
        private String listingId;
        private String listingTitle;
        private Integer quantity;
        private Double unitPrice;
        private Double lineTotal;
        private String deliveryType;
        private String imageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddToCartRequest {
        @NotBlank(message = "Listing ID required")
        private String listingId;

        @NotNull(message = "Quantity required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateQuantityRequest {
        @NotNull(message = "Quantity required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;
    }
}

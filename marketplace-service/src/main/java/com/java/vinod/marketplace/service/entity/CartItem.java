package com.java.vinod.marketplace.service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cart_item", indexes = {
    @Index(name = "idx_cart_item_cart_id", columnList = "cart_id"),
    @Index(name = "idx_cart_item_listing_id", columnList = "listing_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cart_item_id", nullable = false, unique = true, length = 50)
    private String cartItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Column(name = "listing_id", nullable = false, length = 100)
    private String listingId;

    @Column(name = "listing_title", nullable = false, length = 500)
    private String listingTitle;

    @Column(name = "provider_id", nullable = false, length = 100)
    private String providerId;

    @Column(name = "provider_name", nullable = false, length = 255)
    private String providerName;

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "line_total", precision = 19, scale = 4)
    private BigDecimal lineTotal;

    @Column(name = "discount_per_unit", precision = 19, scale = 4)
    private BigDecimal discountPerUnit = BigDecimal.ZERO;

    @Column(name = "line_discount", precision = 19, scale = 4)
    private BigDecimal lineDiscount = BigDecimal.ZERO;

    @Column(name = "delivery_type", length = 50)
    private String deliveryType; // DIGITAL, SHIPPING_REQUIRED

    @Column(name = "vertical_code", length = 50)
    private String verticalCode;

    @Column(name = "item_status", length = 20)
    private String itemStatus = "ADDED";

    @Column(name = "added_at", nullable = false)
    private LocalDateTime addedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

package com.java.vinod.marketplace.service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cart", indexes = {
    @Index(name = "idx_cart_customer_id", columnList = "customer_id"),
    @Index(name = "idx_cart_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cart_id", nullable = false, unique = true, length = 50)
    private String cartId;

    @Column(name = "customer_id", nullable = false, length = 100)
    private String customerId;

    @Column(name = "total_items")
    private Integer totalItems = 0;

    @Column(name = "subtotal", precision = 19, scale = 4)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 19, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total", precision = 19, scale = 4)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "currency_code", length = 3)
    private String currencyCode = "USD";

    @Column(name = "cart_status", length = 20)
    private String cartStatus = "ACTIVE";

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    @Column(name = "last_modified_at", nullable = false)
    private LocalDateTime lastModifiedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastModifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastModifiedAt = LocalDateTime.now();
    }
}

package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Parent record of a consolidated physical cart checkout. Each purchased cart line becomes a child
 * {@link OrderHeader} that references this checkout; payment-service charges the parent once.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "marketplace_checkout")
public class MarketplaceCheckout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @Column(name = "customer_user_public_id", nullable = false, length = 100)
    private String customerUserPublicId;
    @Column(name = "cart_public_id", nullable = false, length = 50)
    private String cartPublicId;
    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;
    @Column(name = "request_fingerprint", nullable = false, length = 64)
    private String requestFingerprint;
    @Column(name = "checkout_status", nullable = false, length = 40)
    private String checkoutStatus;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "item_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal itemAmount;
    @Column(name = "platform_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount;
    @Column(name = "customer_total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal customerTotalAmount;
    @Column(name = "provider_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal providerAmount;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
package com.java.vinod.payment.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "provider_payout")
public class ProviderPayout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_order_id", nullable = false, unique = true)
    private PaymentOrder paymentOrder;
    @Column(name = "provider_account_public_id", nullable = false, length = 36)
    private String providerAccountPublicId;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "payout_status", nullable = false, length = 40)
    private String payoutStatus;
    @Column(name = "payout_hold_reason")
    private String payoutHoldReason;
    @Column(name = "payment_provider", length = 50)
    private String paymentProvider;
    @Column(name = "provider_payout_reference")
    private String providerPayoutReference;
    @Column(name = "eligible_at")
    private LocalDateTime eligibleAt;
    @Column(name = "release_requested_at")
    private LocalDateTime releaseRequestedAt;
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

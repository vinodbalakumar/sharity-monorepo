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

/**
 * Parent ledger record for one consolidated buyer charge that spans multiple marketplace orders.
 *
 * <p>The identity, amounts, gateway idempotency key, and request fingerprint are immutable once
 * reserved so retries can be validated and replayed without a second buyer charge.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "checkout_payment")
public class CheckoutPayment {
    public static final String STATUS_CAPTURE_PENDING = "CAPTURE_PENDING";
    public static final String STATUS_CAPTURED = "CAPTURED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false, length = 36)
    private String publicId;
    @Column(name = "checkout_public_id", nullable = false, unique = true, updatable = false, length = 36)
    private String checkoutPublicId;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_order_id", nullable = false, unique = true, updatable = false)
    private PaymentOrder paymentOrder;
    @Column(name = "customer_user_public_id", nullable = false, updatable = false, length = 36)
    private String customerUserPublicId;
    @Column(name = "currency_code", nullable = false, updatable = false, length = 3)
    private String currencyCode;
    @Column(name = "customer_charge_amount", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal customerChargeAmount;
    @Column(name = "platform_fee_amount", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount;
    @Column(name = "provider_payable_amount", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal providerPayableAmount;
    @Column(name = "allocation_count", nullable = false, updatable = false)
    private Integer allocationCount;
    @Column(name = "gateway_mode", nullable = false, updatable = false, length = 50)
    private String gatewayMode;
    @Column(name = "gateway_idempotency_key", nullable = false, unique = true, updatable = false, length = 36)
    private String gatewayIdempotencyKey;
    @Column(name = "request_fingerprint", nullable = false, updatable = false, length = 64)
    private String requestFingerprint;
    @Column(name = "checkout_status", nullable = false, length = 40)
    private String checkoutStatus;
    @Column(name = "provider_payment_reference")
    private String providerPaymentReference;
    @Column(name = "captured_at")
    private LocalDateTime capturedAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

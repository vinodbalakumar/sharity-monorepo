package com.java.vinod.payment.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Internal ledger allocation of a consolidated checkout charge to one marketplace order and seller.
 *
 * <p>Allocations never trigger provider transfers; their status only records ledger eligibility or holds.
 * The marketplace order identity is globally unique so a child order can belong to exactly one checkout.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "checkout_payment_allocation", uniqueConstraints =
        @UniqueConstraint(name = "uk_checkout_allocation_line", columnNames = {"checkout_payment_id", "line_number"}))
public class CheckoutPaymentAllocation {
    public static final String STATUS_PENDING_CAPTURE = "PENDING_CAPTURE";
    public static final String STATUS_HELD = "HELD";
    public static final String STATUS_ELIGIBLE_LEDGER_ONLY = "ELIGIBLE_LEDGER_ONLY";
    public static final String STATUS_DISPUTE_HOLD = "DISPUTE_HOLD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, updatable = false, length = 36)
    private String publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "checkout_payment_id", nullable = false, updatable = false)
    private CheckoutPayment checkoutPayment;
    @Column(name = "line_number", nullable = false, updatable = false)
    private Integer lineNumber;
    @Column(name = "marketplace_order_public_id", nullable = false, unique = true, updatable = false, length = 36)
    private String marketplaceOrderPublicId;
    @Column(name = "provider_account_public_id", nullable = false, updatable = false, length = 36)
    private String providerAccountPublicId;
    @Column(name = "provider_country_code", nullable = false, updatable = false, length = 2)
    private String providerCountryCode;
    @Column(name = "currency_code", nullable = false, updatable = false, length = 3)
    private String currencyCode;
    @Column(name = "customer_charge_amount", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal customerChargeAmount;
    @Column(name = "platform_fee_amount", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount;
    @Column(name = "provider_payable_amount", nullable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal providerPayableAmount;
    @Column(name = "allocation_status", nullable = false, length = 40)
    private String allocationStatus;
    @Column(name = "hold_reason")
    private String holdReason;
    @Column(name = "dispute_reason")
    private String disputeReason;
    @Column(name = "eligible_at")
    private LocalDateTime eligibleAt;
    @Column(name = "disputed_at")
    private LocalDateTime disputedAt;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

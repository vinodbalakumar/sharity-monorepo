package com.java.vinod.payment.service.entity;

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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "payment_order")
public class PaymentOrder {
    public static final String ORDER_KIND_SINGLE_LISTING = "SINGLE_LISTING";
    public static final String ORDER_KIND_CONSOLIDATED_CHECKOUT = "CONSOLIDATED_CHECKOUT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @Column(name = "marketplace_order_public_id", nullable = false, unique = true, length = 36)
    private String marketplaceOrderPublicId;
    @Column(name = "customer_user_public_id", nullable = false, length = 36)
    private String customerUserPublicId;
    @Column(name = "provider_account_public_id", nullable = false, length = 36)
    private String providerAccountPublicId;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "customer_charge_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal customerChargeAmount;
    @Column(name = "platform_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount;
    @Column(name = "provider_payable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal providerPayableAmount;
    @Column(name = "payment_provider", nullable = false, length = 50)
    private String paymentProvider;
    @Column(name = "provider_payment_reference")
    private String providerPaymentReference;
    @Column(name = "payment_status", nullable = false, length = 40)
    private String paymentStatus;
    @Column(name = "payout_eligibility_status", nullable = false, length = 40)
    private String payoutEligibilityStatus;
    @Column(name = "order_kind", nullable = false, length = 40)
    private String orderKind = ORDER_KIND_SINGLE_LISTING;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Returns true when this order is the parent charge of a consolidated multi-seller checkout.
     */
    public boolean isConsolidatedCheckout() {
        return ORDER_KIND_CONSOLIDATED_CHECKOUT.equals(orderKind);
    }
}

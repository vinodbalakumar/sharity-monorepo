package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "order_header")
public class OrderHeader {
    @Column(name = "purchase_request_key", unique = true, length = 120)
    private String purchaseRequestKey;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;
    @Column(name = "customer_user_public_id", nullable = false, length = 36)
    private String customerUserPublicId;
    @Column(name = "provider_account_public_id", nullable = false, length = 36)
    private String providerAccountPublicId;
    @Column(name = "provider_owner_user_public_id", nullable = false, length = 36)
    private String providerOwnerUserPublicId;
    @Column(name = "customer_country_code", length = 3)
    private String customerCountryCode;
    @Column(name = "provider_country_code", length = 3)
    private String providerCountryCode;
    @Column(name = "transaction_currency_code", nullable = false, length = 3)
    private String transactionCurrencyCode;
    @Column(name = "item_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal itemAmount;
    @Column(name = "platform_fee_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal platformFeeAmount;
    @Column(name = "customer_total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal customerTotalAmount;
    @Column(name = "provider_expected_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal providerExpectedAmount;
    @Column(name = "order_status", nullable = false, length = 40)
    private String orderStatus;
    @Column(name = "payment_status", nullable = false, length = 40)
    private String paymentStatus;
    @Column(name = "fulfillment_status", nullable = false, length = 40)
    private String fulfillmentStatus;
    @Column(name = "payout_status", nullable = false, length = 40)
    private String payoutStatus;
    @Column(name = "purchased_at")
    private LocalDateTime purchasedAt;
    @Column(name = "provider_delivered_at")
    private LocalDateTime providerDeliveredAt;
    @Column(name = "customer_accepted_at")
    private LocalDateTime customerAcceptedAt;
    @Column(name = "dispute_opened_at")
    private LocalDateTime disputeOpenedAt;
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    /** Parent consolidated checkout; null for legacy single-item orders. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkout_id")
    private MarketplaceCheckout checkout;
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 1;
    @Column(name = "unit_price_amount", precision = 12, scale = 2)
    private BigDecimal unitPriceAmount;
    @Column(name = "cart_item_public_id", length = 50)
    private String cartItemPublicId;

    public boolean isConsolidatedCheckoutChild() {
        return checkout != null;
    }
}

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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "listing")
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @Column(name = "provider_account_public_id", nullable = false, length = 36)
    private String providerAccountPublicId;
    @Column(name = "created_by_user_public_id", nullable = false, length = 36)
    private String createdByUserPublicId;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "category_code", length = 50)
    private String categoryCode;
    @Column(name = "vertical_code", nullable = false, length = 50)
    private String verticalCode;
    @Column(name = "product_type", nullable = false, length = 50)
    private String productType;
    @Column(name = "delivery_type", nullable = false, length = 30)
    private String deliveryType;
    @Column(name = "fulfillment_scope", length = 20)
    private String fulfillmentScope;
    @Column(name = "provider_country_code", length = 3)
    private String providerCountryCode;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "price_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAmount;
    @Column(name = "original_price_amount", precision = 12, scale = 2)
    private BigDecimal originalPriceAmount;
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    @Column(name = "condition_label", length = 30)
    private String conditionLabel;
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 1;
    @Column(name = "seller_display_name", length = 150)
    private String sellerDisplayName;
    @Column(name = "featured", nullable = false)
    private boolean featured;
    @Column(name = "verified_seller", nullable = false)
    private boolean verifiedSeller;
    @Column(name = "source_type", length = 30)
    private String sourceType;
    @Column(name = "source_name", length = 150)
    private String sourceName;
    @Column(name = "source_url", length = 500)
    private String sourceUrl;
    @Column(name = "license_note", length = 255)
    private String licenseNote;
    @Column(name = "demo_seed", nullable = false)
    private boolean demoSeed;
    @Column(name = "listing_status", nullable = false, length = 30)
    private String listingStatus;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

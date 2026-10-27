package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_profile", indexes = {
    @Index(name = "idx_seller_rating", columnList = "seller_rating DESC"),
    @Index(name = "idx_completed_orders", columnList = "completed_orders DESC"),
    @Index(name = "idx_verification_status", columnList = "verification_status")
})
public class SellerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "seller_id")
    private Integer sellerId;

    @Column(name = "provider_account_public_id", unique = true, nullable = false, length = 255)
    private String providerAccountPublicId;

    @Column(name = "seller_name", nullable = false, length = 255)
    private String sellerName;

    @Column(name = "seller_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal sellerRating;

    @Column(name = "completed_orders", nullable = false)
    private Integer completedOrders = 0;

    @Column(name = "total_reviews", nullable = false)
    private Integer totalReviews = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.VERIFIED;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP(6)")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP(6)")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum VerificationStatus {
        UNVERIFIED,
        VERIFIED,
        PREMIUM
    }

    // Getters and Setters
    public Integer getSellerId() {
        return sellerId;
    }

    public void setSellerId(Integer sellerId) {
        this.sellerId = sellerId;
    }

    public String getProviderAccountPublicId() {
        return providerAccountPublicId;
    }

    public void setProviderAccountPublicId(String providerAccountPublicId) {
        this.providerAccountPublicId = providerAccountPublicId;
    }

    public String getSellerName() {
        return sellerName;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }

    public BigDecimal getSellerRating() {
        return sellerRating;
    }

    public void setSellerRating(BigDecimal sellerRating) {
        this.sellerRating = sellerRating;
    }

    public Integer getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(Integer completedOrders) {
        this.completedOrders = completedOrders;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

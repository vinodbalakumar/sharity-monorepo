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

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "marketplace_category")
public class MarketplaceCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "category_code", nullable = false, unique = true, length = 50)
    private String categoryCode;
    @Column(name = "category_name", nullable = false, length = 120)
    private String categoryName;
    @Column(name = "category_slug", nullable = false, unique = true, length = 120)
    private String categorySlug;
    @Column(name = "vertical_code", nullable = false, length = 50)
    private String verticalCode;
    @Column(name = "country_code", length = 3)
    private String countryCode;
    @Column(name = "icon_ref", length = 255)
    private String iconRef;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

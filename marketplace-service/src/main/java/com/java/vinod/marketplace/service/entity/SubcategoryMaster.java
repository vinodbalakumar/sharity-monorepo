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
@Table(name = "subcategory_master")
public class SubcategoryMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subcategory_code", nullable = false, unique = true, length = 50)
    private String subcategoryCode;

    @Column(name = "category_code", nullable = false, length = 50)
    private String categoryCode;

    @Column(name = "subcategory_name", nullable = false, length = 120)
    private String subcategoryName;

    @Column(name = "subcategory_slug", nullable = false, unique = true, length = 120)
    private String subcategorySlug;

    @Column(name = "icon_ref", length = 255)
    private String iconRef;

    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

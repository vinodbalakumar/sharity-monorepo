package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "product_type_master")
public class ProductTypeMaster {
    @Id
    @Column(name = "product_type_code", nullable = false, length = 50)
    private String productTypeCode;

    @Column(name = "display_label", nullable = false, length = 120)
    private String displayLabel;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

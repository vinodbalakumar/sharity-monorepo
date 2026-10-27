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
@Table(name = "listing_condition_master")
public class ListingConditionMaster {
    @Id
    @Column(name = "condition_code", nullable = false, length = 50)
    private String conditionCode;

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

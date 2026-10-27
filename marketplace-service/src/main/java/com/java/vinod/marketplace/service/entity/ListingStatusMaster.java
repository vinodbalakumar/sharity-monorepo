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
@Table(name = "listing_status_master")
public class ListingStatusMaster {
    @Id
    @Column(name = "status_code", nullable = false, length = 50)
    private String statusCode;

    @Column(name = "display_label", nullable = false, length = 120)
    private String displayLabel;

    @Column(name = "customer_visible", nullable = false)
    private boolean customerVisible;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

package com.java.vinod.marketplace.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "fee_type_master")
public class FeeTypeMaster {
    @Id
    @Column(name = "fee_type_code", nullable = false, length = 50)
    private String feeTypeCode;

    @Column(name = "display_label", nullable = false, length = 120)
    private String displayLabel;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "fee_basis", nullable = false, length = 50)
    private String feeBasis;

    @Column(name = "rate_percentage", precision = 5, scale = 2)
    private BigDecimal ratePercentage;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

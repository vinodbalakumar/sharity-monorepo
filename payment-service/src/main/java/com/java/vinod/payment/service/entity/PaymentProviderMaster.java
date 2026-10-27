package com.java.vinod.payment.service.entity;

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
@Table(name = "payment_provider_master")
public class PaymentProviderMaster {
    @Id
    @Column(name = "provider_code", nullable = false, length = 50)
    private String providerCode;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "gateway_mode", nullable = false, length = 50)
    private String gatewayMode;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

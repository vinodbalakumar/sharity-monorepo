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
@Table(name = "currency_master")
public class CurrencyMaster {
    @Id
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "currency_name", nullable = false, length = 120)
    private String currencyName;

    @Column(name = "currency_symbol", nullable = false, length = 10)
    private String currencySymbol;

    @Column(name = "usd_exchange_rate", nullable = false, precision = 18, scale = 8)
    private BigDecimal usdExchangeRate;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

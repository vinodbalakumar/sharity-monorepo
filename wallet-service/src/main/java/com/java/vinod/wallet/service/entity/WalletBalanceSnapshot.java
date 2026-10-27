package com.java.vinod.wallet.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
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
@Table(name = "wallet_balance_snapshot")
public class WalletBalanceSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wallet_account_id", nullable = false, unique = true)
    private WalletAccount walletAccount;
    @Column(name = "pending_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal pendingAmount;
    @Column(name = "available_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal availableAmount;
    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal paidAmount;
    @Column(name = "reversed_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal reversedAmount;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "calculated_at", nullable = false)
    private LocalDateTime calculatedAt;
}

package com.java.vinod.wallet.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "wallet_ledger_entry")
public class WalletLedgerEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wallet_account_id", nullable = false)
    private WalletAccount walletAccount;
    @Column(name = "source_service", nullable = false, length = 40)
    private String sourceService;
    @Column(name = "source_event_id", nullable = false, length = 100)
    private String sourceEventId;
    @Column(name = "marketplace_order_public_id", length = 36)
    private String marketplaceOrderPublicId;
    @Column(name = "payment_order_public_id", length = 36)
    private String paymentOrderPublicId;
    @Column(name = "entry_type", nullable = false, length = 40)
    private String entryType;
    @Column(nullable = false, length = 10)
    private String direction;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "entry_status", nullable = false, length = 30)
    private String entryStatus;
    @Column(length = 255)
    private String description;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

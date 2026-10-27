package com.java.vinod.wallet.service.entity;

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
@Table(name = "wallet_transaction_type_master")
public class WalletTransactionTypeMaster {
    @Id
    @Column(name = "source_event_type", nullable = false, length = 80)
    private String sourceEventType;

    @Column(name = "owner_type", nullable = false, length = 50)
    private String ownerType;

    @Column(name = "entry_type", nullable = false, length = 80)
    private String entryType;

    @Column(name = "direction", nullable = false, length = 20)
    private String direction;

    @Column(name = "balance_bucket", nullable = false, length = 30)
    private String balanceBucket;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

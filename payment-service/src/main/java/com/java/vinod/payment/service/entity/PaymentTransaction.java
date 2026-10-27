package com.java.vinod.payment.service.entity;

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
@Table(name = "payment_transaction")
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_order_id", nullable = false)
    private PaymentOrder paymentOrder;
    @Column(name = "transaction_type", nullable = false, length = 40)
    private String transactionType;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;
    @Column(name = "provider_transaction_reference")
    private String providerTransactionReference;
    @Column(name = "transaction_status", nullable = false, length = 40)
    private String transactionStatus;
    @Column(name = "failure_code", length = 100)
    private String failureCode;
    @Column(name = "failure_message")
    private String failureMessage;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

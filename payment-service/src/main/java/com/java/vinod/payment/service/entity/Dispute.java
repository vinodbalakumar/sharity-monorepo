package com.java.vinod.payment.service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dispute", indexes = {
    @Index(name = "idx_dispute_customer_id", columnList = "customer_id"),
    @Index(name = "idx_dispute_order_id", columnList = "order_id"),
    @Index(name = "idx_dispute_status", columnList = "dispute_status"),
    @Index(name = "idx_dispute_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dispute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dispute_id", nullable = false, unique = true, length = 50)
    private String disputeId;

    @Column(name = "customer_id", nullable = false, length = 100)
    private String customerId;

    @Column(name = "order_id", nullable = false, length = 100)
    private String orderId;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

    @Column(name = "dispute_reason", nullable = false, length = 500)
    private String disputeReason;

    @Column(name = "dispute_description", columnDefinition = "TEXT")
    private String disputeDescription;

    @Column(name = "dispute_status", length = 50)
    private String disputeStatus = "OPENED"; // OPENED, EVIDENCE_SUBMITTED, EVIDENCE_UNDER_REVIEW, RESOLVED, CLOSED

    @Column(name = "resolution_status", length = 50)
    private String resolutionStatus; // WON, LOST, SETTLED

    @Column(name = "claimed_amount", precision = 19, scale = 4)
    private BigDecimal claimedAmount;

    @Column(name = "refunded_amount", precision = 19, scale = 4)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    @Column(name = "currency_code", length = 3)
    private String currencyCode = "USD";

    @Column(name = "merchant_id", length = 100)
    private String merchantId;

    @Column(name = "evidence_count")
    private Integer evidenceCount = 0;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "sla_deadline")
    private LocalDateTime slaDeadline; // 14 days from creation

    @Column(name = "sla_status", length = 50)
    private String slaStatus = "OPEN"; // OPEN, WARNING (3 days left), BREACHED

    @Column(name = "escalated", nullable = false)
    private Boolean escalated = false; // Auto-escalate if SLA breached

    @Column(name = "escalated_at")
    private LocalDateTime escalatedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DisputeEvidence> evidenceItems = new ArrayList<>();

    @OneToMany(mappedBy = "dispute", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DisputeEvent> timeline = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

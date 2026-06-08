package com.java.vinod.payment.service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_event", indexes = {
    @Index(name = "idx_event_dispute_id", columnList = "dispute_id"),
    @Index(name = "idx_event_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", unique = true, length = 50)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType; // OPENED, EVIDENCE_ADDED, STATUS_CHANGED, RESOLVED, REFUNDED, CLOSED

    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    @Column(name = "actor", length = 100)
    private String actor; // SYSTEM, CUSTOMER, MERCHANT, ADMIN

    @Column(name = "visibility", length = 50)
    private String visibility = "BOTH"; // CUSTOMER, MERCHANT, ADMIN_ONLY, BOTH

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

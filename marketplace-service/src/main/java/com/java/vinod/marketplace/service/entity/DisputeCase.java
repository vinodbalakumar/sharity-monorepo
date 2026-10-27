package com.java.vinod.marketplace.service.entity;

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

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dispute_case")
public class DisputeCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private OrderHeader order;
    @Column(name = "opened_by_user_public_id", nullable = false, length = 36)
    private String openedByUserPublicId;
    @Column(name = "dispute_reason_code", nullable = false, length = 50)
    private String disputeReasonCode;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "dispute_status", nullable = false, length = 40)
    private String disputeStatus;
    @Column(length = 40)
    private String resolution;
    @Column(name = "resolved_by_user_public_id", length = 36)
    private String resolvedByUserPublicId;
    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}

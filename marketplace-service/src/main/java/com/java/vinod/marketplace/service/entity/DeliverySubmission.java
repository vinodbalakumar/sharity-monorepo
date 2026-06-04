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
@Table(name = "delivery_submission")
public class DeliverySubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private OrderHeader order;
    @Column(name = "submitted_by_user_public_id", nullable = false, length = 36)
    private String submittedByUserPublicId;
    @Column(name = "delivery_method", nullable = false, length = 30)
    private String deliveryMethod;
    @Column(name = "delivery_reference", columnDefinition = "TEXT")
    private String deliveryReference;
    @Column(name = "provider_notes", columnDefinition = "TEXT")
    private String providerNotes;
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
}

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
@Table(name = "customer_acceptance")
public class CustomerAcceptance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private OrderHeader order;
    @Column(name = "customer_user_public_id", nullable = false, length = 36)
    private String customerUserPublicId;
    @Column(name = "acceptance_status", nullable = false, length = 30)
    private String acceptanceStatus;
    @Column(name = "customer_notes", columnDefinition = "TEXT")
    private String customerNotes;
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}

package com.java.vinod.payment.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Stores the country-level payment gateway preference used by the admin surface.
 *
 * <p>This table lets super admins choose which gateway mode should be used for
 * a specific country without changing the buyer checkout flow or exposing any
 * provider secret data.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "payment_gateway_policy")
public class PaymentGatewayPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @Column(name = "country_code", nullable = false, unique = true, length = 2)
    private String countryCode;

    @Column(name = "gateway_mode", nullable = false, length = 50)
    private String gatewayMode;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "recommendation_note", length = 255)
    private String recommendationNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

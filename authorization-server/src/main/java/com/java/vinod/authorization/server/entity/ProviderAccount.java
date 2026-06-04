package com.java.vinod.authorization.server.entity;

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

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "provider_account")
public class ProviderAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private AppUser ownerUser;

    @Column(name = "provider_type", nullable = false, length = 40)
    private String providerType;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(name = "country_code", nullable = false, length = 3)
    private String countryCode;

    @Column(name = "default_currency_code", nullable = false, length = 3)
    private String defaultCurrencyCode;

    @Column(name = "verification_status", nullable = false, length = 40)
    private String verificationStatus;

    @Column(name = "overall_status", nullable = false, length = 30)
    private String overallStatus;

    @Column(name = "payment_provider", length = 50)
    private String paymentProvider;

    @Column(name = "payment_provider_account_ref", length = 255)
    private String paymentProviderAccountRef;

    @Column(name = "payouts_enabled", nullable = false)
    private boolean payoutsEnabled;

    @Column(name = "charges_enabled", nullable = false)
    private boolean chargesEnabled;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

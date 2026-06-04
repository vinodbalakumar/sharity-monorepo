package com.java.vinod.authorization.server.entity;

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

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "supported_country")
public class SupportedCountry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "country_code", nullable = false, unique = true, length = 3)
    private String countryCode;

    @Column(name = "country_name", nullable = false, length = 100)
    private String countryName;

    @Column(name = "default_currency_code", nullable = false, length = 3)
    private String defaultCurrencyCode;

    @Column(name = "registration_enabled", nullable = false)
    private boolean registrationEnabled;

    @Column(name = "purchasing_enabled", nullable = false)
    private boolean purchasingEnabled;

    @Column(name = "provider_onboarding_enabled", nullable = false)
    private boolean providerOnboardingEnabled;

    @Column(name = "payout_enabled", nullable = false)
    private boolean payoutEnabled;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

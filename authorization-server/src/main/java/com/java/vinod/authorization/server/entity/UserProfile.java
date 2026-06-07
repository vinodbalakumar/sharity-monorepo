package com.java.vinod.authorization.server.entity;

import com.java.vinod.authorization.server.enums.Gender;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_profile")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "country_code", length = 3)
    private String countryCode;

    @Column(name = "country_name", length = 100)
    private String countryName;

    @Column(name = "phone_dial_code", length = 10)
    private String phoneDialCode;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private Gender gender;

    @Column(name = "preferred_currency", length = 3)
    private String preferredCurrency;

    @Column(name = "preferred_timezone", length = 100)
    private String preferredTimezone;

    @Column(name = "privacy_setting", length = 40)
    private String privacySetting;

    @Column(length = 20)
    private String locale;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

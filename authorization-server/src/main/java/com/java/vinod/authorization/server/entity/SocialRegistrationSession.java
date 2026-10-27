package com.java.vinod.authorization.server.entity;

import com.java.vinod.authorization.server.enums.LoginProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "social_registration_session")
public class SocialRegistrationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "state_hash", nullable = false, unique = true, length = 64)
    private String stateHash;

    @Column(name = "completion_token_hash", unique = true, length = 64)
    private String completionTokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LoginProvider provider;

    @Column(nullable = false, length = 30)
    private String flow;

    @Column(name = "link_user_id")
    private Long linkUserId;

    @Column(name = "provider_subject", length = 255)
    private String providerSubject;

    @Column(name = "provider_email")
    private String providerEmail;

    @Column(name = "provider_email_verified")
    private Boolean providerEmailVerified;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "display_name", length = 200)
    private String displayName;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;
}

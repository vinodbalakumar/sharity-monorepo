package com.java.vinod.authorization.server.entity;

import com.java.vinod.authorization.server.enums.LoginProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "social_oauth_provider_config")
public class SocialOAuthProviderConfig {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LoginProvider provider;

    @Column(name = "client_id", nullable = false)
    private String clientId;

    @Column(name = "client_secret_env_var", nullable = false, length = 100)
    private String clientSecretEnvVar;

    @Column(name = "authorization_uri", nullable = false, length = 500)
    private String authorizationUri;

    @Column(name = "token_uri", nullable = false, length = 500)
    private String tokenUri;

    @Column(name = "jwk_set_uri", nullable = false, length = 500)
    private String jwkSetUri;

    @Column(name = "redirect_uri", nullable = false, length = 500)
    private String redirectUri;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

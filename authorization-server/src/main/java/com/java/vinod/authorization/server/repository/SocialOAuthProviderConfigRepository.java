package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.SocialOAuthProviderConfig;
import com.java.vinod.authorization.server.enums.LoginProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocialOAuthProviderConfigRepository extends JpaRepository<SocialOAuthProviderConfig, LoginProvider> {
    Optional<SocialOAuthProviderConfig> findByProviderAndEnabledTrue(LoginProvider provider);
}

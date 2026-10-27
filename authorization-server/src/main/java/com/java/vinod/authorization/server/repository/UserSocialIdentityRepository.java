package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserSocialIdentity;
import com.java.vinod.authorization.server.enums.LoginProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSocialIdentityRepository extends JpaRepository<UserSocialIdentity, Long> {
    Optional<UserSocialIdentity> findByProviderAndProviderSubjectAndEnabledTrue(LoginProvider provider, String providerSubject);

    Optional<UserSocialIdentity> findByUser_IdAndProviderAndEnabledTrue(Long userId, LoginProvider provider);

    boolean existsByUser_IdAndProviderAndEnabledTrue(Long userId, LoginProvider provider);

    long countByUser_IdAndEnabledTrue(Long userId);

    List<UserSocialIdentity> findByUser_IdAndEnabledTrue(Long userId);
}

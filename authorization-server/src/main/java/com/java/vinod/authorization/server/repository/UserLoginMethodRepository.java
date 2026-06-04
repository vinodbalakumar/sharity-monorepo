package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserLoginMethod;
import com.java.vinod.authorization.server.enums.LoginProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserLoginMethodRepository extends JpaRepository<UserLoginMethod, Long> {
    Optional<UserLoginMethod> findByProviderAndProviderSubject(LoginProvider provider, String providerSubject);

    boolean existsByUser_IdAndProviderAndEnabledTrue(Long userId, LoginProvider provider);
}

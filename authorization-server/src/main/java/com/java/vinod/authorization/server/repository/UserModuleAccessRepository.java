package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserModuleAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserModuleAccessRepository extends JpaRepository<UserModuleAccess, Long> {
    List<UserModuleAccess> findByUser_IdAndAccessStatusAndRevokedAtIsNull(Long userId, String accessStatus);

    Optional<UserModuleAccess> findByUser_IdAndModule_IdAndProviderAccount_IdAndAccessTypeAndRevokedAtIsNull(
            Long userId, Long moduleId, Long providerAccountId, String accessType);
}

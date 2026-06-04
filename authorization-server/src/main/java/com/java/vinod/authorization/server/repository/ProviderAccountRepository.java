package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.ProviderAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderAccountRepository extends JpaRepository<ProviderAccount, Long> {
    Optional<ProviderAccount> findByPublicId(String publicId);

    List<ProviderAccount> findByOwnerUser_IdOrderByCreatedAtDesc(Long ownerUserId);

    List<ProviderAccount> findByOverallStatusOrderByCreatedAtAsc(String overallStatus);
}

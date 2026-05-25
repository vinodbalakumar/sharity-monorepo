package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByPublicId(String publicId);

    Optional<AppUser> findByNormalizedEmail(String normalizedEmail);

    Optional<AppUser> findByNormalizedUsername(String normalizedUsername);

    List<AppUser> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<AppUser> findByStatusAndEmailVerifiedFalseAndCreatedAtBefore(UserStatus status, LocalDateTime createdBefore);
}

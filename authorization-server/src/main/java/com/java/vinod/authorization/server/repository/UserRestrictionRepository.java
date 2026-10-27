package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.UserRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRestrictionRepository extends JpaRepository<UserRestriction, Long> {
    Optional<UserRestriction> findByPublicId(String publicId);

    List<UserRestriction> findByUser_PublicIdAndRevokedAtIsNull(String userPublicId);

    List<UserRestriction> findByUser_IdAndRevokedAtIsNull(Long userId);

    boolean existsByUser_IdAndRevokedAtIsNullAndRestrictionTypeInAndExpiresAtAfter(
            Long userId, List<String> restrictionTypes, LocalDateTime now);

    boolean existsByUser_IdAndRevokedAtIsNullAndRestrictionTypeInAndExpiresAtIsNull(
            Long userId, List<String> restrictionTypes);
}

package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUser_IdAndRevokedAtIsNull(Long userId);

    List<RefreshToken> findByTokenFamilyIdAndRevokedAtIsNull(String tokenFamilyId);

    Optional<RefreshToken> findByIdAndUser_Id(Long id, Long userId);
}

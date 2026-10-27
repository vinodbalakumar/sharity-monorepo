package com.java.vinod.authorization.server.repository;

import com.java.vinod.authorization.server.entity.SocialRegistrationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocialRegistrationSessionRepository extends JpaRepository<SocialRegistrationSession, Long> {
    Optional<SocialRegistrationSession> findByStateHash(String stateHash);

    Optional<SocialRegistrationSession> findByCompletionTokenHash(String completionTokenHash);
}

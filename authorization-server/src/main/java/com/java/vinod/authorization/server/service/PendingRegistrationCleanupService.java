package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PendingRegistrationCleanupService {
    private static final Logger log = LoggerFactory.getLogger(PendingRegistrationCleanupService.class);

    private final AppUserRepository appUserRepository;
    private final JdbcTemplate jdbcTemplate;
    private final boolean enabled;
    private final Duration pendingRetention;

    public PendingRegistrationCleanupService(AppUserRepository appUserRepository,
                                             JdbcTemplate jdbcTemplate,
                                             @Value("${app.registration-cleanup.enabled:true}") boolean enabled,
                                             @Value("${app.registration-cleanup.pending-retention:P1D}") Duration pendingRetention) {
        this.appUserRepository = appUserRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.enabled = enabled;
        this.pendingRetention = pendingRetention;
    }

    @Scheduled(
            initialDelayString = "${app.registration-cleanup.initial-delay-ms:300000}",
            fixedDelayString = "${app.registration-cleanup.fixed-delay-ms:3600000}"
    )
    @Transactional
    public void cleanupExpiredPendingRegistrations() {
        if (!enabled) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minus(pendingRetention);
        List<AppUser> expiredUsers = appUserRepository.findByStatusAndEmailVerifiedFalseAndCreatedAtBefore(
                UserStatus.PENDING_VERIFICATION,
                cutoff
        );

        expiredUsers.forEach(this::deletePendingRegistration);
        if (!expiredUsers.isEmpty()) {
            log.info("Deleted expired pending registrations. count={}, retention={}", expiredUsers.size(), pendingRetention);
        }
    }

    private void deletePendingRegistration(AppUser user) {
        Long userId = user.getId();
        jdbcTemplate.update("UPDATE email_delivery_log SET user_id = NULL WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM refresh_token WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM email_verification_token WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM password_reset_token WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM login_attempt WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM audit_log WHERE actor_user_id = ? OR target_user_id = ?", userId, userId);
        jdbcTemplate.update("DELETE FROM user_application_access WHERE user_id = ? OR assigned_by = ?", userId, userId);
        jdbcTemplate.update("DELETE FROM user_role WHERE user_id = ? OR assigned_by = ?", userId, userId);
        jdbcTemplate.update("DELETE FROM user_profile WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM user_credential WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM app_user WHERE id = ?", userId);
    }
}

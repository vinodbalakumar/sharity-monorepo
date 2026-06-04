package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.user.UserDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.RefreshToken;
import com.java.vinod.authorization.server.entity.UserCredential;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.enums.Gender;
import com.java.vinod.authorization.server.enums.ProfileCompletionStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.RefreshTokenRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Locale;

@Service
public class UserService {
    private static final int MINIMUM_REGISTRATION_AGE = 13;
    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;

    public UserService(AppUserRepository appUserRepository,
                       UserProfileRepository userProfileRepository,
                       UserCredentialRepository userCredentialRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       UserMapper userMapper,
                       AuditService auditService,
                       EmailService emailService) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.userCredentialRepository = userCredentialRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.auditService = auditService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public UserDtos.MeResponse me(Long userId) {
        return userMapper.me(loadUser(userId));
    }

    @Transactional
    public UserDtos.ProfileResponse updateProfile(Long userId, UserDtos.UpdateProfileRequest request) {
        AppUser user = loadUser(userId);
        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        profile.setFirstName(blankToNull(request.firstName()));
        profile.setLastName(blankToNull(request.lastName()));
        profile.setPhoneNumber(blankToNull(request.phoneNumber()));
        profile.setCountryCode(normalizeCountryCode(request.countryCode()));
        profile.setCountryName(blankToNull(request.countryName()));
        profile.setPhoneDialCode(blankToNull(request.phoneDialCode()));
        validateAge(request.dateOfBirth());
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setGender(parseOptionalGender(request.gender()));
        profile.setProfileImageUrl(blankToNull(request.profileImageUrl()));
        profile.setUpdatedAt(LocalDateTime.now());
        user.setProfileCompletionStatus(profileCompletionStatus(profile));
        user.setProfileCompletedAt(user.getProfileCompletionStatus() == ProfileCompletionStatus.COMPLETE ? LocalDateTime.now() : null);
        user.setUpdatedAt(LocalDateTime.now());
        auditService.record(user, user, "PROFILE_UPDATED", "user_profile", String.valueOf(profile.getId()), null);
        return userMapper.profile(profile);
    }

    @Transactional
    public void changePassword(Long userId, UserDtos.ChangePasswordRequest request) {
        AppUser user = loadUser(userId);
        UserCredential credential = userCredentialRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Credential not found"));
        if (!passwordEncoder.matches(request.currentPassword(), credential.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        credential.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        credential.setPasswordChangedAt(LocalDateTime.now());
        credential.setUpdatedAt(LocalDateTime.now());
        revokeAllSessions(user, "PASSWORD_CHANGED");
        auditService.record(user, user, "PASSWORD_CHANGED", "user_credential", String.valueOf(credential.getId()), null);
        emailService.sendPasswordChangedNotification(user);
    }

    @Transactional(readOnly = true)
    public List<UserDtos.SessionResponse> sessions(Long userId) {
        return refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(userId).stream()
                .map(userMapper::session)
                .toList();
    }

    @Transactional
    public void revokeSession(Long userId, Long sessionId) {
        RefreshToken token = refreshTokenRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        revoke(token, "USER_REVOKED");
    }

    @Transactional
    public void revokeAllSessions(Long userId) {
        revokeAllSessions(loadUser(userId), "USER_REVOKED_ALL");
    }

    private void revokeAllSessions(AppUser user, String reason) {
        refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(user.getId()).forEach(token -> revoke(token, reason));
    }

    private void revoke(RefreshToken token, String reason) {
        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
            token.setRevokedReason(reason);
        }
    }

    private AppUser loadUser(Long userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeCountryCode(String value) {
        return blankToNull(value) == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private Gender parseOptionalGender(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Gender.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid gender");
        }
    }

    private void validateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        if (dateOfBirth.isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
        if (Period.between(dateOfBirth, today).getYears() < MINIMUM_REGISTRATION_AGE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User must be at least 13 years old");
        }
    }

    private ProfileCompletionStatus profileCompletionStatus(UserProfile profile) {
        return blankToNull(profile.getPhoneNumber()) != null
                && blankToNull(profile.getCountryCode()) != null
                && blankToNull(profile.getCountryName()) != null
                && blankToNull(profile.getPhoneDialCode()) != null
                && profile.getDateOfBirth() != null
                && profile.getGender() != null
                ? ProfileCompletionStatus.COMPLETE
                : ProfileCompletionStatus.INCOMPLETE;
    }
}

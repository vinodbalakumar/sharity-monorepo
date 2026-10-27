package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.EmailVerificationToken;
import com.java.vinod.authorization.server.entity.LoginAttempt;
import com.java.vinod.authorization.server.entity.PasswordResetToken;
import com.java.vinod.authorization.server.entity.RefreshToken;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.UserCredential;
import com.java.vinod.authorization.server.entity.UserLoginMethod;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.entity.UserRole;
import com.java.vinod.authorization.server.entity.UserRoleId;
import com.java.vinod.authorization.server.enums.Gender;
import com.java.vinod.authorization.server.enums.LoginProvider;
import com.java.vinod.authorization.server.enums.ProfileCompletionStatus;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.EmailVerificationTokenRepository;
import com.java.vinod.authorization.server.repository.LoginAttemptRepository;
import com.java.vinod.authorization.server.repository.PasswordResetTokenRepository;
import com.java.vinod.authorization.server.repository.RefreshTokenRepository;
import com.java.vinod.authorization.server.repository.RoleRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.repository.UserLoginMethodRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import com.java.vinod.authorization.server.util.TokenHashing;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;
import java.util.UUID;

/**
 * Owns identity registration, verification, token issuance, and password recovery.
 *
 * <p>The service sits behind the public identity API and the browser login flow,
 * so the methods below explain which operations are public, which are
 * authenticated, and how user state transitions are handled.</p>
 */
@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int MINIMUM_REGISTRATION_AGE = 13;
    private final AppUserRepository appUserRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final UserLoginMethodRepository userLoginMethodRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final DaoAuthenticationProvider authenticationProvider;
    private final JwtService jwtService;
    private final TokenHashing tokenHashing;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;
    private final Duration refreshTokenExpiration;
    private final boolean exposeDevTokens;

    public AuthService(AppUserRepository appUserRepository,
                       UserCredentialRepository userCredentialRepository,
                       UserLoginMethodRepository userLoginMethodRepository,
                       UserProfileRepository userProfileRepository,
                       RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       EmailVerificationTokenRepository emailVerificationTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       LoginAttemptRepository loginAttemptRepository,
                       PasswordEncoder passwordEncoder,
                       DaoAuthenticationProvider authenticationProvider,
                       JwtService jwtService,
                       TokenHashing tokenHashing,
                       UserMapper userMapper,
                       AuditService auditService,
                       EmailService emailService,
                       @Value("${app.refresh-token.expiration}") Duration refreshTokenExpiration,
                       @Value("${app.tokens.expose-dev-tokens:false}") boolean exposeDevTokens) {
        this.appUserRepository = appUserRepository;
        this.userCredentialRepository = userCredentialRepository;
        this.userLoginMethodRepository = userLoginMethodRepository;
        this.userProfileRepository = userProfileRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationProvider = authenticationProvider;
        this.jwtService = jwtService;
        this.tokenHashing = tokenHashing;
        this.userMapper = userMapper;
        this.auditService = auditService;
        this.emailService = emailService;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.exposeDevTokens = exposeDevTokens;
    }

    /**
     * Registers a new identity and starts the verification workflow.
     */
    @Transactional
    public AuthDtos.RegisterResponse register(AuthDtos.RegisterRequest request, HttpServletRequest httpRequest) {
        validateRegistrationProfile(request);
        String normalizedEmail = normalize(request.email());
        var existingEmailUser = appUserRepository.findByNormalizedEmail(normalizedEmail);
        if (existingEmailUser.isPresent()) {
            AppUser existing = existingEmailUser.get();
            if (!isDeleted(existing)) {
                throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
            }
            releaseDeletedIdentity(existing);
        }
        String normalizedUsername = request.username() == null || request.username().isBlank() ? null : normalize(request.username());
        if (normalizedUsername != null) {
            var existingUsernameUser = appUserRepository.findByNormalizedUsername(normalizedUsername);
            if (existingUsernameUser.isPresent()) {
                AppUser existing = existingUsernameUser.get();
                if (!isDeleted(existing)) {
                    throw new ApiException(HttpStatus.CONFLICT, "Username is already registered");
                }
                releaseDeletedIdentity(existing);
            }
        }
        appUserRepository.flush();

        LocalDateTime now = LocalDateTime.now();
        AppUser user = new AppUser();
        user.setPublicId(UUID.randomUUID().toString());
        user.setEmail(request.email().trim());
        user.setNormalizedEmail(normalizedEmail);
        user.setUsername(blankToNull(request.username()));
        user.setNormalizedUsername(normalizedUsername);
        user.setStatus(UserStatus.PENDING_VERIFICATION);
        user.setProfileCompletionStatus(ProfileCompletionStatus.COMPLETE);
        user.setProfileCompletedAt(now);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        appUserRepository.save(user);

        UserCredential credential = new UserCredential();
        credential.setUser(user);
        credential.setPasswordHash(passwordEncoder.encode(request.password()));
        credential.setPasswordChangedAt(now);
        credential.setCreatedAt(now);
        credential.setUpdatedAt(now);
        userCredentialRepository.save(credential);

        UserLoginMethod loginMethod = new UserLoginMethod();
        loginMethod.setUser(user);
        loginMethod.setProvider(LoginProvider.LOCAL);
        loginMethod.setProviderEmail(user.getEmail());
        loginMethod.setProviderEmailVerified(false);
        loginMethod.setPasswordCredential(credential);
        loginMethod.setEnabled(true);
        loginMethod.setCreatedAt(now);
        loginMethod.setUpdatedAt(now);
        userLoginMethodRepository.save(loginMethod);

        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFirstName(blankToNull(request.firstName()));
        profile.setLastName(blankToNull(request.lastName()));
        profile.setPhoneNumber(blankToNull(request.phoneNumber()));
        profile.setCountryCode(normalizeCountryCode(request.countryCode()));
        profile.setCountryName(blankToNull(request.countryName()));
        profile.setPhoneDialCode(blankToNull(request.phoneDialCode()));
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setGender(parseOptionalGender(request.gender()));
        profile.setLocale(blankToNull(request.locale()));
        profile.setPreferredTimezone(blankToNull(request.timezone()));
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);
        userProfileRepository.save(profile);

        assignRole(user, "USER", null);
        String verificationToken = createEmailVerificationToken(user, now);
        emailService.sendEmailVerificationEmail(user, verificationToken);
        auditService.record(user, user, "USER_REGISTERED", "app_user", user.getPublicId(), ip(httpRequest));
        return new AuthDtos.RegisterResponse(user.getPublicId(), user.getEmail(), user.getStatus().name(),
                exposeDevTokens ? verificationToken : null);
    }

    /**
     * Verifies a one-time email token and activates the account for sign-in.
     */
    @Transactional
    public AuthDtos.MessageResponse verifyEmail(AuthDtos.VerifyEmailRequest request, HttpServletRequest httpRequest) {
        EmailVerificationToken token = emailVerificationTokenRepository.findByTokenHash(tokenHashing.sha256(request.token()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired verification token"));
        if (token.getVerifiedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired verification token");
        }
        AppUser user = token.getUser();
        token.setVerifiedAt(LocalDateTime.now());
        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setUpdatedAt(LocalDateTime.now());
        assignRole(user, "CUSTOMER", null);
        auditService.record(user, user, "EMAIL_VERIFIED", "app_user", user.getPublicId(), ip(httpRequest));
        return new AuthDtos.MessageResponse("Email verified");
    }

    /**
     * Authenticates a public API login request and returns a JWT pair.
     */
    @Transactional
    public AuthDtos.TokenResponse login(AuthDtos.LoginRequest request, HttpServletRequest httpRequest) {
        String normalizedEmail = normalize(request.email());
        AppUser user = appUserRepository.findByNormalizedEmail(normalizedEmail).orElse(null);
        try {
            authenticationProvider.authenticate(new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        } catch (Exception exception) {
            log.warn("Login failed for email={} reason={} correlationId={}",
                    normalizedEmail,
                    exception.getClass().getSimpleName(),
                    correlationId(httpRequest));
            recordLoginAttempt(user, normalizedEmail, false, "INVALID_CREDENTIALS", httpRequest);
            if (user != null) {
                user.setFailedLoginCount(user.getFailedLoginCount() + 1);
                user.setUpdatedAt(LocalDateTime.now());
            }
            throw new BadCredentialsException("Invalid credentials");
        }
        if (user == null) {
            throw new BadCredentialsException("Invalid credentials");
        }
        user.setFailedLoginCount(0);
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        recordLoginAttempt(user, normalizedEmail, true, null, httpRequest);
        String rawRefreshToken = createRefreshToken(user, request.deviceName(), httpRequest, UUID.randomUUID().toString());
        AuthDtos.UserSummary userSummary = userMapper.authSummary(user);
        String accessToken = jwtService.createAccessToken(user, userSummary);
        auditService.record(user, user, "USER_LOGIN", "app_user", user.getPublicId(), ip(httpRequest));
        return new AuthDtos.TokenResponse(accessToken, rawRefreshToken, "Bearer", jwtService.accessTokenExpiresInSeconds());
    }

    /**
     * Rotates a refresh token and returns a new access token for the caller.
     */
    @Transactional
    public AuthDtos.TokenResponse refresh(AuthDtos.RefreshTokenRequest request, HttpServletRequest httpRequest) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHashing.sha256(request.refreshToken()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        LocalDateTime now = LocalDateTime.now();
        if (token.getRevokedAt() != null) {
            revokeFamily(token.getTokenFamilyId(), "REUSE_DETECTED");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        if (token.getExpiresAt().isBefore(now)) {
            revoke(token, "EXPIRED");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
        AppUser user = token.getUser();
        token.setLastUsedAt(now);
        revoke(token, "ROTATED");
        String replacement = createRefreshToken(user, request.deviceName(), httpRequest, token.getTokenFamilyId());
        RefreshToken replacementEntity = refreshTokenRepository.findByTokenHash(tokenHashing.sha256(replacement)).orElseThrow();
        token.setReplacedByToken(replacementEntity);
        AuthDtos.UserSummary userSummary = userMapper.authSummary(user);
        String accessToken = jwtService.createAccessToken(user, userSummary);
        return new AuthDtos.TokenResponse(accessToken, replacement, "Bearer", jwtService.accessTokenExpiresInSeconds());
    }

    /**
     * Revokes the caller's refresh token family.
     */
    @Transactional
    public AuthDtos.MessageResponse logout(AuthDtos.LogoutRequest request) {
        refreshTokenRepository.findByTokenHash(tokenHashing.sha256(request.refreshToken()))
                .ifPresent(token -> revoke(token, "LOGOUT"));
        return new AuthDtos.MessageResponse("Logged out");
    }

    /**
     * Starts password recovery for a registered email address.
     */
    @Transactional
    public AuthDtos.ForgotPasswordResponse forgotPassword(AuthDtos.ForgotPasswordRequest request) {
        String resetToken = appUserRepository.findByNormalizedEmail(normalize(request.email()))
                .map(user -> {
                    String token = createPasswordResetToken(user, LocalDateTime.now());
                    emailService.sendPasswordResetEmail(user, token);
                    return token;
                })
                .orElse(null);
        return new AuthDtos.ForgotPasswordResponse(
                "If the email is registered, password reset instructions will be sent",
                exposeDevTokens ? resetToken : null);
    }

    /**
     * Applies a valid password reset token and stores the new credential hash.
     */
    @Transactional
    public AuthDtos.MessageResponse resetPassword(AuthDtos.ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHashing.sha256(request.token()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired reset token");
        }
        UserCredential credential = userCredentialRepository.findByUser_Id(token.getUser().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Credential not found"));
        LocalDateTime now = LocalDateTime.now();
        credential.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        credential.setPasswordChangedAt(now);
        credential.setPasswordResetRequired(false);
        credential.setUpdatedAt(now);
        token.setUsedAt(now);
        revokeUserTokens(token.getUser(), "PASSWORD_RESET");
        emailService.sendPasswordChangedNotification(token.getUser());
        return new AuthDtos.MessageResponse("Password reset complete");
    }

    private String createRefreshToken(AppUser user, String deviceName, HttpServletRequest httpRequest, String familyId) {
        LocalDateTime now = LocalDateTime.now();
        String raw = tokenHashing.newOpaqueToken();
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(tokenHashing.sha256(raw));
        token.setTokenFamilyId(familyId);
        token.setDeviceName(blankToNull(deviceName));
        token.setIpAddress(ip(httpRequest));
        token.setUserAgent(truncate(httpRequest.getHeader("User-Agent"), 500));
        token.setIssuedAt(now);
        token.setExpiresAt(now.plus(refreshTokenExpiration));
        refreshTokenRepository.save(token);
        return raw;
    }

    private String createEmailVerificationToken(AppUser user, LocalDateTime now) {
        String raw = tokenHashing.newOpaqueToken();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(tokenHashing.sha256(raw));
        token.setCreatedAt(now);
        token.setExpiresAt(now.plusHours(24));
        emailVerificationTokenRepository.save(token);
        return raw;
    }

    private String createPasswordResetToken(AppUser user, LocalDateTime now) {
        String raw = tokenHashing.newOpaqueToken();
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(tokenHashing.sha256(raw));
        token.setCreatedAt(now);
        token.setExpiresAt(now.plusHours(1));
        passwordResetTokenRepository.save(token);
        return raw;
    }

    private void assignRole(AppUser user, String roleName, AppUser assignedBy) {
        if (userRoleRepository.existsByUser_IdAndRole_RoleName(user.getId(), roleName)) {
            return;
        }
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role not configured"));
        UserRole userRole = new UserRole();
        userRole.setId(new UserRoleId(user.getId(), role.getId()));
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setAssignedAt(LocalDateTime.now());
        userRole.setAssignedBy(assignedBy);
        userRoleRepository.save(userRole);
    }

    public void revokeUserTokens(AppUser user, String reason) {
        refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(user.getId()).forEach(token -> revoke(token, reason));
    }

    private void revokeFamily(String familyId, String reason) {
        refreshTokenRepository.findByTokenFamilyIdAndRevokedAtIsNull(familyId).forEach(token -> revoke(token, reason));
    }

    private void revoke(RefreshToken token, String reason) {
        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
            token.setRevokedReason(reason);
        }
    }

    private void recordLoginAttempt(AppUser user, String attemptedEmail, boolean success, String failureReason, HttpServletRequest request) {
        LoginAttempt attempt = new LoginAttempt();
        attempt.setUser(user);
        attempt.setAttemptedEmail(attemptedEmail);
        attempt.setIpAddress(ip(request));
        attempt.setUserAgent(truncate(request.getHeader("User-Agent"), 500));
        attempt.setSuccess(success);
        attempt.setFailureReason(failureReason);
        attempt.setAttemptedAt(LocalDateTime.now());
        loginAttemptRepository.save(attempt);
    }

    private boolean isDeleted(AppUser user) {
        return user.getStatus() == UserStatus.DELETED || user.getDeletedAt() != null;
    }

    private void releaseDeletedIdentity(AppUser user) {
        if (!isDeleted(user)) {
            return;
        }
        String releasedEmail = "deleted+" + user.getPublicId() + "@deleted.local";
        String releasedUsername = "deleted_" + user.getId();
        user.setEmail(releasedEmail);
        user.setNormalizedEmail(releasedEmail);
        user.setUsername(releasedUsername);
        user.setNormalizedUsername(releasedUsername);
        user.setUpdatedAt(LocalDateTime.now());
    }

    private String normalize(String value) {
        return value.trim().toLowerCase();
    }

    private void validateRegistrationProfile(AuthDtos.RegisterRequest request) {
        if (request.dateOfBirth() != null) {
            LocalDate today = LocalDate.now();
            if (request.dateOfBirth().isAfter(today)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
            }
            if (Period.between(request.dateOfBirth(), today).getYears() < MINIMUM_REGISTRATION_AGE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "User must be at least 13 years old");
            }
        }
        parseOptionalGender(request.gender());
    }

    private Gender parseGender(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gender is required");
        }
        try {
            return Gender.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid gender");
        }
    }

    private Gender parseOptionalGender(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return parseGender(value);
    }

    private String normalizeCountryCode(String value) {
        return blankToNull(value) == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String ip(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return truncate(forwardedFor.split(",")[0].trim(), 45);
        }
        return truncate(request.getRemoteAddr(), 45);
    }

    /**
     * Reads the safe request correlation identifier attached by the observability filter.
     */
    private String correlationId(HttpServletRequest request) {
        Object attribute = request.getAttribute(com.java.vinod.authorization.server.config.RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE);
        if (attribute != null && !attribute.toString().isBlank()) {
            return attribute.toString();
        }
        String header = request.getHeader(com.java.vinod.authorization.server.config.RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE);
        return header == null || header.isBlank() ? "n/a" : header.trim();
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}

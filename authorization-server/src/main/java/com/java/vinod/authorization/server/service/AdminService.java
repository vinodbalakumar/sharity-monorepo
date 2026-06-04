package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.admin.AdminDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Application;
import com.java.vinod.authorization.server.entity.AuditLog;
import com.java.vinod.authorization.server.entity.EmailVerificationToken;
import com.java.vinod.authorization.server.entity.PasswordResetToken;
import com.java.vinod.authorization.server.entity.RefreshToken;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.UserApplicationAccess;
import com.java.vinod.authorization.server.entity.UserApplicationAccessId;
import com.java.vinod.authorization.server.entity.UserCredential;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.entity.UserRole;
import com.java.vinod.authorization.server.entity.UserRoleId;
import com.java.vinod.authorization.server.enums.Gender;
import com.java.vinod.authorization.server.enums.ProfileCompletionStatus;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.ApplicationRepository;
import com.java.vinod.authorization.server.repository.AuditLogRepository;
import com.java.vinod.authorization.server.repository.EmailVerificationTokenRepository;
import com.java.vinod.authorization.server.repository.PasswordResetTokenRepository;
import com.java.vinod.authorization.server.repository.RefreshTokenRepository;
import com.java.vinod.authorization.server.repository.RoleRepository;
import com.java.vinod.authorization.server.repository.UserApplicationAccessRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import com.java.vinod.authorization.server.util.TokenHashing;
import jakarta.persistence.criteria.JoinType;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AdminService {
    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final UserProfileRepository userProfileRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ApplicationRepository applicationRepository;
    private final UserApplicationAccessRepository userApplicationAccessRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final TokenHashing tokenHashing;

    public AdminService(AppUserRepository appUserRepository,
                        RoleRepository roleRepository,
                        UserRoleRepository userRoleRepository,
                        UserCredentialRepository userCredentialRepository,
                        UserProfileRepository userProfileRepository,
                        EmailVerificationTokenRepository emailVerificationTokenRepository,
                        PasswordResetTokenRepository passwordResetTokenRepository,
                        RefreshTokenRepository refreshTokenRepository,
                        ApplicationRepository applicationRepository,
                        UserApplicationAccessRepository userApplicationAccessRepository,
                        AuditLogRepository auditLogRepository,
                        UserMapper userMapper,
                        AuditService auditService,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder,
                        TokenHashing tokenHashing) {
        this.appUserRepository = appUserRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.userCredentialRepository = userCredentialRepository;
        this.userProfileRepository = userProfileRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.applicationRepository = applicationRepository;
        this.userApplicationAccessRepository = userApplicationAccessRepository;
        this.auditLogRepository = auditLogRepository;
        this.userMapper = userMapper;
        this.auditService = auditService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.tokenHashing = tokenHashing;
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<AdminDtos.AdminUserResponse> users(String search,
                                                                     String status,
                                                                     String role,
                                                                     String app,
                                                                     int page,
                                                                     int size) {
        Page<AppUser> users = appUserRepository.findAll(
                userSpec(search, status, role, app),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return page(users.map(userMapper::adminUser));
    }

    @Transactional(readOnly = true)
    public AdminDtos.AdminUserResponse user(String publicId) {
        return userMapper.adminUser(loadByPublicId(publicId));
    }

    @Transactional
    public AdminDtos.AdminUserResponse createUser(Long actorId, AdminDtos.CreateUserRequest request) {
        AppUser actor = loadById(actorId);
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
        user.setEmailVerified(Boolean.TRUE.equals(request.emailVerified()));
        user.setStatus(parseStatus(request.status(), user.isEmailVerified() ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION));
        user.setProfileCompletionStatus(profileCompletionStatus(
                request.phoneNumber(),
                request.countryCode(),
                request.dateOfBirth(),
                request.gender()));
        if (user.getProfileCompletionStatus() == ProfileCompletionStatus.COMPLETE) {
            user.setProfileCompletedAt(now);
        }
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
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);
        userProfileRepository.save(profile);

        assignRole(user, "USER", actor);
        if (user.isEmailVerified()) {
            assignRole(user, "CUSTOMER", actor);
        }
        if (request.roles() != null) {
            request.roles().forEach(roleName -> assignRole(user, roleName, actor));
        }
        sendAdminCreatedUserEmail(user, now);
        auditService.record(actor, user, "ADMIN_USER_CREATED", "app_user", user.getPublicId(), null);
        return userMapper.adminUser(user);
    }

    @Transactional
    public AdminDtos.AdminUserResponse updateProfile(Long actorId, String publicId, AdminDtos.UpdateProfileRequest request) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        UserProfile profile = userProfileRepository.findByUser_Id(target.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        profile.setFirstName(blankToNull(request.firstName()));
        profile.setLastName(blankToNull(request.lastName()));
        profile.setPhoneNumber(blankToNull(request.phoneNumber()));
        profile.setCountryCode(normalizeCountryCode(request.countryCode()));
        profile.setCountryName(blankToNull(request.countryName()));
        profile.setPhoneDialCode(blankToNull(request.phoneDialCode()));
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setGender(parseOptionalGender(request.gender()));
        profile.setProfileImageUrl(blankToNull(request.profileImageUrl()));
        profile.setUpdatedAt(LocalDateTime.now());
        target.setProfileCompletionStatus(profileCompletionStatus(
                profile.getPhoneNumber(),
                profile.getCountryCode(),
                profile.getDateOfBirth(),
                profile.getGender() == null ? null : profile.getGender().name()));
        target.setProfileCompletedAt(target.getProfileCompletionStatus() == ProfileCompletionStatus.COMPLETE
                ? LocalDateTime.now()
                : null);
        target.setUpdatedAt(LocalDateTime.now());
        auditService.record(actor, target, "ADMIN_USER_PROFILE_UPDATED", "user_profile", String.valueOf(profile.getId()), null);
        return userMapper.adminUser(target);
    }

    @Transactional
    public AdminDtos.AdminUserResponse updateStatus(Long actorId, String publicId, AdminDtos.UpdateStatusRequest request) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        UserStatus status = parseStatus(request.status(), null);
        target.setStatus(status);
        target.setDeletedAt(status == UserStatus.DELETED ? LocalDateTime.now() : null);
        if (status == UserStatus.DELETED) {
            releaseDeletedIdentity(target);
            refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(target.getId()).forEach(token -> {
                token.setRevokedAt(LocalDateTime.now());
                token.setRevokedReason("USER_DELETED");
            });
        }
        target.setUpdatedAt(LocalDateTime.now());
        auditService.record(actor, target, "USER_STATUS_UPDATED", "app_user", target.getPublicId(), null);
        return userMapper.adminUser(target);
    }

    @Transactional
    public void deleteUser(Long actorId, String publicId) {
        updateStatus(actorId, publicId, new AdminDtos.UpdateStatusRequest(UserStatus.DELETED.name()));
    }

    @Transactional
    public AdminDtos.AdminUserResponse addRole(Long actorId, String publicId, AdminDtos.RoleRequest request) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        String requestedRole = request.role().trim().toUpperCase();
        Role role = roleRepository.findByRoleName(requestedRole)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role not found"));
        if (!userRoleRepository.existsByUser_IdAndRole_RoleName(target.getId(), role.getRoleName())) {
            UserRole userRole = new UserRole();
            userRole.setId(new UserRoleId(target.getId(), role.getId()));
            userRole.setUser(target);
            userRole.setRole(role);
            userRole.setAssignedAt(LocalDateTime.now());
            userRole.setAssignedBy(actor);
            userRoleRepository.save(userRole);
            auditService.record(actor, target, "USER_ROLE_ADDED", "role", role.getRoleName(), null);
            if ("SUPER_ADMIN".equals(role.getRoleName())) {
                emailService.sendSuperAdminSecurityAlert(target, actor);
            }
        }
        return userMapper.adminUser(target);
    }

    @Transactional
    public void removeRole(Long actorId, String publicId, String roleName) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        Role role = roleRepository.findByRoleName(roleName.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role not found"));
        userRoleRepository.deleteById(new UserRoleId(target.getId(), role.getId()));
        auditService.record(actor, target, "USER_ROLE_REMOVED", "role", role.getRoleName(), null);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.RoleResponse> roles() {
        return roleRepository.findAll(Sort.by("roleName")).stream()
                .map(role -> new AdminDtos.RoleResponse(role.getRoleName(), role.getDescription(), role.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.ApplicationResponse> applications() {
        return userMapper.applications();
    }

    @Transactional
    public AdminDtos.ApplicationResponse createApplication(Long actorId, AdminDtos.CreateApplicationRequest request) {
        AppUser actor = loadById(actorId);
        String appCode = request.appCode().trim().toUpperCase();
        if (applicationRepository.existsByAppCode(appCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "Application code is already registered");
        }

        Application application = new Application();
        application.setAppCode(appCode);
        application.setAppName(request.appName().trim());
        application.setDescription(request.description() == null ? null : request.description().trim());
        application.setActive(request.active() == null || request.active());
        application.setCreatedAt(LocalDateTime.now());
        applicationRepository.save(application);
        auditService.record(actor, null, "APPLICATION_CREATED", "application", appCode, null);
        return userMapper.application(application);
    }

    @Transactional
    public AdminDtos.AdminUserResponse addApplicationAccess(Long actorId, String publicId, AdminDtos.ApplicationAccessRequest request) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        String appCode = request.appCode().trim().toUpperCase();
        Application application = applicationRepository.findByAppCode(appCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        if (!application.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Application is inactive");
        }
        if (!userApplicationAccessRepository.existsByUser_IdAndApplication_AppCode(target.getId(), appCode)) {
            UserApplicationAccess access = new UserApplicationAccess();
            access.setId(new UserApplicationAccessId(target.getId(), application.getId()));
            access.setUser(target);
            access.setApplication(application);
            access.setAssignedAt(LocalDateTime.now());
            access.setAssignedBy(actor);
            userApplicationAccessRepository.save(access);
            auditService.record(actor, target, "USER_APP_ACCESS_ADDED", "application", appCode, null);
        }
        return userMapper.adminUser(target);
    }

    @Transactional
    public void removeApplicationAccess(Long actorId, String publicId, String appCode) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        Application application = applicationRepository.findByAppCode(appCode.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        userApplicationAccessRepository.deleteById(new UserApplicationAccessId(target.getId(), application.getId()));
        auditService.record(actor, target, "USER_APP_ACCESS_REMOVED", "application", application.getAppCode(), null);
    }

    @Transactional(readOnly = true)
    public AdminDtos.PageResponse<AdminDtos.AuditLogResponse> auditLogs(String actor,
                                                                        String target,
                                                                        String action,
                                                                        LocalDateTime from,
                                                                        LocalDateTime to,
                                                                        int page,
                                                                        int size) {
        Page<AuditLog> logs = auditLogRepository.findAll(
                auditSpec(actor, target, action, from, to),
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return page(logs.map(userMapper::auditLog));
    }

    @Transactional(readOnly = true)
    public AdminDtos.DashboardSummaryResponse dashboardSummary() {
        return new AdminDtos.DashboardSummaryResponse(
                appUserRepository.countByDeletedAtIsNull(),
                appUserRepository.countByStatusAndDeletedAtIsNull(UserStatus.ACTIVE),
                appUserRepository.countByStatusAndDeletedAtIsNull(UserStatus.PENDING_VERIFICATION),
                appUserRepository.countByStatusAndDeletedAtIsNull(UserStatus.LOCKED),
                appUserRepository.countByStatusAndDeletedAtIsNull(UserStatus.SUSPENDED),
                appUserRepository.countByStatusAndDeletedAtIsNull(UserStatus.DELETED),
                applicationRepository.count(),
                refreshTokenRepository.countByRevokedAtIsNull(),
                auditLogRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.AdminSessionResponse> userSessions(String publicId) {
        AppUser target = loadByPublicId(publicId);
        return refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(target.getId()).stream()
                .map(this::session)
                .toList();
    }

    @Transactional
    public void revokeUserSession(Long actorId, String publicId, Long sessionId) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        RefreshToken token = refreshTokenRepository.findByIdAndUser_Id(sessionId, target.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
            token.setRevokedReason("ADMIN_REVOKED");
        }
        auditService.record(actor, target, "ADMIN_SESSION_REVOKED", "refresh_token", String.valueOf(sessionId), null);
    }

    private AdminDtos.AdminSessionResponse session(RefreshToken token) {
        return new AdminDtos.AdminSessionResponse(
                token.getId(),
                token.getDeviceName(),
                token.getIpAddress(),
                token.getUserAgent(),
                token.getIssuedAt(),
                token.getExpiresAt(),
                token.getLastUsedAt()
        );
    }

    private AppUser loadByPublicId(String publicId) {
        return appUserRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AppUser loadById(Long id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void assignRole(AppUser user, String roleName, AppUser assignedBy) {
        String requestedRole = roleName.trim().toUpperCase(Locale.ROOT);
        Role role = roleRepository.findByRoleName(requestedRole)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role not found"));
        if (userRoleRepository.existsByUser_IdAndRole_RoleName(user.getId(), requestedRole)) {
            return;
        }
        UserRole userRole = new UserRole();
        userRole.setId(new UserRoleId(user.getId(), role.getId()));
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setAssignedAt(LocalDateTime.now());
        userRole.setAssignedBy(assignedBy);
        userRoleRepository.save(userRole);
    }

    private void sendAdminCreatedUserEmail(AppUser user, LocalDateTime now) {
        if (user.isEmailVerified()) {
            String resetToken = createPasswordResetToken(user, now);
            emailService.sendPasswordResetEmail(user, resetToken);
            return;
        }
        String verificationToken = createEmailVerificationToken(user, now);
        emailService.sendEmailVerificationEmail(user, verificationToken);
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

    private UserStatus parseStatus(String value, UserStatus defaultStatus) {
        if (value == null || value.isBlank()) {
            if (defaultStatus == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status");
            }
            return defaultStatus;
        }
        try {
            return UserStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
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

    private ProfileCompletionStatus profileCompletionStatus(String phoneNumber, String countryCode, java.time.LocalDate dateOfBirth, String gender) {
        return blankToNull(phoneNumber) != null
                && blankToNull(countryCode) != null
                && dateOfBirth != null
                && blankToNull(gender) != null
                ? ProfileCompletionStatus.COMPLETE
                : ProfileCompletionStatus.INCOMPLETE;
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

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private <T> AdminDtos.PageResponse<T> page(Page<T> page) {
        return new AdminDtos.PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    private Specification<AppUser> userSpec(String search, String status, String role, String app) {
        return (root, query, cb) -> {
            query.distinct(true);
            var predicate = cb.conjunction();
            predicate = cb.and(predicate, cb.isNull(root.get("deletedAt")));
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("username")), like),
                        cb.like(cb.lower(root.get("publicId")), like)
                ));
            }
            if (status != null && !status.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), parseStatus(status, null)));
            }
            if (role != null && !role.isBlank()) {
                var subquery = query.subquery(Long.class);
                var userRole = subquery.from(UserRole.class);
                subquery.select(userRole.get("user").get("id"))
                        .where(
                                cb.equal(userRole.get("user").get("id"), root.get("id")),
                                cb.equal(userRole.get("role").get("roleName"), role.trim().toUpperCase(Locale.ROOT))
                        );
                predicate = cb.and(predicate, cb.exists(subquery));
            }
            if (app != null && !app.isBlank()) {
                var subquery = query.subquery(Long.class);
                var access = subquery.from(UserApplicationAccess.class);
                subquery.select(access.get("user").get("id"))
                        .where(
                                cb.equal(access.get("user").get("id"), root.get("id")),
                                cb.equal(access.get("application").get("appCode"), app.trim().toUpperCase(Locale.ROOT))
                        );
                predicate = cb.and(predicate, cb.exists(subquery));
            }
            return predicate;
        };
    }

    private Specification<AuditLog> auditSpec(String actor, String target, String action, LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();
            if (actor != null && !actor.isBlank()) {
                var actorJoin = root.join("actorUser", JoinType.LEFT);
                String like = "%" + actor.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(actorJoin.get("email")), like),
                        cb.like(cb.lower(actorJoin.get("publicId")), like)
                ));
            }
            if (target != null && !target.isBlank()) {
                var targetJoin = root.join("targetUser", JoinType.LEFT);
                String like = "%" + target.trim().toLowerCase(Locale.ROOT) + "%";
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(targetJoin.get("email")), like),
                        cb.like(cb.lower(targetJoin.get("publicId")), like)
                ));
            }
            if (action != null && !action.isBlank()) {
                predicate = cb.and(predicate, cb.equal(root.get("action"), action.trim().toUpperCase(Locale.ROOT)));
            }
            if (from != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return predicate;
        };
    }
}

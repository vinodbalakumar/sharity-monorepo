package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.admin.AdminDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Application;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.UserApplicationAccess;
import com.java.vinod.authorization.server.entity.UserApplicationAccessId;
import com.java.vinod.authorization.server.entity.UserRole;
import com.java.vinod.authorization.server.entity.UserRoleId;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.ApplicationRepository;
import com.java.vinod.authorization.server.repository.AuditLogRepository;
import com.java.vinod.authorization.server.repository.RoleRepository;
import com.java.vinod.authorization.server.repository.UserApplicationAccessRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {
    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final ApplicationRepository applicationRepository;
    private final UserApplicationAccessRepository userApplicationAccessRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;

    public AdminService(AppUserRepository appUserRepository,
                        RoleRepository roleRepository,
                        UserRoleRepository userRoleRepository,
                        ApplicationRepository applicationRepository,
                        UserApplicationAccessRepository userApplicationAccessRepository,
                        AuditLogRepository auditLogRepository,
                        UserMapper userMapper,
                        AuditService auditService,
                        EmailService emailService) {
        this.appUserRepository = appUserRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.applicationRepository = applicationRepository;
        this.userApplicationAccessRepository = userApplicationAccessRepository;
        this.auditLogRepository = auditLogRepository;
        this.userMapper = userMapper;
        this.auditService = auditService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.AdminUserResponse> users() {
        return appUserRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(userMapper::adminUser)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminDtos.AdminUserResponse user(String publicId) {
        return userMapper.adminUser(loadByPublicId(publicId));
    }

    @Transactional
    public AdminDtos.AdminUserResponse updateStatus(Long actorId, String publicId, AdminDtos.UpdateStatusRequest request) {
        AppUser actor = loadById(actorId);
        AppUser target = loadByPublicId(publicId);
        UserStatus status;
        try {
            status = UserStatus.valueOf(request.status().trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid status");
        }
        target.setStatus(status);
        target.setDeletedAt(status == UserStatus.DELETED ? LocalDateTime.now() : null);
        target.setUpdatedAt(LocalDateTime.now());
        auditService.record(actor, target, "USER_STATUS_UPDATED", "app_user", target.getPublicId(), null);
        return userMapper.adminUser(target);
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
    public List<AdminDtos.AuditLogResponse> auditLogs() {
        return auditLogRepository.findAll().stream()
                .map(userMapper::auditLog)
                .toList();
    }

    private AppUser loadByPublicId(String publicId) {
        return appUserRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AppUser loadById(Long id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}

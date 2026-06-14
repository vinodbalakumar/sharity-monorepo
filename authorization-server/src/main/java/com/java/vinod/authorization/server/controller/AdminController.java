package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.admin.AdminDtos;
import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.util.ValidationMessages;
import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.service.AdminService;
import com.java.vinod.authorization.server.service.AuthMasterDataService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@Validated
@RequestMapping("/v1/admin")
public class AdminController {
    private final AdminService adminService;
    private final AuthMasterDataService authMasterDataService;

    public AdminController(AdminService adminService, AuthMasterDataService authMasterDataService) {
        this.adminService = adminService;
        this.authMasterDataService = authMasterDataService;
    }

    @GetMapping("/users")
    public AdminDtos.PageResponse<AdminDtos.AdminUserResponse> users(@RequestParam(required = false) String search,
                                                                     @RequestParam(required = false) String status,
                                                                     @RequestParam(required = false) String role,
                                                                     @RequestParam(required = false) String app,
                                                                     @RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "20") int size) {
        return adminService.users(search, status, role, app, page, size);
    }

    @PostMapping("/users")
    public AdminDtos.AdminUserResponse createUser(@AuthenticationPrincipal AuthenticatedUser actor,
                                                  @Valid @RequestBody AdminDtos.CreateUserRequest request) {
        return adminService.createUser(actor.id(), request);
    }

    @GetMapping("/users/{publicId}")
    public AdminDtos.AdminUserResponse user(
            @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId) {
        return adminService.user(publicId);
    }

    @PutMapping("/users/{publicId}/status")
    public AdminDtos.AdminUserResponse updateStatus(@AuthenticationPrincipal AuthenticatedUser actor,
                                                    @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                                    @Valid @RequestBody AdminDtos.UpdateStatusRequest request) {
        return adminService.updateStatus(actor.id(), publicId, request);
    }

    @PutMapping("/users/{publicId}/profile")
    public AdminDtos.AdminUserResponse updateProfile(@AuthenticationPrincipal AuthenticatedUser actor,
                                                     @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                                     @Valid @RequestBody AdminDtos.UpdateProfileRequest request) {
        return adminService.updateProfile(actor.id(), publicId, request);
    }

    @DeleteMapping("/users/{publicId}")
    public AuthDtos.MessageResponse deleteUser(@AuthenticationPrincipal AuthenticatedUser actor,
                                               @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId) {
        adminService.deleteUser(actor.id(), publicId);
        return new AuthDtos.MessageResponse("User deleted");
    }

    @PostMapping("/users/{publicId}/roles")
    public AdminDtos.AdminUserResponse addRole(@AuthenticationPrincipal AuthenticatedUser actor,
                                               @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                               @Valid @RequestBody AdminDtos.RoleRequest request) {
        return adminService.addRole(actor.id(), publicId, request);
    }

    @DeleteMapping("/users/{publicId}/roles/{role}")
    public AuthDtos.MessageResponse removeRole(@AuthenticationPrincipal AuthenticatedUser actor,
                                               @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                               @PathVariable @Pattern(regexp = ValidationMessages.UPPER_CODE_PATTERN, message = ValidationMessages.ROLE_INVALID) String role) {
        adminService.removeRole(actor.id(), publicId, role);
        return new AuthDtos.MessageResponse("Role removed");
    }

    @GetMapping("/roles")
    public List<AdminDtos.RoleResponse> roles() {
        return adminService.roles();
    }

    @GetMapping("/applications")
    public List<AdminDtos.ApplicationResponse> applications() {
        return adminService.applications();
    }

    @PostMapping("/applications")
    public AdminDtos.ApplicationResponse createApplication(@AuthenticationPrincipal AuthenticatedUser actor,
                                                           @Valid @RequestBody AdminDtos.CreateApplicationRequest request) {
        return adminService.createApplication(actor.id(), request);
    }

    @PostMapping("/users/{publicId}/applications")
    public AdminDtos.AdminUserResponse addApplicationAccess(@AuthenticationPrincipal AuthenticatedUser actor,
                                                            @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                                            @Valid @RequestBody AdminDtos.ApplicationAccessRequest request) {
        return adminService.addApplicationAccess(actor.id(), publicId, request);
    }

    @DeleteMapping("/users/{publicId}/applications/{appCode}")
    public AuthDtos.MessageResponse removeApplicationAccess(@AuthenticationPrincipal AuthenticatedUser actor,
                                                            @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                                            @PathVariable @Pattern(regexp = ValidationMessages.UPPER_CODE_PATTERN, message = ValidationMessages.APP_CODE_INVALID) String appCode) {
        adminService.removeApplicationAccess(actor.id(), publicId, appCode);
        return new AuthDtos.MessageResponse("Application access removed");
    }

    @GetMapping("/audit-logs")
    public AdminDtos.PageResponse<AdminDtos.AuditLogResponse> auditLogs(@RequestParam(required = false) String actor,
                                                                        @RequestParam(required = false) String target,
                                                                        @RequestParam(required = false) String action,
                                                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                                                                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
                                                                        @RequestParam(defaultValue = "0") int page,
                                                                        @RequestParam(defaultValue = "20") int size) {
        return adminService.auditLogs(actor, target, action, from, to, page, size);
    }

    @GetMapping("/dashboard/summary")
    public AdminDtos.DashboardSummaryResponse dashboardSummary() {
        return adminService.dashboardSummary();
    }

    @GetMapping("/reference-data")
    public AdminDtos.AuthMasterReferenceResponse referenceData() {
        return authMasterDataService.referenceData();
    }

    @GetMapping("/users/{publicId}/sessions")
    public List<AdminDtos.AdminSessionResponse> userSessions(
            @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId) {
        return adminService.userSessions(publicId);
    }

    @DeleteMapping("/users/{publicId}/sessions/{sessionId}")
    public AuthDtos.MessageResponse revokeUserSession(@AuthenticationPrincipal AuthenticatedUser actor,
                                                      @PathVariable @Pattern(regexp = ValidationMessages.UUID_PATTERN, message = ValidationMessages.PUBLIC_ID_INVALID) String publicId,
                                                      @PathVariable Long sessionId) {
        adminService.revokeUserSession(actor.id(), publicId, sessionId);
        return new AuthDtos.MessageResponse("Session revoked");
    }
}

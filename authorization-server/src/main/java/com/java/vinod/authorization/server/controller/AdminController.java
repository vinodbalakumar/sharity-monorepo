package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.admin.AdminDtos;
import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.util.ValidationMessages;
import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.service.AdminService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<AdminDtos.AdminUserResponse> users() {
        return adminService.users();
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
    public List<AdminDtos.AuditLogResponse> auditLogs() {
        return adminService.auditLogs();
    }
}

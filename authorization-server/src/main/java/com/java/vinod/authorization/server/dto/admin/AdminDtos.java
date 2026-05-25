package com.java.vinod.authorization.server.dto.admin;

import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record AdminUserResponse(
            String publicId,
            String email,
            String username,
            String status,
            boolean emailVerified,
            LocalDateTime createdAt,
            List<String> roles,
            List<String> apps
    ) {
    }

    public record UpdateStatusRequest(
            @NotBlank(message = ValidationMessages.STATUS_REQUIRED)
            @Pattern(regexp = ValidationMessages.STATUS_PATTERN, message = ValidationMessages.STATUS_INVALID)
            String status
    ) {
    }

    public record RoleRequest(
            @NotBlank(message = ValidationMessages.ROLE_REQUIRED)
            @Pattern(regexp = ValidationMessages.UPPER_CODE_PATTERN, message = ValidationMessages.ROLE_INVALID)
            String role
    ) {
    }

    public record ApplicationAccessRequest(
            @NotBlank(message = ValidationMessages.APP_CODE_REQUIRED)
            @Pattern(regexp = ValidationMessages.UPPER_CODE_PATTERN, message = ValidationMessages.APP_CODE_INVALID)
            String appCode
    ) {
    }

    public record CreateApplicationRequest(
            @NotBlank(message = ValidationMessages.APP_CODE_REQUIRED)
            @Pattern(regexp = ValidationMessages.UPPER_CODE_PATTERN, message = ValidationMessages.APP_CODE_INVALID)
            String appCode,
            @NotBlank(message = ValidationMessages.APP_NAME_REQUIRED)
            @Size(max = 150, message = ValidationMessages.APP_NAME_SIZE)
            String appName,
            @Size(max = 255, message = ValidationMessages.DESCRIPTION_SIZE)
            String description,
            Boolean active
    ) {
    }

    public record ApplicationResponse(String appCode, String appName, String description, boolean active) {
    }

    public record AuditLogResponse(
            Long id,
            String actorPublicId,
            String targetPublicId,
            String action,
            String entityType,
            String entityId,
            String ipAddress,
            LocalDateTime createdAt
    ) {
    }
}

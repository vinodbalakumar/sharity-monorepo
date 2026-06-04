package com.java.vinod.authorization.server.dto.admin;

import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
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
            String profileCompletionStatus,
            boolean emailVerified,
            LocalDateTime createdAt,
            ProfileSummary profile,
            List<String> roles,
            List<String> apps
    ) {
    }

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
    }

    public record ProfileSummary(
            String firstName,
            String lastName,
            String phoneNumber,
            String phoneDialCode,
            String countryCode,
            String countryName,
            String dateOfBirth,
            String gender,
            String profileImageUrl
    ) {
    }

    public record CreateUserRequest(
            @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
            @jakarta.validation.constraints.Email(message = ValidationMessages.EMAIL_INVALID)
            String email,
            @NotBlank(message = ValidationMessages.REQUIRED)
            @Size(max = 100, message = ValidationMessages.USERNAME_SIZE)
            String username,
            @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
            @Size(min = 8, max = 100, message = ValidationMessages.PASSWORD_SIZE)
            @Pattern(regexp = ValidationMessages.PASSWORD_PATTERN, message = ValidationMessages.PASSWORD_COMPLEXITY)
            String password,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String firstName,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String lastName,
            @NotBlank(message = ValidationMessages.PHONE_REQUIRED)
            @Size(max = 30, message = ValidationMessages.PHONE_SIZE)
            String phoneNumber,
            @NotBlank(message = ValidationMessages.COUNTRY_CODE_REQUIRED)
            @Size(max = 3, message = ValidationMessages.COUNTRY_CODE_SIZE)
            String countryCode,
            @Size(max = 100, message = ValidationMessages.COUNTRY_NAME_SIZE)
            String countryName,
            @Size(max = 10, message = ValidationMessages.PHONE_DIAL_CODE_SIZE)
            String phoneDialCode,
            @PastOrPresent(message = ValidationMessages.DATE_OF_BIRTH_PAST_OR_PRESENT)
            LocalDate dateOfBirth,
            @Pattern(regexp = ValidationMessages.GENDER_PATTERN, message = ValidationMessages.GENDER_INVALID)
            String gender,
            Boolean emailVerified,
            String status,
            List<String> roles
    ) {
    }

    public record UpdateProfileRequest(
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String firstName,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String lastName,
            @Size(max = 30, message = ValidationMessages.PHONE_SIZE)
            String phoneNumber,
            @Size(max = 3, message = ValidationMessages.COUNTRY_CODE_SIZE)
            String countryCode,
            @Size(max = 100, message = ValidationMessages.COUNTRY_NAME_SIZE)
            String countryName,
            @Size(max = 10, message = ValidationMessages.PHONE_DIAL_CODE_SIZE)
            String phoneDialCode,
            @PastOrPresent(message = ValidationMessages.DATE_OF_BIRTH_PAST_OR_PRESENT)
            LocalDate dateOfBirth,
            @Pattern(regexp = ValidationMessages.GENDER_PATTERN, message = ValidationMessages.GENDER_INVALID)
            String gender,
            @Size(max = 500, message = ValidationMessages.PROFILE_IMAGE_URL_SIZE)
            String profileImageUrl
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

    public record RoleResponse(String roleName, String description, LocalDateTime createdAt) {
    }

    public record AuditLogResponse(
            Long id,
            String actorPublicId,
            String actorName,
            String actorEmail,
            String targetPublicId,
            String targetName,
            String targetEmail,
            String action,
            String entityType,
            String entityId,
            String ipAddress,
            LocalDateTime createdAt
    ) {
    }

    public record DashboardSummaryResponse(
            long totalUsers,
            long activeUsers,
            long pendingUsers,
            long lockedUsers,
            long suspendedUsers,
            long deletedUsers,
            long applications,
            long activeSessions,
            long auditEvents
    ) {
    }

    public record AdminSessionResponse(
            Long id,
            String deviceName,
            String ipAddress,
            String userAgent,
            LocalDateTime issuedAt,
            LocalDateTime expiresAt,
            LocalDateTime lastUsedAt
    ) {
    }
}

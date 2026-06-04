package com.java.vinod.authorization.server.dto.user;

import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class UserDtos {
    private UserDtos() {
    }

    public record MeResponse(
            String publicId,
            String email,
            String username,
            String status,
            String profileCompletionStatus,
            boolean emailVerified,
            ProfileResponse profile,
            List<String> roles,
            List<String> apps
    ) {
    }

    public record ProfileResponse(
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

    public record ChangePasswordRequest(
            @NotBlank(message = ValidationMessages.CURRENT_PASSWORD_REQUIRED)
            String currentPassword,
            @NotBlank(message = ValidationMessages.NEW_PASSWORD_REQUIRED)
            @Size(min = 8, max = 100, message = ValidationMessages.NEW_PASSWORD_SIZE)
            @Pattern(
                    regexp = ValidationMessages.PASSWORD_PATTERN,
                    message = ValidationMessages.NEW_PASSWORD_COMPLEXITY
            )
            String newPassword
    ) {
        @Override
        public String toString() {
            return "ChangePasswordRequest[currentPassword=***, newPassword=***]";
        }
    }

    public record SessionResponse(
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

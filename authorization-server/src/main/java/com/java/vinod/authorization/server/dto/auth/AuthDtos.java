package com.java.vinod.authorization.server.dto.auth;

import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
            @Email(message = ValidationMessages.EMAIL_INVALID)
            String email,
            @Size(max = 100, message = ValidationMessages.USERNAME_SIZE)
            String username,
            @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
            @Size(min = 8, max = 100, message = ValidationMessages.PASSWORD_SIZE)
            @Pattern(
                    regexp = ValidationMessages.PASSWORD_PATTERN,
                    message = ValidationMessages.PASSWORD_COMPLEXITY
            )
            String password,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String firstName,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String lastName
    ) {
        @Override
        public String toString() {
            return "RegisterRequest[email=%s, username=%s, password=***]".formatted(email, username);
        }
    }

    public record LoginRequest(
            @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
            @Email(message = ValidationMessages.EMAIL_INVALID)
            String email,
            @NotBlank(message = ValidationMessages.PASSWORD_REQUIRED)
            String password,
            @Size(max = 150, message = ValidationMessages.DEVICE_NAME_SIZE)
            String deviceName
    ) {
        @Override
        public String toString() {
            return "LoginRequest[email=%s, password=***, deviceName=%s]".formatted(email, deviceName);
        }
    }

    public record TokenResponse(
            String accessToken,
            String refreshToken,
            String tokenType,
            long expiresInSeconds
    ) {
    }

    public record UserSummary(
            String publicId,
            String email,
            String username,
            String status,
            boolean emailVerified,
            ProfileSummary profile,
            List<String> roles,
            List<String> apps
    ) {
    }

    public record ProfileSummary(String firstName, String lastName, String phoneNumber, String profileImageUrl) {
    }

    public record RefreshTokenRequest(
            @NotBlank(message = ValidationMessages.REFRESH_TOKEN_REQUIRED)
            String refreshToken,
            @Size(max = 150, message = ValidationMessages.DEVICE_NAME_SIZE)
            String deviceName
    ) {
        @Override
        public String toString() {
            return "RefreshTokenRequest[refreshToken=***, deviceName=%s]".formatted(deviceName);
        }
    }

    public record LogoutRequest(@NotBlank(message = ValidationMessages.REFRESH_TOKEN_REQUIRED) String refreshToken) {
        @Override
        public String toString() {
            return "LogoutRequest[refreshToken=***]";
        }
    }

    public record VerifyEmailRequest(@NotBlank(message = ValidationMessages.TOKEN_REQUIRED) String token) {
        @Override
        public String toString() {
            return "VerifyEmailRequest[token=***]";
        }
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = ValidationMessages.EMAIL_REQUIRED)
            @Email(message = ValidationMessages.EMAIL_INVALID)
            String email
    ) {
    }

    public record ForgotPasswordResponse(String message, String resetToken) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = ValidationMessages.TOKEN_REQUIRED)
            String token,
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
            return "ResetPasswordRequest[token=***, newPassword=***]";
        }
    }

    public record MessageResponse(String message) {
    }

    public record RegisterResponse(String publicId, String email, String status, String verificationToken) {
    }
}

package com.java.vinod.authorization.server.dto.auth;

import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
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
            @NotBlank(message = ValidationMessages.PHONE_REQUIRED)
            @Size(max = 30, message = ValidationMessages.PHONE_SIZE)
            String phoneNumber,
            @NotBlank(message = ValidationMessages.COUNTRY_CODE_REQUIRED)
            @Size(max = 3, message = ValidationMessages.COUNTRY_CODE_SIZE)
            String countryCode,
            @NotBlank(message = ValidationMessages.COUNTRY_NAME_REQUIRED)
            @Size(max = 100, message = ValidationMessages.COUNTRY_NAME_SIZE)
            String countryName,
            @NotBlank(message = ValidationMessages.PHONE_DIAL_CODE_REQUIRED)
            @Size(max = 10, message = ValidationMessages.PHONE_DIAL_CODE_SIZE)
            String phoneDialCode,
            @PastOrPresent(message = ValidationMessages.DATE_OF_BIRTH_PAST_OR_PRESENT)
            LocalDate dateOfBirth,
            @Pattern(regexp = ValidationMessages.GENDER_PATTERN, message = ValidationMessages.GENDER_INVALID)
            String gender,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String firstName,
            @Size(max = 100, message = ValidationMessages.NAME_SIZE)
            String lastName,
            @Size(max = 3, message = ValidationMessages.COUNTRY_CODE_SIZE)
            String detectedCountryCode,
            @Size(max = 100, message = ValidationMessages.COUNTRY_NAME_SIZE)
            String detectedCountryName,
            @Size(max = 40, message = ValidationMessages.DESCRIPTION_SIZE)
            String devicePlatform,
            @Size(max = 40, message = ValidationMessages.DESCRIPTION_SIZE)
            String deviceOsVersion,
            @Size(max = 40, message = ValidationMessages.DESCRIPTION_SIZE)
            String appVersion,
            @Size(max = 20, message = ValidationMessages.DESCRIPTION_SIZE)
            String locale,
            @Size(max = 100, message = ValidationMessages.DESCRIPTION_SIZE)
            String timezone,
            @Size(max = 100, message = ValidationMessages.DESCRIPTION_SIZE)
            String installationId
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
            String profileCompletionStatus,
            ProfileSummary profile,
            List<String> roles,
            List<String> apps
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
            String profileImageUrl,
            String privacySetting
    ) {
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

    public record SocialRegistrationSessionResponse(
            String provider,
            String email,
            String firstName,
            String lastName,
            String displayName
    ) {
    }

    public record RegistrationCountryOption(
            String countryCode,
            String countryName,
            String phoneDialCode,
            String defaultCurrencyCode
    ) {
    }

    public record RegistrationGenderOption(
            String code,
            String label
    ) {
    }

    public record RegistrationOptionsResponse(
            List<RegistrationCountryOption> countries,
            List<RegistrationGenderOption> genders
    ) {
    }

    public record SocialRegistrationCompletionRequest(
            @NotBlank(message = ValidationMessages.COUNTRY_CODE_REQUIRED)
            @Size(max = 3, message = ValidationMessages.COUNTRY_CODE_SIZE)
            String countryCode,
            @NotBlank(message = ValidationMessages.COUNTRY_NAME_REQUIRED)
            @Size(max = 100, message = ValidationMessages.COUNTRY_NAME_SIZE)
            String countryName,
            @NotBlank(message = ValidationMessages.PHONE_DIAL_CODE_REQUIRED)
            @Size(max = 10, message = ValidationMessages.PHONE_DIAL_CODE_SIZE)
            String phoneDialCode,
            @NotBlank(message = ValidationMessages.PHONE_REQUIRED)
            @Size(max = 30, message = ValidationMessages.PHONE_SIZE)
            String phoneNumber,
            @PastOrPresent(message = ValidationMessages.DATE_OF_BIRTH_PAST_OR_PRESENT)
            LocalDate dateOfBirth,
            @NotBlank(message = "Gender is required")
            @Pattern(regexp = ValidationMessages.GENDER_PATTERN, message = ValidationMessages.GENDER_INVALID)
            String gender,
            @NotBlank(message = "Username is required")
            @Size(max = 100, message = ValidationMessages.USERNAME_SIZE)
            String username,
            @NotBlank(message = "Privacy setting is required")
            @Size(max = 40, message = ValidationMessages.DESCRIPTION_SIZE)
            String privacySetting,
            @Size(max = 500, message = ValidationMessages.DESCRIPTION_SIZE)
            String profileImageUrl,
            boolean termsAccepted,
            @Size(max = 20, message = ValidationMessages.DESCRIPTION_SIZE)
            String locale,
            @Size(max = 100, message = ValidationMessages.DESCRIPTION_SIZE)
            String timezone
    ) {
    }

    public record ProfileImageUploadResponse(
            String profileImageUrl
    ) {
    }
}

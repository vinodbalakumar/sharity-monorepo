package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.user.UserDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.RefreshToken;
import com.java.vinod.authorization.server.entity.UserCredential;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.enums.Gender;
import com.java.vinod.authorization.server.enums.ProfileCompletionStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.RefreshTokenRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserSocialIdentityRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
public class UserService {
    private static final int MINIMUM_REGISTRATION_AGE = 13;
    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSocialIdentityRepository userSocialIdentityRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;
    private final EmailService emailService;
    private final String profileImageStorageProviderCode;
    private final String profileImageStorageBucketName;
    private final String profileImageStorageEndpointUrl;
    private final String profileImageStoragePublicBaseUrl;
    private final String profileImageStorageRegion;
    private final String profileImageStorageAccessKeyId;
    private final String profileImageStorageSecretAccessKey;
    private final long profileImageStorageMaxFileSizeBytes;

    public UserService(AppUserRepository appUserRepository,
                       UserProfileRepository userProfileRepository,
                       UserCredentialRepository userCredentialRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       UserSocialIdentityRepository userSocialIdentityRepository,
                       PasswordEncoder passwordEncoder,
                       UserMapper userMapper,
                       AuditService auditService,
                       EmailService emailService,
                       @Value("${app.profile-image-storage.provider-code:CLOUDFLARE_R2_PRIMARY}") String profileImageStorageProviderCode,
                       @Value("${app.profile-image-storage.bucket-name:sharity-assets}") String profileImageStorageBucketName,
                       @Value("${app.profile-image-storage.endpoint-url:}") String profileImageStorageEndpointUrl,
                       @Value("${app.profile-image-storage.public-base-url:}") String profileImageStoragePublicBaseUrl,
                       @Value("${app.profile-image-storage.region:auto}") String profileImageStorageRegion,
                       @Value("${app.profile-image-storage.access-key-id:}") String profileImageStorageAccessKeyId,
                       @Value("${app.profile-image-storage.secret-access-key:}") String profileImageStorageSecretAccessKey,
                       @Value("${app.profile-image-storage.max-file-size-bytes:5242880}") long profileImageStorageMaxFileSizeBytes) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.userCredentialRepository = userCredentialRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userSocialIdentityRepository = userSocialIdentityRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.auditService = auditService;
        this.emailService = emailService;
        this.profileImageStorageProviderCode = profileImageStorageProviderCode;
        this.profileImageStorageBucketName = profileImageStorageBucketName;
        this.profileImageStorageEndpointUrl = profileImageStorageEndpointUrl;
        this.profileImageStoragePublicBaseUrl = profileImageStoragePublicBaseUrl;
        this.profileImageStorageRegion = profileImageStorageRegion;
        this.profileImageStorageAccessKeyId = profileImageStorageAccessKeyId;
        this.profileImageStorageSecretAccessKey = profileImageStorageSecretAccessKey;
        this.profileImageStorageMaxFileSizeBytes = profileImageStorageMaxFileSizeBytes;
    }

    @Transactional(readOnly = true)
    public UserDtos.MeResponse me(Long userId) {
        return userMapper.me(loadUser(userId));
    }

    @Transactional
    public UserDtos.ProfileResponse updateProfile(Long userId, UserDtos.UpdateProfileRequest request) {
        AppUser user = loadUser(userId);
        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        profile.setFirstName(blankToNull(request.firstName()));
        profile.setLastName(blankToNull(request.lastName()));
        profile.setPhoneNumber(blankToNull(request.phoneNumber()));
        profile.setCountryCode(normalizeCountryCode(request.countryCode()));
        profile.setCountryName(blankToNull(request.countryName()));
        profile.setPhoneDialCode(blankToNull(request.phoneDialCode()));
        validateAge(request.dateOfBirth());
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setGender(parseOptionalGender(request.gender()));
        profile.setProfileImageUrl(blankToNull(request.profileImageUrl()));
        profile.setPrivacySetting(blankToNull(request.privacySetting()));
        profile.setUpdatedAt(LocalDateTime.now());
        user.setProfileCompletionStatus(profileCompletionStatus(profile));
        user.setProfileCompletedAt(user.getProfileCompletionStatus() == ProfileCompletionStatus.COMPLETE ? LocalDateTime.now() : null);
        user.setUpdatedAt(LocalDateTime.now());
        auditService.record(user, user, "PROFILE_UPDATED", "user_profile", String.valueOf(profile.getId()), null);
        return userMapper.profile(profile);
    }

    @Transactional
    public UserDtos.ProfileResponse uploadProfileImage(Long userId, MultipartFile file) {
        AppUser user = loadUser(userId);
        UserProfile profile = userProfileRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profile not found"));
        validateStorageConfigured();
        validateImage(file);

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read upload file");
        }

        String assetPublicId = UUID.randomUUID().toString();
        String objectKey = "profile-pictures/users/%s-%s".formatted(
                assetPublicId,
                safeFileName(file.getOriginalFilename(), contentType(file))
        );
        String publicUrl = profileImageStoragePublicBaseUrl.stripTrailing() + "/" + objectKey;

        try (S3Client s3Client = s3Client()) {
            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(profileImageStorageBucketName)
                            .key(objectKey)
                            .contentType(contentType(file))
                            .contentLength((long) bytes.length)
                            .cacheControl("public, max-age=31536000, immutable")
                            .build(),
                    RequestBody.fromBytes(bytes));
        } catch (S3Exception exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Unable to upload profile picture");
        }

        profile.setProfileImageUrl(publicUrl);
        profile.setUpdatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        auditService.record(user, user, "PROFILE_IMAGE_UPDATED", "user_profile", String.valueOf(profile.getId()), null);
        return userMapper.profile(profile);
    }

    @Transactional
    public void changePassword(Long userId, UserDtos.ChangePasswordRequest request) {
        AppUser user = loadUser(userId);
        UserCredential credential = userCredentialRepository.findByUser_Id(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Credential not found"));
        if (!passwordEncoder.matches(request.currentPassword(), credential.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        credential.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        credential.setPasswordChangedAt(LocalDateTime.now());
        credential.setUpdatedAt(LocalDateTime.now());
        revokeAllSessions(user, "PASSWORD_CHANGED");
        auditService.record(user, user, "PASSWORD_CHANGED", "user_credential", String.valueOf(credential.getId()), null);
        emailService.sendPasswordChangedNotification(user);
    }

    @Transactional(readOnly = true)
    public List<UserDtos.SessionResponse> sessions(Long userId) {
        return refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(userId).stream()
                .map(userMapper::session)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserDtos.SocialLinkResponse> socialLinks(Long userId) {
        return userSocialIdentityRepository.findByUser_IdAndEnabledTrue(userId).stream()
                .map(identity -> new UserDtos.SocialLinkResponse(
                        identity.getProvider().name(),
                        identity.getDisplayName()))
                .toList();
    }

    @Transactional
    public void revokeSession(Long userId, Long sessionId) {
        RefreshToken token = refreshTokenRepository.findByIdAndUser_Id(sessionId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        revoke(token, "USER_REVOKED");
    }

    @Transactional
    public void revokeAllSessions(Long userId) {
        revokeAllSessions(loadUser(userId), "USER_REVOKED_ALL");
    }

    private void revokeAllSessions(AppUser user, String reason) {
        refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(user.getId()).forEach(token -> revoke(token, reason));
    }

    private void revoke(RefreshToken token, String reason) {
        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
            token.setRevokedReason(reason);
        }
    }

    private AppUser loadUser(Long userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeCountryCode(String value) {
        return blankToNull(value) == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private void validateStorageConfigured() {
        if (blankToNull(profileImageStorageProviderCode) == null
                || blankToNull(profileImageStorageBucketName) == null
                || blankToNull(profileImageStorageEndpointUrl) == null
                || blankToNull(profileImageStoragePublicBaseUrl) == null
                || blankToNull(profileImageStorageRegion) == null
                || blankToNull(profileImageStorageAccessKeyId) == null
                || blankToNull(profileImageStorageSecretAccessKey) == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Profile image upload is not configured");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getSize() > profileImageStorageMaxFileSizeBytes) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Image file is too large");
        }
        String contentType = contentType(file);
        if (!List.of("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported image type");
        }
    }

    private S3Client s3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(profileImageStorageEndpointUrl))
                .region(Region.of(profileImageStorageRegion))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(profileImageStorageAccessKeyId, profileImageStorageSecretAccessKey)))
                .forcePathStyle(true)
                .build();
    }

    private String contentType(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType.toLowerCase(Locale.ROOT);
    }

    private String safeFileName(String original, String contentType) {
        String fallback = switch (contentType) {
            case "image/jpeg" -> "profile.jpg";
            case "image/png" -> "profile.png";
            case "image/webp" -> "profile.webp";
            default -> "profile.bin";
        };
        String candidate = original == null || original.isBlank() ? fallback : original;
        String cleaned = candidate.replace('\\', '/');
        cleaned = cleaned.substring(cleaned.lastIndexOf('/') + 1);
        cleaned = cleaned.replaceAll("[^A-Za-z0-9._-]", "-");
        return cleaned.isBlank() ? fallback : cleaned;
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

    private void validateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        if (dateOfBirth.isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
        if (Period.between(dateOfBirth, today).getYears() < MINIMUM_REGISTRATION_AGE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User must be at least 13 years old");
        }
    }

    private ProfileCompletionStatus profileCompletionStatus(UserProfile profile) {
        return blankToNull(profile.getPhoneNumber()) != null
                && blankToNull(profile.getCountryCode()) != null
                && blankToNull(profile.getCountryName()) != null
                && blankToNull(profile.getPhoneDialCode()) != null
                && profile.getDateOfBirth() != null
                && profile.getGender() != null
                ? ProfileCompletionStatus.COMPLETE
                : ProfileCompletionStatus.INCOMPLETE;
    }
}

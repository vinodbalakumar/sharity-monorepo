package com.java.vinod.authorization.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.SocialOAuthProviderConfig;
import com.java.vinod.authorization.server.entity.SocialRegistrationSession;
import com.java.vinod.authorization.server.entity.UserLoginMethod;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.entity.UserRole;
import com.java.vinod.authorization.server.entity.UserRoleId;
import com.java.vinod.authorization.server.entity.UserSocialIdentity;
import com.java.vinod.authorization.server.enums.Gender;
import com.java.vinod.authorization.server.enums.LoginProvider;
import com.java.vinod.authorization.server.enums.ProfileCompletionStatus;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.RoleRepository;
import com.java.vinod.authorization.server.repository.SocialOAuthProviderConfigRepository;
import com.java.vinod.authorization.server.repository.SocialRegistrationSessionRepository;
import com.java.vinod.authorization.server.repository.UserLoginMethodRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import com.java.vinod.authorization.server.repository.UserSocialIdentityRepository;
import com.java.vinod.authorization.server.util.TokenHashing;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class SocialRegistrationService {
    public static final String COOKIE_NAME = "SHARITY_SOCIAL_REGISTRATION";
    private static final int MINIMUM_REGISTRATION_AGE = 13;
    private static final Logger log = LoggerFactory.getLogger(SocialRegistrationService.class);

    private final AppUserRepository appUserRepository;
    private final UserSocialIdentityRepository userSocialIdentityRepository;
    private final UserLoginMethodRepository userLoginMethodRepository;
    private final UserProfileRepository userProfileRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final SocialRegistrationSessionRepository socialRegistrationSessionRepository;
    private final SocialOAuthProviderConfigRepository providerConfigRepository;
    private final TokenHashing tokenHashing;
    private final AuditService auditService;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final Environment environment;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Duration refreshTokenExpiration;
    private final String frontendCompleteRegistrationUrl;
    private final String frontendRegisterUrl;
    private final String frontendLoginSuccessUrl;
    private final String profileImageStorageProviderCode;
    private final String profileImageStorageBucketName;
    private final String profileImageStorageEndpointUrl;
    private final String profileImageStoragePublicBaseUrl;
    private final String profileImageStorageRegion;
    private final String profileImageStorageAccessKeyId;
    private final String profileImageStorageSecretAccessKey;
    private final long profileImageStorageMaxFileSizeBytes;

    public SocialRegistrationService(AppUserRepository appUserRepository,
                                     UserSocialIdentityRepository userSocialIdentityRepository,
                                     UserLoginMethodRepository userLoginMethodRepository,
                                     UserProfileRepository userProfileRepository,
                                     RoleRepository roleRepository,
                                     UserRoleRepository userRoleRepository,
                                     SocialRegistrationSessionRepository socialRegistrationSessionRepository,
                                     SocialOAuthProviderConfigRepository providerConfigRepository,
                                     TokenHashing tokenHashing,
                                     AuditService auditService,
                                     JwtService jwtService,
                                     UserMapper userMapper,
                                     Environment environment,
                                     @Value("${app.refresh-token.expiration}") Duration refreshTokenExpiration,
                                     @Value("${app.social.frontend-complete-registration-url:https://vinodbalakumar.com/app/complete-registration}") String frontendCompleteRegistrationUrl,
                                     @Value("${app.social.frontend-register-url:https://vinodbalakumar.com/app/register}") String frontendRegisterUrl,
                                     @Value("${app.social.frontend-login-success-url:https://vinodbalakumar.com/app/?login=success}") String frontendLoginSuccessUrl,
                                     @Value("${app.profile-image-storage.provider-code:CLOUDFLARE_R2_PRIMARY}") String profileImageStorageProviderCode,
                                     @Value("${app.profile-image-storage.bucket-name:sharity-assets}") String profileImageStorageBucketName,
                                     @Value("${app.profile-image-storage.endpoint-url:}") String profileImageStorageEndpointUrl,
                                     @Value("${app.profile-image-storage.public-base-url:}") String profileImageStoragePublicBaseUrl,
                                     @Value("${app.profile-image-storage.region:auto}") String profileImageStorageRegion,
                                     @Value("${app.profile-image-storage.access-key-id:}") String profileImageStorageAccessKeyId,
                                     @Value("${app.profile-image-storage.secret-access-key:}") String profileImageStorageSecretAccessKey,
                                     @Value("${app.profile-image-storage.max-file-size-bytes:5242880}") long profileImageStorageMaxFileSizeBytes) {
        this.appUserRepository = appUserRepository;
        this.userSocialIdentityRepository = userSocialIdentityRepository;
        this.userLoginMethodRepository = userLoginMethodRepository;
        this.userProfileRepository = userProfileRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.socialRegistrationSessionRepository = socialRegistrationSessionRepository;
        this.providerConfigRepository = providerConfigRepository;
        this.tokenHashing = tokenHashing;
        this.auditService = auditService;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
        this.environment = environment;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.frontendCompleteRegistrationUrl = frontendCompleteRegistrationUrl;
        this.frontendRegisterUrl = frontendRegisterUrl;
        this.frontendLoginSuccessUrl = frontendLoginSuccessUrl;
        this.profileImageStorageProviderCode = profileImageStorageProviderCode;
        this.profileImageStorageBucketName = profileImageStorageBucketName;
        this.profileImageStorageEndpointUrl = profileImageStorageEndpointUrl;
        this.profileImageStoragePublicBaseUrl = profileImageStoragePublicBaseUrl;
        this.profileImageStorageRegion = profileImageStorageRegion;
        this.profileImageStorageAccessKeyId = profileImageStorageAccessKeyId;
        this.profileImageStorageSecretAccessKey = profileImageStorageSecretAccessKey;
        this.profileImageStorageMaxFileSizeBytes = profileImageStorageMaxFileSizeBytes;
    }

    @Transactional
    public URI start(LoginProvider provider, String flow) {
        return startSession(provider, flow, null);
    }

    @Transactional
    public URI startLink(LoginProvider provider, Long userId) {
        appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return startSession(provider, "link", userId);
    }

    private URI startSession(LoginProvider provider, String flow, Long linkUserId) {
        SocialOAuthProviderConfig config = providerConfig(provider);
        String state = tokenHashing.newOpaqueToken();
        LocalDateTime now = LocalDateTime.now();
        SocialRegistrationSession session = new SocialRegistrationSession();
        session.setStateHash(tokenHashing.sha256(state));
        session.setProvider(provider);
        session.setFlow(blankToNull(flow) == null ? "login" : flow.trim().toLowerCase(Locale.ROOT));
        session.setLinkUserId(linkUserId);
        session.setCreatedAt(now);
        session.setExpiresAt(now.plusMinutes(10));
        socialRegistrationSessionRepository.save(session);
        return authorizationUri(config, state);
    }

    @Transactional
    public CallbackResult completeProviderCallback(LoginProvider provider, String code, String idToken, String state,
                                                   HttpServletRequest request) {
        ProviderIdentity identity = verifyIdentity(provider, code, idToken);
        return completeVerifiedProviderCallback(provider, identity, state, request);
    }

    @Transactional
    CallbackResult completeVerifiedProviderCallback(LoginProvider provider, ProviderIdentity identity, String state,
                                                    HttpServletRequest request) {
        SocialRegistrationSession session = callbackSession(provider, state);
        session.setProviderSubject(identity.subject());
        session.setProviderEmail(identity.email());
        session.setProviderEmailVerified(identity.emailVerified());
        session.setFirstName(identity.firstName());
        session.setLastName(identity.lastName());
        session.setDisplayName(identity.displayName());

        if ("link".equals(session.getFlow())) {
            return linkFromCallback(session, identity, request);
        }
        return userSocialIdentityRepository.findByProviderAndProviderSubjectAndEnabledTrue(provider, identity.subject())
                .map(existing -> existingLogin(existing, session, request))
                .orElseGet(() -> newRegistrationOrConflict(session));
    }

    @Transactional(readOnly = true)
    public AuthDtos.SocialRegistrationSessionResponse currentSession(String completionToken) {
        SocialRegistrationSession session = validSession(completionToken);
        return new AuthDtos.SocialRegistrationSessionResponse(
                displayProvider(session.getProvider()),
                session.getProviderEmail(),
                session.getFirstName(),
                session.getLastName(),
                session.getDisplayName()
        );
    }

    @Transactional
    public AuthDtos.RegisterResponse complete(String completionToken,
                                              AuthDtos.SocialRegistrationCompletionRequest request,
                                              HttpServletRequest httpRequest) {
        validateCompletion(request);
        SocialRegistrationSession session = validSession(completionToken);
        String normalizedEmail = normalize(session.getProviderEmail());
        String normalizedUsername = normalize(request.username());
        AppUser user = resolveCompletionUser(session, normalizedEmail);
        if (appUserRepository.findByNormalizedUsername(normalizedUsername)
                .filter(existing -> !existing.getId().equals(user.getId()))
                .isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Username is already registered");
        }

        LocalDateTime now = LocalDateTime.now();
        upsertSocialIdentity(user, session, now);
        upsertLoginMethod(user, session, now);
        saveProfile(user, session, request, now);
        updateUserCompletionState(user, request, now);
        assignRole(user, "USER", null);
        assignRole(user, "CUSTOMER", null);
        session.setConsumedAt(now);
        auditService.record(user, user, "SOCIAL_REGISTRATION_COMPLETED", "app_user", user.getPublicId(), ip(httpRequest));
        return new AuthDtos.RegisterResponse(user.getPublicId(), user.getEmail(), user.getStatus().name(), null);
    }

    @Transactional(readOnly = true)
    public AuthDtos.ProfileImageUploadResponse uploadProfileImage(String completionToken, MultipartFile file, String altText) {
        validSession(completionToken);
        validateStorageConfigured();
        validateImage(file);
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unable to read upload file");
        }
        String assetPublicId = UUID.randomUUID().toString();
        String objectKey = "profile-pictures/social-registration/%s-%s".formatted(
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
        return new AuthDtos.ProfileImageUploadResponse(publicUrl);
    }

    @Transactional
    public AuthDtos.MessageResponse unlinkCurrentUser(Long userId, LoginProvider provider, HttpServletRequest request) {
        UserSocialIdentity identity = userSocialIdentityRepository.findByUser_IdAndProviderAndEnabledTrue(userId, provider)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Social identity not found"));
        long enabledLoginMethods = userLoginMethodRepository.countByUser_IdAndEnabledTrue(userId);
        if (enabledLoginMethods <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot remove the final login method");
        }
        LocalDateTime now = LocalDateTime.now();
        identity.setEnabled(false);
        identity.setUpdatedAt(now);
        userLoginMethodRepository.findByProviderAndProviderSubject(provider, identity.getProviderSubject())
                .ifPresent(method -> {
                    method.setEnabled(false);
                    method.setUpdatedAt(now);
                });
        AppUser user = identity.getUser();
        auditService.record(user, user, "SOCIAL_ACCOUNT_UNLINKED", "app_user", user.getPublicId(), ip(request));
        return new AuthDtos.MessageResponse(displayProvider(provider) + " account unlinked");
    }

    private CallbackResult linkFromCallback(SocialRegistrationSession session, ProviderIdentity identity,
                                            HttpServletRequest request) {
        if (session.getLinkUserId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid social link state");
        }
        AppUser user = appUserRepository.findById(session.getLinkUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        userSocialIdentityRepository.findByProviderAndProviderSubjectAndEnabledTrue(session.getProvider(), identity.subject())
                .ifPresent(existing -> {
                    if (!existing.getUser().getId().equals(user.getId())) {
                        throw new ApiException(HttpStatus.CONFLICT, displayProvider(session.getProvider()) + " account is linked to another user");
                    }
                });
        if (!normalize(user.getEmail()).equals(normalize(identity.email()))) {
            throw new ApiException(HttpStatus.CONFLICT, "Provider email does not match the logged-in user");
        }
        LocalDateTime now = LocalDateTime.now();
        if (!userSocialIdentityRepository.existsByUser_IdAndProviderAndEnabledTrue(user.getId(), session.getProvider())) {
            upsertSocialIdentity(user, session, now);
            upsertLoginMethod(user, session, now);
        }
        session.setConsumedAt(now);
        auditService.record(user, user, "SOCIAL_ACCOUNT_LINKED", "app_user", user.getPublicId(), ip(request));
        return CallbackResult.login(frontendLoginSuccessUrl, null, null, 0);
    }

    private CallbackResult existingLogin(UserSocialIdentity identity, SocialRegistrationSession session,
                                         HttpServletRequest request) {
        AppUser user = identity.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User is not active");
        }
        LocalDateTime now = LocalDateTime.now();
        user.setFailedLoginCount(0);
        user.setLastLoginAt(now);
        user.setUpdatedAt(now);
        identity.setProviderEmail(session.getProviderEmail());
        identity.setProviderEmailVerified(session.getProviderEmailVerified());
        identity.setUpdatedAt(now);
        session.setConsumedAt(now);
        AuthDtos.UserSummary userSummary = userMapper.authSummary(user);
        String accessToken = jwtService.createAccessToken(user, userSummary);
        auditService.record(user, user, "SOCIAL_USER_LOGIN", "app_user", user.getPublicId(), ip(request));
        return CallbackResult.login(frontendLoginSuccessUrl, accessToken, "Bearer", jwtService.accessTokenExpiresInSeconds());
    }

    private CallbackResult newRegistrationOrConflict(SocialRegistrationSession session) {
        appUserRepository.findByNormalizedEmail(normalize(session.getProviderEmail()))
                .ifPresent(existing -> session.setLinkUserId(existing.getId()));
        String completionToken = tokenHashing.newOpaqueToken();
        session.setCompletionTokenHash(tokenHashing.sha256(completionToken));
        session.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        return CallbackResult.registration(completionToken, completionRedirect(session.getProvider()));
    }

    private ProviderIdentity verifyIdentity(LoginProvider provider, String code, String idToken) {
        if (provider != LoginProvider.GOOGLE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported social provider");
        }
        SocialOAuthProviderConfig config = providerConfig(provider);
        String token = blankToNull(idToken) == null ? exchangeCode(config, code).get("id_token") : idToken;
        Jwt jwt = decodeProviderJwt(config.getJwkSetUri(), token);
        validateJwt(jwt, List.of("https://accounts.google.com", "accounts.google.com"), config.getClientId());
        return identity(jwt);
    }

    private SocialRegistrationSession callbackSession(LoginProvider provider, String state) {
        if (blankToNull(state) == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing social registration state");
        }
        SocialRegistrationSession session = socialRegistrationSessionRepository.findByStateHash(tokenHashing.sha256(state))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid social registration state"));
        if (session.getProvider() != provider || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired social registration state");
        }
        return session;
    }

    private URI authorizationUri(SocialOAuthProviderConfig config, String state) {
        return URI.create(config.getAuthorizationUri()
                + "?client_id=" + enc(config.getClientId())
                + "&redirect_uri=" + enc(config.getRedirectUri())
                + "&response_type=code"
                + "&scope=" + enc("openid email profile")
                + "&state=" + enc(state)
                + "&prompt=select_account");
    }

    private Map<String, String> exchangeCode(SocialOAuthProviderConfig config, String code) {
        if (blankToNull(code) == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing provider authorization code");
        }
        String clientSecret = environment.getProperty(config.getClientSecretEnvVar());
        if (blankToNull(clientSecret) == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, displayProvider(config.getProvider()) + " sign-in is not configured");
        }
        log.info("Preparing {} token exchange with clientId={}, redirectUri={}, secretStatus={}",
                displayProvider(config.getProvider()),
                maskClientId(config.getClientId()),
                config.getRedirectUri(),
                "set(len=" + clientSecret.length() + ")");
        String body = form(Map.of(
                "code", code,
                "client_id", config.getClientId(),
                "client_secret", clientSecret,
                "redirect_uri", config.getRedirectUri(),
                "grant_type", "authorization_code"));
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(config.getTokenUri()))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(12))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() > 299) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider token exchange failed");
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {
            });
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider token exchange failed");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider token exchange interrupted");
        }
    }

    private Jwt decodeProviderJwt(String jwkSetUri, String idToken) {
        if (blankToNull(idToken) == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Provider did not return an identity token");
        }
        try {
            JwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
            return decoder.decode(idToken);
        } catch (JwtException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Provider identity token is invalid");
        }
    }

    private void validateJwt(Jwt jwt, List<String> issuers, String audience) {
        String issuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();
        if (!issuers.contains(issuer) || !jwt.getAudience().contains(audience)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Provider identity token is invalid");
        }
        Instant expiresAt = jwt.getExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Provider identity token has expired");
        }
    }

    private ProviderIdentity identity(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (blankToNull(email) == null || blankToNull(jwt.getSubject()) == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Provider identity is incomplete");
        }
        return new ProviderIdentity(
                jwt.getSubject(),
                email,
                Boolean.TRUE.equals(jwt.getClaim("email_verified")) || "true".equalsIgnoreCase(jwt.getClaimAsString("email_verified")),
                jwt.getClaimAsString("given_name"),
                jwt.getClaimAsString("family_name"),
                jwt.getClaimAsString("name")
        );
    }

    private AppUser resolveCompletionUser(SocialRegistrationSession session, String normalizedEmail) {
        if (session.getLinkUserId() != null) {
            return appUserRepository.findById(session.getLinkUserId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        }
        return appUserRepository.findByNormalizedEmail(normalizedEmail)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    AppUser user = new AppUser();
                    user.setPublicId(UUID.randomUUID().toString());
                    user.setEmail(session.getProviderEmail());
                    user.setNormalizedEmail(normalizedEmail);
                    user.setStatus(UserStatus.ACTIVE);
                    user.setEmailVerified(Boolean.TRUE.equals(session.getProviderEmailVerified()));
                    user.setCreatedAt(now);
                    user.setUpdatedAt(now);
                    return appUserRepository.save(user);
                });
    }

    private void upsertSocialIdentity(AppUser user, SocialRegistrationSession session, LocalDateTime now) {
        UserSocialIdentity identity = userSocialIdentityRepository.findByUser_IdAndProviderAndEnabledTrue(user.getId(), session.getProvider())
                .orElseGet(UserSocialIdentity::new);
        identity.setUser(user);
        identity.setProvider(session.getProvider());
        identity.setProviderSubject(session.getProviderSubject());
        identity.setProviderEmail(session.getProviderEmail());
        identity.setProviderEmailVerified(session.getProviderEmailVerified());
        identity.setFirstName(session.getFirstName());
        identity.setLastName(session.getLastName());
        identity.setDisplayName(session.getDisplayName());
        identity.setEnabled(true);
        if (identity.getCreatedAt() == null) {
            identity.setCreatedAt(now);
        }
        identity.setUpdatedAt(now);
        userSocialIdentityRepository.save(identity);
    }

    private void upsertLoginMethod(AppUser user, SocialRegistrationSession session, LocalDateTime now) {
        UserLoginMethod loginMethod = userLoginMethodRepository.findByProviderAndProviderSubject(session.getProvider(), session.getProviderSubject())
                .orElseGet(UserLoginMethod::new);
        loginMethod.setUser(user);
        loginMethod.setProvider(session.getProvider());
        loginMethod.setProviderSubject(session.getProviderSubject());
        loginMethod.setProviderEmail(session.getProviderEmail());
        loginMethod.setProviderEmailVerified(session.getProviderEmailVerified());
        loginMethod.setEnabled(true);
        if (loginMethod.getCreatedAt() == null) {
            loginMethod.setCreatedAt(now);
        }
        loginMethod.setUpdatedAt(now);
        userLoginMethodRepository.save(loginMethod);
    }

    private void saveProfile(AppUser user, SocialRegistrationSession session,
                             AuthDtos.SocialRegistrationCompletionRequest request, LocalDateTime now) {
        UserProfile profile = userProfileRepository.findByUser_Id(user.getId())
                .orElseGet(UserProfile::new);
        profile.setUser(user);
        profile.setFirstName(blankToNull(session.getFirstName()));
        profile.setLastName(blankToNull(session.getLastName()));
        profile.setPhoneNumber(blankToNull(request.phoneNumber()));
        profile.setPhoneDialCode(blankToNull(request.phoneDialCode()));
        profile.setCountryCode(normalizeCountryCode(request.countryCode()));
        profile.setCountryName(blankToNull(request.countryName()));
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setGender(parseGender(request.gender()));
        profile.setPrivacySetting(request.privacySetting().trim());
        profile.setProfileImageUrl(blankToNull(request.profileImageUrl()));
        profile.setLocale(blankToNull(request.locale()));
        profile.setPreferredTimezone(blankToNull(request.timezone()));
        if (profile.getCreatedAt() == null) {
            profile.setCreatedAt(now);
        }
        profile.setUpdatedAt(now);
        userProfileRepository.save(profile);
    }

    private void updateUserCompletionState(AppUser user, AuthDtos.SocialRegistrationCompletionRequest request, LocalDateTime now) {
        user.setUsername(request.username().trim());
        user.setNormalizedUsername(normalize(request.username()));
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setProfileCompletionStatus(ProfileCompletionStatus.COMPLETE);
        user.setProfileCompletedAt(now);
        user.setTermsAcceptedAt(now);
        user.setUpdatedAt(now);
        appUserRepository.save(user);
    }

    private SocialRegistrationSession validSession(String completionToken) {
        if (blankToNull(completionToken) == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Social registration session is missing");
        }
        SocialRegistrationSession session = socialRegistrationSessionRepository.findByCompletionTokenHash(tokenHashing.sha256(completionToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Social registration session is invalid"));
        if (session.getConsumedAt() != null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Social registration session has expired");
        }
        return session;
    }

    private void validateCompletion(AuthDtos.SocialRegistrationCompletionRequest request) {
        if (!request.termsAccepted()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Terms must be accepted");
        }
        if (request.dateOfBirth() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth is required");
        }
        LocalDate today = LocalDate.now();
        if (request.dateOfBirth().isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
        if (Period.between(request.dateOfBirth(), today).getYears() < MINIMUM_REGISTRATION_AGE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User must be at least 13 years old");
        }
        parseGender(request.gender());
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
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .chunkedEncodingEnabled(false)
                        .build())
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

    private void assignRole(AppUser user, String roleName, AppUser assignedBy) {
        if (userRoleRepository.existsByUser_IdAndRole_RoleName(user.getId(), roleName)) {
            return;
        }
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role not configured"));
        UserRole userRole = new UserRole();
        userRole.setId(new UserRoleId(user.getId(), role.getId()));
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setAssignedAt(LocalDateTime.now());
        userRole.setAssignedBy(assignedBy);
        userRoleRepository.save(userRole);
    }

    private SocialOAuthProviderConfig providerConfig(LoginProvider provider) {
        if (provider != LoginProvider.GOOGLE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported social provider");
        }
        SocialOAuthProviderConfig config = providerConfigRepository.findByProviderAndEnabledTrue(provider)
                .orElseThrow(() -> new ApiException(HttpStatus.SERVICE_UNAVAILABLE, displayProvider(provider) + " sign-in is not configured"));
        if (blankToNull(config.getClientId()) == null || blankToNull(config.getRedirectUri()) == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, displayProvider(provider) + " sign-in is not configured");
        }
        return config;
    }

    private URI completionRedirect(LoginProvider provider) {
        return URI.create(frontendCompleteRegistrationUrl + "?provider=" + enc(displayProvider(provider)));
    }

    private Gender parseGender(String value) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gender is required");
        }
        try {
            return Gender.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid gender");
        }
    }

    private String normalizeCountryCode(String value) {
        return blankToNull(value) == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String displayProvider(LoginProvider provider) {
        return provider == LoginProvider.GOOGLE ? "Google" : provider.name();
    }

    private String ip(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return truncate(forwardedFor.split(",")[0].trim(), 45);
        }
        return truncate(request.getRemoteAddr(), 45);
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private String form(Map<String, String> values) {
        return values.entrySet().stream()
                .map(entry -> enc(entry.getKey()) + "=" + enc(entry.getValue()))
                .reduce((left, right) -> left + "&" + right)
                .orElse("");
    }

    private String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String maskClientId(String clientId) {
        if (blankToNull(clientId) == null) {
            return "<empty>";
        }
        String trimmed = clientId.trim();
        if (trimmed.length() <= 8) {
            return "****";
        }
        return trimmed.substring(0, 6) + "..." + trimmed.substring(trimmed.length() - 4);
    }

    public record CallbackResult(String completionToken, URI redirectUri, String accessToken, String tokenType,
                                 long expiresInSeconds) {
        static CallbackResult registration(String completionToken, URI redirectUri) {
            return new CallbackResult(completionToken, redirectUri, null, null, 0);
        }

        static CallbackResult login(String redirectUri, String accessToken, String tokenType, long expiresInSeconds) {
            return new CallbackResult(null, URI.create(redirectUri), accessToken, tokenType, expiresInSeconds);
        }

        public boolean registrationRequired() {
            return completionToken != null;
        }
    }

    public record ProviderIdentity(
            String subject,
            String email,
            boolean emailVerified,
            String firstName,
            String lastName,
            String displayName
    ) {
    }
}

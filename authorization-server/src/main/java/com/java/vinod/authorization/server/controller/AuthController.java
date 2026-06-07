package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.enums.LoginProvider;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.service.AuthReferenceDataService;
import com.java.vinod.authorization.server.service.AuthService;
import com.java.vinod.authorization.server.service.SocialRegistrationService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@RestController
@RequestMapping("/v1/auth")
/**
 * Exposes the identity lifecycle APIs used by the public app and browser login flow.
 *
 * <p>This controller owns registration, verification, login, token refresh, and
 * password recovery for the authorization-server boundary. Protected browser
 * session login is handled separately through Spring Security form login.</p>
 */
public class AuthController {
    private final AuthService authService;
    private final AuthReferenceDataService authReferenceDataService;
    private final SocialRegistrationService socialRegistrationService;
    private final String frontendRegisterUrl;

    /**
     * Creates the auth controller that delegates identity operations to the service layer.
     */
    public AuthController(AuthService authService,
                          AuthReferenceDataService authReferenceDataService,
                          SocialRegistrationService socialRegistrationService,
                          @Value("${app.social.frontend-register-url:https://vinodbalakumar.com/app/register}") String frontendRegisterUrl) {
        this.authService = authService;
        this.authReferenceDataService = authReferenceDataService;
        this.socialRegistrationService = socialRegistrationService;
        this.frontendRegisterUrl = frontendRegisterUrl;
    }

    /**
     * Registers a new identity and starts the email verification flow.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthDtos.RegisterResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest request,
                                                              HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, httpRequest));
    }

    /**
     * Starts real Google/Apple sign-up by redirecting the browser to the provider.
     */
    @GetMapping("/social/{provider}/start")
    public ResponseEntity<Void> startSocialRegistration(@PathVariable String provider,
                                                        @RequestParam(defaultValue = "register") String flow) {
        try {
            URI redirectUri = socialRegistrationService.start(provider(provider), flow);
            return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
        } catch (ApiException exception) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendRegisterUrl + "?socialError=" + enc(exception.getMessage())))
                    .build();
        }
    }

    /**
     * Handles Google's OAuth callback after the provider verifies the account.
     */
    @GetMapping("/social/google/callback")
    public ResponseEntity<Void> googleCallback(@RequestParam String code, @RequestParam String state,
                                               HttpServletRequest request) {
        SocialRegistrationService.CallbackResult result =
                socialRegistrationService.completeProviderCallback(LoginProvider.GOOGLE, code, null, state, request);
        return socialCallbackRedirect(result);
    }

    /**
     * Returns only safe provider profile details for the completion screen.
     */
    @GetMapping("/social/session")
    public AuthDtos.SocialRegistrationSessionResponse socialSession(
            @CookieValue(name = SocialRegistrationService.COOKIE_NAME, required = false) String completionToken) {
        return socialRegistrationService.currentSession(completionToken);
    }

    /**
     * Provides registration master data for public account forms.
     */
    @GetMapping("/public/registration-options")
    public AuthDtos.RegistrationOptionsResponse registrationOptions() {
        return authReferenceDataService.registrationOptions();
    }

    /**
     * Completes social sign-up by saving Sharity-required profile fields.
     */
    @PostMapping("/social/complete-registration")
    public ResponseEntity<AuthDtos.RegisterResponse> completeSocialRegistration(
            @CookieValue(name = SocialRegistrationService.COOKIE_NAME, required = false) String completionToken,
            @Valid @RequestBody AuthDtos.SocialRegistrationCompletionRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthDtos.RegisterResponse body = socialRegistrationService.complete(completionToken, request, httpRequest);
        response.addHeader(HttpHeaders.SET_COOKIE, expireSocialCookie().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    /**
     * Uploads a profile image for the active social registration session.
     */
    @PostMapping(value = "/social/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthDtos.ProfileImageUploadResponse uploadSocialProfileImage(
            @CookieValue(name = SocialRegistrationService.COOKIE_NAME, required = false) String completionToken,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String altText) {
        return socialRegistrationService.uploadProfileImage(completionToken, file, altText);
    }

    /**
     * Confirms an email verification token and activates the identity for sign-in.
     */
    @PostMapping("/verify-email")
    public AuthDtos.MessageResponse verifyEmail(@Valid @RequestBody AuthDtos.VerifyEmailRequest request,
                                                HttpServletRequest httpRequest) {
        return authService.verifyEmail(request, httpRequest);
    }

    /**
     * Issues an access token for the API login path used by mobile and test clients.
     */
    @PostMapping("/login")
    public AuthDtos.TokenResponse login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletRequest httpRequest) {
        return authService.login(request, httpRequest);
    }

    /**
     * Rotates the refresh token for long-lived API sessions.
     */
    @PostMapping("/refresh-token")
    public AuthDtos.TokenResponse refreshToken(@Valid @RequestBody AuthDtos.RefreshTokenRequest request,
                                               HttpServletRequest httpRequest) {
        return authService.refresh(request, httpRequest);
    }

    /**
     * Revokes the caller's refresh token family.
     */
    @PostMapping("/logout")
    public AuthDtos.MessageResponse logout(@Valid @RequestBody AuthDtos.LogoutRequest request) {
        return authService.logout(request);
    }

    /**
     * Starts the password recovery flow for the authenticated identity.
     */
    @PostMapping("/forgot-password")
    public AuthDtos.ForgotPasswordResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    /**
     * Applies a password reset token and stores the new encoded credential.
     */
    @PostMapping("/reset-password")
    public AuthDtos.MessageResponse resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    private ResponseEntity<Void> socialCallbackRedirect(SocialRegistrationService.CallbackResult result) {
        ResponseEntity.BodyBuilder response = ResponseEntity.status(HttpStatus.FOUND)
                .location(result.redirectUri());
        if (result.registrationRequired()) {
            response.header(HttpHeaders.SET_COOKIE, socialCookie(result.completionToken()).toString());
        } else if (result.accessToken() != null) {
            response.header(HttpHeaders.SET_COOKIE, accessTokenCookie(result).toString());
        }
        return response.build();
    }

    private ResponseCookie socialCookie(String completionToken) {
        return ResponseCookie.from(SocialRegistrationService.COOKIE_NAME, completionToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/authorization-server/api/v1/auth/social")
                .maxAge(Duration.ofMinutes(30))
                .build();
    }

    private ResponseCookie expireSocialCookie() {
        return ResponseCookie.from(SocialRegistrationService.COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/authorization-server/api/v1/auth/social")
                .maxAge(Duration.ZERO)
                .build();
    }

    private ResponseCookie accessTokenCookie(SocialRegistrationService.CallbackResult result) {
        return ResponseCookie.from("SHARITY_ACCESS_TOKEN", result.accessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(result.expiresInSeconds()))
                .build();
    }

    private LoginProvider provider(String value) {
        if ("google".equalsIgnoreCase(value)) {
            return LoginProvider.GOOGLE;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported social provider");
    }

    private String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

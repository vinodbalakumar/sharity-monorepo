package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    /**
     * Creates the auth controller that delegates identity operations to the service layer.
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
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
}

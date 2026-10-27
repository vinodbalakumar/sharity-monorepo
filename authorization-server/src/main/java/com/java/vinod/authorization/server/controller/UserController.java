package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.dto.user.UserDtos;
import com.java.vinod.authorization.server.enums.LoginProvider;
import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.service.SocialRegistrationService;
import com.java.vinod.authorization.server.service.UserService;
import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@RestController
@Validated
@RequestMapping("/v1/users/me")
/**
 * Exposes self-service account APIs for the authenticated identity.
 *
 * <p>The endpoints here are intentionally protected and cover profile,
 * password, and session-management actions for the current user only.</p>
 */
public class UserController {
    private final UserService userService;
    private final SocialRegistrationService socialRegistrationService;

    /**
     * Creates the self-service controller backed by the user profile service.
     */
    public UserController(UserService userService, SocialRegistrationService socialRegistrationService) {
        this.userService = userService;
        this.socialRegistrationService = socialRegistrationService;
    }

    /**
     * Returns the authenticated user's profile summary.
     */
    @GetMapping
    public UserDtos.MeResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.me(user.id());
    }

    /**
     * Updates the authenticated user's profile fields.
     */
    @PutMapping("/profile")
    public UserDtos.ProfileResponse updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @Valid @RequestBody UserDtos.UpdateProfileRequest request) {
        return userService.updateProfile(user.id(), request);
    }

    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserDtos.ProfileResponse uploadProfileImage(@AuthenticationPrincipal AuthenticatedUser user,
                                                       @RequestPart("file") MultipartFile file) {
        return userService.uploadProfileImage(user.id(), file);
    }

    /**
     * Changes the authenticated user's password.
     */
    @PutMapping("/password")
    public AuthDtos.MessageResponse changePassword(@AuthenticationPrincipal AuthenticatedUser user,
                                                   @Valid @RequestBody UserDtos.ChangePasswordRequest request) {
        userService.changePassword(user.id(), request);
        return new AuthDtos.MessageResponse("Password changed");
    }

    @GetMapping("/social/google/link/start")
    public ResponseEntity<Void> startGoogleLink(@AuthenticationPrincipal AuthenticatedUser user) {
        URI redirectUri = socialRegistrationService.startLink(LoginProvider.GOOGLE, user.id());
        return ResponseEntity.status(HttpStatus.FOUND).location(redirectUri).build();
    }

    @DeleteMapping("/social/google")
    public AuthDtos.MessageResponse unlinkGoogle(@AuthenticationPrincipal AuthenticatedUser user,
                                                 HttpServletRequest httpRequest) {
        return socialRegistrationService.unlinkCurrentUser(user.id(), LoginProvider.GOOGLE, httpRequest);
    }

    /**
     * Lists the authenticated user's active sessions.
     */
    @GetMapping("/sessions")
    public List<UserDtos.SessionResponse> sessions(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.sessions(user.id());
    }

    @GetMapping("/social-links")
    public List<UserDtos.SocialLinkResponse> socialLinks(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.socialLinks(user.id());
    }

    /**
     * Revokes one session by id for the authenticated user.
     */
    @DeleteMapping("/sessions/{id}")
    public AuthDtos.MessageResponse revokeSession(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @PathVariable @Positive(message = ValidationMessages.SESSION_ID_INVALID) Long id) {
        userService.revokeSession(user.id(), id);
        return new AuthDtos.MessageResponse("Session revoked");
    }

    /**
     * Revokes every active session for the authenticated user.
     */
    @DeleteMapping("/sessions")
    public AuthDtos.MessageResponse revokeAllSessions(@AuthenticationPrincipal AuthenticatedUser user) {
        userService.revokeAllSessions(user.id());
        return new AuthDtos.MessageResponse("All sessions revoked");
    }
}

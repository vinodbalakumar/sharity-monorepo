package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.dto.user.UserDtos;
import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.service.UserService;
import com.java.vinod.authorization.server.util.ValidationMessages;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    /**
     * Creates the self-service controller backed by the user profile service.
     */
    public UserController(UserService userService) {
        this.userService = userService;
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

    /**
     * Changes the authenticated user's password.
     */
    @PutMapping("/password")
    public AuthDtos.MessageResponse changePassword(@AuthenticationPrincipal AuthenticatedUser user,
                                                   @Valid @RequestBody UserDtos.ChangePasswordRequest request) {
        userService.changePassword(user.id(), request);
        return new AuthDtos.MessageResponse("Password changed");
    }

    /**
     * Lists the authenticated user's active sessions.
     */
    @GetMapping("/sessions")
    public List<UserDtos.SessionResponse> sessions(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.sessions(user.id());
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

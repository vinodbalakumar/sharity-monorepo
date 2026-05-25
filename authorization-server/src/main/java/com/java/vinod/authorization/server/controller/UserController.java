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
@RequestMapping("/api/v1/users/me")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public UserDtos.MeResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.me(user.id());
    }

    @PutMapping("/profile")
    public UserDtos.ProfileResponse updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @Valid @RequestBody UserDtos.UpdateProfileRequest request) {
        return userService.updateProfile(user.id(), request);
    }

    @PutMapping("/password")
    public AuthDtos.MessageResponse changePassword(@AuthenticationPrincipal AuthenticatedUser user,
                                                   @Valid @RequestBody UserDtos.ChangePasswordRequest request) {
        userService.changePassword(user.id(), request);
        return new AuthDtos.MessageResponse("Password changed");
    }

    @GetMapping("/sessions")
    public List<UserDtos.SessionResponse> sessions(@AuthenticationPrincipal AuthenticatedUser user) {
        return userService.sessions(user.id());
    }

    @DeleteMapping("/sessions/{id}")
    public AuthDtos.MessageResponse revokeSession(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @PathVariable @Positive(message = ValidationMessages.SESSION_ID_INVALID) Long id) {
        userService.revokeSession(user.id(), id);
        return new AuthDtos.MessageResponse("Session revoked");
    }

    @DeleteMapping("/sessions")
    public AuthDtos.MessageResponse revokeAllSessions(@AuthenticationPrincipal AuthenticatedUser user) {
        userService.revokeAllSessions(user.id());
        return new AuthDtos.MessageResponse("All sessions revoked");
    }
}

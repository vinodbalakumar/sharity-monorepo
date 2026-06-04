package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.admin.AdminDtos;
import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.dto.user.UserDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Application;
import com.java.vinod.authorization.server.entity.AuditLog;
import com.java.vinod.authorization.server.entity.RefreshToken;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.repository.ApplicationRepository;
import com.java.vinod.authorization.server.repository.UserApplicationAccessRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserMapper {
    private final UserRoleRepository userRoleRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserApplicationAccessRepository userApplicationAccessRepository;
    private final ApplicationRepository applicationRepository;

    public UserMapper(UserRoleRepository userRoleRepository,
                      UserProfileRepository userProfileRepository,
                      UserApplicationAccessRepository userApplicationAccessRepository,
                      ApplicationRepository applicationRepository) {
        this.userRoleRepository = userRoleRepository;
        this.userProfileRepository = userProfileRepository;
        this.userApplicationAccessRepository = userApplicationAccessRepository;
        this.applicationRepository = applicationRepository;
    }

    public List<String> roles(AppUser user) {
        return userRoleRepository.findRoleNamesByUserId(user.getId());
    }

    public List<String> apps(AppUser user) {
        return apps(user, roles(user));
    }

    private List<String> apps(AppUser user, List<String> roles) {
        if (roles.contains("SUPER_ADMIN")) {
            return List.of("*");
        }
        return userApplicationAccessRepository.findAppCodesByUserId(user.getId());
    }

    public List<AdminDtos.ApplicationResponse> applications() {
        return applicationRepository.findByActiveTrueOrderByAppCode().stream()
                .map(this::application)
                .toList();
    }

    public AdminDtos.ApplicationResponse application(Application application) {
        return new AdminDtos.ApplicationResponse(
                application.getAppCode(),
                application.getAppName(),
                application.getDescription(),
                application.isActive());
    }

    public AuthDtos.UserSummary authSummary(AppUser user) {
        AuthDtos.ProfileSummary profile = userProfileRepository.findByUser_Id(user.getId())
                .map(this::authProfile)
                .orElse(new AuthDtos.ProfileSummary(null, null, null, null, null, null, null, null, null));
        List<String> roles = roles(user);
        return new AuthDtos.UserSummary(
                user.getPublicId(),
                user.getEmail(),
                user.getUsername(),
                user.getStatus().name(),
                user.isEmailVerified(),
                user.getProfileCompletionStatus().name(),
                profile,
                roles,
                apps(user, roles));
    }

    public AuthDtos.ProfileSummary authProfile(UserProfile profile) {
        return new AuthDtos.ProfileSummary(
                profile.getFirstName(),
                profile.getLastName(),
                profile.getPhoneNumber(),
                profile.getPhoneDialCode(),
                profile.getCountryCode(),
                profile.getCountryName(),
                profile.getDateOfBirth() == null ? null : profile.getDateOfBirth().toString(),
                profile.getGender() == null ? null : profile.getGender().name(),
                profile.getProfileImageUrl());
    }

    public UserDtos.MeResponse me(AppUser user) {
        UserDtos.ProfileResponse profile = userProfileRepository.findByUser_Id(user.getId())
                .map(this::profile)
                .orElse(new UserDtos.ProfileResponse(null, null, null, null, null, null, null, null, null));
        List<String> roles = roles(user);
        return new UserDtos.MeResponse(
                user.getPublicId(),
                user.getEmail(),
                user.getUsername(),
                user.getStatus().name(),
                user.getProfileCompletionStatus().name(),
                user.isEmailVerified(),
                profile,
                roles,
                apps(user, roles));
    }

    public UserDtos.ProfileResponse profile(UserProfile profile) {
        return new UserDtos.ProfileResponse(
                profile.getFirstName(),
                profile.getLastName(),
                profile.getPhoneNumber(),
                profile.getPhoneDialCode(),
                profile.getCountryCode(),
                profile.getCountryName(),
                profile.getDateOfBirth() == null ? null : profile.getDateOfBirth().toString(),
                profile.getGender() == null ? null : profile.getGender().name(),
                profile.getProfileImageUrl());
    }

    public UserDtos.SessionResponse session(RefreshToken token) {
        return new UserDtos.SessionResponse(
                token.getId(),
                token.getDeviceName(),
                token.getIpAddress(),
                token.getUserAgent(),
                token.getIssuedAt(),
                token.getExpiresAt(),
                token.getLastUsedAt());
    }

    public AdminDtos.AdminUserResponse adminUser(AppUser user) {
        AdminDtos.ProfileSummary profile = userProfileRepository.findByUser_Id(user.getId())
                .map(this::adminProfile)
                .orElse(new AdminDtos.ProfileSummary(null, null, null, null, null, null, null, null, null));
        List<String> roles = roles(user);
        return new AdminDtos.AdminUserResponse(
                user.getPublicId(),
                user.getEmail(),
                user.getUsername(),
                user.getStatus().name(),
                user.getProfileCompletionStatus().name(),
                user.isEmailVerified(),
                user.getCreatedAt(),
                profile,
                roles,
                apps(user, roles));
    }

    public AdminDtos.ProfileSummary adminProfile(UserProfile profile) {
        return new AdminDtos.ProfileSummary(
                profile.getFirstName(),
                profile.getLastName(),
                profile.getPhoneNumber(),
                profile.getPhoneDialCode(),
                profile.getCountryCode(),
                profile.getCountryName(),
                profile.getDateOfBirth() == null ? null : profile.getDateOfBirth().toString(),
                profile.getGender() == null ? null : profile.getGender().name(),
                profile.getProfileImageUrl());
    }

    public AdminDtos.AuditLogResponse auditLog(AuditLog log) {
        return new AdminDtos.AuditLogResponse(
                log.getId(),
                log.getActorUser() == null ? null : log.getActorUser().getPublicId(),
                displayName(log.getActorUser()),
                log.getActorUser() == null ? null : log.getActorUser().getEmail(),
                log.getTargetUser() == null ? null : log.getTargetUser().getPublicId(),
                displayName(log.getTargetUser()),
                log.getTargetUser() == null ? null : log.getTargetUser().getEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getIpAddress(),
                log.getCreatedAt());
    }

    private String displayName(AppUser user) {
        if (user == null) {
            return null;
        }
        return userProfileRepository.findByUser_Id(user.getId())
                .map(profile -> {
                    String firstName = profile.getFirstName() == null ? "" : profile.getFirstName().trim();
                    String lastName = profile.getLastName() == null ? "" : profile.getLastName().trim();
                    String name = (firstName + " " + lastName).trim();
                    return name.isBlank() ? user.getUsername() : name;
                })
                .orElse(user.getUsername());
    }
}

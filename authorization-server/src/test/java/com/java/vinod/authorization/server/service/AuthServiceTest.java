package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.UserCredential;
import com.java.vinod.authorization.server.entity.UserLoginMethod;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.enums.Gender;
import com.java.vinod.authorization.server.enums.LoginProvider;
import com.java.vinod.authorization.server.enums.ProfileCompletionStatus;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.EmailVerificationTokenRepository;
import com.java.vinod.authorization.server.repository.LoginAttemptRepository;
import com.java.vinod.authorization.server.repository.PasswordResetTokenRepository;
import com.java.vinod.authorization.server.repository.RefreshTokenRepository;
import com.java.vinod.authorization.server.repository.RoleRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.repository.UserLoginMethodRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import com.java.vinod.authorization.server.util.TokenHashing;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void registerCreatesLocalLoginMethodForPasswordAccount() {
        AppUserRepository appUserRepository = mock(AppUserRepository.class);
        UserCredentialRepository userCredentialRepository = mock(UserCredentialRepository.class);
        UserLoginMethodRepository userLoginMethodRepository = mock(UserLoginMethodRepository.class);
        UserProfileRepository userProfileRepository = mock(UserProfileRepository.class);
        RoleRepository roleRepository = mock(RoleRepository.class);
        UserRoleRepository userRoleRepository = mock(UserRoleRepository.class);
        EmailVerificationTokenRepository emailVerificationTokenRepository = mock(EmailVerificationTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        Role userRole = new Role();
        ReflectionTestUtils.setField(userRole, "id", 7L);
        userRole.setRoleName("USER");
        userRole.setCreatedAt(LocalDateTime.now());

        when(appUserRepository.findByNormalizedEmail("person@example.com")).thenReturn(Optional.empty());
        when(appUserRepository.findByNormalizedUsername("person")).thenReturn(Optional.empty());
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 42L);
            return user;
        });
        when(userCredentialRepository.save(any(UserCredential.class))).thenAnswer(invocation -> {
            UserCredential credential = invocation.getArgument(0);
            ReflectionTestUtils.setField(credential, "id", 91L);
            return credential;
        });
        when(passwordEncoder.encode("Str0ngPass!")).thenReturn("encoded-password");
        when(userRoleRepository.existsByUser_IdAndRole_RoleName(42L, "USER")).thenReturn(false);
        when(roleRepository.findByRoleName("USER")).thenReturn(Optional.of(userRole));
        when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");

        AuthService authService = new AuthService(
                appUserRepository,
                userCredentialRepository,
                userLoginMethodRepository,
                userProfileRepository,
                roleRepository,
                userRoleRepository,
                mock(RefreshTokenRepository.class),
                emailVerificationTokenRepository,
                mock(PasswordResetTokenRepository.class),
                mock(LoginAttemptRepository.class),
                passwordEncoder,
                mock(DaoAuthenticationProvider.class),
                mock(JwtService.class),
                new TokenHashing(),
                mock(UserMapper.class),
                mock(AuditService.class),
                mock(EmailService.class),
                Duration.ofDays(7),
                true
        );

        AuthDtos.RegisterResponse response = authService.register(
                validRegisterRequest(),
                httpRequest
        );

        ArgumentCaptor<UserLoginMethod> loginMethodCaptor = ArgumentCaptor.forClass(UserLoginMethod.class);
        ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(userCaptor.capture());
        verify(userProfileRepository).save(profileCaptor.capture());
        verify(userLoginMethodRepository).save(loginMethodCaptor.capture());
        UserLoginMethod loginMethod = loginMethodCaptor.getValue();
        UserProfile profile = profileCaptor.getValue();
        AppUser user = userCaptor.getValue();

        assertThat(response.email()).isEqualTo("Person@Example.com");
        assertThat(response.status()).isEqualTo(UserStatus.PENDING_VERIFICATION.name());
        assertThat(user.getProfileCompletionStatus()).isEqualTo(ProfileCompletionStatus.COMPLETE);
        assertThat(user.getProfileCompletedAt()).isNotNull();
        assertThat(profile.getPhoneNumber()).isEqualTo("4805550100");
        assertThat(profile.getCountryCode()).isEqualTo("US");
        assertThat(profile.getCountryName()).isEqualTo("United States");
        assertThat(profile.getPhoneDialCode()).isEqualTo("+1");
        assertThat(profile.getDateOfBirth()).isEqualTo(LocalDate.of(1995, 8, 21));
        assertThat(profile.getGender()).isEqualTo(Gender.MALE);
        assertThat(loginMethod.getUser().getId()).isEqualTo(42L);
        assertThat(loginMethod.getProvider()).isEqualTo(LoginProvider.LOCAL);
        assertThat(loginMethod.getProviderEmail()).isEqualTo("Person@Example.com");
        assertThat(loginMethod.getProviderEmailVerified()).isFalse();
        assertThat(loginMethod.getPasswordCredential().getId()).isEqualTo(91L);
        assertThat(loginMethod.isEnabled()).isTrue();
        verify(passwordEncoder).encode(eq("Str0ngPass!"));
    }

    @Test
    void registerRejectsFutureDateOfBirth() {
        AuthService authService = authServiceWithMinimalMocks();

        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest(
                "person@example.com",
                "Person",
                "Str0ngPass!",
                "4805550100",
                "US",
                "United States",
                "+1",
                LocalDate.now().plusDays(1),
                "MALE",
                "Pat",
                "Example",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> authService.register(request, mock(HttpServletRequest.class)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Date of birth cannot be in the future");
    }

    @Test
    void registerRejectsUnsupportedGender() {
        AuthService authService = authServiceWithMinimalMocks();

        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest(
                "person@example.com",
                "Person",
                "Str0ngPass!",
                "4805550100",
                "US",
                "United States",
                "+1",
                LocalDate.of(1995, 8, 21),
                "RANDOM",
                "Pat",
                "Example",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> authService.register(request, mock(HttpServletRequest.class)))
                .isInstanceOf(ApiException.class)
                .hasMessage("Invalid gender");
    }

    @Test
    void registerEnforcesMinimumAge() {
        AuthService authService = authServiceWithMinimalMocks();

        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest(
                "person@example.com",
                "Person",
                "Str0ngPass!",
                "4805550100",
                "US",
                "United States",
                "+1",
                LocalDate.now().minusYears(12),
                "MALE",
                "Pat",
                "Example",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> authService.register(request, mock(HttpServletRequest.class)))
                .isInstanceOf(ApiException.class)
                .hasMessage("User must be at least 13 years old");
    }

    private AuthDtos.RegisterRequest validRegisterRequest() {
        return new AuthDtos.RegisterRequest(
                " Person@Example.com ",
                "Person",
                "Str0ngPass!",
                "4805550100",
                "us",
                "United States",
                "+1",
                LocalDate.of(1995, 8, 21),
                "MALE",
                "Pat",
                "Example",
                "US",
                "United States",
                "web",
                "Chrome",
                "1.0.0",
                "en-US",
                "America/Phoenix",
                "installation-123"
        );
    }

    private AuthService authServiceWithMinimalMocks() {
        return new AuthService(
                mock(AppUserRepository.class),
                mock(UserCredentialRepository.class),
                mock(UserLoginMethodRepository.class),
                mock(UserProfileRepository.class),
                mock(RoleRepository.class),
                mock(UserRoleRepository.class),
                mock(RefreshTokenRepository.class),
                mock(EmailVerificationTokenRepository.class),
                mock(PasswordResetTokenRepository.class),
                mock(LoginAttemptRepository.class),
                mock(PasswordEncoder.class),
                mock(DaoAuthenticationProvider.class),
                mock(JwtService.class),
                new TokenHashing(),
                mock(UserMapper.class),
                mock(AuditService.class),
                mock(EmailService.class),
                Duration.ofDays(7),
                true
        );
    }
}

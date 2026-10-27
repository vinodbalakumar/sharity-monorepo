package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.PasswordResetToken;
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
    void registerAllowsDateOfBirthAndGenderToBeOmittedForMvpRegistration() {
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
        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest(
                " Person@Example.com ",
                "Person",
                "Str0ngPass!",
                "4805550100",
                "us",
                "United States",
                "+1",
                null,
                null,
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

        AuthDtos.RegisterResponse response = authService.register(request, httpRequest);

        ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(userProfileRepository).save(profileCaptor.capture());
        UserProfile profile = profileCaptor.getValue();

        assertThat(response.email()).isEqualTo("Person@Example.com");
        assertThat(profile.getDateOfBirth()).isNull();
        assertThat(profile.getGender()).isNull();
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

    @Test
    void forgotPasswordGeneratesResetTokenAndSendsEmail() {
        AppUserRepository appUserRepository = mock(AppUserRepository.class);
        PasswordResetTokenRepository passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
        EmailService emailService = mock(EmailService.class);
        AppUser user = new AppUser();
        user.setEmail("person@example.com");
        user.setNormalizedEmail("person@example.com");
        user.setPublicId("user-public-id");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        when(appUserRepository.findByNormalizedEmail("person@example.com")).thenReturn(Optional.of(user));
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthService authService = new AuthService(
                appUserRepository,
                mock(UserCredentialRepository.class),
                mock(UserLoginMethodRepository.class),
                mock(UserProfileRepository.class),
                mock(RoleRepository.class),
                mock(UserRoleRepository.class),
                mock(RefreshTokenRepository.class),
                mock(EmailVerificationTokenRepository.class),
                passwordResetTokenRepository,
                mock(LoginAttemptRepository.class),
                mock(PasswordEncoder.class),
                mock(DaoAuthenticationProvider.class),
                mock(JwtService.class),
                new TokenHashing(),
                mock(UserMapper.class),
                mock(AuditService.class),
                emailService,
                Duration.ofDays(7),
                true
        );

        AuthDtos.ForgotPasswordResponse response = authService.forgotPassword(new AuthDtos.ForgotPasswordRequest("person@example.com"));

        assertThat(response.message()).contains("If the email is registered");
        assertThat(response.resetToken()).isNotBlank();
        verify(emailService).sendPasswordResetEmail(user, response.resetToken());
    }

    @Test
    void resetPasswordUpdatesCredentialAndConsumesToken() {
        AppUserRepository appUserRepository = mock(AppUserRepository.class);
        UserCredentialRepository userCredentialRepository = mock(UserCredentialRepository.class);
        PasswordResetTokenRepository passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
        RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        EmailService emailService = mock(EmailService.class);

        AppUser user = new AppUser();
        user.setId(77L);
        user.setPublicId("user-public-id");
        user.setEmail("person@example.com");
        user.setNormalizedEmail("person@example.com");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        UserCredential credential = new UserCredential();
        credential.setUser(user);
        credential.setPasswordHash("old-hash");
        credential.setPasswordChangedAt(LocalDateTime.now().minusDays(1));
        credential.setPasswordResetRequired(true);
        credential.setCreatedAt(LocalDateTime.now().minusDays(10));
        credential.setUpdatedAt(LocalDateTime.now().minusDays(1));

        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setTokenHash(new TokenHashing().sha256("reset-token"));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        token.setCreatedAt(LocalDateTime.now().minusMinutes(5));

        when(passwordResetTokenRepository.findByTokenHash(token.getTokenHash())).thenReturn(Optional.of(token));
        when(userCredentialRepository.findByUser_Id(77L)).thenReturn(Optional.of(credential));
        when(refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(77L)).thenReturn(java.util.List.of());
        when(passwordEncoder.encode("N3wPassw0rd!")).thenReturn("encoded-new-password");

        AuthService authService = new AuthService(
                appUserRepository,
                userCredentialRepository,
                mock(UserLoginMethodRepository.class),
                mock(UserProfileRepository.class),
                mock(RoleRepository.class),
                mock(UserRoleRepository.class),
                refreshTokenRepository,
                mock(EmailVerificationTokenRepository.class),
                passwordResetTokenRepository,
                mock(LoginAttemptRepository.class),
                passwordEncoder,
                mock(DaoAuthenticationProvider.class),
                mock(JwtService.class),
                new TokenHashing(),
                mock(UserMapper.class),
                mock(AuditService.class),
                emailService,
                Duration.ofDays(7),
                true
        );

        AuthDtos.MessageResponse response = authService.resetPassword(new AuthDtos.ResetPasswordRequest("reset-token", "N3wPassw0rd!"));

        assertThat(response.message()).isEqualTo("Password reset complete");
        assertThat(credential.getPasswordHash()).isEqualTo("encoded-new-password");
        assertThat(credential.isPasswordResetRequired()).isFalse();
        assertThat(token.getUsedAt()).isNotNull();
        verify(refreshTokenRepository).findByUser_IdAndRevokedAtIsNull(77L);
        verify(emailService).sendPasswordChangedNotification(user);
        verify(passwordEncoder).encode("N3wPassw0rd!");
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

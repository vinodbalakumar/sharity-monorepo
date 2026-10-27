package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.Role;
import com.java.vinod.authorization.server.entity.SocialRegistrationSession;
import com.java.vinod.authorization.server.entity.UserLoginMethod;
import com.java.vinod.authorization.server.entity.UserSocialIdentity;
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
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

class SocialRegistrationServiceTest {

    @Test
    void completeCreatesNewSocialUserWithCustomerRoleAndCompletionFields() {
        Fixture fixture = new Fixture();
        String completionToken = "completion-token";
        SocialRegistrationSession session = registrationSession();
        when(fixture.sessions.findByCompletionTokenHash(fixture.hashing.sha256(completionToken))).thenReturn(Optional.of(session));
        when(fixture.users.findByNormalizedEmail("relay@example.com")).thenReturn(Optional.empty());
        when(fixture.users.findByNormalizedUsername("pat")).thenReturn(Optional.empty());
        when(fixture.users.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            ReflectionTestUtils.setField(user, "id", 42L);
            return user;
        });
        fixture.roles();

        AuthDtos.RegisterResponse response = fixture.service.complete(completionToken, completionRequest(), fixture.request);

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        ArgumentCaptor<UserSocialIdentity> identityCaptor = ArgumentCaptor.forClass(UserSocialIdentity.class);
        ArgumentCaptor<UserLoginMethod> methodCaptor = ArgumentCaptor.forClass(UserLoginMethod.class);
        ArgumentCaptor<com.java.vinod.authorization.server.entity.UserProfile> profileCaptor = ArgumentCaptor.forClass(com.java.vinod.authorization.server.entity.UserProfile.class);
        verify(fixture.users, times(2)).save(userCaptor.capture());
        verify(fixture.socialIdentities).save(identityCaptor.capture());
        verify(fixture.loginMethods).save(methodCaptor.capture());
        verify(fixture.profiles).save(profileCaptor.capture());

        assertThat(response.email()).isEqualTo("relay@example.com");
        assertThat(userCaptor.getAllValues().get(1).getProfileCompletionStatus()).isEqualTo(ProfileCompletionStatus.COMPLETE);
        assertThat(userCaptor.getAllValues().get(1).getTermsAcceptedAt()).isNotNull();
        assertThat(identityCaptor.getValue().getProviderSubject()).isEqualTo("google-subject");
        assertThat(methodCaptor.getValue().getProvider()).isEqualTo(LoginProvider.GOOGLE);
        assertThat(profileCaptor.getValue().getProfileImageUrl()).isEqualTo("https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/profile-pictures/social-registration/test-profile.jpg");
        verify(fixture.roleAssignments).existsByUser_IdAndRole_RoleName(42L, "USER");
        verify(fixture.roleAssignments).existsByUser_IdAndRole_RoleName(42L, "CUSTOMER");
    }

    @Test
    void completeUpdatesExistingUserAndLinksGoogleWithoutCreatingDuplicateAccount() {
        Fixture fixture = new Fixture();
        String completionToken = "completion-token";
        SocialRegistrationSession session = registrationSession();
        session.setLinkUserId(42L);
        when(fixture.sessions.findByCompletionTokenHash(fixture.hashing.sha256(completionToken))).thenReturn(Optional.of(session));
        AppUser existing = activeUser(42L, "relay@example.com");
        existing.setUsername("legacy");
        existing.setNormalizedUsername("legacy");
        when(fixture.users.findById(42L)).thenReturn(Optional.of(existing));
        when(fixture.users.findByNormalizedUsername("pat")).thenReturn(Optional.empty());
        when(fixture.users.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
        fixture.roles();

        AuthDtos.RegisterResponse response = fixture.service.complete(completionToken, completionRequest(), fixture.request);

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(fixture.users).save(userCaptor.capture());
        assertThat(response.publicId()).isEqualTo("public-42");
        assertThat(userCaptor.getValue().getId()).isEqualTo(42L);
        assertThat(userCaptor.getValue().getUsername()).isEqualTo("pat");
    }

    @Test
    void existingSocialIdentityLogsInExistingUser() {
        Fixture fixture = new Fixture();
        String state = "state";
        SocialRegistrationSession session = stateSession(fixture.hashing, state, "login", null);
        AppUser user = activeUser(11L, "person@example.com");
        UserSocialIdentity identity = identity(user, "google-subject");
        when(fixture.sessions.findByStateHash(fixture.hashing.sha256(state))).thenReturn(Optional.of(session));
        when(fixture.socialIdentities.findByProviderAndProviderSubjectAndEnabledTrue(LoginProvider.GOOGLE, "google-subject"))
                .thenReturn(Optional.of(identity));
        when(fixture.mapper.authSummary(user)).thenReturn(new AuthDtos.UserSummary(
                user.getPublicId(), user.getEmail(), null, "ACTIVE", true, "COMPLETE", null, java.util.List.of("USER"), java.util.List.of()));
        when(fixture.jwt.createAccessToken(any(AppUser.class), any(AuthDtos.UserSummary.class))).thenReturn("app-access-token");
        when(fixture.jwt.accessTokenExpiresInSeconds()).thenReturn(900L);

        SocialRegistrationService.CallbackResult result = fixture.service.completeVerifiedProviderCallback(
                LoginProvider.GOOGLE, providerIdentity("person@example.com"), state, fixture.request);

        assertThat(result.registrationRequired()).isFalse();
        assertThat(result.accessToken()).isEqualTo("app-access-token");
        assertThat(user.getLastLoginAt()).isNotNull();
    }

    @Test
    void providerCallbackWithDuplicateEmailOpensCompletionFlow() {
        Fixture fixture = new Fixture();
        String state = "state";
        SocialRegistrationSession session = stateSession(fixture.hashing, state, "login", null);
        AppUser existing = activeUser(8L, "person@example.com");
        when(fixture.sessions.findByStateHash(fixture.hashing.sha256(state))).thenReturn(Optional.of(session));
        when(fixture.socialIdentities.findByProviderAndProviderSubjectAndEnabledTrue(LoginProvider.GOOGLE, "google-subject"))
                .thenReturn(Optional.empty());
        when(fixture.users.findByNormalizedEmail("person@example.com")).thenReturn(Optional.of(existing));

        SocialRegistrationService.CallbackResult result = fixture.service.completeVerifiedProviderCallback(
                LoginProvider.GOOGLE, providerIdentity("person@example.com"), state, fixture.request);

        assertThat(result.registrationRequired()).isTrue();
        assertThat(session.getLinkUserId()).isEqualTo(8L);
        assertThat(result.completionToken()).isNotBlank();
    }

    @Test
    void linkCallbackLinksProviderToAuthenticatedUserBoundInState() {
        Fixture fixture = new Fixture();
        String state = "state";
        AppUser user = activeUser(21L, "person@example.com");
        SocialRegistrationSession session = stateSession(fixture.hashing, state, "link", 21L);
        when(fixture.sessions.findByStateHash(fixture.hashing.sha256(state))).thenReturn(Optional.of(session));
        when(fixture.users.findById(21L)).thenReturn(Optional.of(user));
        when(fixture.socialIdentities.findByProviderAndProviderSubjectAndEnabledTrue(LoginProvider.GOOGLE, "google-subject"))
                .thenReturn(Optional.empty());
        when(fixture.socialIdentities.existsByUser_IdAndProviderAndEnabledTrue(21L, LoginProvider.GOOGLE)).thenReturn(false);

        SocialRegistrationService.CallbackResult result = fixture.service.completeVerifiedProviderCallback(
                LoginProvider.GOOGLE, providerIdentity("person@example.com"), state, fixture.request);

        assertThat(result.redirectUri().toString()).contains("/success");
        verify(fixture.socialIdentities).save(any(UserSocialIdentity.class));
        verify(fixture.loginMethods).save(any(UserLoginMethod.class));
    }

    @Test
    void unlinkDisablesSocialIdentityAndLoginMethod() {
        Fixture fixture = new Fixture();
        AppUser user = activeUser(21L, "person@example.com");
        UserSocialIdentity identity = identity(user, "google-subject");
        UserLoginMethod method = new UserLoginMethod();
        method.setProvider(LoginProvider.GOOGLE);
        method.setProviderSubject("google-subject");
        method.setEnabled(true);
        when(fixture.socialIdentities.findByUser_IdAndProviderAndEnabledTrue(21L, LoginProvider.GOOGLE)).thenReturn(Optional.of(identity));
        when(fixture.loginMethods.countByUser_IdAndEnabledTrue(21L)).thenReturn(2L);
        when(fixture.loginMethods.findByProviderAndProviderSubject(LoginProvider.GOOGLE, "google-subject")).thenReturn(Optional.of(method));

        fixture.service.unlinkCurrentUser(21L, LoginProvider.GOOGLE, fixture.request);

        assertThat(identity.isEnabled()).isFalse();
        assertThat(method.isEnabled()).isFalse();
    }

    @Test
    void unlinkRejectsRemovingFinalLoginMethod() {
        Fixture fixture = new Fixture();
        AppUser user = activeUser(21L, "person@example.com");
        when(fixture.socialIdentities.findByUser_IdAndProviderAndEnabledTrue(21L, LoginProvider.GOOGLE))
                .thenReturn(Optional.of(identity(user, "google-subject")));
        when(fixture.loginMethods.countByUser_IdAndEnabledTrue(21L)).thenReturn(1L);

        assertThatThrownBy(() -> fixture.service.unlinkCurrentUser(21L, LoginProvider.GOOGLE, fixture.request))
                .isInstanceOf(ApiException.class)
                .extracting("status")
                .isEqualTo(HttpStatus.CONFLICT);
    }

    private AuthDtos.SocialRegistrationCompletionRequest completionRequest() {
        return new AuthDtos.SocialRegistrationCompletionRequest(
                "US",
                "United States",
                "+1",
                "4805550100",
                LocalDate.of(1995, 8, 21),
                "MALE",
                "pat",
                "PRIVATE",
                "https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/profile-pictures/social-registration/test-profile.jpg",
                true,
                "en-US",
                "America/Phoenix"
        );
    }

    private SocialRegistrationSession registrationSession() {
        SocialRegistrationSession session = new SocialRegistrationSession();
        session.setProvider(LoginProvider.GOOGLE);
        session.setProviderSubject("google-subject");
        session.setProviderEmail("relay@example.com");
        session.setProviderEmailVerified(true);
        session.setFirstName("Pat");
        session.setLastName("Example");
        session.setFlow("login");
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        return session;
    }

    private SocialRegistrationSession stateSession(TokenHashing hashing, String state, String flow, Long linkUserId) {
        SocialRegistrationSession session = new SocialRegistrationSession();
        session.setStateHash(hashing.sha256(state));
        session.setProvider(LoginProvider.GOOGLE);
        session.setFlow(flow);
        session.setLinkUserId(linkUserId);
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        return session;
    }

    private SocialRegistrationService.ProviderIdentity providerIdentity(String email) {
        return new SocialRegistrationService.ProviderIdentity("google-subject", email, true, "Pat", "Example", "Pat Example");
    }

    private AppUser activeUser(Long id, String email) {
        AppUser user = new AppUser();
        ReflectionTestUtils.setField(user, "id", id);
        user.setPublicId("public-" + id);
        user.setEmail(email);
        user.setNormalizedEmail(email);
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }

    private UserSocialIdentity identity(AppUser user, String subject) {
        UserSocialIdentity identity = new UserSocialIdentity();
        identity.setUser(user);
        identity.setProvider(LoginProvider.GOOGLE);
        identity.setProviderSubject(subject);
        identity.setProviderEmail(user.getEmail());
        identity.setEnabled(true);
        identity.setCreatedAt(LocalDateTime.now());
        identity.setUpdatedAt(LocalDateTime.now());
        return identity;
    }

    private static class Fixture {
        final AppUserRepository users = mock(AppUserRepository.class);
        final UserSocialIdentityRepository socialIdentities = mock(UserSocialIdentityRepository.class);
        final UserLoginMethodRepository loginMethods = mock(UserLoginMethodRepository.class);
        final UserProfileRepository profiles = mock(UserProfileRepository.class);
        final RoleRepository roleRepository = mock(RoleRepository.class);
        final UserRoleRepository roleAssignments = mock(UserRoleRepository.class);
        final SocialRegistrationSessionRepository sessions = mock(SocialRegistrationSessionRepository.class);
        final SocialOAuthProviderConfigRepository providerConfigs = mock(SocialOAuthProviderConfigRepository.class);
        final AuditService audit = mock(AuditService.class);
        final JwtService jwt = mock(JwtService.class);
        final UserMapper mapper = mock(UserMapper.class);
        final Environment environment = mock(Environment.class);
        final HttpServletRequest request = mock(HttpServletRequest.class);
        final TokenHashing hashing = new TokenHashing();
        final SocialRegistrationService service = new SocialRegistrationService(
                users,
                socialIdentities,
                loginMethods,
                profiles,
                roleRepository,
                roleAssignments,
                sessions,
                providerConfigs,
                hashing,
                audit,
                jwt,
                mapper,
                environment,
                Duration.ofDays(7),
                "https://vinodbalakumar.com/app/complete-registration",
                "https://vinodbalakumar.com/app/register",
                "https://vinodbalakumar.com/app/auth/social/success",
                "CLOUDFLARE_R2_PRIMARY",
                "sharity-assets",
                "https://75beeb37d05b7246321551b1684495e5.r2.cloudflarestorage.com",
                "https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev",
                "auto",
                "access-key",
                "secret-key",
                5_242_880L
        );

        void roles() {
            Role user = role("USER", 1L);
            Role customer = role("CUSTOMER", 2L);
            when(roleAssignments.existsByUser_IdAndRole_RoleName(42L, "USER")).thenReturn(false);
            when(roleAssignments.existsByUser_IdAndRole_RoleName(42L, "CUSTOMER")).thenReturn(false);
            when(roleRepository.findByRoleName("USER")).thenReturn(Optional.of(user));
            when(roleRepository.findByRoleName("CUSTOMER")).thenReturn(Optional.of(customer));
        }

        private Role role(String name, Long id) {
            Role role = new Role();
            ReflectionTestUtils.setField(role, "id", id);
            role.setRoleName(name);
            role.setCreatedAt(LocalDateTime.now());
            return role;
        }
    }
}

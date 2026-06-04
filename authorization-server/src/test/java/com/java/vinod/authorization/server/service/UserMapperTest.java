package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.dto.user.UserDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import com.java.vinod.authorization.server.entity.UserProfile;
import com.java.vinod.authorization.server.enums.UserStatus;
import com.java.vinod.authorization.server.repository.ApplicationRepository;
import com.java.vinod.authorization.server.repository.UserApplicationAccessRepository;
import com.java.vinod.authorization.server.repository.UserProfileRepository;
import com.java.vinod.authorization.server.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserMapperTest {

    @Test
    void authSummaryUsesResolvedRoleAndAppCodeQueries() {
        UserRoleRepository userRoleRepository = mock(UserRoleRepository.class);
        UserProfileRepository userProfileRepository = mock(UserProfileRepository.class);
        UserApplicationAccessRepository userApplicationAccessRepository = mock(UserApplicationAccessRepository.class);
        ApplicationRepository applicationRepository = mock(ApplicationRepository.class);
        UserMapper userMapper = new UserMapper(
                userRoleRepository,
                userProfileRepository,
                userApplicationAccessRepository,
                applicationRepository);

        AppUser user = newUser();
        UserProfile profile = new UserProfile();
        profile.setFirstName("Vinod");
        profile.setLastName("Balakumar");
        profile.setPhoneNumber("+1-555-0100");
        profile.setProfileImageUrl("https://example.invalid/profile.png");

        when(userProfileRepository.findByUser_Id(1L)).thenReturn(Optional.of(profile));
        when(userRoleRepository.findRoleNamesByUserId(1L)).thenReturn(List.of("ADMIN", "SELLER"));
        when(userApplicationAccessRepository.findAppCodesByUserId(1L)).thenReturn(List.of("APP", "MARKETPLACE"));

        AuthDtos.UserSummary summary = userMapper.authSummary(user);

        assertThat(summary.roles()).containsExactly("ADMIN", "SELLER");
        assertThat(summary.apps()).containsExactly("APP", "MARKETPLACE");
        assertThat(summary.profile().firstName()).isEqualTo("Vinod");
        assertThat(summary.profile().lastName()).isEqualTo("Balakumar");

        verify(userRoleRepository).findRoleNamesByUserId(1L);
        verify(userApplicationAccessRepository).findAppCodesByUserId(1L);
    }

    @Test
    void meUsesResolvedRoleAndAppCodeQueries() {
        UserRoleRepository userRoleRepository = mock(UserRoleRepository.class);
        UserProfileRepository userProfileRepository = mock(UserProfileRepository.class);
        UserApplicationAccessRepository userApplicationAccessRepository = mock(UserApplicationAccessRepository.class);
        ApplicationRepository applicationRepository = mock(ApplicationRepository.class);
        UserMapper userMapper = new UserMapper(
                userRoleRepository,
                userProfileRepository,
                userApplicationAccessRepository,
                applicationRepository);

        AppUser user = newUser();
        when(userProfileRepository.findByUser_Id(1L)).thenReturn(Optional.empty());
        when(userRoleRepository.findRoleNamesByUserId(1L)).thenReturn(List.of("CUSTOMER"));
        when(userApplicationAccessRepository.findAppCodesByUserId(1L)).thenReturn(List.of("MARKETPLACE"));

        UserDtos.MeResponse response = userMapper.me(user);

        assertThat(response.roles()).containsExactly("CUSTOMER");
        assertThat(response.apps()).containsExactly("MARKETPLACE");
    }

    private static AppUser newUser() {
        AppUser user = new AppUser();
        user.setId(1L);
        user.setPublicId("public-id");
        user.setEmail("vinodbalakumar.p@gmail.com");
        user.setUsername("vinodbalakumar.p@gmail.com");
        user.setNormalizedEmail("vinodbalakumar.p@gmail.com");
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        return user;
    }
}

package com.java.vinod.authorization.server.config;

import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.security.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthorizationServerLoginConfigTest {

    @Test
    void oauthFormLoginUsesEmailBackedDaoAuthenticationProvider() {
        CustomUserDetailsService userDetailsService = mock(CustomUserDetailsService.class);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        DaoAuthenticationProvider provider = new AuthorizationServerConfig()
                .authServerAuthenticationProvider(userDetailsService, passwordEncoder);

        String rawPassword = "Password123!";
        UserDetails userDetails = AuthenticatedUser.from(
                newUser("admin@example.com"),
                passwordEncoder.encode(rawPassword),
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")),
                true);
        when(userDetailsService.loadUserByUsername("ADMIN@EXAMPLE.COM")).thenReturn(userDetails);

        var authentication = provider.authenticate(
                new UsernamePasswordAuthenticationToken("ADMIN@EXAMPLE.COM", rawPassword));

        assertThat(authentication).isNotNull();
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getName()).isEqualTo("admin@example.com");
        verify(userDetailsService).loadUserByUsername("ADMIN@EXAMPLE.COM");
    }

    @Test
    void loginFailureRedirectStaysUnderAuthorizationServerPrefix() throws Exception {
        String issuer = "https://vinodbalakumar.com/authorization-server/api";
        AuthenticationFailureHandler failureHandler = new AuthorizationServerConfig()
                .authorizationLoginFailureHandler(issuer);
        HttpServletRequest request = new MockHttpServletRequest("POST", "/authorization-server/api/login");
        ((MockHttpServletRequest) request).setContextPath("/authorization-server/api");
        HttpServletResponse response = new MockHttpServletResponse();

        failureHandler.onAuthenticationFailure(request, response, new BadCredentialsException("bad credentials"));

        assertThat(((MockHttpServletResponse) response).getRedirectedUrl())
                .isEqualTo(issuer + "/login?error");
    }

    private static com.java.vinod.authorization.server.entity.AppUser newUser(String email) {
        com.java.vinod.authorization.server.entity.AppUser user = new com.java.vinod.authorization.server.entity.AppUser();
        user.setId(1L);
        user.setPublicId("public-id");
        user.setEmail(email);
        user.setNormalizedEmail(email.toLowerCase());
        user.setStatus(com.java.vinod.authorization.server.enums.UserStatus.ACTIVE);
        return user;
    }
}

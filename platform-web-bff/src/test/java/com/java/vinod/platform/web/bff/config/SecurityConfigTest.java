package com.java.vinod.platform.web.bff.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    @Test
    void localSignInUsesAuthorizationAndCallbackPortsRatherThanTheUiPort() throws Exception {
        var properties = new BffProperties(
                new BffProperties.Security("http://localhost:9174", List.of("http://localhost:9174")),
                new BffProperties.OAuth2("sharity-web-bff", "test-secret",
                        "http://localhost:9090/login/oauth2/code/sharity-web-bff",
                        "http://localhost:9093/authorization-server/api",
                        "http://localhost:9093/authorization-server/api"),
                new BffProperties.Backends("", "", "", ""), new BffProperties.Web("http://localhost:9174/app/"));
        var config = new SecurityConfig();
        var registrations = config.clientRegistrationRepository(properties);
        var registration = registrations.findByRegistrationId("sharity-web-bff");
        assertThat(registration.getProviderDetails().getAuthorizationUri())
                .isEqualTo("http://localhost:9093/authorization-server/api/oauth2/authorize");
        assertThat(registration.getRedirectUri())
                .isEqualTo("http://localhost:9090/login/oauth2/code/sharity-web-bff");

        var request = new org.springframework.mock.web.MockHttpServletRequest(
                "GET", "/oauth2/authorization/sharity-web-bff");
        request.setServletPath("/oauth2/authorization/sharity-web-bff");
        request.addHeader("Origin", "http://localhost:9174");
        var authorization = config.authorizationRequestResolver(registrations, properties).resolve(request);
        assertThat(authorization.getAuthorizationUri()).isEqualTo(registration.getProviderDetails().getAuthorizationUri());
        assertThat(authorization.getRedirectUri()).isEqualTo(registration.getRedirectUri());

        var response = new org.springframework.mock.web.MockHttpServletResponse();
        config.oauth2LoginFailureHandler(properties).onAuthenticationFailure(request, response,
                new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                        new org.springframework.security.oauth2.core.OAuth2Error("authorization_request_not_found")));
        assertThat(response.getRedirectedUrl())
                .isEqualTo("http://localhost:9093/authorization-server/api/login?error=oauth");
    }

    @Test
    void successfulSignInClearsTheLogoutMarkerAndDoesNotDuplicateTheSuccessParameter() throws Exception {
        var properties = new BffProperties(null, null, null,
                new BffProperties.Web("https://vinodbalakumar.com/app/?login=success"));
        var request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setCookies(new jakarta.servlet.http.Cookie("sharity-force-login", "1"));
        var response = new org.springframework.mock.web.MockHttpServletResponse();
        new SecurityConfig().oauth2LoginSuccessHandler(properties).onAuthenticationSuccess(request, response,
                org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated("fixture",null,List.of()));
        assertThat(response.getHeader("Set-Cookie")).contains("sharity-force-login=", "Max-Age=0", "HttpOnly", "Secure");
        assertThat(response.getRedirectedUrl()).isEqualTo("https://vinodbalakumar.com/app/?login=success");
    }

    @Test
    void staleOauthCallbackRedirectsToPublicRecoveryPageDespiteInternalOrSpoofedHost() throws Exception {
        var properties = new BffProperties(
                new BffProperties.Security("https://vinodbalakumar.com", List.of("https://vinodbalakumar.com")),
                new BffProperties.OAuth2("test-client", "test-secret", "https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff",
                        "https://vinodbalakumar.com/authorization-server/api", "http://authorization-server:8080/authorization-server/api"),
                new BffProperties.Backends("", "", "", ""), new BffProperties.Web("https://vinodbalakumar.com/app/"));
        var request = new org.springframework.mock.web.MockHttpServletRequest();
        request.setScheme("http"); request.setServerName("untrusted.invalid"); request.setServerPort(8080);
        request.addHeader("X-Forwarded-Host", "untrusted.invalid:8080");
        var response = new org.springframework.mock.web.MockHttpServletResponse();
        new SecurityConfig().oauth2LoginFailureHandler(properties).onAuthenticationFailure(request, response,
                new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                        new org.springframework.security.oauth2.core.OAuth2Error("authorization_request_not_found")));
        assertThat(response.getRedirectedUrl()).isEqualTo("https://vinodbalakumar.com/authorization-server/api/login?error=oauth");
        assertThat(response.getRedirectedUrl()).doesNotContain("untrusted.invalid", ":8080");
    }

    @Test
    void browserOauthRegistrationRejectsLocalhostOverrides() {
        BffProperties properties = new BffProperties(
                new BffProperties.Security("https://vinodbalakumar.com", List.of("https://vinodbalakumar.com")),
                new BffProperties.OAuth2(
                        "sharity-web-bff",
                        "test-secret",
                        "https://localhost/login/oauth2/code/sharity-web-bff",
                        "https://localhost/authorization-server/api",
                        "http://localhost:8083/authorization-server/api"),
                new BffProperties.Backends(
                        "http://authorization-server:8080/authorization-server",
                        "http://marketplace-service:8080/marketplace-service",
                        "http://payment-service:8080/payment-service",
                        "http://wallet-service:8080/wallet-service"),
                new BffProperties.Web("https://vinodbalakumar.com/app/"));

        var registrations = new SecurityConfig().clientRegistrationRepository(properties);
        var registration = registrations.findByRegistrationId("sharity-web-bff");

        assertThat(registration.getProviderDetails().getAuthorizationUri())
                .isEqualTo("https://vinodbalakumar.com/authorization-server/api/oauth2/authorize");
        assertThat(registration.getRedirectUri())
                .isEqualTo("https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff");
    }
}

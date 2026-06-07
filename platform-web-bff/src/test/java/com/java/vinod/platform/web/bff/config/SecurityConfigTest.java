package com.java.vinod.platform.web.bff.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    @Test
    void browserOauthRegistrationRejectsLocalhostOverrides() {
        BffProperties properties = new BffProperties(
                new BffProperties.Security("https://vinodbalakumar.com"),
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

package com.java.vinod.authorization.server.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigurationTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(CorsOnlyConfiguration.class);

    @Test
    void standaloneLocalProfileAllowsTheUiAndCredentialedPreflight() {
        runner.withPropertyValues("spring.profiles.active=local").run(context -> {
            var source = context.getBean(CorsConfigurationSource.class);
            var request = request("GET", "http://localhost:9174");
            var response = new MockHttpServletResponse();
            assertThat(new DefaultCorsProcessor().processRequest(source.getCorsConfiguration(request), request, response)).isTrue();
            assertThat(response.getHeader("Access-Control-Allow-Origin")).isEqualTo("http://localhost:9174");
            assertThat(response.getHeader("Access-Control-Allow-Credentials")).isEqualTo("true");

            var preflight = request("OPTIONS", "http://localhost:9174");
            preflight.addHeader("Access-Control-Request-Method", "POST");
            preflight.addHeader("Access-Control-Request-Headers", "Content-Type");
            var preflightResponse = new MockHttpServletResponse();
            assertThat(new DefaultCorsProcessor().processRequest(source.getCorsConfiguration(preflight), preflight, preflightResponse)).isTrue();
            assertThat(preflightResponse.getHeader("Access-Control-Allow-Origin")).isEqualTo("http://localhost:9174");
        });
    }

    @Test
    void untrustedOriginIsRejected() {
        runner.withPropertyValues("spring.profiles.active=local").run(context -> {
            var request = request("GET", "https://untrusted.invalid");
            var response = new MockHttpServletResponse();
            var source = context.getBean(CorsConfigurationSource.class);
            assertThat(new DefaultCorsProcessor().processRequest(source.getCorsConfiguration(request), request, response)).isFalse();
            assertThat(response.getStatus()).isEqualTo(403);
            assertThat(response.getHeader("Access-Control-Allow-Origin")).isNull();
        });
    }

    @Test
    void nonLocalProfileDoesNotImplicitlyAllowTheLocalUi() {
        runner.withPropertyValues("spring.profiles.active=prod").run(context -> {
            var request = request("GET", "http://localhost:9174");
            assertThat(context.getBean(CorsConfigurationSource.class).getCorsConfiguration(request)
                    .checkOrigin("http://localhost:9174")).isNull();
        });
    }

    @Test
    void configuredDeploymentOriginReplacesLocalDefaults() {
        runner.withPropertyValues("spring.profiles.active=local",
                "app.web.allowed-origin=https://shop.example").run(context -> {
            var config = context.getBean(CorsConfigurationSource.class)
                    .getCorsConfiguration(request("GET", "https://shop.example"));
            assertThat(config.checkOrigin("https://shop.example")).isEqualTo("https://shop.example");
            assertThat(config.checkOrigin("http://localhost:9174")).isNull();
        });
    }

    private static MockHttpServletRequest request(String method, String origin) {
        var request = new MockHttpServletRequest(method, "/authorization-server/api/v1/auth/public/registration-options");
        request.setServerName("localhost");
        request.setServerPort(9093);
        request.addHeader("Origin", origin);
        return request;
    }

    @Configuration(proxyBeanMethods = false)
    static class CorsOnlyConfiguration {
        @Bean
        CorsConfigurationSource corsConfigurationSource(@Value("${app.web.allowed-origin:}") String allowedOrigin) {
            return new SecurityConfig().corsConfigurationSource(allowedOrigin);
        }
    }
}

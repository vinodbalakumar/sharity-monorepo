package com.java.vinod.marketplace.service.config;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationPropertiesTest {
    @ParameterizedTest
    @ValueSource(strings = {"local", "qa", "prod"})
    void sharedSettingsRemainAvailableAndLocalDefaultsStayIsolated(String profile) {
        var environment = new StandardEnvironment();
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().addFirst(new MapPropertySource("test-overrides",
                Map.of("spring.profiles.active", profile)));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);

        assertThat(environment.getProperty("spring.application.name")).isEqualTo("marketplace-service");
        assertThat(environment.getProperty("app.jwt.audience")).isEqualTo("MARKETPLACE_API");
        assertThat(environment.getProperty("spring.flyway.enabled")).isEqualTo("true");
        assertThat(environment.containsProperty("marketplace.local.database-url")).isEqualTo(profile.equals("local"));
        assertThat(environment.containsProperty("marketplace.local.server-port")).isEqualTo(profile.equals("local"));
    }
}

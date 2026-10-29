package com.java.vinod.platform.web.bff.config;

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

        assertThat(environment.getProperty("spring.application.name")).isEqualTo("platform-web-bff");
        assertThat(environment.getProperty("spring.flyway.table")).isEqualTo("platform_web_bff_flyway_schema_history");
        assertThat(environment.getProperty("app.oauth2.client-id")).isEqualTo("sharity-web-bff");
        assertThat(environment.containsProperty("bff.local.database-url")).isEqualTo(profile.equals("local"));
        assertThat(environment.containsProperty("bff.local.client-secret")).isEqualTo(profile.equals("local"));
    }
}

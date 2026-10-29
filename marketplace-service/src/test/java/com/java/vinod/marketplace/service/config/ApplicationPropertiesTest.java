package com.java.vinod.marketplace.service.config;

import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationPropertiesTest {
    @TempDir
    Path home;

    @ParameterizedTest
    @ValueSource(strings = {"local", "qa", "prod"})
    void sharedSettingsRemainAvailableAndLocalDefaultsStayIsolated(String profile) throws Exception {
        Files.createDirectory(home.resolve(".sharity"));
        Files.writeString(home.resolve(".sharity/local-internal-service.properties"),
                "app.internal.service-token=test-only-shared-token\n");
        var environment = new StandardEnvironment();
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().addFirst(new MapPropertySource("test-overrides",
                Map.of("spring.profiles.active", profile, "user.home", home.toString())));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);

        assertThat(environment.getProperty("spring.application.name")).isEqualTo("marketplace-service");
        assertThat(environment.getProperty("app.jwt.audience")).isEqualTo("MARKETPLACE_API");
        assertThat(environment.getProperty("spring.flyway.enabled")).isEqualTo("true");
        assertThat(environment.containsProperty("marketplace.local.database-url")).isEqualTo(profile.equals("local"));
        assertThat(environment.containsProperty("marketplace.local.server-port")).isEqualTo(profile.equals("local"));
        assertThat(environment.getProperty("app.internal.service-token"))
                .isEqualTo(profile.equals("local") ? "test-only-shared-token" : null);
        assertThat(environment.getProperty("app.commerce.demo-purchases-enabled", Boolean.class))
                .isEqualTo(profile.equals("local"));
    }

    @ParameterizedTest
    @CsvSource({"local,true", "local,false", "qa,true", "qa,false", "prod,true", "prod,false"})
    void explicitDemoFlagOverridesProfileDefault(String profile, boolean enabled) {
        var environment = new StandardEnvironment();
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().addFirst(new MapPropertySource("test-overrides",
                Map.of("spring.profiles.active", profile, "user.home", home.toString(),
                        "COMMERCE_DEMO_PURCHASES_ENABLED", Boolean.toString(enabled))));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);

        assertThat(environment.getProperty("app.commerce.demo-purchases-enabled", Boolean.class)).isEqualTo(enabled);
    }
}

package com.java.vinod.payment.service.config;

import org.junit.jupiter.api.Test;
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
                "app.internal.service-token=${APP_INTERNAL_SERVICE_TOKEN:test-only-shared-token}\n");
        var environment = environment(Map.of("spring.profiles.active", profile));

        assertThat(environment.getProperty("spring.application.name")).isEqualTo("payment-service");
        assertThat(environment.getProperty("app.jwt.audience")).isEqualTo("PAYMENT_API");
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.containsProperty("payment.local.database-url")).isEqualTo(profile.equals("local"));
        assertThat(environment.containsProperty("payment.local.server-port")).isEqualTo(profile.equals("local"));
        assertThat(environment.getProperty("app.internal.service-token"))
                .isEqualTo(profile.equals("local") ? "test-only-shared-token" : null);
        assertThat(environment.getProperty("app.payment.demo-transactions-enabled", Boolean.class))
                .isEqualTo(profile.equals("local"));
    }

    @ParameterizedTest
    @CsvSource({"local,true", "local,false", "qa,true", "qa,false", "prod,true", "prod,false"})
    void explicitDemoFlagOverridesProfileDefault(String profile, boolean enabled) {
        assertThat(environment(Map.of("spring.profiles.active", profile,
                "COMMERCE_DEMO_PURCHASES_ENABLED", Boolean.toString(enabled)))
                .getProperty("app.payment.demo-transactions-enabled", Boolean.class)).isEqualTo(enabled);
    }

    @Test
    void explicitTokenOverridesLocalFile() throws Exception {
        Files.createDirectory(home.resolve(".sharity"));
        Files.writeString(home.resolve(".sharity/local-internal-service.properties"),
                "app.internal.service-token=${APP_INTERNAL_SERVICE_TOKEN:test-only-shared-token}\n");

        assertThat(environment(Map.of("spring.profiles.active", "local",
                "APP_INTERNAL_SERVICE_TOKEN", "test-only-override")).getProperty("app.internal.service-token"))
                .isEqualTo("test-only-override");
    }

    private StandardEnvironment environment(Map<String, Object> overrides) {
        var environment = new StandardEnvironment();
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().addFirst(new MapPropertySource("test-home",
                Map.of("user.home", home.toString())));
        environment.getPropertySources().addFirst(new MapPropertySource("test-overrides",
                overrides));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);
        return environment;
    }
}

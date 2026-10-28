package com.java.vinod.wallet.service.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApplicationPropertiesTest {
    @Test
    void propertyKeysAreUniqueAcrossDocuments() throws Exception {
        String contents = new ClassPathResource("application.properties").getContentAsString(StandardCharsets.UTF_8);
        Set<String> keys = new HashSet<>();
        for (String line : contents.lines().toList()) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("#") || trimmed.startsWith("!")) {
                continue;
            }
            String key = trimmed.split("[=: \t]", 2)[0];
            assertThat(keys.add(key)).as("Unique property key: %s", key).isTrue();
        }
    }

    @Test
    void standaloneLocalProfileHasPostgresqlDefaults() {
        StandardEnvironment environment = environment(Map.of());

        assertThat(environment.getActiveProfiles()).containsExactly("local");
        assertThat(environment.getProperty("server.port")).isEqualTo("9096");
        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/test2");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("postgres");
        assertThat(environment.getProperty("spring.flyway.locations")).isEqualTo("classpath:db/migration-postgresql");
        assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto")).isEqualTo("validate");
        assertThat(environment.getProperty("app.jwt.issuer"))
                .isEqualTo("http://localhost:9093/authorization-server/api");
        assertThat(environment.getProperty("app.jwt.audience")).isEqualTo("WALLET_API");
        assertThat(environment.getProperty("app.jwt.public-key-base64")).isEmpty();
        assertThat(environment.getProperty("app.jwt.public-key-path")).isEmpty();
        assertThat(environment.getProperty("app.internal.service-token")).isEmpty();
        assertThat(environment.getProperty("app.web.allowed-origin"))
                .isEqualTo("http://localhost:9173,http://localhost:9174");
        assertThat(environment.containsProperty("spring.config.import")).isFalse();
    }

    @Test
    void localEnvironmentValuesOverrideDefaults() {
        StandardEnvironment environment = environment(Map.of(
                "WALLET_DB_URL", "jdbc:postgresql://db.example.test:5432/custom_wallet",
                "WALLET_DB_USERNAME", "wallet_user",
                "WALLET_DB_PASSWORD", "test-only-password",
                "SERVER_PORT", "9196",
                "APP_JWT_PUBLIC_KEY_BASE64", "test-only-encoded-public-key",
                "JWT_PUBLIC_KEY_PATH", "target/public.pem",
                "AUTH_ISSUER_URL", "https://issuer.example.test",
                "JWT_AUDIENCE", "CUSTOM_WALLET",
                "APP_INTERNAL_SERVICE_TOKEN", "test-only-token",
                "SHARITY_WEB_ALLOWED_ORIGIN", "https://web.example.test"));

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://db.example.test:5432/custom_wallet");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("wallet_user");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("test-only-password");
        assertThat(environment.getProperty("server.port")).isEqualTo("9196");
        assertThat(environment.getProperty("app.jwt.public-key-base64")).isEqualTo("test-only-encoded-public-key");
        assertThat(environment.getProperty("app.jwt.public-key-path")).isEqualTo("target/public.pem");
        assertThat(environment.getProperty("app.jwt.issuer")).isEqualTo("https://issuer.example.test");
        assertThat(environment.getProperty("app.jwt.audience")).isEqualTo("CUSTOM_WALLET");
        assertThat(environment.getProperty("app.internal.service-token")).isEqualTo("test-only-token");
        assertThat(environment.getProperty("app.web.allowed-origin")).isEqualTo("https://web.example.test");
    }

    @ParameterizedTest
    @ValueSource(strings = {"qa", "prod"})
    void nonLocalProfilesCannotUseLocalFallbacks(String profile) {
        StandardEnvironment environment = environment(Map.of("SPRING_PROFILES_ACTIVE", profile));

        assertThat(environment.getActiveProfiles()).containsExactly(profile);
        assertThat(environment.getProperty("spring.application.name")).isEqualTo("wallet-service");
        assertThat(environment.getProperty("server.port")).isEqualTo("8086");
        assertThat(environment.getProperty("app.jwt.audience")).isEqualTo("WALLET_API");
        assertThat(environment.getProperty("app.jwt.public-key-base64")).isEmpty();
        assertThat(environment.containsProperty("wallet.local.server-port")).isFalse();
        assertThat(environment.containsProperty("wallet.local.database-url")).isFalse();
        assertThat(environment.containsProperty("wallet.local.database-username")).isFalse();
        assertThat(environment.containsProperty("spring.flyway.locations")).isFalse();
        assertThat(environment.containsProperty("app.jwt.issuer")).isFalse();
        assertThat(environment.containsProperty("app.jwt.public-key-path")).isFalse();
        assertThat(environment.containsProperty("app.internal.service-token")).isFalse();
        assertThat(environment.containsProperty("app.web.allowed-origin")).isFalse();
        assertThatThrownBy(() -> environment.getProperty("spring.datasource.url"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> environment.getProperty("spring.datasource.username"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"qa", "prod"})
    void nonLocalProfilesStillAcceptExplicitDatabaseValues(String profile) {
        StandardEnvironment environment = environment(Map.of(
                "spring.profiles.active", profile,
                "WALLET_DB_URL", "jdbc:vendor://deployment-db/wallet",
                "WALLET_DB_USERNAME", "deployment_user",
                "WALLET_DB_PASSWORD", "test-only-password"));

        assertThat(environment.getProperty("spring.datasource.url")).isEqualTo("jdbc:vendor://deployment-db/wallet");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("deployment_user");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("test-only-password");
    }

    private StandardEnvironment environment(Map<String, Object> overrides) {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().remove(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME);
        environment.getPropertySources().addFirst(new MapPropertySource("test-overrides", overrides));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);
        return environment;
    }
}

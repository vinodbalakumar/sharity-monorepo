package com.java.vinod.wallet.service.config;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Normalizes datasource settings before Spring creates Flyway and JPA beans.
 *
 * Some deployment environments inject placeholder values such as "-" for
 * secrets that are not configured yet. Those values break startup because
 * Flyway attempts to connect immediately. For wallet-service, we fall back to
 * the profile defaults when the datasource values look like placeholders.
 */
public final class DatasourcePropertySanitizerInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    static final String SANITIZED_DATASOURCE_PROPERTIES = "walletServiceSanitizedDatasourceProperties";

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        Map<String, Object> overrides = new HashMap<>();

        if (isQaProfile(environment)) {
            putIfInvalid(overrides, environment, "spring.datasource.url",
                    "jdbc:mysql://localhost:3306/wallet_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
            putIfInvalid(overrides, environment, "spring.datasource.username", "root");
            putIfInvalid(overrides, environment, "spring.datasource.password", "root");
        } else if (isLocalProfile(environment)) {
            putIfInvalid(overrides, environment, "spring.datasource.url", "jdbc:postgresql://localhost:5432/wallet_db");
            putIfInvalid(overrides, environment, "spring.datasource.username", "postgres");
            putIfInvalid(overrides, environment, "spring.datasource.password", "postgres");
        }

        if (!overrides.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(SANITIZED_DATASOURCE_PROPERTIES, overrides));
        }
    }

    private static boolean isQaProfile(ConfigurableEnvironment environment) {
        return environment.acceptsProfiles(org.springframework.core.env.Profiles.of("qa"));
    }

    private static boolean isLocalProfile(ConfigurableEnvironment environment) {
        return environment.acceptsProfiles(org.springframework.core.env.Profiles.of("local"));
    }

    private static void putIfInvalid(Map<String, Object> overrides,
                                     ConfigurableEnvironment environment,
                                     String key,
                                     String fallbackValue) {
        String currentValue = environment.getProperty(key);
        if (isPlaceholder(currentValue)) {
            overrides.put(key, fallbackValue);
        }
    }

    private static boolean isPlaceholder(String value) {
        if (value == null) {
            return true;
        }
        String normalized = value.trim();
        return normalized.isEmpty()
                || "-".equals(normalized)
                || "null".equalsIgnoreCase(normalized)
                || "undefined".equalsIgnoreCase(normalized);
    }
}

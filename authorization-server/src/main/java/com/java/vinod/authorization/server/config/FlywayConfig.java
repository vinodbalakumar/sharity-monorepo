package com.java.vinod.authorization.server.config;

import org.springframework.boot.flyway.autoconfigure.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.jdbc.support.MetaDataAccessException;

@Configuration(proxyBeanMethods = false)
public class FlywayConfig {

    @Bean
    FlywayConfigurationCustomizer databaseMigrationLocations() {
        return configuration -> {
            try {
                String vendor = JdbcUtils.extractDatabaseMetaData(
                        configuration.getDataSource(), metadata -> metadata.getDatabaseProductName());
                configuration.locations(switch (vendor) {
                    case "MySQL" -> "classpath:db/migration";
                    case "PostgreSQL" -> "classpath:db/migration-postgresql";
                    default -> throw new IllegalStateException("Unsupported authorization database: " + vendor);
                });
            } catch (MetaDataAccessException ex) {
                throw new IllegalStateException("Cannot determine authorization database migration location", ex);
            }
        };
    }
}

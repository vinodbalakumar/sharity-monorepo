package com.java.vinod.wallet.service.config;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class DatasourcePropertySanitizerInitializerTest {

    private final DatasourcePropertySanitizerInitializer initializer = new DatasourcePropertySanitizerInitializer();

    @Test
    void replacesPlaceholderDatasourceValuesInQaWithProfileDefaults() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("qa");
        environment.withProperty("spring.datasource.url", "-");
        environment.withProperty("spring.datasource.username", "null");
        environment.withProperty("spring.datasource.password", " ");

        GenericApplicationContext context = new GenericApplicationContext();
        context.setEnvironment(environment);

        initializer.initialize(context);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:mysql://localhost:3306/wallet_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("root");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("root");
        assertThat(environment.getPropertySources().contains(DatasourcePropertySanitizerInitializer.SANITIZED_DATASOURCE_PROPERTIES))
                .isTrue();
    }

    @Test
    void leavesValidDatasourceValuesUntouchedInProd() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        environment.withProperty("spring.datasource.url", "jdbc:postgresql://db.example.com:5432/wallet_db");
        environment.withProperty("spring.datasource.username", "wallet_app");
        environment.withProperty("spring.datasource.password", "secret");

        GenericApplicationContext context = new GenericApplicationContext();
        context.setEnvironment(environment);

        initializer.initialize(context);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://db.example.com:5432/wallet_db");
        assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("wallet_app");
        assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("secret");
        assertThat(environment.getPropertySources().contains(DatasourcePropertySanitizerInitializer.SANITIZED_DATASOURCE_PROPERTIES))
                .isFalse();
    }
}

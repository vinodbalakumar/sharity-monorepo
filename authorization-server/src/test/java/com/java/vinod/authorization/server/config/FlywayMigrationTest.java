package com.java.vinod.authorization.server.config;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.PostgreSQLContainer;

import javax.sql.DataSource;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class FlywayMigrationTest {

    @Test
    void postgresqlMigratesCompleteHistoryAndValidatesOnRestart() throws Exception {
        String url = System.getProperty("test.postgresql.url");
        if (url != null) {
            verifyMigrations(url, System.getProperty("test.postgresql.username", "postgres"),
                    System.getProperty("test.postgresql.password", ""), "classpath:db/migration-postgresql");
            return;
        }
        assumeTrue(DockerClientFactory.instance().isDockerAvailable(), "Docker required for isolated PostgreSQL");
        try (var database = new PostgreSQLContainer<>("postgres:16-alpine")) {
            database.start();
            verifyMigrations(database.getJdbcUrl(), database.getUsername(), database.getPassword(),
                    "classpath:db/migration-postgresql");
        }
    }

    @Test
    void mysqlMigratesUnchangedHistoryAndValidatesOnRestart() throws Exception {
        assumeTrue(DockerClientFactory.instance().isDockerAvailable(), "Docker required for isolated MySQL");
        try (var database = new MySQLContainer<>("mysql:8.0.36")) {
            database.start();
            verifyMigrations(database.getJdbcUrl(), database.getUsername(), database.getPassword(),
                    "classpath:db/migration");
        }
    }

    private void verifyMigrations(String url, String username, String password, String expectedLocation) throws Exception {
        // The optional URL must identify an empty, disposable test database: V27 resets demo identities.
        var dataSource = new DriverManagerDataSource(url, username, password);
        try (var connection = dataSource.getConnection();
             var tables = connection.getMetaData().getTables(
                     connection.getCatalog(), connection.getSchema(), "%", new String[]{"TABLE"})) {
            assertThat(tables.next()).as("Migration tests require an empty disposable database").isFalse();
        }
        new ApplicationContextRunner()
                .withUserConfiguration(FlywayConfig.class)
                .withConfiguration(AutoConfigurations.of(FlywayAutoConfiguration.class))
                .withBean(DataSource.class, () -> dataSource)
                .withPropertyValues("spring.flyway.locations=classpath:db/migration",
                        "spring.flyway.out-of-order=true", "spring.flyway.target=19")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    Flyway bootstrap = context.getBean(Flyway.class);
                    JdbcTemplate jdbc = new JdbcTemplate(dataSource);
                    jdbc.update("""
                            INSERT INTO app_user (public_id, email, normalized_email, status, created_at, updated_at)
                            VALUES ('migration-test', 'vinod@gmail.com', 'vinod@gmail.com', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            """);
                    Flyway sellerSeed = Flyway.configure().configuration(bootstrap.getConfiguration()).target("20").load();
                    sellerSeed.migrate();
                    if (expectedLocation.endsWith("postgresql")) {
                        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM provider_account", Integer.class)).isEqualTo(1);
                        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_role", Integer.class)).isEqualTo(1);
                    }
                    Flyway flyway = Flyway.configure().configuration(bootstrap.getConfiguration()).target("latest").load();
                    flyway.migrate();
                    assertThat(flyway.getConfiguration().getLocations())
                            .extracting(location -> location.getDescriptor()).containsExactly(expectedLocation);
                    assertThat(flyway.info().applied()).hasSize(27);
                    assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("41");
                    flyway.validate();
                    assertThat(flyway.migrate().migrationsExecuted).isZero();
                    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user", Integer.class)).isEqualTo(4);
                    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_role", Integer.class)).isEqualTo(16);
                    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_application_access", Integer.class)).isEqualTo(17);
                    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_module_access", Integer.class)).isEqualTo(11);
                    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM provider_module_enrollment", Integer.class)).isEqualTo(4);
                    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM provider_account WHERE seller_rating IS NOT NULL AND completed_orders IS NOT NULL",
                            Integer.class)).isEqualTo(4);
                    assertThat(jdbc.queryForList("SELECT password_hash FROM user_credential", String.class))
                            .allMatch(hash -> hash.startsWith("{bcrypt}$2a$10$V2NXu4KQ"));
                    var entityManagerFactory = new LocalContainerEntityManagerFactoryBean();
                    entityManagerFactory.setDataSource(dataSource);
                    entityManagerFactory.setPackagesToScan("com.java.vinod.authorization.server.entity");
                    entityManagerFactory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
                    entityManagerFactory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "validate"));
                    try {
                        entityManagerFactory.afterPropertiesSet();
                    } finally {
                        entityManagerFactory.destroy();
                    }
                });
    }
}

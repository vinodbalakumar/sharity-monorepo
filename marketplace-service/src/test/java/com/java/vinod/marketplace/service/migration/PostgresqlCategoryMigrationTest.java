package com.java.vinod.marketplace.service.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Locale;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Replays the PostgreSQL migration chain in a throw-away schema. Uses
 * MARKETPLACE_MIGRATION_TEST_DB_URL (plus _USERNAME/_PASSWORD) when set, otherwise a
 * Testcontainers PostgreSQL instance. Only the schema created by this test is dropped.
 */
@Tag("integration")
class PostgresqlCategoryMigrationTest {

    private static PostgreSQLContainer<?> container;
    private static String url;
    private static String username;
    private static String password;
    private static final String SCHEMA = "mig_it_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

    @BeforeAll
    static void startDatabase() {
        String configuredUrl = System.getenv("MARKETPLACE_MIGRATION_TEST_DB_URL");
        if (configuredUrl != null && !configuredUrl.isBlank()) {
            assumeTrue(!configuredUrl.toLowerCase(Locale.ROOT).contains("marketplace_db"),
                    "Refusing to run migration tests against marketplace_db");
            url = configuredUrl;
            username = System.getenv().getOrDefault("MARKETPLACE_MIGRATION_TEST_DB_USERNAME", "postgres");
            password = System.getenv().getOrDefault("MARKETPLACE_MIGRATION_TEST_DB_PASSWORD", "");
            return;
        }
        assumeTrue(DockerClientFactory.instance().isDockerAvailable(),
                "Docker or MARKETPLACE_MIGRATION_TEST_DB_URL is required");
        container = new PostgreSQLContainer<>("postgres:16-alpine");
        container.start();
        url = container.getJdbcUrl();
        username = container.getUsername();
        password = container.getPassword();
    }

    @AfterAll
    static void dropSchema() throws SQLException {
        if (url != null) {
            try (Connection connection = connect(); Statement statement = connection.createStatement()) {
                statement.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
            }
        }
        if (container != null) {
            container.stop();
        }
    }

    @Test
    void categorySeedAndImageKeyMigrationsApplyAfterExistingCategoriesAndKeepIdentityUsable() throws SQLException {
        flyway("38").migrate();
        // V5/V7 seed non-marketplace verticals at ids 7+; V39 must not reuse those ids.
        assertThat(queryString("SELECT vertical_code FROM category_master WHERE id = 7")).isEqualTo("GROCERY");
        long survivingIds = queryLong("SELECT COUNT(*) FROM category_master WHERE vertical_code NOT IN ('MARKETPLACE', 'JEWELLERY')");

        flyway("39").migrate();
        assertThat(queryLong("SELECT COUNT(*) FROM category_master WHERE vertical_code = 'MARKETPLACE'")).isEqualTo(16);
        assertThat(queryLong("SELECT COUNT(*) FROM category_master WHERE vertical_code = 'JEWELLERY'")).isEqualTo(16);
        assertThat(queryLong("SELECT COUNT(*) FROM category_master WHERE vertical_code NOT IN ('MARKETPLACE', 'JEWELLERY')"))
                .isEqualTo(survivingIds);
        assertThat(queryString("SELECT vertical_code FROM category_master WHERE id = 7")).isEqualTo("GROCERY");

        flyway(null).migrate();
        assertThat(queryLong("SELECT COUNT(*) FROM category_master WHERE image_key IS NULL OR image_key = ''")).isZero();
        assertThat(queryString("SELECT image_key FROM category_master WHERE category_code = 'GAMING'"))
                .isEqualTo("marketplace/gaming");
        assertThat(queryLong("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '" + SCHEMA
                + "' AND column_name = 'image_url' AND table_name IN ('category_master', 'verticals_master', 'listing')"))
                .isZero();

        long maxId = queryLong("SELECT MAX(id) FROM category_master");
        long insertedId = queryLong("INSERT INTO category_master (category_code, category_name, category_slug, vertical_code, "
                + "active, display_order, created_at, updated_at) VALUES ('IT_PROBE', 'Probe', 'it-probe', 'GROCERY', "
                + "TRUE, 99, NOW(), NOW()) RETURNING id");
        assertThat(insertedId).isGreaterThan(maxId);
    }

    private static Flyway flyway(String target) {
        var configuration = Flyway.configure()
                .dataSource(url, username, password)
                .locations("classpath:db/migration-postgresql")
                .schemas(SCHEMA)
                .createSchemas(true);
        if (target != null) {
            configuration.target(target);
        }
        return configuration.load();
    }

    private static Connection connect() throws SQLException {
        Connection connection = DriverManager.getConnection(url, username, password);
        try (Statement statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + SCHEMA);
        }
        return connection;
    }

    private static long queryLong(String sql) throws SQLException {
        try (Connection connection = connect(); Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            assertThat(resultSet.next()).isTrue();
            return resultSet.getLong(1);
        }
    }

    private static String queryString(String sql) throws SQLException {
        try (Connection connection = connect(); Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(sql)) {
            assertThat(resultSet.next()).isTrue();
            return resultSet.getString(1);
        }
    }
}
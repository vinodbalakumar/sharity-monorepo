package com.java.vinod.authorization.server.config;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FlywayConfigTest {

    @Test
    void selectsPostgresqlEvenWhenProfileSpecifiesMysql() throws Exception {
        assertLocation("PostgreSQL", "classpath:db/migration", "classpath:db/migration-postgresql");
    }

    @Test
    void preservesLegacyMysqlLocationEvenWhenProfileSpecifiesPostgresql() throws Exception {
        assertLocation("MySQL", "classpath:db/migration-postgresql", "classpath:db/migration");
    }

    @Test
    void rejectsUnsupportedVendorInsteadOfRunningMysqlScripts() throws Exception {
        var configuration = Flyway.configure().dataSource(dataSource("H2"));
        assertThatThrownBy(() -> new FlywayConfig().databaseMigrationLocations().customize(configuration))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("Unsupported authorization database");
    }

    private void assertLocation(String vendor, String configured, String expected) throws Exception {
        var configuration = Flyway.configure().dataSource(dataSource(vendor)).locations(configured);
        new FlywayConfig().databaseMigrationLocations().customize(configuration);
        assertThat(configuration.getLocations()).extracting(location -> location.getDescriptor())
                .containsExactly(expected);
    }

    private DataSource dataSource(String vendor) throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        DatabaseMetaData metadata = mock(DatabaseMetaData.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.getMetaData()).thenReturn(metadata);
        when(metadata.getDatabaseProductName()).thenReturn(vendor);
        return dataSource;
    }
}

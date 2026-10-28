package com.java.vinod.marketplace.service.config;

import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class QueryTimingDataSourceConfigTest {

    private final SQLException duplicateKey = new SQLException(
            "duplicate key value violates unique constraint \"category_master_pkey\"", "23505");

    @Test
    void statementExecuteRethrowsDriverSqlExceptionUnwrapped() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.execute(anyString())).thenThrow(duplicateKey);

        Statement proxied = wrap(connection).getConnection().createStatement();

        assertThatThrownBy(() -> proxied.execute("INSERT INTO category_master VALUES (7)")).isSameAs(duplicateKey);
    }

    @Test
    void preparedStatementExecuteRethrowsDriverSqlExceptionUnwrapped() throws Exception {
        Connection connection = mock(Connection.class);
        PreparedStatement statement = mock(PreparedStatement.class);
        when(connection.prepareStatement(anyString())).thenReturn(statement);
        when(statement.executeUpdate()).thenThrow(duplicateKey);

        PreparedStatement proxied = wrap(connection).getConnection().prepareStatement("INSERT INTO category_master VALUES (?)");

        assertThatThrownBy(proxied::executeUpdate).isSameAs(duplicateKey);
    }

    @Test
    void connectionAndDataSourceCallsRethrowDriverSqlExceptionUnwrapped() throws Exception {
        Connection connection = mock(Connection.class);
        when(connection.createStatement()).thenThrow(duplicateKey);
        DataSource dataSource = wrap(connection);
        when(unwrapTarget.getLoginTimeout()).thenThrow(duplicateKey);

        Connection proxied = dataSource.getConnection();

        assertThatThrownBy(proxied::createStatement).isSameAs(duplicateKey);
        assertThatThrownBy(dataSource::getLoginTimeout).isSameAs(duplicateKey);
    }

    private DataSource unwrapTarget;

    private DataSource wrap(Connection connection) throws SQLException {
        unwrapTarget = mock(DataSource.class);
        when(unwrapTarget.getConnection()).thenReturn(connection);
        Object wrapped = new QueryTimingDataSourceConfig(false, 500)
                .queryTimingDataSourcePostProcessor()
                .postProcessAfterInitialization(unwrapTarget, "dataSource");
        return (DataSource) wrapped;
    }
}
package com.java.vinod.marketplace.service.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Wraps the application's datasource so slow SQL can be logged without
 * changing repository code. When a SELECT query crosses the configured
 * threshold, the proxy also emits an EXPLAIN statement with the bound values.
 */
@Configuration
public class QueryTimingDataSourceConfig {
    private static final Logger log = LoggerFactory.getLogger(QueryTimingDataSourceConfig.class);
    private final boolean slowQueryLoggingEnabled;
    private final long slowQueryThresholdMs;

    public QueryTimingDataSourceConfig(
            @Value("${app.marketplace.query-slow-logging-enabled:false}") boolean slowQueryLoggingEnabled,
            @Value("${app.marketplace.query-slow-query-threshold-ms:500}") long slowQueryThresholdMs) {
        this.slowQueryLoggingEnabled = slowQueryLoggingEnabled;
        this.slowQueryThresholdMs = slowQueryThresholdMs;
    }

    @Bean
    BeanPostProcessor queryTimingDataSourcePostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (!(bean instanceof DataSource dataSource)) {
                    return bean;
                }
                if (Proxy.isProxyClass(bean.getClass())) {
                    return bean;
                }
                return Proxy.newProxyInstance(
                        bean.getClass().getClassLoader(),
                        new Class<?>[]{DataSource.class},
                        new TimingDataSourceHandler(dataSource, slowQueryLoggingEnabled, slowQueryThresholdMs));
            }
        };
    }

    private static final class TimingDataSourceHandler implements InvocationHandler {
        private final DataSource delegate;
        private final boolean slowQueryLoggingEnabled;
        private final long slowQueryThresholdMs;

        private TimingDataSourceHandler(DataSource delegate, boolean slowQueryLoggingEnabled, long slowQueryThresholdMs) {
            this.delegate = delegate;
            this.slowQueryLoggingEnabled = slowQueryLoggingEnabled;
            this.slowQueryThresholdMs = slowQueryThresholdMs;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();
            if ("getConnection".equals(name)) {
                Connection connection = args == null || args.length == 0
                        ? delegate.getConnection()
                        : delegate.getConnection((String) args[0], (String) args[1]);
                return Proxy.newProxyInstance(
                        connection.getClass().getClassLoader(),
                        new Class<?>[]{Connection.class},
                        new TimingConnectionHandler(delegate, connection, slowQueryLoggingEnabled, slowQueryThresholdMs));
            }
            return invokeDelegate(method, delegate, args);
        }
    }

    private static final class TimingConnectionHandler implements InvocationHandler {
        private final DataSource delegateDataSource;
        private final Connection delegate;
        private final boolean slowQueryLoggingEnabled;
        private final long slowQueryThresholdMs;

        private TimingConnectionHandler(DataSource delegateDataSource, Connection delegate,
                                        boolean slowQueryLoggingEnabled, long slowQueryThresholdMs) {
            this.delegateDataSource = delegateDataSource;
            this.delegate = delegate;
            this.slowQueryLoggingEnabled = slowQueryLoggingEnabled;
            this.slowQueryThresholdMs = slowQueryThresholdMs;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();
            if ("prepareStatement".equals(name) && args != null && args.length > 0 && args[0] instanceof String sql) {
                PreparedStatement statement = (PreparedStatement) invokeDelegate(method, delegate, args);
                return Proxy.newProxyInstance(
                        statement.getClass().getClassLoader(),
                        new Class<?>[]{PreparedStatement.class},
                        new TimingPreparedStatementHandler(delegateDataSource, statement, sql, slowQueryLoggingEnabled, slowQueryThresholdMs));
            }
            if ("createStatement".equals(name)) {
                Statement statement = (Statement) invokeDelegate(method, delegate, args);
                return Proxy.newProxyInstance(
                        statement.getClass().getClassLoader(),
                        new Class<?>[]{Statement.class},
                        new TimingStatementHandler(delegateDataSource, statement, slowQueryLoggingEnabled, slowQueryThresholdMs));
            }
            return invokeDelegate(method, delegate, args);
        }
    }

    private static final class TimingStatementHandler implements InvocationHandler {
        private final DataSource delegateDataSource;
        private final Statement delegate;
        private final boolean slowQueryLoggingEnabled;
        private final long slowQueryThresholdMs;

        private TimingStatementHandler(DataSource delegateDataSource, Statement delegate,
                                       boolean slowQueryLoggingEnabled, long slowQueryThresholdMs) {
            this.delegateDataSource = delegateDataSource;
            this.delegate = delegate;
            this.slowQueryLoggingEnabled = slowQueryLoggingEnabled;
            this.slowQueryThresholdMs = slowQueryThresholdMs;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();
            if (name.startsWith("execute")) {
                String sql = args != null && args.length > 0 && args[0] instanceof String statementSql
                        ? statementSql
                        : safeSql(delegate.toString());
                long startedAt = System.nanoTime();
                try {
                    return invokeDelegate(method, delegate, args);
                } finally {
                    long elapsedMs = toMillis(System.nanoTime() - startedAt);
                    if (slowQueryLoggingEnabled && elapsedMs >= slowQueryThresholdMs) {
                        log.warn("Slow SQL statement: elapsedMs={}, sql={}", elapsedMs, sql);
                        maybeExplain(delegateDataSource, sql, elapsedMs);
                    }
                }
            }
            return invokeDelegate(method, delegate, args);
        }
    }

    private static final class TimingPreparedStatementHandler implements InvocationHandler {
        private final DataSource delegateDataSource;
        private final PreparedStatement delegate;
        private final String sql;
        private final boolean slowQueryLoggingEnabled;
        private final long slowQueryThresholdMs;
        private final Map<Integer, Object> parameters = new LinkedHashMap<>();

        private TimingPreparedStatementHandler(DataSource delegateDataSource, PreparedStatement delegate, String sql,
                                               boolean slowQueryLoggingEnabled, long slowQueryThresholdMs) {
            this.delegateDataSource = delegateDataSource;
            this.delegate = delegate;
            this.sql = sql;
            this.slowQueryLoggingEnabled = slowQueryLoggingEnabled;
            this.slowQueryThresholdMs = slowQueryThresholdMs;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            String name = method.getName();
            if ("setNull".equals(name) && args != null && args.length >= 2 && args[0] instanceof Integer index) {
                parameters.put(index, null);
                return invokeDelegate(method, delegate, args);
            }
            if (name.startsWith("set") && args != null && args.length >= 2 && args[0] instanceof Integer index) {
                parameters.put(index, normalizeParameter(args[1]));
                return invokeDelegate(method, delegate, args);
            }
            if ("clearParameters".equals(name)) {
                parameters.clear();
                return invokeDelegate(method, delegate, args);
            }
            if (name.startsWith("execute")) {
                long startedAt = System.nanoTime();
                try {
                    return invokeDelegate(method, delegate, args);
                } finally {
                    long elapsedMs = toMillis(System.nanoTime() - startedAt);
                    if (slowQueryLoggingEnabled && elapsedMs >= slowQueryThresholdMs) {
                        String renderedSql = renderSql(sql, parameters);
                        log.warn("Slow SQL query: elapsedMs={}, sql={}, params={}", elapsedMs, renderedSql, parameters.values());
                        maybeExplain(delegateDataSource, renderedSql, elapsedMs);
                    }
                }
            }
            return invokeDelegate(method, delegate, args);
        }
    }

    /**
     * Reflective calls wrap driver failures in InvocationTargetException; rethrow the original
     * SQLException so the proxy does not surface it as an UndeclaredThrowableException.
     */
    private static Object invokeDelegate(Method method, Object delegate, Object[] args) throws Throwable {
        try {
            return method.invoke(delegate, args);
        } catch (InvocationTargetException exception) {
            Throwable cause = exception.getCause();
            throw cause != null ? cause : exception;
        }
    }
    private static long toMillis(long nanos) {
        return nanos / 1_000_000L;
    }

    private static void maybeExplain(DataSource dataSource, String sql, long elapsedMs) {
        if (sql == null) {
            return;
        }
        String trimmed = sql.trim();
        if (!trimmed.regionMatches(true, 0, "select", 0, 6)) {
            return;
        }
        String explainSql = "EXPLAIN " + trimmed;
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement();
             java.sql.ResultSet resultSet = statement.executeQuery(explainSql)) {
            List<String> rows = new ArrayList<>();
            java.sql.ResultSetMetaData metaData = resultSet.getMetaData();
            int columnCount = metaData.getColumnCount();
            while (resultSet.next()) {
                StringBuilder row = new StringBuilder();
                for (int i = 1; i <= columnCount; i++) {
                    if (i > 1) {
                        row.append(" | ");
                    }
                    row.append(metaData.getColumnLabel(i)).append('=').append(resultSet.getString(i));
                }
                rows.add(row.toString());
            }
            log.warn("Slow query EXPLAIN (elapsedMs={}): {}", elapsedMs, rows);
        } catch (Exception exception) {
            log.warn("Unable to EXPLAIN slow query: sql={}, error={}", sql, exception.toString());
        }
    }

    private static Object normalizeParameter(Object value) {
        if (value instanceof Date date) {
            return date.toLocalDate();
        }
        if (value instanceof Time time) {
            return time.toLocalTime();
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime();
        }
        return value;
    }

    private static String renderSql(String sql, Map<Integer, Object> parameters) {
        if (sql == null || sql.isBlank() || parameters.isEmpty()) {
            return sql;
        }
        StringBuilder rendered = new StringBuilder();
        int parameterIndex = 1;
        for (int i = 0; i < sql.length(); i++) {
            char character = sql.charAt(i);
            if (character == '?' && parameters.containsKey(parameterIndex)) {
                rendered.append(formatParameter(parameters.get(parameterIndex++)));
            } else {
                rendered.append(character);
            }
        }
        return rendered.toString();
    }

    private static String formatParameter(Object value) {
        if (value == null) {
            return "NULL";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }
        if (value instanceof LocalDate localDate) {
            return "'" + localDate + "'";
        }
        if (value instanceof LocalDateTime localDateTime) {
            return "'" + localDateTime + "'";
        }
        if (value instanceof LocalTime localTime) {
            return "'" + localTime + "'";
        }
        if (value instanceof BigDecimal bigDecimal) {
            return bigDecimal.toPlainString();
        }
        return "'" + value.toString().replace("'", "''") + "'";
    }

    private static String safeSql(String sql) {
        return Objects.toString(sql, "");
    }
}

package com.java.vinod.wallet.service.entity;

import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.persister.entity.AbstractEntityPersister;
import org.hibernate.type.BasicType;
import org.hibernate.type.SqlTypes;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class WalletEventInboxMappingTest {
    @ParameterizedTest
    @ValueSource(strings = {"org.hibernate.dialect.PostgreSQLDialect", "org.hibernate.dialect.MySQLDialect"})
    void payloadUsesJsonJdbcBinding(String dialect) {
        var registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.dialect", dialect)
                .applySetting("hibernate.boot.allow_jdbc_metadata_access", false)
                .build();
        try (var factory = new MetadataSources(registry)
                .addAnnotatedClass(WalletEventInbox.class)
                .buildMetadata().buildSessionFactory()) {
            var implementation = factory.unwrap(SessionFactoryImplementor.class);
            var persister = (AbstractEntityPersister) implementation.getMappingMetamodel()
                    .getEntityDescriptor(WalletEventInbox.class);
            var jdbcType = ((BasicType<?>) persister.getPropertyType("payloadJson")).getJdbcType();

            assertThat(jdbcType.getDefaultSqlTypeCode()).isEqualTo(SqlTypes.JSON);
            assertThat(jdbcType.isString()).isFalse();
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}

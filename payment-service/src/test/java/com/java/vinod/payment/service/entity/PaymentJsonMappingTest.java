package com.java.vinod.payment.service.entity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.persister.entity.AbstractEntityPersister;
import org.hibernate.type.SqlTypes;
import org.hibernate.type.descriptor.jdbc.JdbcType;
import org.hibernate.type.BasicType;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentJsonMappingTest {
    @Test
    void jsonPayloadsUseJsonJdbcBindingAndRoundTripAsObjects() throws Exception {
        var registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.connection.url", "jdbc:h2:mem:payment-json-" + UUID.randomUUID())
                .applySetting("hibernate.hbm2ddl.auto", "create-drop")
                .build();
        try (var factory = new MetadataSources(registry)
                .addAnnotatedClass(PaymentEventOutbox.class)
                .addAnnotatedClass(PaymentWebhookEvent.class)
                .buildMetadata().buildSessionFactory()) {
            var implementation = factory.unwrap(SessionFactoryImplementor.class);
            for (Class<?> entity : new Class<?>[]{PaymentEventOutbox.class, PaymentWebhookEvent.class}) {
                var persister = (AbstractEntityPersister) implementation.getMappingMetamodel()
                        .getEntityDescriptor(entity);
                JdbcType jdbcType = ((BasicType<?>) persister.getPropertyType("payloadJson")).getJdbcType();
                assertThat(jdbcType.getDefaultSqlTypeCode()).isEqualTo(SqlTypes.JSON);
            }

            String payload = "{\"eventType\":\"payment-captured\",\"amount\":12.50}";
            var outbox = new PaymentEventOutbox();
            outbox.setEventId(UUID.randomUUID().toString());
            outbox.setEventType("payment-captured");
            outbox.setAggregatePublicId(UUID.randomUUID().toString());
            outbox.setPayloadJson(payload);
            outbox.setProcessingStatus("PENDING");
            outbox.setCreatedAt(LocalDateTime.now());
            var webhook = new PaymentWebhookEvent();
            webhook.setPaymentProvider("mock");
            webhook.setProviderEventId(UUID.randomUUID().toString());
            webhook.setEventType("payment-captured");
            webhook.setPayloadJson(payload);
            webhook.setProcessingStatus("PENDING");
            webhook.setReceivedAt(LocalDateTime.now());

            factory.inTransaction(session -> {
                session.persist(outbox);
                session.persist(webhook);
            });
            try (var session = factory.openSession()) {
                var mapper = new ObjectMapper();
                assertThat(mapper.readTree(session.find(PaymentEventOutbox.class, outbox.getId()).getPayloadJson()))
                        .isEqualTo(mapper.readTree(payload));
                assertThat(mapper.readTree(session.find(PaymentWebhookEvent.class, webhook.getId()).getPayloadJson()))
                        .isEqualTo(mapper.readTree(payload));
            }
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}

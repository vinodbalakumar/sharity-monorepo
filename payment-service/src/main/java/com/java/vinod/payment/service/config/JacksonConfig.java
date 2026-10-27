package com.java.vinod.payment.service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Provides the JSON mapper used by payment outbox serialization and deserialization.
 *
 * <p>The payment event outbox persists compact JSON payloads before dispatching them to
 * wallet-service, so the application must publish a shared {@link ObjectMapper} bean at
 * runtime. This bean is safe because it only handles structured event payloads and does
 * not alter any payment business rules.</p>
 */
@Configuration
public class JacksonConfig {

    /**
     * Supplies the Jackson mapper used by the outbox dispatcher.
     *
     * <p>The dispatcher serializes durable payment event payloads and later reads them
     * back during retry processing. We keep the mapper centralized so the outbox code
     * can work in both tests and the production container without relying on implicit
     * auto-configuration behavior.</p>
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }
}

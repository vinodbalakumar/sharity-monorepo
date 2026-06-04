package com.java.vinod.marketplace.service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Provides the JSON mapper used by marketplace outbox serialization and deserialization.
 *
 * <p>The marketplace event outbox persists compact command payloads before dispatching
 * them to payment-service, so the application must expose a shared {@link ObjectMapper}
 * bean at runtime. This is an infrastructure helper and does not change marketplace
 * listing or order behavior.</p>
 */
@Configuration
public class JacksonConfig {

    /**
     * Supplies the Jackson mapper used by the marketplace outbox dispatcher.
     *
     * <p>The dispatcher serializes durable payment command payloads and later reads them
     * back during retry processing. Centralizing the mapper keeps the service startup
     * deterministic in Docker and in tests.</p>
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }
}
